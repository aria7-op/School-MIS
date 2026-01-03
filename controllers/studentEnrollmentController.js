import EnrollmentService from '../services/enrollmentService.js';
import AcademicYearService from '../services/academicYearService.js';
import logger from '../utils/logger.js';

const enrollmentService = new EnrollmentService();
const academicYearService = new AcademicYearService();

/**
 * Convert BigInt to string for JSON serialization
 */
const convertBigInts = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

class StudentEnrollmentController {
  /**
   * Enroll a student in a class
   * POST /api/enrollments/enroll
   */
  async enrollStudent(req, res) {
    try {
      const { schoolId, id: userId } = req.user;
      const {
        studentId,
        classId,
        sectionId,
        academicSessionId,
        rollNo,
        status,
        remarks,
      } = req.body;

      // Validate required fields
      if (!studentId || !classId || !academicSessionId) {
        return res.status(400).json({
          success: false,
          message: 'studentId, classId, and academicSessionId are required',
        });
      }

      // Validate enrollment
      const validation = await enrollmentService.validateEnrollment(
        studentId,
        classId,
        academicSessionId
      );

      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validation.errors,
        });
      }

      const enrollment = await enrollmentService.enrollStudent(
        studentId,
        classId,
        academicSessionId,
        {
          sectionId,
          rollNo,
          status,
          remarks,
          createdBy: userId,
          schoolId,
        }
      );

      res.status(201).json({
        success: true,
        message: 'Student enrolled successfully',
        data: convertBigInts(enrollment),
      });
    } catch (error) {
      logger.error('Error enrolling student:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to enroll student',
      });
    }
  }

  /**
   * Bulk promote students
   * POST /api/enrollments/bulk-promote
   */
  async bulkPromote(req, res) {
    try {
      const { schoolId, id: userId } = req.user;
      const { studentIds, targetClassId, targetSectionId, academicSessionId, remarks } = req.body;

      // Validate required fields
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'studentIds array is required',
        });
      }

      if (!targetClassId || !academicSessionId) {
        return res.status(400).json({
          success: false,
          message: 'targetClassId and academicSessionId are required',
        });
      }

      const results = await enrollmentService.bulkPromote(
        {
          studentIds,
          targetClassId,
          targetSectionId,
          academicSessionId,
          remarks,
        },
        userId,
        schoolId
      );

      res.status(200).json({
        success: true,
        message: `Promotion completed: ${results.successful.length} successful, ${results.failed.length} failed`,
        data: convertBigInts(results),
      });
    } catch (error) {
      logger.error('Error in bulk promotion:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to promote students',
      });
    }
  }

  /**
   * Get enrollment history for a student
   * GET /api/enrollments/student/:studentId
   */
  async getEnrollmentHistory(req, res) {
    try {
      const { studentId } = req.params;

      const enrollments = await enrollmentService.getEnrollmentHistory(studentId);

      res.status(200).json({
        success: true,
        data: convertBigInts(enrollments),
      });
    } catch (error) {
      logger.error('Error getting enrollment history:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get enrollment history',
      });
    }
  }

  /**
   * Get all enrollments for an academic session
   * GET /api/enrollments/session/:sessionId
   */
  async getEnrollmentsBySession(req, res) {
    try {
      const { sessionId } = req.params;
      const { classId, sectionId, status } = req.query;

      const filters = {};
      if (classId) filters.classId = BigInt(classId);
      if (sectionId) filters.sectionId = BigInt(sectionId);
      if (status) filters.status = status;

      const enrollments = await enrollmentService.getEnrollmentsBySession(sessionId, filters);

      res.status(200).json({
        success: true,
        data: convertBigInts(enrollments),
      });
    } catch (error) {
      logger.error('Error getting enrollments by session:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get enrollments',
      });
    }
  }

  /**
   * Update an enrollment
   * PUT /api/enrollments/:id/update
   */
  async updateEnrollment(req, res) {
    try {
      const { id: enrollmentId } = req.params;
      const { id: userId } = req.user;
      const updateData = req.body;

      // Remove fields that shouldn't be updated directly
      delete updateData.id;
      delete updateData.studentId;
      delete updateData.academicSessionId;
      delete updateData.createdBy;
      delete updateData.createdAt;

      const enrollment = await enrollmentService.updateEnrollment(
        enrollmentId,
        updateData,
        userId
      );

      res.status(200).json({
        success: true,
        message: 'Enrollment updated successfully',
        data: convertBigInts(enrollment),
      });
    } catch (error) {
      logger.error('Error updating enrollment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update enrollment',
      });
    }
  }

  /**
   * Get students needing promotion
   * GET /api/enrollments/pending-promotions
   */
  async getPendingPromotions(req, res) {
    try {
      const { schoolId } = req.user;

      // Get current academic session
      const currentSession = await academicYearService.getCurrentSession(schoolId);

      if (!currentSession) {
        return res.status(404).json({
          success: false,
          message: 'No current academic session found',
        });
      }

      const result = await academicYearService.getStudentsNeedingPromotion(
        schoolId,
        currentSession.id
      );

      res.status(200).json({
        success: true,
        data: convertBigInts(result),
      });
    } catch (error) {
      logger.error('Error getting pending promotions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get pending promotions',
      });
    }
  }

  /**
   * Get active enrollment for a student
   * GET /api/enrollments/student/:studentId/active
   */
  async getActiveEnrollment(req, res) {
    try {
      const { studentId } = req.params;

      const enrollment = await enrollmentService.getActiveEnrollment(studentId);

      if (!enrollment) {
        return res.status(404).json({
          success: false,
          message: 'No active enrollment found',
        });
      }

      res.status(200).json({
        success: true,
        data: convertBigInts(enrollment),
      });
    } catch (error) {
      logger.error('Error getting active enrollment:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get active enrollment',
      });
    }
  }

  /**
   * Get academic year statistics
   * GET /api/enrollments/stats/:sessionId
   */
  async getAcademicYearStats(req, res) {
    try {
      const { sessionId } = req.params;
      const { schoolId } = req.user;

      const stats = await academicYearService.getAcademicYearStats(schoolId, sessionId);

      res.status(200).json({
        success: true,
        data: convertBigInts(stats),
      });
    } catch (error) {
      logger.error('Error getting academic year stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get academic year stats',
      });
    }
  }

  /**
   * Initialize new academic year
   * POST /api/enrollments/academic-year/initialize
   */
  async initializeAcademicYear(req, res) {
    try {
      const { schoolId, id: userId } = req.user;
      const academicSessionData = req.body;

      const newSession = await academicYearService.initializeNewYear(
        schoolId,
        academicSessionData,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Academic year initialized successfully',
        data: convertBigInts(newSession),
      });
    } catch (error) {
      logger.error('Error initializing academic year:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to initialize academic year',
      });
    }
  }

  /**
   * Set current academic session
   * PUT /api/enrollments/academic-year/set-current
   */
  async setCurrentSession(req, res) {
    try {
      const { schoolId } = req.user;
      const { academicSessionId } = req.body;

      if (!academicSessionId) {
        return res.status(400).json({
          success: false,
          message: 'academicSessionId is required',
        });
      }

      const session = await academicYearService.setCurrentSession(schoolId, academicSessionId);

      res.status(200).json({
        success: true,
        message: 'Current academic session updated',
        data: convertBigInts(session),
      });
    } catch (error) {
      logger.error('Error setting current session:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to set current session',
      });
    }
  }

  /**
   * Close academic year
   * POST /api/enrollments/academic-year/:sessionId/close
   */
  async closeAcademicYear(req, res) {
    try {
      const { schoolId } = req.user;
      const { sessionId } = req.params;

      const result = await academicYearService.closeAcademicYear(schoolId, sessionId);

      res.status(200).json({
        success: true,
        message: 'Academic year closed successfully',
        data: convertBigInts(result),
      });
    } catch (error) {
      logger.error('Error closing academic year:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to close academic year',
      });
    }
  }

  /**
   * Get all academic sessions
   * GET /api/enrollments/academic-year/sessions
   */
  async getAcademicSessions(req, res) {
    try {
      const { schoolId, role } = req.user;
      const { includeStats, schoolId: querySchoolId } = req.query;

      let sessions;
      
      // Superadmins can see all sessions from all schools
      if (role === 'SUPER_ADMIN') {
        if (querySchoolId) {
          // Filter by specific school if requested
          sessions = await academicYearService.getAcademicSessions(BigInt(querySchoolId), {
            includeStats: includeStats === 'true',
          });
        } else {
          // Get all sessions from all schools
          sessions = await academicYearService.getAllAcademicSessions({
            includeStats: includeStats === 'true',
          });
        }
      } else {
        // Regular users only see their school's sessions
        if (!schoolId) {
          return res.status(400).json({
            success: false,
            message: 'School ID is required',
          });
        }
        sessions = await academicYearService.getAcademicSessions(schoolId, {
          includeStats: includeStats === 'true',
        });
      }

      res.status(200).json({
        success: true,
        data: convertBigInts(sessions),
      });
    } catch (error) {
      logger.error('Error getting academic sessions:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get academic sessions',
      });
    }
  }

  /**
   * Suggest next class for promotion
   * GET /api/enrollments/suggest-next-class/:classId
   */
  async suggestNextClass(req, res) {
    try {
      const { schoolId } = req.user;
      const { classId } = req.params;

      const nextClass = await academicYearService.suggestNextClass(classId, schoolId);

      if (!nextClass) {
        return res.status(404).json({
          success: false,
          message: 'No next class found',
        });
      }

      res.status(200).json({
        success: true,
        data: convertBigInts(nextClass),
      });
    } catch (error) {
      logger.error('Error suggesting next class:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to suggest next class',
      });
    }
  }

  /**
   * Clone fee structures to new academic year
   * POST /api/enrollments/academic-year/clone-fees
   */
  async cloneFeeStructures(req, res) {
    try {
      const { schoolId, id: userId } = req.user;
      const { sourceSessionId, targetSessionId } = req.body;

      if (!sourceSessionId || !targetSessionId) {
        return res.status(400).json({
          success: false,
          message: 'sourceSessionId and targetSessionId are required',
        });
      }

      const cloned = await academicYearService.cloneFeeStructures(
        sourceSessionId,
        targetSessionId,
        schoolId,
        userId
      );

      res.status(200).json({
        success: true,
        message: `Cloned ${cloned.length} fee structures`,
        data: convertBigInts(cloned),
      });
    } catch (error) {
      logger.error('Error cloning fee structures:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to clone fee structures',
      });
    }
  }
}

export default new StudentEnrollmentController();








