import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const convertBigInts = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(convertBigInts);
  if (typeof obj === 'object') {
    return Object.fromEntries(Object.entries(obj).map(([key, value]) => [key, convertBigInts(value)]));
  }
  return obj;
};

const resolveScopeOrReject = async (req, entityName) => {
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

const ensureCustomerInScope = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensurePipelineStageInScope = async (stageId, scope) => {
  if (!stageId) return false;
  return verifyRecordInScope('customer_pipeline_stages', stageId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureOwnerInScope = async (ownerId, scope) => {
  if (!ownerId) return false;
  return verifyRecordInScope('owners', ownerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const normalizeCustomerScopedIds = (scope, payload = {}) => {
  const requestedBranch = toBigIntOrNull(payload.branchId);
  if (scope.branchId && requestedBranch && scope.branchId !== requestedBranch) {
    const error = new Error('Branch does not match selected context');
    error.statusCode = 403;
    throw error;
  }
  return {
    branchId: scope.branchId ?? requestedBranch ?? null
  };
};

const sanitizeCustomerData = async (scope, data, actorId) => {
  const allowedFields = new Set([
    'name',
    'phone',
    'gender',
    'source',
    'purpose',
    'department',
    'metadata',
    'serialNumber',
    'totalSpent',
    'orderCount',
    'type',
    'referredTo',
    'referredById',
    'ownerId',
    'pipelineStageId',
    'userId',
    'priority',
    'rermark',
    'branchId'
  ]);

  const sanitized = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (allowedFields.has(key)) {
      sanitized[key] = value;
    }
  }

  if (sanitized.metadata && typeof sanitized.metadata === 'object') {
    sanitized.metadata = JSON.stringify(sanitized.metadata);
  }

  if (sanitized.pipelineStageId) {
    const accessible = await ensurePipelineStageInScope(sanitized.pipelineStageId, scope);
    if (!accessible) {
      const error = new Error('Pipeline stage not found in the selected context');
      error.statusCode = 404;
      throw error;
    }
    sanitized.pipelineStageId = toBigIntSafe(sanitized.pipelineStageId);
  }

  if (sanitized.ownerId) {
    const accessible = await ensureOwnerInScope(sanitized.ownerId, scope);
    if (!accessible) {
      const error = new Error('Owner not found in the selected context');
      error.statusCode = 404;
      throw error;
    }
    sanitized.ownerId = toBigIntSafe(sanitized.ownerId);
  }

  const { branchId } = normalizeCustomerScopedIds(scope, sanitized);
  sanitized.branchId = branchId;
  sanitized.schoolId = toBigIntSafe(scope.schoolId);
  sanitized.updatedBy = actorId;

  return sanitized;
};

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    console.error(message, error);
  }
  return res.status(status).json({ success: false, message });
};

export const bulkCreateCustomers = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'bulk customer create');
    const actorId = toBigIntSafe(req.user?.id);
    const { customers } = req.body;
    if (!Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ success: false, message: 'No customers provided' });
    }
    const serializedCustomers = [];
    for (const customer of customers) {
      const sanitized = await sanitizeCustomerData(scope, customer, actorId);
      sanitized.createdBy = actorId;
      serializedCustomers.push({
        ...sanitized,
        serialNumber:
          sanitized.serialNumber || `CUST-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      });
    }

    const created = await prisma.customer.createMany({ data: serializedCustomers });
    res.status(201).json({ success: true, data: convertBigInts(created) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to bulk create customers');
  }
};

export const bulkUpdateCustomers = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'bulk customer update');
    const actorId = toBigIntSafe(req.user?.id);
    const { updates } = req.body; // [{ id, data }]
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No updates provided' });
    }
    const results = [];
    for (const update of updates) {
      const customerId = toBigIntOrNull(update?.id);
      if (!customerId) {
        throw Object.assign(new Error('Invalid customer ID in updates payload'), { statusCode: 400 });
      }

      const accessible = await ensureCustomerInScope(customerId, scope);
      if (!accessible) {
        const error = new Error('Customer not found in the selected context');
        error.statusCode = 404;
        throw error;
      }

      const sanitizedData = await sanitizeCustomerData(scope, update.data, actorId);

      const updated = await prisma.customer.update({
        where: { id: customerId },
        data: sanitizedData
      });
      results.push(updated);
    }
    res.json({ success: true, data: convertBigInts(results) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to bulk update customers');
  }
};

export const bulkDeleteCustomers = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'bulk customer delete');
    const { customerIds } = req.body;
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No customer IDs provided' });
    }
    const scopedIds = [];
    for (const id of customerIds) {
      const customerId = toBigIntOrNull(id);
      if (!customerId) {
        throw Object.assign(new Error('Invalid customer ID provided'), { statusCode: 400 });
      }
      const accessible = await ensureCustomerInScope(customerId, scope);
      if (!accessible) {
        const error = new Error('One or more customers not found in the selected context');
        error.statusCode = 404;
        throw error;
      }
      scopedIds.push(customerId);
    }

    const deleted = await prisma.customer.deleteMany({ where: { id: { in: scopedIds } } });
    res.json({ success: true, data: convertBigInts(deleted) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to bulk delete customers');
  }
};

export const bulkImportCustomers = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'bulk customer import');
    // Mock import
    res.json({ success: true, message: 'Bulk import started', jobId: 'import-job-789' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to start bulk import');
  }
};

export const bulkExportCustomers = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'bulk customer export');
    // Mock export
    res.json({ success: true, message: 'Bulk export started', jobId: 'export-job-789' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to start bulk export');
  }
};

export const bulkMergeCustomers = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'bulk customer merge');
    // Mock merge
    res.json({ success: true, message: 'Bulk merge started', jobId: 'merge-job-789' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to start bulk merge');
  }
};

export const bulkDuplicateCustomers = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'bulk customer duplicate');
    // Mock duplicate
    res.json({ success: true, message: 'Bulk duplicate started', jobId: 'duplicate-job-789' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to start bulk duplicate');
  }
};

export const bulkAssignCustomers = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'bulk customer assign');
    // Mock assign
    res.json({ success: true, message: 'Bulk assign started', jobId: 'assign-job-789' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to start bulk assign');
  }
};

export const bulkTagCustomers = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'bulk customer tag');
    // Mock tag
    res.json({ success: true, message: 'Bulk tag started', jobId: 'tag-job-789' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to start bulk tag');
  }
};

export const getBulkJobStatus = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'bulk job status');
    const { jobId } = req.params;
    // Mock job status
    res.json({ success: true, data: { jobId, status: 'completed' } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch bulk job status');
  }
}; 