import fs from 'fs';
import path from 'path';

/**
 * File Management Utilities for Student Documents
 * Provides functions for managing file uploads, organization, and cleanup
 */

/**
 * Ensure directory exists, create if it doesn't
 * @param {string} dirPath - Directory path to check/create
 * @returns {boolean} - True if directory exists or was created successfully
 */
export const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
      return true;
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to create directory ${dirPath}:`, error.message);
    return false;
  }
};

/**
 * Get all files in a directory recursively
 * @param {string} dirPath - Directory path
 * @param {Array<string>} fileList - Accumulator for files (used internally)
 * @returns {Array<string>} - Array of file paths
 */
export const getAllFilesInDirectory = (dirPath, fileList = []) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return fileList;
    }

    const files = fs.readdirSync(dirPath);

    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        getAllFilesInDirectory(filePath, fileList);
      } else {
        fileList.push(filePath);
      }
    });

    return fileList;
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
    return fileList;
  }
};

/**
 * Get student document directory path
 * @param {number|string} studentId - Student ID
 * @param {string} documentType - Document type (optional)
 * @returns {string} - Directory path
 */
export const getStudentDocumentPath = (studentId, documentType = null) => {
  const basePath = path.join('uploads', 'students', studentId.toString());
  
  if (documentType) {
    return path.join(basePath, documentType);
  }
  
  return basePath;
};

/**
 * Delete a file if it exists
 * @param {string} filePath - File path to delete
 * @returns {boolean} - True if deleted successfully or file doesn't exist
 */
export const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted file: ${filePath}`);
      return true;
    }
    return true; // File doesn't exist, consider it "deleted"
  } catch (error) {
    console.error(`❌ Failed to delete file ${filePath}:`, error.message);
    return false;
  }
};

/**
 * Delete multiple files
 * @param {Array<string>} filePaths - Array of file paths to delete
 * @returns {Object} - Result object with success count and errors
 */
export const deleteMultipleFiles = (filePaths) => {
  const results = {
    deleted: 0,
    failed: 0,
    errors: []
  };

  filePaths.forEach(filePath => {
    if (deleteFile(filePath)) {
      results.deleted++;
    } else {
      results.failed++;
      results.errors.push(filePath);
    }
  });

  return results;
};

/**
 * Delete a directory and all its contents
 * @param {string} dirPath - Directory path to delete
 * @returns {boolean} - True if deleted successfully
 */
export const deleteDirectory = (dirPath) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️  Deleted directory: ${dirPath}`);
      return true;
    }
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete directory ${dirPath}:`, error.message);
    return false;
  }
};

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get directory size
 * @param {string} dirPath - Directory path
 * @returns {number} - Total size in bytes
 */
export const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  
  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = getAllFilesInDirectory(dirPath);
    
    files.forEach(file => {
      try {
        const stats = fs.statSync(file);
        totalSize += stats.size;
      } catch (error) {
        console.error(`Error getting size of ${file}:`, error.message);
      }
    });
  } catch (error) {
    console.error(`Error calculating directory size for ${dirPath}:`, error.message);
  }
  
  return totalSize;
};

/**
 * Count files in directory
 * @param {string} dirPath - Directory path
 * @param {boolean} recursive - Count files recursively
 * @returns {number} - Number of files
 */
export const countFilesInDirectory = (dirPath, recursive = false) => {
  try {
    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    if (recursive) {
      return getAllFilesInDirectory(dirPath).length;
    }

    const files = fs.readdirSync(dirPath);
    return files.filter(file => {
      const filePath = path.join(dirPath, file);
      return fs.statSync(filePath).isFile();
    }).length;
  } catch (error) {
    console.error(`Error counting files in ${dirPath}:`, error.message);
    return 0;
  }
};

/**
 * Get student document statistics
 * @param {number|string} studentId - Student ID
 * @returns {Object} - Statistics object
 */
export const getStudentDocumentStats = (studentId) => {
  const basePath = getStudentDocumentPath(studentId);
  
  const stats = {
    studentId: studentId.toString(),
    totalFiles: 0,
    totalSize: 0,
    formattedSize: '0 Bytes',
    documentTypes: {}
  };

  try {
    if (!fs.existsSync(basePath)) {
      return stats;
    }

    // Get all subdirectories (document types)
    const documentTypes = fs.readdirSync(basePath).filter(item => {
      const itemPath = path.join(basePath, item);
      return fs.statSync(itemPath).isDirectory();
    });

    documentTypes.forEach(docType => {
      const docTypePath = path.join(basePath, docType);
      const fileCount = countFilesInDirectory(docTypePath, true);
      const dirSize = getDirectorySize(docTypePath);
      
      stats.documentTypes[docType] = {
        fileCount,
        size: dirSize,
        formattedSize: formatFileSize(dirSize)
      };
      
      stats.totalFiles += fileCount;
      stats.totalSize += dirSize;
    });

    stats.formattedSize = formatFileSize(stats.totalSize);
  } catch (error) {
    console.error(`Error getting document stats for student ${studentId}:`, error.message);
  }

  return stats;
};

/**
 * Clean up orphaned files (files not referenced in database)
 * @param {number|string} studentId - Student ID
 * @param {Array<string>} validFilePaths - Array of valid file paths from database
 * @returns {Object} - Cleanup results
 */
export const cleanupOrphanedFiles = (studentId, validFilePaths) => {
  const basePath = getStudentDocumentPath(studentId);
  const results = {
    scanned: 0,
    deleted: 0,
    errors: []
  };

  try {
    if (!fs.existsSync(basePath)) {
      return results;
    }

    const allFiles = getAllFilesInDirectory(basePath);
    results.scanned = allFiles.length;

    // Normalize paths for comparison
    const normalizedValidPaths = validFilePaths.map(p => path.normalize(p));

    allFiles.forEach(filePath => {
      const normalizedPath = path.normalize(filePath);
      
      if (!normalizedValidPaths.includes(normalizedPath)) {
        if (deleteFile(filePath)) {
          results.deleted++;
        } else {
          results.errors.push(filePath);
        }
      }
    });
  } catch (error) {
    console.error(`Error cleaning up orphaned files for student ${studentId}:`, error.message);
    results.errors.push(error.message);
  }

  return results;
};

/**
 * Move file to new location
 * @param {string} sourcePath - Source file path
 * @param {string} destinationPath - Destination file path
 * @returns {boolean} - True if moved successfully
 */
export const moveFile = (sourcePath, destinationPath) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destinationPath);
    ensureDirectoryExists(destDir);

    // Move the file
    fs.renameSync(sourcePath, destinationPath);
    console.log(`📦 Moved file from ${sourcePath} to ${destinationPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to move file from ${sourcePath} to ${destinationPath}:`, error.message);
    return false;
  }
};

/**
 * Copy file to new location
 * @param {string} sourcePath - Source file path
 * @param {string} destinationPath - Destination file path
 * @returns {boolean} - True if copied successfully
 */
export const copyFile = (sourcePath, destinationPath) => {
  try {
    // Ensure destination directory exists
    const destDir = path.dirname(destinationPath);
    ensureDirectoryExists(destDir);

    // Copy the file
    fs.copyFileSync(sourcePath, destinationPath);
    console.log(`📋 Copied file from ${sourcePath} to ${destinationPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to copy file from ${sourcePath} to ${destinationPath}:`, error.message);
    return false;
  }
};

/**
 * Validate file type
 * @param {string} filename - File name
 * @param {Array<string>} allowedExtensions - Array of allowed extensions
 * @returns {boolean} - True if file type is allowed
 */
export const isAllowedFileType = (filename, allowedExtensions) => {
  const ext = path.extname(filename).toLowerCase();
  return allowedExtensions.includes(ext);
};

/**
 * Sanitize filename (remove dangerous characters)
 * @param {string} filename - Original filename
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  // Remove path separators and other dangerous characters
  return filename
    .replace(/[\/\\]/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255); // Limit filename length
};

/**
 * Generate unique filename
 * @param {string} originalFilename - Original filename
 * @returns {string} - Unique filename with timestamp
 */
export const generateUniqueFilename = (originalFilename) => {
  const timestamp = Date.now();
  const randomString = Math.round(Math.random() * 1E9);
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  const sanitizedBase = sanitizeFilename(baseName);
  
  return `${sanitizedBase}_${timestamp}_${randomString}${ext}`;
};

export default {
  ensureDirectoryExists,
  getAllFilesInDirectory,
  getStudentDocumentPath,
  deleteFile,
  deleteMultipleFiles,
  deleteDirectory,
  formatFileSize,
  getDirectorySize,
  countFilesInDirectory,
  getStudentDocumentStats,
  cleanupOrphanedFiles,
  moveFile,
  copyFile,
  isAllowedFileType,
  sanitizeFilename,
  generateUniqueFilename
};































