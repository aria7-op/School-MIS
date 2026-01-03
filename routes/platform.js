import express from 'express';
import platformController from '../controllers/platformController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { packageAwareLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles(['SUPER_DUPER_ADMIN']));
// Temporarily disable package-aware rate limiting to prevent 429s after login
// router.use(packageAwareLimiter({ windowMs: 60 * 1000, defaultMax: 240, floor: 40 }));

router.get('/dashboard/overview', platformController.getDashboardOverview.bind(platformController));
router.get('/financial/analytics', platformController.getFinancialAnalytics.bind(platformController));
router.get('/reports/summary', platformController.getReportsSummary.bind(platformController));

router.get('/settings', platformController.getSystemSettings.bind(platformController));
router.put('/settings', platformController.updateSystemSettings.bind(platformController));

// Package management
router.get('/packages', platformController.listPackages.bind(platformController));
router.get('/packages/:id', platformController.getPackageById.bind(platformController));
router.post('/packages', platformController.createPackage.bind(platformController));
router.put('/packages/:id', platformController.updatePackage.bind(platformController));
router.patch('/packages/:id/status', platformController.togglePackageStatus.bind(platformController));

// School lifecycle & onboarding
router.post('/schools', platformController.createSchoolWithOwner.bind(platformController));
// Subscription management
router.get('/subscriptions', platformController.listSubscriptions.bind(platformController));
router.patch('/subscriptions/:id/renew', platformController.renewSubscription.bind(platformController));
router.patch('/subscriptions/:id/change-package', platformController.changeSubscriptionPackage.bind(platformController));
router.patch('/subscriptions/:id/cancel', platformController.cancelSubscription.bind(platformController));
router.patch('/subscriptions/:id/reactivate', platformController.reactivateSubscription.bind(platformController));
router.get('/subscriptions/:id/history', platformController.getSubscriptionHistory.bind(platformController));

// School analytics
router.get('/schools', platformController.listSchools.bind(platformController));
router.patch('/schools/:id/status', platformController.updateSchoolStatus.bind(platformController));
router.get('/schools/:id/analytics', platformController.getSchoolAnalytics.bind(platformController));
router.get('/schools/:id/branches', platformController.listSchoolBranches.bind(platformController));
router.post('/schools/:id/branches', platformController.createSchoolBranch.bind(platformController));
router.put('/schools/:id/branches/:branchId', platformController.updateSchoolBranch.bind(platformController));
router.delete('/schools/:id/branches/:branchId', platformController.archiveSchoolBranch.bind(platformController));
router.post(
  '/schools/:id/branches/:branchId/managers',
  platformController.assignBranchManager.bind(platformController),
);
router.delete(
  '/schools/:id/branches/:branchId/managers/:managerId',
  platformController.revokeBranchManager.bind(platformController),
);
router.get('/schools/:id/courses', platformController.listSchoolCourses.bind(platformController));
router.post('/schools/:id/courses', platformController.createSchoolCourse.bind(platformController));
router.put('/schools/:id/courses/:courseId', platformController.updateSchoolCourse.bind(platformController));
router.delete('/schools/:id/courses/:courseId', platformController.archiveSchoolCourse.bind(platformController));
router.post(
  '/schools/:id/courses/:courseId/managers',
  platformController.assignCourseManager.bind(platformController),
);
router.delete(
  '/schools/:id/courses/:courseId/managers/:managerId',
  platformController.revokeCourseManager.bind(platformController),
);
router.patch('/super-admins/:id/status', platformController.updateSuperAdminStatus.bind(platformController));

// Platform analytics
router.get('/analytics/churn', platformController.getChurnAnalytics.bind(platformController));
router.get('/analytics/schools/comparison', platformController.getSchoolComparison.bind(platformController));
router.get('/analytics/revenue', platformController.getRevenueAnalytics.bind(platformController));
router.get('/analytics/growth', platformController.getGrowthAnalytics.bind(platformController));
router.get('/analytics/packages', platformController.getPackagePerformanceAnalytics.bind(platformController));
router.get('/analytics/attendance', platformController.getAttendanceAnalytics.bind(platformController));
router.get('/analytics/benchmarking', platformController.getBenchmarkingAnalytics.bind(platformController));
router.get('/analytics/logs/summary', platformController.getLogSummaryAnalytics.bind(platformController));
router.get('/analytics/logs/timeline', platformController.getLogTimeline.bind(platformController));
router.get('/analytics/custom-reports/metadata', platformController.getCustomReportMetadata.bind(platformController));
router.get('/analytics/custom-reports', platformController.listCustomReports.bind(platformController));
router.post('/analytics/custom-reports', platformController.createCustomReport.bind(platformController));
router.put('/analytics/custom-reports/:reportId', platformController.updateCustomReport.bind(platformController));
router.delete('/analytics/custom-reports/:reportId', platformController.deleteCustomReport.bind(platformController));
router.post('/analytics/custom-reports/run', platformController.runCustomReport.bind(platformController));

// Report exports & schedules
router.post('/analytics/exports', platformController.createReportExport.bind(platformController));
router.get('/analytics/exports', platformController.listReportExports.bind(platformController));
router.post('/analytics/schedules', platformController.createReportSchedule.bind(platformController));
router.get('/analytics/schedules', platformController.listReportSchedules.bind(platformController));
router.patch('/analytics/schedules/:scheduleId/status', platformController.updateReportScheduleStatus.bind(platformController));

router.get('/audit-logs', platformController.getAuditLogs.bind(platformController));
router.get('/audit-logs/export', platformController.exportAuditLogs.bind(platformController));

export default router;

