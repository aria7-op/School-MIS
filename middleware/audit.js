import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const SENSITIVE_BODY_FIELDS = ['password', 'token', 'secret', 'key', 'apiKey', 'accessToken', 'refreshToken'];
const SENSITIVE_HEADER_FIELDS = ['authorization', 'cookie', 'x-api-key', 'x-access-token'];

const ensureAuditContext = (req) => {
  if (!req) return {};
  if (!req.auditContext) {
    req.auditContext = {
      startTime: Date.now()
    };
  } else if (!req.auditContext.startTime) {
    req.auditContext.startTime = Date.now();
  }
  return req.auditContext;
};

const toBigIntOrNull = (value) => {
  if (value === null || value === undefined) {
    return null;
  }
  try {
    return typeof value === 'bigint' ? value : BigInt(value);
  } catch {
    return null;
  }
};

const toBigIntOrDefault = (value, defaultValue = 0n) => {
  const converted = toBigIntOrNull(value);
  return converted === null ? defaultValue : converted;
};

const isPlainObject = (value) => {
  if (!value || typeof value !== 'object') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const normalizeSerializable = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return value.toString('utf-8');
  if (Array.isArray(value)) return value.map(normalizeSerializable);
  if (typeof value === 'object') {
    if (typeof value.toJSON === 'function') {
      try {
        return normalizeSerializable(value.toJSON());
      } catch {
        // fall through to plain conversion
      }
    }
    if (!isPlainObject(value)) {
      return normalizeSerializable(Object.assign({}, value));
    }

    const result = {};
    for (const [key, val] of Object.entries(value)) {
      if (val === undefined) continue;
      result[key] = normalizeSerializable(val);
    }
    return result;
  }
  return value;
};

const redactSensitiveKeys = (value, sensitiveKeys) => {
  if (!value || typeof value !== 'object') return value;

  const normalizedKeys = sensitiveKeys.map((key) => key.toLowerCase());

  const redactRecursive = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (normalizedKeys.includes(lowerKey)) {
        obj[key] = '[REDACTED]';
        continue;
      }
      if (Array.isArray(obj[key])) {
        obj[key].forEach((item) => redactRecursive(item));
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        redactRecursive(obj[key]);
      }
    }
  };

  redactRecursive(value);
  return value;
};

const parseResponsePayload = (data) => {
  if (data === undefined || data === null) return null;

  const tryParse = (input) => {
    if (typeof input !== 'string') return null;
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return null;
      }
    }
    return null;
  };

  if (Buffer.isBuffer(data)) {
    const asString = data.toString('utf-8');
    return tryParse(asString) ?? asString;
  }

  if (typeof data === 'string') {
    return tryParse(data) ?? data;
  }

  if (typeof data === 'object') {
    return normalizeSerializable(data);
  }

  return data;
};

const computeChanges = (before, after) => {
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object') return null;

  const diff = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    const previous = before[key];
    const current = after[key];
    if (JSON.stringify(previous) !== JSON.stringify(current)) {
      diff[key] = {
        from: previous,
        to: current
      };
    }
  }

  return Object.keys(diff).length > 0 ? diff : null;
};

const normalizeNewDataPayload = ({ newData, responseData, metadata, summary, changes }) => {
  const payload = {};
  if (newData !== null && newData !== undefined) {
    payload.data = newData;
  }
  if (responseData !== null && responseData !== undefined) {
    payload.response = responseData;
  }
  if (metadata && Object.keys(metadata).length > 0) {
    payload.metadata = metadata;
  }
  if (summary) {
    payload.summary = summary;
  }
  if (changes && Object.keys(changes).length > 0) {
    payload.changes = changes;
  }
  return Object.keys(payload).length > 0 ? payload : null;
};

const determineErrorMessage = (responseData, overrideMessage) => {
  if (overrideMessage) return overrideMessage;
  if (!responseData || typeof responseData !== 'object') return null;

  const possibleKeys = ['error', 'message', 'errorMessage', 'detail', 'reason'];
  for (const key of possibleKeys) {
    if (responseData[key]) {
      return typeof responseData[key] === 'string'
        ? responseData[key]
        : JSON.stringify(responseData[key]);
    }
  }
  return null;
};

const extractEntityId = (req, responseData, fallbackEntityId) => {
  if (fallbackEntityId) return fallbackEntityId;
  if (req?.auditContext?.entityId) return req.auditContext.entityId;
  if (req?.params?.id) return req.params.id;
  if (req?.params?.entityId) return req.params.entityId;
  if (req?.body?.id) return req.body.id;
  if (responseData?.data?.id) return responseData.data.id;
  if (responseData?.id) return responseData.id;
  return null;
};

const prepareAuditPayload = (req, res, action, resource, responseData) => {
  const context = ensureAuditContext(req);
  const normalizedResponse = normalizeSerializable(responseData);
  const sanitizedBody = sanitizeRequestBody(req.body);
  const sanitizedHeaders = sanitizeHeaders(req.headers);
  const sanitizedQuery = sanitizeRequestBody(req.query);

  const normalizedOldData = normalizeSerializable(context.oldData ?? context.before ?? null);
  const normalizedNewDataSource =
    context.newData ??
    context.after ??
    (normalizedResponse && typeof normalizedResponse === 'object'
      ? normalizedResponse.data ?? normalizedResponse.result ?? normalizedResponse.payload
      : null) ??
    sanitizedBody;
  const normalizedNewData = normalizeSerializable(normalizedNewDataSource);
  const normalizedMetadata = normalizeSerializable(context.metadata ?? null);
  const normalizedResponseContainer =
    normalizedResponse && typeof normalizedResponse === 'object'
      ? normalizedResponse
      : normalizedResponse !== null && normalizedResponse !== undefined
        ? { value: normalizedResponse }
        : null;

  const calculatedChanges = context.changes ?? computeChanges(normalizedOldData, normalizedNewData);

  const entityId = extractEntityId(req, normalizedResponse, context.entityId);
  const responseStatus = context.responseStatus ?? res?.statusCode ?? null;
  const isSuccess =
    context.isSuccess !== undefined
      ? Boolean(context.isSuccess)
      : responseStatus !== null
        ? responseStatus < 400
        : undefined;
  const errorMessage = determineErrorMessage(
    normalizedResponseContainer,
    context.errorMessage
  );

  const newDataPayload = normalizeNewDataPayload({
    newData: normalizedNewData,
    responseData: normalizedResponseContainer,
    metadata: normalizedMetadata,
    summary: context.summary,
    changes: calculatedChanges
  });

  return {
    action,
    entityType: resource,
    entityId: toBigIntOrDefault(entityId),
    oldData: normalizedOldData ? JSON.stringify(normalizedOldData) : null,
    newData: newDataPayload ? JSON.stringify(newDataPayload) : null,
    ipAddress: getRealClientIP(req),
    userAgent: req?.get?.('User-Agent') ?? req?.headers?.['user-agent'] ?? null,
    ownerId: toBigIntOrNull(context.ownerId ?? req?.user?.ownerId ?? (req?.user?.role === 'SUPER_ADMIN' ? req.user?.id : null)),
    schoolId: toBigIntOrNull(context.schoolId ?? req?.user?.schoolId),
    branchId: toBigIntOrNull(context.branchId ?? req?.user?.branchId),
    customerId: toBigIntOrNull(context.customerId ?? req?.user?.customerId),
    userId: toBigIntOrNull(context.userId ?? req?.user?.id),
    requestMethod: req?.method ?? null,
    requestPath: req?.path ? req.path.slice(0, 255) : null,
    requestUrl: req?.originalUrl ? req.originalUrl.slice(0, 512) : null,
    requestHeaders: sanitizedHeaders,
    requestQuery: sanitizedQuery,
    requestBody: sanitizedBody,
    responseStatus,
    responseTimeMs: context.startTime ? Date.now() - context.startTime : null,
    isSuccess,
    errorMessage,
    correlationId:
      context.correlationId ??
      req?.headers?.['x-request-id'] ??
      req?.headers?.['x-correlation-id'] ??
      req?.id ??
      null,
    traceId:
      context.traceId ??
      req?.headers?.['x-trace-id'] ??
      req?.headers?.['x-b3-traceid'] ??
      req?.headers?.['traceparent'] ??
      null
  };
};

const persistAuditLog = async (req, res, action, resource, responseData) => {
  try {
    const payload = prepareAuditPayload(req, res, action, resource, responseData);
    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined)
    );

    await prisma.auditLog.create({
      data: sanitizedPayload
    });
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
  }
};

// ======================
// HELPER: Get Real Client IP
// ======================

/**
 * Get the real client IP address from request
 * Handles proxy headers like X-Forwarded-For, X-Real-IP
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
const getRealClientIP = (req) => {
  // Try X-Forwarded-For header (most common for proxies)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
    // The first one is the real client IP
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Try X-Real-IP header (nginx)
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }
  
  // Try CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) {
    return cfIP;
  }
  
  // Fall back to req.ip (remove IPv6 prefix if present)
  let ip = req.ip || req.connection?.remoteAddress || 'Unknown';
  
  // Convert IPv6-mapped IPv4 addresses (::ffff:192.168.1.1) to IPv4 (192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  
  return ip;
};

// ======================
// AUDIT LOGGING MIDDLEWARE
// ======================

/**
 * Audit log middleware for tracking operations
 * @param {string} action - The action being performed (CREATE, UPDATE, DELETE, etc.)
 * @param {string} resource - The resource being affected (Class, Student, etc.)
 * @returns {Function} Express middleware function
 */
export const auditLog = (action, resource) => {
  return (req, res, next) => {
    const context = ensureAuditContext(req);
    context.action = action;
    context.entityType = resource;

    const originalSend = res.send.bind(res);
    const originalEnd = res.end.bind(res);

    const schedulePersist = (body) => {
      context._logged = true;
      const responsePayload = parseResponsePayload(body);
      Promise.resolve(persistAuditLog(req, res, action, resource, responsePayload)).catch((error) =>
        console.error('Audit log persistence error:', error)
      );
    };

    res.send = function overrideSend(body) {
      schedulePersist(body);
      return originalSend(body);
    };

    res.end = function overrideEnd(chunk, encoding, callback) {
      if (!context._logged) {
        schedulePersist(chunk);
      }
      return originalEnd.apply(this, arguments);
    };

    next();
  };
};


/**
 * Create audit log entry
 * @param {Object} req - Express request object
 * @param {string} action - The action performed
 * @param {string} resource - The resource affected
 * @param {Object} responseData - The response data
 */
export const createAuditLog = async (req, action, resource, responseData) => {
  const context = ensureAuditContext(req);
  context._logged = true;
  await persistAuditLog(req, null, action, resource, responseData);
};

/**
 * Create audit log entry
 * @param {Object} req - Express request object
 * @param {string} action - The action performed
 * @param {string} resource - The resource affected
 * @param {Object} responseData - The response data
 */
export const createAuditLogEntry = createAuditLog;

/**
 * Extract resource ID from request or response
 * @param {Object} req - Express request object
 * @param {Object} responseData - Response data
 * @returns {string|null} Resource ID
 */
const extractResourceId = (req, responseData) => {
  // Try to get ID from URL params first
  if (req.params.id) {
    return req.params.id;
  }
  
  // Try to get ID from response data
  if (responseData?.data?.id) {
    return responseData.data.id;
  }
  
  // Try to get ID from request body
  if (req.body?.id) {
    return req.body.id;
  }
  
  return null;
};

/**
 * Sanitize request body to remove sensitive information
 * @param {Object} body - Request body
 * @returns {Object} Sanitized body
 */
const sanitizeRequestBody = (body) => {
  if (body === null || body === undefined) return null;

  const normalized = normalizeSerializable(body);
  if (normalized === null || typeof normalized !== 'object') {
    return normalized;
  }

  const cloned = JSON.parse(JSON.stringify(normalized));
  return redactSensitiveKeys(cloned, SENSITIVE_BODY_FIELDS);
};

/**
 * Sanitize headers to remove sensitive information
 * @param {Object} headers - Request headers
 * @returns {Object} Sanitized headers
 */
const sanitizeHeaders = (headers) => {
  if (!headers) return null;

  const normalized = normalizeSerializable(headers);
  if (normalized === null || typeof normalized !== 'object') {
    return normalized;
  }

  const cloned = {};
  for (const [key, value] of Object.entries(normalized)) {
    cloned[key.toLowerCase()] = value;
  }

  return redactSensitiveKeys(cloned, SENSITIVE_HEADER_FIELDS);
};

/**
 * Get audit logs with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Object} Audit logs and pagination info
 */
export const getAuditLogs = async (filters = {}, pagination = {}) => {
  try {
    const where = {};

    if (filters.schoolId) where.schoolId = toBigIntOrNull(filters.schoolId);
    if (filters.ownerId) where.ownerId = toBigIntOrNull(filters.ownerId);
    if (filters.userId) where.userId = toBigIntOrNull(filters.userId);
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = toBigIntOrDefault(filters.entityId);
    if (filters.requestMethod) where.requestMethod = filters.requestMethod;
    if (filters.responseStatus !== undefined) {
      const parsedStatus = Number(filters.responseStatus);
      if (!Number.isNaN(parsedStatus)) {
        where.responseStatus = parsedStatus;
      }
    }
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;
    if (filters.correlationId) where.correlationId = filters.correlationId;
    if (filters.isSuccess !== undefined) {
      if (typeof filters.isSuccess === 'string') {
        const normalized = filters.isSuccess.toLowerCase();
        if (normalized === 'true') where.isSuccess = true;
        if (normalized === 'false') where.isSuccess = false;
      } else {
        where.isSuccess = Boolean(filters.isSuccess);
      }
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const page = Number(pagination.page ?? 1);
    const limit = Number(pagination.limit ?? 50);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where })
    ]);

    const normalizedLogs = logs.map((log) => normalizeSerializable(log));

    return {
      data: normalizedLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    console.error('Failed to get audit logs:', error);
    throw error;
  }
};

/**
 * Clean up old audit logs
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {number} Number of deleted logs
 */
export const cleanupAuditLogs = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate
        }
      }
    });
    
    return result.count;
    
  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    throw error;
  }
};

export const setAuditContext = (req, context = {}) => {
  const auditContext = ensureAuditContext(req);
  if (!context || typeof context !== 'object') {
    return auditContext;
  }

  if (context.before !== undefined) auditContext.before = context.before;
  if (context.after !== undefined) auditContext.after = context.after;
  if (context.oldData !== undefined) auditContext.oldData = context.oldData;
  if (context.newData !== undefined) auditContext.newData = context.newData;
  if (context.changes !== undefined) auditContext.changes = context.changes;
  if (context.entityId !== undefined) auditContext.entityId = context.entityId;
  if (context.summary !== undefined) auditContext.summary = context.summary;
  if (context.metadata !== undefined) auditContext.metadata = {
    ...(auditContext.metadata || {}),
    ...context.metadata
  };
  if (context.correlationId !== undefined) auditContext.correlationId = context.correlationId;
  if (context.traceId !== undefined) auditContext.traceId = context.traceId;
  if (context.responseStatus !== undefined) auditContext.responseStatus = context.responseStatus;
  if (context.isSuccess !== undefined) auditContext.isSuccess = context.isSuccess;
  if (context.errorMessage !== undefined) auditContext.errorMessage = context.errorMessage;
  if (context.branchId !== undefined) auditContext.branchId = context.branchId;
  if (context.schoolId !== undefined) auditContext.schoolId = context.schoolId;
  if (context.ownerId !== undefined) auditContext.ownerId = context.ownerId;
  if (context.customerId !== undefined) auditContext.customerId = context.customerId;
  if (context.userId !== undefined) auditContext.userId = context.userId;

  return auditContext;
};

export const appendAuditMetadata = (req, metadata = {}) => {
  if (!metadata || typeof metadata !== 'object') return ensureAuditContext(req).metadata;
  const auditContext = ensureAuditContext(req);
  auditContext.metadata = {
    ...(auditContext.metadata || {}),
    ...metadata
  };
  return auditContext.metadata;
};

// Export all available functions
export default {
  auditLog,
  createAuditLogEntry,
  getAuditLogs,
  createAuditLog,
  cleanupAuditLogs,
  setAuditContext,
  appendAuditMetadata
};