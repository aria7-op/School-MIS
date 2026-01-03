import express from 'express';
import suggestionComplaintController from '../controllers/suggestionComplaintController.js';
import { authenticateToken, authorizeRoles, authorizePermissions } from '../middleware/auth.js';

const router = express.Router();

// ======================
// SUGGESTION/COMPLAINT ROUTES
// ======================

/**
 * @route   POST /api/suggestion-complaints
 * @desc    Create a new suggestion or complaint
 * @access  Private (PARENT, STUDENT, SCHOOL_ADMIN, TEACHER)
 *
 * Note: Previously PARENT-only; now allows other authenticated roles
 * to submit suggestions/complaints as well.
 */
router.post('/',
  authenticateToken,
  authorizeRoles(['PARENT', 'STUDENT', 'SCHOOL_ADMIN', 'TEACHER']),
  suggestionComplaintController.create
);

/**
 * @route   GET /api/suggestion-complaints/recipients
 * @desc    Get available teachers and admins for recipient selection
 * @access  Private (PARENT)
 * @query   {schoolId} - School ID
 */
router.get('/recipients',
  authenticateToken,
  authorizeRoles(['PARENT']),
  suggestionComplaintController.getRecipients
);

/**
 * @route   GET /api/suggestion-complaints/parent/:parentId
 * @desc    Get suggestions/complaints by parent
 * @access  Private (PARENT)
 * @query   {type} - Filter by type (SUGGESTION, COMPLAINT)
 * @query   {status} - Filter by status
 * @query   {page} - Page number
 * @query   {limit} - Items per page
 */
router.get('/parent/:parentId',
  authenticateToken,
  authorizeRoles(['PARENT']),
  suggestionComplaintController.getByParent
);

/**
 * @route   GET /api/suggestion-complaints/recipient/:recipientId
 * @desc    Get suggestions/complaints for a specific recipient (teacher or admin)
 * @access  Private (SCHOOL_ADMIN, TEACHER)
 * @query   {type} - Filter by type (SUGGESTION, COMPLAINT)
 * @query   {status} - Filter by status
 * @query   {page} - Page number
 * @query   {limit} - Items per page
 * @permissions suggestion-complaint:read
 */
router.get('/recipient/:recipientId',
  authenticateToken,
  authorizeRoles(['SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['suggestion-complaint:read']),
  suggestionComplaintController.getByRecipient
);

/**
 * @route   GET /api/suggestion-complaints/admin/all
 * @desc    Get all suggestions/complaints for admin
 * @access  Private (TEACHER - admin role)
 * @query   {recipientType} - Filter by recipient type (TEACHER, ADMIN)
 * @query   {type} - Filter by type (SUGGESTION, COMPLAINT)
 * @query   {status} - Filter by status
 * @query   {page} - Page number
 * @query   {limit} - Items per page
 * @permissions suggestion-complaint:read
 */
router.get('/admin/all',
  authenticateToken,
  authorizeRoles(['TEACHER']), // Admin role in this system
  authorizePermissions(['suggestion-complaint:read']),
  suggestionComplaintController.getAllForAdmin
);

/**
 * @route   POST /api/suggestion-complaints/:id/respond
 * @desc    Respond to a suggestion/complaint
 * @access  Private (SCHOOL_ADMIN, TEACHER)
 * @permissions suggestion-complaint:update
 */
router.post('/:id/respond',
  authenticateToken,
  authorizeRoles(['SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['suggestion-complaint:update']),
  suggestionComplaintController.respond
);

/**
 * @route   PUT /api/suggestion-complaints/:id/status
 * @desc    Update status of a suggestion/complaint
 * @access  Private (SCHOOL_ADMIN, TEACHER)
 * @permissions suggestion-complaint:update
 */
router.put('/:id/status',
  authenticateToken,
  authorizeRoles(['SCHOOL_ADMIN', 'TEACHER']),
  authorizePermissions(['suggestion-complaint:update']),
  suggestionComplaintController.updateStatus
);

export default router;
