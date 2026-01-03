import express from 'express';
import { getAllBudgets, getBudgetById, createBudget, updateBudget, deleteBudget } from '../controllers/budgetController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

router.get('/', getAllBudgets);
router.get('/:id', getBudgetById);
router.post('/', authorizeRoles(['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']), createBudget);
router.put('/:id', authorizeRoles(['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']), updateBudget);
router.delete('/:id', authorizeRoles(['ACCOUNTANT', 'SCHOOL_ADMIN', 'SUPER_ADMIN', 'TEACHER']), deleteBudget);

export default router; 