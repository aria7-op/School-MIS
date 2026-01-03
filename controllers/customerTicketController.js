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

const ensureCustomerInScope = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const ensureTicketInScope = async (ticketId, scope) => {
  if (!ticketId) return false;
  return verifyRecordInScope('customer_tickets', ticketId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

const normalizeTicketScope = (scope, payload = {}) => {
  const requestedBranch = toBigIntOrNull(payload.branchId);
  if (scope.branchId && requestedBranch && scope.branchId !== requestedBranch) {
    const error = new Error('Branch does not match selected context');
    error.statusCode = 403;
    throw error;
  }

  return {
    branchId: scope.branchId ?? requestedBranch ?? null,
    schoolId: toBigIntSafe(scope.schoolId)
  };
};

const sanitizeTicketMetadata = (metadata) => {
  if (!metadata) return null;
  if (typeof metadata === 'string') return metadata;
  if (typeof metadata === 'object') return JSON.stringify(metadata);
  return JSON.stringify({ value: metadata });
};

// Get all tickets for a customer
export const getCustomerTickets = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'customer tickets');
    const customerId = toBigIntOrNull(req.params.id);
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const accessible = await ensureCustomerInScope(customerId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Customer not found in the selected context' });
    }

    const tickets = await prisma.customerTicket.findMany({
      where: applyScopeToWhere({ customerId }, scope, { useCourse: false }),
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: convertBigInts(tickets) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch customer tickets');
  }
};

// Create a new ticket for a customer
export const createTicket = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'customer ticket create');
    const customerId = toBigIntOrNull(req.params.id);
    if (!customerId) {
      return res.status(400).json({ success: false, message: 'Invalid customer ID' });
    }

    const accessible = await ensureCustomerInScope(customerId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Customer not found in the selected context' });
    }

    const actorId = toBigIntSafe(req.user?.id);
    const { subject, description, status, assignedTo, createdBy, priority, metadata, branchId } = req.body;
    const normalized = normalizeTicketScope(scope, { branchId });
    const ticket = await prisma.customerTicket.create({
      data: {
        customerId,
        schoolId: normalized.schoolId,
        branchId: normalized.branchId,
        subject,
        description,
        status: status || 'OPEN',
        assignedTo: assignedTo ? toBigIntSafe(assignedTo) : null,
        createdBy: createdBy ? toBigIntSafe(createdBy) : actorId,
        updatedBy: actorId,
        priority: priority || 'NORMAL',
        metadata: sanitizeTicketMetadata(metadata)
      },
    });
    res.status(201).json({ success: true, data: convertBigInts(ticket) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to create customer ticket');
  }
};

// Get a specific ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket detail');
    const customerId = toBigIntOrNull(req.params.id);
    const ticketId = toBigIntOrNull(req.params.ticketId);
    if (!customerId || !ticketId) {
      return res.status(400).json({ success: false, message: 'Invalid customer or ticket ID' });
    }

    const [customerAccessible, ticketAccessible] = await Promise.all([
      ensureCustomerInScope(customerId, scope),
      ensureTicketInScope(ticketId, scope)
    ]);

    if (!customerAccessible || !ticketAccessible) {
      return res.status(404).json({ success: false, message: 'Ticket not found in the selected context' });
    }

    const ticket = await prisma.customerTicket.findFirst({
      where: applyScopeToWhere({ id: ticketId, customerId }, scope, { useCourse: false })
    });
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }
    res.json({ success: true, data: convertBigInts(ticket) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch ticket');
  }
};

// Update a ticket
export const updateTicket = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket update');
    const ticketId = toBigIntOrNull(req.params.ticketId);
    const customerId = toBigIntOrNull(req.params.id);
    if (!ticketId || !customerId) {
      return res.status(400).json({ success: false, message: 'Invalid customer or ticket ID' });
    }

    const [customerAccessible, ticketAccessible] = await Promise.all([
      ensureCustomerInScope(customerId, scope),
      ensureTicketInScope(ticketId, scope)
    ]);

    if (!customerAccessible || !ticketAccessible) {
      return res.status(404).json({ success: false, message: 'Ticket not found in the selected context' });
    }

    const { subject, description, status, assignedTo, priority, metadata, branchId } = req.body;
    const normalized = normalizeTicketScope(scope, { branchId });
    const actorId = toBigIntSafe(req.user?.id);
    const ticket = await prisma.customerTicket.update({
      where: { id: ticketId },
      data: {
        subject,
        description,
        status,
        assignedTo: assignedTo ? toBigIntSafe(assignedTo) : null,
        priority,
        metadata: sanitizeTicketMetadata(metadata),
        updatedAt: new Date(),
        updatedBy: actorId,
        branchId: normalized.branchId,
        schoolId: normalized.schoolId
      },
    });
    res.json({ success: true, data: convertBigInts(ticket) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update ticket');
  }
};

// Delete a ticket
export const deleteTicket = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket delete');
    const ticketId = toBigIntOrNull(req.params.ticketId);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
    }

    const accessible = await ensureTicketInScope(ticketId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Ticket not found in the selected context' });
    }

    await prisma.customerTicket.delete({
      where: { id: ticketId }
    });
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to delete ticket');
  }
};

// Assign a ticket
export const assignTicket = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket assign');
    const ticketId = toBigIntOrNull(req.params.ticketId);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
    }

    const accessible = await ensureTicketInScope(ticketId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Ticket not found in the selected context' });
    }

    const { assignedTo } = req.body;
    const actorId = toBigIntSafe(req.user?.id);
    const ticket = await prisma.customerTicket.update({
      where: { id: ticketId },
      data: {
        assignedTo: assignedTo ? toBigIntSafe(assignedTo) : null,
        updatedAt: new Date(),
        updatedBy: actorId
      }
    });
    res.json({ success: true, data: convertBigInts(ticket) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to assign ticket');
  }
};

// Resolve a ticket
export const resolveTicket = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket resolve');
    const ticketId = toBigIntOrNull(req.params.ticketId);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
    }

    const accessible = await ensureTicketInScope(ticketId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Ticket not found in the selected context' });
    }

    const actorId = toBigIntSafe(req.user?.id);
    const ticket = await prisma.customerTicket.update({
      where: { id: ticketId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: actorId
      }
    });
    res.json({ success: true, data: convertBigInts(ticket) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to resolve ticket');
  }
};

// Escalate a ticket
export const escalateTicket = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket escalate');
    const ticketId = toBigIntOrNull(req.params.ticketId);
    if (!ticketId) {
      return res.status(400).json({ success: false, message: 'Invalid ticket ID' });
    }

    const accessible = await ensureTicketInScope(ticketId, scope);
    if (!accessible) {
      return res.status(404).json({ success: false, message: 'Ticket not found in the selected context' });
    }

    const actorId = toBigIntSafe(req.user?.id);
    const ticket = await prisma.customerTicket.update({
      where: { id: ticketId },
      data: {
        status: 'ESCALATED',
        escalatedAt: new Date(),
        updatedAt: new Date(),
        updatedBy: actorId
      }
    });
    res.json({ success: true, data: convertBigInts(ticket) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to escalate ticket');
  }
};

// Get ticket dashboard (example: count by status)
export const getTicketDashboard = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket dashboard');
    const dashboard = await prisma.customerTicket.groupBy({
      by: ['status'],
      where: applyScopeToWhere({}, scope, { useCourse: false }),
      _count: { status: true }
    });
    res.json({ success: true, data: dashboard });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch ticket dashboard');
  }
};

// Get ticket analytics (example: count by priority)
export const getTicketAnalytics = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket analytics');
    const analytics = await prisma.customerTicket.groupBy({
      by: ['priority'],
      where: applyScopeToWhere({}, scope, { useCourse: false }),
      _count: { priority: true }
    });
    res.json({ success: true, data: analytics });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch ticket analytics');
  }
};

// Get SLA analytics (example: average resolution time)
export const getSLAAnalytics = async (req, res) => {
  try {
    const scope = await resolveScopeOrReject(req, 'ticket SLA analytics');
    const tickets = await prisma.customerTicket.findMany({
      where: applyScopeToWhere({ resolvedAt: { not: null } }, scope, { useCourse: false }),
      select: { createdAt: true, resolvedAt: true }
    });
    const times = tickets.map(t => (new Date(t.resolvedAt) - new Date(t.createdAt)) / 1000);
    const avgSeconds = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    res.json({ success: true, data: { averageResolutionSeconds: avgSeconds } });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch SLA analytics');
  }
}; 