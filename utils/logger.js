const isDevelopment = process.env.NODE_ENV !== 'production';

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-csrf-token',
  'password',
  'token',
  'secret',
  'access_token',
  'refresh_token'
];

const sanitizeValue = (key, value) => {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (typeof value === 'string') {
    if (SENSITIVE_KEYS.includes(key?.toLowerCase())) {
      return '[REDACTED]';
    }
    if (value.length > 256) {
      return `${value.substring(0, 32)}...[truncated]`;
    }
    return value;
  }

  return value;
};

const sanitizeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') {
    return meta;
  }

  try {
    return JSON.parse(
      JSON.stringify(meta, (key, value) => sanitizeValue(key, value))
    );
  } catch {
    return meta;
  }
};

const maskError = (error) => {
  if (!error) {
    return undefined;
  }

  const base = {
    message: error.message,
    name: error.name,
  };

  if (isDevelopment && error.stack) {
    base.stack = error.stack;
  }

  return base;
};

const emitLog = (level, message, meta = {}) => {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    ...sanitizeMeta(meta),
  };

  const serialized = JSON.stringify(payload);

  switch (level) {
    case 'error':
      console.error(serialized);
      break;
    case 'warn':
      console.warn(serialized);
      break;
    case 'debug':
      if (isDevelopment) {
        console.debug(serialized);
      }
      break;
    default:
      console.info(serialized);
  }
};

export const logger = {
  debug(message, meta) {
    emitLog('debug', message, meta);
  },
  info(message, meta) {
    emitLog('info', message, meta);
  },
  warn(message, meta) {
    emitLog('warn', message, meta);
  },
  error(message, error, meta) {
    emitLog('error', message, {
      ...meta,
      error: maskError(error),
    });
  },
  anomaly(event, meta) {
    emitLog('warn', `ANOMALY:${event}`, { anomaly: true, ...meta });
  },
  /**
   * Log security events with structured metadata for dashboards
   */
  securityEvent(eventType, outcome, meta = {}) {
    const payload = {
      eventType,
      outcome, // 'success', 'failure', 'blocked', 'quarantine'
      severity: meta.severity || 'medium', // 'low', 'medium', 'high', 'critical'
      ...sanitizeMeta(meta),
    };
    emitLog('warn', `SECURITY:${eventType}`, {
      security: true,
      ...payload,
    });
  },
  /**
   * Log file upload events with comprehensive metadata
   */
  uploadEvent(outcome, meta = {}) {
    const payload = {
      outcome, // 'success', 'rejected', 'quarantine', 'scan_failed'
      fileSize: meta.fileSize,
      mimeType: meta.mimeType,
      filename: meta.filename,
      sha256: meta.sha256,
      userId: meta.userId,
      schoolId: meta.schoolId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      scanResult: meta.scanResult,
      rejectionReason: meta.rejectionReason,
    };
    emitLog('info', `UPLOAD:${outcome}`, {
      security: true,
      ...sanitizeMeta(payload),
    });
  },
  /**
   * Log file download/view events
   */
  downloadEvent(outcome, meta = {}) {
    const payload = {
      outcome, // 'success', 'denied', 'not_found', 'unauthorized'
      fileId: meta.fileId,
      filePath: meta.filePath,
      userId: meta.userId,
      schoolId: meta.schoolId,
      ip: meta.ip,
      userAgent: meta.userAgent,
      reason: meta.reason,
    };
    emitLog('info', `DOWNLOAD:${outcome}`, {
      security: true,
      ...sanitizeMeta(payload),
    });
  },
  /**
   * Log messaging events (sends, rate limits, anomalies)
   */
  messageEvent(eventType, outcome, meta = {}) {
    const payload = {
      eventType, // 'send', 'rate_limit', 'bulk_send', 'unauthorized'
      outcome, // 'success', 'blocked', 'rate_limited', 'failed'
      messageId: meta.messageId,
      conversationId: meta.conversationId,
      senderId: meta.senderId,
      receiverId: meta.receiverId,
      schoolId: meta.schoolId,
      role: meta.role,
      messageCount: meta.messageCount,
      ip: meta.ip,
      userAgent: meta.userAgent,
      reason: meta.reason,
    };
    emitLog('info', `MESSAGE:${eventType}:${outcome}`, {
      security: true,
      ...sanitizeMeta(payload),
    });
  },
  /**
   * Log rate limit violations
   */
  rateLimitEvent(limitType, meta = {}) {
    const payload = {
      limitType, // 'auth', 'upload', 'socket', 'api', 'message'
      userId: meta.userId,
      ip: meta.ip,
      endpoint: meta.endpoint,
      attempts: meta.attempts,
      window: meta.window,
      userAgent: meta.userAgent,
    };
    emitLog('warn', `RATE_LIMIT:${limitType}`, {
      security: true,
      anomaly: true,
      ...sanitizeMeta(payload),
    });
  },
};

export const maskHeaders = (headers = {}) => {
  const sanitized = {};
  Object.keys(headers || {}).forEach((key) => {
    sanitized[key] = sanitizeValue(key, headers[key]);
  });
  return sanitized;
};

export default logger;









