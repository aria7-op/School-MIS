import crypto from 'crypto';
import { parseCookies } from '../utils/cookie.js';
import { ACCESS_TOKEN_COOKIE } from './auth.js';

export const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_CANDIDATES = ['x-csrf-token', 'x-xsrf-token'];
const CSRF_COOKIE_MAX_AGE = 60 * 60 * 24 * 7 * 1000; // 7 days
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
const isProduction = process.env.NODE_ENV === 'production';
const resolveSameSite = () => {
  const envValue = process.env.CSRF_SAMESITE?.toLowerCase?.();
  if (envValue === 'none' || envValue === 'lax' || envValue === 'strict') {
    return envValue;
  }
  return isProduction ? 'none' : 'lax';
};

const SAME_SITE_POLICY = resolveSameSite();
const SECURE_ONLY = SAME_SITE_POLICY === 'none' ? true : isProduction;

const buildCookieOptions = () => ({
  httpOnly: false,
  secure: SECURE_ONLY,
  sameSite: SAME_SITE_POLICY,
  path: '/',
  maxAge: CSRF_COOKIE_MAX_AGE,
});

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

export const csrfTokenMiddleware = (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers?.cookie || '');
    let token = cookies[CSRF_COOKIE_NAME];

    if (!token || typeof token !== 'string') {
      token = createCsrfToken();
      res.cookie(CSRF_COOKIE_NAME, token, buildCookieOptions());
    }

    if (!token) {
      throw new Error('Unable to establish CSRF token');
    }

    res.locals.csrfToken = token;
    res.setHeader('X-CSRF-Token', token);
    return next();
  } catch (error) {
    console.error('Failed to establish CSRF token', error);
    return res.status(500).json({
      success: false,
      error: 'CSRF_INIT_FAILED',
      message: 'Failed to initialize CSRF protection',
    });
  }
};

const CSRF_EXEMPT_PATHS = new Set([
  '/api/csrf-token',
  '/api/attendances/mark-in-time',
  '/api/attendances/mark-out-time',
]);

const shouldSkipCsrf = (req) => {
  if (!req || !req.path) {
    return false;
  }

  if (CSRF_EXEMPT_PATHS.has(req.path)) {
    return true;
  }

  const cookies = parseCookies(req.headers?.cookie || '');
  const hasSessionCookie = Boolean(cookies[ACCESS_TOKEN_COOKIE]);

  if (SAFE_METHODS.has(req.method) && !hasSessionCookie) {
    return true;
  }

  return false;
};

const extractHeaderToken = (req) => {
  for (const name of CSRF_HEADER_CANDIDATES) {
    const token = req.headers?.[name];
    if (token && typeof token === 'string') {
      return token;
    }
  }
  return null;
};

export const csrfProtectionMiddleware = (req, res, next) => {
  if (shouldSkipCsrf(req)) {
    return next();
  }

  const cookies = parseCookies(req.headers?.cookie || '');
  const cookieToken = cookies[CSRF_COOKIE_NAME];
  const headerToken = extractHeaderToken(req);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      error: 'CSRF token mismatch',
      message: 'Request blocked due to missing or invalid CSRF token.',
    });
  }

  return next();
};

export const rotateCsrfToken = (res) => {
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, buildCookieOptions());
  res.setHeader('X-CSRF-Token', token);
  return token;
};

