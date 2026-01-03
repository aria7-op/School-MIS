import prisma from './prismaClient.js';

export const toBigIntOrNull = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return null;
    }
    try {
      return BigInt(trimmed);
    } catch {
      return null;
    }
  }
  return null;
};

const SCOPE_CACHE_KEY = Symbol('managedScopeCache');

export const resolveManagedScope = async (
  req,
  { deriveBranchFromCourse = true, refresh = false } = {}
) => {
  if (!req || typeof req !== 'object') {
    return {
      schoolId: null,
      branchId: null,
      courseId: null,
      derivedBranchFromCourse: false
    };
  }

  if (!refresh && req[SCOPE_CACHE_KEY]) {
    return req[SCOPE_CACHE_KEY];
  }

  const managedContext = req.managedContext || {};
  // Prefer explicitly provided managedContext over user defaults. This allows clearing branch/course when selecting only a school.
  const schoolId = toBigIntOrNull(
    (managedContext.hasOwnProperty('schoolId') ? managedContext.schoolId : undefined) ?? req.user?.schoolId
  );
  let branchId = toBigIntOrNull(
    (managedContext.hasOwnProperty('branchId') ? managedContext.branchId : undefined) ?? req.user?.branchId
  );
  let courseId = toBigIntOrNull(
    (managedContext.hasOwnProperty('courseId') ? managedContext.courseId : undefined) ?? req.user?.courseId
  );
  let derivedBranchFromCourse = false;

  if (deriveBranchFromCourse && courseId && !branchId) {
    try {
      const courseRecord = await prisma.course.findUnique({
        where: { id: courseId },
        select: { branchId: true, schoolId: true }
      });
      if (courseRecord?.branchId) {
        branchId = courseRecord.branchId;
        derivedBranchFromCourse = true;
      }
    } catch (error) {
      console.error('resolveManagedScope: failed to derive branch from course', {
        courseId: courseId.toString(),
        error
      });
    }
  }

  const resolvedScope = {
    schoolId,
    branchId,
    courseId,
    derivedBranchFromCourse
  };

  req[SCOPE_CACHE_KEY] = resolvedScope;
  return resolvedScope;
};

export const applyScopeToWhere = (where = {}, scope, { useBranch = true, useCourse = true } = {}) => {
  const scopedWhere = { ...where };
  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    scopedWhere.schoolId = scope.schoolId;
  }
  if (useBranch && scope.branchId !== null && scope.branchId !== undefined) {
    scopedWhere.branchId = scope.branchId;
  }
  if (useCourse && scope.courseId !== null && scope.courseId !== undefined) {
    scopedWhere.courseId = scope.courseId;
  }
  return scopedWhere;
};

export const appendScopeToSql = (
  baseQuery,
  params,
  scope,
  { useBranch = true, useCourse = false, courseColumn = 'courseId', tableAlias = null } = {}
) => {
  let query = baseQuery;
  const finalParams = [...params];

  // Use table alias prefix if provided to avoid ambiguous column errors
  const prefix = tableAlias ? `${tableAlias}.` : '';

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    query += ` AND ${prefix}schoolId = ?`;
    finalParams.push(scope.schoolId.toString());
  }
  if (useBranch && scope.branchId !== null && scope.branchId !== undefined) {
    query += ` AND ${prefix}branchId = ?`;
    finalParams.push(scope.branchId.toString());
  }
  if (useCourse && scope.courseId !== null && scope.courseId !== undefined) {
    query += ` AND ${prefix}${courseColumn} = ?`;
    finalParams.push(scope.courseId.toString());
  }

  return { query, params: finalParams };
};

export const toBigIntSafe = (value, fallback = null) => {
  const converted = toBigIntOrNull(value);
  return converted === null ? fallback : converted;
};

export const normalizeScopeWithSchool = (scope, fallbackSchoolId = null) => {
  const normalizedSchoolId = scope?.schoolId ?? fallbackSchoolId;
  return {
    schoolId: normalizedSchoolId,
    branchId: scope?.branchId ?? null,
    courseId: scope?.courseId ?? null,
    derivedBranchFromCourse: scope?.derivedBranchFromCourse ?? false
  };
};

export const verifyRecordInScope = async (
  tableName,
  idValue,
  scope,
  {
    idColumn = 'id',
    branchColumn = 'branchId',
    courseColumn = 'courseId',
    useBranch = true,
    useCourse = true
  } = {}
) => {
  if (!scope) {
    return true;
  }

  const normalizedId = toBigIntOrNull(idValue);
  if (normalizedId === null) {
    return false;
  }

  console.log(`=== verifyRecordInScope DEBUG ===`);
  console.log(`Table: ${tableName}`);
  console.log(`ID: ${normalizedId.toString()}`);
  console.log(`Scope:`, scope);
  console.log(`Options:`, { useBranch, useCourse, branchColumn, courseColumn });

  const filters = [`\`${idColumn}\` = ?`, '`deletedAt` IS NULL'];
  const params = [normalizedId.toString()];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
    console.log(`Adding school filter: ${scope.schoolId.toString()}`);
  }
  if (useBranch && branchColumn && scope.branchId !== null && scope.branchId !== undefined) {
    filters.push(`\`${branchColumn}\` = ?`);
    params.push(scope.branchId.toString());
    console.log(`Adding branch filter: ${scope.branchId.toString()}`);
  }
  if (useCourse && courseColumn && scope.courseId !== null && scope.courseId !== undefined) {
    filters.push(`\`${courseColumn}\` = ?`);
    params.push(scope.courseId.toString());
    console.log(`Adding course filter: ${scope.courseId.toString()}`);
  }

  const sql = `SELECT ${idColumn} FROM ${tableName} WHERE ${filters.join(' AND ')}`;
  console.log(`SQL: ${sql}`);
  console.log(`Params:`, params);
  
  try {
    const rows = await prisma.$queryRawUnsafe(sql, ...params);
    const result = Array.isArray(rows) && rows.length > 0;
    console.log(`Query result: ${result}, rows: ${rows?.length || 0}`);
    return result;
  } catch (error) {
    console.error('verifyRecordInScope failed', { tableName, idValue: normalizedId?.toString(), error });
    return false;
  }
};


