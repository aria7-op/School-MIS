import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { createErrorResponse } from '../utils/responseUtils.js';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, ALLOWED_FILE_EXTENSIONS } from '../config/uploadConfig.js';
import { sanitizeFilename } from './fileSecurity.js';
import { scanFileBuffer } from '../utils/fileScanner.js';
import { logger } from '../utils/logger.js';
import { securityMonitor } from '../services/securityMonitor.js';
import { moveToQuarantine } from '../services/fileQuarantineService.js';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetDir = path.resolve('uploads/equipment');
    fs.ensureDir(targetDir)
      .then(() => cb(null, targetDir))
      .catch((err) => cb(err, targetDir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBaseName = sanitizeFilename(path.basename(file.originalname, ext));
    const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
    cb(null, `${safeBaseName || 'file'}-${uniqueSuffix}${ext}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (ALLOWED_FILE_TYPES.includes(mimetype) || 
      ALLOWED_FILE_EXTENSIONS.includes(extname)) {
    return cb(null, true);
  }

  const error = new Error(`File type not allowed: ${file.originalname}`);
  error.status = 400;
  cb(error);
};

// Configure multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE, // Defined in config
    files: 1 // Limit to single file upload
  }
});

// Middleware to handle upload errors
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json(
        createErrorResponse('File too large', 'File size exceeds the maximum allowed limit')
      );
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json(
        createErrorResponse('Too many files', 'Only single file uploads are allowed')
      );
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json(
        createErrorResponse('Unexpected file', 'Unexpected field in file upload')
      );
    }
  } else if (err) {
    // An unknown error occurred when uploading
    return res.status(400).json(
      createErrorResponse('Upload error', err.message)
    );
  }
  next();
};

// Middleware to validate file presence after upload
const validateFilePresence = (fieldName) => (req, res, next) => {
  if (!req.file) {
    return res.status(400).json(
      createErrorResponse('Missing file', `No ${fieldName} file was uploaded`)
    );
  }
  next();
};

// Middleware to process uploaded file
const processUploadedFile = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const buffer = await fs.readFile(req.file.path);
    req.file.buffer = buffer;
    const scanResult = await scanFileBuffer(req.file);

    if (scanResult?.hash) {
      req.file.sha256 = scanResult.hash;
    }

    const fileMeta = {
      path: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      filename: req.file.filename,
      sha256: req.file.sha256 || null,
      scanStatus: scanResult?.status,
      scanDetail: scanResult?.threat || scanResult?.error || scanResult?.raw || null,
    };

    if (scanResult?.status === 'infected') {
      await moveToQuarantine({
        filePath: req.file.path,
        originalName: req.file.originalname,
        reason: scanResult.threat || 'malware_detected',
        metadata: fileMeta,
      });

      logger.uploadEvent('quarantine', {
        userId: req.user?.id,
        schoolId: req.user?.schoolId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        filename: req.file.originalname,
        sha256: req.file.sha256,
        rejectionReason: scanResult.threat,
      });

      securityMonitor.recordEvent('upload:virus_detected', {
        userId: req.user?.id,
        ip: req.ip,
        threat: scanResult.threat,
      });

      return res.status(400).json(
        createErrorResponse(
          'File rejected',
          'Uploaded file contains malware and has been quarantined.'
        )
      );
    }

    if (scanResult?.status === 'error') {
      await moveToQuarantine({
        filePath: req.file.path,
        originalName: req.file.originalname,
        reason: scanResult.error || 'scan_error',
        metadata: fileMeta,
      });

      logger.uploadEvent('scan_failed', {
        userId: req.user?.id,
        schoolId: req.user?.schoolId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        filename: req.file.originalname,
        sha256: req.file.sha256,
        rejectionReason: scanResult.error || 'scan_failed',
      });

      securityMonitor.recordEvent('upload:scan_failure', {
        userId: req.user?.id,
        ip: req.ip,
        reason: scanResult.error,
      });

      return res.status(503).json(
        createErrorResponse(
          'Scan unavailable',
          'Unable to verify file safety. Please try again later.'
        )
      );
    }

    req.uploadedFile = {
      ...fileMeta,
    };

    delete req.file.buffer;
    return next();
  } catch (error) {
    logger.error('upload:processing-error', error, {
      filename: req.file?.filename,
      mimetype: req.file?.mimetype,
      size: req.file?.size,
    });
    if (req.file?.path) {
      await fs.remove(req.file.path).catch(() => {});
    }
    return res.status(500).json(
      createErrorResponse('Upload processing error', 'Failed to process uploaded file')
    );
  }
};

export {
  upload,
  handleUploadErrors,
  validateFilePresence,
  processUploadedFile
};