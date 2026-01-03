import express from 'express';
import multer from 'multer';
import { 
  getAllAttendances, 
  getAttendanceById, 
  createAttendance, 
  updateAttendance, 
  deleteAttendance,
  markInTime,
  markOutTime,
  bulkCreateAttendance,
  bulkOCRAttendance,
  getClassAttendanceSummary,
  getAttendanceSummary,
  getAttendanceStats,
  getAttendanceAnalytics,
  getMonthlyAttendanceMatrix,
  exportAttendanceData,
  // autoMarkAbsentStudents, // COMMENTED OUT: Automatic attendance marking is disabled
  markIncompleteAttendanceAsAbsent,
  getAttendanceTimeStatus,
  markStudentLeave,
  downloadLeaveDocument,
  resendAttendanceSMS,
  markStaffLeave
} from '../controllers/attendanceController.js';
import { authenticateToken, authorizePermissions, authorizeRolesOrPermissions, authorizeRoles } from '../middleware/auth.js';
import { 
  uploadLeaveDocument, 
  debugLeaveDocumentUpload, 
  handleLeaveDocumentUploadErrors,
  processLeaveDocument
} from '../middleware/leaveDocumentUpload.js';
import { enforceStorageLimit } from '../middleware/packageLimits.js';
// import { validateClassAccess } from '../middleware/validation.js';

const router = express.Router();

const leaveDocumentStorageLimit = enforceStorageLimit({
  byteCounter: (req) => Number(req.file?.size || 0),
  message:
    'Leave document upload exceeds the storage allocation for your subscription. Please upgrade your plan or remove existing files.',
});

// DEBUG: Always public, shows info about route setup
router.get('/debug-public', (req, res) => res.json({public: true, path: req.path, protected: false, message: 'attendance public route is UNPROTECTED'}));

// PUBLIC ENDPOINTS - NO AUTHENTICATION REQUIRED
// These must come BEFORE the global authentication middleware

// Mark student in-time (arrival) - NO AUTHENTICATION REQUIRED
router.post('/mark-in-time', markInTime);

// Mark student out-time (departure) - NO AUTHENTICATION REQUIRED
router.post('/mark-out-time', markOutTime);

// Get attendance time status - NO AUTHENTICATION REQUIRED
router.get('/time-status', getAttendanceTimeStatus);

// Test endpoint to verify basic functionality - NO AUTHENTICATION REQUIRED
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Attendance routes are working!',
    timestamp: new Date().toISOString()
  });
});

// PROTECTED ENDPOINTS - AUTHENTICATION REQUIRED
// All routes below require authentication
// Skip authentication for public endpoints that were already defined above
router.use((req, res, next) => {
  // These endpoints are public and should not require authentication
  const publicPaths = ['/mark-in-time', '/mark-out-time', '/time-status', '/test', '/debug-public', '/mark-leave'];
  if (publicPaths.some(path => req.path === path || req.path.endsWith(path))) {
    return next(); // Skip authentication for public paths (will be handled in route)
  }
  // Apply authentication to all other routes
  authenticateToken(req, res, next);
});

// Attendance Summary and Analytics
router.get('/summary', getAttendanceSummary);
router.get('/class-summary', getClassAttendanceSummary);
router.get('/stats', getAttendanceStats);
router.get('/analytics', getAttendanceAnalytics);
router.get('/monthly-matrix', getMonthlyAttendanceMatrix);

// CRUD Operations
router.get('/', getAllAttendances);
router.get('/:id', getAttendanceById);
router.post('/', createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', deleteAttendance);

// Bulk Operations
router.post('/bulk', bulkCreateAttendance);
router.post('/bulk-ocr', bulkOCRAttendance); // Bulk OCR attendance processing
router.post('/bulk-mark-incomplete-absent', markIncompleteAttendanceAsAbsent);

// Export
router.get('/export', exportAttendanceData);

// Mark incomplete attendance as absent (students without both inTime and outTime)
router.post('/mark-incomplete-absent', markIncompleteAttendanceAsAbsent);

/**
 * @route   POST /api/attendances/mark-leave
 * @desc    Mark student leave with optional document upload
 * @access  Private (authenticated users)
 * @body    {studentId, classId, date, reason, remarks}
 * @file    {leaveDocument} - Optional leave document (PDF/Image, max 5MB)
 * 
 * IMPORTANT: This route handles authentication AFTER multer processes the file
 * to avoid Content-Type header conflicts
 */
router.post('/mark-leave',
  uploadLeaveDocument.single('leaveDocument'),
  debugLeaveDocumentUpload,
  handleLeaveDocumentUploadErrors,
  authenticateToken,  // Auth AFTER multer
  leaveDocumentStorageLimit,
  processLeaveDocument,
  markStudentLeave
);

router.post('/staff/mark-leave',
  authenticateToken,
  authorizeRoles(['SUPER_DUPER_ADMIN', 'SUPER_ADMIN', 'SCHOOL_ADMIN', 'HRM']),
  markStaffLeave
);

/**
 * @route   GET /api/attendances/:id/leave-document
 * @desc    Download leave document for an attendance record
 * @access  Private (authenticated users)
 * @params  {id} - Attendance ID
 */
router.get('/:id/leave-document', downloadLeaveDocument);

/**
 * @route   POST /api/attendances/resend-sms
 * @desc    Resend SMS notification for an attendance record
 * @access  Private (authenticated users)
 * @body    {attendanceId, smsType} - smsType: 'in' or 'out'
 */
router.post('/resend-sms', resendAttendanceSMS);

export default router; 