# Multi-Tenant Upgrade – Database Migration Strategy

## Objectives

- Introduce a **platform-level multi-tenant architecture** without disrupting existing school workflows.
- Enable a **Super Duper Admin (platform owner)** to manage schools, subscriptions, billing, analytics, and system-wide configuration.
- Reuse existing tables wherever possible; only add new tables/columns when we cannot express the requirement through current structures.
- Ensure every change is **backwards-compatible**, wrapped in transactions, and documented with rollback guidance.

---

## Current Schema Baseline (Key Entities)

| Domain | Existing Tables/Notes |
| ------ | --------------------- |
| Ownership | `owners` (multi-school owners), `schools`, `users` (role enum currently tops out at `SUPER_ADMIN`) |
| School Isolation | `schoolId` required on 48+ domain tables; soft deletes via `deletedAt`; comprehensive indexes already in place |
| RBAC | Wide set of tables (`roles`, `permissions`, `role_permissions`, etc.) that already support owner-wide scopes |
| Analytics | Aggregations spread across controllers using Prisma + MySQL |

We will preserve these foundations and extend them.

---

## New Tables

### 1. `packages`

Purpose: Define subscription packages with flexible feature toggles.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `BigInt` (PK) | Prisma `@id @default(autoincrement())` |
| `uuid` | `String` | `@unique @default(uuid())` for external references |
| `name` | `String(100)` | Unique package name |
| `description` | `String?` | Optional marketing copy |
| `priceMonthly` | `Decimal(10,2)` | Monthly price |
| `priceYearly` | `Decimal(10,2)` | Yearly price |
| `isActive` | `Boolean` | `default(true)` |
| `features` | `Json` | Stores feature limits (`max_schools`, etc.) |
| `supportLevel` | `String(50)` | Normalized for UI badges |
| `createdBy` | `BigInt?` | FK → `users.id`, nullable for seed data |
| `createdAt`/`updatedAt` | `DateTime` | `default(now())` / `@updatedAt` |

Indexes: `[name]`, `[isActive]`, `[supportLevel]`.

### 2. `school_subscriptions`

Purpose: Track each school’s subscription lifecycle and usage.

| Column | Type | Notes |
| ------ | ---- | ----- |
| `id` | `BigInt` PK |
| `uuid` | `String` unique |
| `schoolId` | `BigInt` FK → `schools.id` |
| `packageId` | `BigInt` FK → `packages.id` |
| `status` | `Enum` | New Prisma enum `SubscriptionStatus` (`ACTIVE`, `SUSPENDED`, `CANCELLED`, `EXPIRED`) |
| `startedAt` / `expiresAt` | `DateTime` | Nullable during setup |
| `autoRenew` | `Boolean` | Default `false` |
| `currentUsage` | `Json` | Mirrors requested structure |
| `paymentStatus` | `String(30)` | (e.g., `PAID`, `PENDING`) |
| `lastPaymentDate` | `DateTime?` | |
| `createdAt` / `updatedAt` | `DateTime` | Standard audit fields |

Indexes: `[schoolId]`, `[packageId]`, `[status]`, `[expiresAt]`.

Relationships: `school_subscriptions` ↔ `schools` (1:N) – a school can have a history of subscriptions; latest links via `schools.subscriptionId`.

### 3. `subscription_audit_logs` (Optional / Stretch)

If we need fine-grained history beyond `audit_logs`, we can introduce this later. Initially we will record subscription events inside the existing `audit_logs` table with `entityType = 'SUBSCRIPTION'`.

---

## Changes to Existing Tables/Enums

### `schools`

- **Add columns**:
  - `subscriptionId BigInt?` → FK to `school_subscriptions.id` (nullable; populated post-migration).
  - `superAdminUserId BigInt?` → FK to `users.id` (points to SCHOOL_SUPER_ADMIN).
  - `settings Json?` → tenant-specific configuration.
  - `tenantId String? @unique` → new tenant discriminator (defaults from existing `uuid` during migration).
- **Extend enum** `SchoolStatus`: add `DEACTIVATED` to satisfy requirement without overloading existing values.
- **Indexes**:
  - `[subscriptionId]` (foreign key index).
  - `[tenantId]` (unique, for quick tenant lookup).

### `users`

- Extend `UserRole` enum to include `SUPER_DUPER_ADMIN`.
- Ensure `role` remains compatible with existing logic (`authorizeRoles`, etc.).
- No schema change needed for columns; we will create at least one `SUPER_DUPER_ADMIN` seed user tied to the platform.

### `owners`

- No schema change required. We will map individual schools to existing owners or allow `SUPER_DUPER_ADMIN` to create owners as needed.

### `audit_logs`

- No schema change. We will leverage existing structure to log all Super Duper Admin actions. Consider adding `tenantId` context via application layer.

### Prisma Enums

- `UserRole`: add `SUPER_DUPER_ADMIN`.
- Create new `SubscriptionStatus` enum (for `school_subscriptions.status`).
- Optionally add `PackageSupportLevel` enum, or normalize as strings (initial approach: keep strings for flexibility).

---

## Migration Ordering & Safety

1. **Create new enums** (`SubscriptionStatus`, `SUPER_DUPER_ADMIN` addition).
2. **Add new tables** (`packages`, `school_subscriptions`) with foreign keys referencing existing tables (nullable FKs to avoid lock issues).
3. **Alter `schools` table**:
   - Add nullable columns first (no defaults to avoid table copy).
   - Backfill `tenantId` with existing `uuid`.
   - Create unique index on `tenantId` after backfill.
   - Leave `subscriptionId`/`superAdminUserId` null until seeding runs.
4. **Seed base data** (scripts not part of migration, but run post-migrate):
   - Insert default packages (`Starter`, `Professional`, `Enterprise`).
   - Insert primary `SUPER_DUPER_ADMIN` user (role update required).
   - Assign default package/subscription to existing schools.
5. **Update constraints**:
   - Add foreign key from `schools.subscriptionId` to `school_subscriptions.id`.
   - Add foreign key from `schools.superAdminUserId` to `users.id`.

Each step will execute inside Prisma migration transactions (MySQL: implicit). We will test on staging data set before production deploy.

---

## Data Backfill Strategy

1. **tenantId**
   - For existing rows: `UPDATE schools SET tenantId = uuid WHERE tenantId IS NULL;`.
   - Future rows: application layer uses `uuid` to derive tenant automatically.
2. **subscriptionId**
   - After seeding initial packages, create a default subscription per school with `status = 'ACTIVE'`, plan `Starter`, `startedAt = NOW()`, `expiresAt = DATE_ADD(NOW(), INTERVAL 30 DAY)`.
   - Update `schools.subscriptionId` to reference the newly created subscription.
3. **superAdminUserId**
   - Map to the primary SCHOOL_SUPER_ADMIN for each school if data exists.
   - Leave null for now if we cannot deduce automatically; UI will prompt Super Duper Admin to assign after rollout.
4. **currentUsage JSON**
   - Populate using existing aggregate queries (students count, etc.) during subscription creation.

---

## Rollback Plan

For each migration:
1. Drop foreign keys referencing new tables (`ALTER TABLE schools DROP FOREIGN KEY ...`).
2. Remove new columns (`ALTER TABLE schools DROP COLUMN subscriptionId`, etc.).
3. Drop new tables (`DROP TABLE school_subscriptions`, `DROP TABLE packages`).
4. Restore enums (remove `SUPER_DUPER_ADMIN`, `SubscriptionStatus`) — requires Prisma migration to revert.

Recommendation: snapshot database before the upgrade; provide SQL scripts in `/scripts/rollback/` for quick execution.

---

## Compatibility Considerations

- **Existing Prisma Client Instances**: after enum changes, regenerate client so all services pick up new role/status values.
- **Legacy Controllers**: ensure they tolerate `schools.subscriptionId` being null during transition (code must guard accordingly).
- **Raw SQL Services**: inventory services that query `schools` to include new columns if they use `SELECT *`.
- **Index Creation**: run during low-traffic window to avoid table locking.
- **MySQL vs PostgreSQL**: current datasource is MySQL; scripts will target MySQL 8+ (JSON, generated columns supported).

---

## Deliverables from Migration Phase

- Prisma migration files:
  - `XXXX_add_packages_and_subscriptions`
  - `XXXX_extend_school_for_multi_tenancy`
  - `XXXX_extend_user_role_enum`
- Seed scripts:
  - `seed/packages.seed.ts`
  - `seed/super-duper-admin.seed.ts`
  - `scripts/backfill-school-subscriptions.ts`
- SQL validation scripts (post-migration checks):
  - Count subscriptions per school.
  - Verify tenantId uniqueness.
  - Ensure package references resolve.

---

## Next Steps

1. Finalize enum names and column definitions in Prisma schema.
2. Draft Prisma migration files following the sequence above.
3. Prepare seed/backfill scripts.
4. Update documentation and ERD after the schema changes land.

This strategy keeps the current data model intact while layering in the new multi-tenant functionality required by the Super Duper Admin portal.



