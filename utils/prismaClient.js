import { PrismaClient } from '../generated/prisma/index.js';
import { getRequestContext } from './requestContext.js';

const globalForPrisma = globalThis;

if (!globalForPrisma.__prismaClient) {
  // Configure connection pool to prevent exhaustion
  // Default: connection_limit=9, pool_timeout=10
  // Increase to handle more concurrent requests
  let databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      const url = new URL(databaseUrl);
      // Only add parameters if they don't already exist
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', process.env.PRISMA_CONNECTION_LIMIT || '20');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', process.env.PRISMA_POOL_TIMEOUT || '20');
      }
      databaseUrl = url.toString();
    } catch (error) {
      // If URL parsing fails, use original DATABASE_URL
      console.warn('[Prisma] Failed to parse DATABASE_URL for connection pool configuration:', error.message);
    }
  }
  
  globalForPrisma.__prismaClient = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
    datasources: databaseUrl ? {
      db: {
        url: databaseUrl
      }
    } : undefined
  });
}

const prisma = globalForPrisma.__prismaClient;

const prismaModelMeta = prisma._dmmf?.modelMap ?? {};

const normalizeIdValue = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    try {
      return BigInt(trimmed);
    } catch {
      return null;
    }
  }
  return null;
};

const cloneArgs = (args) => {
  if (args === undefined) return {};
  if (args === null || typeof args !== 'object') return args;
  const cloned = { ...args };
  if (cloned.where && typeof cloned.where === 'object' && !Array.isArray(cloned.where)) {
    cloned.where = { ...cloned.where };
  }
  if (cloned.data && typeof cloned.data === 'object') {
    if (Array.isArray(cloned.data)) {
      cloned.data = cloned.data.map((item) =>
        item && typeof item === 'object' ? { ...item } : item
      );
    } else {
      cloned.data = { ...cloned.data };
    }
  }
  return cloned;
};

const mergeWhereEquals = (args, fieldName, value) => {
  if (value === null || value === undefined) return;
  args.where = args.where && typeof args.where === 'object' ? { ...args.where } : {};
  const current = args.where[fieldName];
  if (current === undefined) {
    args.where[fieldName] = value;
  } else if (typeof current === 'object' && current !== null && !Array.isArray(current)) {
    args.where[fieldName] = { ...current, equals: value };
  } else {
    args.where[fieldName] = value;
  }
};

const applyDataScopeToRecord = (record, scope) => {
  if (!record || typeof record !== 'object') return record;
  const updated = { ...record };
  if (scope.branchId !== null && scope.hasBranchField) {
    updated.branchId = scope.branchId;
  }
  if (scope.schoolId !== null && scope.hasSchoolField) {
    if (updated.schoolId === undefined || updated.schoolId === null) {
      updated.schoolId = scope.schoolId;
    }
  }
  if (scope.courseId !== null && scope.hasCourseField) {
    if (updated.courseId === undefined || updated.courseId === null) {
      updated.courseId = scope.courseId;
    }
  }
  return updated;
};

const applyDataScope = (data, scope) => {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => applyDataScopeToRecord(item, scope));
  }
  return applyDataScopeToRecord(data, scope);
};

const actionsRequiringFilter = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'deleteMany',
  'updateMany',
  'update',
  'delete',
  'upsert'
]);

const actionsRequiringDataScope = new Set([
  'create',
  'createMany',
  'update',
  'upsert'
]);

const computeScope = (modelName) => {
  const context = getRequestContext();
  const managedContext = context?.managedContext;
  if (!managedContext) return null;

  const modelMeta = prismaModelMeta[modelName];
  if (!modelMeta) return null;

  const hasBranchField = modelMeta.fields.some((field) => field.name === 'branchId');
  const hasCourseField = modelMeta.fields.some((field) => field.name === 'courseId');
  const hasSchoolField = modelMeta.fields.some((field) => field.name === 'schoolId');

  const branchId = hasBranchField ? normalizeIdValue(managedContext.branchId) : null;
  const courseId = hasCourseField ? normalizeIdValue(managedContext.courseId) : null;
  const schoolId = hasSchoolField ? normalizeIdValue(managedContext.schoolId) : null;

  if (branchId === null && courseId === null && schoolId === null) return null;

  return {
    branchId,
    courseId,
    schoolId,
    hasBranchField,
    hasCourseField,
    hasSchoolField
  };
};

const applyScopeToArgs = (args, action, scope) => {
  let finalArgs = cloneArgs(args);
  if (finalArgs === undefined || finalArgs === null || typeof finalArgs !== 'object') {
    finalArgs = {};
  }

  if (actionsRequiringFilter.has(action)) {
    if (scope.branchId !== null) {
      mergeWhereEquals(finalArgs, 'branchId', scope.branchId);
    } else if (scope.courseId !== null && scope.hasCourseField) {
      mergeWhereEquals(finalArgs, 'courseId', scope.courseId);
    } else if (scope.schoolId !== null) {
      mergeWhereEquals(finalArgs, 'schoolId', scope.schoolId);
    }
  }

  if (actionsRequiringDataScope.has(action) && finalArgs.data !== undefined) {
    finalArgs.data = applyDataScope(finalArgs.data, scope);
  }

  return finalArgs;
};

const postProcessResult = (action, scope, result) => {
  if (!scope.hasBranchField || scope.branchId === null) {
    return result;
  }

  const shouldSanitizeSingle =
    action === 'findUnique' ||
    action === 'findUniqueOrThrow' ||
    action === 'findFirst' ||
    action === 'findFirstOrThrow';

  if (Array.isArray(result)) {
    return result;
  }

  if (shouldSanitizeSingle && result) {
    const recordBranch =
      result.branchId ??
      result.branch?.id ??
      null;
    if (recordBranch !== null && recordBranch !== scope.branchId) {
      return null;
    }
  }

  return result;
};

let managedPrisma = prisma;

if (typeof prisma.$use === 'function') {
  prisma.$use(async (params, next) => {
    const scope = params.model ? computeScope(params.model) : null;
    if (!scope) {
      return next(params);
    }

    if (params.args) {
      params.args = applyScopeToArgs(params.args, params.action, scope);
    } else if (actionsRequiringFilter.has(params.action) || actionsRequiringDataScope.has(params.action)) {
      params.args = applyScopeToArgs({}, params.action, scope);
    }

    const result = await next(params);
    return postProcessResult(params.action, scope, result);
  });
} else {
  console.warn('[Prisma] $use middleware not available – using managed proxy for context scoping.');

  const modelProxyCache = new Map();

  const createModelProxy = (modelName, delegate) => {
    const methodCache = new Map();
    return new Proxy(delegate, {
      get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);
        if (typeof original !== 'function') {
          return original;
        }

        if (!methodCache.has(prop)) {
          const wrapped = async function (args, ...rest) {
            const scope = computeScope(modelName);
            if (!scope) {
              return original.apply(target, [args, ...rest]);
            }

            const finalArgs = applyScopeToArgs(args, String(prop), scope);
            const result = await original.apply(target, [finalArgs, ...rest]);
            return postProcessResult(String(prop), scope, result);
          };
          methodCache.set(prop, wrapped);
        }

        return methodCache.get(prop);
      }
    });
  };

  const managedPrismaProxy = new Proxy(prisma, {
    get(target, prop, receiver) {
      if (prismaModelMeta[prop]) {
        if (!modelProxyCache.has(prop)) {
          modelProxyCache.set(prop, createModelProxy(prop, Reflect.get(target, prop, receiver)));
        }
        return modelProxyCache.get(prop);
      }
      return Reflect.get(target, prop, receiver);
    }
  });

  managedPrisma = managedPrismaProxy;
}

export default managedPrisma;



