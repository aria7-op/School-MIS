# Backend Architecture Review – Data Access & RBAC Baseline (Nov 2025)

## 1. Runtime Overview

- **Framework**: Express (`app.js`) with layered middlewares (`helmet`, `compression`, CORS, JSON parsing).
- **Transport**: REST + Socket.IO (`io` instance stored on `app` and `global`).
- **Database Clients**:
  - `PrismaClient` (MySQL datasource) instantiated in many controllers/services.
  - `mysql2/promise` connection pool (`dbPool`) created once in `app.js`; reused in certain controllers (e.g., `customerController`).
- **Authentication**: JWT (`middleware/auth.js`) with verbose logging + owner fallback.
- **Authorization**: `authorizeRoles`, `authorizePermissions` (role-based with static permission helper).
- **Audit**: `requestAuditMiddleware` persisting to `audit_logs`; additional granular audit utilities.

## 2. Data Access Patterns

### 2.1 Prisma Usage

| Location | Pattern | Notes |
| -------- | ------- | ----- |
| `controllers/attendanceController.js` | Module-level `const prisma = new PrismaClient()` | Similar pattern repeated across controllers (`student`, `subject`, `fee`, etc.). |
| `models/*.js` (e.g., `models/User.js`) | Class wrapper with `this.prisma = new PrismaClient()` | Provides CRUD helpers + audit logging. |
| Middleware (`middleware/auth.js`, `middleware/requestAuditMiddleware.js`) | Global `PrismaClient` instance w/ logging | Auth middleware re-instantiates Prisma on error (`line 1134`). |
| Services (`services/scheduleService.js`, `services/notificationService.js`) | Singleton `PrismaClient` per module | Used for background processing / helpers. |

**Observations**
- Multiple Prisma clients per process; risk of exhausting connection limits when traffic scales. Should migrate to a shared singleton (e.g., `utils/prisma.js`).
- All Prisma models target MySQL; no Postgres-specific syntax currently.
- Soft delete (`deletedAt`) handled manually in queries; some helper functions already enforce filters.

### 2.2 Raw MySQL (`mysql2/promise`)

| File | Usage |
| ---- | ----- |
| `app.js` | Initializes `dbPool`, exposes `/api/database/query`-style debug endpoints (various `if (!dbPool)` guards). |
| `controllers/customerController.js` | Builds separate pool (re-uses config); executes custom SQL queries for CRM features. |
| Deployment scripts (`app-mysql2.js`, dist bundle) | Legacy support/alternative entrypoint. |

**Observations**
- Raw queries primarily in analytics/debug endpoints and CRM controller.
- For multi-tenancy, these SQL paths need explicit `tenantId`/`schoolId` scoping; currently rely on manual parameters.
- Consider refactoring to Prisma or centralizing DB access wrappers that enforce tenant filters.

### 2.3 Hybrid / Helper Utilities

- `services/secureApiService.ts` (frontend) expects encrypted API responses; backend uses `feeController`, `notificationService` to prepare payloads.
- `controllers` sometimes mix direct Prisma + custom computation (e.g., `attendanceController` calculates aggregates then writes to `audit_logs`).
- `requestAuditMiddleware` logs every request/response pair to DB; heavy reliance on Prisma transactions.

## 3. Authentication & RBAC Baseline

- JWT payload currently carries `{ userId, role, schoolId }` (owners include `ownerId`).
- `authorizeRoles(['SUPER_ADMIN'])` secures Super Admin routers (e.g., `routes/superadmin.js`).
- Granular permissions: `authorizePermissions` uses `getUserPermissions(req.user.role)` (check `middleware/auth.js`); currently static role mapping, not leveraging `roles/permissions` tables.
- Policy/attribute-based tables exist but not wired into middleware yet.
- Tenant isolation enforced by:
  - Auth middleware verifying `req.user.schoolId` for non-super roles.
  - Controllers filtering queries by `req.user.schoolId` (validated in `SCHOOL_ISOLATION_ANALYSIS.md`).
- For `SUPER_DUPER_ADMIN`, we will extend `UserRole` enum and update middleware to recognize platform-wide access.

## 4. Areas Impacted by Multi-Tenant Upgrade

1. **Shared Prisma Client**: introduce `prismaClient.ts` singleton to avoid multi-client churn.
2. **Raw SQL Paths**: wrap `dbPool.execute` calls to inject `tenantId` (esp. CRM analytics). Evaluate migrating to Prisma for consistency.
3. **Auth Middleware**:
   - Add handling for `SUPER_DUPER_ADMIN` (platform owner) with tenant superpowers.
   - Introduce tenant context helper (e.g., `req.tenantId` derived from `schools.tenantId`).
4. **RBAC**:
   - Extend `authorizeRoles` to accept new role.
   - Build permission sets for Super Duper Admin (package management, cross-tenant analytics).
5. **Audit Logging**: ensure new actions log `tenantId`/`subscriptionId` context.
6. **Socket.IO**: ensure tenant scoping when broadcasting cross-school events (currently rooms use `school:${schoolId}`).

## 5. Recommended Refactors (Pre-Implementation)

| Priority | Item | Rationale |
| -------- | ---- | --------- |
| High | Create `prisma/index.js` exporting shared client | Prevent connection leaks, simplify transaction orchestration. |
| High | Catalog raw SQL queries | Identify where to add tenant filters or migrate to Prisma. |
| Medium | Introduce DB access layer for customer CRM | Align with Prisma to leverage new multi-tenant columns. |
| Medium | Update auth middleware to accept optional `tenantId` header for super admin impersonation. |
| Low | Consolidate audit logging helpers to include `tenantId` automatically. |

## 6. Next Steps

- Proceed with migrations (packages, subscriptions, school enhancements) using strategy in `migration-strategy.md`.
- After schema change, refactor data access according to the recommendations above.
- Document any remaining raw SQL usage to ensure tenant-aware validations during build-out.

This review provides the baseline needed to proceed with backend multi-tenancy upgrades while maintaining consistency between Prisma- and SQL-based code paths.



