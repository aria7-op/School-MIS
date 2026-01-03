import path from 'path';
import fs from 'fs-extra';
import { logger } from '../utils/logger.js';

/**
 * Sanitize filename to prevent path traversal and injection
 */
export const sanitizeFilename = (filename) => {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed_file';
  }

  // Remove path components
  const basename = path.basename(filename);
  
  // Remove null bytes and control characters
  let sanitized = basename.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove dangerous characters
  sanitized = sanitized.replace(/[<>:"|?*\\\/]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 255 - ext.length) + ext;
  }
  
  // Ensure it's not empty
  if (!sanitized || sanitized.trim() === '') {
    sanitized = 'unnamed_file';
  }
  
  return sanitized;
};

/**
 * Validate file path to prevent directory traversal
 */
export const validateFilePath = (filePath, baseDir) => {
  if (!filePath || typeof filePath !== 'string') {
    return { valid: false, error: 'Invalid file path' };
  }

  const resolvedBase = path.resolve(baseDir);

  const normalizeRelative = (input) => {
    let normalized = input.replace(/\\/g, '/');
    if (path.isAbsolute(normalized)) {
      normalized = path.relative('/', normalized);
    }
    normalized = normalized.replace(/^(\.\.(\/|\\|$))+/, '');
    normalized = normalized.replace(/^\/+/, '');
    return normalized;
  };

  const candidatePath = path.isAbsolute(filePath)
    ? path.resolve(filePath)
    : path.resolve(resolvedBase, normalizeRelative(filePath));

  if (!candidatePath.startsWith(resolvedBase)) {
    logger.anomaly('file:path-traversal-attempt', {
      attemptedPath: filePath,
      resolvedPath: candidatePath,
      baseDir: resolvedBase,
    });
    return { valid: false, error: 'Path traversal detected' };
  }

  if (!fs.existsSync(candidatePath)) {
    return { valid: false, error: 'File not found' };
  }

  const stats = fs.statSync(candidatePath);
  if (!stats.isFile()) {
    return { valid: false, error: 'Path is not a file' };
  }

  return { valid: true, safePath: candidatePath };
};

/**
 * Secure file download middleware
 */
export const secureFileDownload = (req, res, next) => {
  const { fileId } = req.params;
  
  // Validate fileId is numeric
  if (!fileId || !/^\d+$/.test(fileId)) {
    logger.anomaly('file:invalid-file-id', {
      fileId,
      userId: req.user?.id,
      ip: req.ip,
    });
    return res.status(400).json({
      success: false,
      error: 'INVALID_FILE_ID',
      message: 'Invalid file identifier',
    });
  }
  
  next();
};

/**
 * Secure static file serving middleware
 */
export const secureStaticFileServing = (baseDir) => {
  return async (req, res, next) => {
    // Require authentication for file access
    if (!req.user) {
      logger.anomaly('file:unauthorized-static-access', {
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
    }

    // Sanitize the requested path
    const requestedPath = path
      .normalize(req.path)
      .replace(/^(\.\.(\/|\\|$))+/, '')
      .replace(/^\/+/, '');
    const validation = validateFilePath(requestedPath, baseDir);
    
    if (!validation.valid) {
      logger.anomaly('file:invalid-path-access', {
        requestedPath: req.path,
        sanitized: requestedPath,
        userId: req.user.id,
        schoolId: req.user.schoolId,
        error: validation.error,
      });
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Access denied',
      });
    }

    // Set secure headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizeFilename(path.basename(validation.safePath))}"`);
    
    // Log file access
    logger.info('file:static-access', {
      filePath: validation.safePath,
      userId: req.user.id,
      schoolId: req.user.schoolId,
      ip: req.ip,
    });

    next();
  };
};

