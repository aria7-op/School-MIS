import express from 'express';
import * as userController from '../controllers/userController.js';
import { 
  authenticateToken, 
  authorizeRoles, 
  authorizePermissions,
  requireOwner,
  requireSchoolAdmin,
  requireTeacher,
  auditLog 
} from '../middleware/auth.js';
import {
  generalLimiter,
  authLimiter,
  bulkLimiter,
  exportLimiter,
  fileUploadLimiter,
  roleBasedLimiter,
  defaultRoleLimits,
} from '../middleware/rateLimit.js';
import { validateRequest } from '../middleware/validation.js';
import {
  UserCreateSchema,
  UserUpdateSchema,
  UserSearchSchema,
  UserAuthSchema,
  UserPasswordChangeSchema,
  UserProfileUpdateSchema,
  UserBulkCreateSchema,
  UserBulkUpdateSchema,
  UserImportSchema,
  UserExportSchema,
  UserAnalyticsSchema,
  UserPerformanceSchema,
  UserTempPasswordResetSchema,
} from '../utils/userSchemas.js';
import { UserPatchSchema } from '../utils/userSchemas.js';

const router = express.Router();

// ======================
// CREATE TEACHER RECORD FOR EXISTING USER
// ======================

/**
 * @route POST /api/users/create-teacher-record
 * @desc Create teacher record for existing user
 * @access Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 */
router.post('/create-teacher-record',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  async (req, res) => {
    try {
      const { userId } = req.body;
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: BigInt(userId) }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      
      // Check if teacher record already exists
      const existingTeacher = await prisma.teacher.findUnique({
        where: { userId: BigInt(userId) }
      });
      
      if (existingTeacher) {
        return res.status(400).json({
          success: false,
          error: 'Teacher record already exists for this user'
        });
      }
      
      // Create teacher record
      const teacher = await prisma.teacher.create({
        data: {
          userId: BigInt(userId),
          employeeId: req.body.employeeId || `ADMIN_${userId}`,
          departmentId: BigInt(req.body.departmentId || 1),
          schoolId: BigInt(req.body.schoolId || 1),
          qualification: req.body.qualification || 'Administrator',
          specialization: req.body.specialization || 'School Administration',
          experience: req.body.experience || 0,
          isClassTeacher: req.body.isClassTeacher || false,
          createdBy: BigInt(req.user.id)
        }
      });
      
      res.json({
        success: true,
        message: 'Teacher record created successfully',
        data: {
          id: teacher.id.toString(),
          userId: teacher.userId.toString(),
          employeeId: teacher.employeeId
        }
      });
      
    } catch (error) {
      console.error('Error creating teacher record:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create teacher record',
        message: error.message
      });
    }
  }
);

// ======================
// AUTHENTICATION ROUTES
// ======================

/**
 * @route POST /api/users/login
 * @desc Universal login for users and owners
 * @access Public
 */
router.post('/login', 
  /* authLimiter, */
  validateRequest(UserAuthSchema),
  userController.loginUser
);

/**
 * @route POST /api/users/logout
 * @desc User logout
 * @access Private
 */
router.post('/logout',
  authenticateToken,
  userController.logoutUser
);

/**
 * @route POST /api/users/change-password
 * @desc Change user password
 * @access Private
 */
router.post('/change-password',
  authenticateToken,
  validateRequest(UserPasswordChangeSchema),
  userController.changePassword
);

router.post('/temp-reset-password',
  validateRequest(UserTempPasswordResetSchema, 'body'),
  userController.tempResetPassword
);

// ======================
// CRUD ROUTES
// ======================

/**
 * @route POST /api/users
 * @desc Create a new user
 * @access Private (Owner, School Admin)
 */
router.post('/',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  authorizePermissions(['user:create']),
  generalLimiter,
  userController.createUser
);

/**
 * @route GET /api/users
 * @desc Get users with pagination and filters
 * @access Private
 */
router.get('/',
  authenticateToken,
  generalLimiter,
  // Fix: remove include parameter completely to avoid validation issues
  (req, res, next) => {
    delete req.query.include;
    next();
  },
  // validateRequest(UserSearchSchema, 'query'), // TEMPORARILY DISABLED to fix validation issues
  userController.getUsers
);

/**
 * @route GET /api/users/search
 * @desc Search users with advanced filters
 * @access Private
 */
router.get('/search',
  authenticateToken,
  generalLimiter,
  validateRequest(UserSearchSchema, 'query'),
  userController.searchUsers
);

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:id',
  authenticateToken,
  generalLimiter,
  userController.getUserById
);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private (Owner, School Admin, Teacher, Self)
 */
router.put('/:id',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  generalLimiter,
  validateRequest(UserUpdateSchema),
  userController.updateUser
);

// Partial update
router.patch('/:id',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  generalLimiter,
  validateRequest(UserPatchSchema),
  userController.patchUser
);

/**
 * @route PATCH /api/users/:id/profile
 * @desc Update user profile (self)
 * @access Private (Self)
 */
router.patch('/:id/profile',
  authenticateToken,
  generalLimiter,
  validateRequest(UserProfileUpdateSchema),
  userController.updateUser
);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user (soft delete)
 * @access Private (Owner, School Admin)
 */
router.delete('/:id',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  generalLimiter,
  userController.deleteUser
);

/**
 * @route PATCH /api/users/:id/restore
 * @desc Restore deleted user
 * @access Private (Owner, School Admin)
 */
router.patch('/:id/restore',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  generalLimiter,
  userController.restoreUser
);

// ======================
// BULK OPERATIONS ROUTES
// ======================

/**
 * @route POST /api/users/bulk/create
 * @desc Bulk create users
 * @access Private (Owner, School Admin)
 */
router.post('/bulk/create',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  bulkLimiter,
  validateRequest(UserBulkCreateSchema),
  userController.bulkCreateUsers
);

/**
 * @route PUT /api/users/bulk/update
 * @desc Bulk update users
 * @access Private (Owner, School Admin, Teacher)
 */
router.put('/bulk/update',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  bulkLimiter,
  validateRequest(UserBulkUpdateSchema),
  userController.bulkUpdateUsers
);

/**
 * @route DELETE /api/users/bulk/delete
 * @desc Bulk delete users
 * @access Private (Owner, School Admin)
 */
router.delete('/bulk/delete',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  bulkLimiter,
  userController.bulkDeleteUsers
);

// ======================
// ANALYTICS & STATISTICS ROUTES
// ======================

/**
 * @route GET /api/users/:id/stats
 * @desc Get user statistics
 * @access Private (Self, Owner, School Admin)
 */
router.get('/:id/stats',
  authenticateToken,
  generalLimiter,
  userController.getUserStats
);

/**
 * @route GET /api/users/:id/analytics
 * @desc Get user analytics
 * @access Private (Self, Owner, School Admin)
 */
router.get('/:id/analytics',
  authenticateToken,
  generalLimiter,
  validateRequest(UserAnalyticsSchema, 'query'),
  userController.getUserAnalytics
);

/**
 * @route GET /api/users/:id/performance
 * @desc Get user performance metrics
 * @access Private (Self, Owner, School Admin, Teacher)
 */
router.get('/:id/performance',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  generalLimiter,
  validateRequest(UserPerformanceSchema, 'query'),
  userController.getUserPerformance
);

// ======================
// EXPORT & IMPORT ROUTES
// ======================

/**
 * @route GET /api/users/export
 * @desc Export users data
 * @access Private (Owner, School Admin)
 */
router.get('/export',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  exportLimiter,
  validateRequest(UserExportSchema, 'query'),
  userController.exportUsers
);

/**
 * @route POST /api/users/import
 * @desc Import users data
 * @access Private (Owner, School Admin)
 */
router.post('/import',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  fileUploadLimiter,
  validateRequest(UserImportSchema),
  userController.importUsers
);

// ======================
// UTILITY ROUTES
// ======================

/**
 * @route GET /api/users/username-suggestions
 * @desc Generate username suggestions
 * @access Private
 */
router.get('/username-suggestions',
  authenticateToken,
  generalLimiter,
  userController.generateUsernameSuggestions
);

/**
 * @route GET /api/users/counts/by-role
 * @desc Get user count by role
 * @access Private (Owner, School Admin)
 */
router.get('/counts/by-role',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  generalLimiter,
  userController.getUserCountByRole
);

/**
 * @route GET /api/users/counts/by-status
 * @desc Get user count by status
 * @access Private (Owner, School Admin)
 */
router.get('/counts/by-status',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  generalLimiter,
  userController.getUserCountByStatus
);

// ======================
// SCHOOL-SPECIFIC ROUTES
// ======================

/**
 * @route GET /api/schools/:schoolId/users
 * @desc Get users by school
 * @access Private (Owner, School Admin)
 */
router.get('/schools/:schoolId/users',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  generalLimiter,
  userController.getUsersBySchool
);

// ======================
// ROLE-SPECIFIC ROUTES
// ======================

/**
 * @route GET /api/users/role/:role
 * @desc Get users by role
 * @access Private (Owner, School Admin)
 */
router.get('/role/:role',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  generalLimiter,
  userController.getUsersByRole
);

/**
 * @route GET /api/users/status/:status
 * @desc Get users by status
 * @access Private (Owner, School Admin)
 */
router.get('/status/:status',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  generalLimiter,
  userController.getUsersByStatus
);

// ======================
// ROLE-BASED RATE LIMITING
// ======================

// Apply role-based rate limiting to all routes
router.use(roleBasedLimiter(defaultRoleLimits));

// ======================
// AUDIT LOGGING MIDDLEWARE
// ======================

/**
 * @desc Log all user operations for audit
 * @access Private
 */
router.use(auditLog);

// ======================
// ERROR HANDLING MIDDLEWARE
// ======================

// Handle 404 for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    meta: {
      timestamp: new Date().toISOString(),
      statusCode: 404,
      method: req.method,
      path: req.originalUrl
    }
  });
});

// Global error handler
router.use((error, req, res, next) => {
  console.error('User route error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
    meta: {
      timestamp: new Date().toISOString(),
      statusCode: 500,
      method: req.method,
      path: req.originalUrl
    }
  });
});

// Fix user owner ID endpoint
router.patch('/fix-owner/:userId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { createdByOwnerId } = req.body;
      
      if (!createdByOwnerId) {
        return res.status(400).json({
          success: false,
          message: 'createdByOwnerId is required'
        });
      }
      
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      const updatedUser = await prisma.user.update({
        where: { id: BigInt(userId) },
        data: { createdByOwnerId: BigInt(createdByOwnerId) },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          createdByOwnerId: true
        }
      });
      
      res.json({
        success: true,
        message: 'User owner ID updated successfully',
        data: {
          id: updatedUser.id.toString(),
          username: updatedUser.username,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`,
          createdByOwnerId: updatedUser.createdByOwnerId.toString()
        }
      });
      
    } catch (error) {
      console.error('Error fixing user owner:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user owner ID',
        error: error.message
      });
    }
  }
);

// Update teacher username and password endpoint
router.put('/update-teacher-credentials/:userId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { username, password } = req.body;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        });
      }
      
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      // Hash the password if provided, otherwise use default
      const bcrypt = await import('bcrypt');
      const hashedPassword = password ? 
        await bcrypt.hash(password, 10) : 
        await bcrypt.hash('Password123!', 10);
      
      const updatedUser = await prisma.user.update({
        where: { id: BigInt(userId) },
        data: { 
          username: username,
          password: hashedPassword
        },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          role: true
        }
      });
      
      res.json({
        success: true,
        message: 'Teacher credentials updated successfully',
        data: {
          id: updatedUser.id.toString(),
          username: updatedUser.username,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`,
          role: updatedUser.role,
          password: password ? 'Updated' : 'Password123!'
        }
      });
      
    } catch (error) {
      console.error('Error updating teacher credentials:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update teacher credentials',
        error: error.message
      });
    }
  }
);

export default router; 