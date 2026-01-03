## Super Duper Admin Reporting Platform – Functional Specification

### 1. Goals
- Deliver enterprise-grade analytics covering every major business area: Sales & Revenue, School Growth/Churn, Package Performance, Attendance/Academic, Finance/Invoices, plus compliance-ready exports.
- Provide interactive dashboards, drilldowns, CSV/PDF exports, and scheduled email reports.
- Support multi-tenant isolation, advanced filtering (date range, region, school, package tier, lifecycle), and historical trend analysis.

### 2. Report Catalog

| Category | Report | Key Metrics | Filters | Output |
| --- | --- | --- | --- | --- |
| Sales & Revenue | MRR/ARR Dashboard | MRR, ARR, ARPU, LTV, CAC, pipeline | Date range, region, package, lifecycle | Line/bar charts, KPI tiles, export CSV/PDF, schedule |
| School Growth & Churn | Activation Tracker | New schools, churn %, net growth | Date range, region, package | Cohort chart, waterfall, export/schedule |
| Package Performance | Package ARPU Heatmap | ARPU per package, upgrade/downgrade rate | Date, package tier, region | Heatmap, table, export/schedule |
| Attendance & Academic | Attendance Quality | Avg attendance %, late arrivals, absence reasons | Date, school, grade, section | Multi-series chart, detail table, export/schedule |
| Finance & Invoices | Cash Flow Summary | Invoiced vs collected, outstanding balance, DSO | Date, region, payment method | Combo chart, pivot, export/schedule |
| Compliance / Misc | Custom Builder | User-defined metrics/dimensions | All | Drag-and-drop, saved config, export/schedule |

*(Extendable catalog; each report implements a consistent API contract.)*

### 3. Backend Architecture

1. **Data Sources**: Use existing MySQL tables. For heavy analytics: create summary tables/materialized views refreshed hourly/daily via cron/worker.
2. **Analytics Service**: Dedicated `analyticsController` exposing `/api/analytics/:reportId`.
   - Request: `{ reportId, filters, format }`
   - Response: `{ data: [], meta: { chartType, columns, lastRefreshed } }`
3. **Export Pipeline**:
   - CSV/PDF generated via background job (BullMQ or existing queue) to avoid blocking.
   - Results stored in object storage (S3/minio) with signed URLs.
   - Scheduled reports stored in `report_schedules` table with cron expression and email recipients.
4. **Caching**: Per-report cache (Redis) keyed by filter hash with TTL (15 min default). Cache bust when data sources change.
5. **Security**: Enforce tenant isolation (schoolId scope) and role-based permissions (`reports:read`, `reports:export`, `reports:schedule`).

#### Example API Contract
```
GET /api/analytics/reports/:reportId
Query: {
  dateFrom, dateTo, schoolId?, region?, packageId?, lifecycle?,
  format?: 'chart' | 'table' | 'csv' | 'pdf'
}
Response:
{
  success: true,
  meta: { reportId, title, chartType, columns, lastRefreshed },
  data: [...] // normalized rows
}
```

### 4. Frontend UX Design

1. **Global Filter Bar** – date range picker, multi-selects for school(s), region(s), package tiers, lifecycle status.
2. **Report Gallery** – cards for each report category with quick stats + “Run/Schedule/Export”.
3. **Report Workspace** – when a report is opened:
   - Summary KPI row
   - Interactive chart component (supports toggling chart types, tooltips, zoom)
   - Data table with column chooser and pagination
   - Export buttons (CSV/PDF) + “Schedule report” action
4. **Schedule Modal** – choose frequency (daily/weekly/monthly), time, recipients, format.
5. **Custom Builder** (Sprint 5) – drag metrics/dimensions, preview chart/table, save as custom report, enable sharing/export/scheduling.

### 5. Multi-step Rollout

1. **Phase 1 – Revenue & Growth**
   - Implement backend endpoints for Sales & Growth metrics.
   - Build UI for KPI + charts + exports.
2. **Phase 2 – Package & Attendance**
   - Add package performance and attendance analytics.
3. **Phase 3 – Finance & Custom Builder**
   - Deliver finance dashboards, compliance exports, scheduling.
4. **Phase 4 – Advanced features**
   - Custom report builder, cohort charts, benchmarking comparisons.

### 6. Technical Tasks Snapshot

1. **Backend**
   - [ ] Analytics schemas & migrations (summary tables, schedules, export logs)
   - [ ] Controllers/services for each report category
   - [ ] Export job worker (CSV/PDF) + email delivery
   - [ ] Cache layer + permission checks
2. **Frontend**
   - [ ] Global filter context + hooks to call analytics APIs
   - [ ] Report gallery & workspace components
   - [ ] Charts (recharts/highcharts), tables with column picker
   - [ ] Export & scheduling UI
3. **DevOps**
   - [ ] Cron jobs or background workers for refresh/scheduling
   - [ ] Storage bucket for exports
   - [ ] Monitoring/logging for analytics runtimes

### 7. Open Questions
- Do we need strict SLAs on report freshness (real-time vs 15 min delay)?
- Any compliance constraints on export retention?
- Should customers create/share custom reports with other tenants?

### 8. Next Steps
1. Sprint 5 scope (Custom Builder & Benchmarking)
   - Backend: schema for saved custom reports, endpoints for CRUD, builder-friendly metadata service (list of metrics/dimensions, safe query builder).
   - Frontend: custom report builder UI (metric/dimension pickers, chart/table preview, save/load, share toggles), benchmarking tab with cross-school comparisons.
   - Exports/scheduling integration for custom/benchmark reports.
2. QA plan for builder (permission checks, performance tests).
3. Documentation updates for admins.

### 9. Sprint 6 Scope – Per-School Log Intelligence

**Objective**: deliver “Logs Report” coverage for every school so super-duper admins can audit platform usage, detect anomalies, and share compliance exports with individual schools.

#### Deliverables
- **Log ingestion & storage**: extend existing `audit_logs` (or introduce `school_activity_logs`) to guarantee `schoolId`, `actorType`, `resourceType`, `severity`, `device`, `ipAddress`, `geo`, `latencyMs`, `delta` snapshot. Add composite indexes for `{schoolId, occurredAt}` and `{resourceType, action}`.
- **Derivation jobs**: nightly rollups by school/day (`log_daily_rollups`) capturing counts per action category, top actors, error rates.
- **APIs**:
  - `/platform/analytics/logs/summary` → KPI cards (total events, errors, average latency) scoped by filters.
  - `/platform/analytics/logs/timeline` → paginated event stream with full context + diff payloads.
  - `/platform/analytics/logs/export` → async CSV/PDF export per school, reusing `report_exports`.
  - `/platform/analytics/logs/schedules` → allow recurring log digests per school (daily/weekly) with recipient lists.
- **Frontend**: new “Log Intelligence” tab inside `ReportsAnalytics` with:
  - Filter bar (date range, school, actor type, severity, module).
  - KPI row + sparkline (events, warnings, errors, average response).
  - Timeline table (virtualized) with expandable rows showing request payload/response snapshot.
  - “Per-school export” drawer letting admins choose school + format + columns before triggering export/schedule.
- **Permissions**: enforce `logs:read`, `logs:export`, `logs:schedule`. Only tenants with matching school scope can view/download.

#### Technical Tasks
1. **Database**
   - Migration for new log fields/indexes + `log_daily_rollups`.
   - Backfill script to hydrate `schoolId` where missing.
2. **Backend**
   - `logAnalyticsService` with Prisma pipeline aggregations + Redis caching.
   - Export worker template (CSV + PDF) with column mapping for log detail.
   - Schedule handler that bundles log stats + top events per school.
3. **Frontend**
   - Extend `platformService` & query keys for logs endpoints.
   - New React components (timeline table, KPI cards, export modal, schedule modal).
   - Visual indicators for severity (info/warn/error) and quick filters (chips).
4. **DevOps**
   - Ensure log retention policy (e.g., 180 days hot, 365 days cold storage).
   - Observability dashboards (Grafana) for ingestion lag and export queue health.

#### Acceptance Criteria
- Super admin can pick any school and view its complete activity log for a selected window.
- KPI cards and charts reflect the chosen filters and match backend rollups.
- CSV/PDF exports include metadata header (school, date window, generated at) and deliver within 2 minutes via existing export queue.
- Scheduled log digests email the selected recipients with attachment + summary metrics.
- Permissions prevent viewing logs for schools outside the admin’s scope.

#### Risks / Follow-ups
- High-volume schools may need pagination + streaming export controls.
- Consider partitioning log tables by month to keep queries performant.
- Future Sprint 7 could add anomaly detection / alerting on top of these datasets.

