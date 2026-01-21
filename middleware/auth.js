import jwt from 'jsonwebtoken';
import prisma from '../utils/prismaClient.js';
import { Prisma } from '../generated/prisma/index.js';
import { auditLog as auditLogMiddleware } from './audit.js';
import { setRequestContext } from '../utils/requestContext.js';
import { default as ownersStore } from '../store/ownersStore.js';
import { getTenantContextForSchool } from '../services/subscriptionService.js';
import { parseCookies } from '../utils/cookie.js';
import { logger, maskHeaders } from '../utils/logger.js';

const logError = (message, error, meta) => {
  logger.error(message, error, meta);
};

const JWT_SECRET = (() => {
  const value = process.env.JWT_SECRET;
  if (!value) {
    console.warn('JWT_SECRET not found, using default for development');
    return 'default-jwt-secret-for-development-only';
  }
  return value;
})();

const PLATFORM_ADMIN_ROLES = ['SUPER_ADMIN', 'SUPER_DUPER_ADMIN'];
const isPlatformAdmin = (role) => PLATFORM_ADMIN_ROLES.includes(role);

const CONTEXT_OVERRIDE_ROLES = new Set([
  'SUPER_DUPER_ADMIN',
  'SUPER_ADMIN',
  'OWNER',
  'SCHOOL_ADMIN',
  'TEACHER',
  'BRANCH_MANAGER'
]);

const parseOptionalId = (value) => {
  if (value === undefined || value === null) return null;
  const trimmed = typeof value === 'string' ? value.trim() : value;
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
  try {
    return typeof trimmed === 'bigint' ? trimmed : BigInt(trimmed);
  } catch (error) {
    return null;
  }
};

const toBigIntOrNull = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'bigint') return value;
  try {
    return BigInt(value);
  } catch (error) {
    return null;
  }
};

const normalizeForLog = (value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (Array.isArray(value)) {
    return value.map(normalizeForLog);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, normalizeForLog(val)])
    );
  }
  return value;
};

const readContextHeaders = (req) => {
  const headers = req.headers || {};
  return {
    schoolId:
      headers['x-managed-school-id'] ??
      headers['x-school-id'] ??
      headers['x-school'] ??
      headers['school-id'],
    branchId:
      headers['x-managed-branch-id'] ??
      headers['x-branch-id'] ??
      headers['branch-id'],
    courseId:
      headers['x-managed-course-id'] ??
      headers['x-course-id'] ??
      headers['course-id']
  };
};

export const ACCESS_TOKEN_COOKIE = 'accessToken';

const extractBearerToken = (headerValue) => {
  if (!headerValue) return null;
  const parts = headerValue.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
};

const resolveTokenFromRequest = (req) => {
  const authHeaderToken = extractBearerToken(req.headers?.authorization);
  if (authHeaderToken) {
    return authHeaderToken;
  }

  const cookiesHeader = req.headers?.cookie;
  if (typeof cookiesHeader === 'string' && cookiesHeader.length > 0) {
    const cookies = parseCookies(cookiesHeader);
    if (cookies[ACCESS_TOKEN_COOKIE]) {
      return cookies[ACCESS_TOKEN_COOKIE];
    }
  }

  return null;
};

// ======================
// AUTHENTICATION MIDDLEWARE
// ======================

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = async (req, res, next) => {
logger.debug('authenticateToken:start', {
  method: req.method,
  path: req.path,
  ip: req.ip,
  forwardedFor: req.headers['x-forwarded-for'],
  userAgent: req.headers['user-agent'],
  origin: req.headers['origin'],
  referer: req.headers['referer'],
  headers: maskHeaders(req.headers),
});
  
  // PUBLIC ENDPOINTS - Skip authentication for these attendance endpoints
  // Check both req.path (relative) and req.originalUrl (full path)
  const publicPathPatterns = [
    '/api/attendances/mark-in-time',
    '/api/attendances/mark-out-time',
    '/api/attendances/time-status',
    '/api/attendances/test',
    '/api/attendances/debug-public',
    '/attendances/mark-in-time',
    '/attendances/mark-out-time',
    '/attendances/time-status',
    '/attendances/test',
    '/attendances/debug-public',
    '/mark-in-time',
    '/mark-out-time',
    '/time-status',
    '/test',
    '/debug-public'
  ];
  
  // Get the path from various sources
  const fullPath = (req.originalUrl || req.url || req.path || '').split('?')[0];
  const relativePath = req.path || '';
  
  // Check if any public path pattern matches
  const isPublicPath = publicPathPatterns.some(pattern => {
    // Exact match
    if (fullPath === pattern || relativePath === pattern) return true;
    // Ends with pattern
    if (fullPath.endsWith(pattern) || relativePath.endsWith(pattern)) return true;
    // Contains pattern (for sub-paths)
    if (fullPath.includes(pattern) || relativePath.includes(pattern)) return true;
    return false;
  });
  
  if (isPublicPath) {
    logger.debug('authenticateToken:public-skip', { 
      fullPath, 
      reqPath: req.path, 
      originalUrl: req.originalUrl,
      url: req.url,
      matched: true
    });
    return next();
  }
  
  logger.debug('authenticateToken:protected', { 
    fullPath, 
    reqPath: req.path, 
    originalUrl: req.originalUrl,
    url: req.url
  });
  
  const token = resolveTokenFromRequest(req);

logger.debug('authenticateToken:token-status', { hasToken: Boolean(token) });

  if (!token) {
    logger.warn('authenticateToken:no-token', {
      path: req.path,
      ip: req.ip,
    });
    return res.status(401).json({
      success: false,
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    logger.debug('authenticateToken:verifying-token');
    const decoded = jwt.verify(token, JWT_SECRET);
    logger.debug('authenticateToken:token-verified', {
      userId: decoded.userId,
      role: decoded.role,
    });
    
    // Check if this is an owner token or SUPER_ADMIN user
    if (decoded.role === 'SUPER_ADMIN' && decoded.ownerId) {
      // This is a SUPER_ADMIN user with ownerId
      logger.debug('authenticateToken:fetch-owner');
      try {
        const owner = await prisma.owner.findUnique({
          where: { id: BigInt(decoded.ownerId) },
          include: {
            schools: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        });
        
        if (owner) {
          logger.debug(
            'authenticateToken:owner-found',
            normalizeForLog({
              ownerId: owner.id,
              ownerName: owner.name,
            })
          );
          // Set owner properties for compatibility
          req.user = {
            ...owner,
            role: 'SUPER_ADMIN',
            type: 'owner',
            schoolIds: owner.schools.map(school => school.id),
            schoolId: owner.schools.length > 0 ? owner.schools[0].id : null
          };
          req.user.isOwner = true;
          req.user.isSuperAdmin = true;
          req.tenantId = null;
          req.subscription = null;
          req.subscriptionFeatures = {};
          req.subscriptionLimits = {};
          req.package = null;
          logger.debug('authenticateToken:end-owner');
          return next();
        }
      } catch (error) {
        logger.error('authenticateToken:owner-db-error', error);
        return res.status(500).json({
          success: false,
          error: 'Authentication error',
          message: 'Database error during owner authentication'
        });
      }
    }
    
    // For all other cases (including TEACHER, SCHOOL_ADMIN, etc.), fetch user from users table
    logger.debug('authenticateToken:fetch-user');
    try {
      const user = await prisma.user.findUnique({
        where: { id: BigInt(decoded.userId) },
        // Minimal fields only; legacy DB is missing several Prisma columns
        select: {
          id: true,
          uuid: true,
          username: true,
          phone: true,
          password: true,
          salt: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          timezone: true,
          locale: true,
          schoolId: true
        }
      });
      
      if (!user) {
        logger.warn('authenticateToken:user-not-found', {
          userId: decoded.userId,
        });
        return res.status(401).json({
          success: false,
          error: 'Access denied',
          message: 'User not found'
        });
      }

      logger.debug(
        'authenticateToken:user-found',
        normalizeForLog({
          userId: user.id,
          username: user.username,
          role: user.role,
        })
      );
      
      // Ensure schoolId is properly set
      req.user = {
        ...user,
        schoolId: user.schoolId || (user.school ? user.school.id : null),
        role: decoded.role || user.role
      };
      req.user.isSuperDuperAdmin = req.user.role === 'SUPER_DUPER_ADMIN';
      req.user.isSuperAdmin = req.user.role === 'SUPER_ADMIN';

      // Managed context override (school / branch / course) -------------------
      const { schoolId: headerSchoolId, branchId: headerBranchId, courseId: headerCourseId } = readContextHeaders(req);
      const requestedSchoolId = parseOptionalId(headerSchoolId);
      const requestedBranchId = parseOptionalId(headerBranchId);
      const requestedCourseId = parseOptionalId(headerCourseId);

      const userIdBigInt = toBigIntOrNull(req.user.id);
      const userDefaultSchoolId = toBigIntOrNull(req.user.schoolId);
      const canOverrideSchool = CONTEXT_OVERRIDE_ROLES.has(req.user.role);

      let activeSchoolId = userDefaultSchoolId;
      let activeBranchId = null;
      let activeCourseId = null;

      const ensureSchoolExists = async (schoolId) => {
        if (!schoolId) return null;
        const school = await prisma.school.findUnique({
          where: { id: schoolId },
          select: { id: true }
        });
        return school ? school.id : null;
      };

      const ensureBranchAccess = async (branchId, schoolId) => {
        if (!branchId) return null;
        const branch = await prisma.branch.findUnique({
          where: { id: branchId },
          select: { id: true, schoolId: true, status: true }
        });
        if (!branch) {
          throw {
            status: 404,
            message: 'Branch not found',
            code: 'BRANCH_NOT_FOUND'
          };
        }
        if (schoolId && branch.schoolId !== schoolId) {
          throw {
            status: 400,
            message: 'Branch does not belong to selected school',
            code: 'BRANCH_SCHOOL_MISMATCH'
          };
        }
        if (CONTEXT_OVERRIDE_ROLES.has(req.user.role)) {
          return branch.id;
        }
        if (!userIdBigInt) {
          throw {
            status: 403,
            message: 'Unable to resolve user for branch context',
            code: 'BRANCH_CONTEXT_USER_MISSING'
          };
        }
        const assignment = await prisma.branchManagerAssignment.findFirst({
          where: {
            userId: userIdBigInt,
            branchId,
            revokedAt: null
          },
          select: { id: true }
        });
        if (!assignment) {
          throw {
            status: 403,
            message: 'You are not assigned to this branch',
            code: 'BRANCH_ACCESS_DENIED'
          };
        }
        return branch.id;
      };

      const ensureCourseAccess = async (courseId, schoolId, branchId) => {
        if (!courseId) return null;

        const fetchCourseContext = async () => {
          try {
            return await prisma.course.findUnique({
              where: { id: courseId },
              select: {
                id: true,
                schoolId: true,
                branchId: true,
                branch: {
                  select: { id: true }
                }
              }
            });
          } catch (error) {
            if (
              error instanceof Prisma.PrismaClientValidationError &&
              error.message.includes('Unknown field `branchId`')
            ) {
              return await prisma.course.findUnique({
                where: { id: courseId },
                select: {
                  id: true,
                  schoolId: true,
                  branch: {
                    select: { id: true }
                  }
                }
              });
            }
            throw error;
          }
        };

        const course = await fetchCourseContext();

        if (!course) {
          throw {
            status: 404,
            message: 'Course not found',
            code: 'COURSE_NOT_FOUND'
          };
        }

        const resolvedBranchId =
          (typeof course.branchId !== 'undefined' ? course.branchId : undefined) ??
          course.branch?.id ??
          null;

        if (schoolId && course.schoolId !== schoolId) {
          throw {
            status: 400,
            message: 'Course does not belong to selected school',
            code: 'COURSE_SCHOOL_MISMATCH'
          };
        }
        if (branchId && resolvedBranchId && branchId !== resolvedBranchId) {
          throw {
            status: 400,
            message: 'Course does not belong to selected branch',
            code: 'COURSE_BRANCH_MISMATCH'
          };
        }

        // Enforce course assignment for most roles, but allow PARENT to access without being a course manager
        const mustEnforceCourseAssignment = !CONTEXT_OVERRIDE_ROLES.has(req.user.role) && req.user.role !== 'PARENT';
        if (mustEnforceCourseAssignment) {
          if (!userIdBigInt) {
            throw {
              status: 403,
              message: 'Unable to resolve user for course context',
              code: 'COURSE_CONTEXT_USER_MISSING'
            };
          }
          const assignment = await prisma.courseManagerAssignment.findFirst({
            where: {
              userId: userIdBigInt,
              courseId,
              revokedAt: null
            },
            select: { id: true }
          });
          if (!assignment) {
            throw {
              status: 403,
              message: 'You are not assigned to this course',
              code: 'COURSE_ACCESS_DENIED'
            };
          }
        }

        return {
          id: course.id,
          schoolId: course.schoolId ?? null,
          branchId: resolvedBranchId ?? null
        };
      };

      try {
        if (requestedSchoolId) {
          const schoolExists = await ensureSchoolExists(requestedSchoolId);
          if (!schoolExists) {
            return res.status(404).json({
              success: false,
              message: 'School not found',
              error: 'SCHOOL_NOT_FOUND'
            });
          }
          if (!canOverrideSchool && userDefaultSchoolId && userDefaultSchoolId !== requestedSchoolId) {
            const branchAssignment = await prisma.branchManagerAssignment.findFirst({
              where: {
                userId: userIdBigInt,
                schoolId: requestedSchoolId,
                revokedAt: null
              },
              select: { id: true }
            });
            const courseAssignment = await prisma.courseManagerAssignment.findFirst({
              where: {
                userId: userIdBigInt,
                schoolId: requestedSchoolId,
                revokedAt: null
              },
              select: { id: true }
            });
            if (!branchAssignment && !courseAssignment) {
              return res.status(403).json({
                success: false,
                message: 'You are not assigned to the selected school',
                error: 'SCHOOL_ACCESS_DENIED'
              });
            }
          }
          activeSchoolId = requestedSchoolId;
        }

        if (requestedBranchId) {
          activeBranchId = await ensureBranchAccess(requestedBranchId, activeSchoolId);
          if (!activeSchoolId) {
            const branchRecord = await prisma.branch.findUnique({
              where: { id: activeBranchId },
              select: { schoolId: true }
            });
            activeSchoolId = branchRecord?.schoolId ?? activeSchoolId;
          }
        }

        if (requestedCourseId) {
          const courseContext = await ensureCourseAccess(requestedCourseId, activeSchoolId, activeBranchId);
          activeCourseId = courseContext?.id ?? null;
          if (!activeSchoolId && courseContext?.schoolId) {
            activeSchoolId = courseContext.schoolId;
          }
          if (!activeBranchId && courseContext?.branchId) {
            activeBranchId = courseContext.branchId;
          }
        }
      } catch (contextError) {
        // In legacy deployments, context resolution can fail due to partial schema/state.
        // We don't want this to break all GET APIs, so we log and fall back to a safe default.
        if (contextError?.status) {
          // Still honor explicit status codes from scope helpers (e.g. 400/403)
          return res.status(contextError.status).json({
            success: false,
            message: contextError.message,
            error: contextError.code || 'CONTEXT_RESOLUTION_FAILED'
          });
        }

        logError('Context resolution error (falling back to default school 1)', contextError);

        // Hard fallback: assume schoolId = 1, no specific branch/course.
        // This matches the hardcoded managedEntities we return on login.
        activeSchoolId = activeSchoolId ?? BigInt(1);
        activeBranchId = activeBranchId ?? null;
        activeCourseId = activeCourseId ?? null;
      }

      if (activeSchoolId) {
        req.user.schoolId = activeSchoolId;
      }
      if (activeBranchId) {
        req.user.branchId = activeBranchId;
      }
      if (activeCourseId) {
        req.user.courseId = activeCourseId;
      }

      req.managedContext = {
        schoolId: activeSchoolId ?? null,
        branchId: activeBranchId ?? null,
        courseId: activeCourseId ?? null
      };
      res.locals.managedContext = req.managedContext;
      setRequestContext({
        managedContext: req.managedContext,
        user: {
          id: req.user.id,
          role: req.user.role,
          schoolId: req.user.schoolId ?? null,
          branchId: req.user.branchId ?? null,
          courseId: req.user.courseId ?? null
        }
      });
      // ----------------------------------------------------------------------
      
      if (req.user.isSuperDuperAdmin) {
        req.tenantId = null;
        req.subscription = null;
        req.package = null;
        req.subscriptionFeatures = {};
        req.subscriptionLimits = {};
        logger.debug('authenticateToken:end-super-duper-admin');
        return next();
      }
      
      // CRITICAL SECURITY CHECK: Ensure non-super-admin users have schoolId
      if (!['SUPER_ADMIN', 'SUPER_DUPER_ADMIN'].includes(req.user.role) && !req.user.schoolId) {
        logger.warn(
          'authenticateToken:user-missing-school',
          normalizeForLog({
            userId: req.user.id,
          })
        );
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'User is not associated with any school. Please contact administrator.'
        });
      }

      if (req.user.schoolId) {
        const tenantContext = await getTenantContextForSchool(req.user.schoolId);
        req.tenantId = tenantContext.tenantId;
        req.subscription = tenantContext.subscription;
        req.package = tenantContext.package;
        req.subscriptionFeatures = tenantContext.features;
        req.subscriptionLimits = tenantContext.limits;
        req.schoolOwnerId = tenantContext.ownerId || null;
      } else {
        req.tenantId = null;
        req.subscription = null;
        req.package = null;
        req.subscriptionFeatures = {};
        req.subscriptionLimits = {};
        req.schoolOwnerId = null;
      }
      
      logger.debug(
        'authenticateToken:end-user',
        normalizeForLog({
          userId: req.user.id,
          schoolId: req.user.schoolId,
        })
      );
      return next();
    } catch (error) {
      logger.error('authenticateToken:user-db-error', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication error',
        message: 'Database error during user authentication'
      });
    }
  } catch (error) {
    logger.error('authenticateToken:jwt-error', error);
    return res.status(403).json({
      success: false,
      error: 'Access denied',
      message: 'Invalid token'
    });
  }
};

// ======================
// AUTHORIZATION MIDDLEWARE
// ======================

/**
 * Check if user has required roles
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      // Ensure allowedRoles is an array
      if (!Array.isArray(allowedRoles)) {
      logError('authorizeRoles configuration error', new Error('allowedRoles must be an array'), { allowedRoles });
        return res.status(500).json({
          success: false,
          error: 'Authorization configuration error',
          message: 'Invalid role configuration.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 500
          }
        });
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please login to access this resource.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 401
          }
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        if (req.user.role === 'SUPER_DUPER_ADMIN') {
          return next();
        }
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `You don't have permission to perform this action. Required roles: ${allowedRoles.join(', ')}`,
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 403,
            userRole: req.user.role,
            requiredRoles: allowedRoles
          }
        });
      }

      next();
    } catch (error) {
      logError('Authorization error', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: 'Authorization service error. Please try again.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

/**
 * Check if user has required permissions for specific actions
 */
export const authorizePermissions = (requiredPermissions) => {
  return (req, res, next) => {
    logger.debug('authorizePermissions:start', {
      requiredPermissions,
      userRole: req.user?.role,
    });
    
    try {
      if (!req.user) {
        logger.warn('authorizePermissions:no-user');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please login to access this resource.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 401
          }
        });
      }

      // Platform admins have all permissions
      if (isPlatformAdmin(req.user.role)) {
        logger.debug('authorizePermissions:platform-admin');
        return next();
      }

      // Check if user has required permissions
      const userPermissions = getUserPermissions(req.user.role);
      if (userPermissions?.includes('*')) {
        logger.debug('authorizePermissions:wildcard');
        return next();
      }
      logger.debug('authorizePermissions:user-permissions', { userPermissions });
      
      for (const permission of requiredPermissions) {
        if (!userPermissions.includes(permission)) {
          logger.warn('authorizePermissions:permission-denied', {
            missingPermission: permission,
            userRole: req.user.role,
          });
          return res.status(403).json({
            success: false,
            error: 'Insufficient permissions',
            message: `You don't have permission to perform this action. Required permission: ${permission}`,
            meta: {
              timestamp: new Date().toISOString(),
              statusCode: 403,
              userRole: req.user.role,
              requiredPermissions,
              userPermissions
            }
          });
        }
      }

      logger.debug('authorizePermissions:access-granted');
      next();
    } catch (error) {
      logError('=== authorizePermissions ERROR ===', error);
      return res.status(500).json({
        success: false,
        error: 'Permission check failed',
        message: 'Permission service error. Please try again.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

/**
 * Check if user can access school-specific resources
 */
export const authorizeSchoolAccess = (schoolIdParam = 'schoolId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please login to access this resource.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 401
          }
        });
      }

      const schoolId = req.params[schoolIdParam] || req.body.schoolId || req.query.schoolId;
      
      if (!schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School ID required',
          message: 'School ID is required for this operation.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Platform admins can access all schools
      if (isPlatformAdmin(req.user.role)) {
        return next();
      }

      // Check if user belongs to the school
      if (req.user.schoolId && req.user.schoolId.toString() === schoolId.toString()) {
        return next();
      }

      // For school admins, check if they own the school
      if (req.user.role === 'SCHOOL_ADMIN') {
        const school = await prisma.school.findUnique({
          where: { id: BigInt(schoolId) },
          select: { ownerId: true }
        });

        if (school && school.ownerId.toString() === req.user.createdByOwnerId.toString()) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'School access denied',
        message: 'You don\'t have permission to access this school.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 403,
          userRole: req.user.role,
          userSchoolId: req.user.schoolId,
          requestedSchoolId: schoolId
        }
      });
    } catch (error) {
      logError('School access check error', error);
      return res.status(500).json({
        success: false,
        error: 'School access check failed',
        message: 'Access check service error. Please try again.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

/**
 * Check if user can access owner-specific resources
 */
export const authorizeOwnerAccess = (ownerIdParam = 'ownerId') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please login to access this resource.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 401
          }
        });
      }

      const ownerId = req.params[ownerIdParam] || req.body.ownerId || req.query.ownerId;
      
      if (!ownerId) {
        return res.status(400).json({
          success: false,
          error: 'Owner ID required',
          message: 'Owner ID is required for this operation.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Platform admins can access all owners
      if (isPlatformAdmin(req.user.role)) {
        return next();
      }

      // Check if user belongs to the owner
      if (req.user.createdByOwnerId && req.user.createdByOwnerId.toString() === ownerId.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        error: 'Owner access denied',
        message: 'You don\'t have permission to access this owner\'s resources.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 403,
          userRole: req.user.role,
          userOwnerId: req.user.createdByOwnerId,
          requestedOwnerId: ownerId
        }
      });
    } catch (error) {
      logError('Owner access check error', error);
      return res.status(500).json({
        success: false,
        error: 'Owner access check failed',
        message: 'Access check service error. Please try again.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

// ======================
// PERMISSION UTILITIES
// ======================

/**
 * Get permissions for a specific role
 */
export function getUserPermissions(role) {
  const permissions = {
    'SUPER_DUPER_ADMIN': [
      '*'
    ],
    'SUPER_ADMIN': [
      // School permissions
      'school:create', 'school:read', 'school:update', 'school:delete', 'school:restore',
      'school:bulk_create', 'school:bulk_update', 'school:bulk_delete',
      'school:export', 'school:import', 'school:analytics', 'school:stats',
      
      // Owner permissions
      'owner:create', 'owner:read', 'owner:update', 'owner:delete', 'owner:restore',
      'owner:bulk_create', 'owner:bulk_update', 'owner:bulk_delete',
      'owner:export', 'owner:import', 'owner:analytics', 'owner:stats',
      
      // User permissions
      'user:create', 'user:read', 'user:update', 'user:delete', 'user:restore',
      'user:bulk_create', 'user:bulk_update', 'user:bulk_delete',
      'user:export', 'user:import', 'user:analytics', 'user:stats',
      
      // System permissions
      'system:cache_manage', 'system:settings', 'system:logs', 'system:backup'
    ],
    
    'SCHOOL_ADMIN': [
      // School permissions (own schools only)
      'school:read', 'school:update', 'school:analytics', 'school:stats',
      'school:export', 'school:import',
      
      // User permissions (own school users)
      'user:create', 'user:read', 'user:update', 'user:delete',
      'user:bulk_create', 'user:bulk_update', 'user:bulk_delete',
      'user:export', 'user:import', 'user:analytics', 'user:stats',
      
      // Academic permissions
      'class:create', 'class:read', 'class:update', 'class:delete',
      'subject:create', 'subject:read', 'subject:update', 'subject:delete',
      'teacher:create', 'teacher:read', 'teacher:update', 'teacher:delete',
      'student:create', 'student:read', 'student:update', 'student:delete',
      'staff:create', 'staff:read', 'staff:update', 'staff:delete',
      'parent:create', 'parent:read', 'parent:update', 'parent:delete',
      'grade:create', 'grade:read', 'grade:update', 'grade:delete', 'grade:restore',
      'grade:export', 'grade:import', 'grade:analytics', 'grade:stats',
      
      // Financial permissions
      'payment:create', 'payment:read', 'payment:update', 'payment:delete',
      'fee:create', 'fee:read', 'fee:update', 'fee:delete',
      
      // Suggestion and complaint permissions (teacher access)
      'suggestion-complaint:read', 'suggestion-complaint:update',
      
      // System permissions (limited)
      'system:cache_view'
    ],
    
    'TEACHER': [
      // Read permissions
      'school:read', 'user:read', 'class:read', 'subject:read',
      'student:read', 'staff:read', 'parent:read',
      
      // Teacher management permissions (enable full access to teacher routes)
      'teacher:read', 'teacher:create', 'teacher:update', 'teacher:delete', 'teacher:restore',
      'teacher:bulk_create', 'teacher:bulk_update', 'teacher:bulk_delete',
      'teacher:export', 'teacher:import', 'teacher:analytics', 'teacher:stats',
      'teacher:search', 'teacher:performance',

      // Student management permissions
      'student:create', 'student:update',
      
      // Class management permissions
      'class:create', 'class:update',
      
      // Subject management permissions
      'subject:create', 'subject:update', 'subject:delete',
      
      // Academic permissions
      'attendance:create', 'attendance:read', 'attendance:update',
      'grade:create', 'grade:read', 'grade:update',
      'assignment:create', 'assignment:read', 'assignment:update', 'assignment:delete',
      
      // Exam and timetable permissions
      'exam:read', 'exam_timetable:read', 'timetable:read',
      
      // Suggestion and complaint permissions (admin access)
      'suggestion-complaint:create', 'suggestion-complaint:read', 'suggestion-complaint:update', 'suggestion-complaint:delete',
      
      // Limited analytics
      'school:stats', 'user:stats'
    ],
    
    'STUDENT': [
      // Read permissions (own data)
      'school:read', 'user:read', 'class:read', 'subject:read',
      'attendance:read', 'grade:read', 'assignment:read',
      
      // Limited actions
      'assignment:submit', 'user:update_own'
    ],
    
    'STAFF': [
      // Read permissions
      'school:read', 'user:read', 'class:read', 'subject:read',
      'student:read', 'teacher:read',
      
      // Limited permissions
      'attendance:read', 'grade:read', 'assignment:read'
    ],

    'HRM': [
      // Core HR visibility
      'school:read', 'user:read', 'staff:read', 'teacher:read',
      'student:read', 'parent:read',
      
      // HR workflows
      'staff:create', 'staff:update',
      'attendance:read', 'attendance:update',
      'grade:read', 'assignment:read',
      'report:read'
    ],
    
    'PARENT': [
      // Read permissions (children's data)
      'school:read', 'student:read', 'student:read_children', 'attendance:read_children',
      'grade:read_children', 'assignment:read_children', 'parent:read',
      
      // Class and subject permissions (to view children's classes)
      'class:read', 'subject:read',
      
      // Base permissions for parent functionality
      'notification:read', 'notification:update', 'message:read', 'message:create',
      'announcement:read', 'document:read', 'report:read', 'fee:read',
      'payment:read', 'exam:read', 'timetable:read',
      
      // Suggestion and complaint permissions
      'suggestion-complaint:create', 'suggestion-complaint:read', 'suggestion-complaint:update',
      
      // Allow parents to see teacher/staff lists for their school (read-only)
      'teacher:read', 'staff:read',
      
      // Limited actions
      'user:update_own'
    ],
    
    'ACCOUNTANT': [
      // Financial permissions
      'payment:create', 'payment:read', 'payment:update', 'payment:delete',
      'fee:create', 'fee:read', 'fee:update', 'fee:delete',
      'payroll:create', 'payroll:read', 'payroll:update', 'payroll:delete',
      
      // Read permissions
      'school:read', 'user:read', 'student:read', 'staff:read',
      
      // Financial analytics
      'school:stats', 'payment:analytics'
    ],
    
    'LIBRARIAN': [
      // Library permissions
      'book:create', 'book:read', 'book:update', 'book:delete',
      'book_issue:create', 'book_issue:read', 'book_issue:update', 'book_issue:delete',
      
      // Read permissions
      'school:read', 'user:read', 'student:read', 'staff:read',
      
      // Library analytics
      'book:analytics', 'book:stats'
    ],
    
    'CRM_MANAGER': [
      // Customer management permissions
      'customer:create', 'customer:read', 'customer:update', 'customer:delete',
      'customer:bulk_create', 'customer:bulk_update', 'customer:bulk_delete',
      'customer:export', 'customer:import', 'customer:analytics', 'customer:stats',
      
      // Lead management
      'lead:create', 'lead:read', 'lead:update', 'lead:delete',
      'lead:convert', 'lead:assign', 'lead:analytics',
      
      // Communication permissions
      'communication:create', 'communication:read', 'communication:update',
      'email:send', 'sms:send', 'notification:send',
      
      // Read permissions
      'school:read', 'user:read', 'student:read', 'staff:read',
      
      // CRM analytics
      'customer:analytics', 'lead:analytics', 'communication:analytics'
    ],
    
    'BRANCH_MANAGER': [
      // Branch administration
      'branch:read', 'branch:update', 'branch:analytics',
      
      // User and staff oversight (branch scoped)
      'user:read', 'user:update',
      'teacher:read', 'teacher:update',
      'staff:read', 'staff:update',
      'student:read', 'student:update',
      'parent:read', 'parent:update',
      
      // Academic coordination
      'class:create', 'class:read', 'class:update',
      'section:create', 'section:read', 'section:update',
      'timetable:read', 'attendance:read', 'attendance:create', 'attendance:update',
      'grade:read', 'grade:update',
      'assignment:read', 'assignment:create', 'assignment:update',
      'exam:read', 'exam:create', 'exam:update',
      'subject:read', 'subject:update',
      
      // Communication & reporting
      'message:read', 'message:create', 'notification:read', 'notification:create',
      'report:read'
    ],
    
    'COURSE_MANAGER': [
      // Course catalog management
      'course:create', 'course:read', 'course:update', 'course:delete',
      'course:publish', 'course:archive',
      
      // Curriculum coordination
      'subject:read', 'subject:update',
      'assignment:read', 'assignment:create', 'assignment:update',
      'exam:read', 'exam:create', 'exam:update',
      'grade:read', 'grade:update',
      
      // Class and enrollment oversight
      'class:read', 'class:create', 'class:update',
      'section:read', 'section:create', 'section:update',
      'student:read', 'student:update',
      
      // Communication & analytics
      'message:read', 'message:create', 'notification:read',
      'report:read', 'course:analytics'
    ]
  };

  return permissions[role] || [];
}

// ======================
// SPECIALIZED MIDDLEWARE
// ======================

/**
 * Require authentication for all routes
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'Please login to access this resource.',
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 401
      }
    });
  }
  next();
};

/**
 * Check if user is owner
 */
export const requireOwner = (req, res, next) => {
  logger.debug('requireOwner:start', {
    user: req.user ? { id: req.user.id, role: req.user.role, type: req.user.type } : null,
    isPlatformAdmin: isPlatformAdmin(req.user?.role),
  });
  
  if (!req.user || !isPlatformAdmin(req.user.role)) {
    logger.warn('requireOwner:access-denied', {
      userId: req.user?.id,
      userRole: req.user?.role,
    });
    return res.status(403).json({
      success: false,
      error: 'Owner access required',
      message: 'This action requires owner privileges.',
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 403,
        userRole: req.user?.role
      }
    });
  }
  logger.debug('requireOwner:access-granted', { userId: req.user?.id });
  next();
};

/**
 * Check if user is school admin or owner
 */
export const requireSchoolAdmin = (req, res, next) => {
  if (!req.user || ![...PLATFORM_ADMIN_ROLES, 'SCHOOL_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'School admin access required',
      message: 'This action requires school administrator privileges.',
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 403,
        userRole: req.user?.role
      }
    });
  }
  next();
};

/**
 * Check if user is teacher or higher
 */
export const requireTeacher = (req, res, next) => {
  if (!req.user || ![...PLATFORM_ADMIN_ROLES, 'SCHOOL_ADMIN', 'TEACHER'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Teacher access required',
      message: 'This action requires teacher privileges.',
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 403,
        userRole: req.user?.role
      }
    });
  }
  next();
};

// ======================
// AUDIT LOGGING
// ======================

/**
 * Log user actions for audit
 */
export const auditLog = auditLogMiddleware;

// ======================
// ALIAS EXPORTS FOR BACKWARD COMPATIBILITY
// ======================

// Alias for authenticateToken
export const authenticate = authenticateToken;

/**
 * Authorize access to subject resources
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @param {string} paramKey - Name of the parameter containing subject ID
 */
export const authorizeSubjectAccess = (paramKey = 'id') => {
  return async (req, res, next) => {
    try {
      // Check if prisma is initialized
      if (!prisma) {
      logError('Prisma client not initialized in authorizeSubjectAccess', new Error('Prisma client missing'));
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: 'Database client not initialized',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 500
          }
        });
      }

      const subjectId = req.params[paramKey];
      if (!subjectId) {
        return res.status(400).json({
          success: false,
          error: 'Subject ID is required',
          message: 'Subject ID parameter is missing',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400,
            param: paramKey
          }
        });
      }

      // Get subject from database
      const subject = await prisma.subject.findUnique({
        where: { id: BigInt(subjectId) },
        select: {
          id: true,
          schoolId: true,
          departmentId: true,
          createdBy: true,
          updatedBy: true
        }
      });

      if (!subject) {
        return res.status(404).json({
          success: false,
          error: 'Subject not found',
          message: 'The requested subject does not exist',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 404,
            subjectId
          }
        });
      }

      // Check if user has permission to access this subject
      const user = req.user;
      const permissions = getUserPermissions(user.role);
      
      // Platform admins have access to all subjects
      if (isPlatformAdmin(user.role)) {
        return next();
      }

      // School admins can access subjects in their school
      if (user.role === 'SCHOOL_ADMIN' && user.schoolId === subject.schoolId) {
        return next();
      }

      // Teachers can access subjects they teach
      if (user.role === 'TEACHER') {
        // Check if teacher is assigned to this subject via TeacherClassSubject
        const teacherSubject = await prisma.teacherClassSubject.findFirst({
          where: {
            teacherId: BigInt(user.id),
            subjectId: BigInt(subject.id),
            isActive: true,
            deletedAt: null
          }
        });

        if (teacherSubject) {
          return next();
        }
        
        // If not found in TeacherClassSubject, still allow access for teachers
        // (they might be creating/managing subjects)
        return next();
      }

      // If none of the above conditions match, deny access
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this subject',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 403,
          userRole: user.role,
          subjectId
        }
      });

    } catch (error) {
      logError('Subject access authorization error', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization error',
        message: 'An error occurred while checking subject access',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500,
          error: error.message
        }
      });
    }
  };
};

/**
 * Authorize teacher access
 */
export const authorizeTeacherAccess = (paramKey = 'id') => {
  return async (req, res, next) => {
    try {
      const teacherId = req.params[paramKey];
      
      if (!teacherId) {
        return res.status(400).json({
          success: false,
          error: 'Teacher ID required',
          message: 'Teacher ID is required for this operation.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Platform admins can access any teacher
      if (isPlatformAdmin(req.user.role)) {
        return next();
      }

      // Check if teacher exists and belongs to user's school
      const teacher = await prisma.teacher.findFirst({
        where: {
          id: parseInt(teacherId),
          schoolId: req.user.schoolId,
          deletedAt: null
        },
        select: {
          id: true,
          schoolId: true,
          departmentId: true
        }
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          error: 'Teacher not found',
          message: 'Teacher not found or you do not have access to this teacher.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 404
          }
        });
      }

      // School admins can access any teacher in their school
      if (req.user.role === 'SCHOOL_ADMIN' && teacher.schoolId === req.user.schoolId) {
        return next();
      }

      // Parents can access teachers in their school (they need to see their children's teachers)
      if (req.user.role === 'PARENT' && teacher.schoolId === req.user.schoolId) {
        return next();
      }

      // Teachers can access their own profile
      if (req.user.role === 'TEACHER') {
        const currentTeacher = await prisma.teacher.findFirst({
          where: {
            userId: req.user.id,
            schoolId: req.user.schoolId,
            deletedAt: null
          },
          select: { id: true }
        });

        if (currentTeacher && currentTeacher.id === parseInt(teacherId)) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this teacher.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 403,
          userRole: req.user.role,
          teacherId: parseInt(teacherId)
        }
      });
    } catch (error) {
      logError('Teacher access authorization error', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: 'Failed to verify teacher access permissions.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

/**
 * Authorize student access
 */
export const authorizeStudentAccess = (paramKey = 'id') => {
  return async (req, res, next) => {
    try {
      const studentId = req.params[paramKey];
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          error: 'Student ID required',
          message: 'Student ID is required for this operation.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Super admins can access any student
      if (isPlatformAdmin(req.user.role)) {
        return next();
      }

      // Check if student exists and belongs to user's school
      logger.debug('authorizeStudentAccess:start', {
        studentId,
        schoolId: req.user.schoolId,
        prismaStatus: prisma ? 'available' : 'unavailable',
        prismaType: typeof prisma,
      });
      
      let student;
      try {
        console.log('authorizeStudentAccess:query - starting for studentId:', studentId);
        logger.debug('authorizeStudentAccess:query', { studentId, schoolId: req.user.schoolId });
        
        // Add timeout to prevent hanging
        const studentPromise = prisma.student.findFirst({
          where: {
            id: parseInt(studentId),
            schoolId: req.user.schoolId,
            deletedAt: null
          },
          select: {
            id: true,
            schoolId: true,
            classId: true,
            userId: true
          }
        });
        
        // Race the query against a timeout
        student = await Promise.race([
          studentPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Student query timeout after 3 seconds')), 3000)
          )
        ]);
        
        console.log('authorizeStudentAccess:query - completed, student found:', !!student);
        logger.debug('authorizeStudentAccess:student-found', {
          studentId: student?.id,
        });
        
        if (!student) {
          console.log('authorizeStudentAccess: student not found');
          return res.status(404).json({
            success: false,
            error: 'Student not found',
            message: 'Student not found or you do not have access to this student.',
            meta: {
              timestamp: new Date().toISOString(),
              statusCode: 404
            }
          });
        }
      } catch (dbError) {
        console.error('authorizeStudentAccess: database error or timeout:', dbError.message);
        logError('Database error in authorizeStudentAccess', dbError, {
          name: dbError?.name,
          message: dbError?.message
        });
        return res.status(500).json({
          success: false,
          error: 'Database error',
          message: dbError.message?.includes('timeout') 
            ? 'Student access verification timed out. Please try again.'
            : 'Failed to verify student access due to database error.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 500,
            error: dbError.message
          }
        });
      }

      // School admins can access any student in their school
      if (req.user.role === 'SCHOOL_ADMIN' && student.schoolId === req.user.schoolId) {
        return next();
      }

      // Teachers can access students in their classes
      if (req.user.role === 'TEACHER') {
        logger.debug('authorizeStudentAccess:teacher-check', {
          studentId: student.id,
        });
        
        // Teachers should have access to all students in their school
        // This is more permissive and aligns with typical school management needs
        if (student.schoolId === req.user.schoolId) {
          logger.debug('authorizeStudentAccess:teacher-access-granted', {
            studentId: student.id,
          });
          return next();
        }
        
        logger.warn('authorizeStudentAccess:teacher-access-denied', {
          studentId: student.id,
        });
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'Teacher does not have permission to access this student.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 403
          }
        });
      }

      // Students can access their own profile
      if (req.user.role === 'STUDENT' && student.userId === req.user.id) {
        return next();
      }

      // Parents can access their children - if student is in their school, allow access
      if (req.user.role === 'PARENT') {
        console.log('authorizeStudentAccess:parent-check - starting');
        logger.debug('authorizeStudentAccess:parent-check', {
          userId: req.user.id,
          prismaStatus: prisma ? 'available' : 'unavailable',
        });
        
        // If student is in the parent's school, allow access (we already verified student exists and belongs to school)
        if (student.schoolId === req.user.schoolId) {
          console.log('authorizeStudentAccess: parent access granted (same school), calling next()');
          return next();
        }
        
        // Otherwise, check if parent-student relationship exists
        try {
          // Add timeout for parent lookup
          const parentPromise = prisma.parent.findFirst({
            where: {
              userId: req.user.id,
              schoolId: req.user.schoolId
            },
            select: { id: true }
          });

          const parent = await Promise.race([
            parentPromise,
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Parent query timeout')), 2000)
            )
          ]);

          console.log('authorizeStudentAccess:parent-found - parentId:', parent?.id?.toString());
          logger.debug('authorizeStudentAccess:parent-found', {
            parentId: parent?.id,
          });

          if (parent) {
            // Add timeout for parent-student relationship check
            const parentStudentPromise = prisma.student.findFirst({
              where: {
                id: parseInt(studentId),
                parentId: parent.id,
                schoolId: req.user.schoolId,
                deletedAt: null
              },
              select: { id: true }
            });

            const parentStudent = await Promise.race([
              parentStudentPromise,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Parent-student query timeout')), 2000)
              )
            ]);

            console.log('authorizeStudentAccess:parent-student-match - found:', !!parentStudent);
            logger.debug('authorizeStudentAccess:parent-student-match', {
              parentId: parent?.id,
              studentId: parentStudent?.id,
            });

            if (parentStudent) {
              console.log('authorizeStudentAccess: parent access granted, calling next()');
              return next();
            } else {
              console.log('authorizeStudentAccess: parent-student relationship not found');
            }
          } else {
            console.log('authorizeStudentAccess: parent not found');
          }
        } catch (parentError) {
          console.error('authorizeStudentAccess: parent check error:', parentError.message);
          logError('Error checking parent access', parentError, {
            userId: req.user.id,
            schoolId: req.user.schoolId
          });
          
          // If there's a database error or timeout, deny access for security
          return res.status(500).json({
            success: false,
            error: 'Database error during authorization',
            message: parentError.message?.includes('timeout') 
              ? 'Authorization check timed out. Please try again.'
              : 'Failed to verify parent access.',
            meta: {
              timestamp: new Date().toISOString(),
              statusCode: 500,
              error: parentError.message
            }
          });
        }
      }

      logger.warn('authorizeStudentAccess:access-denied');
      logger.debug('authorizeStudentAccess:prisma-status-final', {
        status: prisma ? 'available' : 'unavailable',
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this student.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 403,
          userRole: req.user.role,
          studentId: parseInt(studentId)
        }
      });
    } catch (error) {
      logError('Student access authorization error', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: 'Failed to verify student access permissions.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

/**
 * Authorize staff access
 */
export const authorizeStaffAccess = (paramKey = 'id') => {
  return async (req, res, next) => {
    try {
      const staffId = req.params[paramKey];
      
      if (!staffId) {
        return res.status(400).json({
          success: false,
          error: 'Staff ID required',
          message: 'Staff ID is required for this operation.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Platform admins can access any staff
      if (isPlatformAdmin(req.user.role)) {
        return next();
      }

      // Check if staff exists and belongs to user's school
      const staff = await prisma.staff.findFirst({
        where: {
          id: parseInt(staffId),
          schoolId: req.user.schoolId,
          deletedAt: null
        },
        select: {
          id: true,
          schoolId: true,
          userId: true,
          departmentId: true
        }
      });

      if (!staff) {
        return res.status(404).json({
          success: false,
          error: 'Staff not found',
          message: 'Staff not found or you do not have access to this staff member.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 404
          }
        });
      }

      // School admins can access any staff in their school
      if (req.user.role === 'SCHOOL_ADMIN' && staff.schoolId === req.user.schoolId) {
        return next();
      }

      // Staff can access their own profile
      if (req.user.role === 'STAFF' && staff.userId === req.user.id) {
        return next();
      }

      // Teachers can access staff in their department
      if (req.user.role === 'TEACHER') {
        const teacher = await prisma.teacher.findFirst({
          where: {
            userId: req.user.id,
            schoolId: req.user.schoolId,
            deletedAt: null
          },
          select: { departmentId: true }
        });

        if (teacher && teacher.departmentId && staff.departmentId && teacher.departmentId === staff.departmentId) {
          return next();
        }
      }

      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this staff member.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 403,
          userRole: req.user.role,
          staffId: parseInt(staffId)
        }
      });
    } catch (error) {
      logError('Staff access authorization error', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization failed',
        message: 'Failed to verify staff access permissions.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

/**
 * Combined authentication and authorization middleware
 * @param {Array} allowedRoles - Array of allowed roles (optional)
 * @param {Array} requiredPermissions - Array of required permissions (optional)
 * @param {Object} options - Additional options (schoolIdParam, ownerIdParam, etc.)
 */
export const authorize = (allowedRoles = [], requiredPermissions = [], options = {}) => {
  return (req, res, next) => {
    // First authenticate the token
    authenticateToken(req, res, (err) => {
      if (err) return next(err);
      
      // If no authorization requirements, just continue
      if (allowedRoles.length === 0 && requiredPermissions.length === 0) {
        return next();
      }

      try {
        // Check roles if specified
        if (allowedRoles.length > 0) {
          const roleCheck = authorizeRoles(allowedRoles);
          roleCheck(req, res, (err) => {
            if (err) return next(err);
            
            // Check permissions if specified
            if (requiredPermissions.length > 0) {
              const permissionCheck = authorizePermissions(requiredPermissions);
              permissionCheck(req, res, (err) => {
                if (err) return next(err);
                next();
              });
            } else {
              next();
            }
          });
        } else {
          // Check permissions if specified
          if (requiredPermissions.length > 0) {
            const permissionCheck = authorizePermissions(requiredPermissions);
            permissionCheck(req, res, (err) => {
              if (err) return next(err);
              next();
            });
          } else {
            next();
          }
        }
      } catch (error) {
        logError('Authorization error', error);
        return res.status(500).json({
          success: false,
          error: 'Authorization failed',
          message: 'An error occurred during authorization',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 500
          }
        });
      }
    });
  };
};

/**
 * Hybrid authorization that checks both roles and permissions
 * Useful for endpoints that need to support both role-based and permission-based access
 */
export const authorizeRolesOrPermissions = (allowedRoles, requiredPermissions) => {
  return (req, res, next) => {
    logger.debug('authorizeRolesOrPermissions:start', {
      allowedRoles,
      requiredPermissions,
      userRole: req.user?.role,
    });
    
    try {
      if (!req.user) {
        logger.warn('authorizeRolesOrPermissions:no-user');
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Please login to access this resource.',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 401
          }
        });
      }

      // Platform admins (owners) have all access
      if (isPlatformAdmin(req.user.role)) {
        logger.debug('authorizeRolesOrPermissions:platform-admin');
        return next();
      }

      // Check role-based access first
      if (allowedRoles && allowedRoles.includes(req.user.role)) {
        logger.debug('authorizeRolesOrPermissions:role-granted');
        return next();
      }

      // If role check fails, check permissions
      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = getUserPermissions(req.user.role);
        logger.debug('authorizeRolesOrPermissions:user-permissions', { userPermissions });
        
        for (const permission of requiredPermissions) {
          if (!userPermissions.includes(permission)) {
            logger.warn('authorizeRolesOrPermissions:permission-denied', {
              missingPermission: permission,
            });
            return res.status(403).json({
              success: false,
              error: 'Insufficient permissions',
              message: `You don't have permission to perform this action. Required permission: ${permission}`,
              meta: {
                timestamp: new Date().toISOString(),
                statusCode: 403,
                userRole: req.user.role,
                requiredPermissions,
                userPermissions
              }
            });
          }
        }
        
        logger.debug('authorizeRolesOrPermissions:permission-granted');
        return next();
      }

      // If neither role nor permission check passes
      logger.warn('authorizeRolesOrPermissions:access-denied');
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `You don't have permission to perform this action. Required roles: ${allowedRoles?.join(', ') || 'None'}, Required permissions: ${requiredPermissions?.join(', ') || 'None'}`,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 403,
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          requiredPermissions
        }
      });
    } catch (error) {
      logError('=== authorizeRolesOrPermissions ERROR ===', error);
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        message: 'Authorization service error. Please try again.',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 500
        }
      });
    }
  };
};

export default {
  authenticateToken,
  authenticate, // Add the alias to default export
  authorizeRoles,
  authorizePermissions,
  authorizeSchoolAccess,
  authorizeOwnerAccess,
  requireAuth,
  requireOwner,
  requireSchoolAdmin,
  requireTeacher,
  auditLog,
  authorize,
  getUserPermissions,
  authorizeSubjectAccess,
  authorizeTeacherAccess,
  authorizeStudentAccess,
  authorizeStaffAccess,
  authorizeRolesOrPermissions
};