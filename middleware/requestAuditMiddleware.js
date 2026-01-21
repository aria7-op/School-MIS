import { PrismaClient } from '../generated/prisma/index.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

const DEFAULT_IGNORED_PATTERNS = [
  /^\/socket\.io/i,
  /^\/uploads/i,
  /^\/favicon\.ico$/i,
  /^\/static\//i,
  /^\/assets\//i,
  /^\/health/i,
  /^\/_next\//i
];

const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-access-token'];
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'apiKey', 'accessToken', 'refreshToken'];

const toSafeJson = (value) => {
  try {
    if (value === undefined) return null;
    if (value === null) return null;
    if (typeof value === 'string') {
      if (!value.trim()) return null;
      return JSON.parse(value);
    }
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return null;
  }
};

const sanitizeObject = (input) => {
  if (!input || typeof input !== 'object') return null;
  
  // CRITICAL: Use JSON.parse/stringify for deep clone to prevent mutating original nested objects
  // This ensures that when we redact sensitive fields, we don't modify the original req.body
  let clone;
  try {
    clone = JSON.parse(JSON.stringify(input));
  } catch (error) {
    // Fallback to shallow clone if JSON serialization fails (e.g., circular references)
    clone = Array.isArray(input) ? [...input] : { ...input };
  }

  const scrub = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach((key) => {
      const value = obj[key];
      if (value === undefined) {
        delete obj[key];
        return;
      }

      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some((sensitiveKey) => lowerKey.includes(sensitiveKey.toLowerCase()))) {
        obj[key] = '[REDACTED]';
        return;
      }

      if (value && typeof value === 'object') {
        scrub(value);
      } else if (typeof value === 'string' && value.length > 2000) {
        obj[key] = `${value.slice(0, 2000)}…`;
      }
    });
  };

  scrub(clone);
  return clone;
};

const sanitizeHeaders = (headers = {}) => {
  const sanitized = {};
  Object.keys(headers).forEach((key) => {
    if (!headers[key]) return;
    if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = headers[key];
    }
  });
  return sanitized;
};

const getRealClientIP = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    if (ips.length > 0) return ips[0];
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) return realIP;

  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) return cfIP;

  let ip = req.ip || req.connection?.remoteAddress || 'Unknown';
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  return ip;
};

const tryParseBigInt = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed || !/^-?\d+$/.test(trimmed)) return null;
    try {
      return BigInt(trimmed);
    } catch {
      return null;
    }
  }
  return null;
};

const extractEntityId = (req, responsePayload) => {
  if (req.params?.id) return req.params.id;
  if (req.query?.id) return req.query.id;
  if (req.body?.id) return req.body.id;

  if (responsePayload?.data?.id) return responsePayload.data.id;
  if (Array.isArray(responsePayload?.data) && responsePayload.data[0]?.id) {
    return responsePayload.data[0].id;
  }

  return '0';
};

const shouldSkipAudit = (req, options) => {
  const { ignorePatterns = [], ignoreMethods = ['OPTIONS', 'HEAD'] } = options;

  if (ignoreMethods.includes(req.method.toUpperCase())) return true;

  const allPatterns = [...DEFAULT_IGNORED_PATTERNS, ...ignorePatterns];
  return allPatterns.some((pattern) => pattern.test(req.path));
};

export const requestAuditMiddleware = (options = {}) => {
  const mergedOptions = {
    ignorePatterns: options.ignorePatterns || [],
    ignoreMethods: options.ignoreMethods || ['OPTIONS', 'HEAD'],
    captureResponseBody: options.captureResponseBody !== false,
    actorResolver: options.actorResolver
  };

  return (req, res, next) => {
    if (req.headers['x-audit-ignore'] === 'true' || shouldSkipAudit(req, mergedOptions)) {
      return next();
    }

    const startTime = process.hrtime.bigint();
    const correlationId =
      req.headers['x-request-id'] ||
      req.headers['x-correlation-id'] ||
      crypto.randomUUID();

    res.locals.correlationId = correlationId;

    const sanitizedHeaders = sanitizeHeaders(req.headers);
    const sanitizedBody = sanitizeObject(req.body);
    const sanitizedQuery = sanitizeObject(req.query);

    let responsePayload = null;
    let responseCaptured = false;

    if (mergedOptions.captureResponseBody) {
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      res.json = function jsonInterceptor(body) {
        responsePayload = body;
        responseCaptured = true;
        return originalJson(body);
      };

      res.send = function sendInterceptor(body) {
        if (!responseCaptured) {
          responsePayload = toSafeJson(body) ?? body;
        }
        return originalSend(body);
      };
    }

    res.on('finish', async () => {
      try {
        const durationNs = process.hrtime.bigint() - startTime;
        const durationMs = Number(durationNs) / 1_000_000;
        const statusCode = res.statusCode;
        const success = statusCode < 400;

        const errorMessage =
          res.locals.auditErrorMessage ||
          res.locals.errorMessage ||
          (typeof responsePayload === 'object' && responsePayload !== null && !Array.isArray(responsePayload)
            ? responsePayload.error || responsePayload.message || null
            : null);

        const entityType =
          req.route?.path ||
          req.baseUrl ||
          req.path ||
          req.originalUrl ||
          'UNKNOWN';

        const entityId = extractEntityId(req, responsePayload);

        let userId = req.user?.id || null;
        let ownerId = null;
        if (req.user?.role === 'SUPER_ADMIN') {
          ownerId = req.user.id;
        }

        let schoolId = req.user?.schoolId || null;

        if (typeof mergedOptions.actorResolver === 'function') {
          const actorData = mergedOptions.actorResolver(req);
          if (actorData) {
            userId = actorData.userId ?? userId;
            ownerId = actorData.ownerId ?? ownerId;
            schoolId = actorData.schoolId ?? schoolId;
          }
        }

        const entityIdValue = tryParseBigInt(entityId) ?? BigInt(0);
        const userIdValue = tryParseBigInt(userId);
        const ownerIdValue = tryParseBigInt(ownerId);
        const schoolIdValue = tryParseBigInt(schoolId);

        await prisma.auditLog.create({
          data: {
            action: `${req.method}_${success ? 'SUCCESS' : 'ERROR'}`,
            entityType: entityType.slice(0, 50),
            entityId: entityIdValue,
            ipAddress: getRealClientIP(req),
            userAgent: req.get('User-Agent'),
            ownerId: ownerIdValue,
            schoolId: schoolIdValue,
            userId: userIdValue,
            requestMethod: req.method,
            requestPath: req.path?.slice(0, 255) || null,
            requestUrl: req.originalUrl?.slice(0, 512) || null,
            requestHeaders: sanitizedHeaders ? sanitizeObject(sanitizedHeaders) : null,
            requestQuery: sanitizedQuery,
            requestBody: sanitizedBody,
            responseStatus: statusCode,
            responseTimeMs: Math.round(durationMs),
            isSuccess: success,
            errorMessage: errorMessage ? String(errorMessage).slice(0, 2000) : null,
            correlationId,
            traceId: correlationId,
            newData: sanitizedBody ? JSON.stringify(sanitizedBody) : null
          }
        });
      } catch (error) {
        console.error('Failed to persist request audit log:', error);
      }
    });

    next();
  };
};

export default requestAuditMiddleware;

