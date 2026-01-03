# Controller Context Scope Inventory

This inventory captures each controller under `/controllers/`, the primary models it touches, and the managed-context dimensions it **should** respect when a user selects a school, branch, or course. Use it as the master checklist while enforcing consistent scoping logic.

| Controller | Key Models / Tables | Required Scope |
|------------|--------------------|----------------|
| `abacController.js` | access-control policies | School |
| `assignmentAttachmentController.js` | assignments, classes | School · Branch · Course |
| `assignmentController.js` | assignments, assignment_submissions | School · Branch · Course |
| `attendanceCalculator.js` | attendance, classes, schedules | School · Branch · Course |
| `attendanceController.js` | attendance, classes, timetables | School · Branch · Course |
| `auditController.js` | audit_logs | School (records already scoped per-tenancy) |
| `authController.js` | users, roles | School |
| `budgetController.js` | budgets, budget_items | School |
| `classController.js` | classes, sections, courses | School · Branch · Course |
| `conversationController.js` | conversations/messages | School |
| `customerAnalyticsController.js` | customers, customer_events | School · Branch (Course-derived when relations exist) |
| `customerAutomationController.js` | customer_automations | School · Branch |
| `customerBulkController.js` | customers | School · Branch |
| `customerCacheController.js` | cache tables | School |
| `customerCollaborationController.js` | customer_collaborations | School · Branch |
| `customerController.js` | customers | School · Branch (Course → Branch) |
| `customerDocumentController.js` | customer_documents | School · Branch |
| `customerEventController.js` | customer_events | School · Branch |
| `customerImportExportController.js` | customers import/export | School · Branch |
| `customerIntegrationController.js` | customer_integrations | School |
| `customerInteractionController.js` | customer_interactions | School · Branch |
| `customerNotificationController.js` | customer_notifications | School |
| `customerPipelineController.js` | customer_pipeline_stages | School · Branch |
| `customerSearchController.js` | customers | School · Branch |
| `customerSegmentController.js` | customer_segments | School |
| `customerTicketController.js` | customer_tickets | School · Branch |
| `customerWorkflowController.js` | customer_workflows | School |
| `documentController.js` | documents | School · Branch |
| `equipmentController.js` | equipments | School · Branch |
| `eventController.js` | events | School · Branch |
| `examController.js` | exams | School · Branch · Course |
| `examinationController.js` | examinations | School · Branch · Course |
| `examTimetableController.js` | exam_timetables | School · Branch · Course |
| `excelGradeController.js` | grade exports | School · Branch · Course |
| `expenseController.js` | expenses | School · Branch |
| `feeController.js` | fees, fee_structures | School · Branch |
| `FeeItemController.js` | fee_items | School · Branch |
| `fileController.js` | generic file storage | School |
| `googleDriveController.js` | integrations | School |
| `gradeController.js` | grades | School · Branch · Course |
| `hostelController.js` | hostels | School |
| `incomeController.js` | incomes | School · Branch |
| `installmentController.js` | installments | School · Branch |
| `integratedPaymentController.js` | payments | School · Branch |
| `inventoryController.js` | inventory_items | School · Branch |
| `inventoryLogController.js` | inventory_logs | School · Branch |
| `inventorySupplierController.js` | inventory_suppliers | School |
| `libraryController.js` | library_books, issues | School · Branch |
| `messageController.js` | messages | School |
| `monthlyTestController.js` | monthly_tests | School · Branch · Course |
| `noticeController.js` | notices | School |
| `notificationController.js` | notifications | School |
| `ownerController.js` | owners | School |
| `parentController.js` | parents, students | School · Branch · Course |
| `passwordResetTokenController.js` | password_reset_tokens | School |
| `paymentController.js` | payments, invoices | School · Branch |
| `payrollController.js` | payrolls | School · Branch |
| `pbacController.js` | policy-based access control | School |
| `platformController.js` | owner/platform admin | School |
| `purchaseOrderController.js` | purchase_orders | School · Branch |
| `rbacController.js` | roles/permissions | School |
| `refundController.js` | refunds | School · Branch |
| `scheduleController.js` | schedules, classes | School · Branch · Course |
| `schoolController.js` | schools | School (global admin endpoints) |
| `sectionController.js` | sections | School · Branch · Course |
| `smsMonitoringController.js` | sms_monitoring | School |
| `staffController.js` | staff | School · Branch |
| `studentBalanceController.js` | student_balances | School · Branch · Course |
| `studentController.js` | students | School · Branch · Course |
| `studentEnrollmentController.js` | enrollments | School · Branch · Course |
| `studentEventController.js` | student_events | School · Branch · Course |
| `subjectController.js` | subjects | School · Branch · Course |
| `suggestionComplaintController.js` | suggestions, complaints | School · Branch |
| `superadminController.js` | multi-school admin | School · Branch |
| `teacherClassSubjectController.js` | teacher_class_subjects | School · Branch · Course |
| `teacherController.js` | teachers | School · Branch |
| `timetableAIController.js` | timetables | School · Branch · Course |
| `transportController.js` | transport routes, vehicles | School · Branch |
| `userController.js` | users | School |

> **Legend**  
> - **School** — filter by `schoolId` at minimum.  
> - **Branch** — filter by active `branchId` when the model exposes it.  
> - **Course** — filter by `courseId` (or derive the branch from the selected course) where applicable.

### Notes
- Courses always belong to a branch; when only `courseId` is selected, derive the branch via `prisma.course.findUnique(...)` and apply both `courseId` and fallback `branchId`.
- Some controllers (e.g., `fileController.js`, `messageController.js`) interact with multi-tenant resources but may not store `branchId`/`courseId`. Confirm schema before forcing filters.
- For controllers that execute raw SQL, replicate the same scope clauses (`schoolId`, `branchId`, `courseId`) in both the Prisma and SQL branches.
- Update this inventory as new controllers are added or when schema changes introduce additional scope fields.













