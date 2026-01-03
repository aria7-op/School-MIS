import express from 'express';
import * as authController from '../controllers/authController.js';
import { authorize, authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validation.js';
import { loginSchema, registerSchema, changePasswordSchema } from '../validators/authValidator.js';

const router = express.Router();

// Authentication routes
router.post('/register', validateBody(registerSchema), authController.register);
router.post('/login', /* authLimiter, */ validateBody(loginSchema), authController.login);
router.post('/login-db', /* authLimiter, */ validateBody(loginSchema), authController.loginDb); // New database-based login
router.get('/users', (req, res) => res.json({ message: 'Get users' }));

// Protected routes (require authentication)
router.get('/me', authenticateToken, authController.getCurrentUser);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password (authenticated users only)
 * @access  Private
 */
router.post('/change-password', authorize(), validateBody(changePasswordSchema), authController.changePassword);

// ======================
// PASSWORD RESET ROUTES
// ======================

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset (send reset email)
 * @access  Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route   POST /api/auth/admin-reset-password
 * @desc    Admin reset any user's password
 * @access  Private (Admin only)
 */
router.post('/admin-reset-password', authorize(['SUPER_ADMIN', 'OWNER']), authController.adminResetPassword);

export default router; 