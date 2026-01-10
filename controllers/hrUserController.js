import hrUserService from '../services/hrUserService.js';
import { formatResponse, handleError } from '../utils/responseUtils.js';
import logger from '../config/logger.js';
import { resolveManagedScope } from '../utils/contextScope.js';
import {
  HRUserCreateSchema,
  HRUserUpdateSchema,
  HRBulkUserCreateSchema,
  createRoleSpecificSchema
} from '../utils/hrUserSchemas.js';
import { auditLog } from '../middleware/auth.js';

class HRUserController {
  // ======================
  // CRUD OPERATIONS
  // ======================

  /**
   * Create HR User
   * POST /api/hr/users
   */
  async createHRUser(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for HR user creation',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Validate request data
      const validatedData = HRUserCreateSchema.parse(req.body);
      
      // Add creator info
      validatedData.createdBy = req.user.id;
      
      // Create HR user
      const result = await hrUserService.createHRUser(
        validatedData,
        req.user.id,
        scope
      );

      return res.status(201).json(result);

    } catch (error) {
      logger.error('Create HR User controller error:', error);
      return handleError(res, error);
    }
  }

  /**
   * Get HR Users with filtering and pagination
   * GET /api/hr/users
   */
  async getHRUsers(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required to retrieve HR users',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Build filters from query parameters
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search,
        role: req.query.role,
        status: req.query.status,
        departmentId: req.query.departmentId,
        branchId: req.query.branchId,
        courseId: req.query.courseId
      };

      // Get HR users
      const result = await hrUserService.getHRUsers(filters, scope);

      return res.json(result);

    } catch (error) {
      logger.error('Get HR Users controller error:', error);
      return handleError(res, error);
    }
  }

  /**
   * Get HR User by ID
   * GET /api/hr/users/:id
   */
  async getHRUserById(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required to retrieve HR user',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      const { id } = req.params;
      
      // Get single user by filtering the list
      const filters = { page: 1, limit: 1, id };
      const result = await hrUserService.getHRUsers(filters, scope);
      
      if (!result.data || result.data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'HR user not found in managed scope',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 404
          }
        });
      }

      return res.json({
        success: true,
        message: 'HR user retrieved successfully',
        data: result.data[0]
      });

    } catch (error) {
      logger.error('Get HR User by ID controller error:', error);
      return handleError(res, error);
    }
  }

  /**
   * Update HR User
   * PUT /api/hr/users/:id
   */
  async updateHRUser(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required to update HR user',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      const { id } = req.params;
      
      // Validate update data
      const validatedData = HRUserUpdateSchema.parse(req.body);
      
      // Update HR user
      const result = await hrUserService.updateHRUser(
        id,
        validatedData,
        req.user.id,
        scope
      );

      return res.json(result);

    } catch (error) {
      logger.error('Update HR User controller error:', error);
      return handleError(res, error);
    }
  }

  /**
   * Delete HR User (soft delete)
   * DELETE /api/hr/users/:id
   */
  async deleteHRUser(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required to delete HR user',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      const { id } = req.params;
      
      // Delete HR user
      const result = await hrUserService.deleteHRUser(
        id,
        req.user.id,
        scope
      );

      return res.json(result);

    } catch (error) {
      logger.error('Delete HR User controller error:', error);
      return handleError(res, error);
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk Create HR Users
   * POST /api/hr/users/bulk
   */
  async bulkCreateHRUsers(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for bulk HR user creation',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Validate bulk creation data
      const validatedData = HRBulkUserCreateSchema.parse(req.body);
      
      const results = [];
      const errors = [];
      
      // Process each user
      for (let i = 0; i < validatedData.users.length; i++) {
        try {
          const userData = {
            ...validatedData.users[i],
            createdBy: req.user.id
          };
          
          const result = await hrUserService.createHRUser(
            userData,
            req.user.id,
            scope
          );
          
          results.push({
            index: i,
            success: true,
            data: result.data
          });
          
        } catch (error) {
          errors.push({
            index: i,
            success: false,
            error: error.message,
            userData: {
              email: validatedData.users[i].email,
              role: validatedData.users[i].role
            }
          });
        }
      }

      return res.status(201).json({
        success: true,
        message: `Bulk HR user creation completed. ${results.length} successful, ${errors.length} failed`,
        data: {
          successful: results,
          failed: errors,
          summary: {
            total: validatedData.users.length,
            successful: results.length,
            failed: errors.length
          }
        },
        meta: {
          timestamp: new Date().toISOString(),
          createdBy: req.user.id,
          schoolId: scope.schoolId
        }
      });

    } catch (error) {
      logger.error('Bulk Create HR Users controller error:', error);
      return handleError(res, error);
    }
  }

  // ======================
  // ROLE-SPECIFIC OPERATIONS
  // ======================

  /**
   * Create Teacher with Course Assignments
   * POST /api/hr/users/teacher
   */
  async createTeacherWithCourses(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for teacher creation',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Force role to TEACHER
      const teacherData = {
        ...req.body,
        role: 'TEACHER',
        createdBy: req.user.id
      };

      // Validate teacher-specific data
      const teacherSchema = createRoleSpecificSchema('TEACHER');
      const validatedData = teacherSchema.parse(teacherData);
      
      // Create teacher
      const result = await hrUserService.createHRUser(
        validatedData,
        req.user.id,
        scope
      );

      return res.status(201).json({
        success: true,
        message: 'Teacher created successfully with course assignments',
        data: result.data
      });

    } catch (error) {
      logger.error('Create Teacher controller error:', error);
      return handleError(res, error);
    }
  }

  /**
   * Create Branch Manager
   * POST /api/hr/users/branch-manager
   */
  async createBranchManager(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for branch manager creation',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Force role to BRANCH_MANAGER
      const managerData = {
        ...req.body,
        role: 'BRANCH_MANAGER',
        createdBy: req.user.id
      };

      // Validate branch manager-specific data
      const managerSchema = createRoleSpecificSchema('BRANCH_MANAGER');
      const validatedData = managerSchema.parse(managerData);
      
      // Create branch manager
      const result = await hrUserService.createHRUser(
        validatedData,
        req.user.id,
        scope
      );

      return res.status(201).json({
        success: true,
        message: 'Branch manager created successfully',
        data: result.data
      });

    } catch (error) {
      logger.error('Create Branch Manager controller error:', error);
      return handleError(res, error);
    }
  }

  /**
   * Create Course Manager
   * POST /api/hr/users/course-manager
   */
  async createCourseManager(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for course manager creation',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Force role to COURSE_MANAGER
      const managerData = {
        ...req.body,
        role: 'COURSE_MANAGER',
        createdBy: req.user.id
      };

      // Validate course manager-specific data
      const managerSchema = createRoleSpecificSchema('COURSE_MANAGER');
      const validatedData = managerSchema.parse(managerData);
      
      // Create course manager
      const result = await hrUserService.createHRUser(
        validatedData,
        req.user.id,
        scope
      );

      return res.status(201).json({
        success: true,
        message: 'Course manager created successfully',
        data: result.data
      });

    } catch (error) {
      logger.error('Create Course Manager controller error:', error);
      return handleError(res, error);
    }
  }

  // ======================
  // CROSS-SYSTEM OPERATIONS
  // ======================

  /**
   * Add Existing School User to Course
   * POST /api/hr/users/add-to-course
   */
  async addSchoolUserToCourse(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for course assignment',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      const { userId, courseId, role = 'ASSISTANT_TEACHER', salary } = req.body;
      
      // Validate user exists in school
      const user = await prisma.user.findFirst({
        where: {
          id: BigInt(userId),
          schoolId: scope.schoolId,
          deletedAt: null
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User not found in managed school scope',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 404
          }
        });
      }

      // Create course assignment
      const assignment = await prisma.teacherCourse.create({
        data: {
          teacherId: BigInt(userId),
          courseId: BigInt(courseId),
          schoolId: scope.schoolId,
          branchId: scope.branchId,
          role,
          assignedBy: req.user.id,
          assignedAt: new Date(),
          salary: salary ? JSON.stringify(salary) : null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create audit log
      await createAuditLog({
        userId: req.user.id,
        action: 'ADD_USER_TO_COURSE',
        targetUserId: BigInt(userId),
        schoolId: scope.schoolId,
        branchId: scope.branchId,
        details: {
          courseId,
          role,
          assignedAt: assignment.assignedAt
        }
      });

      return res.status(201).json({
        success: true,
        message: 'User added to course successfully',
        data: {
          assignmentId: assignment.id,
          userId,
          courseId,
          role,
          assignedAt: assignment.assignedAt
        }
      });

    } catch (error) {
      logger.error('Add School User to Course controller error:', error);
      return handleError(res, error);
    }
  }

  /**
   * Remove User from Course
   * DELETE /api/hr/users/remove-from-course/:userId/:courseId
   */
  async removeUserFromCourse(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for course removal',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      const { userId, courseId } = req.params;
      
      // Find and delete course assignment
      const assignment = await prisma.teacherCourse.findFirst({
        where: {
          teacherId: BigInt(userId),
          courseId: BigInt(courseId),
          schoolId: scope.schoolId
        }
      });

      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: 'Course assignment not found',
          message: 'User is not assigned to this course',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 404
          }
        });
      }

      await prisma.teacherCourse.delete({
        where: { id: assignment.id }
      });

      // Create audit log
      await createAuditLog({
        userId: req.user.id,
        action: 'REMOVE_USER_FROM_COURSE',
        targetUserId: BigInt(userId),
        schoolId: scope.schoolId,
        branchId: scope.branchId,
        details: {
          courseId,
          removedAt: new Date()
        }
      });

      return res.json({
        success: true,
        message: 'User removed from course successfully'
      });

    } catch (error) {
      logger.error('Remove User from Course controller error:', error);
      return handleError(res, error);
    }
  }

  // ======================
  // ANALYTICS & REPORTS
  // ======================

  /**
   * Get HR Users Statistics
   * GET /api/hr/users/stats
   */
  async getHRUsersStats(req, res) {
    try {
      // Resolve scope
      const scope = await resolveManagedScope(req);
      if (!scope?.schoolId) {
        return res.status(400).json({
          success: false,
          error: 'School context is required',
          message: 'School context is required for HR user statistics',
          meta: {
            timestamp: new Date().toISOString(),
            statusCode: 400
          }
        });
      }

      // Get statistics
      const stats = await hrUserService.getHRUsersStats(scope);

      return res.json({
        success: true,
        message: 'HR users statistics retrieved successfully',
        data: stats
      });

    } catch (error) {
      logger.error('Get HR Users Stats controller error:', error);
      return handleError(res, error);
    }
  }
}

// Export controller instance and individual methods
const hrUserController = new HRUserController();
export default hrUserController;

// Export individual methods for routing
export const {
  createHRUser,
  getHRUsers,
  getHRUserById,
  updateHRUser,
  deleteHRUser,
  bulkCreateHRUsers,
  createTeacherWithCourses,
  createBranchManager,
  createCourseManager,
  addSchoolUserToCourse,
  removeUserFromCourse,
  getHRUsersStats
} = hrUserController;
