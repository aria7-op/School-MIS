import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import superadminController from '../controllers/superadminController.js';

const router = express.Router();

// ======================
// SUPERADMIN MANAGEMENT ROUTES
// ======================

const managementRoles = ['SUPER_ADMIN', 'SUPER_DUPER_ADMIN'];

// ======================
// SUPERADMIN ANALYTICS & REPORTING ROUTES
// ======================

// Overview Dashboard
router.get('/dashboard/overview', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getOverviewDashboard);

// Financial Analytics
router.get('/analytics/financial/overview', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getFinancialOverview);
router.get('/analytics/financial/revenue', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getRevenueAnalytics);
router.get('/analytics/financial/expenses', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getExpenseAnalytics);
router.get('/analytics/financial/profit-loss', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getProfitLossReport);
router.get('/analytics/financial/payment-trends', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getPaymentTrends);
router.get('/analytics/financial/school-comparison', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSchoolFinancialComparison);

// Academic Analytics
router.get('/analytics/academic/overview', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getAcademicOverview);
router.get('/analytics/academic/student-performance', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getStudentPerformanceAnalytics);
router.get('/analytics/academic/attendance', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getAttendanceAnalytics);
router.get('/analytics/academic/exam-results', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getExamResultsAnalytics);
router.get('/analytics/academic/subject-performance', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSubjectPerformanceAnalytics);

// User Analytics
router.get('/analytics/users/overview', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getUsersOverview);
router.get('/analytics/users/students', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getStudentAnalytics);
router.get('/analytics/users/teachers', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getTeacherAnalytics);
router.get('/analytics/users/staff', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getStaffAnalytics);
router.get('/analytics/users/parents', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getParentAnalytics);
router.get('/analytics/users/activity', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getUserActivityAnalytics);

// School Analytics
router.get('/analytics/schools/overview', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSchoolsOverview);
router.get('/analytics/schools/performance-comparison', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSchoolPerformanceComparison);
router.get('/analytics/schools/:schoolId/detailed', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSchoolDetailedAnalytics);

// School structure management
router.get(
  '/schools/:schoolId/branches',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.listSchoolBranches,
);
router.post(
  '/schools/:schoolId/branches',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.createSchoolBranch,
);
router.put(
  '/schools/:schoolId/branches/:branchId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.updateSchoolBranch,
);
router.delete(
  '/schools/:schoolId/branches/:branchId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.archiveSchoolBranch,
);
router.post(
  '/schools/:schoolId/branches/:branchId/managers',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.assignBranchManager,
);
router.delete(
  '/schools/:schoolId/branches/:branchId/managers/:managerId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.revokeBranchManager,
);
router.get(
  '/schools/:schoolId/courses',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.listSchoolCourses,
);
router.get(
  '/schools/:schoolId/structure-quota',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.getSchoolStructureQuota,
);
router.post(
  '/schools/:schoolId/courses',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.createSchoolCourse,
);
router.put(
  '/schools/:schoolId/courses/:courseId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.updateSchoolCourse,
);
router.delete(
  '/schools/:schoolId/courses/:courseId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.archiveSchoolCourse,
);
router.post(
  '/schools/:schoolId/courses/:courseId/managers',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.assignCourseManager,
);
router.delete(
  '/schools/:schoolId/courses/:courseId/managers/:managerId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  superadminController.revokeCourseManager,
);

// System Health & Performance
router.get('/system/health', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSystemHealth);
router.get('/system/performance', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSystemPerformance);
router.get('/system/activity-logs', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getActivityLogs);
router.get('/system/audit-logs', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getAuditLogs);

// Advanced Reports
router.get('/reports/comprehensive', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getComprehensiveReport);
router.get('/reports/enrollment-trends', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getEnrollmentTrends);
router.get('/reports/financial-summary', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getFinancialSummaryReport);
router.get('/reports/academic-summary', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getAcademicSummaryReport);
router.post('/reports/export', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.exportReport);

// Real-Time Metrics
router.get('/metrics/real-time', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getRealTimeMetrics);
router.get('/metrics/alerts', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getSystemAlerts);

// Data Insights & Predictions
router.get('/insights/enrollment-predictions', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getEnrollmentPredictions);
router.get('/insights/revenue-forecasting', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getRevenueForecast);
router.get('/insights/risk-analysis', authenticateToken, authorizeRoles(['SUPER_ADMIN']), superadminController.getRiskAnalysis);

export default router;

