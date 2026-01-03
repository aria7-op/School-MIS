import express from 'express';
import googleDriveController from '../controllers/googleDriveController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// ======================
// GOOGLE DRIVE ROUTES
// ======================

/**
 * @route   GET /api/google-drive/auth-url
 * @desc    Get Google Drive authentication URL
 * @access  Private (Authenticated users)
 */
router.get('/auth-url',
  authenticateToken,
  googleDriveController.getAuthUrl
);

/**
 * @route   GET /api/google-drive/callback
 * @desc    Handle Google OAuth callback
 * @access  Public (OAuth callback)
 */
router.get('/callback',
  googleDriveController.handleCallback
);

/**
 * @route   GET /api/google-drive/status
 * @desc    Get Google Drive connection status
 * @access  Private (Authenticated users)
 */
router.get('/status',
  authenticateToken,
  googleDriveController.getConnectionStatus
);

/**
 * @route   POST /api/google-drive/disconnect
 * @desc    Disconnect Google Drive
 * @access  Private (Authenticated users)
 */
router.post('/disconnect',
  authenticateToken,
  googleDriveController.disconnect
);

/**
 * @route   GET /api/google-drive/files
 * @desc    List files from Google Drive
 * @access  Private (Authenticated users)
 */
router.get('/files',
  authenticateToken,
  googleDriveController.listFiles
);

/**
 * @route   GET /api/google-drive/search
 * @desc    Search files in Google Drive
 * @access  Private (Authenticated users)
 */
router.get('/search',
  authenticateToken,
  googleDriveController.searchFiles
);

/**
 * @route   GET /api/google-drive/files/:fileId
 * @desc    Get file details from Google Drive
 * @access  Private (Authenticated users)
 */
router.get('/files/:fileId',
  authenticateToken,
  googleDriveController.getFile
);

/**
 * @route   GET /api/google-drive/files/:fileId/download
 * @desc    Download file from Google Drive
 * @access  Private (Authenticated users)
 */
router.get('/files/:fileId/download',
  authenticateToken,
  googleDriveController.downloadFile
);

export default router; 