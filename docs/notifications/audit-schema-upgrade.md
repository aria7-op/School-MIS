# Notification Trigger Audit & Schema Upgrade

## Current Coverage Snapshot (Pre-Upgrade)

- `controllers/notificationController.js`: CRUD + stats endpoints, basic filtering.
- `services/notificationService.js`: Monolithic `createNotification`, typed helper factories for student, attendance, payment, user, system, customer, inventory.
- `utils/notificationTriggers.js`: Rule-driven automation with role mapping (TEACHER ↔︎ ADMIN swap), fallback broadcasts.
- Domain controllers invoking notifications:
  - `controllers/studentController.js`: Enrollment, updates, bulk operations.
  - `controllers/attendanceController.js`: Marking, leave/late handling.
  - `controllers/paymentController.js`: Receipts, reminders, finance signals.
  - `controllers/excelGradeController.js`: Grade imports.
  - `services/studentEventService.js` & `services/customerEventService.js`: Secondary events.

## Observed Gaps

- Messaging inconsistent per role; identical payload shared with parents, admins, teachers.
- No categorisation beyond `type`; analytics can’t slice by domain (student/finance/etc.).
- Recipient lifecycle limited to `readAt`; no acknowledgement/follow-up tracking.
- Missing context scoping (school vs. global vs. class) making filtering heavy.
- Legacy paths rely on manual `createNotification` composition leading to divergence.

## Schema Enhancements (Zero-Downtime)

- `notifications`
  - `category` (`VARCHAR(50)`): Domain bucket (`STUDENT`, `FINANCE`, `ATTENDANCE`, etc.).
  - `subType` (`VARCHAR(100)`): Fine-grained scenario identifier (matches blueprint key).
  - `audienceRoles` (`LONGTEXT` JSON): Records intended audiences for analytics.
  - `contextScope` (`VARCHAR(100)`): Scope label (`school`, `class`, `global`, etc.).
  - `source` (`VARCHAR(100)`): Originator (`legacy`, `blueprint.student`, ...).
- `notification_recipients`
  - `firstViewedAt`, `acknowledgedAt`, `dismissedAt`: Tracking lifecycle.
  - `actionRequired` (bool), `followUpAt`: Workflow alignment for admins/finance.
  - `notes`: System/user annotations for audits.
- `notification_deliveries`
  - `lastErrorAt`: Re-delivery diagnostics.

### Data Backfill Strategy

- Default existing notifications to `category=SYSTEM`, `subType=type`, `contextScope=school`, `source=legacy`, `audienceRoles=[]` to avoid breaking reads.
- Recipient notes default to empty string; life-cycle fields stay null.

## Blueprint-Driven Direction

- Introduce `services/notificationBlueprints.js` to define event-centric payloads with per-audience messaging.
- Extend helpers to map notification roles to actual database roles (TEACHER ↔︎ ADMIN swap).
- Expose orchestrator via `services/notificationService.js` to standardise dispatch with detailed metadata.

This document anchors the migration and guides subsequent refactors, ensuring production-safe rollout with richer analytics and lifecycle controls.















