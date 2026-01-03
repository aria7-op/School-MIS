import prisma from '../utils/prismaClient.js';
import logger from '../config/logger.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

// Helper to convert all BigInt fields to strings and Date objects to ISO strings
function convertBigInts(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertBigInts);
  } else if (obj && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (typeof obj[key] === 'bigint') {
        newObj[key] = obj[key].toString();
      } else if (obj[key] instanceof Date) {
        newObj[key] = obj[key].toISOString();
      } else {
        newObj[key] = convertBigInts(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
}

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  logger.error(message, error);
  return res.status(status).json({ success: false, message });
};

const resolvePipelineScope = async (req, entityName) => {
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

const ensureStageAccessible = async (stageId, scope) => {
  if (!stageId) return false;
  return verifyRecordInScope('customer_pipeline_stages', stageId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureCustomerAccessible = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

// Get the full pipeline (all stages with customers)
export const getPipeline = async (req, res) => {
  try {
    const scope = await resolvePipelineScope(req, 'pipeline list');
    const stages = await prisma.customerPipelineStage.findMany({
      where: applyScopeToWhere({}, scope, { useCourse: false }),
      include: {
        _count: { select: { customers: true } }
      },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: convertBigInts(stages) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to load pipeline');
  }
};

// Get all pipeline stages
export const getPipelineStages = async (req, res) => {
  try {
    const scope = await resolvePipelineScope(req, 'pipeline stages');
    const stages = await prisma.customerPipelineStage.findMany({
      where: applyScopeToWhere({}, scope, { useCourse: false }),
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: convertBigInts(stages) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch pipeline stages');
  }
};

// Get customers by stage
export const getCustomersByStage = async (req, res) => {
  try {
    const scope = await resolvePipelineScope(req, 'pipeline customers');
    const stageId = toBigIntOrNull(req.params.stageId);
    if (!stageId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid stage ID' }, 'Invalid stage ID');
    }

    const accessible = await ensureStageAccessible(stageId, scope);
    if (!accessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Stage not found in the selected context' }, 'Stage not found');
    }

    const customers = await prisma.customer.findMany({
      where: applyScopeToWhere({ pipelineStageId: stageId }, scope, { useCourse: false })
    });
    res.json({ success: true, data: convertBigInts(customers) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch customers for stage');
  }
};

// Move a customer to a different stage
export const moveCustomerToStage = async (req, res) => {
  try {
    const scope = await resolvePipelineScope(req, 'move customer stage');
    const stageId = toBigIntOrNull(req.params.stageId);
    const customerId = toBigIntOrNull(req.body.customerId);
    if (!stageId || !customerId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid customer or stage ID' }, 'Invalid customer or stage ID');
    }

    const [stageAccessible, customerAccessible] = await Promise.all([
      ensureStageAccessible(stageId, scope),
      ensureCustomerAccessible(customerId, scope)
    ]);

    if (!stageAccessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Stage not found in the selected context' }, 'Stage not found');
    }

    if (!customerAccessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Customer not found in the selected context' }, 'Customer not found');
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { pipelineStageId: stageId }
    });
    res.json({ success: true, data: convertBigInts(customer) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to move customer to stage');
  }
};

// Get pipeline analytics (mock)
export const getPipelineAnalytics = async (req, res) => {
  try {
    await resolvePipelineScope(req, 'pipeline analytics');
    res.json({ success: true, data: convertBigInts({ totalStages: 5, totalCustomers: 100 }) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch pipeline analytics');
  }
};

// Get pipeline forecast (mock)
export const getPipelineForecast = async (req, res) => {
  try {
    await resolvePipelineScope(req, 'pipeline forecast');
    res.json({ success: true, data: convertBigInts({ forecast: 50 }) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch pipeline forecast');
  }
};

// Create a new pipeline stage
export const createPipelineStage = async (req, res) => {
  try {
    const scope = await resolvePipelineScope(req, 'pipeline stage create');
    const { name, order, branchId } = req.body;
    const normalizedBranch = scope.branchId ?? toBigIntOrNull(branchId) ?? null;

    const stage = await prisma.customerPipelineStage.create({
      data: {
        name,
        order,
        schoolId: toBigIntSafe(scope.schoolId),
        branchId: normalizedBranch
      }
    });
    res.status(201).json({ success: true, data: convertBigInts(stage) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create pipeline stage');
  }
};

// Update a pipeline stage
export const updatePipelineStage = async (req, res) => {
  try {
    const scope = await resolvePipelineScope(req, 'pipeline stage update');
    const stageId = toBigIntOrNull(req.params.stageId);
    if (!stageId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid stage ID' }, 'Invalid stage ID');
    }

    const accessible = await ensureStageAccessible(stageId, scope);
    if (!accessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Stage not found in the selected context' }, 'Stage not found');
    }

    const { name, order, branchId } = req.body;
    const normalizedBranch = scope.branchId ?? toBigIntOrNull(branchId) ?? null;

    const stage = await prisma.customerPipelineStage.update({
      where: { id: stageId },
      data: { name, order, branchId: normalizedBranch }
    });
    res.json({ success: true, data: convertBigInts(stage) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update pipeline stage');
  }
};

// Delete a pipeline stage
export const deletePipelineStage = async (req, res) => {
  try {
    const scope = await resolvePipelineScope(req, 'pipeline stage delete');
    const stageId = toBigIntOrNull(req.params.stageId);
    if (!stageId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid stage ID' }, 'Invalid stage ID');
    }

    const accessible = await ensureStageAccessible(stageId, scope);
    if (!accessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Stage not found in the selected context' }, 'Stage not found');
    }

    await prisma.customerPipelineStage.delete({
      where: { id: stageId }
    });
    res.json({ success: true, message: 'Pipeline stage deleted' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete pipeline stage');
  }
}; 