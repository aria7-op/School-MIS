import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Leave Document Upload Middleware
 * Handles uploading leave documents for attendance records
 * Structure: uploads/attendance/leaves/{studentId}/{date}/document.pdf
 */

/**
 * Create directory structure for leave documents
 */
const createLeaveDocumentDir = (studentId, date) => {
  // Format date as YYYY-MM-DD
  const dateStr = new Date(date).toISOString().split('T')[0];
  const dirPath = path.join('uploads', 'attendance', 'leaves', studentId.toString(), dateStr);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  return dirPath;
};

/**
 * Multer storage configuration for leave documents
 */
const leaveDocumentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const studentId = req.body.studentId || req.params.studentId;
      const date = req.body.date || new Date().toISOString().split('T')[0];
      
      if (!studentId) {
        return cb(new Error('Student ID is required for leave document upload'));
      }

      const dirPath = createLeaveDocumentDir(studentId, date);
      cb(null, dirPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const sanitizedName = file.originalname
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 50);
      
      // Format: leave_document_TIMESTAMP.pdf
      const filename = `leave_document_${timestamp}${ext}`;
      
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  }
});

/**
 * File filter for leave documents
 */
const leaveDocumentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF and image files are allowed for leave documents'), false);
  }
};

/**
 * Multer upload configuration for leave documents
 * Note: Multer automatically parses text fields from multipart/form-data
 */
export const uploadLeaveDocument = multer({
  storage: leaveDocumentStorage,
  fileFilter: leaveDocumentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
    files: 1 // Only one document per leave request
  }
});

/**
 * Alternative: Handle optional file upload (works even without file)
 */
export const uploadLeaveDocumentOptional = multer({
  storage: leaveDocumentStorage,
  fileFilter: leaveDocumentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1
  }
}).single('leaveDocument');

/**
 * Debug middleware for leave document uploads
 */
export const debugLeaveDocumentUpload = (req, res, next) => {
  console.log('📄 Leave Document Upload Debug');
  console.log('File:', req.file);
  console.log('Body:', req.body);
  console.log('Body keys:', Object.keys(req.body));
  console.log('Params:', req.params);
  console.log('Content-Type:', req.headers['content-type']);
  next();
};

/**
 * Error handling middleware for leave document uploads
 */
export const handleLeaveDocumentUploadErrors = (error, req, res, next) => {
  console.error('❌ Leave Document Upload Error:', error.message);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name for file upload.',
        error: 'UNEXPECTED_FILE_FIELD',
        details: error.field
      });
    }
  }
  
  if (error.message && error.message.includes('not allowed')) {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'INVALID_FILE_TYPE'
    });
  }

  if (error.message === 'Student ID is required for leave document upload') {
    return res.status(400).json({
      success: false,
      message: error.message,
      error: 'MISSING_STUDENT_ID'
    });
  }

  // Pass other errors to next error handler
  next(error);
};

/**
 * Process uploaded leave document
 */
export const processLeaveDocument = (req, res, next) => {
  if (req.file) {
    req.leaveDocument = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      relativePath: req.file.path.replace(/\\/g, '/'),
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date()
    };
    console.log('📄 Leave document processed:', req.leaveDocument);
  }
  next();
};

export default {
  uploadLeaveDocument,
  debugLeaveDocumentUpload,
  handleLeaveDocumentUploadErrors,
  processLeaveDocument,
  createLeaveDocumentDir
};

