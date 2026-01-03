# Audit Logging Upgrade – November 2025

## Overview

The audit logging stack now captures **every API request** end-to-end, providing deep observability across the system. Enhancements include:

- Dedicated request audit middleware that logs method, path, status code, response time, correlation ID, IP, headers, query params, and sanitized request bodies.
- Expanded Prisma `audit_logs` schema with request/response metadata fields and supporting indexes.
- Advanced analytics surface in the admin dashboard (HTTP status distribution, endpoint performance, response time trends, error-rate tracking).
- Enhanced audit log browser with method/status filters, correlation-ID tracing, and detailed request metadata.

These improvements apply to both the backend API and the `copy` frontend audit views.

## Deployment Checklist

1. **Install backend dependencies (if needed)**  
   No new npm modules are required; Prisma migrations must be applied.

2. **Run database migration**
   ```bash
   npx prisma migrate deploy
   ```
   This creates the new columns (`requestMethod`, `requestUrl`, `responseStatus`, etc.) and supporting indexes on `audit_logs`.

3. **Restart the API service**
   Ensure the Node server is restarted so the new middleware is loaded.

4. **Optional: Warm up analytics**
   Generate traffic (or replay recent logs) so the dashboard reflects current status distributions and endpoint metrics.

## Verifying the Upgrade

- Hit several API endpoints (success and failure scenarios).  
  Check `/api/audit-logs` for entries showing the new fields.
- Visit the **Admin → Audit Logs** dashboard in the `copy` frontend.  
  Confirm the new summary cards, HTTP status breakdown, and endpoint tables render correctly.
- Use the audit log modal to inspect request headers, query parameters, and sanitized bodies.
- Filter the logs list by method, status code, and correlation ID to validate new filter controls.

## Notes & Recommendations

- **Correlation IDs**: The middleware honours incoming `x-request-id` / `x-correlation-id` headers. Ensure upstream services set them for distributed tracing.
- **Trusted Proxy**: `app.js` already sets `app.set('trust proxy', true)`; keep this for accurate client IP capture behind reverse proxies.
- **Sensitive data**: Request bodies and headers are sanitized (passwords, tokens, secrets) before persisting.
- **Performance**: Additional indexes on `requestMethod`, `responseStatus`, and `isSuccess` keep query performance predictable despite higher log volume.
- **Storage considerations**: Historical pruning policies remain unchanged; revisit retention if the higher cardinality of logs impacts storage.

## Rollback

To revert, remove the new middleware wiring in `app.js`, drop the added columns from `audit_logs`, and redeploy the previous frontend bundle. Be aware that reverting the schema will discard the new metadata fields.

---

For questions or follow-ups, coordinate with the observability/ops team so downstream dashboards and alerting can incorporate the richer audit data.***

