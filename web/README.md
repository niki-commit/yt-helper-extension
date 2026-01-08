# Launch Product Architecture & Contracts

## 1. Database Schema (Prisma)

We use a **Hybrid Schema** where:

- **Prisma** manages table definitions (`schema.prisma`).
- **Manual SQL** manages RLS, Triggers, and Functions (`prisma/manual_migrations.sql`).

**Key Models:**

- `User` & `Account`: Identity & Billing root.
- `Note`: The core data unit. Has `approx_size_bytes` (BigInt) for deterministic quotas.
- `Attachment`: Files associated with notes. **Must have `account_id`** for fast accounting.

## 2. Transactional Contracts (CRITICAL)

### Quota Reservation

**RULE:** You must NEVER write to `Notes` or `Attachments` without first reserving quota.

**The Contract:**
All batch writes must happen inside a **Single Database Transaction** that follows this pattern:

```typescript
await prisma.$transaction(async (tx) => {
  // 1. Reserve Quota (Locks the Account Row)
  const [success, used, allowed] = await tx.$queryRaw`
    SELECT * FROM check_quota_and_apply_batch(${accountId}, ${newBytes}, ${freedBytes})
  `;

  if (!success) throw new Error("QUOTA_EXCEEDED");

  // 2. Perform Writes (Must be in same tx!)
  await tx.note.create({ ... });

  // 3. If any write fails, the entire transaction (including reservation) rolls back.
});
```

## 3. Storage Accounting

- **Triggers:** `update_storage_usage` runs on every INSERT/UPDATE/DELETE.
- **Null Safety:** We use `COALESCE` to strictly handle missing sizes.
- **Reconciliation:** A nightly job `reconcile_storage_usage` recalculates totals from scratch to fix any drift.

## 4. Security (RLS)

- All tables have RLS enabled.
- `current_account_id()` is the single source of truth for scope.
- **Permissions:** Helper functions are restricted:
  - `check_quota_and_apply_batch`: `authenticated`, `service_role`
  - `reconcile_storage_usage`: `service_role` ONLY

### Manual Security Hardening

Prisma Migrations do not support `GRANT` statements for Supabase roles easily (Shadow DB issues).
We manually apply the following permissions via `npx prisma db execute --file prisma/security_hardening.sql`:

```sql
REVOKE ALL ON FUNCTION public.current_account_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_account_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.check_quota_and_apply_batch(uuid, bigint, bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_quota_and_apply_batch(uuid, bigint, bigint) TO authenticated, service_role;
-- (See prisma/security_hardening.sql for full list)
```
