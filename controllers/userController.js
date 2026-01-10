import prisma from '../utils/prismaClient.js';
import userService from '../services/userService.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  toBigIntSafe
} from '../utils/contextScope.js';
import { 
  UserCreateSchema, 
  UserCreateNestedSchema,
  UserUpdateSchema, 
  UserSearchSchema,
  UserAuthSchema,
  UserPasswordChangeSchema,
  UserProfileUpdateSchema,
  UserBulkCreateSchema,
  UserBulkUpdateSchema,
  UserImportSchema,
  UserExportSchema,
  UserAnalyticsSchema,
  UserPerformanceSchema,
  UserTempPasswordResetSchema,
} from '../utils/userSchemas.js';
import { auditLog } from '../middleware/auth.js';
import { validateHRFields, validateRoleSpecificFields } from '../utils/hrValidationUtils.js';
import { 
  processHRFieldsForMetadata, 
  extractHRFieldsForDatabase,
  transformUserDataForAPI,
  generateEmployeeId
} from '../utils/hrFieldProcessor.js';

const ACCESS_TOKEN_COOKIE = 'accessToken';
const isProduction = process.env.NODE_ENV === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'strict' : 'lax',
  path: '/',
};

export const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany({
    include: { teacher: true, student: true, staff: true, school: true, owner: true }
  });
  res.json(users);
};

export const getUsers = async (req, res) => {
  try {
    const scope = normalizeScopeWithSchool(
      await resolveManagedScope(req),
      toBigIntSafe(req.user?.schoolId)
    );
    if (!scope?.schoolId) {
      return res.status(400).json({
        success: false,
        error: 'Managed school context is required',
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
    // Simple direct database query - get all users
    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 1000; // Default to 1000, allow unlimited with limit=all
    const skip = (page - 1) * limit;
    
    // Build query options
    const baseWhere = {
      deletedAt: null,
      // Exclude PARENT and STUDENT roles from user management to reduce load
      role: {
        notIn: ['PARENT', 'STUDENT']
      }
    };

    const scopedWhere = applyScopeToWhere(baseWhere, scope, {
      useBranch: true,
      useCourse: false
    });

    await userService.repairInvalidUserRoles();

    const queryOptions = {
      where: scopedWhere,
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        id: 'desc'
      }
    };
    
    // Only apply pagination if limit is not 'all'
    if (req.query.limit !== 'all' && req.query.limit !== 'unlimited') {
      queryOptions.take = limit;
      queryOptions.skip = skip;
    }
    
    // Get total count for pagination info
    const totalCount = await prisma.user.count({
      where: scopedWhere
    });
    
    const users = await prisma.user.findMany(queryOptions);
    
    // Convert BigInt to string for JSON serialization
    const usersWithStringIds = users.map(user => ({
      ...user,
      id: user.id.toString()
    }));
    
    res.status(200).json({
      success: true,
      data: usersWithStringIds,
      total: totalCount,
      page: page,
      limit: req.query.limit === 'all' || req.query.limit === 'unlimited' ? totalCount : limit,
      meta: {
        timestamp: new Date().toISOString(),
        returned: usersWithStringIds.length,
        total: totalCount,
        page: page,
        pages: req.query.limit === 'all' || req.query.limit === 'unlimited' ? 1 : Math.ceil(totalCount / limit)
      }
    });
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
      });
    }

    // Validate that id is a valid number before converting to BigInt
    if (isNaN(id) || id === 'check-existence' || !/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid User ID format',
      });
    }

    const include = {
      teacher: true,
      student: true,
      staff: {
        include: {
          documents: true,
          department: true,
        },
      },
      school: true,
      parent: true,
    };

    const user = await prisma.user.findUnique({
      where: { id: BigInt(id) },
      include,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Transform user data with HR metadata for API response
    const transformedUser = transformUserDataForAPI(user, true);

    res.json({
      success: true,
      data: transformedUser,
      meta: {
        timestamp: new Date().toISOString(),
        hasMetadata: !!user.metadata,
        hrFields: {
          metadataProcessed: true,
          hasCourseAssignments: !!(transformedUser.courseAssignments && transformedUser.courseAssignments.length > 0),
          hasDocuments: !!(transformedUser.documents && Object.keys(transformedUser.documents).length > 0),
          roleSpecificData: !!(transformedUser.roleSpecific && Object.keys(transformedUser.roleSpecific).length > 0)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user by id:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: error.message,
    });
  }
};

export const createUser = async (req, res) => {
  try {
    // Debug logging
    console.log('=== DEBUG: createUser with HR Enhancement ===');
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('req.body.user:', req.body.user);
    console.log('req.body.staff:', req.body.staff);
    console.log('req.body.teacher:', req.body.teacher);
    
    let user, staff, teacher;
    
    // No validation - use raw request body directly
    if (req.body.user && typeof req.body.user === 'object') {
      // New format: { user: {...}, staff: {...}, teacher: {...} }
      console.log('Using new two-part format');
      user = req.body.user;
      staff = req.body.staff || null;
      teacher = req.body.teacher || null;
    } else {
      // Old format: flat payload with all fields in req.body
      console.log('Using old flat format');
      user = req.body;
      staff = null;
      teacher = null;
    }
    
    // All validation removed - proceed directly
    // Skip all validation checks
    
    // 3. Process HR fields for metadata
    const processedMetadata = processHRFieldsForMetadata(user, user.role);
    console.log('Processed metadata keys:', Object.keys(processedMetadata));
    
    // 4. Extract fields for database storage
    const { userFields, metadataFields, staffFields, teacherFields } = extractHRFieldsForDatabase(user);
    
    // 5. Generate employee ID if not provided
    if (!userFields.employeeId && (user.role === 'TEACHER' || user.role === 'SCHOOL_ADMIN' || user.role === 'HRM')) {
      const school = await prisma.school.findUnique({
        where: { id: BigInt(userFields.schoolId) },
        select: { code: true }
      });
      userFields.employeeId = generateEmployeeId(user.role, 'temp_id', school?.code || '');
    }
    
    // 6. Merge processed metadata with user fields
    userFields.metadata = JSON.stringify({
      ...processedMetadata,
      ...metadataFields
    });
    
    console.log('Extracted user fields:', Object.keys(userFields));
    console.log('Extracted staff fields:', Object.keys(staffFields));
    console.log('Extracted teacher fields:', Object.keys(teacherFields));
    
    console.log('Extracted user:', JSON.stringify(user, null, 2));
    console.log('Extracted staff:', JSON.stringify(staff, null, 2));
    console.log('Extracted teacher:', JSON.stringify(teacher, null, 2));
    console.log('=== END DEBUG ===');
    
    const result = await userService.createUser(userFields, req.user?.id, staffFields, teacherFields);
    
    if (result.success) {
      // Transform user data for API response
      const transformedData = transformUserDataForAPI(result.data, true);
      
      // Audit log with HR context
      await auditLog(req.user?.id, 'USER_CREATE', 'HR User created', {
        userId: result.data.id,
        username: result.data.username,
        email: result.data.email,
        role: result.data.role,
        hrFields: Object.keys(processedMetadata),
        hasCourseAssignments: (processedMetadata.courseAssignments || []).length > 0,
        hasDocuments: Object.keys(processedMetadata.documents || {}).length > 0
      });
      
      res.status(201).json({
        success: true,
        data: transformedData,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database',
          hrFields: {
            metadataProcessed: true,
            courseAssignments: processedMetadata.courseAssignments?.length || 0,
            documentsUploaded: Object.keys(processedMetadata.documents || {}).length,
            roleSpecificData: Object.keys(processedMetadata.roleSpecific || {}).length
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    console.error('Error in createUser:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      details: error.errors || null,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await userService.updateUser(id, req.body, req.user?.id);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_UPDATE', 'User updated', {
        userId: id,
        updatedFields: Object.keys(req.body),
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const patchUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userService.patchUser(id, req.body, req.user?.id);

    if (result.success) {
      await auditLog(req.user?.id, 'USER_UPDATE', 'User patched', {
        userId: id,
        updatedFields: Object.keys(req.body),
      });
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: { timestamp: new Date().toISOString(), source: result.source || 'database' }
      });
    }

    return res.status(400).json({
      success: false,
      error: result.error,
      details: result.details,
      meta: { timestamp: new Date().toISOString(), statusCode: 400 }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: { timestamp: new Date().toISOString(), statusCode: 500 }
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await userService.deleteUser(id, req.user?.id);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_DELETE', 'User deleted', {
        userId: id,
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await userService.restoreUser(id, req.user?.id);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_RESTORE', 'User restored', {
        userId: id,
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const loginUser = async (req, res) => {
  try {
    // Get real IP address (considering proxies and load balancers)
    const getRealIp = (req) => {
      return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.connection?.remoteAddress ||
             req.socket?.remoteAddress ||
             req.ip ||
             'unknown';
    };

    const realIp = getRealIp(req);
    console.log('🔍 Login IP Detection:', {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-real-ip': req.headers['x-real-ip'],
      'req.ip': req.ip,
      'realIp': realIp
    });

    const deviceInfo = {
      ipAddress: realIp,
      userAgent: req.get('User-Agent'),
      deviceType: req.get('Device-Type') || 'unknown',
    };
    
    const result = await userService.loginUser(req.body, deviceInfo);
    
    if (result.success) {
      // Audit log
      await auditLog(result.data.user.id, 'USER_LOGIN', 'User logged in', {
        userId: result.data.user.id,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 401
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const tempResetPassword = async (req, res) => {
  try {
    const validated = UserTempPasswordResetSchema.parse(req.body);
    const result = await userService.tempResetPassword(validated.userId, validated.password, req.user?.id);

    if (result.success) {
      await auditLog(req.user?.id, 'USER_PASSWORD_RESET_TEMP', 'Temporary password reset via API', {
        targetUserId: validated.userId,
      });

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    }

    return res.status(result.statusCode || 400).json({
      success: false,
      error: result.error,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: result.statusCode || 400,
      },
    });
  } catch (error) {
    console.error('Temporary password reset failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500,
      },
    });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const result = await userService.logoutUser(req.user?.id, sessionId);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_LOGOUT', 'User logged out', {
        userId: req.user?.id,
        sessionId,
      });
      
      res.clearCookie(ACCESS_TOKEN_COOKIE, cookieOptions);
      
      res.status(200).json({
        success: true,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const result = await userService.changePassword(req.user?.id, req.body);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_PASSWORD_CHANGE', 'Password changed', {
        userId: req.user?.id,
      });
      
      res.status(200).json({
        success: true,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const bulkCreateUsers = async (req, res) => {
  try {
    const result = await userService.bulkCreateUsers(req.body.users, req.user?.id);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_BULK_CREATE', 'Bulk users created', {
        total: result.data.summary.total,
        successful: result.data.summary.successful,
        failed: result.data.summary.failed,
      });
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const bulkUpdateUsers = async (req, res) => {
  try {
    const result = await userService.bulkUpdateUsers(req.body.updates, req.user?.id);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_BULK_UPDATE', 'Bulk users updated', {
        total: result.data.summary.total,
        successful: result.data.summary.successful,
        failed: result.data.summary.failed,
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const bulkDeleteUsers = async (req, res) => {
  try {
    const result = await userService.bulkDeleteUsers(req.body.userIds, req.user?.id);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_BULK_DELETE', 'Bulk users deleted', {
        total: result.data.summary.total,
        successful: result.data.summary.successful,
        failed: result.data.summary.failed,
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await userService.getUserStats(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 404
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { period } = req.query;
    
    const result = await userService.getUserAnalytics(id, period);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database',
          period: period || '30d'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 404
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUserPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await userService.getUserPerformance(id);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 404
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const result = await userService.searchUsers(req.query);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database',
          filters: req.query
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const exportUsers = async (req, res) => {
  try {
    const { format = 'json', includeSensitiveData = false, ...filters } = req.query;
    
    const result = await userService.exportUsers(filters, format, includeSensitiveData === 'true');
    
    if (result.success) {
      // Set appropriate headers for download
      res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="users-export-${Date.now()}.${format}"`);
      
      res.status(200).json({
        success: true,
        data: result.data,
        format,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const importUsers = async (req, res) => {
  try {
    const result = await userService.importUsers(req.body.data, req.user?.id);
    
    if (result.success) {
      // Audit log
      await auditLog(req.user?.id, 'USER_IMPORT', 'Users imported', {
        total: result.data.summary.total,
        successful: result.data.summary.successful,
        failed: result.data.summary.failed,
      });
      
      res.status(200).json({
        success: true,
        data: result.data,
        message: result.message,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        details: result.details,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const generateUsernameSuggestions = async (req, res) => {
  try {
    const { firstName, lastName } = req.query;
    
    const result = await userService.generateUsernameSuggestions(firstName, lastName);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUserCountByRole = async (req, res) => {
  try {
    const result = await userService.getUserCountByRole();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUserCountByStatus = async (req, res) => {
  try {
    const result = await userService.getUserCountByStatus();
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUsersBySchool = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { include } = req.query;
    
    const result = await userService.getUsersBySchool(schoolId, include);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database',
          schoolId
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { include } = req.query;
    
    const result = await userService.getUsersByRole(role, include);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database',
          role
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
};

export const getUsersByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const { include } = req.query;
    
    const result = await userService.getUsersByStatus(status, include);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          source: result.source || 'database',
          status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
        meta: {
          timestamp: new Date().toISOString(),
          statusCode: 400
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      meta: {
        timestamp: new Date().toISOString(),
        statusCode: 500
      }
    });
  }
}; 