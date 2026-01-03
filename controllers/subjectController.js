import prisma from '../utils/prismaClient.js';
import { 
  generateSubjectCode, 
  validateSubjectConstraints, 
  generateSubjectStats, 
  generateSubjectAnalytics, 
  calculateSubjectPerformance,
  buildSubjectSearchQuery,
  buildSubjectIncludeQuery,
  generateSubjectExportData,
  validateSubjectImportData,
  generateSubjectCodeSuggestions,
  getSubjectCountByDepartment,
  getSubjectCountByCreditHours
} from '../utils/subjectUtils.js';
import { 
  SubjectCreateSchema, 
  SubjectUpdateSchema, 
  SubjectSearchSchema 
} from '../utils/subjectUtils.js';
import { cacheManager } from '../cache/cacheManager.js';
import { ValidationError } from '../middleware/validation.js';
import { convertBigIntToString } from '../utils/responseUtils.js';
import { resolveManagedScope } from '../utils/contextScope.js';

const appendSubjectAndClause = (existing, clause) => {
  if (!existing) return [clause];
  if (Array.isArray(existing)) return [...existing, clause];
  return [existing, clause];
};

const fetchScopedSubjectIds = async (scope) => {
  if (
    !scope ||
    (scope.schoolId === null || scope.schoolId === undefined) &&
    (scope.branchId === null || scope.branchId === undefined) &&
    (scope.courseId === null || scope.courseId === undefined)
  ) {
    return null;
  }

  const filters = ['`deletedAt` IS NULL'];
  const params = [];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  if (params.length === 0) {
    return null;
  }

  const sql = `SELECT id FROM subjects WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.map((row) => (typeof row.id === 'bigint' ? row.id : BigInt(row.id)));
};

const ensureScopedSubjectWhere = async (scope, baseWhere = {}) => {
  const where = { ...baseWhere };

  if (where.schoolId !== undefined && typeof where.schoolId !== 'bigint') {
    where.schoolId = BigInt(where.schoolId);
  }

  if (scope && scope.schoolId !== null && scope.schoolId !== undefined) {
    where.schoolId = BigInt(scope.schoolId);
  }

  const scopedIds = await fetchScopedSubjectIds(scope);
  if (!scopedIds) {
    return { where, empty: false };
  }

  if (scopedIds.length === 0) {
    const scopedClause = { id: { in: [] } };
    where.AND = appendSubjectAndClause(where.AND, scopedClause);
    return { where, empty: true };
  }

  const scopedClause = { id: { in: scopedIds } };
  where.AND = appendSubjectAndClause(where.AND, scopedClause);
  return { where, empty: false };
};

const verifySubjectInScope = async (subjectId, scope) => {
  if (!scope) return true;

  const filters = ['`id` = ?', '`deletedAt` IS NULL'];
  const params = [subjectId.toString()];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  const sql = `SELECT id FROM subjects WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.length > 0;
};

class SubjectController {
  // ======================
  // CRUD OPERATIONS
  // ======================

  /**
   * Create a new subject
   */
  async createSubject(req, res) {
    try {
      const validatedData = req.body;
      let { schoolId, code, departmentId } = validatedData;
      const scope = await resolveManagedScope(req);

      if (scope?.schoolId !== null && scope?.schoolId !== undefined) {
        schoolId = Number(scope.schoolId);
        validatedData.schoolId = schoolId;
      }
      if (scope?.branchId !== null && scope?.branchId !== undefined) {
        validatedData.branchId = Number(scope.branchId);
      }
      if (scope?.courseId !== null && scope?.courseId !== undefined) {
        validatedData.courseId = Number(scope.courseId);
      }

      // Handle schoolId for owners (similar to class controller)
      if (!schoolId && req.user.role === 'SUPER_ADMIN') {
        console.log('Owner detected, fetching schools...');
        // Get the owner's first school
        const owner = await prisma.owner.findUnique({
          where: { id: req.user.id },
          include: {
            schools: {
              take: 1,
              select: { id: true }
            }
          }
        });

        if (!owner || !owner.schools.length) {
          return res.status(400).json({
            success: false,
            error: 'No schools found for this owner. Please create a school first.',
            meta: {
              timestamp: new Date().toISOString()
            }
          });
        }

        schoolId = owner.schools[0].id;
        validatedData.schoolId = schoolId;
        console.log('Set schoolId to:', schoolId);
      } else if (!schoolId) {
        // For non-owners, schoolId is required
        return res.status(400).json({
          success: false,
          error: 'schoolId is required for non-owner users.',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Validate constraints
      const constraints = await validateSubjectConstraints(schoolId, code, departmentId);
      if (!constraints.isValid) {
        throw new ValidationError('Subject constraints validation failed', constraints.errors);
      }

      // Generate code if not provided
      if (!validatedData.code) {
        const existingCodes = await prisma.subject.findMany({
          where: { schoolId: BigInt(schoolId), deletedAt: null },
          select: { code: true }
        });
        validatedData.code = await generateSubjectCode(
          validatedData.name,
          schoolId,
          existingCodes.map(c => c.code)
        );
      }

      // Create subject with proper createdBy and schoolId
      const subjectData = await prisma.subject.create({
        data: {
          ...validatedData,
          schoolId: BigInt(schoolId),
          departmentId: validatedData.departmentId ? BigInt(validatedData.departmentId) : null,
          createdBy: BigInt(req.user.id),
          updatedBy: BigInt(req.user.id)
        },
        include: {
          school: true,
          department: true
        }
      });

      // Clear cache
      await cacheManager.invalidatePattern(`subject:${schoolId}:*`);
      await cacheManager.invalidatePattern(`school:${schoolId}:stats`);

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: convertBigIntToString(subjectData),
        meta: {
          timestamp: new Date().toISOString(),
          createdBy: req.user?.id ? req.user.id.toString() : undefined
        }
      });
    } catch (error) {
      console.error('Create subject error:', error);
      // Ensure BigInt-safe error response
      const message = error?.message || 'Failed to create subject';
      res.status(error?.status || 500).json({
        success: false,
        error: message,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subjects with pagination and filters
   */
  async getSubjects(req, res) {
    try {
      console.log('🔍 getSubjects controller called');
      const validatedData = req.query;
      const { page, limit, sort, order, include } = validatedData;
      let { schoolId } = req.user;
      const scope = await resolveManagedScope(req);
      console.log('Subject scope:', scope);

      if (scope?.schoolId !== null && scope?.schoolId !== undefined) {
        schoolId = Number(scope.schoolId);
      }

      // Build search query with user's schoolId and role
      const where = buildSubjectSearchQuery(validatedData, schoolId, req.user.role);
      const includeQuery = buildSubjectIncludeQuery(include);

      const { where: scopedWhere, empty } = await ensureScopedSubjectWhere(scope, where);
      if (empty) {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          },
          meta: {
            timestamp: new Date().toISOString(),
            filters: validatedData
          }
        });
      }

      const [subjects, total] = await Promise.all([
        prisma.subject.findMany({
          where: scopedWhere,
          include: includeQuery,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { [sort]: order }
        }),
        prisma.subject.count({ where: scopedWhere })
      ]);

      const totalPages = Math.ceil(total / limit);

      console.log('✅ About to send response with', subjects.length, 'subjects');
      res.status(200).json({
        success: true,
        data: convertBigIntToString(subjects),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        meta: {
          timestamp: new Date().toISOString(),
          filters: validatedData
        }
      });
    } catch (error) {
      console.error('Get subjects error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subjects',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subject by ID
   */
  async getSubjectById(req, res) {
    try {
      const { id } = req.params;
      const { include } = req.query;
      const scope = await resolveManagedScope(req);

      const inScope = await verifySubjectInScope(BigInt(id), scope);
      if (!inScope) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const includeQuery = buildSubjectIncludeQuery(include);

      const subjectData = await prisma.subject.findUnique({
        where: { id: BigInt(id) },
        include: includeQuery
      });

      if (!subjectData) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      res.status(200).json({
        success: true,
        data: convertBigIntToString(subjectData),
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get subject by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subject',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Update subject
   */
  async updateSubject(req, res) {
    try {
      const { id } = req.params;
      const validatedData = req.body;
      const scope = await resolveManagedScope(req);

      const inScope = await verifySubjectInScope(BigInt(id), scope);
      if (!inScope) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Check if subject exists
      const existingSubject = await prisma.subject.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingSubject) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Skip validation for subject updates - departments are optional
      // Validation can be re-enabled if needed in the future
      /*
      const codeChanged = validatedData.code && validatedData.code !== existingSubject.code;
      const deptChanged = validatedData.departmentId !== undefined && 
                          validatedData.departmentId?.toString() !== existingSubject.departmentId?.toString();
      
      if (codeChanged || deptChanged) {
        const constraints = await validateSubjectConstraints(
          existingSubject.schoolId.toString(),
          validatedData.code || existingSubject.code,
          deptChanged ? validatedData.departmentId : existingSubject.departmentId?.toString(),
          id
        );
        if (!constraints.isValid) {
          throw new ValidationError('Subject constraints validation failed', constraints.errors);
        }
      }
      */

      // Prepare update data - only include fields that are present in the request
      const updateData = {};
      
      if (validatedData.name !== undefined) updateData.name = validatedData.name;
      if (validatedData.code !== undefined) updateData.code = validatedData.code;
      if (validatedData.description !== undefined) updateData.description = validatedData.description;
      if (validatedData.color !== undefined) updateData.color = validatedData.color;
      if (validatedData.type !== undefined) updateData.type = validatedData.type;
      if (validatedData.credits !== undefined) updateData.credits = validatedData.credits;
      if (validatedData.creditHours !== undefined) updateData.creditHours = validatedData.creditHours;
      if (validatedData.isElective !== undefined) updateData.isElective = validatedData.isElective;
      if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
      if (validatedData.weeklyHoursPerClass !== undefined) updateData.weeklyHoursPerClass = validatedData.weeklyHoursPerClass;
      if (scope?.branchId !== null && scope?.branchId !== undefined) {
        updateData.branchId = BigInt(scope.branchId);
      } else if (validatedData.branchId !== undefined) {
        updateData.branchId = validatedData.branchId ? BigInt(validatedData.branchId) : null;
      }
      if (scope?.courseId !== null && scope?.courseId !== undefined) {
        updateData.courseId = BigInt(scope.courseId);
      } else if (validatedData.courseId !== undefined) {
        updateData.courseId = validatedData.courseId ? BigInt(validatedData.courseId) : null;
      }
      if (validatedData.departmentId !== undefined) {
        updateData.departmentId = validatedData.departmentId ? BigInt(validatedData.departmentId) : null;
      }
      
      // Always set updatedBy
      updateData.updatedBy = BigInt(req.user.id);
      
      // Update subject
      const updatedSubject = await prisma.subject.update({
        where: { id: BigInt(id) },
        data: updateData,
        include: {
          school: true,
          department: true
        }
      });

      // Clear cache
      await cacheManager.invalidatePattern(`subject:${existingSubject.schoolId}:*`);
      await cacheManager.invalidatePattern(`school:${existingSubject.schoolId}:stats`);

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: convertBigIntToString(updatedSubject),
        meta: {
          timestamp: new Date().toISOString(),
          updatedBy: req.user.id.toString()
        }
      });
    } catch (error) {
      console.error('Update subject error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Failed to update subject',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Delete subject (soft delete)
   */
  async deleteSubject(req, res) {
    try {
      const { id } = req.params;
      const scope = await resolveManagedScope(req);

      const inScope = await verifySubjectInScope(BigInt(id), scope);
      if (!inScope) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const existingSubject = await prisma.subject.findUnique({
        where: { id: BigInt(id) }
      });

      if (!existingSubject) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Soft delete
      await prisma.subject.update({
        where: { id: BigInt(id) },
        data: {
          deletedAt: new Date(),
          updatedBy: BigInt(req.user.id)
        }
      });

      // Clear cache
      await cacheManager.invalidatePattern(`subject:${existingSubject.schoolId}:*`);
      await cacheManager.invalidatePattern(`school:${existingSubject.schoolId}:stats`);

      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully',
        meta: {
          timestamp: new Date().toISOString(),
          deletedBy: req.user.id
        }
      });
    } catch (error) {
      console.error('Delete subject error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete subject',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Restore deleted subject
   */
  async restoreSubject(req, res) {
    try {
      const { id } = req.params;
      const scope = await resolveManagedScope(req);

      const inScope = await verifySubjectInScope(BigInt(id), scope);
      if (!inScope) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const existingSubject = await prisma.subject.findUnique({
        where: { id: BigInt(id) },
        include: { deletedAt: true }
      });

      if (!existingSubject) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      if (!existingSubject.deletedAt) {
        return res.status(400).json({
          success: false,
          error: 'Subject is not deleted',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      // Restore subject
      const restoredSubject = await prisma.subject.update({
        where: { id: BigInt(id) },
        data: {
          deletedAt: null,
          updatedBy: BigInt(req.user.id)
        },
        include: {
          school: true,
          department: true
        }
      });

      // Clear cache
      await cacheManager.invalidatePattern(`subject:${restoredSubject.schoolId}:*`);
      await cacheManager.invalidatePattern(`school:${restoredSubject.schoolId}:stats`);

      res.status(200).json({
        success: true,
        message: 'Subject restored successfully',
        data: restoredSubject,
        meta: {
          timestamp: new Date().toISOString(),
          restoredBy: req.user.id
        }
      });
    } catch (error) {
      console.error('Restore subject error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to restore subject',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // ======================
  // STATISTICS & ANALYTICS
  // ======================

  /**
   * Get subject statistics
   */
  async getSubjectStats(req, res) {
    try {
      const { id } = req.params;
      const scope = await resolveManagedScope(req);

      const inScope = await verifySubjectInScope(BigInt(id), scope);
      if (!inScope) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const stats = await generateSubjectStats(id);

      res.status(200).json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
          subjectId: id
        }
      });
    } catch (error) {
      console.error('Get subject stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subject statistics',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subject analytics
   */
  async getSubjectAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;

      const scope = await resolveManagedScope(req);
      const inScope = await verifySubjectInScope(BigInt(id), scope);
      if (!inScope) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const analytics = await generateSubjectAnalytics(id, period);

      res.status(200).json({
        success: true,
        data: analytics,
        meta: {
          timestamp: new Date().toISOString(),
          subjectId: id,
          period
        }
      });
    } catch (error) {
      console.error('Get subject analytics error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subject analytics',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subject performance
   */
  async getSubjectPerformance(req, res) {
    try {
      const { id } = req.params;

      const scope = await resolveManagedScope(req);
      const inScope = await verifySubjectInScope(BigInt(id), scope);
      if (!inScope) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const performance = await calculateSubjectPerformance(id);

      res.status(200).json({
        success: true,
        data: performance,
        meta: {
          timestamp: new Date().toISOString(),
          subjectId: id
        }
      });
    } catch (error) {
      console.error('Get subject performance error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subject performance',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk create subjects
   */
  async bulkCreateSubjects(req, res) {
    try {
      const { subjects } = req.body;
      const scope = await resolveManagedScope(req);

      if (!Array.isArray(subjects) || subjects.length === 0) {
        throw new ValidationError('Subjects array is required and cannot be empty');
      }

      // Handle default schoolId for owners
      let defaultSchoolId = null;
      if (scope?.schoolId !== null && scope?.schoolId !== undefined) {
        defaultSchoolId = Number(scope.schoolId);
      }
      if (req.user.role === 'SUPER_ADMIN' && defaultSchoolId === null) {
        console.log('Owner detected, fetching schools...');
        // Get the owner's first school
        const owner = await prisma.owner.findUnique({
          where: { id: req.user.id },
          include: {
            schools: {
              take: 1,
              select: { id: true }
            }
          }
        });

        if (!owner || !owner.schools.length) {
          return res.status(400).json({
            success: false,
            error: 'No schools found for this owner. Please create a school first.',
            meta: {
              timestamp: new Date().toISOString()
            }
          });
        }

        defaultSchoolId = owner.schools[0].id;
        console.log('Set default schoolId to:', defaultSchoolId);
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < subjects.length; i++) {
        try {
          const subjectData = subjects[i];
          
          // Use default schoolId if not provided and user is owner
          const schoolId = scope?.schoolId !== null && scope?.schoolId !== undefined
            ? Number(scope.schoolId)
            : (subjectData.schoolId || defaultSchoolId);
          subjectData.schoolId = schoolId;
          
          if (!schoolId) {
            errors.push({
              index: i,
              error: 'schoolId is required for non-owner users',
            });
            continue;
          }
          
          // Validate each subject
          const validation = SubjectCreateSchema.safeParse(subjectData);
          if (!validation.success) {
            errors.push({
              index: i,
              errors: validation.error.errors
            });
            continue;
          }

          // Validate constraints
          const constraints = await validateSubjectConstraints(
            schoolId,
            subjectData.code,
            subjectData.departmentId
          );
          if (!constraints.isValid) {
            errors.push({
              index: i,
              errors: constraints.errors
            });
            continue;
          }

          // Generate code if not provided
          if (!subjectData.code) {
            const existingCodes = await prisma.subject.findMany({
              where: { schoolId: BigInt(schoolId), deletedAt: null },
              select: { code: true }
            });
            subjectData.code = await generateSubjectCode(
              subjectData.name,
              schoolId,
              existingCodes.map(c => c.code)
            );
          }

          const branchIdOverride = scope?.branchId !== null && scope?.branchId !== undefined
            ? BigInt(scope.branchId)
            : subjectData.branchId
              ? BigInt(subjectData.branchId)
              : null;
          if (branchIdOverride !== null) {
            subjectData.branchId = Number(branchIdOverride);
          }
          const courseIdOverride = scope?.courseId !== null && scope?.courseId !== undefined
            ? BigInt(scope.courseId)
            : subjectData.courseId
              ? BigInt(subjectData.courseId)
              : null;
          if (courseIdOverride !== null) {
            subjectData.courseId = Number(courseIdOverride);
          }

          // Create subject with proper createdBy and schoolId
          const createdSubject = await prisma.subject.create({
            data: {
              ...subjectData,
              schoolId: BigInt(schoolId),
              branchId: branchIdOverride,
              courseId: courseIdOverride,
              departmentId: subjectData.departmentId ? BigInt(subjectData.departmentId) : null,
              createdBy: BigInt(req.user.id),
              updatedBy: BigInt(req.user.id)
            }
          });

          results.push(createdSubject);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }

      // Clear cache for affected schools
      const schoolIds = [...new Set(results.map((s) => (s.schoolId ? s.schoolId.toString() : null)).filter(Boolean))];
      for (const schoolId of schoolIds) {
        await cacheManager.invalidatePattern(`subject:${schoolId}:*`);
        await cacheManager.invalidatePattern(`school:${schoolId}:stats`);
      }

      res.status(200).json({
        success: true,
        message: `Bulk create completed. ${results.length} subjects created, ${errors.length} failed.`,
        data: {
          created: results,
          errors
        },
        meta: {
          timestamp: new Date().toISOString(),
          total: subjects.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error('Bulk create subjects error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Failed to bulk create subjects',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Bulk update subjects
   */
  async bulkUpdateSubjects(req, res) {
    try {
      const { updates } = req.body;

      if (!Array.isArray(updates) || updates.length === 0) {
        throw new ValidationError('Updates array is required and cannot be empty');
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < updates.length; i++) {
        try {
          const update = updates[i];
          
          if (!update.id) {
            errors.push({
              index: i,
              error: 'ID is required for each update'
            });
            continue;
          }

          // Validate update data
          const validation = SubjectUpdateSchema.safeParse(update);
          if (!validation.success) {
            errors.push({
              index: i,
              errors: validation.error.errors
            });
            continue;
          }

          // Check if subject exists
          const existingSubject = await prisma.subject.findUnique({
            where: { id: BigInt(update.id) }
          });

          if (!existingSubject) {
            errors.push({
              index: i,
              error: 'Subject not found'
            });
            continue;
          }

          // Validate constraints if code or department is being updated
          if (update.code || update.departmentId) {
            const constraints = await validateSubjectConstraints(
              existingSubject.schoolId.toString(),
              update.code || existingSubject.code,
              update.departmentId || existingSubject.departmentId?.toString(),
              update.id
            );
            if (!constraints.isValid) {
              errors.push({
                index: i,
                errors: constraints.errors
              });
              continue;
            }
          }

          // Update subject
          const updatedSubject = await prisma.subject.update({
            where: { id: BigInt(update.id) },
            data: {
              ...update,
              departmentId: update.departmentId ? BigInt(update.departmentId) : undefined,
              updatedBy: BigInt(req.user.id)
            }
          });

          results.push(updatedSubject);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }

      // Clear cache for affected schools
      const schoolIds = [...new Set(results.map(s => s.schoolId.toString()))];
      for (const schoolId of schoolIds) {
        await cacheManager.invalidatePattern(`subject:${schoolId}:*`);
        await cacheManager.invalidatePattern(`school:${schoolId}:stats`);
      }

      res.status(200).json({
        success: true,
        message: `Bulk update completed. ${results.length} subjects updated, ${errors.length} failed.`,
        data: {
          updated: results,
          errors
        },
        meta: {
          timestamp: new Date().toISOString(),
          total: updates.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error('Bulk update subjects error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Failed to bulk update subjects',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Bulk delete subjects
   */
  async bulkDeleteSubjects(req, res) {
    try {
      const { subjectIds } = req.body;
      const scope = await resolveManagedScope(req);

      if (!Array.isArray(subjectIds) || subjectIds.length === 0) {
        throw new ValidationError('Subject IDs array is required and cannot be empty');
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < subjectIds.length; i++) {
        try {
          const subjectId = subjectIds[i];

          const existingSubject = await prisma.subject.findUnique({
            where: { id: BigInt(subjectId) }
          });

          if (!existingSubject) {
            errors.push({
              index: i,
              subjectId,
              error: 'Subject not found'
            });
            continue;
          }

          const inScope = await verifySubjectInScope(BigInt(subjectId), scope);
          if (!inScope) {
            errors.push({
              index: i,
              subjectId,
              error: 'Access denied'
            });
            continue;
          }

          // Soft delete
          await prisma.subject.update({
            where: { id: BigInt(subjectId) },
            data: {
              deletedAt: new Date(),
              updatedBy: BigInt(req.user.id)
            }
          });

          results.push({ id: subjectId, name: existingSubject.name, schoolId: existingSubject.schoolId });
        } catch (error) {
          errors.push({
            index: i,
            subjectId: subjectIds[i],
            error: error.message
          });
        }
      }

      // Clear cache for affected schools
      const schoolIds = [...new Set(results.map(s => s.schoolId))];
      for (const schoolId of schoolIds) {
        await cacheManager.invalidatePattern(`subject:${schoolId}:*`);
        await cacheManager.invalidatePattern(`school:${schoolId}:stats`);
      }

      res.status(200).json({
        success: true,
        message: `Bulk delete completed. ${results.length} subjects deleted, ${errors.length} failed.`,
        data: {
          deleted: results,
          errors
        },
        meta: {
          timestamp: new Date().toISOString(),
          total: subjectIds.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error('Bulk delete subjects error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Failed to bulk delete subjects',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  /**
   * Search subjects with advanced filters
   */
  async searchSubjects(req, res) {
    return this.getSubjects(req, res);
  }

  // ======================
  // EXPORT & IMPORT
  // ======================

  /**
   * Export subjects data
   */
  async exportSubjects(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      let { schoolId } = req.user;
      const scope = await resolveManagedScope(req);

      if (scope?.schoolId !== null && scope?.schoolId !== undefined) {
        schoolId = Number(scope.schoolId);
      }

      // Build search query with user's schoolId
      const where = buildSubjectSearchQuery(filters, schoolId);
      const includeQuery = buildSubjectIncludeQuery('school,department');

      const { where: scopedWhere, empty } = await ensureScopedSubjectWhere(scope, where);
      if (empty) {
        return res.status(200).json({
          success: true,
          data: format === 'csv' ? '' : [],
          meta: {
            timestamp: new Date().toISOString(),
            format,
            total: 0
          }
        });
      }

      const subjects = await prisma.subject.findMany({
        where: scopedWhere,
        include: includeQuery
      });

      const exportData = await generateSubjectExportData(subjects, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="subjects.csv"');
        return res.send(exportData);
      }

      res.status(200).json({
        success: true,
        data: exportData,
        meta: {
          timestamp: new Date().toISOString(),
          format,
          total: subjects.length
        }
      });
    } catch (error) {
      console.error('Export subjects error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export subjects',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Import subjects data
   */
  async importSubjects(req, res) {
    try {
      const { subjects } = req.body;

      if (!Array.isArray(subjects) || subjects.length === 0) {
        throw new ValidationError('Subjects array is required and cannot be empty');
      }

      // Handle default schoolId for owners
      let defaultSchoolId = null;
      if (req.user.role === 'SUPER_ADMIN') {
        console.log('Owner detected, fetching schools...');
        // Get the owner's first school
        const owner = await prisma.owner.findUnique({
          where: { id: req.user.id },
          include: {
            schools: {
              take: 1,
              select: { id: true }
            }
          }
        });

        if (!owner || !owner.schools.length) {
          return res.status(400).json({
            success: false,
            error: 'No schools found for this owner. Please create a school first.',
            meta: {
              timestamp: new Date().toISOString()
            }
          });
        }

        defaultSchoolId = owner.schools[0].id;
        console.log('Set default schoolId to:', defaultSchoolId);
      }

      // Validate import data
      const validationErrors = validateSubjectImportData(subjects);
      if (validationErrors.length > 0) {
        throw new ValidationError('Import validation failed', validationErrors);
      }

      const results = [];
      const errors = [];

      const scope = await resolveManagedScope(req);
      if (scope?.schoolId !== null && scope?.schoolId !== undefined && defaultSchoolId === null) {
        defaultSchoolId = Number(scope.schoolId);
      }

      for (let i = 0; i < subjects.length; i++) {
        try {
          const subjectData = subjects[i];
          
          // Use default schoolId if not provided and user is owner
          const schoolId = scope?.schoolId !== null && scope?.schoolId !== undefined
            ? Number(scope.schoolId)
            : (subjectData.schoolId || defaultSchoolId);
          subjectData.schoolId = schoolId;
          
          if (!schoolId) {
            errors.push({
              index: i,
              error: 'schoolId is required for non-owner users',
            });
            continue;
          }
          
          // Validate constraints
          const constraints = await validateSubjectConstraints(
            schoolId,
            subjectData.code,
            subjectData.departmentId
          );
          if (!constraints.isValid) {
            errors.push({
              index: i,
              errors: constraints.errors
            });
            continue;
          }

          // Generate code if not provided
          if (!subjectData.code) {
            const existingCodes = await prisma.subject.findMany({
              where: { schoolId: BigInt(schoolId), deletedAt: null },
              select: { code: true }
            });
            subjectData.code = await generateSubjectCode(
              subjectData.name,
              schoolId,
              existingCodes.map(c => c.code)
            );
          }

          const branchIdOverride = scope?.branchId !== null && scope?.branchId !== undefined
            ? BigInt(scope.branchId)
            : subjectData.branchId
              ? BigInt(subjectData.branchId)
              : null;
          if (branchIdOverride !== null) {
            subjectData.branchId = Number(branchIdOverride);
          }
          const courseIdOverride = scope?.courseId !== null && scope?.courseId !== undefined
            ? BigInt(scope.courseId)
            : subjectData.courseId
              ? BigInt(subjectData.courseId)
              : null;
          if (courseIdOverride !== null) {
            subjectData.courseId = Number(courseIdOverride);
          }

          // Create subject with proper createdBy and schoolId
          const createdSubject = await prisma.subject.create({
            data: {
              ...subjectData,
              schoolId: BigInt(schoolId),
              branchId: branchIdOverride,
              courseId: courseIdOverride,
              departmentId: subjectData.departmentId ? BigInt(subjectData.departmentId) : null,
              createdBy: BigInt(req.user.id),
              updatedBy: BigInt(req.user.id)
            }
          });

          results.push(createdSubject);
        } catch (error) {
          errors.push({
            index: i,
            error: error.message
          });
        }
      }

      // Clear cache for affected schools
      const schoolIds = [...new Set(results.map((s) => (s.schoolId ? s.schoolId.toString() : null)).filter(Boolean))];
      for (const schoolId of schoolIds) {
        await cacheManager.invalidatePattern(`subject:${schoolId}:*`);
        await cacheManager.invalidatePattern(`school:${schoolId}:stats`);
      }

      res.status(200).json({
        success: true,
        message: `Import completed. ${results.length} subjects imported, ${errors.length} failed.`,
        data: {
          imported: results,
          errors
        },
        meta: {
          timestamp: new Date().toISOString(),
          total: subjects.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      console.error('Import subjects error:', error);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || 'Failed to import subjects',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // ======================
  // UTILITY ENDPOINTS
  // ======================

  /**
   * Generate subject code suggestions
   */
  async generateCodeSuggestions(req, res) {
    try {
      const { name, schoolId: querySchoolId } = req.query;
      const scope = await resolveManagedScope(req);

      let schoolId = querySchoolId;
      if (scope?.schoolId !== null && scope?.schoolId !== undefined) {
        if (schoolId && BigInt(schoolId) !== BigInt(scope.schoolId)) {
          return res.status(403).json({
            success: false,
            error: 'Access denied: cannot generate codes for another school',
            meta: {
              timestamp: new Date().toISOString()
            }
          });
        }
        schoolId = scope.schoolId.toString();
      }

      if (!name || !schoolId) {
        return res.status(400).json({
          success: false,
          error: 'Name and schoolId are required',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const school = await prisma.school.findUnique({
        where: { id: BigInt(schoolId) },
        select: { code: true }
      });

      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'School not found',
          meta: {
            timestamp: new Date().toISOString()
          }
        });
      }

      const suggestions = generateSubjectCodeSuggestions(name, school.code);

      res.status(200).json({
        success: true,
        data: suggestions,
        meta: {
          timestamp: new Date().toISOString(),
          name,
          schoolId
        }
      });
    } catch (error) {
      console.error('Generate code suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate code suggestions',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subject count by department
   */
  async getSubjectCountByDepartment(req, res) {
    try {
      const { schoolId } = req.query;
      const scope = await resolveManagedScope(req);
      const baseWhere = { deletedAt: null };
      if (schoolId) {
        baseWhere.schoolId = BigInt(schoolId);
      }

      const { where, empty } = await ensureScopedSubjectWhere(scope, baseWhere);
      if (empty) {
        return res.status(200).json({
          success: true,
          data: [],
          meta: {
            timestamp: new Date().toISOString(),
            schoolId
          }
        });
      }

      const countByDepartment = await prisma.subject.groupBy({
        by: ['departmentId'],
        where,
        _count: { id: true }
      });

      const departmentIds = countByDepartment.map((item) => item.departmentId).filter(Boolean);
      const departments = await prisma.department.findMany({
        where: {
          id: { in: departmentIds },
          deletedAt: null
        },
        select: { id: true, name: true, code: true }
      });

      const data = countByDepartment.map((item) => ({
        departmentId: item.departmentId?.toString(),
        departmentName: departments.find((dept) => dept.id === item.departmentId)?.name || 'No Department',
        departmentCode: departments.find((dept) => dept.id === item.departmentId)?.code || 'N/A',
        count: item._count.id
      }));

      res.status(200).json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          schoolId
        }
      });
    } catch (error) {
      console.error('Get subject count by department error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subject count by department',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subject count by credit hours
   */
  async getSubjectCountByCreditHours(req, res) {
    try {
      const { schoolId } = req.query;
      const scope = await resolveManagedScope(req);
      const baseWhere = { deletedAt: null };
      if (schoolId) {
        baseWhere.schoolId = BigInt(schoolId);
      }

      const { where, empty } = await ensureScopedSubjectWhere(scope, baseWhere);
      if (empty) {
        return res.status(200).json({
          success: true,
          data: [],
          meta: {
            timestamp: new Date().toISOString(),
            schoolId
          }
        });
      }

      const countByCreditHours = await prisma.subject.groupBy({
        by: ['creditHours'],
        where,
        _count: { id: true },
        orderBy: { creditHours: 'asc' }
      });

      const data = countByCreditHours.map((item) => ({
        creditHours: item.creditHours,
        count: item._count.id
      }));

      res.status(200).json({
        success: true,
        data,
        meta: {
          timestamp: new Date().toISOString(),
          schoolId
        }
      });
    } catch (error) {
      console.error('Get subject count by credit hours error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subject count by credit hours',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subjects by school
   */
  async getSubjectsBySchool(req, res) {
    try {
      const { schoolId } = req.params;
      const { include } = req.query;
      const scope = await resolveManagedScope(req);

      const includeQuery = buildSubjectIncludeQuery(include);

      const baseWhere = {
          schoolId: BigInt(schoolId),
          deletedAt: null
      };
      const { where, empty } = await ensureScopedSubjectWhere(scope, baseWhere);
      if (empty) {
        return res.status(200).json({
          success: true,
          data: [],
          meta: {
            timestamp: new Date().toISOString(),
            schoolId,
            total: 0
          }
        });
      }

      const subjects = await prisma.subject.findMany({
        where,
        include: includeQuery,
        orderBy: [{ name: 'asc' }]
      });

      res.status(200).json({
        success: true,
        data: subjects,
        meta: {
          timestamp: new Date().toISOString(),
          schoolId,
          total: subjects.length
        }
      });
    } catch (error) {
      console.error('Get subjects by school error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subjects by school',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Get subjects by department
   */
  async getSubjectsByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const { include } = req.query;
      let { schoolId } = req.user;
      const scope = await resolveManagedScope(req);

      if (scope?.schoolId !== null && scope?.schoolId !== undefined) {
        schoolId = Number(scope.schoolId);
      }

      const includeQuery = buildSubjectIncludeQuery(include);

      const baseWhere = {
          departmentId: BigInt(departmentId),
          schoolId: BigInt(schoolId),
          deletedAt: null
      };
      const { where, empty } = await ensureScopedSubjectWhere(scope, baseWhere);
      if (empty) {
        return res.status(200).json({
          success: true,
          data: [],
          meta: {
            timestamp: new Date().toISOString(),
            departmentId,
            total: 0
          }
        });
      }

      const subjects = await prisma.subject.findMany({
        where,
        include: includeQuery,
        orderBy: [{ name: 'asc' }]
      });

      res.status(200).json({
        success: true,
        data: subjects,
        meta: {
          timestamp: new Date().toISOString(),
          departmentId,
          total: subjects.length
        }
      });
    } catch (error) {
      console.error('Get subjects by department error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subjects by department',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // ======================
  // CACHE MANAGEMENT
  // ======================

  /**
   * Get cache statistics
   */
  async getCacheStats(req, res) {
    try {
      const stats = await cacheManager.getStats();

      res.status(200).json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Get cache stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cache statistics',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  /**
   * Warm up cache
   */
  async warmCache(req, res) {
    try {
      const { subjectId, schoolId } = req.body;

      if (subjectId) {
        // Warm cache for specific subject
        await generateSubjectStats(subjectId);
        await generateSubjectAnalytics(subjectId);
        await calculateSubjectPerformance(subjectId);
      } else if (schoolId) {
        // Warm cache for all subjects in school
        const subjects = await prisma.subject.findMany({
          where: {
            schoolId: BigInt(schoolId),
            deletedAt: null
          },
          select: { id: true }
        });

        for (const subject of subjects) {
          await generateSubjectStats(subject.id.toString());
        }
      } else {
        // Warm cache for all subjects
        const subjects = await prisma.subject.findMany({
          where: { deletedAt: null },
          select: { id: true },
          take: 100 // Limit to prevent timeout
        });

        for (const subject of subjects) {
          await generateSubjectStats(subject.id.toString());
        }
      }

      res.status(200).json({
        success: true,
        message: 'Cache warming completed',
        meta: {
          timestamp: new Date().toISOString(),
          subjectId,
          schoolId
        }
      });
    } catch (error) {
      console.error('Warm cache error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to warm cache',
        meta: {
          timestamp: new Date().toISOString()
        }
      });
    }
  }
}

export default new SubjectController(); 