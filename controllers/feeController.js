import prisma from '../utils/prismaClient.js';
import {
  validateFeeStructureData,
  validateFeeItemData,
  validateFeeAssignmentData,
  validateFeeBulkCreateData,
  validateFeeBulkUpdateData,
  validateFeeBulkDeleteData
} from '../validators/feeValidator.js';
import {
  createFeeLog,
  cacheFeeStructure,
  invalidateFeeCache,
  generateFeeStructureCode,
  analyzeFeeStructure,
  exportFeeStructure,
  importFeeStructure
} from '../utils/feeUtils.js';
import { 
  triggerEntityCreatedNotifications,
  triggerEntityUpdatedNotifications,
  triggerEntityDeletedNotifications,
  triggerBulkOperationNotifications
} from '../utils/notificationTriggers.js';
import logger from '../config/logger.js';
import {
  resolveManagedScope,
  applyScopeToWhere,
  appendScopeToSql,
  toBigIntSafe,
  normalizeScopeWithSchool,
  verifyRecordInScope,
  toBigIntOrNull
} from '../utils/contextScope.js';

const coerceOptionalId = (value) => toBigIntOrNull(value);

const resolveScopeOrReject = (scope, entityName = 'resource') => {
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const normalizeScopedIds = (scope, { branchId, courseId }) => {
  const requestedBranch = coerceOptionalId(branchId);
  const requestedCourse = coerceOptionalId(courseId);

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

const applyScopeToFeeWhere = (baseWhere, scope, options = {}) => {
  return applyScopeToWhere(baseWhere, scope, options);
};

const ensureClassInScope = async (classId, scope) => {
  if (!classId) {
    return true;
  }
  return verifyRecordInScope('classes', classId, scope, {
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

const ensureFeeItemInScope = async (feeItemId, scope) => {
  if (!feeItemId) {
    return false;
  }
  return verifyRecordInScope('fee_items', feeItemId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensureStudentInScope = async (studentId, scope) => {
  if (!studentId) {
    return false;
  }
  return verifyRecordInScope('students', studentId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const ensureFeeAssignmentInScope = async (assignmentId, scope) => {
  if (!assignmentId) {
    return false;
  }
  return verifyRecordInScope('fee_assignments', assignmentId, scope, {
    branchColumn: 'branchId',
    courseColumn: 'courseId'
  });
};

const respondWithScopedError = (res, error, fallbackMessage = 'Operation failed') => {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message
    });
  }
  logger.error(`${fallbackMessage}: ${error.message}`);
  return res.status(500).json({
    success: false,
    message: fallbackMessage
  });
};

class FeeController {
  /**
   * Create a new fee structure
   */
  async createFeeStructure(req, res) {
    try {
      const { error, value } = validateFeeStructureData(req.body);
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
      resolveScopeOrReject(scope, 'fee structure');

      const { branchId, courseId } = normalizeScopedIds(scope, {
        branchId: value.branchId,
        courseId: value.courseId
      });

      let academicSessionId = value.academicSessionId ? toBigIntSafe(value.academicSessionId) : null;
      if (!academicSessionId) {
        const school = await prisma.school.findUnique({
          where: { id: scope.schoolId },
          select: { academicSessionId: true }
        });
        academicSessionId = school?.academicSessionId ?? null;

        if (!academicSessionId) {
          return res.status(400).json({
            success: false,
            message: 'Academic session is required. Please provide academicSessionId or set a current session for the school.'
          });
        }
      }

      if (value.classId) {
        const classInScope = await ensureClassInScope(value.classId, scope);
        if (!classInScope) {
          return res.status(404).json({
            success: false,
            message: 'Class not found in the selected context'
          });
        }
      }

      const feeData = {
        ...value,
        branchId,
        courseId,
        academicSessionId: BigInt(academicSessionId),
        schoolId: scope.schoolId,
        createdBy: BigInt(req.user.id),
        classId: value.classId ? BigInt(value.classId) : null,
        code: await generateFeeStructureCode(scope.schoolId)
      };

      if (feeData.isDefault) {
        const existingDefault = await prisma.feeStructure.findFirst({
          where: applyScopeToFeeWhere(
            {
              classId: feeData.classId,
              academicSessionId: BigInt(academicSessionId),
              isDefault: true,
              deletedAt: null
            },
            scope
          )
        });

        if (existingDefault) {
          return res.status(400).json({
            success: false,
            message: 'A default fee structure already exists for this class/school'
          });
        }
      }

      const feeStructure = await prisma.feeStructure.create({
        data: feeData,
        include: {
          school: true,
          class: true,
          createdByUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      await createFeeLog(
        feeStructure.id,
        'created',
        null,
        feeStructure,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      await triggerEntityCreatedNotifications(
        'fee_structure',
        feeStructure.id.toString(),
        feeStructure,
        req.user,
        {
          auditDetails: {
            feeStructureId: feeStructure.id.toString(),
            feeStructureName: feeStructure.name,
            feeStructureCode: feeStructure.code,
            isDefault: feeStructure.isDefault
          }
        }
      );

      await cacheFeeStructure(feeStructure);

      res.status(201).json({
        success: true,
        message: 'Fee structure created successfully',
        data: feeStructure
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to create fee structure');
    }
  }

  /**
   * Get all fee structures with filtering and pagination
   */
  async getFeeStructures(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee structure list');

      const {
        page = 1,
        limit = 10,
        isDefault,
        classId,
        academicSessionId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNumber = parseInt(page, 10) || 1;
      const take = parseInt(limit, 10) || 10;
      const skip = (pageNumber - 1) * take;

      const where = applyScopeToFeeWhere({ deletedAt: null }, scope);

      let academicSessionIdBigInt = academicSessionId ? toBigIntSafe(academicSessionId) : null;
      if (academicSessionIdBigInt) {
        where.academicSessionId = academicSessionIdBigInt;
      } else {
        const school = await prisma.school.findUnique({
          where: { id: scope.schoolId },
          select: { academicSessionId: true }
        });
        if (school?.academicSessionId) {
          where.academicSessionId = school.academicSessionId;
        }
      }

      if (typeof isDefault !== 'undefined') {
        where.isDefault = isDefault === 'true' || isDefault === true;
      }

      if (classId) {
        const classAccessible = await ensureClassInScope(classId, scope);
        if (!classAccessible) {
          return res.status(404).json({
            success: false,
            message: 'Class not found in the selected context'
          });
        }
        where.classId = BigInt(classId);
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ];
      }

      const orderBy = { [sortBy]: sortOrder.toLowerCase() === 'asc' ? 'asc' : 'desc' };

      const [feeStructures, totalCount] = await Promise.all([
        prisma.feeStructure.findMany({
          where,
          skip,
          take,
          orderBy,
          include: {
            class: {
              select: { id: true, name: true, code: true }
            },
            academicSession: {
              select: { id: true, name: true, startDate: true, endDate: true }
            },
            items: {
              where: { deletedAt: null },
              select: {
                id: true,
                name: true,
                amount: true,
                isOptional: true
              }
            }
          }
        }),
        prisma.feeStructure.count({ where })
      ]);
 
      res.json({
        success: true,
        message: 'Fee structures retrieved successfully',
        data: feeStructures,
        pagination: {
          totalRecords: totalCount,
          totalPages: Math.ceil(totalCount / take),
          currentPage: pageNumber,
          limit: take
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to retrieve fee structures');
    }
  }

  /**
   * Get fee structure by ID
   */
  async getFeeStructureById(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee structure');

      const accessible = await ensureFeeStructureInScope(id, scope);
      if (!accessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id),
          deletedAt: null
        }, scope),
        include: {
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          academicSession: {
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true
            }
          },
          items: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              amount: true,
              isOptional: true,
              dueDate: true
            }
          }
        }
      });

      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      res.json({
        success: true,
        data: feeStructure
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to retrieve fee structure');
    }
  }

  /**
   * Update fee structure
   */
  async updateFeeStructure(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = validateFeeStructureData(req.body, true);

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
      resolveScopeOrReject(scope, 'fee structure update');

      const accessible = await ensureFeeStructureInScope(id, scope);
      if (!accessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      // Check if fee structure exists
      const existingStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!existingStructure) {
        return res.status(404).json({ 
          success: false, 
          message: 'Fee structure not found' 
        });
      }

      if (value.classId) {
        const classAccessible = await ensureClassInScope(value.classId, scope);
        if (!classAccessible) {
          return res.status(404).json({
            success: false,
            message: 'Class not found in the selected context'
          });
        }
      }

      const { branchId, courseId } = normalizeScopedIds(scope, {
        branchId: value.branchId ?? existingStructure.branchId,
        courseId: value.courseId ?? existingStructure.courseId
      });

      if (value.isDefault && value.isDefault !== existingStructure.isDefault) {
        const existingDefault = await prisma.feeStructure.findFirst({
          where: applyScopeToFeeWhere({
            classId: value.classId ? BigInt(value.classId) : existingStructure.classId,
            isDefault: true,
            deletedAt: null,
            NOT: { id: BigInt(id) }
          }, scope)
        });

        if (existingDefault) {
          return res.status(400).json({
            success: false,
            message: 'A default fee structure already exists for this class/school'
          });
        }
      }

      const updateData = {
        ...value,
        branchId,
        courseId,
        classId: value.classId ? BigInt(value.classId) : existingStructure.classId,
        updatedBy: BigInt(req.user.id),
        updatedAt: new Date()
      };

      const updatedStructure = await prisma.feeStructure.update({
        where: { id: BigInt(id) },
        data: updateData,
        include: {
          school: true,
          class: true,
          updatedByUser: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      // Create audit log
      await createFeeLog(
        id,
        'updated',
        existingStructure,
        updatedStructure,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      // Trigger automatic notification for fee structure update
      await triggerEntityUpdatedNotifications(
        'fee_structure',
        updatedStructure.id.toString(),
        updatedStructure,
        existingStructure,
        req.user,
        {
          auditDetails: {
            feeStructureId: updatedStructure.id.toString(),
            feeStructureName: updatedStructure.name,
            updatedFields: Object.keys(value)
          }
        }
      );

      // Update cache
      await cacheFeeStructure(updatedStructure);

      res.json({
        success: true,
        message: 'Fee structure updated successfully',
        data: updatedStructure
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to update fee structure');
    }
  }

  /**
   * Delete fee structure (soft delete)
   */
  async deleteFeeStructure(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee structure delete');

      const accessible = await ensureFeeStructureInScope(id, scope);
      if (!accessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      const paymentCount = await prisma.payment.count({
        where: applyScopeToFeeWhere({
          feeStructureId: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (paymentCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete fee structure with associated payments'
        });
      }

      await prisma.feeStructure.update({
        where: { id: BigInt(id) },
        data: {
          deletedAt: new Date(),
          updatedBy: BigInt(req.user.id)
        }
      });

      await createFeeLog(
        id,
        'deleted',
        feeStructure,
        null,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      await triggerEntityDeletedNotifications(
        'fee_structure',
        feeStructure.id.toString(),
        feeStructure,
        req.user,
        {
          auditDetails: {
            feeStructureId: feeStructure.id.toString(),
            feeStructureName: feeStructure.name
          }
        }
      );

      await invalidateFeeCache(id, scope.schoolId.toString());

      res.json({
        success: true,
        message: 'Fee structure deleted successfully'
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to delete fee structure');
    }
  }

  /**
   * Add item to fee structure
   */
  async addFeeItem(req, res) {
    try {
      const { id } = req.params;
      const { error, value } = validateFeeItemData(req.body);

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
      resolveScopeOrReject(scope, 'fee item');

      const structureAccessible = await ensureFeeStructureInScope(id, scope);
      if (!structureAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      // Check if fee structure exists
      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!feeStructure) {
        return res.status(404).json({ 
          success: false, 
          message: 'Fee structure not found' 
        });
      }

      // Create fee item
      const feeItem = await prisma.feeItem.create({
        data: {
          ...value,
          feeStructureId: BigInt(id),
          schoolId: scope.schoolId,
          branchId: scope.branchId,
          courseId: scope.courseId,
          createdBy: BigInt(req.user.id)
        }
      });

      // Create audit log
      await createFeeLog(
        id,
        'item_added',
        null,
        feeItem,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      // Invalidate cache to reflect changes
      await invalidateFeeCache(id, scope.schoolId.toString());

      res.status(201).json({
        success: true,
        message: 'Fee item added successfully',
        data: feeItem
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to add fee item');
    }
  }

  /**
   * Update fee item
   */
  async updateFeeItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const { error, value } = validateFeeItemData(req.body, true);

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
      resolveScopeOrReject(scope, 'fee item update');

      const structureAccessible = await ensureFeeStructureInScope(id, scope);
      if (!structureAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!feeStructure) {
        return res.status(404).json({ 
          success: false, 
          message: 'Fee structure not found' 
        });
      }

      // Check if fee item exists
      const feeItem = await prisma.feeItem.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(itemId),
          feeStructureId: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!feeItem) {
        return res.status(404).json({ 
          success: false, 
          message: 'Fee item not found' 
        });
      }

      const oldItem = { ...feeItem };
      const updatedItem = await prisma.feeItem.update({
        where: { id: BigInt(itemId) },
        data: {
          ...value,
          branchId: scope.branchId ?? feeItem.branchId ?? null,
          courseId: scope.courseId ?? feeItem.courseId ?? null,
          updatedBy: BigInt(req.user.id),
          updatedAt: new Date()
        }
      });

      // Create audit log
      await createFeeLog(
        id,
        'item_updated',
        oldItem,
        updatedItem,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      // Invalidate cache to reflect changes
      await invalidateFeeCache(id, scope.schoolId.toString());

      res.json({
        success: true,
        message: 'Fee item updated successfully',
        data: updatedItem
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
      const { id, itemId } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee item delete');

      const structureAccessible = await ensureFeeStructureInScope(id, scope);
      if (!structureAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!feeStructure) {
        return res.status(404).json({ 
          success: false, 
          message: 'Fee structure not found' 
        });
      }

      // Check if fee item exists
      const feeItem = await prisma.feeItem.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(itemId),
          feeStructureId: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!feeItem) {
        return res.status(404).json({ 
          success: false, 
          message: 'Fee item not found' 
        });
      }

      // Soft delete fee item
      await prisma.feeItem.update({
        where: { id: BigInt(itemId) },
        data: {
          deletedAt: new Date(),
          updatedBy: BigInt(req.user.id)
        }
      });

      // Create audit log
      await createFeeLog(
        id,
        'item_deleted',
        feeItem,
        null,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      // Invalidate cache to reflect changes
      await invalidateFeeCache(id, scope.schoolId.toString());

      res.json({ 
        success: true, 
        message: 'Fee item deleted successfully' 
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to delete fee item');
    }
  }

  /**
   * Assign fee structure to class or student
   */
  async assignFeeStructure(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee assignment');

      const filteredBody = {};
      for (const key in req.body) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
          filteredBody[key] = req.body[key];
        }
      }

      const hasClassId = filteredBody.classId !== undefined;
      const hasStudentId = filteredBody.studentId !== undefined;
      if ((hasClassId && hasStudentId) || (!hasClassId && !hasStudentId)) {
        return res.status(400).json({
          success: false,
          message: 'Must specify exactly one of classId or studentId'
        });
      }

      const { error, value } = validateFeeAssignmentData(filteredBody);

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.details.map(detail => detail.message).join(', ')
        });
      }

      const structureAccessible = await ensureFeeStructureInScope(id, scope);
      if (!structureAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id),
          deletedAt: null
        }, scope)
      });

      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      const { branchId, courseId } = normalizeScopedIds(scope, {
        branchId: feeStructure.branchId,
        courseId: feeStructure.courseId
      });

      if (value.classId) {
        const classAccessible = await ensureClassInScope(value.classId, scope);
        if (!classAccessible) {
          return res.status(404).json({
            success: false,
            message: 'Class not found in the selected context'
          });
        }
      } else if (value.studentId) {
        const studentAccessible = await ensureStudentInScope(value.studentId, scope);
        if (!studentAccessible) {
          return res.status(404).json({
            success: false,
            message: 'Student not found in the selected context'
          });
        }
      }

      const existingAssignment = await prisma.feeAssignment.findFirst({
        where: {
          feeStructureId: BigInt(id),
          classId: value.classId ? BigInt(value.classId) : null,
          studentId: value.studentId ? BigInt(value.studentId) : null,
          deletedAt: null
        }
      });

      if (existingAssignment) {
        return res.status(400).json({
          success: false,
          message: 'Fee structure already assigned to this class/student'
        });
      }

      const assignment = await prisma.feeAssignment.create({
        data: {
          feeStructureId: BigInt(id),
          classId: value.classId ? BigInt(value.classId) : null,
          studentId: value.studentId ? BigInt(value.studentId) : null,
          schoolId: scope.schoolId,
          branchId,
          courseId,
          createdBy: BigInt(req.user.id),
          effectiveFrom: value.effectiveFrom ? new Date(value.effectiveFrom) : new Date(),
          effectiveUntil: value.effectiveUntil ? new Date(value.effectiveUntil) : null
        },
        include: {
          class: true,
          student: true
        }
      });

      await createFeeLog(
        id,
        'assigned',
        null,
        assignment,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Fee structure assigned successfully',
        data: assignment
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to assign fee structure');
    }
  }

  /**
   * Remove fee structure assignment
   */
  async removeAssignment(req, res) {
    try {
      const { assignmentId } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee assignment delete');

      const assignment = await prisma.feeAssignment.findFirst({
        where: {
          id: BigInt(assignmentId),
          feeStructure: applyScopeToFeeWhere({ deletedAt: null }, scope),
          deletedAt: null
        }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found in the selected context'
        });
      }

      await prisma.feeAssignment.update({
        where: { id: BigInt(assignmentId) },
        data: {
          deletedAt: new Date(),
          updatedBy: BigInt(req.user.id)
        }
      });

      await createFeeLog(
        assignment.feeStructureId.toString(),
        'unassigned',
        assignment,
        null,
        req.ip,
        req.get('User-Agent'),
        scope.schoolId.toString(),
        req.user.id
      );

      res.json({
        success: true,
        message: 'Assignment removed successfully'
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to remove assignment');
    }
  }

  /**
   * Get applicable fee structures for a student
   */
  async getStudentFeeStructures(req, res) {
    try {
      const { studentId } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'student fee structures');

      const studentAccessible = await ensureStudentInScope(studentId, scope);
      if (!studentAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Student not found in the selected context'
        });
      }

      const student = await prisma.student.findFirst({
        where: applyScopeToWhere({
          id: BigInt(studentId),
          deletedAt: null,
          user: { status: 'ACTIVE' }
        }, scope, { useBranch: true, useCourse: true }),
        select: { classId: true }
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const now = new Date();

      const feeStructures = await prisma.feeStructure.findMany({
        where: {
          ...applyScopeToFeeWhere({ deletedAt: null }, scope),
          OR: [
            {
              assignments: {
                some: {
                  studentId: BigInt(studentId),
                  OR: [
                    { effectiveUntil: null },
                    { effectiveUntil: { gte: now } }
                  ],
                  effectiveFrom: { lte: now },
                  deletedAt: null
                }
              }
            },
            student.classId
              ? {
                  assignments: {
                    some: {
                      classId: student.classId,
                      studentId: null,
                      OR: [
                        { effectiveUntil: null },
                        { effectiveUntil: { gte: now } }
                      ],
                      effectiveFrom: { lte: now },
                      deletedAt: null
                    }
                  }
                }
              : null,
            {
              isDefault: true,
              classId: null
            }
          ].filter(Boolean)
        },
        include: {
          items: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              amount: true,
              isOptional: true
            }
          }
        }
      });

      res.json({
        success: true,
        data: feeStructures
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to retrieve student fee structures');
    }
  }

  /**
   * Get fee structure analytics
   */
  async getFeeAnalytics(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee analytics');

      const baseStructureWhere = applyScopeToFeeWhere({ deletedAt: null }, scope);
      const [
        totalStructures,
        defaultStructures,
        classSpecificStructures,
        structuresWithItems,
        totalItems,
        assignmentsCount,
        monthlyCreated
      ] = await Promise.all([
        prisma.feeStructure.count({ where: baseStructureWhere }),
        prisma.feeStructure.count({
          where: {
            ...baseStructureWhere,
            isDefault: true
          }
        }),
        prisma.feeStructure.count({
          where: {
            ...baseStructureWhere,
            classId: { not: null }
          }
        }),
        prisma.feeStructure.count({
          where: {
            ...baseStructureWhere,
            items: {
              some: { deletedAt: null }
            }
          }
        }),
        prisma.feeItem.count({
          where: applyScopeToFeeWhere({ deletedAt: null }, scope)
        }),
        prisma.feeAssignment.count({
          where: {
            ...applyScopeToFeeWhere({ deletedAt: null }, scope),
            feeStructure: {
              ...baseStructureWhere
            }
          }
        }),
        (async () => {
          const filters = ['"deletedAt" IS NULL'];
          const params = [];
          if (scope.schoolId !== null && scope.schoolId !== undefined) {
            filters.push('"schoolId" = ?');
            params.push(scope.schoolId.toString());
          }
          if (scope.branchId !== null && scope.branchId !== undefined) {
            filters.push('"branchId" = ?');
            params.push(scope.branchId.toString());
          }
          if (scope.courseId !== null && scope.courseId !== undefined) {
            filters.push('"courseId" = ?');
            params.push(scope.courseId.toString());
          }

          const whereClause = filters.join(' AND ');
          const query = `
            SELECT DATE_TRUNC('month', "createdAt") as month, COUNT(*) as count
            FROM "FeeStructure"
            WHERE ${whereClause}
            GROUP BY DATE_TRUNC('month', "createdAt")
            ORDER BY month DESC
            LIMIT 12
          `;

          return prisma.$queryRawUnsafe(query, ...params);
        })()
      ]);

      res.json({
        success: true,
        data: {
          totalStructures,
          defaultStructures,
          classSpecificStructures,
          structuresWithItems,
          structuresWithoutItems: totalStructures - structuresWithItems,
          totalItems,
          averageItems: totalStructures > 0 ? totalItems / totalStructures : 0,
          assignmentsCount,
          monthlyCreated
        }
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to get fee analytics');
    }
  }

  /**
   * Restore a soft-deleted fee structure
   */
  async restoreFeeStructure(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee structure restore');

      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({
          id: BigInt(id)
        }, scope)
      });

      if (!feeStructure) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found'
        });
      }

      if (!feeStructure.deletedAt) {
        return res.status(400).json({
          success: false,
          message: 'Fee structure is not deleted'
        });
      }

      const restored = await prisma.feeStructure.update({
        where: { id: BigInt(id) },
        data: {
          deletedAt: null,
          updatedBy: BigInt(req.user.id),
          updatedAt: new Date()
        }
      });

      await invalidateFeeCache(id, scope.schoolId.toString());

      res.json({
        success: true,
        message: 'Fee structure restored successfully',
        data: restored
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to restore fee structure');
    }
  }

  /**
   * Get all assignments for a given fee structure
   */
  async getFeeAssignments(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee assignments list');

      const structureAccessible = await ensureFeeStructureInScope(id, scope);
      if (!structureAccessible) {
        return res.status(404).json({
          success: false,
          message: 'Fee structure not found in the selected context'
        });
      }

      const assignments = await prisma.feeAssignment.findMany({
        where: {
          ...applyScopeToFeeWhere({ deletedAt: null }, scope),
          feeStructureId: BigInt(id)
        },
        include: {
          class: true,
          student: true
        }
      });

      res.json({
        success: true,
        data: assignments
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to fetch fee assignments');
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStatistics(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee cache stats');

      const stats = {
        keys: 100,
        hits: 500,
        misses: 50,
        uptime: process.uptime()
      };
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to get cache statistics');
    }
  }

  /**
   * Generate fee structure code suggestions
   */
  async generateCodeSuggestions(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee code suggestions');

      const { name } = req.query;
      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Name query parameter is required'
        });
      }
      // Example: Generate code suggestions based on name
      const suggestions = [
        name.toUpperCase().replace(/\s+/g, '_'),
        name.toLowerCase().replace(/\s+/g, '-'),
        `${name.substring(0, 3).toUpperCase()}-${Date.now()}`
      ];
      res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to generate code suggestions');
    }
  }

  /**
   * Get all fee items
   */
  async getAllFeeItems(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee items list');

      const items = await prisma.feeItem.findMany({
        where: applyScopeToFeeWhere({ deletedAt: null }, scope),
        orderBy: { createdAt: 'asc' }
      });

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to get fee items');
    }
  }

  /**
   * Generate comprehensive fee report
   */
  async generateFeeReport(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee report');

      const filters = req.query;
      const where = applyScopeToFeeWhere({ deletedAt: null }, scope);

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.name) {
        where.name = { contains: filters.name, mode: 'insensitive' };
      }

      const feeStructures = await prisma.feeStructure.findMany({
        where,
        include: {
          items: {
            where: { deletedAt: null }
          },
          assignments: {
            where: { deletedAt: null }
          }
        }
      });

      const report = feeStructures.map((fs) => ({
        id: fs.id,
        name: fs.name,
        status: fs.status,
        totalItems: fs.items.length,
        totalAssignments: fs.assignments.length,
        branchId: fs.branchId,
        courseId: fs.courseId
      }));

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to generate fee report');
    }
  }

  // Get statistics for a single fee structure
  async getFeeStats(req, res) {
    try {
      const { id } = req.params;
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee stats');

      const structureAccessible = await ensureFeeStructureInScope(id, scope);
      if (!structureAccessible) {
        return res.status(404).json({ success: false, message: 'Fee structure not found in the selected context' });
      }

      const feeStructure = await prisma.feeStructure.findFirst({
        where: applyScopeToFeeWhere({ id: BigInt(id), deletedAt: null }, scope),
        include: { items: { where: { deletedAt: null } } }
      });

      if (!feeStructure) {
        return res.status(404).json({ success: false, message: 'Fee structure not found' });
      }

      const stats = analyzeFeeStructure(feeStructure);
      res.json({ success: true, data: stats });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to get fee stats');
    }
  }

  // Get analytics for all fee structures in a school
  async getSchoolFeeAnalytics(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'school fee analytics');

      if (req.params.schoolId) {
        const requestedSchool = toBigIntOrNull(req.params.schoolId);
        if (!requestedSchool || requestedSchool !== scope.schoolId) {
          return res.status(403).json({
            success: false,
            message: 'Cannot access analytics for another school'
          });
        }
      }

      const structures = await prisma.feeStructure.findMany({
        where: applyScopeToFeeWhere({ deletedAt: null }, scope),
        include: { items: { where: { deletedAt: null } } }
      });

      const summary = structures.map(analyzeFeeStructure);
      res.json({ success: true, data: summary });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to get school fee analytics');
    }
  }

  // Bulk create fee structures
  async bulkCreateStructures(req, res) {
    try {
      const { error, value } = validateFeeBulkCreateData(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details.map(e => e.message).join(', ') });
      }
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'bulk fee create');

      const requestedSchoolId = toBigIntOrNull(value.schoolId);
      if (requestedSchoolId && requestedSchoolId !== scope.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot bulk create fee structures for another school'
        });
      }

      const created = [];
      for (const structure of value.structures) {
        const classId = toBigIntOrNull(structure.classId);
        if (classId) {
          const classAccessible = await ensureClassInScope(classId, scope);
          if (!classAccessible) {
            throw Object.assign(new Error('Class not found in the selected context'), { statusCode: 404 });
          }
        }

        const { branchId, courseId } = normalizeScopedIds(scope, {
          branchId: structure.branchId,
          courseId: structure.courseId
        });

        const createdStructure = await prisma.feeStructure.create({
          data: {
            name: structure.name,
            description: structure.description ?? null,
            classId: classId ?? null,
            isDefault: structure.isDefault ?? false,
            status: structure.status ?? 'active',
            schoolId: scope.schoolId,
            branchId,
            courseId,
            createdBy: BigInt(req.user.id),
            items: {
              create: (structure.items || []).map((item) => {
                const { feeStructureId: _ignoredFeeStructureId, ...itemData } = item;
                return {
                  ...itemData,
                  schoolId: scope.schoolId,
                  branchId,
                  courseId,
                  createdBy: BigInt(req.user.id)
                };
              })
            }
          },
          include: { items: true }
        });

        created.push(createdStructure);
      }

      // Trigger bulk operation notification
      await triggerBulkOperationNotifications(
        'fee_structure',
        created.map(s => s.id.toString()),
        'CREATE',
        req.user,
        {
          auditDetails: {
            operation: 'bulk_create',
            count: created.length,
            total: structures.length
          }
        }
      );

      res.status(201).json({ success: true, data: created });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to bulk create fee structures');
    }
  }

  // Bulk update fee structures
  async bulkUpdateStructures(req, res) {
    try {
      const { error, value } = validateFeeBulkUpdateData(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details.map(e => e.message).join(', ') });
      }
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'bulk fee update');

      const requestedSchoolId = toBigIntOrNull(value.schoolId);
      if (requestedSchoolId && requestedSchoolId !== scope.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot bulk update fee structures for another school'
        });
      }

      const updates = value.updates;
      const results = [];
      const updatedIds = [];
      for (const update of updates) {
        const { feeStructureId, data } = update;
        const idBigInt = toBigIntSafe(feeStructureId);
        const structureAccessible = await ensureFeeStructureInScope(idBigInt, scope);
        if (!structureAccessible) {
          results.push({ feeStructureId, error: 'Not found in the selected context' });
          continue;
        }
        const structure = await prisma.feeStructure.findFirst({
          where: applyScopeToFeeWhere({ id: idBigInt }, scope),
          include: { items: true }
        });
        if (!structure) {
          results.push({ feeStructureId, error: 'Not found in the selected context' });
          continue;
        }

        const updateData = { updatedBy: BigInt(req.user.id), updatedAt: new Date() };
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.status !== undefined) updateData.status = data.status;
        if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;

        if (data.classId !== undefined) {
          const classId = toBigIntOrNull(data.classId);
          if (classId) {
            const classInScope = await ensureClassInScope(classId, scope);
            if (!classInScope) {
              results.push({ feeStructureId, error: 'Class not found in the selected context' });
              continue;
            }
          }
          updateData.classId = classId;
        }

        const { branchId, courseId } = normalizeScopedIds(scope, {
          branchId: data.branchId ?? structure.branchId,
          courseId: data.courseId ?? structure.courseId
        });
        updateData.branchId = branchId;
        updateData.courseId = courseId;

        await prisma.feeStructure.update({
          where: { id: idBigInt },
          data: updateData
        });

        if (data.items) {
          for (const item of data.items) {
            if (item.action === 'update' && item.id) {
              const itemAccessible = await ensureFeeItemInScope(item.id, scope);
              if (!itemAccessible) {
                continue;
              }
              await prisma.feeItem.update({
                where: { id: BigInt(item.id) },
                data: {
                  ...(() => {
                    const { feeStructureId: _ignoredFeeStructureId, ...rest } = item.data || {};
                    return rest;
                  })(),
                  branchId,
                  courseId,
                  updatedBy: BigInt(req.user.id),
                  updatedAt: new Date()
                }
              });
            } else if (item.action === 'create') {
              await prisma.feeItem.create({
                data: {
                  ...(() => {
                    const { feeStructureId: _ignoredFeeStructureId, id: _ignoredId, ...rest } = item.data || {};
                    return rest;
                  })(),
                  feeStructureId: idBigInt,
                  schoolId: scope.schoolId,
                  branchId,
                  courseId,
                  createdBy: BigInt(req.user.id)
                }
              });
            } else if (item.action === 'delete' && item.id) {
              const itemAccessible = await ensureFeeItemInScope(item.id, scope);
              if (!itemAccessible) {
                continue;
              }
              await prisma.feeItem.update({
                where: { id: BigInt(item.id) },
                data: {
                  deletedAt: new Date(),
                  updatedBy: BigInt(req.user.id)
                }
              });
            }
          }
        }
        results.push({ feeStructureId, updated: true });
        updatedIds.push(feeStructureId);
      }

      // Trigger bulk operation notification
      await triggerBulkOperationNotifications(
        'fee_structure',
        updatedIds,
        'UPDATE',
        req.user,
        {
          auditDetails: {
            operation: 'bulk_update',
            count: updatedIds.length,
            total: updates.length
          }
        }
      );

      res.json({ success: true, data: results });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to bulk update fee structures');
    }
  }

  // Bulk delete fee structures
  async bulkDeleteStructures(req, res) {
    try {
      const { error, value } = validateFeeBulkDeleteData(req.body);
      if (error) {
        return res.status(400).json({ success: false, message: error.details.map(e => e.message).join(', ') });
      }
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'bulk fee delete');

      const requestedSchoolId = toBigIntOrNull(value.schoolId);
      if (requestedSchoolId && requestedSchoolId !== scope.schoolId) {
        return res.status(403).json({
          success: false,
          message: 'Cannot bulk delete fee structures for another school'
        });
      }

      const feeStructureIds = value.feeStructureIds || [];
      const results = [];
      const deletedIds = [];
      for (const id of feeStructureIds) {
        const idBigInt = toBigIntSafe(id);
        const accessible = await ensureFeeStructureInScope(idBigInt, scope);
        if (!accessible) {
          results.push({ id, error: 'Not found in the selected context' });
          continue;
        }
        await prisma.feeStructure.update({
          where: { id: idBigInt },
          data: {
            deletedAt: new Date(),
            updatedBy: BigInt(req.user.id)
          }
        });
        results.push({ id, deleted: true });
        deletedIds.push(id);
      }

      // Trigger bulk operation notification
      await triggerBulkOperationNotifications(
        'fee_structure',
        deletedIds,
        'DELETE',
        req.user,
        {
          auditDetails: {
            operation: 'bulk_delete',
            count: deletedIds.length,
            total: feeStructureIds.length
          }
        }
      );

      res.json({ success: true, data: results });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to bulk delete fee structures');
    }
  }

  // Export fee structures as JSON
  async exportFeeStructures(req, res) {
    try {
      const scope = normalizeScopeWithSchool(
        await resolveManagedScope(req),
        toBigIntSafe(req.user?.schoolId)
      );
      resolveScopeOrReject(scope, 'fee export');

      const structures = await prisma.feeStructure.findMany({
        where: applyScopeToFeeWhere({ deletedAt: null }, scope),
        include: { items: { where: { deletedAt: null } } }
      });
      const exported = structures.map(exportFeeStructure);
      res.setHeader('Content-Disposition', 'attachment; filename=fee_structures.json');
      res.json({ success: true, data: exported });
    } catch (error) {
      return respondWithScopedError(res, error, 'Failed to export fee structures');
    }
  }
}

const feeControllerInstance = new FeeController();
export default feeControllerInstance;