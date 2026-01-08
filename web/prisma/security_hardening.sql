-- =============================================================================
-- SECURITY HARDENING (Manual Application)
-- =============================================================================

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
