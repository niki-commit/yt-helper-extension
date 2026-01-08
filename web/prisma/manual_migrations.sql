-- =============================================================================
-- 1. Helper Functions
-- =============================================================================

-- Helper to get the current account ID based on the authenticated user.
-- Assumes Supabase Auth.
CREATE OR REPLACE FUNCTION public.current_account_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT primary_account_id FROM public.users WHERE id = auth.uid();
$$;

-- =============================================================================
-- 2. Row Level Security (RLS) Policies
-- =============================================================================

-- Accounts: Users can only see their own account.
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own account"
ON accounts FOR SELECT
USING (id = current_account_id());

-- Notes: Strictly scoped to account_id
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
ON notes FOR SELECT
USING (account_id = current_account_id());

CREATE POLICY "Users can insert own notes"
ON notes FOR INSERT
WITH CHECK (account_id = current_account_id());

CREATE POLICY "Users can update own notes"
ON notes FOR UPDATE
USING (account_id = current_account_id());

CREATE POLICY "Users can delete own notes"
ON notes FOR DELETE
USING (account_id = current_account_id());

-- Attachments: Strictly scoped to account_id (New RLS policy for the new column)
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attachments"
ON attachments FOR SELECT
USING (account_id = current_account_id());

CREATE POLICY "Users can insert own attachments"
ON attachments FOR INSERT
WITH CHECK (account_id = current_account_id());

CREATE POLICY "Users can update own attachments"
ON attachments FOR UPDATE
USING (account_id = current_account_id());

CREATE POLICY "Users can delete own attachments"
ON attachments FOR DELETE
USING (account_id = current_account_id());

-- Migration Jobs
ALTER TABLE migration_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jobs"
ON migration_jobs FOR SELECT
USING (account_id = current_account_id());

-- (Repeat similar policies for usage_records, etc.)

-- =============================================================================
-- 3. Triggers for Automatic Account Creation (Auth Integration)
-- =============================================================================

-- Creates a User and a Default Account when a new user signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_account_id uuid;
  starter_plan_id text := 'starter_monthly'; -- Adjust default plan ID
BEGIN
  -- 1. Create the Account first
  INSERT INTO public.accounts (plan_id, display_name)
  VALUES (starter_plan_id, NEW.raw_user_meta_data->>'full_name')
  RETURNING id INTO new_account_id;

  -- 2. Create the User link
  INSERT INTO public.users (id, email, primary_account_id)
  VALUES (NEW.id, NEW.email, new_account_id);

  RETURN NEW;
END;
$$;

-- Bind the trigger to Supabase auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- 4. Triggers for Storage Accounting (Single Row & Updates)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_storage_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_size bigint := 0;
  new_size bigint := 0;
  delta bigint := 0;
  account_id_val uuid;
BEGIN
  -- Determine table and compute sizes safely (coalesce to 0)
  IF (TG_TABLE_NAME = 'notes') THEN
    IF (TG_OP = 'INSERT') THEN
      new_size := COALESCE(NEW.approx_size_bytes, COALESCE(octet_length(NEW.content), 0) + COALESCE(octet_length(NEW.metadata::text), 0));
      account_id_val := NEW.account_id;
      delta := new_size;
    ELSIF (TG_OP = 'DELETE') THEN
      old_size := COALESCE(OLD.approx_size_bytes, COALESCE(octet_length(OLD.content), 0) + COALESCE(octet_length(OLD.metadata::text), 0));
      account_id_val := OLD.account_id;
      delta := -old_size;
    ELSIF (TG_OP = 'UPDATE') THEN
      old_size := COALESCE(OLD.approx_size_bytes, COALESCE(octet_length(OLD.content), 0) + COALESCE(octet_length(OLD.metadata::text), 0));
      new_size := COALESCE(NEW.approx_size_bytes, COALESCE(octet_length(NEW.content), 0) + COALESCE(octet_length(NEW.metadata::text), 0));
      account_id_val := NEW.account_id;
      delta := new_size - old_size;
    END IF;

  ELSIF (TG_TABLE_NAME = 'attachments') THEN
    -- Much simpler now that we have account_id!
    IF (TG_OP = 'INSERT') THEN
      new_size := COALESCE(NEW.size_bytes, 0);
      account_id_val := NEW.account_id; 
      delta := new_size;
    ELSIF (TG_OP = 'DELETE') THEN
      old_size := COALESCE(OLD.size_bytes, 0);
      account_id_val := OLD.account_id;
      delta := -old_size;
    ELSIF (TG_OP = 'UPDATE') THEN
      old_size := COALESCE(OLD.size_bytes, 0);
      new_size := COALESCE(NEW.size_bytes, 0);
      account_id_val := NEW.account_id;
      delta := new_size - old_size;
    END IF;

  ELSE
    RETURN NULL;
  END IF;

  -- Apply delta atomically
  IF delta <> 0 AND account_id_val IS NOT NULL THEN
    UPDATE public.accounts
    SET storage_used_bytes = GREATEST(0, COALESCE(storage_used_bytes,0) + delta)
    WHERE id = account_id_val;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_storage_usage_notes ON public.notes;
CREATE TRIGGER update_storage_usage_notes
AFTER INSERT OR UPDATE OR DELETE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.update_storage_usage();

DROP TRIGGER IF EXISTS update_storage_usage_attachments ON public.attachments;
CREATE TRIGGER update_storage_usage_attachments
AFTER INSERT OR UPDATE OR DELETE ON public.attachments
FOR EACH ROW EXECUTE FUNCTION public.update_storage_usage();


-- =============================================================================
-- 5. Transactional Quota Check (Batch Sync Safety with Reservation)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_quota_and_apply_batch(
  target_account_id uuid,
  new_bytes bigint,
  freed_bytes bigint
)
RETURNS TABLE (success boolean, used bigint, allowed bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_used bigint;
  limit_bytes bigint;
  projected bigint;
BEGIN
  -- 1. Lock the account row to serialize checks
  SELECT COALESCE(storage_used_bytes,0), COALESCE(quota_bytes,0)
    INTO current_used, limit_bytes
  FROM public.accounts
  WHERE id = target_account_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ACCOUNT_NOT_FOUND: %', target_account_id;
  END IF;

  projected := current_used + COALESCE(new_bytes,0) - COALESCE(freed_bytes,0);

  IF projected <= limit_bytes THEN
    -- Reserve the capacity immediately so concurrent callers see the update
    UPDATE public.accounts
      SET storage_used_bytes = projected
      WHERE id = target_account_id;

    success := true;
    used := projected;
    allowed := limit_bytes - projected;
    RETURN NEXT;
  ELSE
    success := false;
    used := current_used;
    allowed := limit_bytes - current_used;
    RETURN NEXT;
  END IF;
END;
$$;

-- =============================================================================
-- 6. Replication / Safety Net Job (Improved with direct joins)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.reconcile_storage_usage(p_account_id uuid DEFAULT NULL)
RETURNS TABLE(account_id uuid, old_storage bigint, recalculated bigint, diff bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_recalc bigint;
  v_old bigint;
BEGIN
  FOR r IN
    SELECT id FROM public.accounts
    WHERE (p_account_id IS NULL OR id = p_account_id)
  LOOP
    -- Deterministic stored sizes from approx_size_bytes OR octet_length fallback
    SELECT COALESCE(SUM(COALESCE(n.approx_size_bytes, octet_length(n.content) + octet_length(n.metadata::text))), 0) INTO v_recalc
    FROM public.notes n WHERE n.account_id = r.id;

    -- Add attachments (Simplified Query now that we have account_id!)
    SELECT v_recalc + COALESCE(SUM(a.size_bytes),0) INTO v_recalc
    FROM public.attachments a 
    WHERE a.account_id = r.id;

    SELECT storage_used_bytes INTO v_old FROM public.accounts WHERE id = r.id;

    IF v_old IS NULL THEN v_old := 0; END IF;

    IF v_recalc IS DISTINCT FROM v_old THEN
      UPDATE public.accounts SET storage_used_bytes = v_recalc WHERE id = r.id;
      
      INSERT INTO public.audit_logs (actor_id, account_id, action, details, created_at)
      -- System UUID or NULL for actor
      VALUES (NULL, r.id, 'reconcile_storage_adjust', jsonb_build_object('old', v_old, 'new', v_recalc, 'account', r.id), now());
    END IF;

    account_id := r.id;
    old_storage := v_old;
    recalculated := v_recalc;
    diff := v_recalc - v_old;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- =============================================================================
-- 7. Permissions & Security Hardening (DISABLED FOR MIGRATION STABILITY)
-- =============================================================================

/*
-- NOTE: These permissions are applied manually via 'prisma/security_hardening.sql'
-- to avoid Shadow Database validation errors in Prisma.

-- Ensure strict access control for our SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.current_account_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_account_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role; -- Trigger only

REVOKE ALL ON FUNCTION public.update_storage_usage() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_storage_usage() TO service_role; -- Trigger only

REVOKE ALL ON FUNCTION public.check_quota_and_apply_batch(uuid, bigint, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_quota_and_apply_batch(uuid, bigint, bigint) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.reconcile_storage_usage(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reconcile_storage_usage(uuid) TO service_role; -- Admin/System only
*/

