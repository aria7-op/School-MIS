import prisma from '../utils/prismaClient.js';
import fs from 'fs-extra';
import path from 'path';
import { sanitizeFilename, validateFilePath } from '../middleware/fileSecurity.js';
import { logger } from '../utils/logger.js';

class FileController {
  /**
   * Get files for a bill
   */
  async getBillFiles(req, res) {
    try {
      const { billId } = req.params;
      const { schoolId } = req.user;

      const files = await prisma.file.findMany({
        where: {
          entityType: 'bill',
          entityId: BigInt(billId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: files.map(file => ({
          id: file.id.toString(),
          filename: file.filename,
          originalName: file.originalName,
          fileSize: file.fileSize.toString(),
          mimeType: file.mimeType,
          fileType: file.fileType,
          description: file.description,
          tags: file.tags,
          createdAt: file.createdAt
        }))
      });
    } catch (error) {
      logger.error('file:get-bill-files-error', error, {
        billId: req.params.billId,
        userId: req.user?.id,
        schoolId: req.user?.schoolId,
      });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * Download a file
   */
  async downloadFile(req, res) {
    try {
      const { fileId } = req.params;
      const { schoolId } = req.user;

      const file = await prisma.file.findFirst({
        where: {
          id: BigInt(fileId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        }
      });

      if (!file) {
        logger.downloadEvent('not_found', {
          fileId: req.params.fileId,
          userId: req.user?.id,
          schoolId: req.user?.schoolId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      const filePath = file.filePath;
      
      // Validate file path to prevent directory traversal
      const uploadsBaseDir = path.resolve(process.cwd(), 'uploads');
      const validation = validateFilePath(filePath, uploadsBaseDir);
      
      if (!validation.valid) {
        logger.anomaly('file:invalid-download-path', {
          fileId,
          filePath,
          userId: req.user.id,
          schoolId,
          error: validation.error,
        });
        logger.downloadEvent('denied', {
          fileId,
          filePath,
          userId: req.user.id,
          schoolId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          reason: validation.error,
        });
        
        // Record path traversal attempt
        const { securityMonitor } = await import('../services/securityMonitor.js');
        securityMonitor.recordEvent('file:path_traversal_attempt', {
          userId: req.user.id,
          ip: req.ip,
          filePath,
        });
        
        return res.status(403).json({ 
          success: false, 
          message: 'File access denied' 
        });
      }

      // Increment download count
      await prisma.file.update({
        where: { id: BigInt(fileId) },
        data: { downloadCount: { increment: 1 } }
      });

      // Log successful download
      logger.downloadEvent('success', {
        fileId,
        filePath: validation.safePath,
        userId: req.user.id,
        schoolId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const safeFilename = sanitizeFilename(file.originalName);
      res.download(validation.safePath, safeFilename);
    } catch (error) {
      logger.error('file:download-error', error, {
        fileId: req.params.fileId,
        userId: req.user?.id,
        schoolId: req.user?.schoolId,
      });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * View a file (for PDFs and images)
   */
  async viewFile(req, res) {
    try {
      const { fileId } = req.params;
      const { schoolId } = req.user;

      const file = await prisma.file.findFirst({
        where: {
          id: BigInt(fileId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        }
      });

      if (!file) {
        logger.downloadEvent('not_found', {
          fileId: req.params.fileId,
          userId: req.user?.id,
          schoolId: req.user?.schoolId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
        });
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      const filePath = file.filePath;
      
      // Validate file path to prevent directory traversal
      const uploadsBaseDir = path.resolve(process.cwd(), 'uploads');
      const validation = validateFilePath(filePath, uploadsBaseDir);
      
      if (!validation.valid) {
        logger.anomaly('file:invalid-view-path', {
          fileId,
          filePath,
          userId: req.user.id,
          schoolId,
          error: validation.error,
        });
        logger.downloadEvent('denied', {
          fileId,
          filePath,
          userId: req.user.id,
          schoolId,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          reason: validation.error,
        });
        
        // Record path traversal attempt
        const { securityMonitor } = await import('../services/securityMonitor.js');
        securityMonitor.recordEvent('file:path_traversal_attempt', {
          userId: req.user.id,
          ip: req.ip,
          filePath,
        });
        
        return res.status(403).json({ 
          success: false, 
          message: 'File access denied' 
        });
      }

      // Increment download count
      await prisma.file.update({
        where: { id: BigInt(fileId) },
        data: { downloadCount: { increment: 1 } }
      });

      // Log successful view
      logger.downloadEvent('success', {
        fileId,
        filePath: validation.safePath,
        userId: req.user.id,
        schoolId,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const safeFilename = sanitizeFilename(file.originalName);
      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
      
      const fileStream = fs.createReadStream(validation.safePath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error('file:view-error', error, {
        fileId: req.params.fileId,
        userId: req.user?.id,
        schoolId: req.user?.schoolId,
      });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(req, res) {
    try {
      const { fileId } = req.params;
      const { schoolId, id: userId } = req.user;

      const file = await prisma.file.findFirst({
        where: {
          id: BigInt(fileId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        }
      });

      if (!file) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }

      // Soft delete the file
      await prisma.file.update({
        where: { id: BigInt(fileId) },
        data: { 
          deletedAt: new Date(),
          updatedBy: BigInt(userId)
        }
      });

      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      logger.error('file:delete-error', error, {
        fileId: req.params.fileId,
        userId: req.user?.id,
        schoolId: req.user?.schoolId,
      });
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

export default new FileController(); 