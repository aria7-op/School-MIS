import { PrismaClient } from '../generated/prisma/index.js';
import { 
  generateTeacherCode, 
  validateTeacherConstraints, 
  buildTeacherSearchQuery, 
  buildTeacherIncludeQuery,
  generateTeacherStats,
  generateTeacherAnalytics,
  calculateTeacherPerformance,
  generateTeacherExportData,
  validateTeacherImportData,
  generateTeacherCodeSuggestions,
  getTeacherCountByDepartment,
  getTeacherCountByExperience
} from '../utils/teacherUtils.js';
import { 
  setTeacherInCache, 
  getTeacherFromCache, 
  setTeacherListInCache, 
  getTeacherListFromCache,
  setTeacherSearchInCache,
  getTeacherSearchFromCache,
  setTeacherStatsInCache,
  getTeacherStatsFromCache,
  setTeacherAnalyticsInCache,
  getTeacherAnalyticsFromCache,
  setTeacherPerformanceInCache,
  getTeacherPerformanceFromCache,
  invalidateTeacherCacheOnCreate,
  invalidateTeacherCacheOnUpdate,
  invalidateTeacherCacheOnDelete,
  invalidateTeacherCacheOnBulkOperation
} from '../cache/teacherCache.js';
import { 
  setCache, 
  getCache, 
  deleteCache 
} from '../cache/cacheManager.js';
import { 
  createAuditLog, 
  createNotification 
} from './notificationService.js';
import { getUserIdsByRoles } from '../utils/notificationTriggers.js';
import { 
  validateSchoolAccess, 
  validateDepartmentAccess 
} from '../middleware/validation.js';
import { 
  generatePaginationResponse, 
  handlePrismaError, 
  createSuccessResponse, 
  createErrorResponse,
  convertBigIntToString
} from '../utils/responseUtils.js';
import {
  getTenantContextForSchool,
  countTeachersForSchool,
  updateSubscriptionUsage
} from './subscriptionService.js';
import {
  applyScopeToWhere,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const prisma = new PrismaClient();

const ensureTeacherScope = (scope, contextLabel = 'teacher operation') => {
  const normalized = {
    schoolId: toBigIntSafe(scope?.schoolId, null),
    branchId: toBigIntOrNull(scope?.branchId),
    courseId: toBigIntOrNull(scope?.courseId)
  };

  if (normalized.schoolId === null) {
    const error = new Error(`Managed school context is required for ${contextLabel}`);
    error.statusCode = 400;
    throw error;
  }

  return normalized;
};

const resolveScopeInput = (primary, contextLabel) => {
  if (primary && typeof primary === 'object' && primary !== null && 'schoolId' in primary) {
    return ensureTeacherScope(primary, contextLabel);
  }

  return ensureTeacherScope({ schoolId: primary }, contextLabel);
};

const buildScopedTeacherWhere = (scope, baseWhere = {}) => {
  const where = applyScopeToWhere(
    { ...baseWhere },
    scope,
    { useBranch: true, useCourse: false }
  );

  if (where.deletedAt === undefined) {
    where.deletedAt = null;
  }

  return where;
};

const coerceTeacherId = (teacherId) => {
  const id = toBigIntSafe(teacherId, null);
  if (id === null) {
    const error = new Error('Invalid teacher identifier');
    error.statusCode = 400;
    throw error;
  }
  return id;
};

const enforceBranchAgainstScope = (incomingBranchId, scope) => {
  const branchId = toBigIntOrNull(incomingBranchId);

  if (scope.branchId !== null) {
    if (branchId !== null && branchId !== scope.branchId) {
      const error = new Error('Branch is outside of the managed scope');
      error.statusCode = 403;
      throw error;
    }
    return scope.branchId;
  }

  return branchId;
};

const ensureTeacherAccessible = async (teacherId, scope, include) => {
  const teacherIdBigInt = coerceTeacherId(teacherId);
  const teacher = await prisma.teacher.findFirst({
    where: buildScopedTeacherWhere(scope, { id: teacherIdBigInt }),
    include
  });

  if (!teacher) {
    const error = new Error('Teacher not found in managed scope');
    error.statusCode = 404;
    throw error;
  }

  return { teacher, teacherIdBigInt };
};

class TeacherService {
  // ======================
  // CRUD OPERATIONS
  // ======================

  /**
   * Create a new teacher
   */
  async createTeacher(teacherData, userId, incomingScope, user = null) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher creation');
      const schoolId = scope.schoolId;
      const actor = {
        ...(user || {}),
        id: user?.id ?? userId,
        schoolId: user?.schoolId ?? schoolId
      };

      const createdById = toBigIntSafe(userId, null);
      if (createdById === null) {
        const error = new Error('Invalid user identifier for teacher creation');
        error.statusCode = 400;
        throw error;
      }

      const coercedDepartmentId = toBigIntOrNull(teacherData?.departmentId);
      const branchId = enforceBranchAgainstScope(teacherData?.branchId, scope);
      // SCOPE FIX: Add courseId from scope
      const courseId = scope?.courseId ? toBigIntOrNull(scope.courseId) : null;
      console.log('🔍 Teacher creation scope:', { schoolId, branchId, courseId });

      // Validate school access
      await validateSchoolAccess(actor, schoolId.toString());

      // Validate department access if provided
      if (coercedDepartmentId) {
        await validateDepartmentAccess(actor, coercedDepartmentId.toString(), schoolId.toString());
      }

      // Generate teacher code
      const teacherCode = await generateTeacherCode(
        teacherData.employeeId || teacherData.user?.firstName,
        schoolId
      );

      // Validate teacher constraints
      await validateTeacherConstraints(schoolId, teacherCode, coercedDepartmentId);

      if (user?.role !== 'SUPER_DUPER_ADMIN') {
        try {
          const tenantContext = await getTenantContextForSchool(schoolId);
          const maxTeachers = tenantContext?.limits?.maxTeachers;
          if (maxTeachers !== null && maxTeachers !== undefined) {
            const currentCount = await countTeachersForSchool(schoolId);
            if (Number(currentCount) + 1 > Number(maxTeachers)) {
              const err = new Error('Teacher limit reached for current subscription');
              err.code = 'LIMIT_EXCEEDED';
              err.meta = { schoolId, currentCount, maxTeachers };
              throw err;
            }
          }
        } catch (limitError) {
          console.warn('Failed to enforce teacher limit:', limitError);
        }
      }

      const normalizedUserPayload = teacherData.user || {};
      const createdByOwnerId = toBigIntSafe(
        actor?.role === 'SUPER_ADMIN' ? actor.id : actor?.createdByOwnerId,
        createdById
      );

      // Create teacher with user
      const {
        schoolId: _omitSchool,
        branchId: _omitBranch,
        user: _omitUser,
        departmentId: _omitDepartment,
        ...teacherDataWithoutRelations
      } = teacherData;

      const teacherPayload = {
        ...teacherDataWithoutRelations,
        departmentId: coercedDepartmentId ?? undefined,
        branchId: branchId ?? undefined,
        // SCOPE FIX: Add courseId to teacher
        courseId: courseId ?? undefined
      };

      const teacher = await prisma.teacher.create({
        data: {
          ...teacherPayload,
          employeeId: teacherCode,
          createdBy: createdById,
          school: {
            connect: { id: schoolId }
          },
          user: {
            create: {
              ...normalizedUserPayload,
              role: 'SCHOOL_ADMIN',
              schoolId,
              createdBy: createdById,
              username:
                normalizedUserPayload.username ||
                `${(normalizedUserPayload.firstName || 'teacher').toLowerCase()}${(normalizedUserPayload.lastName || 'user').toLowerCase()}${Date.now()}`,
              createdByOwnerId: createdByOwnerId
            }
          }
        },
        include: {
              user: {
                select: {
                  id: true,
                  uuid: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                  phone: true,
                  status: true,
                  role: true,
                  createdAt: true
                }
              },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          school: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      try {
        await updateSubscriptionUsage(schoolId);
      } catch (usageError) {
        console.warn('Failed to update subscription usage after teacher creation:', usageError);
      }

      // Invalidate cache
      await invalidateTeacherCacheOnCreate(teacher);

      // Create audit log
      await createAuditLog({
        action: 'CREATE',
        entityType: 'Teacher',
        entityId: teacher.id,
        userId,
        schoolId,
        oldData: null,
        newData: {
          teacherId: teacher.id,
          employeeId: teacher.employeeId,
          departmentId: teacher.departmentId
        }
      });

      // Get recipient user IDs for SCHOOL_ADMIN role
      const recipientUserIds = await getUserIdsByRoles(['SCHOOL_ADMIN'], schoolId);

      // Create notification
      await createNotification({
        type: 'CREATION',
        title: 'New Teacher Added',
        message: `Teacher ${teacher.user.firstName} ${teacher.user.lastName} has been added to the system`,
        recipients: recipientUserIds,
        schoolId,
        metadata: {
          teacherId: teacher.id,
          employeeId: teacher.employeeId
        }
      });

      return {
        success: true,
        data: teacher,
        message: 'Teacher created successfully'
      };
    } catch (error) {
      console.error('Teacher service create error:', error);
      throw error;
    }
  }

  /**
   * Get teachers with pagination and filters
   */
  async getTeachers(filters, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'list teachers');
      console.log('🔍 getTeachers called with:', { filters, userId, scope });
      
      const { 
        page = 1, 
        limit, 
        search, 
        departmentId, 
        isClassTeacher, 
        status,
        experience,
        include = [],
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      // Build scoped where clause
      const where = buildScopedTeacherWhere(scope, {
        user: {
          is: {
            deletedAt: null
          }
        }
      });

      // Add search filter if provided
      if (search) {
        where.OR = [
          {
            user: {
              firstName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            user: {
              lastName: {
                contains: search,
                mode: 'insensitive'
              }
            }
          },
          {
            employeeId: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ];
      }

      // Add department filter if provided
      if (departmentId) {
        const departmentIdBigInt = toBigIntOrNull(departmentId);
        if (departmentIdBigInt !== null) {
          where.departmentId = departmentIdBigInt;
        }
      }

      // Add isClassTeacher filter if provided
      if (isClassTeacher !== undefined) {
        where.isClassTeacher = isClassTeacher === 'true';
      }

      console.log('🔍 Where clause:', JSON.stringify(convertBigIntToString(where), null, 2));

      // Build include query
      const includeQuery = {
        user: {
          select: {
            id: true,
            uuid: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            role: true,
            createdAt: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      };

      // Get total count
      console.log('🔍 Getting total count...');
      const totalCount = await prisma.teacher.count({ where });
      console.log('✅ Total count:', totalCount);

      // Get teachers
      console.log('🔍 Getting teachers...');
      // Build a safe orderBy compatible with Prisma schema
      const normalizedSortOrder = (typeof sortOrder === 'string' && sortOrder.toLowerCase() === 'asc') ? 'asc' : 'desc';
      let orderByClause;
      if (sortBy === 'name') {
        // Sort by user's firstName then lastName
        orderByClause = [
          { user: { firstName: normalizedSortOrder } },
          { user: { lastName: normalizedSortOrder } }
        ];
      } else if (
        ['id', 'uuid', 'userId', 'employeeId', 'departmentId', 'joiningDate', 'experience', 'salary', 'isClassTeacher', 'schoolId', 'createdBy', 'updatedBy', 'createdAt', 'updatedAt', 'deletedAt'].includes(sortBy)
      ) {
        orderByClause = { [sortBy]: normalizedSortOrder };
      } else if (sortBy === 'department') {
        // Example mapping if UI sends 'department'
        orderByClause = { departmentId: normalizedSortOrder };
      } else {
        // Default fallback
        orderByClause = { createdAt: 'desc' };
      }

      const limitNumber = limit ? parseInt(limit) : null;
      const pageNumber = parseInt(page);
      const skipValue = limitNumber ? (pageNumber - 1) * limitNumber : undefined;
      const takeValue = limitNumber || undefined;

      const teachers = await prisma.teacher.findMany({
        where,
        include: includeQuery,
        orderBy: orderByClause,
        skip: skipValue,
        take: takeValue
      });

      console.log('✅ Found teachers:', teachers.length);

      const response = limitNumber
        ? generatePaginationResponse(teachers, totalCount, pageNumber, limitNumber)
        : generatePaginationResponse(
            teachers,
            totalCount,
            1,
            Math.max(teachers.length || Number(totalCount) || 0, 1)
          );
      console.log('✅ Generated response:', JSON.stringify(convertBigIntToString(response), null, 2));

      return {
        success: true,
        data: response,
        message: 'Teachers retrieved successfully'
      };
    } catch (error) {
      console.error('❌ Teacher service get error:', error);
      throw error;
    }
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(teacherId, userId, incomingScope, include = []) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher details');
      const teacherIdBigInt = coerceTeacherId(teacherId);

      // Check cache first
      const cachedTeacher = await getTeacherFromCache(teacherIdBigInt.toString());
      
      if (cachedTeacher) {
        return {
          success: true,
          data: cachedTeacher,
          message: 'Teacher retrieved from cache',
          cached: true
        };
      }

      const includeQuery = buildTeacherIncludeQuery(include);
      const { teacher } = await ensureTeacherAccessible(teacherIdBigInt, scope, includeQuery);

      // Cache the result
      await setTeacherInCache(teacher);

      return {
        success: true,
        data: teacher,
        message: 'Teacher retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service get by ID error:', error);
      throw error;
    }
  }

  /**
   * Update teacher
   */
  async updateTeacher(teacherId, updateData, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'update teacher');
      const teacherIdBigInt = coerceTeacherId(teacherId);
      const actor = { id: userId, schoolId: scope.schoolId };
      const updatedById = toBigIntSafe(userId, null);
      if (updatedById === null) {
        const error = new Error('Invalid user identifier for teacher update');
        error.statusCode = 400;
        throw error;
      }

      // Get existing teacher
      const existingTeacher = await prisma.teacher.findFirst({
        where: buildScopedTeacherWhere(scope, {
          id: teacherIdBigInt
        }),
        include: {
          user: true,
          department: true
        }
      });

      if (!existingTeacher) {
        throw new Error('Teacher not found');
      }

      const nextDepartmentId = toBigIntOrNull(updateData?.departmentId);

      // Validate department access if changing department
      if (nextDepartmentId && nextDepartmentId !== existingTeacher.departmentId) {
        await validateDepartmentAccess(actor, nextDepartmentId.toString(), scope.schoolId.toString());
      }

      // Validate teacher constraints if changing employee ID
      if (updateData.employeeId && updateData.employeeId !== existingTeacher.employeeId) {
        await validateTeacherConstraints(scope.schoolId, updateData.employeeId, nextDepartmentId);
      }

      const nextBranchId = enforceBranchAgainstScope(
        updateData?.branchId ?? existingTeacher.branchId,
        scope
      );

      // Update teacher
      const updatedTeacher = await prisma.teacher.update({
        where: { id: teacherIdBigInt },
        data: {
          ...updateData,
          branchId: nextBranchId ?? undefined,
          departmentId: nextDepartmentId ?? updateData?.departmentId ?? existingTeacher.departmentId,
          updatedBy: updatedById,
          user: updateData.user ? {
            update: {
              ...updateData.user,
              updatedBy: updatedById
            }
          } : undefined
        },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              firstName: true,
              lastName: true,
              username: true,
              phone: true,
              status: true,
              updatedAt: true
            }
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          school: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // Invalidate cache
      await invalidateTeacherCacheOnUpdate(updatedTeacher, existingTeacher);

      // Create audit log
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Teacher',
        entityId: updatedTeacher.id,
        userId,
        schoolId: scope.schoolId,
        oldData: null,
        newData: {
          teacherId: updatedTeacher.id,
          employeeId: updatedTeacher.employeeId,
          changes: updateData
        }
      });

      return {
        success: true,
        data: updatedTeacher,
        message: 'Teacher updated successfully'
      };
    } catch (error) {
      console.error('Teacher service update error:', error);
      throw error;
    }
  }

  /**
   * Delete teacher (soft delete)
   */
  async deleteTeacher(teacherId, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'delete teacher');
      const teacherIdBigInt = coerceTeacherId(teacherId);
      const actorId = toBigIntSafe(userId, null);
      if (actorId === null) {
        const error = new Error('Invalid user identifier for teacher deletion');
        error.statusCode = 400;
        throw error;
      }

      const teacher = await prisma.teacher.findFirst({
        where: buildScopedTeacherWhere(scope, {
          id: teacherIdBigInt
        }),
        include: {
          user: true,
          subjects: true
        }
      });

      if (!teacher) {
        throw new Error('Teacher not found');
      }

      // Check if teacher has active subjects
      if (teacher.subjects.length > 0) {
        throw new Error('Cannot delete teacher with active subjects. Please reassign subjects first.');
      }

      // Soft delete teacher and user
      await prisma.$transaction([
        prisma.teacher.update({
          where: { id: teacherIdBigInt },
          data: {
            deletedAt: new Date(),
            updatedBy: actorId
          }
        }),
        prisma.user.update({
          where: { id: teacher.userId },
          data: {
            status: 'INACTIVE',
            updatedBy: actorId
          }
        })
      ]);

      // Invalidate cache
      await invalidateTeacherCacheOnDelete(teacher);

      // Create audit log
      await createAuditLog({
        action: 'DELETE',
        entityType: 'Teacher',
        entityId: teacher.id,
        userId,
        schoolId: scope.schoolId,
        oldData: null,
        newData: {
          teacherId: teacher.id,
          employeeId: teacher.employeeId
        }
      });

      return {
        success: true,
        message: 'Teacher deleted successfully'
      };
    } catch (error) {
      console.error('Teacher service delete error:', error);
      throw error;
    }
  }

  /**
   * Restore deleted teacher
   */
  async restoreTeacher(teacherId, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'restore teacher');
      const teacherIdBigInt = coerceTeacherId(teacherId);
      const actorId = toBigIntSafe(userId, null);
      if (actorId === null) {
        const error = new Error('Invalid user identifier for teacher restore');
        error.statusCode = 400;
        throw error;
      }

      const teacher = await prisma.teacher.findFirst({
        where: buildScopedTeacherWhere(scope, {
          id: teacherIdBigInt,
          deletedAt: { not: null }
        }),
        include: {
          user: true
        }
      });

      if (!teacher) {
        throw new Error('Teacher not found or not deleted');
      }

      // Restore teacher and user
      await prisma.$transaction([
        prisma.teacher.update({
          where: { id: teacherIdBigInt },
          data: {
            deletedAt: null,
            updatedBy: actorId
          }
        }),
        prisma.user.update({
          where: { id: teacher.userId },
          data: {
            status: 'ACTIVE',
            updatedBy: actorId
          }
        })
      ]);

      // Invalidate cache
      await invalidateTeacherCacheOnCreate(teacher);

      // Create audit log
      await createAuditLog({
        action: 'RESTORE',
        entityType: 'Teacher',
        entityId: teacher.id,
        userId,
        schoolId: scope.schoolId,
        oldData: null,
        newData: {
          teacherId: teacher.id,
          employeeId: teacher.employeeId
        }
      });

      return {
        success: true,
        message: 'Teacher restored successfully'
      };
    } catch (error) {
      console.error('Teacher service restore error:', error);
      throw error;
    }
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  /**
   * Search teachers with advanced filters
   */
  async searchTeachers(filters, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'search teachers');
      const { 
        search, 
        departmentId, 
        isClassTeacher, 
        status,
        experience,
        qualification,
        specialization,
        joiningDateFrom,
        joiningDateTo,
        include = [],
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const queryFilters = {
        search,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        isClassTeacher: isClassTeacher === 'true',
        status,
        experience: experience ? parseInt(experience) : undefined,
        qualification,
        specialization,
        joiningDateFrom,
        joiningDateTo
      };

      const cacheScopeKey = {
        schoolId: scope.schoolId?.toString() ?? null,
        branchId: scope.branchId?.toString() ?? null,
        courseId: scope.courseId?.toString() ?? null
      };

      // Check cache first
      const cachedData = await getTeacherSearchFromCache({
        scope: cacheScopeKey,
        filters: queryFilters,
        include,
        sortBy,
        sortOrder
      });
      
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          message: 'Teachers search results from cache',
          cached: true
        };
      }

      // Build query
      const query = buildTeacherSearchQuery(queryFilters);
      const includeQuery = buildTeacherIncludeQuery(include);

      const baseWhere = {
        ...query,
        deletedAt: null
      };

      if (baseWhere.departmentId !== undefined && baseWhere.departmentId !== null) {
        const deptId = toBigIntOrNull(baseWhere.departmentId);
        if (deptId !== null) {
          baseWhere.departmentId = deptId;
        } else {
          delete baseWhere.departmentId;
        }
      }

      const teachers = await prisma.teacher.findMany({
        where: buildScopedTeacherWhere(scope, baseWhere),
        include: includeQuery,
        orderBy: { [sortBy]: sortOrder }
      });

      // Cache the result
      await setTeacherSearchInCache({
        scope: cacheScopeKey,
        filters: queryFilters,
        include,
        sortBy,
        sortOrder
      }, teachers);

      return {
        success: true,
        data: teachers,
        message: 'Teachers search completed successfully'
      };
    } catch (error) {
      console.error('Teacher service search error:', error);
      throw error;
    }
  }

  // ======================
  // STATISTICS & ANALYTICS
  // ======================

  /**
   * Get teacher statistics
   */
  async getTeacherStats(teacherId, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher statistics');
      const { teacherIdBigInt } = await ensureTeacherAccessible(teacherId, scope);
      const cacheKey = {
        scope: {
          schoolId: scope.schoolId.toString(),
          branchId: scope.branchId?.toString() ?? null,
          courseId: scope.courseId?.toString() ?? null
        },
        teacherId: teacherIdBigInt.toString()
      };

      // Check cache first
      const cachedStats = await getTeacherStatsFromCache(teacherIdBigInt.toString(), cacheKey);
      if (cachedStats) {
        return {
          success: true,
          data: cachedStats,
          message: 'Teacher stats retrieved from cache',
          cached: true
        };
      }

      const stats = await generateTeacherStats(Number(teacherIdBigInt));

      // Cache the result
      await setTeacherStatsInCache(teacherIdBigInt.toString(), cacheKey, stats);

      return {
        success: true,
        data: stats,
        message: 'Teacher statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service stats error:', error);
      throw error;
    }
  }

  /**
   * Get teacher analytics
   */
  async getTeacherAnalytics(teacherId, period, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher analytics');
      const { teacherIdBigInt } = await ensureTeacherAccessible(teacherId, scope);
      const cacheKey = {
        scope: {
          schoolId: scope.schoolId.toString(),
          branchId: scope.branchId?.toString() ?? null,
          courseId: scope.courseId?.toString() ?? null
        },
        teacherId: teacherIdBigInt.toString(),
        period
      };

      // Check cache first
      const cachedAnalytics = await getTeacherAnalyticsFromCache(teacherIdBigInt.toString(), cacheKey);
      if (cachedAnalytics) {
        return {
          success: true,
          data: cachedAnalytics,
          message: 'Teacher analytics retrieved from cache',
          cached: true
        };
      }

      const analytics = await generateTeacherAnalytics(Number(teacherIdBigInt), period);

      // Cache the result
      await setTeacherAnalyticsInCache(teacherIdBigInt.toString(), cacheKey, analytics);

      return {
        success: true,
        data: analytics,
        message: 'Teacher analytics retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service analytics error:', error);
      throw error;
    }
  }

  /**
   * Get teacher performance metrics
   */
  async getTeacherPerformance(teacherId, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher performance');
      const { teacherIdBigInt } = await ensureTeacherAccessible(teacherId, scope);
      const cacheKey = {
        scope: {
          schoolId: scope.schoolId.toString(),
          branchId: scope.branchId?.toString() ?? null,
          courseId: scope.courseId?.toString() ?? null
        },
        teacherId: teacherIdBigInt.toString()
      };

      // Check cache first
      const cachedPerformance = await getTeacherPerformanceFromCache(teacherIdBigInt.toString(), cacheKey);
      if (cachedPerformance) {
        return {
          success: true,
          data: cachedPerformance,
          message: 'Teacher performance retrieved from cache',
          cached: true
        };
      }

      const performance = await calculateTeacherPerformance(Number(teacherIdBigInt));

      // Cache the result
      await setTeacherPerformanceInCache(teacherIdBigInt.toString(), cacheKey, performance);

      return {
        success: true,
        data: performance,
        message: 'Teacher performance retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service performance error:', error);
      throw error;
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk create teachers
   */
  async bulkCreateTeachers(teachers, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'bulk teacher creation');
      const actorId = toBigIntSafe(userId, null);
      if (actorId === null) {
        const error = new Error('Invalid user identifier for bulk teacher creation');
        error.statusCode = 400;
        throw error;
      }

      if (!Array.isArray(teachers) || teachers.length === 0) {
        throw new Error('Teachers array is required');
      }

      const results = [];
      const errors = [];

      for (const teacherData of teachers) {
        try {
          const result = await this.createTeacher(teacherData, userId, scope);
          results.push(result.data);
        } catch (error) {
          errors.push({
            teacherData,
            error: error.message
          });
        }
      }

      // Create audit log
      await createAuditLog({
        action: 'BULK_CREATE',
        entityType: 'Teacher',
        userId,
        schoolId: scope.schoolId,
        oldData: null,
        newData: {
          totalTeachers: teachers.length,
          successful: results.length,
          failed: errors.length
        }
      });

      return {
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: teachers.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: 'Bulk teacher creation completed'
      };
    } catch (error) {
      console.error('Teacher service bulk create error:', error);
      throw error;
    }
  }

  /**
   * Bulk update teachers
   */
  async bulkUpdateTeachers(updates, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'bulk teacher update');
      if (!Array.isArray(updates) || updates.length === 0) {
        throw new Error('Updates array is required');
      }

      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const { id, ...updateData } = update;
          const result = await this.updateTeacher(id, updateData, userId, scope);
          results.push(result.data);
        } catch (error) {
          errors.push({
            id: update.id,
            error: error.message
          });
        }
      }

      // Create audit log
      await createAuditLog({
        action: 'BULK_UPDATE',
        entityType: 'Teacher',
        userId,
        schoolId: scope.schoolId,
        oldData: null,
        newData: {
          totalUpdates: updates.length,
          successful: results.length,
          failed: errors.length
        }
      });

      return {
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: updates.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: 'Bulk teacher update completed'
      };
    } catch (error) {
      console.error('Teacher service bulk update error:', error);
      throw error;
    }
  }

  /**
   * Bulk delete teachers
   */
  async bulkDeleteTeachers(teacherIds, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'bulk teacher delete');
      if (!Array.isArray(teacherIds) || teacherIds.length === 0) {
        throw new Error('Teacher IDs array is required');
      }

      const results = [];
      const errors = [];

      for (const teacherId of teacherIds) {
        try {
          await this.deleteTeacher(teacherId, userId, scope);
          results.push({ teacherId, success: true });
        } catch (error) {
          errors.push({
            teacherId,
            error: error.message
          });
        }
      }

      // Create audit log
      await createAuditLog({
        action: 'BULK_DELETE',
        entityType: 'Teacher',
        userId,
        schoolId: scope.schoolId,
        oldData: null,
        newData: {
          totalTeachers: teacherIds.length,
          successful: results.length,
          failed: errors.length
        }
      });

      return {
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: teacherIds.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: 'Bulk teacher deletion completed'
      };
    } catch (error) {
      console.error('Teacher service bulk delete error:', error);
      throw error;
    }
  }

  // ======================
  // EXPORT & IMPORT
  // ======================

  /**
   * Export teachers data
   */
  async exportTeachers(filters, format, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'export teachers');
      const query = buildTeacherSearchQuery(filters);

      if (query.departmentId !== undefined && query.departmentId !== null) {
        const deptId = toBigIntOrNull(query.departmentId);
        if (deptId !== null) {
          query.departmentId = deptId;
        } else {
          delete query.departmentId;
        }
      }

      const where = buildScopedTeacherWhere(scope, query);

      // Get teachers based on filters
      const teachers = await prisma.teacher.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              phone: true,
              gender: true,
              dateOfBirth: true
            }
          },
          department: {
            select: {
              name: true,
              code: true
            }
          },
          school: {
            select: {
              name: true,
              code: true
            }
          }
        }
      });

      const exportData = await generateTeacherExportData(teachers, format);

      return {
        success: true,
        data: exportData,
        message: 'Teachers export completed successfully'
      };
    } catch (error) {
      console.error('Teacher service export error:', error);
      throw error;
    }
  }

  /**
   * Import teachers data
   */
  async importTeachers(teachers, user, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'import teachers');
      if (!Array.isArray(teachers) || teachers.length === 0) {
        throw new Error('Teachers array is required');
      }

      // Validate import data
      const validationResult = validateTeacherImportData(teachers);
      if (!validationResult.isValid) {
        throw new Error('Invalid import data');
      }

      const results = [];
      const errors = [];

      for (const teacherData of teachers) {
        try {
          const result = await this.createTeacher(teacherData, userId, scope);
          results.push(result.data);
        } catch (error) {
          errors.push({
            teacherData,
            error: error.message
          });
        }
      }

      // Create audit log
      await createAuditLog({
        action: 'IMPORT',
        entityType: 'Teacher',
        userId,
        schoolId: scope.schoolId,
        oldData: null,
        newData: {
          totalTeachers: teachers.length,
          successful: results.length,
          failed: errors.length,
          importedBy: user?.username || 'system'
        }
      });

      return {
        success: true,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: teachers.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: 'Teachers import completed'
      };
    } catch (error) {
      console.error('Teacher service import error:', error);
      throw error;
    }
  }

  // ======================
  // UTILITY OPERATIONS
  // ======================

  /**
   * Generate teacher code suggestions
   */
  async generateCodeSuggestions(name, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher code suggestions');
      if (!name) {
        throw new Error('Name is required');
      }

      const suggestions = await generateTeacherCodeSuggestions(name, scope.schoolId);

      return {
        success: true,
        data: suggestions,
        message: 'Code suggestions generated successfully'
      };
    } catch (error) {
      console.error('Teacher service code suggestions error:', error);
      throw error;
    }
  }

  /**
   * Get teacher count by department
   */
  async getTeacherCountByDepartment(incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher count by department');
      const counts = await getTeacherCountByDepartment(scope.schoolId);

      return {
        success: true,
        data: counts,
        message: 'Teacher count by department retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service count by department error:', error);
      throw error;
    }
  }

  /**
   * Get teacher count by experience
   */
  async getTeacherCountByExperience(incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher count by experience');
      const counts = await getTeacherCountByExperience(scope.schoolId);

      return {
        success: true,
        data: counts,
        message: 'Teacher count by experience retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service count by experience error:', error);
      throw error;
    }
  }

  /**
   * Get teachers by department
   */
  async getTeachersByDepartment(departmentId, include, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teachers by department');
      const departmentIdBigInt = toBigIntSafe(departmentId, null);
      if (departmentIdBigInt === null) {
        const error = new Error('Invalid department identifier');
        error.statusCode = 400;
        throw error;
      }

      const includeQuery = buildTeacherIncludeQuery(include);

      const teachers = await prisma.teacher.findMany({
        where: buildScopedTeacherWhere(scope, {
          departmentId: departmentIdBigInt
        }),
        include: includeQuery,
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: teachers,
        message: 'Teachers by department retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service by department error:', error);
      throw error;
    }
  }

  /**
   * Get teachers by school
   */
  async getTeachersBySchool(requestedSchoolId, include, userId, incomingScope) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teachers by school');
      if (requestedSchoolId && toBigIntSafe(requestedSchoolId, null) !== scope.schoolId) {
        const error = new Error('Requested school is outside of managed scope');
        error.statusCode = 403;
        throw error;
      }

      const includeQuery = buildTeacherIncludeQuery(include);

      const teachers = await prisma.teacher.findMany({
        where: buildScopedTeacherWhere(scope),
        include: includeQuery,
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        data: teachers,
        message: 'Teachers by school retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service by school error:', error);
      throw error;
    }
  }

  // ======================
  // CACHE MANAGEMENT
  // ======================

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    try {
      const stats = await getCache('teacher:cache:stats');
      
      return {
        success: true,
        data: stats || {
          type: 'memory',
          status: 'disabled'
        },
        message: 'Cache statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Teacher service cache stats error:', error);
      throw error;
    }
  }

  /**
   * Warm up cache
   */
  async warmCache(teacherId, incomingScope, userId) {
    try {
      const scope = resolveScopeInput(incomingScope, 'teacher cache warm');
      if (teacherId) {
        // Warm specific teacher cache
        const include = {
          user: true,
          department: true,
          school: true
        };
        const { teacher } = await ensureTeacherAccessible(teacherId, scope, include);

        await setTeacherInCache(teacher);
      } else {
        // Warm all teachers for school
        const teachers = await prisma.teacher.findMany({
          where: buildScopedTeacherWhere(scope),
          include: {
            user: true,
            department: true
          }
        });

        for (const teacher of teachers) {
          await setTeacherInCache(teacher);
        }
      }

      return {
        success: true,
        message: 'Cache warmed successfully'
      };
    } catch (error) {
      console.error('Teacher service warm cache error:', error);
      throw error;
    }
  }
}

export default new TeacherService();
