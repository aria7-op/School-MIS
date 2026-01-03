import prisma from '../utils/prismaClient.js';
import logger from '../config/logger.js';
import { formatResponse, handleError } from '../utils/responseUtils.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

// ======================
// DOCUMENT TYPES FOR SCHOOLS
// ======================
const DOCUMENT_TYPES = {
  // Academic Documents
  ENROLLMENT_FORM: 'enrollment_form',
  ACADEMIC_RECORD: 'academic_record',
  TRANSCRIPT: 'transcript',
  CERTIFICATE: 'certificate',
  REPORT_CARD: 'report_card',
  ASSIGNMENT: 'assignment',
  PROJECT: 'project',
  
  // Administrative Documents
  ID_PROOF: 'id_proof',
  BIRTH_CERTIFICATE: 'birth_certificate',
  MEDICAL_RECORD: 'medical_record',
  IMMUNIZATION_RECORD: 'immunization_record',
  EMERGENCY_CONTACT: 'emergency_contact',
  CONSENT_FORM: 'consent_form',
  POLICY_DOCUMENT: 'policy_document',
  
  // Financial Documents
  FEE_STRUCTURE: 'fee_structure',
  PAYMENT_RECEIPT: 'payment_receipt',
  INVOICE: 'invoice',
  SCHOLARSHIP_DOCUMENT: 'scholarship_document',
  FINANCIAL_AID: 'financial_aid',
  
  // Communication Documents
  LETTER: 'letter',
  NOTICE: 'notice',
  ANNOUNCEMENT: 'announcement',
  NEWSLETTER: 'newsletter',
  SURVEY: 'survey',
  
  // Legal Documents
  CONTRACT: 'contract',
  AGREEMENT: 'agreement',
  WAIVER: 'waiver',
  COMPLAINT: 'complaint',
  
  // Other Documents
  PHOTO: 'photo',
  VIDEO: 'video',
  AUDIO: 'audio',
  PRESENTATION: 'presentation',
  SPREADSHEET: 'spreadsheet',
  OTHER: 'other'
};

// ======================
// DOCUMENT STATUS
// ======================
const DOCUMENT_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  ARCHIVED: 'archived'
};

// ======================
// DOCUMENT CATEGORIES
// ======================
const DOCUMENT_CATEGORIES = {
  ACADEMIC: 'academic',
  ADMINISTRATIVE: 'administrative',
  FINANCIAL: 'financial',
  COMMUNICATION: 'communication',
  LEGAL: 'legal',
  MEDICAL: 'medical',
  PERSONAL: 'personal',
  OTHER: 'other'
};

const convertBigInts = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(convertBigInts);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, convertBigInts(val)]));
  }
  return value;
};

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    logger.error(message, error);
  }
  return formatResponse(res, {
    success: false,
    message,
    data: null
  }, status);
};

const resolveDocumentScope = async (req, entityName) => {
  const scope = normalizeScopeWithSchool(
    await resolveManagedScope(req),
    toBigIntSafe(req.user?.schoolId)
  );
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const ensureCustomerAccessible = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureDocumentAccessible = async (documentId, scope) => {
  if (!documentId) return false;
  return verifyRecordInScope('customer_documents', documentId, scope, {
    useBranch: false,
    useCourse: false
  });
};

const applyDocumentScope = (scope, where = {}) => applyScopeToWhere({ ...where }, scope, {
  useCourse: false,
  useBranch: false
});

const normalizeDocumentMetadata = (metadata) => {
  if (!metadata) return null;
  if (typeof metadata === 'string') return metadata;
  if (typeof metadata === 'object') return JSON.stringify(metadata);
  return JSON.stringify({ value: metadata });
};

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags;
  if (typeof tags === 'string') return [tags];
  return [];
};

const normalizeDocumentPayload = (scope, payload = {}) => {
  const normalized = { ...payload };
  normalized.schoolId = toBigIntSafe(scope.schoolId);
  if ('metadata' in normalized) {
    normalized.metadata = normalizeDocumentMetadata(normalized.metadata);
  }
  if ('tags' in normalized) {
    normalized.tags = normalizeTags(normalized.tags);
  }
  return normalized;
};

class CustomerDocumentController {
  // ======================
  // GET CUSTOMER DOCUMENTS
  // ======================
  async getCustomerDocuments(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document list');
      const customerId = toBigIntOrNull(req.params.id);
      if (!customerId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer ID',
          data: null
        }, 400);
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return formatResponse(res, {
          success: false,
          message: 'Customer not found in the selected context',
          data: null
        }, 404);
      }
      const { 
        type, 
        category, 
        status, 
        search, 
        sortBy = 'createdAt', 
        sortOrder = 'desc',
        page = 1,
        limit = 20
      } = req.query;

      const baseWhere = {
        customerId
      };

      if (type) baseWhere.type = type;
      if (category) baseWhere.category = category;
      if (status) baseWhere.status = status;
      if (search) {
        baseWhere.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search } }
        ];
      }

      const whereClause = applyDocumentScope(scope, baseWhere);

      const documents = await prisma.customerDocument.findMany({
        where: whereClause,
        include: {
          customer: {
            include: {
              user: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          },
          _count: {
            select: {
              versions: true,
              shares: true,
              comments: true
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      });

      const total = await prisma.customerDocument.count({
        where: whereClause
      });

      return formatResponse(res, {
        success: true,
        message: 'Customer documents retrieved successfully',
        data: convertBigInts(documents),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        meta: {
          customerId: Number(customerId)
        }
      });

    } catch (error) {
      logger.error('Get customer documents error:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve customer documents');
    }
  }

  // ======================
  // UPLOAD DOCUMENT
  // ======================
  async uploadDocument(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document upload');
      const customerId = toBigIntOrNull(req.params.id);
      if (!customerId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer ID',
          data: null
        }, 400);
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return formatResponse(res, {
          success: false,
          message: 'Customer not found in the selected context',
          data: null
        }, 404);
      }

      const userId = toBigIntSafe(req.user?.id);
      const documentData = req.body;
      const file = req.file;

      if (!file) {
        return formatResponse(res, {
          success: false,
          message: 'No file uploaded',
          data: null
        }, 400);
      }

      // Validate required fields
      if (!documentData.title || !documentData.type) {
        return formatResponse(res, {
          success: false,
          message: 'Title and type are required',
          data: null
        }, 400);
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const filePath = path.join('uploads', 'documents', fileName);

      const baseDocumentData = normalizeDocumentPayload(scope, {
        title: documentData.title,
        description: documentData.description,
        type: documentData.type,
        category: documentData.category || this.getCategoryFromType(documentData.type),
        status: documentData.status || DOCUMENT_STATUS.DRAFT,
        tags: documentData.tags,
        metadata: documentData.metadata,
        expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : null,
        isPublic: documentData.isPublic || false,
        isConfidential: documentData.isConfidential || false
      });

      // Ensure upload directory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Move file to destination
      await fs.rename(file.path, filePath);

      // Create document record
      const document = await prisma.$transaction(async (tx) => {
        // Create main document
        const document = await tx.customerDocument.create({
          data: {
            customerId,
            ...baseDocumentData,
            uploadedBy: userId
          }
        });

        // Create initial version
        await tx.documentVersion.create({
          data: {
            documentId: document.id,
            versionNumber: 1,
            fileName: fileName,
            originalName: file.originalname,
            filePath: filePath,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: userId,
            changeLog: 'Initial version'
          }
        });

        return document;
      });

      // Get complete document data
      const completeDocument = await prisma.customerDocument.findUnique({
        where: { id: document.id },
        include: {
          customer: {
            include: {
              user: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            take: 1
          }
        }
      });

      return formatResponse(res, {
        success: true,
        message: 'Document uploaded successfully',
        data: convertBigInts(completeDocument),
        meta: {
          documentId: document.id,
          customerId: Number(customerId)
        }
      }, 201);

    } catch (error) {
      logger.error('Upload document error:', error);
      return respondWithScopedError(res, error, 'Failed to upload document');
    }
  }

  // ======================
  // GET DOCUMENT BY ID
  // ======================
  async getDocumentById(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document detail');
      const customerId = toBigIntOrNull(req.params.id);
      const documentId = toBigIntOrNull(req.params.documentId);
      if (!customerId || !documentId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid document or customer ID',
          data: null
        }, 400);
      }

      const [customerAccessible, documentAccessible] = await Promise.all([
        ensureCustomerAccessible(customerId, scope),
        ensureDocumentAccessible(documentId, scope)
      ]);

      if (!customerAccessible || !documentAccessible) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found in the selected context',
          data: null
        }, 404);
      }

      const document = await prisma.customerDocument.findFirst({
        where: applyDocumentScope(scope, {
          id: documentId,
          customerId
        }),
        include: {
          customer: {
            include: {
              user: true
            }
          },
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          reviewedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          versions: {
            orderBy: { versionNumber: 'desc' },
            include: {
              uploadedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          shares: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          comments: {
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      if (!document) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found',
          data: null
        }, 404);
      }

      return formatResponse(res, {
        success: true,
        message: 'Document retrieved successfully',
        data: convertBigInts(document)
      });

    } catch (error) {
      logger.error('Get document by ID error:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve document');
    }
  }

  // ======================
  // UPDATE DOCUMENT
  // ======================
  async updateDocument(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document update');
      const customerId = toBigIntOrNull(req.params.id);
      const documentId = toBigIntOrNull(req.params.documentId);
      if (!customerId || !documentId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer or document ID',
          data: null
        }, 400);
      }
      const userId = toBigIntSafe(req.user?.id);
      const updateData = req.body;
      const file = req.file;

      const [customerAccessible, documentAccessible] = await Promise.all([
        ensureCustomerAccessible(customerId, scope),
        ensureDocumentAccessible(documentId, scope)
      ]);

      if (!customerAccessible || !documentAccessible) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found in the selected context',
          data: null
        }, 404);
      }

      // Check if document exists
      const existingDocument = await prisma.customerDocument.findFirst({
        where: applyDocumentScope(scope, {
          id: documentId,
          customerId
        })
      });

      if (!existingDocument) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found',
          data: null
        }, 404);
      }

      const baseDocumentUpdates = normalizeDocumentPayload(scope, {
        title: updateData.title,
        description: updateData.description,
        type: updateData.type,
        category: updateData.category,
        status: updateData.status,
        tags: updateData.tags,
        metadata: updateData.metadata,
        expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : null,
        isPublic: updateData.isPublic,
        isConfidential: updateData.isConfidential
      });

      // Update document
      const document = await prisma.$transaction(async (tx) => {
        // Update main document
        const updatedDocument = await tx.customerDocument.update({
          where: { id: documentId },
          data: {
            ...baseDocumentUpdates,
            updatedBy: userId
          }
        });

        // If new file is uploaded, create new version
        if (file) {
          // Get current version number
          const currentVersion = await tx.documentVersion.findFirst({
            where: { documentId },
            orderBy: { versionNumber: 'desc' }
          });

          const newVersionNumber = (currentVersion?.versionNumber || 0) + 1;

          // Generate unique filename
          const fileExtension = path.extname(file.originalname);
          const fileName = `${uuidv4()}${fileExtension}`;
          const filePath = path.join('uploads', 'documents', fileName);

          // Ensure upload directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });

          // Move file to destination
          await fs.rename(file.path, filePath);

          // Create new version
          await tx.documentVersion.create({
            data: {
              documentId,
              versionNumber: newVersionNumber,
              fileName: fileName,
              originalName: file.originalname,
              filePath: filePath,
              fileSize: file.size,
              mimeType: file.mimetype,
              uploadedBy: userId,
              changeLog: updateData.changeLog || `Version ${newVersionNumber} uploaded`
            }
          });
        }

        return updatedDocument;
      });

      return formatResponse(res, {
        success: true,
        message: 'Document updated successfully',
        data: convertBigInts(document)
      });

    } catch (error) {
      logger.error('Update document error:', error);
      return respondWithScopedError(res, error, 'Failed to update document');
    }
  }

  // ======================
  // DELETE DOCUMENT
  // ======================
  async deleteDocument(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document delete');
      const customerId = toBigIntOrNull(req.params.id);
      const documentId = toBigIntOrNull(req.params.documentId);
      if (!customerId || !documentId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer or document ID',
          data: null
        }, 400);
      }

      const [customerAccessible, documentAccessible] = await Promise.all([
        ensureCustomerAccessible(customerId, scope),
        ensureDocumentAccessible(documentId, scope)
      ]);

      if (!customerAccessible || !documentAccessible) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found in the selected context',
          data: null
        }, 404);
      }

      const document = await prisma.customerDocument.findFirst({
        where: applyDocumentScope(scope, {
          id: documentId,
          customerId
        }),
        include: {
          versions: true
        }
      });

      if (!document) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found',
          data: null
        }, 404);
      }

      // Delete document and related data
      await prisma.$transaction(async (tx) => {
        // Delete file versions
        for (const version of document.versions) {
          try {
            await fs.unlink(version.filePath);
          } catch (error) {
            logger.warn(`Failed to delete file: ${version.filePath}`, error);
          }
        }

        await tx.documentActivity.deleteMany({
          where: { documentId }
        });
        await tx.documentComment.deleteMany({
          where: { documentId }
        });
        await tx.documentShare.deleteMany({
          where: { documentId }
        });
        await tx.documentVersion.deleteMany({
          where: { documentId }
        });
        await tx.customerDocument.delete({
          where: { id: documentId }
        });
      });

      return formatResponse(res, {
        success: true,
        message: 'Document deleted successfully',
        data: null
      });

    } catch (error) {
      logger.error('Delete document error:', error);
      return respondWithScopedError(res, error, 'Failed to delete document');
    }
  }

  // ======================
  // DOWNLOAD DOCUMENT
  // ======================
  async downloadDocument(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document download');
      const customerId = toBigIntOrNull(req.params.id);
      const documentId = toBigIntOrNull(req.params.documentId);
      if (!customerId || !documentId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer or document ID',
          data: null
        }, 400);
      }
      const userId = toBigIntSafe(req.user?.id);
      const { version } = req.query;

      const [customerAccessible, documentAccessible] = await Promise.all([
        ensureCustomerAccessible(customerId, scope),
        ensureDocumentAccessible(documentId, scope)
      ]);

      if (!customerAccessible || !documentAccessible) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found in the selected context',
          data: null
        }, 404);
      }

      // Get document with latest version
      const document = await prisma.customerDocument.findFirst({
        where: applyDocumentScope(scope, {
          id: documentId,
          customerId
        }),
        include: {
          versions: {
            orderBy: { versionNumber: 'desc' }
          }
        }
      });

      if (!document) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found',
          data: null
        }, 404);
      }

      // Get specific version or latest
      const documentVersion = version 
        ? document.versions.find(v => v.versionNumber === parseInt(version))
        : document.versions[0];

      if (!documentVersion) {
        return formatResponse(res, {
          success: false,
          message: 'Document version not found',
          data: null
        }, 404);
      }

      // Check if file exists
      try {
        await fs.access(documentVersion.filePath);
      } catch (error) {
        return formatResponse(res, {
          success: false,
          message: 'Document file not found',
          data: null
        }, 404);
      }

      // Log download activity
      await prisma.documentActivity.create({
        data: {
          documentId,
          userId,
          type: 'download',
          description: `Downloaded version ${documentVersion.versionNumber}`,
          metadata: {
            versionNumber: documentVersion.versionNumber,
            fileName: documentVersion.fileName
          }
        }
      });

      // Set response headers
      res.setHeader('Content-Type', documentVersion.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${documentVersion.originalName}"`);
      res.setHeader('Content-Length', documentVersion.fileSize);

      // Send file
      const fileStream = fs.createReadStream(documentVersion.filePath);
      fileStream.pipe(res);

    } catch (error) {
      logger.error('Download document error:', error);
      return respondWithScopedError(res, error, 'Failed to download document');
    }
  }

  // ======================
  // SHARE DOCUMENT
  // ======================
  async shareDocument(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document share');
      const customerId = toBigIntOrNull(req.params.id);
      const documentId = toBigIntOrNull(req.params.documentId);
      const userId = toBigIntSafe(req.user?.id);
      const { userIds, permissions, message } = req.body;

      if (!customerId || !documentId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer or document ID',
          data: null
        }, 400);
      }
      if (!Array.isArray(userIds) || userIds.length === 0) {
        return formatResponse(res, {
          success: false,
          message: 'No users provided for sharing',
          data: null
        }, 400);
      }

      const [customerAccessible, documentAccessible] = await Promise.all([
        ensureCustomerAccessible(customerId, scope),
        ensureDocumentAccessible(documentId, scope)
      ]);

      if (!customerAccessible || !documentAccessible) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found in the selected context',
          data: null
        }, 404);
      }

      // Check if document exists
      const document = await prisma.customerDocument.findFirst({
        where: applyDocumentScope(scope, {
          id: documentId,
          customerId
        })
      });

      if (!document) {
        return formatResponse(res, {
          success: false,
          message: 'Document not found',
          data: null
        }, 404);
      }

      const sanitizedUserIds = userIds
        .map(toBigIntOrNull)
        .filter(Boolean);

      if (sanitizedUserIds.length === 0) {
        return formatResponse(res, {
          success: false,
          message: 'No valid users provided for sharing',
          data: null
        }, 400);
      }

      // Create shares
      const shares = await prisma.$transaction(async (tx) => {
        const sharePromises = sanitizedUserIds.map(shareUserId => 
          tx.documentShare.create({
            data: {
              documentId,
              userId: shareUserId,
              sharedBy: userId,
              permissions: permissions || ['view'],
              message: message,
              expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null
            }
          })
        );

        return Promise.all(sharePromises);
      });

      // Log share activity
      await prisma.documentActivity.create({
        data: {
          documentId,
          userId,
          type: 'share',
          description: `Shared document with ${sanitizedUserIds.length} user(s)`,
          metadata: {
            sharedWith: sanitizedUserIds.map(id => id.toString()),
            permissions
          }
        }
      });

      return formatResponse(res, {
        success: true,
        message: 'Document shared successfully',
        data: convertBigInts(shares)
      });

    } catch (error) {
      logger.error('Share document error:', error);
      return respondWithScopedError(res, error, 'Failed to share document');
    }
  }

  // ======================
  // GET DOCUMENT ANALYTICS
  // ======================
  async getDocumentAnalytics(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer document analytics');
      const { period = '30d', customerId } = req.query;

      const customerIdBigInt = customerId ? toBigIntOrNull(customerId) : null;
      if (customerId && !customerIdBigInt) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer ID',
          data: null
        }, 400);
      }

      if (customerIdBigInt) {
        const accessible = await ensureCustomerAccessible(customerIdBigInt, scope);
        if (!accessible) {
          return formatResponse(res, {
            success: false,
            message: 'Customer not found in the selected context',
            data: null
          }, 404);
        }
      }

      const baseWhere = customerIdBigInt ? { customerId: customerIdBigInt } : {};
      const whereClause = applyDocumentScope(scope, baseWhere);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      whereClause.createdAt = {
        gte: startDate,
        lte: endDate
      };

      // Get document statistics
      const [
        totalDocuments,
        documentsByType,
        documentsByStatus,
        documentsByCategory,
        topUploaders,
        recentUploads,
        storageUsage
      ] = await Promise.all([
        // Total documents
        prisma.customerDocument.count({ where: whereClause }),
        
        // Documents by type
        prisma.customerDocument.groupBy({
          by: ['type'],
          where: whereClause,
          _count: { type: true }
        }),
        
        // Documents by status
        prisma.customerDocument.groupBy({
          by: ['status'],
          where: whereClause,
          _count: { status: true }
        }),
        
        // Documents by category
        prisma.customerDocument.groupBy({
          by: ['category'],
          where: whereClause,
          _count: { category: true }
        }),
        
        // Top uploaders
        prisma.customerDocument.groupBy({
          by: ['uploadedBy'],
          where: whereClause,
          _count: { uploadedBy: true }
        }),
        
        // Recent uploads
        prisma.customerDocument.findMany({
          where: whereClause,
          include: {
            customer: {
              select: {
                id: true,
                name: true
              }
            },
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }),
        
        // Storage usage
        prisma.documentVersion.aggregate({
          where: {
            document: whereClause
          },
          _sum: {
            fileSize: true
          }
        })
      ]);

      const analytics = {
        total: totalDocuments,
        byType: documentsByType.reduce((acc, item) => {
          acc[item.type] = item._count.type;
          return acc;
        }, {}),
        byStatus: documentsByStatus.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        byCategory: documentsByCategory.reduce((acc, item) => {
          acc[item.category] = item._count.category;
          return acc;
        }, {}),
        topUploaders: topUploaders
          .sort((a, b) => b._count.uploadedBy - a._count.uploadedBy)
          .slice(0, 10),
        recentUploads,
        storageUsage: storageUsage._sum.fileSize || 0
      };

      return formatResponse(res, {
        success: true,
        message: 'Document analytics retrieved successfully',
        data: convertBigInts(analytics),
        meta: {
          period,
          customerId: customerIdBigInt ? Number(customerIdBigInt) : null
        }
      });

    } catch (error) {
      logger.error('Get document analytics error:', error);
      return respondWithScopedError(res, error, 'Failed to retrieve document analytics');
    }
  }

  // ======================
  // BULK UPLOAD DOCUMENTS
  // ======================
  async bulkUploadDocuments(req, res) {
    try {
      const scope = await resolveDocumentScope(req, 'customer bulk document upload');
      const customerId = toBigIntOrNull(req.params.id);
      if (!customerId) {
        return formatResponse(res, {
          success: false,
          message: 'Invalid customer ID',
          data: null
        }, 400);
      }

      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return formatResponse(res, {
          success: false,
          message: 'Customer not found in the selected context',
          data: null
        }, 404);
      }

      const userId = toBigIntSafe(req.user?.id);
      const { documents } = req.body;
      const files = req.files;

      if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return formatResponse(res, {
          success: false,
          message: 'No documents provided',
          data: null
        }, 400);
      }

      const uploadedDocuments = [];
      const errors = [];

      // Process each document
      for (let i = 0; i < documents.length; i++) {
        try {
          const documentData = documents[i];
          const file = files ? files[i] : null;

          if (!file) {
            errors.push({
              index: i,
              error: 'No file provided'
            });
            continue;
          }

          // Generate unique filename
          const fileExtension = path.extname(file.originalname);
          const fileName = `${uuidv4()}${fileExtension}`;
          const filePath = path.join('uploads', 'documents', fileName);

          // Ensure upload directory exists
          await fs.mkdir(path.dirname(filePath), { recursive: true });

          // Move file to destination
          await fs.rename(file.path, filePath);

          const baseDocumentData = normalizeDocumentPayload(scope, {
            title: documentData.title,
            description: documentData.description,
            type: documentData.type,
            category: documentData.category || this.getCategoryFromType(documentData.type),
            status: documentData.status || DOCUMENT_STATUS.DRAFT,
            tags: documentData.tags,
            metadata: documentData.metadata,
            expiryDate: documentData.expiryDate ? new Date(documentData.expiryDate) : null,
            isPublic: documentData.isPublic || false,
            isConfidential: documentData.isConfidential || false
          });

          // Create document record
          const document = await prisma.$transaction(async (tx) => {
            // Create main document
            const document = await tx.customerDocument.create({
              data: {
                customerId,
                ...baseDocumentData,
                uploadedBy: userId
              }
            });

            // Create initial version
            await tx.documentVersion.create({
              data: {
                documentId: document.id,
                versionNumber: 1,
                fileName: fileName,
                originalName: file.originalname,
                filePath: filePath,
                fileSize: file.size,
                mimeType: file.mimetype,
                uploadedBy: userId,
                changeLog: 'Initial version'
              }
            });

            return document;
          });

          uploadedDocuments.push(document);

        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }

      return formatResponse(res, {
        success: true,
        message: 'Bulk upload completed',
        data: {
          uploaded: convertBigInts(uploadedDocuments),
          errors
        },
        meta: {
          total: documents.length,
          successful: uploadedDocuments.length,
          failed: errors.length,
          customerId: Number(customerId)
        }
      });

    } catch (error) {
      logger.error('Bulk upload documents error:', error);
      return respondWithScopedError(res, error, 'Failed to bulk upload documents');
    }
  }

  // ======================
  // HELPER METHODS
  // ======================
  getCategoryFromType(type) {
    const categoryMap = {
      // Academic
      [DOCUMENT_TYPES.ENROLLMENT_FORM]: DOCUMENT_CATEGORIES.ACADEMIC,
      [DOCUMENT_TYPES.ACADEMIC_RECORD]: DOCUMENT_CATEGORIES.ACADEMIC,
      [DOCUMENT_TYPES.TRANSCRIPT]: DOCUMENT_CATEGORIES.ACADEMIC,
      [DOCUMENT_TYPES.CERTIFICATE]: DOCUMENT_CATEGORIES.ACADEMIC,
      [DOCUMENT_TYPES.REPORT_CARD]: DOCUMENT_CATEGORIES.ACADEMIC,
      [DOCUMENT_TYPES.ASSIGNMENT]: DOCUMENT_CATEGORIES.ACADEMIC,
      [DOCUMENT_TYPES.PROJECT]: DOCUMENT_CATEGORIES.ACADEMIC,
      
      // Administrative
      [DOCUMENT_TYPES.ID_PROOF]: DOCUMENT_CATEGORIES.ADMINISTRATIVE,
      [DOCUMENT_TYPES.BIRTH_CERTIFICATE]: DOCUMENT_CATEGORIES.ADMINISTRATIVE,
      [DOCUMENT_TYPES.CONSENT_FORM]: DOCUMENT_CATEGORIES.ADMINISTRATIVE,
      [DOCUMENT_TYPES.POLICY_DOCUMENT]: DOCUMENT_CATEGORIES.ADMINISTRATIVE,
      
      // Financial
      [DOCUMENT_TYPES.FEE_STRUCTURE]: DOCUMENT_CATEGORIES.FINANCIAL,
      [DOCUMENT_TYPES.PAYMENT_RECEIPT]: DOCUMENT_CATEGORIES.FINANCIAL,
      [DOCUMENT_TYPES.INVOICE]: DOCUMENT_CATEGORIES.FINANCIAL,
      [DOCUMENT_TYPES.SCHOLARSHIP_DOCUMENT]: DOCUMENT_CATEGORIES.FINANCIAL,
      [DOCUMENT_TYPES.FINANCIAL_AID]: DOCUMENT_CATEGORIES.FINANCIAL,
      
      // Communication
      [DOCUMENT_TYPES.LETTER]: DOCUMENT_CATEGORIES.COMMUNICATION,
      [DOCUMENT_TYPES.NOTICE]: DOCUMENT_CATEGORIES.COMMUNICATION,
      [DOCUMENT_TYPES.ANNOUNCEMENT]: DOCUMENT_CATEGORIES.COMMUNICATION,
      [DOCUMENT_TYPES.NEWSLETTER]: DOCUMENT_CATEGORIES.COMMUNICATION,
      [DOCUMENT_TYPES.SURVEY]: DOCUMENT_CATEGORIES.COMMUNICATION,
      
      // Legal
      [DOCUMENT_TYPES.CONTRACT]: DOCUMENT_CATEGORIES.LEGAL,
      [DOCUMENT_TYPES.AGREEMENT]: DOCUMENT_CATEGORIES.LEGAL,
      [DOCUMENT_TYPES.WAIVER]: DOCUMENT_CATEGORIES.LEGAL,
      [DOCUMENT_TYPES.COMPLAINT]: DOCUMENT_CATEGORIES.LEGAL,
      
      // Medical
      [DOCUMENT_TYPES.MEDICAL_RECORD]: DOCUMENT_CATEGORIES.MEDICAL,
      [DOCUMENT_TYPES.IMMUNIZATION_RECORD]: DOCUMENT_CATEGORIES.MEDICAL,
      [DOCUMENT_TYPES.EMERGENCY_CONTACT]: DOCUMENT_CATEGORIES.MEDICAL,
      
      // Personal
      [DOCUMENT_TYPES.PHOTO]: DOCUMENT_CATEGORIES.PERSONAL,
      [DOCUMENT_TYPES.VIDEO]: DOCUMENT_CATEGORIES.PERSONAL,
      [DOCUMENT_TYPES.AUDIO]: DOCUMENT_CATEGORIES.PERSONAL
    };

    return categoryMap[type] || DOCUMENT_CATEGORIES.OTHER;
  }
}

export default new CustomerDocumentController(); 