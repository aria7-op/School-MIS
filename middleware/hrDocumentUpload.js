import multer from 'multer';
import path from 'path';
import fs from 'fs';

// HR Document Upload Middleware for Staff documents
// Structure: uploads/hr/{documentFolder}/{staffId}/filename.ext

// Map logical document types to folder names
const HR_DOCUMENT_FOLDERS = {
  cv: 'cv',
  degreeDocument: 'degrees',
  experienceDocument: 'experience',
  nationalIdCard: 'national-id',
  contractDocument: 'contracts',
  otherCertificates: 'certificates',
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
};

const ensureHrDir = (staffId, documentType) => {
  const folder = HR_DOCUMENT_FOLDERS[documentType] || 'other';
  const dirPath = path.join('uploads', 'hr', folder, String(staffId));
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
};

const hrDocumentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const staffId = req.params.id || req.body.staffId;
      const documentType = req.body.documentType; // cv, degreeDocument, ...
      if (!staffId) return cb(new Error('Staff ID is required for HR document upload'));
      if (!documentType || !HR_DOCUMENT_FOLDERS[documentType]) {
        return cb(new Error('Invalid or missing documentType'));
      }
      const dirPath = ensureHrDir(staffId, documentType);
      cb(null, dirPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname).toLowerCase();
      const base = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .substring(0, 60);
      cb(null, `${base}_${timestamp}${ext}`);
    } catch (err) {
      cb(err);
    }
  },
});

const hrDocumentFileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES[file.mimetype]) return cb(null, true);
  return cb(new Error('Only PDF, DOC/DOCX, and image files are allowed for HR documents'), false);
};

export const uploadHrDocument = multer({
  storage: hrDocumentStorage,
  fileFilter: hrDocumentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
}).single('documentFile'); // field name for file

export const handleHrDocumentUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Max 5MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, error: 'Unexpected file field for HR upload' });
    }
  }
  if (error.message?.includes('Invalid or missing documentType')) {
    return res.status(400).json({ success: false, error: 'Invalid or missing documentType' });
  }
  if (error.message?.includes('Staff ID is required')) {
    return res.status(400).json({ success: false, error: 'Staff ID is required for HR document upload' });
  }
  if (error.message?.includes('Only PDF')) {
    return res.status(400).json({ success: false, error: error.message });
  }
  next(error);
};

export const processHrDocument = (req, res, next) => {
  if (req.file) {
    req.hrDocument = {
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      relativePath: req.file.path.replace(/\\/g, '/'),
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedAt: new Date(),
    };
  }
  next();
};

export default {
  uploadHrDocument,
  handleHrDocumentUploadErrors,
  processHrDocument,
};
