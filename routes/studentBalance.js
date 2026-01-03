import express from 'express';
import studentBalanceController from '../controllers/studentBalanceController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Student balance routes
router.get('/students/:studentId/balance', studentBalanceController.getStudentBalance);
router.get('/students/:studentId/expected-fees', studentBalanceController.getExpectedFees);
router.get('/students/:studentId/dues', studentBalanceController.getStudentDues);

// Bulk operations
router.get('/students/with-dues', studentBalanceController.getStudentsWithDues);
router.post('/payments/auto-update-statuses', studentBalanceController.autoUpdatePaymentStatuses);

// Finance summary
router.get('/finance/payment-summary', studentBalanceController.getPaymentSummary);

export default router;

