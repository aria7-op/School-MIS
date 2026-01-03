import teacherService from '../services/teacherService.js';
import { 
  handlePrismaError, 
  createSuccessResponse
} from '../utils/responseUtils.js';
import { eventStore } from '../eventstore/index.js';
import { 
  triggerEntityCreatedNotifications,
  triggerEntityUpdatedNotifications,
  triggerEntityDeletedNotifications
} from '../utils/notificationTriggers.js';
import { resolveManagedScope } from '../utils/contextScope.js';

class TeacherController {
  // ======================
  // CRUD OPERATIONS
  // ======================

  /**
   * Create a new teacher
   */
  async createTeacher(req, res) {
    try {
      const scope = await resolveManagedScope(req);
      const teacherData = req.body;

      const result = await teacherService.createTeacher(
        teacherData, 
        req.user.id, 
        scope,
        req.user
      );

      // Event sourcing
      eventStore.append('teacher', {
        type: 'TeacherCreated',
        aggregateId: result.data.id,
        payload: result.data,
        timestamp: Date.now()
      });

      // Trigger automatic notifications for teacher creation
      await triggerEntityCreatedNotifications(
        'teacher',
        result.data.id,
        result.data,
        req.user,
        {
          auditDetails: {
            teacherId: result.data.id,
            teacherName: `${result.data.user?.firstName} ${result.data.user?.lastName}`,
            department: result.data.department
          }
        }
      );

      return createSuccessResponse(res, 201, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'createTeacher');
    }
  }

  /**
   * Get teachers with pagination and filters
   */
  async getTeachers(req, res) {
    console.log('--- getTeachers endpoint hit ---');
    console.log('🔍 Full user object:', JSON.stringify(req.user, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value, 2));
    
    try {
      const scope = await resolveManagedScope(req);
      console.log('getTeachers controller scope:', scope);

      const result = await teacherService.getTeachers(
        req.query, 
        req.user.id, 
        scope
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      console.error('getTeachers controller error:', error);
      return handlePrismaError(res, error, 'getTeachers');
    }
  }

  /**
   * Get teacher by ID
   */
  async getTeacherById(req, res) {
    try {
      const { id } = req.params;
      const { include = [] } = req.query;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeacherById(
        id, 
        req.user.id, 
        scope, 
        include
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeacherById');
    }
  }

  /**
   * Update teacher
   */
  async updateTeacher(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.updateTeacher(
        id, 
        updateData, 
        req.user.id, 
        scope
      );

      // Event sourcing
      eventStore.append('teacher', {
        type: 'TeacherUpdated',
        aggregateId: parseInt(id),
        payload: updateData,
        timestamp: Date.now()
      });

      // Trigger automatic notifications for teacher update
      await triggerEntityUpdatedNotifications(
        'teacher',
        parseInt(id),
        result.data,
        result.previousData || {},
        req.user,
        {
          auditDetails: {
            teacherId: parseInt(id),
            updatedFields: Object.keys(updateData)
          }
        }
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'updateTeacher');
    }
  }

  /**
   * Delete teacher (soft delete)
   */
  async deleteTeacher(req, res) {
    try {
      const { id } = req.params;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.deleteTeacher(
        id, 
        req.user.id, 
        scope
      );

      // Event sourcing
      eventStore.append('teacher', {
        type: 'TeacherDeleted',
        aggregateId: parseInt(id),
        payload: { id: parseInt(id) },
        timestamp: Date.now()
      });

      // Trigger automatic notifications for teacher deletion
      await triggerEntityDeletedNotifications(
        'teacher',
        parseInt(id),
        result.data || { id: parseInt(id) },
        req.user,
        {
          auditDetails: {
            teacherId: parseInt(id)
          }
        }
      );

      return createSuccessResponse(res, 200, result.message);
    } catch (error) {
      return handlePrismaError(res, error, 'deleteTeacher');
    }
  }

  /**
   * Restore deleted teacher
   */
  async restoreTeacher(req, res) {
    try {
      const { id } = req.params;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.restoreTeacher(
        id, 
        req.user.id, 
        scope
      );

      // Event sourcing
      eventStore.append('teacher', {
        type: 'TeacherRestored',
        aggregateId: parseInt(id),
        payload: { id: parseInt(id) },
        timestamp: Date.now()
      });

      return createSuccessResponse(res, 200, result.message);
    } catch (error) {
      return handlePrismaError(res, error, 'restoreTeacher');
    }
  }

  // ======================
  // SEARCH & FILTER
  // ======================

  /**
   * Search teachers with advanced filters
   */
  async searchTeachers(req, res) {
    try {
      const scope = await resolveManagedScope(req);
      const result = await teacherService.searchTeachers(
        req.query, 
        req.user.id, 
        scope
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'searchTeachers');
    }
  }

  // ======================
  // STATISTICS & ANALYTICS
  // ======================

  /**
   * Get teacher statistics
   */
  async getTeacherStats(req, res) {
    try {
      const { id } = req.params;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeacherStats(
        id, 
        req.user.id, 
        scope
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeacherStats');
    }
  }

  /**
   * Get teacher analytics
   */
  async getTeacherAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { period = '30d' } = req.query;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeacherAnalytics(
        id, 
        period, 
        req.user.id, 
        scope
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeacherAnalytics');
    }
  }

  /**
   * Get teacher performance metrics
   */
  async getTeacherPerformance(req, res) {
    try {
      const { id } = req.params;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeacherPerformance(
        id, 
        req.user.id, 
        scope
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeacherPerformance');
    }
  }

  // ======================
  // BULK OPERATIONS
  // ======================

  /**
   * Bulk create teachers
   */
  async bulkCreateTeachers(req, res) {
    try {
      const { teachers } = req.body;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.bulkCreateTeachers(
        teachers, 
        req.user.id, 
        scope
      );

      // Event sourcing
      const createdTeachers = result.data?.successful ?? [];
      if (Array.isArray(createdTeachers)) {
        createdTeachers.forEach(teacher => {
          eventStore.append('teacher', {
            type: 'TeacherCreated',
            aggregateId: teacher.id,
            payload: teacher,
            timestamp: Date.now()
          });
        });
      }

      return createSuccessResponse(res, 201, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'bulkCreateTeachers');
    }
  }

  /**
   * Bulk update teachers
   */
  async bulkUpdateTeachers(req, res) {
    try {
      const { updates } = req.body;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.bulkUpdateTeachers(
        updates, 
        req.user.id, 
        scope
      );

      // Event sourcing
      const updatedTeachers = result.data?.successful ?? [];
      if (Array.isArray(updatedTeachers)) {
        updatedTeachers.forEach(update => {
          eventStore.append('teacher', {
            type: 'TeacherUpdated',
            aggregateId: update.id,
            payload: update,
            timestamp: Date.now()
          });
        });
      }

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'bulkUpdateTeachers');
    }
  }

  /**
   * Bulk delete teachers
   */
  async bulkDeleteTeachers(req, res) {
    try {
      const { teacherIds } = req.body;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.bulkDeleteTeachers(
        teacherIds, 
        req.user.id, 
        scope
      );

      // Event sourcing
      const deletedTeachers = result.data?.successful ?? [];
      if (Array.isArray(deletedTeachers)) {
        deletedTeachers.forEach(({ teacherId }) => {
          eventStore.append('teacher', {
            type: 'TeacherDeleted',
            aggregateId: teacherId,
            payload: { id: teacherId },
            timestamp: Date.now()
          });
        });
      }

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'bulkDeleteTeachers');
    }
  }

  // ======================
  // EXPORT & IMPORT
  // ======================

  /**
   * Export teachers data
   */
  async exportTeachers(req, res) {
    try {
      const { format = 'json', ...filters } = req.query;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.exportTeachers(
        filters, 
        format, 
        req.user.id, 
        scope
      );

      // Set response headers
      const filename = `teachers_export_${new Date().toISOString().split('T')[0]}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
      } else {
        res.setHeader('Content-Type', 'application/json');
      }

      return res.send(result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'exportTeachers');
    }
  }

  /**
   * Import teachers data
   */
  async importTeachers(req, res) {
    try {
      const { teachers, user } = req.body;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.importTeachers(
        teachers, 
        user, 
        req.user.id, 
        scope
      );

      return createSuccessResponse(res, 201, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'importTeachers');
    }
  }

  // ======================
  // UTILITY ENDPOINTS
  // ======================

  /**
   * Generate teacher code suggestions
   */
  async generateCodeSuggestions(req, res) {
    try {
      const { name } = req.query;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.generateCodeSuggestions(name, scope);

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'generateCodeSuggestions');
    }
  }

  /**
   * Get teacher count by department
   */
  async getTeacherCountByDepartment(req, res) {
    try {
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeacherCountByDepartment(scope);

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeacherCountByDepartment');
    }
  }

  /**
   * Get teacher count by experience
   */
  async getTeacherCountByExperience(req, res) {
    try {
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeacherCountByExperience(scope);

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeacherCountByExperience');
    }
  }

  /**
   * Get teachers by department
   */
  async getTeachersByDepartment(req, res) {
    try {
      const { departmentId } = req.params;
      const { include = [] } = req.query;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeachersByDepartment(
        departmentId, 
        include, 
        req.user.id, 
        scope
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeachersByDepartment');
    }
  }

  /**
   * Get teachers by school
   */
  async getTeachersBySchool(req, res) {
    try {
      const { schoolId } = req.params;
      const { include = [] } = req.query;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.getTeachersBySchool(
        schoolId, 
        include, 
        req.user.id,
        scope
      );

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getTeachersBySchool');
    }
  }

  // ======================
  // CACHE MANAGEMENT
  // ======================

  /**
   * Get cache statistics
   */
  async getCacheStats(req, res) {
    try {
      const result = await teacherService.getCacheStats();

      return createSuccessResponse(res, 200, result.message, result.data);
    } catch (error) {
      return handlePrismaError(res, error, 'getCacheStats');
    }
  }

  /**
   * Warm up cache
   */
  async warmCache(req, res) {
    try {
      const { teacherId } = req.body;
      const scope = await resolveManagedScope(req);

      const result = await teacherService.warmCache(
        teacherId, 
        scope, 
        req.user.id
      );

      return createSuccessResponse(res, 200, result.message);
    } catch (error) {
      return handlePrismaError(res, error, 'warmCache');
    }
  }
}

export default new TeacherController(); 