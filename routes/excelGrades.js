import express from 'express';
import { z } from 'zod';
import excelGradeController from '../controllers/excelGradeController.js';
import { 
  authenticateToken, 
  authorizeRoles, 
  authorizePermissions,
  auditLog
} from '../middleware/auth.js';
import { 
  validateRequest, 
  validateParams, 
  validateBody,
  sanitizeRequest,
  idSchema
} from '../middleware/validation.js';
import { 
  generalLimiter,
  bulkLimiter
} from '../middleware/rateLimit.js';

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeRequest);
router.use(generalLimiter);

// ==========================================
// EXCEL-LIKE GRADE MANAGEMENT ROUTES
// ==========================================

/**
 * @route   GET /api/excel-grades/class/:classId/exam-type/:examType
 * @desc    Get Excel-like grade sheet by exam TYPE (MIDTERM or FINAL)
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.get('/class/:classId/exam-type/:examType',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:read']),
  excelGradeController.getExcelGradeSheetByType.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/class/:classId/exam/:examId
 * @desc    Get Excel-like grade sheet for a class and exam (legacy)
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.get('/class/:classId/exam/:examId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:read']),
  excelGradeController.getExcelGradeSheet.bind(excelGradeController)
);

/**
 * @route   POST /api/excel-grades/class/:classId/exam-type/:examType/bulk-entry
 * @desc    Bulk entry of grades by exam TYPE (MIDTERM or FINAL) - Excel pattern
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.post('/class/:classId/exam-type/:examType/bulk-entry',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:create']),
  bulkLimiter,
  auditLog('BULK_GRADE_ENTRY', 'Grade'),
  excelGradeController.bulkGradeEntryByType.bind(excelGradeController)
);

/**
 * @route   POST /api/excel-grades/class/:classId/exam/:examId/bulk-entry
 * @desc    Bulk entry of grades for entire class (Excel-like) - legacy
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.post('/class/:classId/exam/:examId/bulk-entry',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:create']),
  bulkLimiter,
  auditLog('BULK_GRADE_ENTRY', 'Grade'),
  excelGradeController.bulkGradeEntry.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/student/:studentId/report-card
 * @desc    Generate Excel-like report card for student
 * @access  Private (All authenticated users)
 */
router.get('/student/:studentId/report-card',
  authenticateToken,
  authorizePermissions(['grade:read']),
  excelGradeController.generateReportCard.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/class/:classId/results-summary
 * @desc    Get Excel-like results summary (success/conditional/failed lists)
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.get('/class/:classId/results-summary',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:read']),
  excelGradeController.getResultsSummary.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/class/:classId/statistics
 * @desc    Calculate Excel-like statistics (averages, pass rates, etc)
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.get('/class/:classId/statistics',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:read']),
  excelGradeController.calculateStatistics.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/teacher/classes
 * @desc    Get teacher's classes with grade entry status
 * @access  Private (TEACHER)
 */
router.get('/teacher/classes',
  authenticateToken,
  authorizeRoles(['TEACHER', 'SCHOOL_ADMIN', 'SUPER_ADMIN']),
  excelGradeController.getTeacherClasses.bind(excelGradeController)
);

/**
 * @route   POST /api/excel-grades/calculate-final-results
 * @desc    Calculate final results for students (mid-term + annual)
 * @access  Private (SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.post('/calculate-final-results',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN']),
  authorizePermissions(['grade:update']),
  auditLog('CALCULATE_FINAL_RESULTS', 'Grade'),
  excelGradeController.calculateFinalResults.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/export/:classId/:examId
 * @desc    Export grades in Excel format
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.get('/export/:classId/:examId',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:export']),
  excelGradeController.exportToExcel.bind(excelGradeController)
);

/**
 * @route   POST /api/excel-grades/class/:classId/exam-type/:examType/subject-components
 * @desc    Save subject component marks (شقه sheet pattern)
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 * @body    {subjectId, marks: [{studentId, written, practical, activity, homework}]}
 */
router.post('/class/:classId/exam-type/:examType/subject-components',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:create']),
  bulkLimiter,
  auditLog('SAVE_COMPONENT_MARKS', 'Grade'),
  excelGradeController.saveSubjectComponentMarks.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/class/:classId/exam-type/:examType/subject/:subjectId/components
 * @desc    Get subject component marks (شقه sheet pattern)
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.get('/class/:classId/exam-type/:examType/subject/:subjectId/components',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:read']),
  excelGradeController.getSubjectComponentMarks.bind(excelGradeController)
);

/**
 * @route   GET /api/excel-grades/class/:classId/exam-type/:examType/headers
 * @desc    Get student list header metadata
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.get('/class/:classId/exam-type/:examType/headers',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:read']),
  excelGradeController.getStudentListHeader.bind(excelGradeController)
);

/**
 * @route   POST /api/excel-grades/class/:classId/exam-type/:examType/headers
 * @desc    Save student list header metadata
 * @access  Private (TEACHER, SCHOOL_ADMIN, SUPER_ADMIN)
 */
router.post('/class/:classId/exam-type/:examType/headers',
  authenticateToken,
  authorizeRoles(['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['grade:update']),
  excelGradeController.saveStudentListHeader.bind(excelGradeController)
);

export default router;

