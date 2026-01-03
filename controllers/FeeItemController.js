import prisma from '../utils/prismaClient.js';
import { 
  validateFeeItemCreateData,
  validateFeeItemUpdateData,
  validateFeeItemBulkCreate,
  validateFeeItemBulkUpdate
} from '../validators/feeItemValidator.js';
import {
  createFeeItemAuditLog,
  calculateFeeItemTotal,
  groupFeeItemsByOptionalStatus,
  exportFeeItems,
  importFeeItems
} from '../utils/feeItemUtils.js';
import logger from '../config/logger.js';
import {
  resolveManagedScope,
  applyScopeToWhere,
  normalizeScopeWithSchool,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const convertBigInts = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (obj && typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Decimal') {
    return parseFloat(obj.toString());
  }
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigInts(value);
    }
    return converted;
  }
  return obj;
};

const resolveScopeOrReject = (scope, entityName = 'resource') => {
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const ensureFeeItemInScope = async (feeItemId, scope) => {
  if (!feeItemId) {
    return false;
  }
  return verifyRecordInScope('fee_items', feeItemId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensureFeeStructureInScope = async (feeStructureId, scope) => {
  if (!feeStructureId) {
    return false;
  }
  return verifyRecordInScope('fee_structures', feeStructureId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensurePaymentItemInScope = async (paymentItemId, scope) => {
  if (!paymentItemId) {
    return false;
  }
  return verifyRecordInScope('payment_items', paymentItemId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensureScopedFeeItemWhere = (scope, baseWhere = {}) => {
  const where = applyScopeToWhere({ ...baseWhere }, scope, { useCourse: true });
  return { where, empty: false };
};

const normalizeScopedIds = (scope, { branchId, courseId }) => {
  const requestedBranch = toBigIntOrNull(branchId);
  const requestedCourse = toBigIntOrNull(courseId);

  if (scope.branchId && requestedBranch && scope.branchId !== requestedBranch) {
    const error = new Error('Requested branch does not match selected branch context');
    error.statusCode = 403;
    throw error;
  }

  if (scope.courseId && requestedCourse && scope.courseId !== requestedCourse) {
    const error = new Error('Requested course does not match selected course context');
    error.statusCode = 403;
    throw error;
  }

  return {
    branchId: scope.branchId ?? requestedBranch ?? null,
    courseId: scope.courseId ?? requestedCourse ?? null
  };
};

const respondWithScopedError = (res, error, fallbackMessage = 'Operation failed') => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    logger.error(message, error);
  }
  return res.status(status).json({
    success: false,
    message
  });
};

class FeeItemController {
  /**
   * Create a new fee item
   */
  async createFeeItem(req, res) {
    try {
      const { error, value } = validateFeeItemCreateData(req.body);
      if (error) {
        return res.status(400).json({ 
          success: false, 
          message: error.details[0].message 
        });
      }
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item create');

      if (!prisma?.feeItem) {
        return res.status(501).json({ success: false, message: 'Fee item model not configured' });
      }

      const feeStructureAccessible = await ensureFeeStructureInScope(value.feeStructureId, scope);
      if (!feeStructureAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      const { branchId, courseId } = normalizeScopedIds(scope, {
        branchId: value.branchId,
        courseId: value.courseId
      });

      const feeItem = await prisma.feeItem.create({
        data: {
          ...value,
          branchId,
          courseId,
          schoolId: toBigIntSafe(scope.schoolId),
          createdBy: toBigIntSafe(req.user?.id)
        },
        include: {
          feeStructure: true,
          school: true,
          createdByUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      await createFeeItemAuditLog(
        feeItem.id,
        'created',
        null,
        feeItem,
        scope.schoolId?.toString(),
        req.user.id,
        req.ip,
        req.get('User-Agent')
      );

      res.status(201).json({
        success: true,
        message: 'Fee item created successfully',
        data: convertBigInts(feeItem)
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to create fee item');
    }
  }

  /**
   * Get fee item by ID
   */
  async getFeeItemById(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item detail');

      const feeItemId = toBigIntOrNull(req.params.id);
      if (!feeItemId) {
        return res.status(400).json({ success: false, message: 'Invalid fee item ID' });
      }

      const accessible = await ensureFeeItemInScope(feeItemId, scope);
      if (!accessible) {
        return res.status(404).json({ success: false, message: 'Fee item not found in the selected context' });
      }

      const { where } = ensureScopedFeeItemWhere(scope, { id: feeItemId, deletedAt: null });

      const feeItem = await prisma.feeItem.findFirst({
        where,
        include: {
          feeStructure: true,
          school: true,
          createdByUser: {
            select: { id: true, firstName: true, lastName: true }
          },
          updatedByUser: {
            select: { id: true, firstName: true, lastName: true }
          },
          paymentItems: {
            where: { deletedAt: null },
            include: {
              payment: true
            }
          }
        }
      });

      if (!feeItem) {
        return res.status(404).json({ success: false, message: 'Fee item not found' });
      }

      res.json({ 
        success: true, 
        data: convertBigInts(feeItem) 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch fee item');
    }
  }

  /**
   * Update fee item
   */
  async updateFeeItem(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item update');

      const feeItemId = toBigIntOrNull(req.params.id);
      if (!feeItemId) {
        return res.status(400).json({ success: false, message: 'Invalid fee item ID' });
      }

      const { error, value } = validateFeeItemUpdateData(req.body);

      if (error) {
        return res.status(400).json({ 
          success: false, 
          message: error.details[0].message 
        });
      }

      const accessible = await ensureFeeItemInScope(feeItemId, scope);
      if (!accessible) {
        return res.status(404).json({ success: false, message: 'Fee item not found in the selected context' });
      }

      const existingItem = await prisma.feeItem.findFirst({
        where: ensureScopedFeeItemWhere(scope, { id: feeItemId, deletedAt: null }).where
      });

      if (!existingItem) {
        return res.status(404).json({ success: false, message: 'Fee item not found' });
      }

      if (value.feeStructureId) {
        const structureAccessible = await ensureFeeStructureInScope(value.feeStructureId, scope);
        if (!structureAccessible) {
          return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
        }
      }

      const { branchId, courseId } = normalizeScopedIds(scope, {
        branchId: value.branchId ?? existingItem.branchId,
        courseId: value.courseId ?? existingItem.courseId
      });

      const updatedItem = await prisma.feeItem.update({
        where: { id: feeItemId },
        data: {
          ...value,
          branchId,
          courseId,
          updatedBy: toBigIntSafe(req.user?.id),
          updatedAt: new Date()
        },
        include: {
          feeStructure: true,
          school: true
        }
      });

      await createFeeItemAuditLog(
        feeItemId,
        'updated',
        existingItem,
        updatedItem,
        scope.schoolId?.toString(),
        req.user.id,
        req.ip,
        req.get('User-Agent')
      );

      res.json({
        success: true,
        message: 'Fee item updated successfully',
        data: convertBigInts(updatedItem)
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to update fee item');
    }
  }

  /**
   * Delete fee item (soft delete)
   */
  async deleteFeeItem(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item delete');

      const feeItemId = toBigIntOrNull(req.params.id);
      if (!feeItemId) {
        return res.status(400).json({ success: false, message: 'Invalid fee item ID' });
      }

      const feeItemAccessible = await ensureFeeItemInScope(feeItemId, scope);
      if (!feeItemAccessible) {
        return res.status(404).json({ success: false, message: 'Fee item not found in the selected context' });
      }

      const feeItem = await prisma.feeItem.findFirst({
        where: ensureScopedFeeItemWhere(scope, { id: feeItemId, deletedAt: null }).where
      });

      if (!feeItem) {
        return res.status(404).json({ success: false, message: 'Fee item not found' });
      }

      const paymentItemsCount = await prisma.paymentItem.count({
        where: {
          feeItemId: feeItemId,
          deletedAt: null
        }
      });

      if (paymentItemsCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete fee item with associated payment items'
        });
      }

      await prisma.feeItem.update({
        where: { id: feeItemId },
        data: {
          deletedAt: new Date(),
          updatedBy: toBigIntSafe(req.user?.id)
        }
      });

      await createFeeItemAuditLog(
        feeItemId,
        'deleted',
        feeItem,
        null,
        scope.schoolId?.toString(),
        req.user.id,
        req.ip,
        req.get('User-Agent')
      );

      res.json({ 
        success: true, 
        message: 'Fee item deleted successfully' 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to delete fee item');
    }
  }

  /**
   * Get all fee items with filtering and pagination
   */
  async getFeeItems(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item list');

      const {
        page = 1,
        limit = 10,
        feeStructureId,
        isOptional,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
      const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
      const skip = (pageNumber - 1) * pageSize;

      const baseWhere = { deletedAt: null };

      if (feeStructureId) {
        const structureId = toBigIntOrNull(feeStructureId);
        if (!structureId) {
          return res.status(400).json({ success: false, message: 'Invalid fee structure ID' });
        }
        const accessible = await ensureFeeStructureInScope(structureId, scope);
        if (!accessible) {
          return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
        }
        baseWhere.feeStructureId = structureId;
      }

      if (isOptional !== undefined) {
        baseWhere.isOptional = isOptional === 'true';
      }

      if (search) {
        baseWhere.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { feeStructure: { name: { contains: search, mode: 'insensitive' } } }
        ];
      }

      const { where } = ensureScopedFeeItemWhere(scope, baseWhere);

      const [feeItems, total] = await Promise.all([
        prisma.feeItem.findMany({
          where,
          include: {
            feeStructure: true,
            school: true,
            _count: { select: { paymentItems: true } }
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: pageSize
        }),
        prisma.feeItem.count({ where })
      ]);

      res.json({
        success: true,
        data: convertBigInts(feeItems),
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          pages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch fee items');
    }
  }

  /**
   * Get fee items by fee structure
   */
  async getFeeItemsByStructure(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee items by structure');

      const structureId = toBigIntOrNull(req.params.structureId);
      if (!structureId) {
        return res.status(400).json({ success: false, message: 'Invalid fee structure ID' });
      }

      const accessible = await ensureFeeStructureInScope(structureId, scope);
      if (!accessible) {
        return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
      }

      const feeItems = await prisma.feeItem.findMany({
        where: {
          ...ensureScopedFeeItemWhere(scope, { feeStructureId: structureId, deletedAt: null }).where
        },
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { paymentItems: true } }
        }
      });

      res.json({ 
        success: true, 
        data: convertBigInts(feeItems) 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch fee items');
    }
  }

  /**
   * Get fee items by school with optional filters
   */
  async getFeeItemsBySchool(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee items by school');

      const { isOptional, dueDate } = req.query;

      const baseWhere = { deletedAt: null };
      if (isOptional !== undefined) {
        baseWhere.isOptional = isOptional === 'true';
      }
      if (dueDate) {
        const parsedDate = new Date(dueDate);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({ success: false, message: 'Invalid due date' });
        }
        baseWhere.dueDate = parsedDate;
      }

      const { where } = ensureScopedFeeItemWhere(scope, baseWhere);

      const feeItems = await prisma.feeItem.findMany({
        where,
        orderBy: { name: 'asc' },
        include: {
          feeStructure: {
            include: {
              class: true
            }
          },
          _count: { select: { paymentItems: true } }
        }
      });

      res.json({ 
        success: true, 
        data: convertBigInts(feeItems) 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch fee items');
    }
  }

  /**
   * Get upcoming due fee items
   */
  async getUpcomingDueItems(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'upcoming fee items');

      const days = parseInt(req.query.days, 10) || 30;

      const today = new Date();
      const endDate = new Date();
      endDate.setDate(today.getDate() + days);

      const feeItems = await prisma.feeItem.findMany({
        where: ensureScopedFeeItemWhere(scope, {
          dueDate: {
            gte: today,
            lte: endDate
          },
          deletedAt: null
        }).where,
        orderBy: { dueDate: 'asc' },
        include: {
          feeStructure: {
            include: {
              class: true
            }
          }
        }
      });

      res.json({ 
        success: true, 
        data: convertBigInts(feeItems) 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch upcoming due fee items');
    }
  }

  /**
   * Get overdue fee items
   */
  async getOverdueItems(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'overdue fee items');
      const today = new Date();

      const feeItems = await prisma.feeItem.findMany({
        where: ensureScopedFeeItemWhere(scope, {
          dueDate: {
            lt: today,
            not: null
          },
          deletedAt: null
        }).where,
        orderBy: { dueDate: 'asc' },
        include: {
          feeStructure: {
            include: {
              class: true
            }
          }
        }
      });

      res.json({ 
        success: true, 
        data: convertBigInts(feeItems) 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch overdue fee items');
    }
  }

  /**
   * Get fee item statistics
   */
  async getFeeItemStatistics(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item statistics');

      const scopedBase = ensureScopedFeeItemWhere(scope, { deletedAt: null }).where;

      const [
        totalItems,
        optionalItems,
        itemsWithDueDate,
        itemsWithoutDueDate,
        totalAmount,
        averageAmount
      ] = await Promise.all([
        prisma.feeItem.count({ where: scopedBase }),
        prisma.feeItem.count({
          where: ensureScopedFeeItemWhere(scope, { deletedAt: null, isOptional: true }).where
        }),
        prisma.feeItem.count({
          where: ensureScopedFeeItemWhere(scope, { deletedAt: null, dueDate: { not: null } }).where
        }),
        prisma.feeItem.count({
          where: ensureScopedFeeItemWhere(scope, { deletedAt: null, dueDate: null }).where
        }),
        prisma.feeItem.aggregate({
          where: scopedBase,
          _sum: { amount: true }
        }),
        prisma.feeItem.aggregate({
          where: scopedBase,
          _avg: { amount: true }
        })
      ]);

      res.json({
        success: true,
        data: {
          totalItems,
          optionalItems,
          requiredItems: totalItems - optionalItems,
          itemsWithDueDate,
          itemsWithoutDueDate,
          totalAmount: totalAmount?._sum?.amount ? Number(totalAmount._sum.amount) : 0,
          averageAmount: averageAmount?._avg?.amount ? Number(averageAmount._avg.amount) : 0
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch fee item statistics');
    }
  }

  /**
   * Bulk create fee items
   */
  async bulkCreateItems(req, res) {
     try {
       const { error, value } = validateFeeItemBulkCreate(req.body);
       if (error) {
         return res.status(400).json({ 
           success: false, 
           message: error.details[0].message 
         });
       }
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item bulk create');

      const { items } = value;
      const actorId = toBigIntSafe(req.user?.id);

      const structureIds = [...new Set(items.map(item => item.feeStructureId))]
        .map(toBigIntOrNull);

      if (structureIds.some(id => !id)) {
        return res.status(400).json({ success: false, message: 'Invalid fee structure ID in payload' });
      }

      for (const structureId of structureIds) {
        const accessible = await ensureFeeStructureInScope(structureId, scope);
        if (!accessible) {
          return res.status(404).json({ success: false, message: 'One or more fee structures not found in the selected context' });
        }
      }

      const createdItems = await prisma.$transaction(
        items.map((item) => {
          const structureId = toBigIntSafe(item.feeStructureId);
          const { branchId, courseId } = normalizeScopedIds(scope, item);

          return prisma.feeItem.create({
            data: {
              ...item,
              feeStructureId: structureId,
              schoolId: toBigIntSafe(scope.schoolId),
              branchId,
              courseId,
              createdBy: actorId
            },
            include: {
              feeStructure: true
            }
          });
        })
      );

      await Promise.all(
        createdItems.map(item =>
          createFeeItemAuditLog(
            item.id,
            'bulk_created',
            null,
            item,
            scope.schoolId?.toString(),
            req.user.id,
            req.ip,
            req.get('User-Agent')
          )
        )
      );

      res.status(201).json({
        success: true,
        message: `${createdItems.length} fee items created successfully`,
        data: convertBigInts(createdItems)
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to bulk create fee items');
    }
  }

  /**
   * Bulk update fee items
   */
  async bulkUpdateItems(req, res) {
     try {
       const { error, value } = validateFeeItemBulkUpdate(req.body);
       if (error) {
         return res.status(400).json({ 
           success: false, 
           message: error.details[0].message 
         });
       }
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item bulk update');

      const { updates } = value;
      const actorId = toBigIntSafe(req.user?.id);

      const results = [];
      for (const update of updates) {
        try {
          const feeItemId = toBigIntOrNull(update.id);
          if (!feeItemId) {
            results.push({ id: update.id, success: false, message: 'Invalid fee item ID' });
            continue;
          }

          const accessible = await ensureFeeItemInScope(feeItemId, scope);
          if (!accessible) {
            results.push({ id: update.id, success: false, message: 'Fee item not found in the selected context' });
            continue;
          }

          const feeItem = await prisma.feeItem.findFirst({
            where: ensureScopedFeeItemWhere(scope, { id: feeItemId, deletedAt: null }).where
          });

          if (!feeItem) {
            results.push({ id: update.id, success: false, message: 'Fee item not found' });
            continue;
          }

          if (update.data.feeStructureId) {
            const accessibleStructure = await ensureFeeStructureInScope(update.data.feeStructureId, scope);
            if (!accessibleStructure) {
              results.push({ id: update.id, success: false, message: 'Fee structure not found in the selected context' });
              continue;
            }
          }

          const { branchId, courseId } = normalizeScopedIds(scope, {
            branchId: update.data.branchId ?? feeItem.branchId,
            courseId: update.data.courseId ?? feeItem.courseId
          });

          const updatePayload = {
            ...update.data,
            branchId,
            courseId,
            updatedBy: actorId,
            updatedAt: new Date()
          };

          const updatedItem = await prisma.feeItem.update({
            where: { id: feeItemId },
            data: updatePayload
          });

          await createFeeItemAuditLog(
            feeItemId,
            'bulk_updated',
            feeItem,
            updatedItem,
            scope.schoolId?.toString(),
            req.user.id,
            req.ip,
            req.get('User-Agent')
          );

          results.push({ id: update.id, success: true, message: 'Updated successfully' });
        } catch (err) {
          results.push({ id: update.id, success: false, message: err.message });
        }
      }

      res.json({
        success: true,
        message: 'Bulk update completed',
        data: results
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to bulk update fee items');
    }
  }

  /**
   * Export fee items
   */
  async exportFeeItems(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item export');

      const { format = 'json' } = req.query;
 
      const feeItems = await prisma.feeItem.findMany({
        where: ensureScopedFeeItemWhere(scope, { deletedAt: null }).where,
        include: {
          feeStructure: true,
          school: true
        }
      });

      const exportedData = exportFeeItems(convertBigInts(feeItems));

      if (format === 'csv') {
        // Convert to CSV (simplified example)
        const headers = Object.keys(exportedData[0]).join(',');
        const csvRows = exportedData.map(item => 
          Object.values(item).map(val => 
            typeof val === 'object' ? JSON.stringify(val) : val
          ).join(',')
        );
        const csv = [headers, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=fee_items.csv');
        return res.send(csv);
      }

      // Default to JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=fee_items.json');
      res.json(exportedData);
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to export fee items');
    }
  }

  /**
   * Import fee items
   */
  async importFeeItems(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item import');
      const { items } = req.body;

      if (!Array.isArray(items)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid items format' 
        });
      }

      const structureIds = [...new Set(items.map(item => item.feeStructureId))].map(toBigIntOrNull);
      if (structureIds.some(id => !id)) {
        return res.status(400).json({ success: false, message: 'Invalid fee structure ID in import payload' });
      }

      for (const structureId of structureIds) {
        const accessible = await ensureFeeStructureInScope(structureId, scope);
        if (!accessible) {
          return res.status(404).json({ success: false, message: 'One or more fee structures not found in the selected context' });
        }
      }

      const preparedItems = items.map((item) => {
        const { branchId, courseId } = normalizeScopedIds(scope, item);
        return {
          ...item,
          branchId,
          courseId
        };
      });

      const importedItems = await importFeeItems(preparedItems, scope.schoolId?.toString(), req.user.id);

      // Create audit logs
      await Promise.all(
        importedItems.map(item => 
          createFeeItemAuditLog(
            item.id,
            'imported',
            null,
            item,
            scope.schoolId?.toString(),
            req.user.id,
            req.ip,
            req.get('User-Agent')
          )
        )
      );

      res.status(201).json({
        success: true,
        message: `${importedItems.length} fee items imported successfully`,
        data: convertBigInts(importedItems)
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to import fee items');
    }
  }

  /**
   * Get fee item history
   */
  async getFeeItemHistory(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item history');

      const feeItemId = toBigIntOrNull(req.params.id);
      if (!feeItemId) {
        return res.status(400).json({ success: false, message: 'Invalid fee item ID' });
      }

      const accessible = await ensureFeeItemInScope(feeItemId, scope);
      if (!accessible) {
        return res.status(404).json({ success: false, message: 'Fee item not found in the selected context' });
      }

      const history = await prisma.feeItemAuditLog.findMany({
        where: {
          feeItemId,
          schoolId: toBigIntSafe(scope.schoolId)
        },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      res.json({ 
        success: true, 
        data: convertBigInts(history) 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch fee item history');
    }
  }

  /**
   * Calculate totals for fee items
   */
  async calculateFeeItemTotals(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item totals');

      const { feeItemIds } = req.body;
 
      if (!Array.isArray(feeItemIds)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid fee item IDs format' 
        });
      }

      const feeItemIdsBigInt = feeItemIds.map(toBigIntOrNull);
      if (feeItemIdsBigInt.some(id => !id)) {
        return res.status(400).json({ success: false, message: 'Invalid fee item ID in list' });
      }

      for (const id of feeItemIdsBigInt) {
        const accessible = await ensureFeeItemInScope(id, scope);
        if (!accessible) {
          return res.status(404).json({ success: false, message: 'One or more fee items not found in the selected context' });
        }
      }

      const feeItems = await prisma.feeItem.findMany({
        where: ensureScopedFeeItemWhere(scope, {
          id: { in: feeItemIdsBigInt },
          deletedAt: null
        }).where
      });
 
      const total = calculateFeeItemTotal(feeItems);
      const grouped = groupFeeItemsByOptionalStatus(feeItems);
 
      res.json({
        success: true,
        data: {
          total,
          optionalTotal: calculateFeeItemTotal(grouped.optional),
          requiredTotal: calculateFeeItemTotal(grouped.required),
          itemCount: feeItems.length,
          optionalCount: grouped.optional.length,
          requiredCount: grouped.required.length
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to calculate fee item totals');
    }
  }

  /**
   * Restore deleted fee item
   */
  async restoreFeeItem(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item restore');

      const feeItemId = toBigIntOrNull(req.params.id);
      if (!feeItemId) {
        return res.status(400).json({ success: false, message: 'Invalid fee item ID' });
      }

      const feeItem = await prisma.feeItem.findFirst({
        where: ensureScopedFeeItemWhere(scope, {
          id: feeItemId,
          deletedAt: { not: null }
        }).where
      });

      if (!feeItem) {
        return res.status(404).json({ success: false, message: 'Fee item not found or not deleted' });
      }

      const restored = await prisma.feeItem.update({
        where: { id: feeItemId },
        data: { deletedAt: null, updatedBy: toBigIntSafe(req.user?.id), updatedAt: new Date() }
      });

      res.json({ success: true, message: 'Fee item restored successfully', data: convertBigInts(restored) });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to restore fee item');
    }
  }

  /**
   * Bulk delete fee items
   */
  async bulkDeleteItems(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item bulk delete');
      const { feeItemIds } = req.body;
      if (!Array.isArray(feeItemIds) || feeItemIds.length === 0) {
        return res.status(400).json({ success: false, message: 'feeItemIds must be a non-empty array' });
      }
      const results = [];
      for (const id of feeItemIds) {
        try {
          const feeItemId = toBigIntOrNull(id);
          if (!feeItemId) {
            results.push({ id, success: false, message: 'Invalid fee item ID' });
            continue;
          }
          const accessible = await ensureFeeItemInScope(feeItemId, scope);
          if (!accessible) {
            results.push({ id, success: false, message: 'Fee item not found in the selected context' });
            continue;
          }
          await prisma.feeItem.update({
            where: { id: feeItemId },
            data: { deletedAt: new Date(), updatedBy: toBigIntSafe(req.user?.id), updatedAt: new Date() }
          });
          results.push({ id, success: true, message: 'Deleted successfully' });
        } catch (error) {
          results.push({ id, success: false, message: error.message });
        }
      }
      res.json({ success: true, data: results });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to bulk delete fee items');
    }
  }

  /**
   * Get due date summary
   */
  async getDueDateSummary(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item due date summary');

      const { structureId } = req.query;

      let baseWhere = { deletedAt: null };
      if (structureId) {
        const structureBigInt = toBigIntOrNull(structureId);
        if (!structureBigInt) {
          return res.status(400).json({ success: false, message: 'Invalid fee structure ID' });
        }
        const accessible = await ensureFeeStructureInScope(structureBigInt, scope);
        if (!accessible) {
          return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
        }
        baseWhere.feeStructureId = structureBigInt;
      }

      const { where } = ensureScopedFeeItemWhere(scope, baseWhere);

      const items = await prisma.feeItem.findMany({
        where,
        select: { dueDate: true, id: true }
      });
      const summary = items.reduce((acc, item) => {
        const key = item.dueDate ? item.dueDate.toISOString().split('T')[0] : 'no_due_date';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});
      res.json({ success: true, data: summary });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to get due date summary');
    }
  }

  /**
   * Get optional items summary
   */
  async getOptionalItemsSummary(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'optional fee items summary');

      const { structureId } = req.query;

      const baseWhere = { deletedAt: null, isOptional: true };
      if (structureId) {
        const structureBigInt = toBigIntOrNull(structureId);
        if (!structureBigInt) {
          return res.status(400).json({ success: false, message: 'Invalid fee structure ID' });
        }
        const accessible = await ensureFeeStructureInScope(structureBigInt, scope);
        if (!accessible) {
          return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
        }
        baseWhere.feeStructureId = structureBigInt;
      }

      const { where } = ensureScopedFeeItemWhere(scope, baseWhere);

      const items = await prisma.feeItem.findMany({
        where,
        select: { id: true, name: true, amount: true, dueDate: true }
      });
      res.json({ success: true, data: convertBigInts(items) });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to get optional items summary');
    }
  }

  /**
   * Warm up fee item cache
   */
  async warmFeeItemCache(req, res) {
     try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item cache warm');

      const { structureId } = req.body;

      if (structureId) {
        const structureBigInt = toBigIntOrNull(structureId);
        if (!structureBigInt) {
          return res.status(400).json({ success: false, message: 'Invalid fee structure ID' });
        }
        const accessible = await ensureFeeStructureInScope(structureBigInt, scope);
        if (!accessible) {
          return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
        }
        await prisma.feeItem.findMany({
          where: ensureScopedFeeItemWhere(scope, { feeStructureId: structureBigInt, deletedAt: null }).where
        });
      } else {
        const structures = await prisma.feeStructure.findMany({
          where: applyScopeToWhere({ deletedAt: null }, scope, { useCourse: true }) ,
          select: { id: true }
        });
        for (const s of structures) {
          await prisma.feeItem.findMany({
            where: ensureScopedFeeItemWhere(scope, { feeStructureId: s.id, deletedAt: null }).where
          });
        }
      }
      res.json({ success: true, message: 'Fee item cache warmed up' });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to warm fee item cache');
    }
  }
}

// Export as a singleton instance
export default new FeeItemController();