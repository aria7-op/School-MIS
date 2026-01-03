import prisma from '../utils/prismaClient.js';
import logger from '../config/logger.js';
import { formatResponse, handleError } from '../utils/responseUtils.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const convertBigInts = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(convertBigInts);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, convertBigInts(val)]));
  }
  return value;
};

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  logger.error(message, error);
  return formatResponse(res, { success: false, message, data: null }, status);
};

const resolveInteractionScope = async (req, entityName) => {
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

const ensureCustomerAccessible = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureInteractionAccessible = async (interactionId, scope) => {
  if (!interactionId) return false;
  return verifyRecordInScope('customer_interactions', interactionId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const applyInteractionScope = (scope, where = {}) => applyScopeToWhere({ ...where }, scope, {
  useCourse: false
});

// Get all interactions for a customer
export const getCustomerInteractions = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction list');
    const customerId = toBigIntOrNull(req.params.id);
    if (!customerId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid customer ID' }, 'Invalid customer ID');
    }

    const accessible = await ensureCustomerAccessible(customerId, scope);
    if (!accessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Customer not found in the selected context' }, 'Customer not found');
    }

    const interactions = await prisma.customerInteraction.findMany({
      where: applyInteractionScope(scope, { customerId }),
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: convertBigInts(interactions) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to retrieve customer interactions');
  }
};

// Create a new interaction for a customer
export const createInteraction = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction create');
    const customerId = toBigIntOrNull(req.params.id);
    if (!customerId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid customer ID' }, 'Invalid customer ID');
    }

    const accessible = await ensureCustomerAccessible(customerId, scope);
    if (!accessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Customer not found in the selected context' }, 'Customer not found');
    }

    const { type, content, createdBy, metadata } = req.body;
    const createdById = toBigIntOrNull(createdBy) || toBigIntSafe(req.user?.id);

    const interaction = await prisma.customerInteraction.create({
      data: {
        customerId,
        schoolId: toBigIntSafe(scope.schoolId),
        type,
        content,
        createdBy: createdById,
        metadata: metadata || {},
      },
    });
    res.status(201).json({ success: true, data: convertBigInts(interaction) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create customer interaction');
  }
};

// Get a specific interaction by ID
export const getInteractionById = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction detail');
    const customerId = toBigIntOrNull(req.params.id);
    const interactionId = toBigIntOrNull(req.params.interactionId);
    if (!customerId || !interactionId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid customer or interaction ID' }, 'Invalid interaction ID');
    }

    const [customerAccessible, interactionAccessible] = await Promise.all([
      ensureCustomerAccessible(customerId, scope),
      ensureInteractionAccessible(interactionId, scope)
    ]);

    if (!customerAccessible || !interactionAccessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Interaction not found in the selected context' }, 'Interaction not found');
    }

    const interaction = await prisma.customerInteraction.findFirst({
      where: applyInteractionScope(scope, {
        id: interactionId,
        customerId
      })
    });
    if (!interaction) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Interaction not found' }, 'Interaction not found');
    }
    res.json({ success: true, data: convertBigInts(interaction) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to retrieve interaction');
  }
};

// Update an interaction
export const updateInteraction = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction update');
    const customerId = toBigIntOrNull(req.params.id);
    const interactionId = toBigIntOrNull(req.params.interactionId);
    if (!customerId || !interactionId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid customer or interaction ID' }, 'Invalid interaction ID');
    }

    const [customerAccessible, interactionAccessible] = await Promise.all([
      ensureCustomerAccessible(customerId, scope),
      ensureInteractionAccessible(interactionId, scope)
    ]);

    if (!customerAccessible || !interactionAccessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Interaction not found in the selected context' }, 'Interaction not found');
    }

    const { type, content, metadata } = req.body;
    const interaction = await prisma.customerInteraction.update({
      where: { id: interactionId },
      data: {
        type,
        content,
        metadata,
        updatedAt: new Date(),
        schoolId: toBigIntSafe(scope.schoolId)
      },
    });
    res.json({ success: true, data: convertBigInts(interaction) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update interaction');
  }
};

// Delete an interaction
export const deleteInteraction = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction delete');
    const customerId = toBigIntOrNull(req.params.id);
    const interactionId = toBigIntOrNull(req.params.interactionId);
    if (!customerId || !interactionId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid customer or interaction ID' }, 'Invalid interaction ID');
    }

    const [customerAccessible, interactionAccessible] = await Promise.all([
      ensureCustomerAccessible(customerId, scope),
      ensureInteractionAccessible(interactionId, scope)
    ]);

    if (!customerAccessible || !interactionAccessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Interaction not found in the selected context' }, 'Interaction not found');
    }

    await prisma.customerInteraction.delete({
      where: { id: interactionId }
    });
    res.json({ success: true, message: 'Interaction deleted' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete interaction');
  }
};

// Get analytics for interactions (example: count by type)
export const getInteractionAnalytics = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction analytics');
    const analytics = await prisma.customerInteraction.groupBy({
      by: ['type'],
      where: applyInteractionScope(scope),
      _count: { type: true }
    });
    res.json({ success: true, data: convertBigInts(analytics) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch interaction analytics');
  }
};

// Get timeline of interactions (all, ordered by createdAt)
export const getInteractionTimeline = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction timeline');
    const timeline = await prisma.customerInteraction.findMany({
      where: applyInteractionScope(scope),
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: convertBigInts(timeline) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to retrieve interaction timeline');
  }
};

// Bulk create interactions
export const bulkCreateInteractions = async (req, res) => {
  try {
    const scope = await resolveInteractionScope(req, 'customer interaction bulk create');
    const customerId = toBigIntOrNull(req.params.id);
    if (!customerId) {
      return respondWithScopedError(res, { statusCode: 400, message: 'Invalid customer ID' }, 'Invalid customer ID');
    }

    const accessible = await ensureCustomerAccessible(customerId, scope);
    if (!accessible) {
      return respondWithScopedError(res, { statusCode: 404, message: 'Customer not found in the selected context' }, 'Customer not found');
    }

    const { interactions } = req.body; // Array of { type, content, createdBy, metadata }
    if (!Array.isArray(interactions) || interactions.length === 0) {
      return res.status(400).json({ success: false, error: 'No interactions provided' });
    }
    const created = await prisma.customerInteraction.createMany({
      data: interactions.map(i => ({
        customerId,
        schoolId: toBigIntSafe(scope.schoolId),
        type: i.type,
        content: i.content,
        createdBy: toBigIntOrNull(i.createdBy) || toBigIntSafe(req.user?.id),
        metadata: i.metadata || {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    });
    res.status(201).json({ success: true, data: convertBigInts(created) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to bulk create interactions');
  }
}; 