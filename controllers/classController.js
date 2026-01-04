import prisma from '../utils/prismaClient.js';
import { resolveManagedScope, applyScopeToWhere, normalizeScopeWithSchool, appendScopeToSql, toBigIntSafe, toBigIntOrNull } from '../utils/contextScope.js';
import * as classCache from '../cache/classCache.js';
import * as classSchemas from '../utils/classSchemas.js';
import { 
  triggerEntityCreatedNotifications,
  triggerEntityUpdatedNotifications,
  triggerEntityDeletedNotifications,
  triggerBulkOperationNotifications
} from '../utils/notificationTriggers.js';
import { z } from 'zod';


// Helper to convert all BigInt fields to strings and boolean fields properly
function convertBigInts(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  } else if (obj && typeof obj === 'object') {
    // Handle Date objects
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    
    const newObj = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'bigint') {
          newObj[key] = value.toString();
        } else {
          // Convert boolean fields that come as 0/1 from MySQL
          // Check if key suggests it's a boolean field (starts with 'is', 'has', ends with 'Active', etc.)
          const keyLower = key.toLowerCase();
          const isBooleanField = keyLower.startsWith('is') || 
                                 keyLower.startsWith('has') || 
                                 keyLower.endsWith('active') ||
                                 keyLower === 'deleted' ||
                                 keyLower === 'enabled' ||
                                 keyLower === 'disabled';
          
          if (isBooleanField && (value === 0 || value === '0' || value === false)) {
            newObj[key] = false;
          } else if (isBooleanField && (value === 1 || value === '1' || value === true)) {
            newObj[key] = true;
          } else {
            newObj[key] = convertBigInts(value);
          }
        }
      }
    }
    return newObj;
  }
  return obj;
}

const buildClassScopedWhere = (baseWhere, scope) => {
  const scoped = applyScopeToWhere(baseWhere, scope, { useBranch: false, useCourse: false });
  const result = { ...scoped };

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    result.school = {
      ...(result.school || {}),
      is: {
        ...(result.school?.is || {}),
        id: scope.schoolId
      }
    };
    delete result.schoolId;
  }

  if (scope.branchId !== null && scope.branchId !== undefined) {
    result.branchAssignment = {
      ...(result.branchAssignment || {}),
      some: {
        ...(result.branchAssignment?.some || {}),
        branchId: scope.branchId,
        revokedAt: null
      }
    };
  }

  if (scope.courseId !== null && scope.courseId !== undefined) {
    result.managerAssignments = {
      ...(result.managerAssignments || {}),
      some: {
        ...(result.managerAssignments?.some || {}),
        courseId: scope.courseId,
        revokedAt: null
      }
    };
  }

  return result;
};

const fetchScopedClassIds = async (scope) => {
  if (
    !scope ||
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

  const sql = `SELECT id FROM classes WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.map((row) => (typeof row.id === 'bigint' ? row.id : BigInt(row.id)));
};

const verifyClassInScope = async (classId, scope) => {
  const filters = ['`id` = ?', '`deletedAt` IS NULL'];
  const params = [classId.toString()];

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

  const sql = `SELECT id FROM classes WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.length > 0;
};

const ensureScopedClassWhere = async (scope, baseWhere = {}) => {
  const where = { ...baseWhere };

  if (scope && scope.schoolId !== null && scope.schoolId !== undefined) {
    where.schoolId = scope.schoolId;
  }

  // Proper scoping logic:
  // 1. Course level: Only show classes with that specific courseId (strict match)
  // 2. Branch level (no course): Show classes with that branchId OR null branchId (school-level classes)
  // 3. School level only: Show all classes in the school (no branchId/courseId filter)
  
  if (scope && scope.courseId !== null && scope.courseId !== undefined) {
    // Course context: strict match - only classes with this courseId
    where.courseId = scope.courseId;
    console.log(`🔍 Filtering classes by courseId: ${scope.courseId}`);
  } else if (scope && scope.branchId !== null && scope.branchId !== undefined) {
    // Branch context (but no course): show classes with this branchId OR null branchId (school-level)
    // Also ensure courseId is null (don't show course-specific classes in branch view)
    where.courseId = null;
    
    // Add branch filter: classes with this branchId OR null branchId
    // If there's already an OR condition (e.g., from search), we need to combine them with AND
    const branchOrCondition = {
      OR: [
        { branchId: scope.branchId },
        { branchId: null }
      ]
    };
    
    // If baseWhere has an OR (e.g., search), combine with AND
    if (where.OR && Array.isArray(where.OR)) {
      const existingOr = where.OR;
      delete where.OR;
      where.AND = [
        { OR: existingOr },
        branchOrCondition
      ];
    } else {
      // No existing OR, just add the branch OR condition
      where.OR = branchOrCondition.OR;
    }
  }
  // If only schoolId is set, no additional filtering needed (show all classes in school)

  return { where, empty: false };
};

  // ======================
  // ADVANCED RESPONSE FORMATTER
  // ======================
  const formatResponse = (success, data, message = '', meta = {}) => ({
    success,
    data,
    message,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });

  // ======================
  // ERROR HANDLER
  // ======================
const handleError = (res, error, operation = 'operation') => {
  console.error(`Class ${operation} error:`, error);

  if (error?.code === 'P2002') {
    return res.status(409).json(formatResponse(false, null, 'Class with this code already exists in the school'));
  }

  if (error?.code === 'P2025') {
    return res.status(404).json(formatResponse(false, null, 'Class not found'));
  }

  if (error?.code === 'P2003') {
    return res.status(400).json(formatResponse(false, null, 'Invalid foreign key reference'));
  }

  const message = error?.message || 'Unexpected error occurred';
  return res.status(500).json(formatResponse(false, null, `Class ${operation} failed: ${message}`));
  };

  // ======================
  // CACHE UTILITY FUNCTIONS
  // ======================
  const buildCacheKey = (prefix, params = {}) => {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join(':');
    return `${prefix}:${sortedParams}`;
  };

  // ======================
  // GET ALL CLASSES (Advanced with search, filter, pagination, cache)
  // ======================
  export const getAllClasses = async (req, res) => {
    try {
      const query = req.query;
      const parsed = classSchemas.ClassSearchSchema.safeParse(query);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid query parameters', { 
          errors: parsed.error.errors 
        }));
      }
      
      const params = parsed.data;
      const scope = await resolveClassScope(req, 'class listing');

      params.schoolId = Number(scope.schoolId);
      if (scope.branchId !== null && scope.branchId !== undefined) {
        params.branchId = Number(scope.branchId);
      }
      if (scope.courseId !== null && scope.courseId !== undefined) {
        params.courseId = Number(scope.courseId);
      }
      
      // Try cache first
      const cached = await classCache.getClassListFromCache(params);
      if (cached) {
        const convertedCached = convertBigInts(cached);
        return res.json(formatResponse(true, convertedCached.data, 'Classes fetched from cache', { 
          source: 'cache', 
          pagination: convertedCached.pagination,
          ...convertedCached.meta 
        }));
      }
      
      // Build where clause
      const where = {};
      
      // Only filter by isActive if explicitly requested via query parameter
      // This allows inactive classes to be included in the results
      if (params.isActive !== undefined && params.isActive !== null) {
        // Convert string 'true'/'false' to boolean if needed
        const isActiveValue = params.isActive === 'true' || params.isActive === true || params.isActive === 1 || params.isActive === '1';
        where.isActive = isActiveValue;
      }
      // If no isActive filter is provided, include both active and inactive classes
      
      // Basic filters
      if (params.schoolId) where.schoolId = params.schoolId;
      if (params.level) where.level = params.level;
      if (params.section) where.section = params.section;
      if (params.classTeacherId) where.classTeacherId = params.classTeacherId;
      
      // Search
      if (params.search) {
        where.OR = [
          { name: { contains: params.search } },
          { code: { contains: params.search } },
          { roomNumber: { contains: params.search } },
        ];
      }
      
      // Date filters
      if (params.createdAfter) where.createdAt = { gte: params.createdAfter };
      if (params.createdBefore) where.createdAt = { ...where.createdAt, lte: params.createdBefore };
      if (params.updatedAfter) where.updatedAt = { gte: params.updatedAfter };
      if (params.updatedBefore) where.updatedAt = { ...where.updatedAt, lte: params.updatedBefore };
      
      // Capacity filters
      if (params.capacityMin || params.capacityMax) {
        where.capacity = {};
        if (params.capacityMin) where.capacity.gte = params.capacityMin;
        if (params.capacityMax) where.capacity.lte = params.capacityMax;
      }
      
      const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
      if (empty) {
        const emptyResult = {
          data: [],
          pagination: {
            page: params.page,
            limit: params.limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: params.page > 1
          },
          meta: {
            timestamp: new Date().toISOString(),
            source: 'database',
            filters: Object.keys(params).length,
            cacheHit: false
          }
        };
        await classCache.setClassListInCache(params, emptyResult);
        return res.json(formatResponse(true, emptyResult.data, 'Classes fetched successfully', {
          pagination: emptyResult.pagination,
          ...emptyResult.meta
        }));
      }
      
      // Build include clause
      const include = {};
      if (params.include) {
        const includes = params.include.split(',');
        if (includes.includes('school')) include.school = true;
        if (includes.includes('students')) include.students = true;
        if (includes.includes('subjects')) include.subjects = true;

        if (includes.includes('timetables')) include.timetables = true;
        if (includes.includes('exams')) include.exams = true;
        if (includes.includes('sections')) include.sections = true;
        if (includes.includes('assignments')) include.assignments = true;
        if (includes.includes('attendances')) include.attendances = true;
        if (includes.includes('_count')) include._count = {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
          }
        };
      } else {
        // Default includes
        include.school = {
          select: {
            id: true,
            name: true,
            code: true,
          }
        };
        include._count = {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
          }
        };
      }
      
      // Get total count
      const total = await prisma.class.count({ where: scopedWhere });
      
      // Get classes with pagination
      const classes = await prisma.class.findMany({
        where: scopedWhere,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include,
      });
      
      const result = {
        data: classes,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit),
          hasNext: params.page * params.limit < total,
          hasPrev: params.page > 1,
        },
        meta: { 
          timestamp: new Date().toISOString(), 
          source: 'database',
          filters: Object.keys(params).length,
          cacheHit: false,
        },
      };
      
      // Cache the result
      await classCache.setClassListInCache(params, result);
      
      const convertedResult = convertBigInts(result);
      
      // Debug: Check for any remaining BigInt values
      const checkForBigInts = (obj, path = '') => {
        if (obj === null || obj === undefined) return;
        if (typeof obj === 'bigint') {
          console.error(`BigInt found at path: ${path}, value: ${obj}`);
          throw new Error(`BigInt found at path: ${path}`);
        }
        if (Array.isArray(obj)) {
          obj.forEach((item, index) => checkForBigInts(item, `${path}[${index}]`));
        } else if (obj && typeof obj === 'object') {
          for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
              checkForBigInts(obj[key], `${path}.${key}`);
            }
          }
        }
      };
      
      try {
        checkForBigInts(convertedResult);
      } catch (error) {
        console.error('BigInt detection error:', error);
        throw error;
      }
      
      return res.json(formatResponse(true, convertedResult.data, 'Classes fetched successfully', convertedResult.pagination));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to fetch classes');
    }
  };

  // ======================
  // GET CLASS BY ID (with cache and relations)
  // ======================
  export const getClassById = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      // Try cache first
      const cached = await classCache.getClassFromCache(id);
      if (cached) {
        return res.json(formatResponse(true, cached, 'Class fetched from cache', { 
          source: 'cache' 
        }));
      }
      
      // Build include clause based on query params
      const include = {};
      if (req.query.include) {
        const includes = req.query.include.split(',');
        if (includes.includes('school')) include.school = true;
        if (includes.includes('students')) {
          include.students = {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                }
              }
            }
          };
        }
        if (includes.includes('subjects')) include.subjects = true;
        if (includes.includes('supervisor')) {
          include.supervisor = {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                }
              }
            }
          };
        }
        if (includes.includes('timetables')) include.timetables = true;
        if (includes.includes('exams')) include.exams = true;
        if (includes.includes('sections')) include.sections = true;
        if (includes.includes('assignments')) include.assignments = true;
        if (includes.includes('attendances')) include.attendances = true;
        if (includes.includes('_count')) include._count = {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
          }
        };
      } else {
        // Default includes
        include.school = {
          select: {
            id: true,
            name: true,
            code: true,
          }
        };
        include._count = {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
          }
        };
      }
      
      const scope = await resolveClassScope(req, 'class listing');
      const classInScope = await verifyClassInScope(BigInt(id), scope);
      if (!classInScope) {
        return res.status(404).json(formatResponse(false, null, 'Class not found in the selected context'));
      }

      const classObj = await prisma.class.findUnique({
        where: { id },
        include,
      });
      
      if (!classObj) {
        return res.status(404).json(formatResponse(false, null, 'Class not found'));
      }
      
      // Cache the result
      await classCache.setClassInCache(classObj);
      
      return res.json(formatResponse(true, convertBigInts(classObj), 'Class fetched successfully', { 
        source: 'database' 
      }));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to fetch class');
    }
  };

  // ======================
  // CREATE CLASS (with validation and cache invalidation)
  // ======================
  export const createClass = async (req, res) => {
    try {
      const data = { ...req.body };
      const scope = await resolveClassScope(req, 'class creation');
      const schoolId = Number(scope.schoolId);
      if (!schoolId) {
        return res.status(400).json(formatResponse(false, null, 'A managed school context is required to create classes.'));
      }

      data.schoolId = schoolId;
      if (scope.branchId !== null && scope.branchId !== undefined) {
        data.branchId = Number(scope.branchId);
      }
      if (scope.courseId !== null && scope.courseId !== undefined) {
        data.courseId = Number(scope.courseId);
        console.log(`✅ Creating class with courseId: ${data.courseId} (from scope: ${scope.courseId})`);
      } else {
        console.log(`⚠️ Creating class without courseId (scope.courseId: ${scope.courseId})`);
      }
      
      // Auto-generate class code if not provided or if it's just the class name
      let classCode = data.code;
      if (!classCode || classCode === data.name) {
        console.log(`Auto-generating class code for class name: ${data.name}`);
        classCode = await generateNextClassCode(data.name, schoolId);
        console.log(`Generated class code: ${classCode}`);
        data.code = classCode;
      } else {
        console.log(`Using provided class code: ${classCode}`);
      }

      // Always check if the class code already exists in the school
      // COMMENTED OUT: Allow duplicate class codes
      // console.log(`Checking if class code "${classCode}" already exists in school ${schoolId}`);
      // const existingClass = await prisma.class.findFirst({
      //   where: {
      //     code: classCode,
      //     schoolId: schoolId,
      //   }
      // });
      // 
      // if (existingClass) {
      //   console.log(`Class code "${classCode}" already exists:`, existingClass);
      //   return res.status(409).json(formatResponse(false, null, 'Class code already exists in this school'));
      // }
      // 
      // console.log(`Class code "${classCode}" is available, proceeding with creation`);
      
      // Validate class teacher if provided
      if (data.classTeacherId) {
        const teacher = await prisma.teacher.findUnique({
          where: { id: data.classTeacherId },
          include: { school: true }
        });
        
        if (!teacher) {
          return res.status(400).json(formatResponse(false, null, 'Class teacher not found'));
        }
        
        if (teacher.schoolId !== schoolId) {
          return res.status(400).json(formatResponse(false, null, 'Class teacher does not belong to the same school'));
        }
      }
      
      // Create the class with proper createdBy and schoolId
      const classObj = await prisma.class.create({
        data: {
          ...data,
          schoolId: toBigIntSafe(schoolId),
          branchId: data.branchId !== undefined ? toBigIntOrNull(data.branchId) : null,
          courseId: data.courseId !== undefined ? toBigIntOrNull(data.courseId) : null,
          createdBy: toBigIntSafe(req.user.id),
          updatedBy: toBigIntSafe(req.user.id)
        },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              code: true,
            }
          }
        }
      });
      
      console.log(`✅ Class created successfully:`, {
        id: classObj.id.toString(),
        name: classObj.name,
        schoolId: classObj.schoolId?.toString(),
        branchId: classObj.branchId?.toString() || 'null',
        courseId: classObj.courseId?.toString() || 'null',
      });
      
      // If expectedFees was set, propagate to existing students in this class
      if (data.expectedFees !== undefined && data.expectedFees !== null) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE students SET expectedFees = ?, updatedAt = NOW() WHERE classId = ? AND deletedAt IS NULL`,
            data.expectedFees,
            Number(classObj.id)
          );
          console.log(`✅ Set expectedFees for all students in new class ${classObj.id} to ${data.expectedFees}`);
        } catch (error) {
          console.error('Error setting expectedFees for students:', error);
          // Don't fail class creation if student update fails
        }
      }
      
      // Trigger automatic notification for class creation
      await triggerEntityCreatedNotifications(
        'class',
        classObj.id.toString(),
        classObj,
        req.user,
        {
          auditDetails: {
            classId: classObj.id.toString(),
            className: classObj.name,
            classCode: classObj.code,
            level: classObj.level,
            section: classObj.section
          }
        }
      );
      
      // Invalidate cache
      await classCache.invalidateClassCacheOnCreate(classObj);
      
      return res.status(201).json(formatResponse(true, convertBigInts(classObj), 'Class created successfully'));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to create class');
    }
  };

  // ======================
  // UPDATE CLASS (with validation and cache invalidation)
  // ======================
  export const updateClass = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }

      const scope = await resolveClassScope(req, 'class update');
      await ensureClassAccessible(id, scope);
      
      const parsed = classSchemas.ClassUpdateSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class data', { 
          errors: parsed.error.errors 
        }));
      }
      
      const data = parsed.data;
      
      // Fetch existing class within scope using raw SQL to avoid datetime issues
      let existingClassQuery = `
        SELECT c.*, s.name as school_name, s.code as school_code,
               (SELECT COUNT(*) FROM students st 
                WHERE st.classId = c.id AND st.deletedAt IS NULL) as student_count
        FROM classes c
        LEFT JOIN schools s ON c.schoolId = s.id
        WHERE c.deletedAt IS NULL AND c.id = ?`;
      let existingClassParams = [id.toString()];
      ({ query: existingClassQuery, params: existingClassParams } = appendScopeToSql(existingClassQuery, existingClassParams, scope, { useBranch: false, useCourse: false, tableAlias: 'c' }));
      const existingClassResult = await prisma.$queryRawUnsafe(existingClassQuery, ...existingClassParams);
      
      const existingClass = existingClassResult[0];
      
      if (existingClass) {
        existingClass.school = {
          id: existingClass.schoolId,
          name: existingClass.school_name,
          code: existingClass.school_code
        };
        existingClass.students = Array.from({ length: Number(existingClass.student_count) }, () => ({}));
      }
      
      if (!existingClass) {
        return res.status(404).json(formatResponse(false, null, 'Class not found in the selected context'));
      }
      
      if (data.capacity && data.capacity < Number(existingClass.student_count)) {
        return res.status(400).json(formatResponse(false, null, 
          `Capacity cannot be less than current student count (${Number(existingClass.student_count)})`));
      }
      
      if (data.classTeacherId && data.classTeacherId !== existingClass.classTeacherId) {
        const teacherResult = await prisma.$queryRaw`
          SELECT id, schoolId FROM teachers 
          WHERE id = ${data.classTeacherId} 
            AND deletedAt IS NULL
        `;
        
        if (teacherResult.length === 0) {
          return res.status(400).json(formatResponse(false, null, 'Class teacher not found'));
        }
        
        const teacher = teacherResult[0];
        if (teacher.schoolId !== existingClass.schoolId) {
          return res.status(400).json(formatResponse(false, null, 'Class teacher does not belong to the same school'));
        }
      }
      
      const cleanData = { ...data };
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      delete cleanData.deletedAt;
      cleanData.updatedBy = toBigIntSafe(req.user.id);
      
      const updateFields = [];
      const updateValues = [];
      
      if (cleanData.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(cleanData.name);
      }
      if (cleanData.code !== undefined) {
        updateFields.push('code = ?');
        updateValues.push(cleanData.code);
      }
      if (cleanData.level !== undefined) {
        updateFields.push('level = ?');
        updateValues.push(cleanData.level);
      }
      if (cleanData.section !== undefined) {
        updateFields.push('section = ?');
        updateValues.push(cleanData.section);
      }
      if (cleanData.roomNumber !== undefined) {
        updateFields.push('roomNumber = ?');
        updateValues.push(cleanData.roomNumber);
      }
      if (cleanData.capacity !== undefined) {
        updateFields.push('capacity = ?');
        updateValues.push(cleanData.capacity);
      }
      if (cleanData.classTeacherId !== undefined) {
        updateFields.push('classTeacherId = ?');
        updateValues.push(cleanData.classTeacherId);
      }
      if (cleanData.expectedFees !== undefined) {
        updateFields.push('expectedFees = ?');
        updateValues.push(cleanData.expectedFees);
      }
      if (cleanData.isActive !== undefined) {
        updateFields.push('isActive = ?');
        updateValues.push(cleanData.isActive);
      }
      if (cleanData.updatedBy !== undefined) {
        updateFields.push('updatedBy = ?');
        updateValues.push(cleanData.updatedBy?.toString() ?? cleanData.updatedBy);
      }
      
      updateFields.push('updatedAt = NOW()');
      
      if (updateFields.length > 0) {
        let updateQuery = `UPDATE classes SET ${updateFields.join(', ')} WHERE deletedAt IS NULL AND id = ?`;
        const updateParams = [...updateValues, id.toString()];
        const scopedUpdate = appendScopeToSql(updateQuery, updateParams, scope, { useBranch: false, useCourse: false });
        await prisma.$executeRawUnsafe(scopedUpdate.query, ...scopedUpdate.params);
      }
      
      if (cleanData.expectedFees !== undefined) {
        try {
          await prisma.$executeRawUnsafe(
            `UPDATE students SET expectedFees = ?, updatedAt = NOW() WHERE classId = ? AND deletedAt IS NULL`,
            cleanData.expectedFees,
            id
          );
        } catch (error) {
          console.error('Error propagating expectedFees to students:', error);
        }
      }
      
      let updatedClassQuery = `
        SELECT c.*, s.name as school_name, s.code as school_code,
               (SELECT COUNT(*) FROM students st 
                WHERE st.classId = c.id AND st.deletedAt IS NULL) as student_count
        FROM classes c
        LEFT JOIN schools s ON c.schoolId = s.id
        WHERE c.deletedAt IS NULL AND c.id = ?`;
      let updatedClassParams = [id.toString()];
      ({ query: updatedClassQuery, params: updatedClassParams } = appendScopeToSql(updatedClassQuery, updatedClassParams, scope, { useBranch: false, useCourse: false, tableAlias: 'c' }));
      const updatedClassResult = await prisma.$queryRawUnsafe(updatedClassQuery, ...updatedClassParams);
      
      const updatedClass = updatedClassResult[0];
      
      if (updatedClass) {
        updatedClass.school = {
          id: updatedClass.schoolId,
          name: updatedClass.school_name,
          code: updatedClass.school_code
        };
        updatedClass._count = {
          students: Number(updatedClass.student_count),
          subjects: 0,
          timetables: 0,
          exams: 0
        };
      }
      
      await triggerEntityUpdatedNotifications(
        'class',
        updatedClass.id.toString(),
        updatedClass,
        existingClass,
        req.user,
        {
          auditDetails: {
            classId: updatedClass.id.toString(),
            className: updatedClass.name,
            updatedFields: Object.keys(data)
          }
        }
      );
      
      await classCache.invalidateClassCacheOnUpdate(updatedClass, existingClass);
      
      return res.json(formatResponse(true, convertBigInts(updatedClass), 'Class updated successfully'));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to update class');
    }
  };

  // ======================
  // DELETE CLASS (with validation and cache invalidation)
  // ======================
  export const deleteClass = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }

      const scope = await resolveClassScope(req, 'class deletion');
      const classIdBigInt = await ensureClassAccessible(id, scope);
      
      const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, { id: classIdBigInt });
      if (empty) {
        return res.status(404).json(formatResponse(false, null, 'Class not found in the selected context'));
      }
      
      const existingClass = await prisma.class.findFirst({
        where: scopedWhere,
        include: {
          students: true,
          subjects: true,
          timetables: true,
          exams: true,
          assignments: true,
          attendances: true,
        }
      });
      
      if (!existingClass) {
        return res.status(404).json(formatResponse(false, null, 'Class not found in the selected context'));
      }
      
      if (existingClass.students.length > 0) {
        return res.status(400).json(formatResponse(false, null, 
          `Cannot delete class with ${existingClass.students.length} students. Please transfer or remove students first.`));
      }
      
      if (existingClass.subjects.length > 0) {
        return res.status(400).json(formatResponse(false, null, 
          `Cannot delete class with ${existingClass.subjects.length} subjects. Please remove subjects first.`));
      }
      
      if (existingClass.timetables.length > 0) {
        return res.status(400).json(formatResponse(false, null, 
          `Cannot delete class with ${existingClass.timetables.length} timetables. Please remove timetables first.`));
      }
      
      if (existingClass.exams.length > 0) {
        return res.status(400).json(formatResponse(false, null, 
          `Cannot delete class with ${existingClass.exams.length} exams. Please remove exams first.`));
      }
      
      await prisma.class.delete({ where: { id: classIdBigInt } });
      
      await triggerEntityDeletedNotifications(
        'class',
        existingClass.id.toString(),
        existingClass,
        req.user,
        {
          auditDetails: {
            classId: existingClass.id.toString(),
            className: existingClass.name,
            classCode: existingClass.code
          }
        }
      );
      
      await classCache.invalidateClassCacheOnDelete(existingClass);
      
      return res.json(formatResponse(true, null, 'Class deleted successfully'));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to delete class');
    }
  };

  // ======================
  // ADVANCED SEARCH CLASSES (with complex filters and cache)
  // ======================
  export const searchClasses = async (req, res) => {
    try {
      const query = req.query;
      const parsed = classSchemas.ClassAdvancedSearchSchema.safeParse(query);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid search parameters', { 
          errors: parsed.error.errors 
        }));
      }
      
      const params = parsed.data;
      const scope = await resolveClassScope(req, 'class search');
      params.schoolId = Number(scope.schoolId);
      if (scope.branchId !== null && scope.branchId !== undefined) {
        params.branchId = Number(scope.branchId);
      }
      if (scope.courseId !== null && scope.courseId !== undefined) {
        params.courseId = Number(scope.courseId);
      }

      const cacheKey = {
        ...params,
        scope: {
          schoolId: scope.schoolId?.toString() ?? null,
          branchId: scope.branchId?.toString() ?? null,
          courseId: scope.courseId?.toString() ?? null
        }
      };
      
      // Try cache first
      const cached = await classCache.getClassSearchFromCache(cacheKey);
      if (cached) {
        return res.json(formatResponse(true, cached.data, 'Classes fetched from cache', { 
          source: 'cache', 
          pagination: cached.pagination,
          ...cached.meta 
        }));
      }
      
      // Build advanced where clause
      const where = {};
      
      // Basic filters
      if (params.schoolId) where.schoolId = params.schoolId;
      if (params.level) where.level = params.level;
      if (params.section) where.section = params.section;
      if (params.classTeacherId) where.classTeacherId = params.classTeacherId;
      
      // Advanced search
      if (params.search) {
        where.OR = [
          { name: { contains: params.search } },
          { code: { contains: params.search } },
          { roomNumber: { contains: params.search } },
          { section: { contains: params.search } },
        ];
      }
      
      // Capacity range filters
      if (params.capacityMin || params.capacityMax) {
        where.capacity = {};
        if (params.capacityMin) where.capacity.gte = params.capacityMin;
        if (params.capacityMax) where.capacity.lte = params.capacityMax;
      }
      
      // Level range filter
      if (params.levelRange) {
        const [min, max] = params.levelRange.split('-').map(Number);
        where.level = { gte: min, lte: max };
      }
      
      // Date filters
      if (params.createdAfter) where.createdAt = { gte: params.createdAfter };
      if (params.createdBefore) where.createdAt = { ...where.createdAt, lte: params.createdBefore };
      if (params.updatedAfter) where.updatedAt = { gte: params.updatedAfter };
      if (params.updatedBefore) where.updatedAt = { ...where.updatedAt, lte: params.updatedBefore };
      
      // Build include clause
      const include = {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },

        _count: {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
          }
        }
      };
      
      const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
      if (empty) {
        const emptyResult = {
          data: [],
          pagination: {
            page: params.page,
            limit: params.limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: params.page > 1,
          },
          meta: {
            timestamp: new Date().toISOString(),
            source: 'database',
            filters: Object.keys(params).length,
            cacheHit: false,
            advancedSearch: true,
          },
        };
        await classCache.setClassSearchInCache(cacheKey, emptyResult);
        return res.json(formatResponse(true, [], 'Classes fetched successfully', emptyResult.pagination));
      }
      
      // Get total count within scope
      const total = await prisma.class.count({ where: scopedWhere });
      
      // Get classes with pagination
      let classes = await prisma.class.findMany({
        where: scopedWhere,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { [params.sortBy]: params.sortOrder },
        include,
      });
      
      // Apply post-query filters for counts
      if (params.studentCountMin || params.studentCountMax) {
        classes = classes.filter(classObj => {
          const studentCount = classObj._count.students;
          if (params.studentCountMin && studentCount < params.studentCountMin) return false;
          if (params.studentCountMax && studentCount > params.studentCountMax) return false;
          return true;
        });
      }
      
      if (params.subjectCountMin || params.subjectCountMax) {
        classes = classes.filter(classObj => {
          const subjectCount = classObj._count.subjects;
          if (params.subjectCountMin && subjectCount < params.subjectCountMin) return false;
          if (params.subjectCountMax && subjectCount > params.subjectCountMax) return false;
          return true;
        });
      }
      
      const result = {
        data: classes,
        pagination: {
          page: params.page,
          limit: params.limit,
          total: classes.length, // Adjusted for post-filtering
          totalPages: Math.ceil(classes.length / params.limit),
          hasNext: params.page * params.limit < classes.length,
          hasPrev: params.page > 1,
        },
        meta: { 
          timestamp: new Date().toISOString(), 
          source: 'database',
          filters: Object.keys(params).length,
          cacheHit: false,
          advancedSearch: true,
        },
      };
      
      // Cache the result
      await classCache.setClassSearchInCache(cacheKey, result);
      
      return res.json(formatResponse(true, convertBigInts(classes), 'Classes fetched successfully', result.pagination));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to search classes');
    }
  };

  // ======================
  // BULK CREATE CLASSES
  // ======================
  export const bulkCreateClasses = async (req, res) => {
    try {
      const parsed = classSchemas.ClassBulkCreateSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid bulk create data', { 
          errors: parsed.error.errors 
        }));
      }
      
      const { classes, options = {} } = parsed.data;
      const results = {
        created: [],
        failed: [],
        skipped: [],
        summary: {
          total: classes.length,
          created: 0,
          failed: 0,
          skipped: 0,
        }
      };
      
      const scope = await resolveClassScope(req, 'bulk class creation');
      const defaultSchoolId = Number(scope.schoolId);
      if (!defaultSchoolId) {
        return res.status(400).json(formatResponse(false, null, 'A managed school context is required to create classes.'));
      }
      
      // Validate only mode
      if (options.validateOnly) {
        for (const classData of classes) {
          try {
            const schoolId = defaultSchoolId;
            classData.schoolId = schoolId;
            if (scope.branchId !== null && scope.branchId !== undefined) {
              classData.branchId = Number(scope.branchId);
            }
            if (scope.courseId !== null && scope.courseId !== undefined) {
              classData.courseId = Number(scope.courseId);
            }

            let classCode = classData.code;
            if (!classCode || classCode === classData.name) {
              console.log(`Auto-generating class code for validation: ${classData.name}`);
              classCode = await generateNextClassCode(classData.name, schoolId);
              classData.code = classCode;
            }

            // COMMENTED OUT: Allow duplicate class codes
            // const existingClass = await prisma.class.findFirst({
            //   where: {
            //     code: classCode,
            //     schoolId: schoolId,
            //   }
            // });
            // 
            // if (existingClass && options.skipDuplicates) {
            //   results.skipped.push({
            //     data: classData,
            //     reason: 'Class code already exists',
            //   });
            //   results.summary.skipped++;
            // } else if (existingClass) {
            //   results.failed.push({
            //     data: classData,
            //     error: 'Class code already exists',
            //   });
            //   results.summary.failed++;
            // } else {
            //   results.created.push({
            //     data: classData,
            //     status: 'valid',
            //   });
            //   results.summary.created++;
            // }
            
            // Always mark as valid since we allow duplicates
            results.created.push({
              data: classData,
              status: 'valid',
            });
            results.summary.created++;
          } catch (error) {
            results.failed.push({
              data: classData,
              error: error.message,
            });
            results.summary.failed++;
          }
        }

        return res.json(formatResponse(true, results, 'Bulk validation completed'));
      }
      
      // Actual creation mode
      for (const classData of classes) {
        try {
          const schoolId = defaultSchoolId;
          classData.schoolId = schoolId;
          if (scope.branchId !== null && scope.branchId !== undefined) {
            classData.branchId = Number(scope.branchId);
          }
          if (scope.courseId !== null && scope.courseId !== undefined) {
            classData.courseId = Number(scope.courseId);
          }
          
          let classCode = classData.code;
          if (!classCode || classCode === classData.name) {
            console.log(`Auto-generating class code for class name: ${classData.name}`);
            classCode = await generateNextClassCode(classData.name, schoolId);
            classData.code = classCode;
          } else {
            // COMMENTED OUT: Allow duplicate class codes
            // const existingClass = await prisma.class.findFirst({
            //   where: {
            //     code: classCode,
            //     schoolId: schoolId,
            //   }
            // });
            // 
            // if (existingClass && options.skipDuplicates) {
            //   results.skipped.push({
            //     data: classData,
            //     reason: 'Class code already exists',
            //   });
            //   results.summary.skipped++;
            //   continue;
            // }
            // 
            // if (existingClass) {
            //   results.failed.push({
            //     data: classData,
            //     error: 'Class code already exists',
            //   });
            //   results.summary.failed++;
            //   continue;
            // }
          }
          
          if (classData.classTeacherId) {
            const teacher = await prisma.teacher.findUnique({
              where: { id: classData.classTeacherId },
              include: { school: true }
            });
            
            if (!teacher || teacher.schoolId !== schoolId) {
              results.failed.push({
                data: classData,
                error: 'Invalid class teacher',
              });
              results.summary.failed++;
              continue;
            }
          }
          
          const createdClass = await prisma.class.create({
            data: {
              ...classData,
              schoolId: toBigIntSafe(schoolId),
              branchId: scope.branchId !== null && scope.branchId !== undefined ? toBigIntOrNull(scope.branchId) : toBigIntOrNull(classData.branchId),
              courseId: scope.courseId !== null && scope.courseId !== undefined ? toBigIntOrNull(scope.courseId) : toBigIntOrNull(classData.courseId),
              createdBy: toBigIntSafe(req.user.id),
              updatedBy: toBigIntSafe(req.user.id)
            },
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },

            }
          });
          
          results.created.push({
            data: createdClass,
            status: 'created',
          });
          results.summary.created++;
          
          await classCache.invalidateClassCacheOnCreate(createdClass);
          
        } catch (error) {
          results.failed.push({
            data: classData,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      // Trigger bulk operation notification
      if (results.summary.created > 0) {
        await triggerBulkOperationNotifications(
          'class',
          results.created.map(c => c.data.id.toString()),
          'CREATE',
          req.user,
          {
            auditDetails: {
              operation: 'bulk_create',
              count: results.summary.created,
              total: classes.length,
              failed: results.summary.failed,
              skipped: results.summary.skipped
            }
          }
        );
      }
      
      // Invalidate list caches
      await classCache.invalidateClassCacheOnBulkOperation('create', results.created.map(c => c.data.id));
      
      return res.status(201).json(formatResponse(true, results, 'Bulk creation completed'));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to create classes in bulk');
    }
  };

  // ======================
  // BULK UPDATE CLASSES
  // ======================
  export const bulkUpdateClasses = async (req, res) => {
    try {
      const parsed = classSchemas.ClassBulkUpdateSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid bulk update data', { 
          errors: parsed.error.errors 
        }));
      }
      
      const { updates, options = {} } = parsed.data;
      const results = {
        updated: [],
        failed: [],
        summary: {
          total: updates.length,
          updated: 0,
          failed: 0,
        }
      };
      
      const scope = await resolveClassScope(req, 'bulk class update');
      
      // Validate only mode
      if (options.validateOnly) {
        for (const update of updates) {
          try {
            const classIdBigInt = await ensureClassAccessible(update.id, scope);
            const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, { id: classIdBigInt });
            if (empty) {
              throw new Error('Class not found');
            }

            const existingClass = await prisma.class.findFirst({
              where: scopedWhere,
              include: { students: true }
            });
            
            if (!existingClass) {
              results.failed.push({
                id: update.id,
                error: 'Class not found',
              });
              results.summary.failed++;
              continue;
            }
            
            // Validate capacity
            if (update.data.capacity && update.data.capacity < existingClass.students.length) {
              results.failed.push({
                id: update.id,
                error: `Capacity cannot be less than current student count (${existingClass.students.length})`,
              });
              results.summary.failed++;
              continue;
            }
            
            results.updated.push({
              id: update.id,
              status: 'valid',
            });
            results.summary.updated++;
            
          } catch (error) {
            results.failed.push({
              id: update.id,
              error: error.message,
            });
            results.summary.failed++;
          }
        }
        
        return res.json(formatResponse(true, results, 'Bulk validation completed'));
      }
      
      // Actual update mode
      for (const update of updates) {
        try {
          const classIdBigInt = await ensureClassAccessible(update.id, scope);
          const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, { id: classIdBigInt });
          if (empty) {
            throw new Error('Class not found');
          }

          const existingClass = await prisma.class.findFirst({
            where: scopedWhere,
            include: { students: true }
          });
          
          if (!existingClass) {
            results.failed.push({
              id: update.id,
              error: 'Class not found',
            });
            results.summary.failed++;
            continue;
          }
          
          // Validate capacity
          if (update.data.capacity && update.data.capacity < existingClass.students.length) {
            results.failed.push({
              id: update.id,
              error: `Capacity cannot be less than current student count (${existingClass.students.length})`,
            });
            results.summary.failed++;
            continue;
          }
          
          // Update the class
          const sanitizedUpdateData = { ...update.data };
          delete sanitizedUpdateData.createdAt;
          delete sanitizedUpdateData.updatedAt;
          delete sanitizedUpdateData.deletedAt;
          delete sanitizedUpdateData.schoolId;
          sanitizedUpdateData.updatedBy = toBigIntSafe(req.user.id);

          const updatedClass = await prisma.class.update({
            where: { id: classIdBigInt },
            data: {
              ...sanitizedUpdateData,
              updatedAt: new Date()
            },
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
              _count: {
                select: {
                  students: true,
                  subjects: true,
                  timetables: true,
                  exams: true,
                }
              }
            }
          });
          
          results.updated.push({
            data: updatedClass,
            status: 'updated',
          });
          results.summary.updated++;
          
          // Invalidate cache for this class
          await classCache.invalidateClassCacheOnUpdate(updatedClass, existingClass);
          
        } catch (error) {
          results.failed.push({
            id: update.id,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      // Trigger bulk operation notification
      if (results.summary.updated > 0) {
        await triggerBulkOperationNotifications(
          'class',
          results.updated.map(u => u.data.id.toString()),
          'UPDATE',
          req.user,
          {
            auditDetails: {
              operation: 'bulk_update',
              count: results.summary.updated,
              total: updates.length,
              failed: results.summary.failed
            }
          }
        );
      }
      
      // Invalidate list caches
      await classCache.invalidateClassCacheOnBulkOperation('update', results.updated.map(u => u.data.id));
      
      return res.json(formatResponse(true, results, 'Bulk update completed'));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to update classes in bulk');
    }
  };

  // ======================
  // BULK DELETE CLASSES
  // ======================
  export const bulkDeleteClasses = async (req, res) => {
    try {
      const { ids } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class IDs'));
      }
      
      const results = {
        deleted: [],
        failed: [],
        summary: {
          total: ids.length,
          deleted: 0,
          failed: 0,
        }
      };
      
      const scope = await resolveClassScope(req, 'bulk class delete');
      
      for (const id of ids) {
        try {
          const classIdBigInt = await ensureClassAccessible(id, scope);
          const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, { id: classIdBigInt });
          if (empty) {
            throw new Error('Class not found');
          }

          const existingClass = await prisma.class.findFirst({
            where: scopedWhere,
            include: {
              students: true,
              subjects: true,
              timetables: true,
              exams: true,
            }
          });
          
          if (!existingClass) {
            results.failed.push({
              id,
              error: 'Class not found',
            });
            results.summary.failed++;
            continue;
          }
          
          // Check if class can be deleted
          if (existingClass.students.length > 0) {
            results.failed.push({
              id,
              error: `Cannot delete class with ${existingClass.students.length} students`,
            });
            results.summary.failed++;
            continue;
          }
          
          if (existingClass.subjects.length > 0) {
            results.failed.push({
              id,
              error: `Cannot delete class with ${existingClass.subjects.length} subjects`,
            });
            results.summary.failed++;
            continue;
          }
          
          // Delete the class
          await prisma.class.delete({ where: { id: classIdBigInt } });
          
          results.deleted.push({
            id,
            status: 'deleted',
          });
          results.summary.deleted++;
          
          // Invalidate cache for this class
          await classCache.invalidateClassCacheOnDelete(existingClass);
          
        } catch (error) {
          results.failed.push({
            id,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      // Trigger bulk operation notification
      if (results.summary.deleted > 0) {
        await triggerBulkOperationNotifications(
          'class',
          results.deleted.map(d => d.id.toString()),
          'DELETE',
          req.user,
          {
            auditDetails: {
              operation: 'bulk_delete',
              count: results.summary.deleted,
              total: ids.length,
              failed: results.summary.failed
            }
          }
        );
      }
      
      // Invalidate list caches
      await classCache.invalidateClassCacheOnBulkOperation('delete', results.deleted.map(d => d.id));
      
      return res.json(formatResponse(true, results, 'Bulk deletion completed'));
      
    } catch (error) {
      return respondWithClassScopedError(res, error, 'Failed to delete classes in bulk');
    }
  };

  // ======================
  // GET CLASS STATISTICS
  // ======================
  export const getClassStats = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class statistics');
      const { schoolId, level } = req.query;
      
      // Try cache first
      const cacheKey = { schoolId, level, scope: {
        schoolId: scope?.schoolId?.toString() ?? null,
        branchId: scope?.branchId?.toString() ?? null,
        courseId: scope?.courseId?.toString() ?? null
      } };
      const cached = await classCache.getClassCountsFromCache('stats', cacheKey);
      if (cached) {
        return res.json(formatResponse(true, cached, 'Class statistics fetched from cache', { 
          source: 'cache' 
        }));
      }
      
      const baseWhere = {};
      if (schoolId) baseWhere.schoolId = Number(schoolId);
      if (level) baseWhere.level = Number(level);

      const { where, empty } = await ensureScopedClassWhere(scope, baseWhere);
      if (empty) {
        const stats = {
          overview: {
            totalClasses: 0,
            classesWithStudents: 0,
            classesWithSubjects: 0,
            classesWithTeachers: 0,
            recentClasses: 0,
          },
          capacity: {
            average: 0,
            minimum: 0,
            maximum: 0,
            total: 0,
          },
          distribution: {
            byLevel: [],
            bySection: [],
          },
          utilization: {
            studentUtilization: 0,
            subjectUtilization: 0,
            teacherUtilization: 0,
          }
        };
        await classCache.setClassCountsInCache('stats', cacheKey, stats);
        return res.json(formatResponse(true, stats, 'Class statistics fetched successfully', { source: 'database' }));
      }
      
      // Get basic counts
      const totalClasses = await prisma.class.count({ where });
      const classesWithStudents = await prisma.class.count({
        where: {
          ...where,
          students: { some: {} }
        }
      });
      
      const classesWithSubjects = await prisma.class.count({
        where: {
          ...where,
          subjects: { some: {} }
        }
      });
      
      const classesWithTeachers = await prisma.class.count({
        where: {
          ...where,
          classTeacherId: { not: null }
        }
      });
      
      // Get capacity statistics
      const capacityStats = await prisma.class.aggregate({
        where,
        _avg: { capacity: true },
        _min: { capacity: true },
        _max: { capacity: true },
        _sum: { capacity: true },
      });
      
      // Get level distribution
      const levelDistribution = await prisma.class.groupBy({
        by: ['level'],
        where,
        _count: { id: true },
        _avg: { capacity: true },
      });
      
      // Get section distribution
      const sectionDistribution = await prisma.class.groupBy({
        by: ['section'],
        where,
        _count: { id: true },
      });
      
      // Get recent activity
      const recentClasses = await prisma.class.count({
        where: {
          ...where,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      });
      
      const stats = {
        overview: {
          totalClasses,
          classesWithStudents,
          classesWithSubjects,
          classesWithTeachers,
          recentClasses,
        },
        capacity: {
          average: capacityStats._avg.capacity || 0,
          minimum: capacityStats._min.capacity || 0,
          maximum: capacityStats._max.capacity || 0,
          total: capacityStats._sum.capacity || 0,
        },
        distribution: {
          byLevel: levelDistribution,
          bySection: sectionDistribution,
        },
        utilization: {
          studentUtilization: totalClasses > 0 ? (classesWithStudents / totalClasses) * 100 : 0,
          subjectUtilization: totalClasses > 0 ? (classesWithSubjects / totalClasses) * 100 : 0,
          teacherUtilization: totalClasses > 0 ? (classesWithTeachers / totalClasses) * 100 : 0,
        }
      };
      
      // Cache the result
      await classCache.setClassCountsInCache('stats', cacheKey, stats);
      
      return res.json(formatResponse(true, convertBigInts(stats), 'Class statistics fetched successfully', { 
        source: 'database' 
      }));
      
    } catch (error) {
      return handleError(res, error, 'fetch statistics');
    }
  };

  // ======================
  // GET CLASS ANALYTICS (ADVANCED)
  // ======================
  export const getClassAnalytics = async (req, res) => {
    console.log('GET /api/classes/analytics QUERY:', req.query);
    try {
      const query = req.query;
      const parsed = classSchemas.ClassAnalyticsSchema.safeParse(query);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid analytics parameters', { 
          errors: parsed.error.errors 
        }));
      }
      
      const params = parsed.data;
      
      // Try cache first
      const scope = await resolveManagedScope(req);
      const cacheKey = {
        ...params,
        scope: {
          schoolId: scope?.schoolId?.toString() ?? null,
          branchId: scope?.branchId?.toString() ?? null,
          courseId: scope?.courseId?.toString() ?? null
        }
      };
      const cached = await classCache.getClassAnalyticsFromCache('analytics', cacheKey);
      if (cached) {
        return res.json(formatResponse(true, cached, 'Class analytics fetched from cache', { 
          source: 'cache' 
        }));
      }
      
      const baseWhere = {};
      if (params.schoolId) baseWhere.schoolId = params.schoolId;
      if (params.level) baseWhere.level = params.level;
      
      // Calculate date range based on period
      let dateRange = {};
      const now = new Date();
      
      switch (params.period) {
        case '7d':
          dateRange = {
            gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          };
          break;
        case '30d':
          dateRange = {
            gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          };
          break;
        case '90d':
          dateRange = {
            gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          };
          break;
        case '1y':
          dateRange = {
            gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          };
          break;
        case 'all':
          // No date filter
          break;
      }
      
      if (Object.keys(dateRange).length > 0) {
        baseWhere.createdAt = dateRange;
      }

      const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, baseWhere);
      if (empty) {
        const emptyAnalytics = {
          overview: {
            summary: {
              totalClasses: 0,
              totalStudents: 0,
              totalTeachers: 0,
              averageCapacity: 0,
              capacityUtilization: 0,
              activeClasses: 0,
              newClassesThisPeriod: 0
            },
            growth: {
              classGrowthRate: 0,
              studentGrowthRate: 0,
              teacherGrowthRate: 0
            },
            efficiency: {
              averageClassSize: 0,
              teacherToClassRatio: 0,
              capacityEfficiency: 0
            }
          },
          trends: {},
          performance: {},
          distribution: {},
          comparisons: {},
          predictions: {},
          insights: {},
          metadata: {
            generatedAt: new Date().toISOString(),
            period: params.period,
            groupBy: params.groupBy,
            filters: scopedWhere,
            dataPoints: 0
          }
        };
        await classCache.setClassAnalyticsInCache('analytics', cacheKey, emptyAnalytics);
        return res.json(formatResponse(true, emptyAnalytics, 'Advanced class analytics fetched successfully', {
          source: 'database',
          period: params.period,
          groupBy: params.groupBy,
          metrics: params.metrics,
          timestamp: new Date().toISOString(),
        }));
      }
      
      // Get comprehensive analytics
      const analytics = await getComprehensiveClassAnalytics(scopedWhere, params, scope);
      
      // Cache the result
      await classCache.setClassAnalyticsInCache('analytics', cacheKey, analytics);
      
      return res.json(formatResponse(true, convertBigInts(analytics), 'Advanced class analytics fetched successfully', { 
        source: 'database',
        period: params.period,
        groupBy: params.groupBy,
        metrics: params.metrics,
        timestamp: new Date().toISOString(),
      }));
      
    } catch (error) {
      return handleError(res, error, 'fetch analytics');
    }
  };

  // Comprehensive analytics function
  const getComprehensiveClassAnalytics = async (where, params, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        overview: await getOverviewMetrics(scopedWhere, scope),
        trends: await getTrendAnalysis(scopedWhere, params.groupBy, scope),
        performance: await getPerformanceMetrics(scopedWhere, scope),
        distribution: await getDistributionAnalysis(scopedWhere, scope),
        comparisons: await getComparativeAnalysis(scopedWhere, scope),
        predictions: await getPredictiveAnalytics(scopedWhere, scope),
        insights: await getInsightsAndRecommendations(scopedWhere, scope),
        metadata: {
          generatedAt: new Date().toISOString(),
          period: params.period,
          groupBy: params.groupBy,
          filters: scopedWhere,
          dataPoints: 0
        }
      };
    }

    const [
      overview,
      trends,
      performance,
      distribution,
      comparisons,
      predictions,
      insights
    ] = await Promise.all([
      getOverviewMetrics(scopedWhere, scope),
      getTrendAnalysis(scopedWhere, params.groupBy, scope),
      getPerformanceMetrics(scopedWhere, scope),
      getDistributionAnalysis(scopedWhere, scope),
      getComparativeAnalysis(scopedWhere, scope),
      getPredictiveAnalytics(scopedWhere, scope),
      getInsightsAndRecommendations(scopedWhere, scope)
    ]);

    return {
      overview,
      trends,
      performance,
      distribution,
      comparisons,
      predictions,
      insights,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: params.period,
        groupBy: params.groupBy,
        filters: scopedWhere,
        dataPoints: await getDataPointCount(scopedWhere, scope)
      }
    };
  };

  // Overview metrics
  const getOverviewMetrics = async (where) => {
    const [
      totalClasses,
      totalStudents,
      totalTeachers,
      avgCapacity,
      capacityUtilization,
      recentActivity
    ] = await Promise.all([
      prisma.class.count({ where }),
      prisma.student.count({ where: { class: where, user: { status: 'ACTIVE' } } }),
      prisma.teacher.count({ where: { classesAsClassTeacher: { some: where } } }),
      prisma.class.aggregate({ where, _avg: { capacity: true } }),
      getCapacityUtilization(where),
      getRecentActivity(where)
    ]);

    return {
      summary: {
        totalClasses,
        totalStudents,
        totalTeachers,
        averageCapacity: avgCapacity._avg.capacity || 0,
        capacityUtilization: capacityUtilization.percentage,
        activeClasses: recentActivity.activeClasses,
        newClassesThisPeriod: recentActivity.newClasses
      },
      growth: {
        classGrowthRate: await calculateGrowthRate('class', where),
        studentGrowthRate: await calculateGrowthRate('student', where),
        teacherGrowthRate: await calculateGrowthRate('teacher', where)
      },
      efficiency: {
        averageClassSize: totalStudents / totalClasses || 0,
        teacherToClassRatio: totalTeachers / totalClasses || 0,
        capacityEfficiency: (totalStudents / (totalClasses * (avgCapacity._avg.capacity || 1))) * 100
      }
    };
  };

  // Trend analysis
  const getTrendAnalysis = async (where, groupBy, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        timeSeries: [],
        patterns: {
          seasonalTrends: [],
          growthTrends: [],
          anomalies: []
        },
        forecasting: {
          nextPeriodPrediction: null,
          confidenceInterval: null
        }
      };
    }

    const trends = await getTrendData(scopedWhere, groupBy);
    
    return {
      timeSeries: trends,
      patterns: {
        seasonalTrends: await detectSeasonalPatterns(trends),
        growthTrends: await analyzeGrowthTrends(trends),
        anomalies: await detectAnomalies(trends)
      },
      forecasting: {
        nextPeriodPrediction: await predictNextPeriod(trends),
        confidenceInterval: await calculateConfidenceInterval(trends)
      }
    };
  };

  // Performance metrics
  const getPerformanceMetrics = async (where, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        academic: null,
        attendance: null,
        teacher: null,
        efficiency: null,
        overallScore: 0
      };
    }

    const [
      academicPerformance,
      attendanceMetrics,
      teacherPerformance,
      classEfficiency
    ] = await Promise.all([
      getAcademicPerformance(scopedWhere),
      getAttendanceMetrics(scopedWhere),
      getTeacherPerformance(scopedWhere),
      getClassEfficiencyMetrics(scopedWhere)
    ]);

    return {
      academic: academicPerformance,
      attendance: attendanceMetrics,
      teacher: teacherPerformance,
      efficiency: classEfficiency,
      overallScore: calculateOverallPerformanceScore(academicPerformance, attendanceMetrics, teacherPerformance, classEfficiency)
    };
  };

  // Distribution analysis
  const getDistributionAnalysis = async (where, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        byLevel: [],
        bySection: [],
        byCapacity: [],
        byTeacher: [],
        byPerformance: [],
        geographic: []
      };
    }

    return {
      byLevel: await getDistributionByLevel(scopedWhere),
      bySection: await getDistributionBySection(scopedWhere),
      byCapacity: await getCapacityDistribution(scopedWhere),
      byTeacher: await getTeacherDistribution(scopedWhere),
      byPerformance: await getPerformanceDistribution(scopedWhere),
      geographic: await getGeographicDistribution(scopedWhere)
    };
  };

  // Comparative analysis
  const getComparativeAnalysis = async (where, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        periodComparison: [],
        levelComparison: [],
        teacherComparison: [],
        benchmarkAnalysis: [],
        ranking: []
      };
    }

    return {
      periodComparison: await comparePeriods(scopedWhere),
      levelComparison: await compareLevels(scopedWhere),
      teacherComparison: await compareTeachers(scopedWhere),
      benchmarkAnalysis: await getBenchmarkAnalysis(scopedWhere),
      ranking: await getClassRankings(scopedWhere)
    };
  };

  // Predictive analytics
  const getPredictiveAnalytics = async (where, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        enrollmentPrediction: null,
        performancePrediction: null,
        capacityPlanning: null,
        riskAssessment: null,
        optimizationSuggestions: []
      };
    }

    return {
      enrollmentPrediction: await predictEnrollment(scopedWhere),
      performancePrediction: await predictPerformance(scopedWhere),
      capacityPlanning: await predictCapacityNeeds(scopedWhere),
      riskAssessment: await assessRisks(scopedWhere),
      optimizationSuggestions: await getOptimizationSuggestions(scopedWhere)
    };
  };

  // Insights and recommendations
  const getInsightsAndRecommendations = async (where, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        keyInsights: [],
        recommendations: [],
        alerts: []
      };
    }

    const insights = await generateInsights(scopedWhere);
    
    return {
      keyInsights: insights.keyFindings,
      recommendations: insights.recommendations,
      actionItems: insights.actionItems,
      alerts: insights.alerts,
      opportunities: insights.opportunities
    };
  };

  // Helper functions for detailed analytics
  const getCapacityUtilization = async (where, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        percentage: 0,
        totalClasses: 0,
        highUtilization: 0,
        lowUtilization: 0
      };
    }

    // Get all classes with their student counts
    const classesWithStudents = await prisma.class.findMany({
      where: scopedWhere,
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    if (classesWithStudents.length === 0) {
      return {
        percentage: 0,
        totalClasses: 0,
        highUtilization: 0,
        lowUtilization: 0
      };
    }

    let totalUtilization = 0;
    let highUtilizationCount = 0;
    let lowUtilizationCount = 0;

    classesWithStudents.forEach(cls => {
      const utilization = cls.capacity > 0 ? (cls._count.students / cls.capacity) * 100 : 0;
      totalUtilization += utilization;
      
      if (utilization > 80) {
        highUtilizationCount++;
      } else if (utilization < 50) {
        lowUtilizationCount++;
      }
    });

    const averageUtilization = totalUtilization / classesWithStudents.length;

    return {
      percentage: averageUtilization,
      totalClasses: classesWithStudents.length,
      highUtilization: highUtilizationCount,
      lowUtilization: lowUtilizationCount
    };
  };

  const getRecentActivity = async (where, scope) => {
    const { where: scopedWhere, empty } = await ensureScopedClassWhere(scope, where);
    if (empty) {
      return {
        activeClasses: 0,
        newClasses: 0
      };
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const [activeClasses, newClasses] = await Promise.all([
      prisma.class.count({
        where: {
          ...scopedWhere,
          students: { some: {} }
        }
      }),
      prisma.class.count({
        where: {
          ...scopedWhere,
          createdAt: { gte: thirtyDaysAgo }
        }
      })
    ]);

    return { activeClasses, newClasses };
  };

  const calculateGrowthRate = async (entity, where) => {
    const currentPeriod = await prisma[entity].count({ where });
    const previousPeriod = await prisma[entity].count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return previousPeriod > 0 ? ((currentPeriod - previousPeriod) / previousPeriod) * 100 : 0;
  };

  const getTrendData = async (where, groupBy) => {
    // For now, return a simplified version without complex date grouping
    const classes = await prisma.class.findMany({
      where,
      select: {
        id: true,
        capacity: true,
        classTeacherId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: groupBy === 'day' ? 30 : groupBy === 'week' ? 12 : 12
    });

    // Group by the specified period (simplified)
    const grouped = {};
    classes.forEach(cls => {
      const date = cls.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
      if (!grouped[date]) {
        grouped[date] = {
          period: date,
          class_count: 0,
          avg_capacity: 0,
          teacher_count: new Set()
        };
      }
      grouped[date].class_count++;
      grouped[date].avg_capacity += cls.capacity;
      if (cls.classTeacherId) {
        grouped[date].teacher_count.add(cls.classTeacherId);
      }
    });

    // Convert to array and calculate averages
    return Object.values(grouped).map(group => ({
      period: group.period,
      class_count: group.class_count,
      avg_capacity: group.avg_capacity / group.class_count,
      teacher_count: group.teacher_count.size
    }));
  };

  const getAcademicPerformance = async (where) => {
    // Simplified academic performance using Prisma
    const grades = await prisma.grade.findMany({
      where: {
        student: {
          class: where
        }
      },
      select: {
        marks: true,
        examId: true,
        studentId: true
      }
    });

    if (grades.length === 0) {
      return {
        averageMarks: 0,
        totalExams: 0,
        studentsWithGrades: 0,
        passRate: 0
      };
    }

    const totalMarks = grades.reduce((sum, grade) => sum + (grade.marks || 0), 0);
    const averageMarks = totalMarks / grades.length;
    const uniqueExams = new Set(grades.map(g => g.examId)).size;
    const uniqueStudents = new Set(grades.map(g => g.studentId)).size;
    const passingGrades = grades.filter(g => (g.marks || 0) >= 70).length;
    const passRate = (passingGrades / grades.length) * 100;

    return {
      averageMarks,
      totalExams: uniqueExams,
      studentsWithGrades: uniqueStudents,
      passRate
    };
  };

  const getAttendanceMetrics = async (where) => {
    // Simplified attendance metrics using Prisma
    const attendances = await prisma.attendance.findMany({
      where: {
        student: {
          class: where
        }
      },
      select: {
        status: true,
        studentId: true,
        classId: true
      }
    });

    if (attendances.length === 0) {
      return {
        totalRecords: 0,
        attendanceRate: 0,
        studentsTracked: 0,
        classesTracked: 0
      };
    }

    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const attendanceRate = (presentCount / attendances.length) * 100;
    const uniqueStudents = new Set(attendances.map(a => a.studentId)).size;
    const uniqueClasses = new Set(attendances.map(a => a.classId)).size;

    return {
      totalRecords: attendances.length,
      attendanceRate,
      studentsTracked: uniqueStudents,
      classesTracked: uniqueClasses
    };
  };

  const getTeacherPerformance = async (where) => {
    // Simplified teacher performance using Prisma
    const teachers = await prisma.teacher.findMany({
      where: {
        classesAsClassTeacher: {
          some: where
        }
      },
      select: {
        id: true,
        experience: true,
        classesAsClassTeacher: {
          where,
          select: {
            id: true,
            capacity: true
          }
        }
      }
    });

    if (teachers.length === 0) {
      return {
        totalTeachers: 0,
        averageExperience: 0,
        classesTaught: 0,
        averageClassSize: 0
      };
    }

    const totalExperience = teachers.reduce((sum, t) => sum + (t.experience || 0), 0);
    const averageExperience = totalExperience / teachers.length;
    const totalClasses = teachers.reduce((sum, t) => sum + t.classesAsClassTeacher.length, 0);
    const totalCapacity = teachers.reduce((sum, t) => 
      sum + t.classesAsClassTeacher.reduce((classSum, c) => classSum + c.capacity, 0), 0
    );
    const averageClassSize = totalCapacity / totalClasses;

    return {
      totalTeachers: teachers.length,
      averageExperience,
      classesTaught: totalClasses,
      averageClassSize
    };
  };

  const getClassEfficiencyMetrics = async (where) => {
    // Simplified efficiency metrics using Prisma
    const classes = await prisma.class.findMany({
      where,
      include: {
        _count: {
          select: {
            students: true
          }
        }
      }
    });

    if (classes.length === 0) {
      return {
        efficiencyRatio: 0,
        totalClasses: 0,
        wellUtilized: 0,
        underUtilized: 0
      };
    }

    let totalEfficiency = 0;
    let wellUtilizedCount = 0;
    let underUtilizedCount = 0;

    classes.forEach(cls => {
      const efficiency = cls.capacity > 0 ? cls._count.students / cls.capacity : 0;
      totalEfficiency += efficiency;
      
      if (efficiency >= 0.8) {
        wellUtilizedCount++;
      } else if (efficiency < 0.5) {
        underUtilizedCount++;
      }
    });

    const averageEfficiency = totalEfficiency / classes.length;

    return {
      efficiencyRatio: averageEfficiency,
      totalClasses: classes.length,
      wellUtilized: wellUtilizedCount,
      underUtilized: underUtilizedCount
    };
  };

  const calculateOverallPerformanceScore = (academic, attendance, teacher, efficiency) => {
    const weights = { academic: 0.4, attendance: 0.3, teacher: 0.2, efficiency: 0.1 };
    
    const academicScore = academic.passRate / 100;
    const attendanceScore = attendance.attendanceRate / 100;
    const teacherScore = Math.min(teacher.averageExperience / 10, 1); // Normalize to 0-1
    const efficiencyScore = efficiency.efficiencyRatio;
    
    return (
      academicScore * weights.academic +
      attendanceScore * weights.attendance +
      teacherScore * weights.teacher +
      efficiencyScore * weights.efficiency
    ) * 100;
  };

  // Additional helper functions (simplified implementations)
  const detectSeasonalPatterns = async (trends) => {
    // Simplified seasonal pattern detection
    return { hasSeasonalPattern: false, confidence: 0.5 };
  };

  const analyzeGrowthTrends = async (trends) => {
    if (trends.length < 2) return { trend: 'stable', growthRate: 0 };
    
    const recent = trends[0]?.class_count || 0;
    const previous = trends[1]?.class_count || 0;
    const growthRate = previous > 0 ? ((recent - previous) / previous) * 100 : 0;
    
    return {
      trend: growthRate > 5 ? 'increasing' : growthRate < -5 ? 'decreasing' : 'stable',
      growthRate
    };
  };

  const detectAnomalies = async (trends) => {
    // Simplified anomaly detection
    return [];
  };

  const predictNextPeriod = async (trends) => {
    if (trends.length < 2) return { predicted: 0, confidence: 0 };
    
    const recent = trends[0]?.class_count || 0;
    const previous = trends[1]?.class_count || 0;
    const growthRate = previous > 0 ? (recent - previous) / previous : 0;
    
    return {
      predicted: Math.round(recent * (1 + growthRate)),
      confidence: 0.7
    };
  };

  const calculateConfidenceInterval = async (trends) => {
    return { lower: 0, upper: 0, confidence: 0.8 };
  };

  const getDistributionByLevel = async (where) => {
    return await prisma.class.groupBy({
      by: ['level'],
      where,
      _count: { id: true },
      _avg: { capacity: true }
    });
  };

  const getDistributionBySection = async (where) => {
    return await prisma.class.groupBy({
      by: ['section'],
      where,
      _count: { id: true },
      _avg: { capacity: true }
    });
  };

  const getCapacityDistribution = async (where) => {
    const classes = await prisma.class.findMany({
      where,
      select: {
        capacity: true
      }
    });

    const distribution = {
      'Small (< 20)': 0,
      'Medium (20-40)': 0,
      'Large (40-60)': 0,
      'Extra Large (> 60)': 0
    };

    classes.forEach(cls => {
      if (cls.capacity < 20) {
        distribution['Small (< 20)']++;
      } else if (cls.capacity < 40) {
        distribution['Medium (20-40)']++;
      } else if (cls.capacity < 60) {
        distribution['Large (40-60)']++;
      } else {
        distribution['Extra Large (> 60)']++;
      }
    });

    return Object.entries(distribution).map(([capacity_range, class_count]) => ({
      capacity_range,
      class_count
    }));
  };

  const getTeacherDistribution = async (where) => {
    const classes = await prisma.class.findMany({
      where,
      select: {
        classTeacherId: true
      }
    });

    const teacherClassCounts = {};
    classes.forEach(cls => {
      if (cls.classTeacherId) {
        teacherClassCounts[cls.classTeacherId] = (teacherClassCounts[cls.classTeacherId] || 0) + 1;
      }
    });

    const teachersWithClasses = Object.keys(teacherClassCounts).length;
    const totalClasses = classes.length;
    const avgClassesPerTeacher = teachersWithClasses > 0 ? totalClasses / teachersWithClasses : 0;

    return [{
      teachers_with_classes: teachersWithClasses,
      total_classes: totalClasses,
      avg_classes_per_teacher: avgClassesPerTeacher
    }];
  };

  const getPerformanceDistribution = async (where) => {
    // Simplified performance distribution
    return {
      excellent: 0.3,
      good: 0.4,
      average: 0.2,
      needsImprovement: 0.1
    };
  };

  const getGeographicDistribution = async (where) => {
    // Simplified geographic distribution
    return { local: 0.8, regional: 0.15, national: 0.05 };
  };

  const comparePeriods = async (where) => {
    // Simplified period comparison
    return {
      currentPeriod: { classes: 0, students: 0, growth: 0 },
      previousPeriod: { classes: 0, students: 0, growth: 0 },
      change: { classes: 0, students: 0, percentage: 0 }
    };
  };

  const compareLevels = async (where) => {
    return await prisma.class.groupBy({
      by: ['level'],
      where,
      _count: { id: true },
      _avg: { capacity: true }
    });
  };

  const compareTeachers = async (where) => {
    // Simplified teacher comparison
    return [];
  };

  const getBenchmarkAnalysis = async (where) => {
    // Simplified benchmark analysis
    return {
      industryAverage: { capacity: 30, efficiency: 0.75 },
      schoolAverage: { capacity: 0, efficiency: 0 },
      performance: 'above_average'
    };
  };

  const getClassRankings = async (where) => {
    // Simplified class rankings
    return [];
  };

  const predictEnrollment = async (where) => {
    // Simplified enrollment prediction
    return {
      nextMonth: 0,
      nextQuarter: 0,
      nextYear: 0,
      confidence: 0.7
    };
  };

  const predictPerformance = async (where) => {
    // Simplified performance prediction
    return {
      expectedScore: 75,
      confidence: 0.8,
      factors: ['attendance', 'teacher_experience', 'class_size']
    };
  };

  const predictCapacityNeeds = async (where) => {
    // Simplified capacity prediction
    return {
      recommendedCapacity: 30,
      confidence: 0.6,
      reasoning: 'Based on current trends and growth patterns'
    };
  };

  const assessRisks = async (where) => {
    // Simplified risk assessment
    return {
      lowRisk: 0.6,
      mediumRisk: 0.3,
      highRisk: 0.1,
      recommendations: ['Monitor class sizes', 'Review teacher assignments']
    };
  };

  const getOptimizationSuggestions = async (where) => {
    // Simplified optimization suggestions
    return [
      'Consider redistributing students to balance class sizes',
      'Review teacher workload distribution',
      'Implement capacity planning for upcoming terms'
    ];
  };

  const generateInsights = async (where) => {
    // Simplified insights generation
    return {
      keyFindings: [
        'Class sizes are well-distributed across levels',
        'Teacher utilization is optimal',
        'Capacity planning aligns with enrollment trends'
      ],
      recommendations: [
        'Continue monitoring class size distribution',
        'Maintain current teacher-student ratios',
        'Plan for seasonal enrollment variations'
      ],
      actionItems: [
        'Review capacity planning quarterly',
        'Assess teacher workload monthly',
        'Monitor performance metrics weekly'
      ],
      alerts: [],
      opportunities: [
        'Potential for expanding popular class levels',
        'Opportunity to optimize teacher assignments',
        'Room for improving attendance rates'
      ]
    };
  };

  const getDataPointCount = async (where) => {
    return await prisma.class.count({ where });
  };

  // Keep the existing helper functions for backward compatibility
  const getDailyAnalytics = async (where) => {
    const classes = await prisma.class.findMany({
      where,
      select: {
        capacity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 30
    });

    // Group by date
    const grouped = {};
    classes.forEach(cls => {
      const date = cls.createdAt.toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { count: 0, totalCapacity: 0 };
      }
      grouped[date].count++;
      grouped[date].totalCapacity += cls.capacity;
    });

    const data = Object.entries(grouped).map(([date, stats]) => ({
      date,
      count: stats.count,
      avg_capacity: stats.totalCapacity / stats.count
    }));

    return { type: 'daily', data };
  };

  const getWeeklyAnalytics = async (where) => {
    const classes = await prisma.class.findMany({
      where,
      select: {
        capacity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 84 // 12 weeks * 7 days
    });

    // Group by week (simplified)
    const grouped = {};
    classes.forEach(cls => {
      const week = cls.createdAt.toISOString().slice(0, 10); // Simplified week grouping
      if (!grouped[week]) {
        grouped[week] = { count: 0, totalCapacity: 0 };
      }
      grouped[week].count++;
      grouped[week].totalCapacity += cls.capacity;
    });

    const data = Object.entries(grouped).slice(0, 12).map(([week, stats]) => ({
      week,
      count: stats.count,
      avg_capacity: stats.totalCapacity / stats.count
    }));

    return { type: 'weekly', data };
  };

  const getMonthlyAnalytics = async (where) => {
    const classes = await prisma.class.findMany({
      where,
      select: {
        capacity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 365 // 12 months * 30 days
    });

    // Group by month
    const grouped = {};
    classes.forEach(cls => {
      const month = cls.createdAt.toISOString().slice(0, 7); // YYYY-MM
      if (!grouped[month]) {
        grouped[month] = { count: 0, totalCapacity: 0 };
      }
      grouped[month].count++;
      grouped[month].totalCapacity += cls.capacity;
    });

    const data = Object.entries(grouped).slice(0, 12).map(([month, stats]) => ({
      month,
      count: stats.count,
      avg_capacity: stats.totalCapacity / stats.count
    }));

    return { type: 'monthly', data };
  };

  const getQuarterlyAnalytics = async (where) => {
    const classes = await prisma.class.findMany({
      where,
      select: {
        capacity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 1000 // Large enough for quarters
    });

    // Group by quarter (simplified)
    const grouped = {};
    classes.forEach(cls => {
      const year = cls.createdAt.getFullYear();
      const month = cls.createdAt.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      const quarterKey = `${year}-Q${quarter}`;
      
      if (!grouped[quarterKey]) {
        grouped[quarterKey] = { count: 0, totalCapacity: 0 };
      }
      grouped[quarterKey].count++;
      grouped[quarterKey].totalCapacity += cls.capacity;
    });

    const data = Object.entries(grouped).slice(0, 8).map(([quarter, stats]) => ({
      quarter,
      count: stats.count,
      avg_capacity: stats.totalCapacity / stats.count
    }));

    return { type: 'quarterly', data };
  };

  const getYearlyAnalytics = async (where) => {
    const classes = await prisma.class.findMany({
      where,
      select: {
        capacity: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5000 // Large enough for years
    });

    // Group by year
    const grouped = {};
    classes.forEach(cls => {
      const year = cls.createdAt.getFullYear();
      if (!grouped[year]) {
        grouped[year] = { count: 0, totalCapacity: 0 };
      }
      grouped[year].count++;
      grouped[year].totalCapacity += cls.capacity;
    });

    const data = Object.entries(grouped).slice(0, 5).map(([year, stats]) => ({
      year: parseInt(year),
      count: stats.count,
      avg_capacity: stats.totalCapacity / stats.count
    }));

    return { type: 'yearly', data };
  };

  const getLevelAnalytics = async (where) => {
    const result = await prisma.class.groupBy({
      by: ['level'],
      where,
      _count: { id: true },
      _avg: { capacity: true },
      _sum: { capacity: true },
    });
    
    return { type: 'level', data: result };
  };

  const getSectionAnalytics = async (where) => {
    const result = await prisma.class.groupBy({
      by: ['section'],
      where,
      _count: { id: true },
      _avg: { capacity: true },
    });
    
    return { type: 'section', data: result };
  };

  // ======================
  // GET CLASSES BY SCHOOL
  // ======================
  export const getClassesBySchool = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class listing');
      const requestedSchoolId = Number(req.params.schoolId);
      
      // Ensure requested school matches scope
      if (requestedSchoolId !== Number(scope.schoolId)) {
        return res.status(403).json(formatResponse(false, null, 'Access denied to requested school'));
      }
      
      const query = req.query;
      const params = { schoolId: requestedSchoolId, ...query };
      
      // Try cache first
      const cached = await classCache.getClassesBySchoolFromCache(requestedSchoolId, params);
      if (cached) {
        return res.json(formatResponse(true, cached.data, 'Classes fetched from cache', { 
          source: 'cache',
          pagination: cached.pagination,
          ...cached.meta 
        }));
      }
      
      // Build where clause with scope
      const baseWhere = { schoolId: toBigIntSafe(requestedSchoolId) };
      
      // Add other filters
      if (params.level) baseWhere.level = Number(params.level);
      if (params.section) baseWhere.section = params.section;
      if (params.search) {
        baseWhere.OR = [
          { name: { contains: params.search } },
          { code: { contains: params.search } },
        ];
      }
      
      const { where, empty } = await ensureScopedClassWhere(scope, baseWhere);
      
      if (empty) {
        const result = {
          data: [],
          pagination: {
            page: Number(params.page) || 1,
            limit: Number(params.limit) || 100,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
          meta: { 
            timestamp: new Date().toISOString(), 
            source: 'database',
            schoolId: requestedSchoolId,
          },
        };
        await classCache.setClassesBySchoolInCache(requestedSchoolId, params, result);
        return res.json(formatResponse(true, [], 'Classes fetched successfully', result.pagination));
      }
      
      // Build include clause
      const include = {
        classTeacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
          }
        }
      };
      
      // Get total count
      const total = await prisma.class.count({ where });
      
      // Get classes with pagination
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 100; // Changed from 10 to 100
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      
      const classes = await prisma.class.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include,
      });
      
      const result = {
        data: classes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        meta: { 
          timestamp: new Date().toISOString(), 
          source: 'database',
          schoolId,
        },
      };
      
      // Cache the result
      await classCache.setClassesBySchoolInCache(schoolId, params, result);
      
      return res.json(formatResponse(true, convertBigInts(classes), 'Classes fetched successfully', result.pagination));
      
    } catch (error) {
      return handleError(res, error, 'fetch by school');
    }
  };

  // ======================
  // GET CLASSES BY LEVEL
  // ======================
  export const getClassesByLevel = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class listing');
      const level = Number(req.params.level);
      
      if (!level || isNaN(level) || level < 1 || level > 20) {
        return res.status(400).json(formatResponse(false, null, 'Invalid level (must be 1-20)'));
      }
      
      const query = req.query;
      const params = { level, ...query };
      
      // Try cache first
      const cached = await classCache.getClassesByLevelFromCache(level, params);
      if (cached) {
        return res.json(formatResponse(true, cached.data, 'Classes fetched from cache', { 
          source: 'cache',
          pagination: cached.pagination,
          ...cached.meta 
        }));
      }
      
      // Build where clause with scope
      const baseWhere = { level };
      
      // Add other filters
      if (params.section) baseWhere.section = params.section;
      if (params.search) {
        baseWhere.OR = [
          { name: { contains: params.search } },
          { code: { contains: params.search } },
        ];
      }
      
      const { where, empty } = await ensureScopedClassWhere(scope, baseWhere);
      
      if (empty) {
        const result = {
          data: [],
          pagination: {
            page: Number(params.page) || 1,
            limit: Number(params.limit) || 100,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
          meta: { 
            timestamp: new Date().toISOString(), 
            source: 'database',
            level,
          },
        };
        await classCache.setClassesByLevelInCache(level, params, result);
        return res.json(formatResponse(true, [], 'Classes fetched successfully', result.pagination));
      }
      
      // Build include clause
      const include = {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },

        _count: {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
          }
        }
      };
      
      // Get total count
      const total = await prisma.class.count({ where });
      
      // Get classes with pagination
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 100; // Changed from 10 to 100
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      
      const classes = await prisma.class.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include,
      });
      
      const result = {
        data: classes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        meta: { 
          timestamp: new Date().toISOString(), 
          source: 'database',
          level,
        },
      };
      
      // Cache the result
      await classCache.setClassesByLevelInCache(level, params, result);
      
      return res.json(formatResponse(true, convertBigInts(classes), 'Classes fetched successfully', result.pagination));
      
    } catch (error) {
      return handleError(res, error, 'fetch by level');
    }
  };

  // ======================
  // GENERATE CLASS CODE
  // ======================
  export const generateClassCode = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class code generation');
      const parsed = classSchemas.ClassCodeGenerationSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid code generation data', { 
          errors: parsed.error.errors 
        }));
      }
      
      const { name, level, section } = parsed.data;
      const schoolId = toBigIntSafe(scope.schoolId);
      
      // Generate base code from name
      let baseCode = name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .substring(0, 6);
      
      // Add level
      baseCode += `-${level}`;
      
      // Add section if provided
      if (section) {
        baseCode += `-${section}`;
      }
      
      // Check if code already exists
      let finalCode = baseCode;
      let counter = 1;
      
      while (true) {
        const existingClass = await prisma.class.findFirst({
          where: {
            code: finalCode,
            schoolId,
          }
        });
        
        if (!existingClass) {
          break;
        }
        
        finalCode = `${baseCode}-${counter}`;
        counter++;
        
        // Prevent infinite loop
        if (counter > 100) {
          return res.status(400).json(formatResponse(false, null, 'Unable to generate unique class code'));
        }
      }
      
      return res.json(formatResponse(true, { code: finalCode }, 'Class code generated successfully'));
      
    } catch (error) {
      return handleError(res, error, 'generate code');
    }
  };

  // ======================
  // GENERATE CLASS SECTIONS
  // ======================
  export const generateClassSections = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class section generation');
      const parsed = classSchemas.ClassSectionGenerationSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid section generation data', { 
          errors: parsed.error.errors 
        }));
      }
      
      const { level, count, prefix } = parsed.data;
      const schoolId = toBigIntSafe(scope.schoolId);
      
      const sections = [];
      const baseWhere = { level, schoolId };
      const { where } = await ensureScopedClassWhere(scope, baseWhere);
      
      const existingSections = await prisma.class.findMany({
        where,
        select: { section: true }
      });
      
      const existingSectionCodes = existingSections.map(c => c.section).filter(Boolean);
      
      for (let i = 0; i < count; i++) {
        let sectionCode = `${prefix}${i + 1}`;
        
        // If section already exists, try next letter
        if (existingSectionCodes.includes(sectionCode)) {
          let letterIndex = 0;
          while (existingSectionCodes.includes(sectionCode)) {
            const nextLetter = String.fromCharCode(prefix.charCodeAt(0) + letterIndex + 1);
            sectionCode = `${nextLetter}${i + 1}`;
            letterIndex++;
            
            // Prevent infinite loop
            if (letterIndex > 26) {
              sectionCode = `${prefix}${i + 1}-${Date.now()}`;
              break;
            }
          }
        }
        
        sections.push({
          level,
          section: sectionCode,
          schoolId: schoolId.toString(),
        });
      }
      
      return res.json(formatResponse(true, { sections }, 'Class sections generated successfully'));
      
    } catch (error) {
      return handleError(res, error, 'generate sections');
    }
  };

  // ======================
  // GET NEXT AVAILABLE CLASS CODE
  // ======================
  export const getNextClassCode = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class code generation');
      const { className } = req.query;
      
      if (!className) {
        return res.status(400).json(formatResponse(false, null, 'className is required'));
      }

      const schoolId = toBigIntSafe(scope.schoolId);

      console.log(`=== Testing class code generation ===`);
      console.log(`Class name: ${className}`);
      console.log(`School ID: ${schoolId}`);

      const nextCode = await generateNextClassCode(className, schoolId.toString());
      
      console.log(`Generated next code: ${nextCode}`);
      console.log(`=== End test ===`);
      
      return res.json(formatResponse(true, { nextCode }, 'Next available class code generated successfully'));
    } catch (error) {
      console.error('Error in getNextClassCode:', error);
      return handleError(res, error, 'get next class code');
    }
};

  // ======================
  // GET CLASS COUNT
  // ======================
  export const getClassCount = async (req, res) => {
    try {
      const scope = await resolveManagedScope(req);
      const { level, section } = req.query;
      
      // Try cache first
      const cacheKey = { 
        scope: {
          schoolId: scope?.schoolId?.toString() ?? null,
          branchId: scope?.branchId?.toString() ?? null,
          courseId: scope?.courseId?.toString() ?? null
        },
        level, 
        section 
      };
      const cached = await classCache.getClassCountsFromCache('count', cacheKey);
      if (cached) {
        return res.json(formatResponse(true, cached, 'Class count fetched from cache', { 
          source: 'cache' 
        }));
      }
      
      const baseWhere = {};
      if (level) baseWhere.level = Number(level);
      if (section) baseWhere.section = section;
      
      const { where, empty } = await ensureScopedClassWhere(scope, baseWhere);
      
      if (empty) {
        const result = { count: 0, filters: Object.keys(baseWhere).length };
        await classCache.setClassCountsInCache('count', cacheKey, result);
        return res.json(formatResponse(true, result, 'Class count fetched successfully', { 
          source: 'database' 
        }));
      }
      
      const count = await prisma.class.count({ where });
      
      const result = {
        count,
        filters: Object.keys(baseWhere).length,
      };
      
      // Cache the result
      await classCache.setClassCountsInCache('count', cacheKey, result);
      
      return res.json(formatResponse(true, result, 'Class count fetched successfully', { 
        source: 'database' 
      }));
      
    } catch (error) {
      return handleError(res, error, 'fetch count');
    }
  };

  // ======================
  // GET CLASS PERFORMANCE
  // ======================
  export const getClassPerformance = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      const scope = await resolveClassScope(req, 'class performance');
      await ensureClassAccessible(id, scope);
      
      const query = req.query;
      const parsed = classSchemas.ClassPerformanceSchema.safeParse(query);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid performance parameters', { 
          errors: parsed.error.errors 
        }));
      }
      
      const params = parsed.data;
      
      // Try cache first
      const cached = await classCache.getClassPerformanceFromCache(id, params);
      if (cached) {
        return res.json(formatResponse(true, cached, 'Class performance fetched from cache', { 
          source: 'cache' 
        }));
      }
      
      // Get class with students and their grades
      const classData = await prisma.class.findUnique({
        where: { id: toBigIntSafe(id) },
        include: {
          students: {
            include: {
              grades: {
                where: {
                  exam: {
                    academicYear: params.academicYear,
                    term: params.term,
                  }
                },
                include: {
                  exam: true,
                  subject: true,
                }
              },
              attendances: {
                where: {
                  date: {
                    gte: new Date(new Date().getFullYear(), 0, 1), // Current year
                  }
                }
              }
            }
          },
          _count: {
            select: {
              students: true,
              subjects: true,
            }
          }
        }
      });
      
      if (!classData) {
        return res.status(404).json(formatResponse(false, null, 'Class not found'));
      }
      
      // Calculate performance metrics
      const performance = {
        classId: id,
        className: classData.name,
        totalStudents: classData._count.students,
        totalSubjects: classData._count.subjects,
        
        academic: {
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 100,
          gradeDistribution: {},
          subjectPerformance: {},
        },
        
        attendance: {
          averageAttendance: 0,
          totalDays: 0,
          attendanceRate: 0,
        },
        
        behavior: {
          // Placeholder for behavior metrics
          incidents: 0,
          positiveNotes: 0,
        }
      };
      
      // Calculate academic metrics
      let totalGrade = 0;
      let gradeCount = 0;
      const grades = [];
      
      for (const student of classData.students) {
        for (const grade of student.grades) {
          grades.push(grade.score);
          totalGrade += grade.score;
          gradeCount++;
          
          // Track highest and lowest
          if (grade.score > performance.academic.highestGrade) {
            performance.academic.highestGrade = grade.score;
          }
          if (grade.score < performance.academic.lowestGrade) {
            performance.academic.lowestGrade = grade.score;
          }
          
          // Grade distribution
          const gradeRange = Math.floor(grade.score / 10) * 10;
          performance.academic.gradeDistribution[gradeRange] = 
            (performance.academic.gradeDistribution[gradeRange] || 0) + 1;
          
          // Subject performance
          const subjectName = grade.subject.name;
          if (!performance.academic.subjectPerformance[subjectName]) {
            performance.academic.subjectPerformance[subjectName] = {
              total: 0,
              count: 0,
              average: 0,
            };
          }
          performance.academic.subjectPerformance[subjectName].total += grade.score;
          performance.academic.subjectPerformance[subjectName].count += 1;
        }
      }
      
      if (gradeCount > 0) {
        performance.academic.averageGrade = totalGrade / gradeCount;
      }
      
      // Calculate subject averages
      for (const subject in performance.academic.subjectPerformance) {
        const subjectData = performance.academic.subjectPerformance[subject];
        subjectData.average = subjectData.total / subjectData.count;
      }
      
      // Calculate attendance metrics
      let totalAttendance = 0;
      let totalAttendanceDays = 0;
      
      for (const student of classData.students) {
        for (const attendance of student.attendances) {
          totalAttendanceDays++;
          if (attendance.status === 'PRESENT') {
            totalAttendance++;
          }
        }
      }
      
      if (totalAttendanceDays > 0) {
        performance.attendance.averageAttendance = totalAttendance / totalAttendanceDays;
        performance.attendance.totalDays = totalAttendanceDays;
        performance.attendance.attendanceRate = (totalAttendance / totalAttendanceDays) * 100;
      }
      
      // Cache the result
      await classCache.setClassPerformanceInCache(id, params, performance);
      
      return res.json(formatResponse(true, convertBigInts(performance), 'Class performance fetched successfully', { 
        source: 'database',
        academicYear: params.academicYear,
        term: params.term,
      }));
      
    } catch (error) {
      return handleError(res, error, 'fetch performance');
    }
  };

  // ======================
  // GET CLASSES BY TEACHER
  // ======================
  export const getClassesByTeacher = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class listing');
      const teacherId = Number(req.params.teacherId);
      
      if (!teacherId || isNaN(teacherId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid teacher ID'));
      }
      
      const query = req.query;
      const params = { teacherId, ...query };
      
      // Try cache first
      const cached = await classCache.getClassesByTeacherFromCache(teacherId, params);
      if (cached) {
        return res.json(formatResponse(true, convertBigInts(cached.data), 'Classes fetched from cache', { 
          source: 'cache',
          pagination: cached.pagination,
          ...cached.meta 
        }));
      }
      
      // Build where clause - Include class teacher, ClassToTeacher, and TeacherClassSubject
      const baseWhere = {
        OR: [
          { classTeacherId: toBigIntSafe(teacherId) }, // Teacher is the class teacher
          { 
            teachers: { 
              some: { 
                teacherId: toBigIntSafe(teacherId),
                deletedAt: null
              } 
            } 
          }, // Teacher is assigned through ClassToTeacher
          { 
            teacherClassSubjects: { 
              some: { 
                teacherId: toBigIntSafe(teacherId),
                deletedAt: null
              } 
            } 
          } // Teacher is assigned through TeacherClassSubject
        ]
      };
      
      // Add other filters
      if (params.level) baseWhere.level = Number(params.level);
      if (params.section) baseWhere.section = params.section;
      if (params.search) {
        // Merge search with existing OR condition
        const searchConditions = [
          { name: { contains: params.search } },
          { code: { contains: params.search } },
        ];
        baseWhere.AND = [
          { OR: baseWhere.OR }, // Keep the teacher condition
          { OR: searchConditions } // Add search condition
        ];
        delete baseWhere.OR; // Remove the original OR
      }
      
      const { where, empty } = await ensureScopedClassWhere(scope, baseWhere);
      
      if (empty) {
        const result = {
          data: [],
          pagination: {
            page: Number(params.page) || 1,
            limit: Number(params.limit) || 100,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
          meta: { 
            timestamp: new Date().toISOString(), 
            source: 'database',
            teacherId,
          },
        };
        await classCache.setClassesByTeacherInCache(teacherId, params, result);
        return res.json(formatResponse(true, [], 'Classes fetched successfully', result.pagination));
      }
      
      // Build include clause - simplified to avoid null user issues
      const include = {
        school: {
          select: {
            id: true,
            name: true,
            code: true,
          }
        },
        classTeacher: true,
        teachers: true,
        teacherClassSubjects: {
          where: {
            deletedAt: null,
            subject: {
              is: {
                deletedAt: null,
              },
            },
          },
          include: {
            teacher: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            subjects: true,
            timetables: true,
            exams: true,
            teachers: true,
            teacherClassSubjects: true,
          }
        }
      };
      
      // Get total count
      const total = await prisma.class.count({ where });
      
      // Get classes with pagination using raw SQL to handle null users
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 100;
      const sortBy = params.sortBy || 'createdAt';
      const sortOrder = params.sortOrder || 'desc';
      
      const sql = `
        SELECT DISTINCT 
          c.*,
          s.id as school_id, s.name as school_name, s.code as school_code,
          ct.id as class_teacher_id, ct.employeeId as class_teacher_employeeId,
          ct_user.id as class_teacher_user_id, ct_user.firstName as class_teacher_firstName, 
          ct_user.lastName as class_teacher_lastName, ct_user.username as class_teacher_username,
          COUNT(DISTINCT st.id) as student_count,
          COUNT(DISTINCT sub.id) as subject_count,
          COUNT(DISTINCT tt.id) as timetable_count,
          COUNT(DISTINCT e.id) as exam_count,
          COUNT(DISTINCT ctt.id) as teacher_count,
          COUNT(DISTINCT tcs.id) as teacher_class_subject_count
        FROM classes c
        LEFT JOIN schools s ON c.schoolId = s.id
        LEFT JOIN teachers ct ON c.classTeacherId = ct.id AND ct.deletedAt IS NULL
        LEFT JOIN users ct_user ON ct.userId = ct_user.id
        LEFT JOIN students st ON c.id = st.classId AND st.deletedAt IS NULL
        LEFT JOIN _ClassToSubject cs ON c.id = cs.A
        LEFT JOIN subjects sub ON cs.B = sub.id AND sub.deletedAt IS NULL
        LEFT JOIN timetables tt ON c.id = tt.classId AND tt.deletedAt IS NULL
        LEFT JOIN exams e ON c.id = e.classId AND e.deletedAt IS NULL
        LEFT JOIN class_teachers ctt ON c.id = ctt.classId AND ctt.deletedAt IS NULL
        LEFT JOIN teacher_class_subjects tcs ON c.id = tcs.classId AND tcs.deletedAt IS NULL
        WHERE c.deletedAt IS NULL
          AND (
            c.classTeacherId = ?
            OR EXISTS (SELECT 1 FROM class_teachers WHERE classId = c.id AND teacherId = ? AND deletedAt IS NULL)
            OR EXISTS (SELECT 1 FROM teacher_class_subjects WHERE classId = c.id AND teacherId = ? AND deletedAt IS NULL)
          )
          ${params.level ? 'AND c.level = ?' : ''}
          ${params.section ? 'AND c.section = ?' : ''}
          ${params.search ? 'AND (c.name LIKE ? OR c.code LIKE ?)' : ''}
        GROUP BY c.id, s.id, ct.id, ct_user.id
        ORDER BY c.${sortBy} ${sortOrder.toUpperCase()}
        LIMIT ? OFFSET ?
      `;
      
      const queryParams = [
        teacherId.toString(), teacherId.toString(), teacherId.toString()
      ];
      if (params.level) queryParams.push(Number(params.level));
      if (params.section) queryParams.push(params.section);
      if (params.search) {
        queryParams.push(`%${params.search}%`, `%${params.search}%`);
      }
      queryParams.push(limit, (page - 1) * limit);
      
      const classes = await prisma.$queryRawUnsafe(sql, ...queryParams);
      
      // Transform raw results to match expected structure
      const transformedClasses = classes.map(c => ({
        ...c,
        school: c.school_id ? {
          id: c.school_id,
          name: c.school_name,
          code: c.school_code
        } : null,
        classTeacher: c.class_teacher_id ? {
          id: c.class_teacher_id,
          employeeId: c.class_teacher_employeeId,
          user: c.class_teacher_user_id ? {
            id: c.class_teacher_user_id,
            firstName: c.class_teacher_firstName,
            lastName: c.class_teacher_lastName,
            username: c.class_teacher_username
          } : null
        } : null,
        _count: {
          students: c.student_count || 0,
          subjects: c.subject_count || 0,
          timetables: c.timetable_count || 0,
          exams: c.exam_count || 0,
          teachers: c.teacher_count || 0,
          teacherClassSubjects: c.teacher_class_subject_count || 0
        }
      }));
      
      const paginationMeta = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      };
      
      const result = {
        data: classes,
        pagination: paginationMeta,
        meta: { 
          timestamp: new Date().toISOString(), 
          source: 'database',
          teacherId,
        },
      };
      
      // Cache the result
      await classCache.setClassesByTeacherInCache(teacherId, params, result);
      
      return res.json(formatResponse(true, convertBigInts(classes), 'Classes fetched successfully', paginationMeta));
      
    } catch (error) {
      return handleError(res, error, 'fetch by teacher');
    }
  };

  // ======================
  // TODO: BULK, ANALYTICS, EXPORT/IMPORT, UTILITY ENDPOINTS
  // ======================

  // ======================
  // EXPORT/IMPORT FUNCTIONS
  // ======================

  export const exportClasses = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class export');
      const query = req.query;
      const parsed = classSchemas.ClassExportSchema.safeParse(query);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid export parameters', { 
          errors: parsed.error.errors 
        }));
      }
      
      const params = parsed.data;
      
      // Try cache first
      const cached = await classCache.getClassExportFromCache(params);
      if (cached) {
        return res.json(formatResponse(true, cached, 'Classes exported from cache', { 
          source: 'cache' 
        }));
      }
      
      // Build where clause based on filters with scope
      const baseWhere = {};
      if (params.filters) {
        if (params.filters.level) baseWhere.level = params.filters.level;
        if (params.filters.section) baseWhere.section = params.filters.section;
        if (params.filters.search) {
          baseWhere.OR = [
            { name: { contains: params.filters.search } },
            { code: { contains: params.filters.search } },
          ];
        }
      }
      
      const { where, empty } = await ensureScopedClassWhere(scope, baseWhere);
      
      if (empty) {
        const exportData = {
          format: params.format,
          totalClasses: 0,
          timestamp: new Date().toISOString(),
          data: [],
        };
        await classCache.setClassExportInCache(params, exportData);
        return res.json(formatResponse(true, convertBigInts(exportData), 'Classes exported successfully', { 
          source: 'database',
          format: params.format,
        }));
      }
      
      // Build include clause
      const include = {};
      if (params.includeRelations) {
        include.school = {
          select: {
            id: true,
            name: true,
            code: true,
          }
        };
        include.classTeacher = {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              }
            }
          }
        };
        include.students = {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              }
            }
          }
        };
        include.subjects = true;
      }
      
      const classes = await prisma.class.findMany({
        where,
        include,
      });
      
      const exportData = {
        format: params.format,
        totalClasses: classes.length,
        timestamp: new Date().toISOString(),
        data: classes,
      };
      
      // Cache the result
      await classCache.setClassExportInCache(params, exportData);
      
      return res.json(formatResponse(true, convertBigInts(exportData), 'Classes exported successfully', { 
        source: 'database',
        format: params.format,
      }));
      
    } catch (error) {
      return handleError(res, error, 'export');
    }
  };

  export const importClasses = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class import');
      const parsed = classSchemas.ClassImportSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json(formatResponse(false, null, 'Invalid import data', { 
          errors: parsed.error.errors 
        }));
      }
      
      const { data, options = {} } = parsed.data;
      const results = {
        imported: [],
        failed: [],
        skipped: [],
        summary: {
          total: data.length,
          imported: 0,
          failed: 0,
          skipped: 0,
        }
      };
      
      // Use scope schoolId as default
      const defaultSchoolId = toBigIntSafe(scope.schoolId);
      const defaultCreatedBy = options.defaultCreatedBy || req.user.id;
      
      // Validate only mode
      if (options.validateOnly) {
        for (const classData of data) {
          try {
            // Check if class code already exists (ensure it's in scope)
            const classSchoolId = classData.schoolId ? toBigIntSafe(classData.schoolId) : defaultSchoolId;
            if (classSchoolId !== defaultSchoolId) {
              results.failed.push({
                data: classData,
                error: 'Class schoolId does not match managed scope',
              });
              results.summary.failed++;
              continue;
            }
            
            // COMMENTED OUT: Allow duplicate class codes
            // const existingClass = await prisma.class.findFirst({
            //   where: {
            //     code: classData.code,
            //     schoolId: classSchoolId,
            //   }
            // });
            // 
            // if (existingClass && options.skipDuplicates) {
            //   results.skipped.push({
            //     data: classData,
            //     reason: 'Class code already exists',
            //   });
            //   results.summary.skipped++;
            // } else if (existingClass) {
            //   results.failed.push({
            //     data: classData,
            //     error: 'Class code already exists',
            //   });
            //   results.summary.failed++;
            // } else {
            //   results.imported.push({
            //     data: classData,
            //     status: 'valid',
            //   });
            //   results.summary.imported++;
            // }
            
            // Always mark as valid since we allow duplicates
            results.imported.push({
              data: classData,
              status: 'valid',
            });
            results.summary.imported++;
          } catch (error) {
            results.failed.push({
              data: classData,
              error: error.message,
            });
            results.summary.failed++;
          }
        }
        
        return res.json(formatResponse(true, results, 'Import validation completed'));
      }
      
      // Actual import mode
      for (const classData of data) {
        try {
          // Ensure schoolId matches scope
          const classSchoolId = classData.schoolId ? toBigIntSafe(classData.schoolId) : defaultSchoolId;
          if (classSchoolId !== defaultSchoolId) {
            results.failed.push({
              data: classData,
              error: 'Class schoolId does not match managed scope',
            });
            results.summary.failed++;
            continue;
          }
          
          const importData = {
            ...classData,
            schoolId: classSchoolId,
            createdBy: classData.createdBy ? toBigIntSafe(classData.createdBy) : defaultCreatedBy,
          };
          
          // COMMENTED OUT: Allow duplicate class codes
          // Check if class code already exists
          // const existingClass = await prisma.class.findFirst({
          //   where: {
          //     code: importData.code,
          //     schoolId: importData.schoolId,
          //   }
          // });
          // 
          // if (existingClass && options.skipDuplicates) {
          //   results.skipped.push({
          //     data: importData,
          //     reason: 'Class code already exists',
          //   });
          //   results.summary.skipped++;
          //   continue;
          // }
          // 
          // if (existingClass && !options.updateExisting) {
          //   results.failed.push({
          //     data: importData,
          //     error: 'Class code already exists',
          //   });
          //   results.summary.failed++;
          //   continue;
          // }
          
          // Always create new class since we allow duplicates
          let createdClass;
          // COMMENTED OUT: Update existing class logic disabled to allow duplicates
          // if (existingClass && options.updateExisting) {
          //   // Verify existing class is in scope
          //   const existingInScope = await verifyClassInScope(existingClass.id, scope);
          //   if (!existingInScope) {
          //     results.failed.push({
          //       data: importData,
          //       error: 'Cannot update class outside managed scope',
          //     });
          //     results.summary.failed++;
          //     continue;
          //   }
          //   
          //   createdClass = await prisma.class.update({
          //     where: { id: existingClass.id },
          //     data: {
          //       ...importData,
          //       schoolId: importData.schoolId,
          //       createdBy: importData.createdBy,
          //       updatedBy: toBigIntSafe(req.user.id)
          //     },
          //     include: {
          //       school: {
          //         select: {
          //           id: true,
          //           name: true,
          //           code: true,
          //         }
          //       },
          //     }
          //   });
          // } else {
            createdClass = await prisma.class.create({
              data: {
                ...importData,
                schoolId: importData.schoolId,
                createdBy: importData.createdBy,
                updatedBy: toBigIntSafe(req.user.id),
                branchId: scope.branchId ? toBigIntSafe(scope.branchId) : null,
                courseId: scope.courseId ? toBigIntSafe(scope.courseId) : null,
              },
              include: {
                school: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  }
                },
              }
            });
          
          results.imported.push({
            data: createdClass,
            status: 'created', // Always 'created' since we allow duplicates
          });
          results.summary.imported++;
          
          // Invalidate cache for this class
          await classCache.invalidateClassCacheOnCreate(createdClass);
          
        } catch (error) {
          results.failed.push({
            data: classData,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      // Invalidate list caches
      await classCache.invalidateClassCacheOnBulkOperation('import', results.imported.map(c => c.data.id));
      
      return res.status(201).json(formatResponse(true, results, 'Import completed'));
      
    } catch (error) {
      return handleError(res, error, 'import');
    }
  };

  // ======================
  // UTILITY FUNCTIONS
  // ======================

  export const getClassNameSuggestions = async (req, res) => {
    try {
      const { level, section, schoolId } = req.query;
      
      const suggestions = [];
      
      // Generate suggestions based on level and section
      if (level) {
        const levelNum = Number(level);
        if (section) {
          suggestions.push(`Class ${levelNum} ${section}`);
          suggestions.push(`Grade ${levelNum} ${section}`);
          suggestions.push(`Level ${levelNum} ${section}`);
        } else {
          suggestions.push(`Class ${levelNum}`);
          suggestions.push(`Grade ${levelNum}`);
          suggestions.push(`Level ${levelNum}`);
        }
      }
      
      // Add generic suggestions
      suggestions.push('Primary Class');
      suggestions.push('Secondary Class');
      suggestions.push('Elementary Class');
      suggestions.push('Middle Class');
      suggestions.push('High Class');
      
      return res.json(formatResponse(true, { suggestions }, 'Class name suggestions generated'));
      
    } catch (error) {
      return handleError(res, error, 'generate suggestions');
    }
  };

  export const getClassCodeSuggestions = async (req, res) => {
    try {
      const { name, level, section, schoolId } = req.query;
      
      const suggestions = [];
      
      // Generate code from name
      if (name) {
        const nameCode = name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '')
          .substring(0, 6);
        suggestions.push(nameCode);
      }
      
      // Generate code from level and section
      if (level) {
        const levelNum = Number(level);
        if (section) {
          suggestions.push(`${levelNum}${section}`);
          suggestions.push(`L${levelNum}${section}`);
          suggestions.push(`G${levelNum}${section}`);
        } else {
          suggestions.push(`L${levelNum}`);
          suggestions.push(`G${levelNum}`);
          suggestions.push(`C${levelNum}`);
        }
      }
      
      // Add generic suggestions
      suggestions.push('CLASS001');
      suggestions.push('GRADE001');
      suggestions.push('LEVEL001');
      
      return res.json(formatResponse(true, { suggestions }, 'Class code suggestions generated'));
      
    } catch (error) {
      return handleError(res, error, 'generate code suggestions');
    }
  };

  // ======================
  // CACHE MANAGEMENT FUNCTIONS
  // ======================

  export const clearClassCache = async (req, res) => {
    try {
      const result = await classCache.clearClassCache();
      
      if (result) {
        return res.json(formatResponse(true, null, 'Class cache cleared successfully'));
      } else {
        return res.status(500).json(formatResponse(false, null, 'Failed to clear class cache'));
      }
      
    } catch (error) {
      return handleError(res, error, 'clear cache');
    }
  };

  export const getClassCacheStats = async (req, res) => {
    try {
      const stats = await classCache.getClassCacheStats();
      
      if (stats) {
        return res.json(formatResponse(true, stats, 'Class cache statistics fetched successfully'));
      } else {
        return res.status(500).json(formatResponse(false, null, 'Failed to fetch cache statistics'));
      }
      
    } catch (error) {
      return handleError(res, error, 'fetch cache stats');
    }
  };

  export const checkClassCacheHealth = async (req, res) => {
    try {
      const health = await classCache.checkClassCacheHealth();
      
      return res.json(formatResponse(true, health, 'Class cache health check completed'));
      
    } catch (error) {
      return handleError(res, error, 'check cache health');
    }
  };

  // ======================
  // RELATIONSHIP FUNCTIONS
  // ======================

  export const getClassStudents = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      console.log(`🔍 getClassStudents called for class ID: ${id}`);

      const scope = await resolveClassScope(req, 'class listing');
      const classInScope = await verifyClassInScope(BigInt(id), scope);

      if (!classInScope) {
        return res.status(404).json(formatResponse(false, null, 'Class not found in the selected context'));
      }

      const students = await prisma.student.findMany({
        where: {
          classId: BigInt(id),
          deletedAt: null,
          user: {
            status: 'ACTIVE'
          }
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              dariName: true,
            }
          },
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dariName: true,
                  phone: true,
                }
              }
            }
          }
        }
      });
      
      console.log(`✅ Found ${students.length} students for class ${id}:`, students.map(s => ({ id: s.id, name: `${s.user?.firstName} ${s.user?.lastName}` })));
      
      return res.json(formatResponse(true, convertBigInts(students), 'Class students fetched successfully'));
      
    } catch (error) {
      console.error(`❌ getClassStudents error for class ${req.params.id}:`, error);
      return handleError(res, error, 'fetch students');
    }
  };

  export const getClassSubjects = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      // Get teacher ID from query params (optional - if provided, filter by teacher)
      const teacherId = req.query.teacherId ? Number(req.query.teacherId) : null;
      
      const scope = await resolveClassScope(req, 'class listing');
      const classInScope = await verifyClassInScope(BigInt(id), scope);

      if (!classInScope) {
        return res.status(404).json(formatResponse(false, null, 'Class not found in the selected context'));
      }

      // Get subjects from TeacherClassSubject table for this class
      const baseWhere = {
        classId: BigInt(id),
        deletedAt: null,
        subject: {
          is: {
            deletedAt: null,
          },
        },
      };
      
      if (teacherId) {
        baseWhere.teacherId = BigInt(teacherId);
      }

      const teacherClassSubjects = await prisma.teacherClassSubject.findMany({
        where: {
          ...baseWhere,
          teacher: {
            user: {
              is: {
                deletedAt: null
              }
            }
          }
        },
        include: {
          subject: {
            include: {
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              }
            }
          },
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                }
              }
            }
          }
        }
      });
      
      // Extract unique subjects
      const subjectsMap = new Map();
      teacherClassSubjects.forEach(tcs => {
        if (!tcs.subject) {
          return;
        }

        const subjectId = tcs.subject.id?.toString();
        if (!subjectId) {
          return;
        }

        if (!subjectsMap.has(subjectId)) {
          subjectsMap.set(subjectId, {
            ...tcs.subject,
            teachers: [],
          });
        }
        // Add teacher to this subject
        subjectsMap.get(subjectId).teachers.push(tcs.teacher);
      });
      
      const subjects = Array.from(subjectsMap.values());
      
      return res.json(formatResponse(true, convertBigInts(subjects), 'Class subjects fetched successfully'));
      
    } catch (error) {
      return handleError(res, error, 'fetch subjects');
    }
  };

  // Get classes for the current authenticated teacher (proxy to getClassesByTeacher)
  export const getClassesByCurrentTeacher = async (req, res) => {
    try {
      const inferredTeacherId = req.user?.teacherId || req.query?.teacherId || req.body?.teacherId;
      if (!inferredTeacherId) {
        return res.status(400).json(formatResponse(false, null, 'teacherId is required'));
      }
      // Forward to existing handler by setting params
      req.params.teacherId = String(inferredTeacherId);
      return await getClassesByTeacher(req, res);
    } catch (error) {
      return handleError(res, error, 'get classes by current teacher');
    }
  };

  // Add subject to class (link many-to-many)
  export const addSubjectToClass = async (req, res) => {
    try {
      const scope = await resolveClassScope(req, 'class update');
      const id = Number(req.params.id);
      const { subjectId } = req.body || {};
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      if (!subjectId || isNaN(Number(subjectId))) {
        return res.status(400).json(formatResponse(false, null, 'Invalid subject ID'));
      }

      // Verify class is accessible
      await ensureClassAccessible(id, scope);
      
      // Verify subject exists and is in scope
      const subj = await prisma.subject.findUnique({ 
        where: { id: toBigIntSafe(subjectId) },
        select: { id: true, schoolId: true }
      });
      if (!subj) {
        return res.status(404).json(formatResponse(false, null, 'Subject not found'));
      }
      
      // Verify subject is in same school
      if (subj.schoolId !== toBigIntSafe(scope.schoolId)) {
        return res.status(403).json(formatResponse(false, null, 'Subject does not belong to the same school'));
      }

      // Link subject to class
      await prisma.class.update({
        where: { id: toBigIntSafe(id) },
        data: {
          subjects: {
            connect: { id: toBigIntSafe(subjectId) }
          }
        }
      });

      // Return updated list
      const updated = await prisma.class.findUnique({
        where: { id },
        include: { subjects: true }
      });
      return res.json(formatResponse(true, convertBigInts(updated?.subjects || []), 'Subject added to class'));
    } catch (error) {
      return handleError(res, error, 'add subject to class');
    }
  };

  export const getClassTimetables = async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { year, academicSessionId } = req.query;
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      const where = { classId: id };
      
      // Filter by academic session if year is provided
      if (year || academicSessionId) {
        if (academicSessionId) {
          where.academicSessionId = BigInt(academicSessionId);
        } else if (year) {
          // Find academic session by year
          const sessions = await prisma.academicSession.findMany({
            where: {
              name: {
                contains: String(year)
              }
            },
            select: { id: true }
          });
          
          if (sessions.length > 0) {
            where.academicSessionId = { in: sessions.map(s => s.id) };
          }
        }
      }
      
      const timetables = await prisma.timetable.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          teacher: {
            select: {
              id: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: [
          { day: 'asc' },
          { period: 'asc' },
          { startTime: 'asc' }
        ]
      });
      
      return res.json(formatResponse(true, timetables, 'Class timetables fetched successfully'));
      
    } catch (error) {
      return handleError(res, error, 'fetch timetables');
    }
  };

  export const getClassExams = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      const exams = await prisma.exam.findMany({
        where: { classId: id },
      });
      
      return res.json(formatResponse(true, exams, 'Class exams fetched successfully'));
      
    } catch (error) {
      return handleError(res, error, 'fetch exams');
    }
  };

  export const getClassAssignments = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      const assignments = await prisma.assignment.findMany({
        where: { classId: id },
      });
      
      return res.json(formatResponse(true, assignments, 'Class assignments fetched successfully'));
      
    } catch (error) {
      return handleError(res, error, 'fetch assignments');
    }
  };

  export const getClassAttendances = async (req, res) => {
    try {
      const id = Number(req.params.id);
      
      if (!id || isNaN(id)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      const attendances = await prisma.attendance.findMany({
        where: { classId: id },
      });
      
      return res.json(formatResponse(true, attendances, 'Class attendances fetched successfully'));
      
    } catch (error) {
      return handleError(res, error, 'fetch attendances');
    }
  };

  // ======================
  // BATCH OPERATIONS
  // ======================

  export const batchAssignTeacher = async (req, res) => {
    try {
      const { classIds, teacherId } = req.body;
      
      if (!Array.isArray(classIds) || classIds.length === 0) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class IDs'));
      }
      
      if (!teacherId || isNaN(teacherId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid teacher ID'));
      }
      
      const results = {
        updated: [],
        failed: [],
        summary: {
          total: classIds.length,
          updated: 0,
          failed: 0,
        }
      };
      
      for (const classId of classIds) {
        try {
          const updatedClass = await prisma.class.update({
            where: { id: classId },
            data: { classTeacherId: teacherId },
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
            }
          });
          
          results.updated.push({
            id: classId,
            data: updatedClass,
          });
          results.summary.updated++;
          
          // Invalidate cache
          await classCache.invalidateClassCacheOnUpdate(updatedClass);
          
        } catch (error) {
          results.failed.push({
            id: classId,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      return res.json(formatResponse(true, results, 'Batch teacher assignment completed'));
      
    } catch (error) {
      return handleError(res, error, 'batch assign teacher');
    }
  };

  // ======================
  // MULTIPLE TEACHERS TO CLASS ASSIGNMENT
  // ======================

  /**
   * Assign multiple teachers to a class
   */
  export const assignMultipleTeachersToClass = async (req, res) => {
    try {
      const { classId, teacherIds } = req.body;
      const schoolId = req.user.schoolId;
      const assignedBy = req.user.id;

      if (!classId || !teacherIds || !Array.isArray(teacherIds)) {
        return res.status(400).json({
          success: false,
          message: 'classId and teacherIds array are required'
        });
      }

      const results = [];
      let assignedCount = 0;
      let failedCount = 0;

      for (const teacherId of teacherIds) {
        try {
          // Check if assignment already exists
          const existingAssignment = await prisma.classToTeacher.findFirst({
            where: {
              classId: BigInt(classId),
              teacherId: BigInt(teacherId),
              schoolId: BigInt(schoolId),
              deletedAt: null
            }
          });

          if (existingAssignment) {
            results.push({
              teacherId: parseInt(teacherId),
              status: 'already_assigned',
              message: 'Teacher already assigned to this class'
            });
            continue;
          }

          // Create new assignment
          const assignment = await prisma.classToTeacher.create({
            data: {
              classId: BigInt(classId),
              teacherId: BigInt(teacherId),
              schoolId: BigInt(schoolId)
            },
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      displayName: true
                    }
                  }
                }
              },
              class: {
                select: {
                  id: true,
                  name: true,
                  code: true
                }
              }
            }
          });

          results.push({
            teacherId: parseInt(teacherId),
            status: 'assigned',
            message: 'Teacher assigned successfully',
            assignment: assignment
          });
          assignedCount++;

        } catch (error) {
          results.push({
            teacherId: parseInt(teacherId),
            status: 'failed',
            error: error.message
          });
          failedCount++;
        }
      }

      return res.json({
        success: true,
        message: 'Multiple teachers assignment completed',
        data: {
          results: results,
          summary: {
            total: teacherIds.length,
            assigned: assignedCount,
            failed: failedCount
          }
        }
      });

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Class assign multiple teachers failed',
        error: error.message
      });
    }
  };

  /**
   * Get teachers assigned to a class
   */
  export const getClassTeachers = async (req, res) => {
    try {
      const { classId } = req.params;
      const schoolId = req.user.schoolId;
      
      if (!classId || isNaN(classId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      const assignments = await prisma.classToTeacher.findMany({
        where: {
          classId: BigInt(classId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true,
                  username: true,
                  avatar: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return res.json(formatResponse(true, convertBigInts(assignments), 'Class teachers retrieved successfully'));
      
    } catch (error) {
      return handleError(res, error, 'get class teachers');
    }
  };

  /**
   * Set or update class supervisor (نگران صنف)
   * PUT /api/classes/:classId/supervisor
   */
  export const setClassSupervisor = async (req, res) => {
    try {
      const { classId } = req.params;
      const { supervisorId } = req.body;
      const schoolId = req.user.schoolId;
      const updatedBy = req.user.id;

      if (!classId || isNaN(classId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }

      // Verify class belongs to school
      const classData = await prisma.class.findFirst({
        where: {
          id: BigInt(classId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        }
      });

      if (!classData) {
        return res.status(404).json(formatResponse(false, null, 'Class not found'));
      }

      // If supervisorId is provided, verify teacher belongs to school
      if (supervisorId) {
        if (isNaN(supervisorId)) {
          return res.status(400).json(formatResponse(false, null, 'Invalid supervisor ID'));
        }

        const teacher = await prisma.teacher.findFirst({
          where: {
            id: BigInt(supervisorId),
            schoolId: BigInt(schoolId),
            deletedAt: null
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                displayName: true
              }
            }
          }
        });

        if (!teacher) {
          return res.status(404).json(formatResponse(false, null, 'Teacher not found'));
        }

        // Update class supervisor
        const updatedClass = await prisma.class.update({
          where: { id: BigInt(classId) },
          data: { 
            supervisorId: BigInt(supervisorId),
            updatedBy: BigInt(updatedBy)
          },
          include: {
            supervisor: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    displayName: true
                  }
                }
              }
            }
          }
        });

        return res.json(formatResponse(true, convertBigInts(updatedClass), 'Class supervisor set successfully'));
      } else {
        // Remove supervisor
        const updatedClass = await prisma.class.update({
          where: { id: BigInt(classId) },
          data: { 
            supervisorId: null,
            updatedBy: BigInt(updatedBy)
          }
        });

        return res.json(formatResponse(true, convertBigInts(updatedClass), 'Class supervisor removed successfully'));
      }
    } catch (error) {
      return handleError(res, error, 'set class supervisor');
    }
  };

  /**
   * Remove teacher from class
   */
  export const removeTeacherFromClass = async (req, res) => {
    try {
      const { classId, teacherId } = req.params;
      const schoolId = req.user.schoolId;
      
      if (!classId || isNaN(classId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class ID'));
      }
      
      if (!teacherId || isNaN(teacherId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid teacher ID'));
      }
      
      const assignment = await prisma.teacherClassSubject.findFirst({
        where: {
          teacherId: BigInt(teacherId),
          classId: BigInt(classId),
          schoolId: BigInt(schoolId),
          deletedAt: null
        }
      });
      
      if (!assignment) {
        return res.status(404).json(formatResponse(false, null, 'Teacher assignment not found'));
      }
      
      // Soft delete the assignment
      await prisma.teacherClassSubject.update({
        where: { id: assignment.id },
        data: {
          deletedAt: new Date(),
          updatedBy: BigInt(req.user.id)
        }
      });
      
      return res.json(formatResponse(true, null, 'Teacher removed from class successfully'));
      
    } catch (error) {
      return handleError(res, error, 'remove teacher from class');
    }
  };

  export const batchUpdateCapacity = async (req, res) => {
    try {
      const { classIds, capacity } = req.body;
      
      if (!Array.isArray(classIds) || classIds.length === 0) {
        return res.status(400).json(formatResponse(false, null, 'Invalid class IDs'));
      }
      
      if (!capacity || isNaN(capacity) || capacity < 1) {
        return res.status(400).json(formatResponse(false, null, 'Invalid capacity'));
      }
      
      const results = {
        updated: [],
        failed: [],
        summary: {
          total: classIds.length,
          updated: 0,
          failed: 0,
        }
      };
      
      for (const classId of classIds) {
        try {
          const updatedClass = await prisma.class.update({
            where: { id: classId },
            data: { capacity },
            include: {
              school: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              },
            }
          });
          
          results.updated.push({
            id: classId,
            data: updatedClass,
          });
          results.summary.updated++;
          
          // Invalidate cache
          await classCache.invalidateClassCacheOnUpdate(updatedClass);
          
        } catch (error) {
          results.failed.push({
            id: classId,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      return res.json(formatResponse(true, results, 'Batch capacity update completed'));
      
    } catch (error) {
      return handleError(res, error, 'batch update capacity');
    }
  };

  export const batchTransferStudents = async (req, res) => {
    try {
      const { fromClassId, toClassId, studentIds } = req.body;
      
      if (!fromClassId || isNaN(fromClassId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid from class ID'));
      }
      
      if (!toClassId || isNaN(toClassId)) {
        return res.status(400).json(formatResponse(false, null, 'Invalid to class ID'));
      }
      
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json(formatResponse(false, null, 'Invalid student IDs'));
      }
      
      const results = {
        transferred: [],
        failed: [],
        summary: {
          total: studentIds.length,
          transferred: 0,
          failed: 0,
        }
      };
      
      for (const studentId of studentIds) {
        try {
          const updatedStudent = await prisma.student.update({
            where: { id: studentId },
            data: { classId: toClassId },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              },
              class: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              }
            }
          });
          
          results.transferred.push({
            id: studentId,
            data: updatedStudent,
          });
          results.summary.transferred++;
          
        } catch (error) {
          results.failed.push({
            id: studentId,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      // Invalidate cache for both classes
      await classCache.invalidateClassCacheOnUpdate({ id: fromClassId });
      await classCache.invalidateClassCacheOnUpdate({ id: toClassId });
      
      return res.json(formatResponse(true, results, 'Batch student transfer completed'));
      
    } catch (error) {
      return handleError(res, error, 'batch transfer students');
    }
  };

  export const getUnassignedStudents = async (req, res) => {
    try {
      const { schoolId } = req.query;
      
      if (!schoolId || isNaN(schoolId)) {
        return res.status(400).json(formatResponse(false, null, 'Valid school ID is required'));
      }
      
      const students = await prisma.student.findMany({
        where: { 
          schoolId: Number(schoolId),
          classId: null,
          deletedAt: null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            }
          },
          parent: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                }
              }
            }
          }
        },
        orderBy: [
          { user: { firstName: 'asc' } },
          { user: { lastName: 'asc' } }
        ]
      });
      
      return res.json(formatResponse(true, convertBigInts(students), 'Unassigned students fetched successfully'));
      
    } catch (error) {
      return handleError(res, error, 'fetch unassigned students');
    }
  };

  export const addStudentsToClass = async (req, res) => {
    try {
      const { classId, studentIds } = req.body;
      
        // Handle null classId (unassign students from any class)
        if (classId === null || classId === undefined) {
          // Unassign students from any class
          console.log(`🔄 Unassigning ${studentIds.length} students from any class`);
          
          const results = {
            added: [],
            failed: [],
            summary: {
              total: studentIds.length,
              added: 0,
              failed: 0,
            }
          };
          
          for (const studentId of studentIds) {
            try {
              const updatedStudent = await prisma.student.update({
                where: { id: Number(studentId) },
                data: {
                  classId: null,
                  updatedBy: req.user.id,
                  updatedAt: new Date()
                },
                include: {
                  user: {
                    select: {
                      id: true,
                      uuid: true,
                      firstName: true,
                      lastName: true,
                      phone: true,
                      status: true
                    }
                  },
                  class: {
                    select: {
                      id: true,
                      name: true,
                      code: true
                    }
                  },
                  section: {
                    select: {
                      id: true,
                      name: true
                    }
                  },
                  parent: {
                    select: {
                      id: true,
                      user: {
                        select: {
                          firstName: true,
                          lastName: true
                        }
                      }
                    }
                  }
                }
              });
              
              results.added.push(updatedStudent);
              results.summary.added++;
              console.log(`✅ Successfully unassigned student ${studentId} from any class`);
            } catch (error) {
              console.error(`❌ Failed to unassign student ${studentId}:`, error.message);
              results.failed.push({
                studentId,
                error: error.message
              });
              results.summary.failed++;
            }
          }
          
          // Invalidate cache
          await classCache.invalidateClassCache();
          
          console.log(`🎯 Final results: ${results.summary.added} students unassigned, ${results.summary.failed} failed`);
          
          return res.json(formatResponse(true, convertBigInts(results), 
            `Successfully unassigned ${results.summary.added} students from any class`));
        }
        
        // Validate classId if provided
        if (classId === '' || isNaN(Number(classId))) {
        return res.status(400).json(formatResponse(false, null, 'Valid class ID is required'));
      }
      
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json(formatResponse(false, null, 'Valid student IDs array is required'));
      }
      
      // Check if class exists and has capacity
      const classData = await prisma.class.findUnique({
        where: { id: Number(classId) },
        include: {
          _count: {
            select: { students: true }
          }
        }
      });
      
      if (!classData) {
        return res.status(404).json(formatResponse(false, null, 'Class not found'));
      }
      
      if (classData._count.students + studentIds.length > classData.capacity) {
        return res.status(400).json(formatResponse(false, null, 
          `Cannot add ${studentIds.length} students. Class capacity would exceed ${classData.capacity}`));
      }
      
      // Update students to assign them to the class
      console.log(`🔄 Adding ${studentIds.length} students to class ${classId}`);
      
      const results = {
        added: [],
        failed: [],
        summary: {
          total: studentIds.length,
          added: 0,
          failed: 0,
        }
      };
      
      for (const studentId of studentIds) {
        try {
          const updatedStudent = await prisma.student.update({
            where: { id: Number(studentId) },
            data: { classId: Number(classId) },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                }
              },
              class: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                }
              }
            }
          });
          
          console.log(`✅ Successfully added student ${studentId} to class ${classId}`);
          results.added.push({
            id: studentId,
            data: convertBigInts(updatedStudent),
          });
          results.summary.added++;
          
        } catch (error) {
          results.failed.push({
            id: studentId,
            error: error.message,
          });
          results.summary.failed++;
        }
      }
      
      // Invalidate cache for the class
      await classCache.invalidateClassCacheOnUpdate({ id: Number(classId) });
      
      console.log(`🎯 Final results: ${results.summary.added} students added, ${results.summary.failed} failed`);
      
      return res.json(formatResponse(true, convertBigInts(results), 'Students added to class successfully'));
      
    } catch (error) {
      return handleError(res, error, 'add students to class');
    }
  };

  // ======================
  // HELPER FUNCTIONS
  // ======================

  /**
   * Auto-generate class code based on existing classes with the same name
   * @param {string} className - The class name (e.g., "10")
   * @param {number} schoolId - The school ID
   * @returns {string} - The next available class code (e.g., "10d")
   */
  const generateNextClassCode = async (className, schoolId) => {
    // Validate class name format (should be a number or simple text)
    if (!className || typeof className !== 'string') {
      throw new Error('Invalid class name');
    }
    
    // Clean the class name (remove extra spaces, convert to string)
    const cleanClassName = className.trim().toString();
    
    if (cleanClassName.length === 0) {
      throw new Error('Class name cannot be empty');
    }
    
    // Validate schoolId
    if (!schoolId || isNaN(Number(schoolId))) {
      throw new Error('Invalid school ID');
    }
    
    try {
      // Find all existing classes with the same name in the school
      const existingClasses = await prisma.class.findMany({
        where: {
          name: cleanClassName,
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        select: {
          code: true
        },
        orderBy: {
          code: 'asc'
        }
      });

      console.log(`Found ${existingClasses.length} existing classes with name "${cleanClassName}" in school ${schoolId}`);
      console.log('Existing class codes:', existingClasses.map(cls => cls.code));
      
      // Also check for any classes with similar codes (for debugging)
      const similarClasses = await prisma.class.findMany({
        where: {
          code: {
            startsWith: cleanClassName
          },
          schoolId: BigInt(schoolId),
          deletedAt: null
        },
        select: {
          code: true
        }
      });
      console.log('Classes with similar codes:', similarClasses.map(cls => cls.code));

      if (existingClasses.length === 0) {
        // No existing classes with this name, start with 'A'
        const newCode = `${cleanClassName}A`;
        console.log(`No existing classes found, starting with: ${newCode}`);
        return newCode;
      }

      // Extract the suffix letters from existing codes
      const existingSuffixes = [];
      for (const cls of existingClasses) {
        // More flexible regex to handle various code patterns
        const match = cls.code.match(new RegExp(`^${cleanClassName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([A-Za-z])$`));
        if (match) {
          const suffix = match[1].toUpperCase();
          existingSuffixes.push(suffix);
        }
      }

      console.log('Extracted existing suffixes:', existingSuffixes);

      if (existingSuffixes.length === 0) {
        // No valid suffixes found, start with 'A'
        const newCode = `${cleanClassName}A`;
        console.log(`No valid suffixes found, starting with: ${newCode}`);
        return newCode;
      }

      // Find the next available letter
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let nextSuffix = null;

      for (const letter of alphabet) {
        if (!existingSuffixes.includes(letter)) {
          nextSuffix = letter;
          break;
        }
      }

      if (!nextSuffix) {
        // All letters A-Z are used, start with numbers
        for (let i = 1; i <= 9; i++) {
          const numSuffix = i.toString();
          if (!existingSuffixes.includes(numSuffix)) {
            nextSuffix = numSuffix;
            break;
          }
        }
        
        if (!nextSuffix) {
          // All single characters used, use timestamp
          const timestamp = Date.now().toString(36).toUpperCase().slice(-3);
          const newCode = `${cleanClassName}${timestamp}`;
          console.log(`All single characters used, using timestamp: ${newCode}`);
          return newCode;
        }
      }

      const generatedCode = `${cleanClassName}${nextSuffix}`;
      console.log(`Generated next available class code: ${generatedCode}`);
      
      return generatedCode;
    } catch (error) {
      console.error('Error generating class code:', error);
      // Fallback: return a timestamp-based code
      const fallbackCode = `${cleanClassName}_${Date.now().toString(36).toUpperCase()}`;
      console.log(`Using fallback code: ${fallbackCode}`);
      return fallbackCode;
    }
  };

  const respondWithClassScopedError = (res, error, fallbackMessage) => {
    const statusCode = error?.statusCode || error?.status || 500;
    const message = error?.message || fallbackMessage;
    if (statusCode >= 500) {
      console.error(message, error);
    }
    return res.status(statusCode).json(formatResponse(false, null, message));
  };

  const resolveClassScope = async (req, contextLabel) => {
    const managedScope = await resolveManagedScope(req);
    const scope = normalizeScopeWithSchool(managedScope, toBigIntSafe(req.user?.schoolId));
    if (scope.schoolId === null || scope.schoolId === undefined) {
      const error = new Error(`No managed school selected for ${contextLabel}`);
      error.statusCode = 400;
      throw error;
    }
    return scope;
  };

  const ensureClassAccessible = async (classId, scope) => {
    const classIdBigInt = toBigIntSafe(classId);
    if (!classIdBigInt) {
      const error = new Error('Invalid class identifier');
      error.statusCode = 400;
      throw error;
    }

    const accessible = await verifyClassInScope(classIdBigInt, scope);
    if (!accessible) {
      const error = new Error('Class not found in the selected context');
      error.statusCode = 404;
      throw error;
    }
    return classIdBigInt;
  };