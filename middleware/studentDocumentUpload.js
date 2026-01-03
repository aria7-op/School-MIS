import multer from 'multer';
import path from 'path';
import fs from 'fs';

/**
 * Enhanced document upload middleware for student documents
 * Supports multiple file types and creates organized folder structure:
 * uploads/students/{studentId}/{documentType}/filename.ext
 */

// Document type to folder name mapping
const DOCUMENT_TYPE_FOLDERS = {
  'studentTazkira': 'tazkira',
  'fatherTazkira': 'father_tazkira',
  'motherTazkira': 'mother_tazkira',
  'transferLetter': 'transfer_letters',
  'admissionLetter': 'admission_letters',
  'academicRecord': 'academic_records',
  'profilePicture': 'profile_pictures',
  'birthCertificate': 'birth_certificates',
  'medicalRecords': 'medical_records',
  'other': 'other_documents'
};

// Allowed file types and their MIME types
const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  // Documents
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  // Text
  'text/plain': ['.txt']
};

/**
 * Create directory structure for student documents
 */
const createStudentDocumentDir = (studentId, documentType) => {
  const folderName = DOCUMENT_TYPE_FOLDERS[documentType] || 'other_documents';
  const dirPath = path.join('uploads', 'students', studentId.toString(), folderName);
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  return dirPath;
};

/**
 * Multer storage configuration for student documents
 */
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      // Get studentId from params or body
      const studentId = req.params.studentId || req.params.id || req.body.studentId;
      
      if (!studentId) {
        return cb(new Error('Student ID is required for document upload'));
      }

      // Get document type from field name
      const documentType = file.fieldname;
      
      // Create and get directory path
      const dirPath = createStudentDocumentDir(studentId, documentType);
      
      cb(null, dirPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    try {
      // Create unique filename with timestamp
      const timestamp = Date.now();
      const randomString = Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9]/g, '_')
        .substring(0, 50); // Limit basename length
      
      const filename = `${baseName}_${timestamp}_${randomString}${ext}`;
      
      cb(null, filename);
    } catch (error) {
      cb(error);
    }
  }
});

/**
 * File filter to validate uploaded files
 */
const documentFileFilter = (req, file, cb) => {
  const mimeType = file.mimetype;
  
  if (ALLOWED_MIME_TYPES[mimeType]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${mimeType} is not allowed. Allowed types: PDF, Images (JPG, PNG, GIF, WebP), Word, Excel`), false);
  }
};

/**
 * Multer upload configuration for student documents
 */
export const uploadStudentDocuments = multer({
  storage: documentStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 20 // Maximum 20 files at once
  }
});

/**
 * Middleware to handle multiple document types
 * Usage: uploadStudentDocuments.fields([...documentFields])
 */
export const studentDocumentFields = [
  { name: 'studentTazkira', maxCount: 5 },
  { name: 'fatherTazkira', maxCount: 5 },
  { name: 'motherTazkira', maxCount: 5 },
  { name: 'transferLetter', maxCount: 3 },
  { name: 'admissionLetter', maxCount: 3 },
  { name: 'academicRecord', maxCount: 10 },
  { name: 'profilePicture', maxCount: 1 },
  { name: 'birthCertificate', maxCount: 3 },
  { name: 'medicalRecords', maxCount: 10 },
  { name: 'other', maxCount: 20 }
];

/**
 * Debug middleware for document uploads
 */
export const debugDocumentUpload = (req, res, next) => {
  console.log('📁 Document Upload Debug');
  console.log('Files:', req.files);
  console.log('Body:', req.body);
  console.log('Params:', req.params);
  console.log('StudentId:', req.params.studentId || req.params.id);
  next();
};

/**
 * Error handling middleware for document uploads
 */
export const handleDocumentUploadErrors = (error, req, res, next) => {
  console.error('❌ Document Upload Error:', error.message);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB per file.',
        error: 'FILE_TOO_LARGE'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 20 files at once.',
        error: 'TOO_MANY_FILES'
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

  if (error.message === 'Student ID is required for document upload') {
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
 * Process uploaded documents and prepare data for database
 */
export const processUploadedDocuments = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded',
      error: 'NO_FILES'
    });
  }

  // Organize file information by document type
  const processedDocuments = {};
  
  for (const [fieldName, files] of Object.entries(req.files)) {
    processedDocuments[fieldName] = files.map(file => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      relativePath: file.path.replace(/\\/g, '/'), // Normalize path separators
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));
  }

  // Attach processed documents to request
  req.processedDocuments = processedDocuments;
  
  next();
};

/**
 * Utility function to delete uploaded files (for cleanup on error)
 */
export const deleteUploadedFiles = (files) => {
  if (!files) return;
  
  const filesToDelete = Array.isArray(files) ? files : Object.values(files).flat();
  
  filesToDelete.forEach(file => {
    try {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
        console.log(`🗑️  Deleted file: ${file.path}`);
      }
    } catch (error) {
      console.error(`Failed to delete file ${file.path}:`, error.message);
    }
  });
};

/**
 * Get document type enum from field name
 */
export const getDocumentTypeEnum = (fieldName) => {
  const mapping = {
    'studentTazkira': 'ID_PROOF',
    'fatherTazkira': 'ID_PROOF',
    'motherTazkira': 'ID_PROOF',
    'transferLetter': 'TRANSFER_CERTIFICATE',
    'admissionLetter': 'OTHER',
    'academicRecord': 'MARKSHEET',
    'profilePicture': 'PHOTOGRAPH',
    'birthCertificate': 'BIRTH_CERTIFICATE',
    'medicalRecords': 'MEDICAL_CERTIFICATE',
    'other': 'OTHER'
  };
  
  return mapping[fieldName] || 'OTHER';
};

export default {
  uploadStudentDocuments,
  studentDocumentFields,
  debugDocumentUpload,
  handleDocumentUploadErrors,
  processUploadedDocuments,
  deleteUploadedFiles,
  getDocumentTypeEnum,
  createStudentDocumentDir,
  DOCUMENT_TYPE_FOLDERS,
  ALLOWED_MIME_TYPES
};































