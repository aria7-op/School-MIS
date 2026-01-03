import express from 'express';
import { z } from 'zod';
import studentController from '../controllers/studentController.js';
import gradeController from '../controllers/gradeController.js';
import paymentController from '../controllers/paymentController.js';
import AssignmentController from '../controllers/assignmentController.js';
import { upload, debugUpload, handleUploadErrors, processUploadedFile } from '../middleware/studentUpload.js';
import { 
  uploadStudentDocuments, 
  studentDocumentFields,
  debugDocumentUpload,
  handleDocumentUploadErrors,
  processUploadedDocuments 
} from '../middleware/studentDocumentUpload.js';
import { 
  studentCacheMiddleware, 
  studentListCacheMiddleware,
  studentStatsCacheMiddleware 
} from '../cache/studentCache.js';
import { 
  authenticateToken, 
  authorizeRoles, 
  authorizePermissions,
  authorizeSchoolAccess,
  authorizeStudentAccess,
  auditLog
} from '../middleware/auth.js';
import { 
  validateRequest, 
  validateParams, 
  validateBody,
  validateQuery,
  sanitizeRequest,
  idSchema,
  paginationSchema
} from '../middleware/validation.js';
import { 
  generalLimiter,
  // studentCreateLimiter, // REMOVED - No rate limiting for student creation
  studentSearchLimiter,
  exportLimiter,
  // bulkLimiter, // REMOVED - No rate limiting for bulk student creation
  analyticsLimiter,
  cacheLimiter,
  roleBasedLimiter,
  defaultRoleLimits
} from '../middleware/rateLimit.js';
import { 
  StudentCreateSchema, 
  StudentUpdateSchema, 
  StudentSearchSchema 
} from '../utils/studentUtils.js';
import { enforcePackageLimit, enforceStorageLimit } from '../middleware/packageLimits.js';
import { countStudentsForSchool } from '../services/subscriptionService.js';

const router = express.Router();

// Initialize assignment controller
const assignmentController = new AssignmentController();

// Helper function to safely bind controller methods
const safeControllerMethod = (controller, methodName) => {
  return async (req, res, next) => {
    try {
      if (typeof controller[methodName] === 'function') {
        await controller[methodName](req, res);
      } else {
        console.error(`Method ${methodName} not found on controller`);
        res.status(501).json({
          success: false,
          error: 'Method not implemented',
          message: `${methodName} method is not available`,
          meta: {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl
          }
        });
      }
    } catch (error) {
      next(error);
    }
  };
};

const studentCreationLimit = enforcePackageLimit({
  limitKey: 'maxStudents',
  counter: async (req) => {
    const schoolId = req.body?.schoolId || req.user?.schoolId;
    if (!schoolId) return 0;
    const current = await countStudentsForSchool(schoolId);
    const incoming = Array.isArray(req.body?.students) ? req.body.students.length : 1;
    return current + incoming;
  },
  message: 'Student limit reached for your current subscription. Please upgrade your plan to add more students.',
});

const collectUploadedFiles = (req) => {
  const files = [];

  if (req.file) {
    files.push(req.file);
  }

  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach((value) => {
      if (Array.isArray(value)) {
        files.push(...value);
      } else if (value) {
        files.push(value);
      }
    });
  }

  return files;
};

const studentDocumentStorageLimit = enforceStorageLimit({
  byteCounter: (req) =>
    collectUploadedFiles(req).reduce((total, file) => total + (Number(file?.size) || 0), 0),
  message:
    'Document upload exceeds the storage capacity allowed by your current subscription. Please upgrade or remove existing files.',
});

// ======================
// GLOBAL MIDDLEWARE
// ======================

// Apply sanitization to all routes
router.use(sanitizeRequest);

// Apply general rate limiting
router.use(generalLimiter);

// Apply role-based rate limiting
router.use(roleBasedLimiter(defaultRoleLimits));

// ======================
// STATIC ANALYTICS ROUTES (must come before dynamic routes)
// ======================

/**
 * @route   GET /api/students/quota
 * @desc    Get current student usage vs subscription limits
 * @access  Private (All authenticated users with student read permission)
 */
router.get(
  '/quota',
  authenticateToken,
  authorizePermissions(['student:read']),
  safeControllerMethod(studentController, 'getStudentQuota'),
);

/**
 * @route   GET /api/students/converted
 * @desc    Get all converted students
 * @access  Private (All authenticated users)
 * @permissions student:read
 */
router.get('/converted',
  authenticateToken,
  authorizePermissions(['student:read']),
  safeControllerMethod(studentController, 'getConvertedStudents')
);

/**
 * @route   GET /api/students/conversion-analytics
 * @desc    Get student conversion analytics
 * @access  Private (All authenticated users)
 * @permissions student:read
 */
router.get('/conversion-analytics',
  authenticateToken,
  authorizePermissions(['student:read']),
  safeControllerMethod(studentController, 'getStudentConversionAnalytics')
);

/**
 * @route   GET /api/students/conversion-stats/:studentId?
 * @desc    Get student conversion statistics
 * @access  Private (All authenticated users)
 * @params  {studentId?} - Optional student ID
 * @permissions student:read
 */
router.get('/conversion-stats/:studentId?',
  authenticateToken,
  authorizePermissions(['student:read']),
  safeControllerMethod(studentController, 'getStudentConversionStats')
);

// ======================
// CRUD OPERATIONS
// ======================

/**
 * @route   POST /api/students/sync-status
 * @desc    Bulk sync student status based on class assignment
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @permissions student:update
 */
router.post('/sync-status',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:update']),
  auditLog('BULK_UPDATE', 'Student'),
  studentController.syncStudentStatus.bind(studentController)
);

/**
 * @route   POST /api/students
 * @desc    Create a new student
 * @access  Public (No authentication required)
 * @body    StudentCreateSchema
 */
router.post('/',
  studentCreationLimit,
  studentController.createStudent.bind(studentController)
);

/**
 * @route   GET /api/students
 * @desc    Get students with pagination and filters
 * @access  Private (All authenticated users)
 * @query   StudentSearchSchema
 * @permissions student:read
 */
router.get('/',
  authenticateToken,
  authorizePermissions(['student:read']),
  studentSearchLimiter,
  validateQuery(StudentSearchSchema),
  // studentListCacheMiddleware, // Temporarily disabled for debugging
  studentController.getStudents.bind(studentController)
);

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @query   {include} - Comma-separated list of relations to include
 * @permissions student:read
 */
router.get('/:id',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentCacheMiddleware,
  studentController.getStudentById.bind(studentController)
);

/**
 * @route   PUT /api/students/:id
 * @desc    Update student
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @params  {id} - Student ID
 * @body    StudentUpdateSchema
 * @permissions student:update
 */
router.put('/:id',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  validateBody(StudentUpdateSchema),
  authorizeStudentAccess('id'),
  auditLog('UPDATE', 'Student'),
  studentController.updateStudent.bind(studentController)
);

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student (soft delete)
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @params  {id} - Student ID
 * @permissions student:delete
 */
router.delete('/:id',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:delete']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  auditLog('DELETE', 'Student'),
  studentController.deleteStudent.bind(studentController)
);

/**
 * @route   PATCH /api/students/:id/restore
 * @desc    Restore deleted student
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @params  {id} - Student ID
 * @permissions student:restore
 */
router.patch('/:id/restore',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:restore']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  auditLog('RESTORE', 'Student'),
  studentController.restoreStudent.bind(studentController)
);

// ======================
// STATISTICS & ANALYTICS
// ======================

/**
 * @route   GET /api/students/:id/stats
 * @desc    Get student statistics
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/stats',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  async (req, res, next) => {
    try {
      await studentStatsCacheMiddleware(req, res, next);
    } catch (error) {
      next(error);
    }
  },
  studentController.getStudentStats.bind(studentController)
);

/**
 * @route   GET /api/students/:id/analytics
 * @desc    Get student analytics
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @query   {period} - Analytics period (7d, 30d, 90d, 1y)
 * @permissions student:analytics
 */
router.get('/:id/analytics',
  authenticateToken,
  authorizePermissions(['student:analytics']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  analyticsLimiter,
  studentController.getStudentAnalytics.bind(studentController)
);

/**
 * @route   GET /api/students/:id/performance
 * @desc    Get student performance metrics
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/performance',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentPerformance.bind(studentController)
);

// ======================
// CARD GENERATION ROUTES
// ======================

/**
 * @route   GET /api/students/:studentId/card
 * @desc    Generate and download student card as file
 * @access  Private (ADMIN, TEACHER, STAFF)
 * @params  {studentId} - Student ID
 * @permissions student:read
 */
router.get('/:studentId/card',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STAFF']),
  authorizePermissions(['student:read']),
  generalLimiter,
  safeControllerMethod(studentController, 'generateStudentCard')
);

/**
 * @route   GET /api/students/:studentId/card/download
 * @desc    Generate and download student card as file
 * @access  Private (ADMIN, TEACHER, STAFF)
 * @params  {studentId} - Student ID
 * @permissions student:read
 */
router.get('/:studentId/card/download',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STAFF']),
  authorizePermissions(['student:read']),
  generalLimiter,
  safeControllerMethod(studentController, 'downloadStudentCard')
);

/**
 * @route   GET /api/students/:studentId/card/base64
 * @desc    Generate student card as base64 image data
 * @access  Private (ADMIN, TEACHER, STAFF)
 * @params  {studentId} - Student ID
 * @permissions student:read
 */
router.get('/:studentId/card/base64',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STAFF']),
  authorizePermissions(['student:read']),
  generalLimiter,
  safeControllerMethod(studentController, 'generateStudentCardBase64')
);

/**
 * @route   GET /api/students/:studentId/card/count
 * @desc    Get student card print count
 * @access  Private (ADMIN, TEACHER, STAFF)
 * @params  {studentId} - Student ID
 * @permissions student:read
 */
router.get('/:studentId/card/count',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STAFF']),
  authorizePermissions(['student:read']),
  generalLimiter,
  safeControllerMethod(studentController, 'getStudentCardPrintCount')
);

/**
 * @route   GET /api/students/:id/transfer-certificate
 * @desc    Get student transfer certificate data
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, PRINCIPAL)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/transfer-certificate',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL']),
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  generalLimiter,
  safeControllerMethod(studentController, 'getStudentTransferCertificate')
);

/**
 * @route   POST /api/students/:id/transfer
 * @desc    Transfer student (mark as transferred and no longer active)
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, PRINCIPAL)
 * @params  {id} - Student ID
 * @body    {transferDate, transferReason, transferredToSchool, remarks}
 * @permissions student:update
 */
router.post('/:id/transfer',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  auditLog('TRANSFER', 'Student'),
  safeControllerMethod(studentController, 'transferStudent')
);

// ======================
// IMAGE UPLOAD ROUTES
// ======================

/**
 * @route   POST /api/students/:studentId/avatar
 * @desc    Upload student avatar image
 * @access  Private (ADMIN, TEACHER, STAFF)
 * @params  {studentId} - Student ID
 * @body    {avatar} - Image file
 * @permissions student:update
 */
router.post('/:studentId/avatar',
  authenticateToken,
  authorizeRoles(['ADMIN', 'TEACHER', 'STAFF']),
  authorizePermissions(['student:update']),
  generalLimiter,
  debugUpload,
  handleUploadErrors,
  processUploadedFile,
  safeControllerMethod(studentController, 'uploadStudentAvatar')
);

/**
 * @route   GET /api/students/:studentId/avatar
 * @desc    Get student avatar image
 * @access  Public (for image loading)
 * @params  {studentId} - Student ID
 */
router.get('/:studentId/avatar',
  generalLimiter,
  safeControllerMethod(studentController, 'getStudentAvatar')
);

/**
 * @route   DELETE /api/students/:studentId/avatar
 * @desc    Delete student avatar image
 * @access  Private (ADMIN, TEACHER, STAFF)
 * @params  {studentId} - Student ID
 * @permissions student:update
 */
router.delete('/:studentId/avatar',
  authenticateToken,
  authorizeRoles(['ADMIN', 'TEACHER', 'STAFF']),
  authorizePermissions(['student:update']),
  generalLimiter,
  safeControllerMethod(studentController, 'deleteStudentAvatar')
);

// ======================
// BULK OPERATIONS
// ======================

/**
 * @route   POST /api/students/bulk/create
 * @desc    Bulk create students
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @body    {students: StudentCreateSchema[]}
 * @permissions student:create
 */
router.post('/bulk/create',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:create']),
  // bulkLimiter, // REMOVED - No rate limiting for bulk student creation
  auditLog('BULK_CREATE', 'Student'),
  studentCreationLimit,
  studentController.bulkCreateStudents.bind(studentController)
);

/**
 * @route   PUT /api/students/bulk/update
 * @desc    Bulk update students
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @body    {updates: StudentUpdateSchema[]}
 * @permissions student:update
 */
router.put('/bulk/update',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:update']),
  // bulkLimiter, // REMOVED - No rate limiting for bulk student update
  auditLog('BULK_UPDATE', 'Student'),
  studentController.bulkUpdateStudents.bind(studentController)
);

/**
 * @route   DELETE /api/students/bulk/delete
 * @desc    Bulk delete students
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @body    {studentIds: number[]}
 * @permissions student:delete
 */
router.delete('/bulk/delete',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:delete']),
  // bulkLimiter, // REMOVED - No rate limiting for bulk student delete
  auditLog('BULK_DELETE', 'Student'),
  studentController.bulkDeleteStudents.bind(studentController)
);

// ======================
// SEARCH & FILTER
// ======================

/**
 * @route   GET /api/students/search
 * @desc    Search students with advanced filters
 * @access  Private (All authenticated users)
 * @query   StudentSearchSchema
 * @permissions student:read
 */
router.get('/search',
  authenticateToken,
  authorizePermissions(['student:read']),
  studentSearchLimiter,
  validateQuery(StudentSearchSchema),
  studentController.searchStudents.bind(studentController)
);

// ======================
// EXPORT & IMPORT
// ======================

/**
 * @route   GET /api/students/export
 * @desc    Export students data
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @query   {format} - Export format (json, csv)
 * @query   {...StudentSearchSchema} - Filters for export
 * @permissions student:export
 */
router.get('/export',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:export']),
  exportLimiter,
  studentController.exportStudents.bind(studentController)
);

/**
 * @route   POST /api/students/import
 * @desc    Import students data
 * @access  Private (SUPER_ADMIN)
 * @body    {students: StudentCreateSchema[], user: User}
 * @permissions student:import
 */
router.post('/import',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  authorizePermissions(['student:import']),
  // bulkLimiter, // REMOVED - No rate limiting for student import
  auditLog('IMPORT', 'Student'),
  studentController.importStudents.bind(studentController)
);

// ======================
// UTILITY ENDPOINTS
// ======================

/**
 * @route   GET /api/students/suggestions/code
 * @desc    Generate student code suggestions
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @query   {name} - Student name for code generation
 * @query   {schoolId} - School ID
 * @permissions student:create
 */
router.get('/suggestions/code',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:create']),
  studentController.generateCodeSuggestions.bind(studentController)
);

/**
 * @route   GET /api/students/stats/class
 * @desc    Get student count by class
 * @access  Private (All authenticated users)
 * @query   {schoolId} - Optional school ID filter
 * @permissions student:read
 */
router.get('/stats/class',
  authenticateToken,
  authorizePermissions(['student:read']),
  studentCacheMiddleware(1800), // 30 minutes cache
  studentController.getStudentCountByClass.bind(studentController)
);

/**
 * @route   GET /api/students/stats/status
 * @desc    Get student count by status
 * @access  Private (All authenticated users)
 * @query   {schoolId} - Optional school ID filter
 * @permissions student:read
 */
router.get('/stats/status',
  authenticateToken,
  authorizePermissions(['student:read']),
  studentCacheMiddleware(1800), // 30 minutes cache
  studentController.getStudentCountByStatus.bind(studentController)
);

/**
 * @route   GET /api/students/school/:schoolId
 * @desc    Get students by school
 * @access  Private (All authenticated users)
 * @params  {schoolId} - School ID
 * @query   {include} - Comma-separated list of relations to include
 * @permissions student:read
 */
router.get('/school/:schoolId',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams({ schoolId: idSchema.shape.id }),
  authorizeSchoolAccess('schoolId'),
  studentController.getStudentsBySchool.bind(studentController)
);

/**
 * @route   GET /api/students/class/:classId
 * @desc    Get students by class
 * @access  Private (All authenticated users)
 * @params  {classId} - Class ID
 * @query   {include} - Comma-separated list of relations to include
 * @permissions student:read
 */
router.get('/class/:classId',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(z.object({ classId: idSchema.shape.id })),
  studentController.getStudentsByClass.bind(studentController)
);

/**
 * @route   GET /api/students/:id/dashboard
 * @desc    Get student dashboard data
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/dashboard',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentDashboard.bind(studentController)
);

/**
 * @route   GET /api/students/:id/attendance
 * @desc    Get student attendance records
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read or student:read_children
 */
router.get('/:id/attendance',
  authenticateToken,
  (req, res, next) => {
    // Allow PARENT users to bypass permission check - they'll be validated in authorizeStudentAccess
    if (req.user.role === 'PARENT') {
      return next();
    }
    // For other roles, check permissions
    return authorizePermissions(['student:read'])(req, res, next);
  },
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentAttendance.bind(studentController)
);

/**
 * @route   GET /api/students/:id/grades
 * @desc    Get student grades (alias to grades by student)
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions grade:read or grade:read_children
 */
router.get('/:id/grades',
  authenticateToken,
  (req, res, next) => {
    // Allow PARENT users to bypass permission check - they'll be validated in authorizeStudentAccess
    if (req.user.role === 'PARENT') {
      return next();
    }
    // For other roles, check permissions
    return authorizePermissions(['grade:read'])(req, res, next);
  },
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  (req, res, next) => {
    // Proxy to gradeController.getGradesByStudent expecting param studentId
    req.params.studentId = req.params.id;
    return gradeController.getGradesByStudent(req, res, next);
  }
);

/**
 * @route   GET /api/students/:id/academic-progress
 * @desc    Get student academic progress (alias to grades by student)
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read or grade:read (PARENT bypass)
 */
router.get('/:id/academic-progress',
  authenticateToken,
  (req, res, next) => {
    // Allow PARENT users to bypass permission check - they'll be validated in authorizeStudentAccess
    if (req.user.role === 'PARENT') {
      return next();
    }
    // For other roles, require student:read or grade:read
    return authorizePermissions(['student:read'])(req, res, (err) => {
      if (err) return next(err);
      return authorizePermissions(['grade:read'])(req, res, next);
    });
  },
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  (req, res, next) => {
    // Reuse grades by student for academic progress
    req.params.studentId = req.params.id;
    return gradeController.getGradesByStudent(req, res, next);
  }
);

/**
 * @route   GET /api/students/:id/fees/history
 * @desc    Get student payment history
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions payment:read
 */
router.get('/:id/fees/history',
  authenticateToken,
  (req, res, next) => {
    // Allow PARENT users to bypass permission check - they'll be validated in authorizeStudentAccess
    if (req.user.role === 'PARENT') {
      return next();
    }
    // For other roles, check permissions
    return authorizePermissions(['payment:read'])(req, res, next);
  },
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  (req, res, next) => {
    // Proxy to paymentController.getStudentPayments expecting param studentId
    req.params.studentId = req.params.id;
    return paymentController.getStudentPayments(req, res, next);
  }
);

/**
 * @route   GET /api/students/:id/exams/upcoming
 * @desc    Get upcoming exams for a student
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions exam:read
 */
router.get('/:id/exams/upcoming',
  authenticateToken,
  (req, res, next) => {
    // Allow PARENT users to bypass permission check - they'll be validated in authorizeStudentAccess
    if (req.user.role === 'PARENT') {
      return next();
    }
    // For other roles, check permissions
    return authorizePermissions(['exam:read'])(req, res, next);
  },
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  async (req, res) => {
    // Minimal implementation placeholder; integrate with exam timetable if available
    return res.json({ success: true, data: [] });
  }
);

/**
 * @route   PUT /api/students/:id/attendance
 * @desc    Update student attendance
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @params  {id} - Student ID
 * @permissions student:update
 */
router.put('/:id/attendance',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  auditLog('UPDATE', 'StudentAttendance'),
  studentController.updateStudentAttendance.bind(studentController)
);

/**
 * @route   GET /api/students/:id/behavior
 * @desc    Get student behavior records
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/behavior',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentBehavior.bind(studentController)
);

/**
 * @route   POST /api/students/:id/behavior
 * @desc    Add student behavior record
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @params  {id} - Student ID
 * @permissions student:update
 */
router.post('/:id/behavior',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  auditLog('CREATE', 'StudentBehavior'),
  studentController.addStudentBehavior.bind(studentController)
);

/**
 * @route   GET /api/students/:id/documents
 * @desc    Get student documents
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/documents',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentDocuments.bind(studentController)
);

/**
 * @route   POST /api/students/:id/documents
 * @desc    Upload single student document
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @params  {id} - Student ID
 * @body    {file} - Document file (multipart/form-data)
 * @body    {documentType} - Document type (optional, defaults to OTHER)
 * @body    {title} - Document title (optional)
 * @body    {description} - Document description (optional)
 * @permissions student:update
 */
router.post('/:id/documents',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  uploadStudentDocuments.single('document'),
  handleDocumentUploadErrors,
  studentDocumentStorageLimit,
  auditLog('CREATE', 'StudentDocument'),
  studentController.uploadStudentDocument.bind(studentController)
);

/**
 * @route   POST /api/students/:id/documents/bulk
 * @desc    Upload multiple student documents (supports various document types)
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @params  {id} - Student ID
 * @body    Multiple files with field names: studentTazkira, fatherTazkira, motherTazkira, 
 *          transferLetter, admissionLetter, academicRecord, profilePicture, 
 *          birthCertificate, medicalRecords, other (multipart/form-data)
 * @permissions student:update
 * @example
 * FormData fields:
 * - studentTazkira: [file1, file2] (max 5 files)
 * - fatherTazkira: [file] (max 5 files)
 * - academicRecord: [file1, file2, file3] (max 10 files)
 */
router.post('/:id/documents/bulk',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  uploadStudentDocuments.fields(studentDocumentFields),
  debugDocumentUpload,
  handleDocumentUploadErrors,
  studentDocumentStorageLimit,
  processUploadedDocuments,
  auditLog('CREATE', 'StudentDocuments'),
  studentController.uploadStudentDocuments.bind(studentController)
);

/**
 * @route   GET /api/students/:id/documents/by-type
 * @desc    Get student documents filtered by type
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @query   {type} - Document type (optional filter)
 * @permissions student:read
 */
router.get('/:id/documents/by-type',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentDocumentsByType.bind(studentController)
);

/**
 * @route   DELETE /api/students/:id/documents/:documentId
 * @desc    Delete a student document
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @params  {id} - Student ID
 * @params  {documentId} - Document ID
 * @permissions student:update
 */
router.delete('/:id/documents/:documentId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:update']),
  authorizeStudentAccess('id'),
  auditLog('DELETE', 'StudentDocument'),
  studentController.deleteStudentDocument.bind(studentController)
);

/**
 * @route   GET /api/students/:id/documents/:documentId/download
 * @desc    Download a student document
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @params  {documentId} - Document ID
 * @permissions student:read
 */
router.get('/:id/documents/:documentId/download',
  authenticateToken,
  authorizePermissions(['student:read']),
  authorizeStudentAccess('id'),
  studentController.downloadStudentDocument.bind(studentController)
);

/**
 * @route   GET /api/students/:id/financials
 * @desc    Get student financial records
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/financials',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentFinancials.bind(studentController)
);

/**
 * @route   PUT /api/students/:id/financials
 * @desc    Update student financial records
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN)
 * @params  {id} - Student ID
 * @permissions student:update
 */
router.put('/:id/financials',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  auditLog('UPDATE', 'StudentFinancials'),
  studentController.updateStudentFinancials.bind(studentController)
);

/**
 * @route   GET /api/students/:id/health
 * @desc    Get student health records
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @permissions student:read
 */
router.get('/:id/health',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  studentController.getStudentHealth.bind(studentController)
);

/**
 * @route   POST /api/students/:id/health
 * @desc    Add student health record
 * @access  Private (SUPER_ADMIN, SCHOOL_ADMIN, TEACHER)
 * @params  {id} - Student ID
 * @permissions student:update
 */
router.post('/:id/health',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['student:update']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  auditLog('CREATE', 'StudentHealth'),
  studentController.addStudentHealthRecord.bind(studentController)
);

/**
 * @route   GET /api/students/:id/schedule
 * @desc    Get student schedule/timetable
 * @access  Private (All authenticated users)
 * @params  {id} - Student ID
 * @query   {date?} - Optional date filter (YYYY-MM-DD)
 * @permissions student:read
 */
router.get('/:id/schedule',
  authenticateToken,
  authorizePermissions(['student:read']),
  validateParams(idSchema),
  authorizeStudentAccess('id'),
  safeControllerMethod(studentController, 'getStudentSchedule')
);

/**
 * @route   GET /api/students/:id/assignments
 * @desc    Get assignments for a specific student
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT)
 */
router.get('/:id/assignments',
  authenticateToken,
  authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT']),
  validateParams(idSchema),
  async (req, res) => {
    // Set studentId in params for the assignment controller
    req.params.studentId = req.params.id;
    await assignmentController.getStudentAssignments(req, res);
  }
);

/**
 * @route   GET /api/students/:id/activities
 * @desc    Get activities for a specific student
 * @access  Private (ADMIN, SCHOOL_ADMIN, TEACHER, PARENT, STUDENT)
 */
router.get('/:id/activities',
  authenticateToken,
  authorizeRoles(['ADMIN', 'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT']),
  validateParams(idSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { PrismaClient } = await import('../generated/prisma/index.js');
      const prisma = new PrismaClient();
      
      const studentIdBigInt = BigInt(id);
      
      // Get recent activities
      const [recentAttendances, recentAssignments, recentGrades, recentPayments] = await Promise.all([
        // Recent attendance records
        prisma.attendance.findMany({
          where: {
            studentId: studentIdBigInt,
            deletedAt: null
          },
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            class: {
              select: { name: true }
            }
          }
        }),
        
        // Recent assignments
        prisma.assignment.findMany({
          where: {
            class: {
              students: {
                some: {
                  id: studentIdBigInt
                }
              }
            },
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            class: { select: { name: true } },
            subject: { select: { name: true } },
            teacher: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        
        // Recent grades
        prisma.grade.findMany({
          where: {
            studentId: studentIdBigInt,
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            subject: { select: { name: true } }
          }
        }),
        
        // Recent payments
        prisma.payment.findMany({
          where: {
            studentId: studentIdBigInt,
            deletedAt: null
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);
      
      // Format activities
      const activities = [];
      
      recentAttendances.forEach(attendance => {
        activities.push({
          type: 'ATTENDANCE',
          id: attendance.id.toString(),
          title: `Attendance: ${attendance.status}`,
          description: `Class: ${attendance.class?.name || 'Unknown'}`,
          date: attendance.date,
          status: attendance.status,
          createdAt: attendance.createdAt
        });
      });
      
      recentAssignments.forEach(assignment => {
        activities.push({
          type: 'ASSIGNMENT',
          id: assignment.id.toString(),
          title: assignment.title,
          description: `${assignment.subject?.name || 'Unknown Subject'} - ${assignment.class?.name || 'Unknown Class'}`,
          date: assignment.dueDate,
          status: assignment.status,
          createdAt: assignment.createdAt
        });
      });
      
      recentGrades.forEach(grade => {
        activities.push({
          type: 'GRADE',
          id: grade.id.toString(),
          title: `Grade: ${grade.score || grade.grade}`,
          description: `Subject: ${grade.subject?.name || 'Unknown'}`,
          date: grade.createdAt,
          score: grade.score,
          grade: grade.grade,
          createdAt: grade.createdAt
        });
      });
      
      recentPayments.forEach(payment => {
        activities.push({
          type: 'PAYMENT',
          id: payment.id.toString(),
          title: `Payment: ${payment.amount}`,
          description: payment.description || 'Fee payment',
          date: payment.paymentDate || payment.createdAt,
          amount: payment.amount,
          status: payment.status,
          createdAt: payment.createdAt
        });
      });
      
      // Sort by date (most recent first)
      activities.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
      
      return res.json({
        success: true,
        data: activities.slice(0, 50) // Return top 50 activities
      });
      
    } catch (error) {
      console.error('Error fetching student activities:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch activities',
        error: error.message
      });
    }
  }
);

// ======================
// CACHE MANAGEMENT
// ======================

/**
 * @route   GET /api/students/cache/stats
 * @desc    Get cache statistics
 * @access  Private (SUPER_ADMIN)
 * @permissions system:cache_manage
 */
router.get('/cache/stats',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  authorizePermissions(['system:cache_manage']),
  studentController.getCacheStats.bind(studentController)
);

/**
 * @route   POST /api/students/cache/warm
 * @desc    Warm up cache
 * @access  Private (SUPER_ADMIN)
 * @body    {studentId?} - Optional specific student ID to warm
 * @body    {schoolId?} - Optional school ID to warm all students
 * @permissions system:cache_manage
 */
router.post('/cache/warm',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN']),
  authorizePermissions(['system:cache_manage']),
  cacheLimiter,
  studentController.warmCache.bind(studentController)
);


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
      method: req.method,
      url: req.originalUrl
    }
  });
});

// Global error handler
router.use((error, req, res, next) => {
  console.error('Student route error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    meta: {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
});

export default router; 