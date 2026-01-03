import prisma from '../utils/prismaClient.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
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

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  if (status >= 500) {
    console.error(message, error);
  }
  return res.status(status).json({ success: false, message });
};

const ensureSegmentInScope = async (segmentId, scope) => {
  if (!segmentId) return false;
  return verifyRecordInScope('customer_segments', segmentId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureCustomerInScope = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const applySegmentScope = (scope, where = {}) => applyScopeToWhere({ ...where }, scope, { useCourse: false });

const normalizeSegmentData = (scope, data = {}) => {
  const payload = { ...data };
  const requestedBranch = toBigIntOrNull(payload.branchId);
  if (scope.branchId && requestedBranch && scope.branchId !== requestedBranch) {
    const error = new Error('Branch does not match selected context');
    error.statusCode = 403;
    throw error;
  }

  payload.branchId = scope.branchId ?? requestedBranch ?? null;
  payload.schoolId = toBigIntSafe(scope.schoolId);

  if (payload.criteria && typeof payload.criteria === 'object') {
    payload.criteria = JSON.stringify(payload.criteria);
  }

  return payload;
};

// Get all segments
export const getSegments = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'segment list');
    const segments = await prisma.customerSegment.findMany({
      where: applySegmentScope(scope)
    });
    res.json({ success: true, data: convertBigInts(segments) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch segments');
  }
};

// Create a new segment
export const createSegment = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'segment create');
    const { name, criteria, branchId } = req.body;
    const data = normalizeSegmentData(scope, { name, criteria, branchId });

    const segment = await prisma.customerSegment.create({
      data
    });
    res.status(201).json({ success: true, data: convertBigInts(segment) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create segment');
  }
};

// Get a segment by ID
export const getSegmentById = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'segment detail');
    const segmentId = toBigIntOrNull(req.params.segmentId);
    if (!segmentId) {
      return res.status(400).json({ success: false, message: 'Invalid segment ID' });
    }

    const accessible = await ensureSegmentInScope(segmentId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Segment not found in the selected context' });
    }

    const segment = await prisma.customerSegment.findFirst({
      where: applySegmentScope(scope, { id: segmentId })
    });
    if (!segment) {
      return res.status(404).json({ success: false, message: 'Segment not found' });
    }
    res.json({ success: true, data: convertBigInts(segment) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch segment');
  }
};

// Update a segment
export const updateSegment = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'segment update');
    const segmentId = toBigIntOrNull(req.params.segmentId);
    if (!segmentId) {
      return res.status(400).json({ success: false, message: 'Invalid segment ID' });
    }

    const accessible = await ensureSegmentInScope(segmentId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Segment not found in the selected context' });
    }

    const { name, criteria, branchId } = req.body;
    const data = normalizeSegmentData(scope, { name, criteria, branchId });

    const segment = await prisma.customerSegment.update({
      where: { id: segmentId },
      data
    });
    res.json({ success: true, data: convertBigInts(segment) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update segment');
  }
};

// Delete a segment
export const deleteSegment = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'segment delete');
    const segmentId = toBigIntOrNull(req.params.segmentId);
    if (!segmentId) {
      return res.status(400).json({ success: false, message: 'Invalid segment ID' });
    }

    const accessible = await ensureSegmentInScope(segmentId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Segment not found in the selected context' });
    }

    await prisma.customerSegment.delete({
      where: { id: segmentId }
    });
    res.json({ success: true, message: 'Segment deleted' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete segment');
  }
};

// Get customers in a segment
export const getCustomersInSegment = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'segment customers');
    const segmentId = toBigIntOrNull(req.params.segmentId);
    if (!segmentId) {
      return res.status(400).json({ success: false, message: 'Invalid segment ID' });
    }

    const accessible = await ensureSegmentInScope(segmentId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Segment not found in the selected context' });
    }

    const customers = await prisma.customer.findMany({
      where: applyScopeToWhere({ segmentId }, scope, { useCourse: false })
    });
    res.json({ success: true, data: convertBigInts(customers) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch segment customers');
  }
};

// Add a customer to a segment
export const addCustomerToSegment = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'add customer to segment');
    const segmentId = toBigIntOrNull(req.params.segmentId);
    const customerId = toBigIntOrNull(req.body.customerId);

    if (!segmentId || !customerId) {
      return res.status(400).json({ success: false, message: 'Invalid customer or segment ID' });
    }

    const segmentAccessible = await ensureSegmentInScope(segmentId, scope);
    if (!segmentAccessible) {
      return res.status(404).json({ success: false, message: 'Segment not found in the selected context' });
    }

    const customerAccessible = await ensureCustomerInScope(customerId, scope);
    if (!customerAccessible) {
      return res.status(404).json({ success: false, message: 'Customer not found in the selected context' });
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { segmentId }
    });
    res.json({ success: true, data: convertBigInts(customer) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to add customer to segment');
  }
};

// Remove a customer from a segment
export const removeCustomerFromSegment = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'remove customer from segment');
    const segmentId = toBigIntOrNull(req.params.segmentId);
    const customerId = toBigIntOrNull(req.params.customerId);

    if (!segmentId || !customerId) {
      return res.status(400).json({ success: false, message: 'Invalid customer or segment ID' });
    }

    const segmentAccessible = await ensureSegmentInScope(segmentId, scope);
    if (!segmentAccessible) {
      return res.status(404).json({ success: false, message: 'Segment not found in the selected context' });
    }

    const customerAccessible = await ensureCustomerInScope(customerId, scope);
    if (!customerAccessible) {
      return res.status(404).json({ success: false, message: 'Customer not found in the selected context' });
    }

    const customer = await prisma.customer.update({
      where: { id: customerId },
      data: { segmentId: null }
    });
    res.json({ success: true, data: convertBigInts(customer) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to remove customer from segment');
  }
};

// Get segment analytics (mock)
export const getSegmentAnalytics = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'segment analytics');
    res.json({ success: true, data: { totalSegments: 10, totalCustomers: 100 } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch segment analytics');
  }
};

// Auto-segment customers (mock)
export const autoSegmentCustomers = async (req, res) => {
  try {
    await resolveScopeOrReject(req, 'auto segment customers');
    res.json({ success: true, message: 'Auto-segmentation started', jobId: 'mock-job-456' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to start auto-segmentation');
  }
}; 