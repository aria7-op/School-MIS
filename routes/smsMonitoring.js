import express from 'express';
import { getSMSMonitoringDashboard, getSMSStats } from '../controllers/smsMonitoringController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/sms-monitoring/dashboard
 * @desc    Get comprehensive SMS monitoring data with filters
 * @access  Private (authenticated users)
 * @query   {status, source, type, startDate, endDate, classId, studentId, page, limit}
 */
router.get('/dashboard', getSMSMonitoringDashboard);

/**
 * @route   GET /api/sms-monitoring/stats
 * @desc    Get quick SMS statistics summary
 * @access  Private (authenticated users)
 * @query   {period} - 'today', 'week', or 'month'
 */
router.get('/stats', getSMSStats);

export default router;

