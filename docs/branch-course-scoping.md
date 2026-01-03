# Branch / Course Scoping Plan

This document tracks which Prisma models require explicit `branchId` and/or `courseId`
columns so branch and course managers only see their own data.

| Domain        | Prisma Models (Table)                                   | New Columns | Backfill Strategy |
|---------------|---------------------------------------------------------|-------------|-------------------|
| CRM           | `Customer`, `CustomerEvent`, `CustomerPipelineStage`, related task/document models | `branchId` (optional) | Use existing assignments/pipeline stage branch or default to manager’s branch |
| Academics     | `Student`, `StudentEnrollment`, `Class`, `Section`, `Subject`, `SubjectToTeacher`, `TeacherClassSubject`, `Assignment`, `AssignmentSubmission`, `Attendance`, `Exam`, `ExamTimetable`, `Grade`, `GradeApproval`, etc. | `branchId`, `courseId` where applicable | Infer from class/course relationships; default to main branch when ambiguous |
| Finance       | `Payment`, `PaymentItem`, `Expense`, `Payroll`, `FeeStructure`, `FeeItem`, `Invoice`, `Income`, etc. | `branchId` | Pull branch through student/class ties or financial entity owner |
| Operations    | `Route`, `Vehicle`, `Facility`, `FacilityBooking`, `InventoryItem`, `InventoryLog`, `Document`, `Message`, etc. | `branchId` | Use association to branches (classrooms, routes, staff) or default |
| Communications | `Notification`, `Conversation`, `ConversationParticipant`, `Message`, `Attachment` | `branchId` (optional) | Link notifications and messages to originating branch when available |
| HR / Staff    | `Teacher`, `Staff`, `StaffDocument`, `Payroll`, `Shift`, etc. | `branchId` | Use staff assignment to branch; default to primary branch |
| Transport     | `StudentTransport`, `RouteStop`, `Trip`, `TransportAttendance` | `branchId` | Derive from route / vehicle branch |

> **Notes**
> - Some global/system tables remain unscoped (e.g. system settings, audit logs for super admins).
> - Columns will be added nullable, populated, then constrained where appropriate.
> - Backfill scripts will run as part of the Prisma migration (SQL `UPDATE` statements).

## Tasks

1. Update Prisma models per domain.
2. Implement migrations with backfill SQL.
3. Adjust services and controllers to filter by `branchId` / `courseId`.
4. Regenerate Prisma client and run automated checks.


