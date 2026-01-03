import scheduleService from '../services/scheduleService.js';
import { convertBigIntToString } from '../utils/responseUtils.js';
import prisma from '../utils/prismaClient.js';

class ScheduleController {
  /**
   * Generate complete schedule for a school
   * POST /api/schedules/generate
   */
  async generateSchedule(req, res) {
    try {
      // For SUPER_ADMIN, allow schoolId from request body or use their first school
      let schoolId = req.body.schoolId || req.user.schoolId;
      
      // If SUPER_ADMIN has multiple schools, use the first one if not specified
      if (req.user.role === 'SUPER_ADMIN' && !schoolId && req.user.schoolIds && req.user.schoolIds.length > 0) {
        schoolId = req.user.schoolIds[0];
      }

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required. Please provide schoolId in the request body.',
          error: 'SCHOOL_ID_REQUIRED'
        });
      }

      const createdBy = req.user.id;
      const options = req.body.options || {};

      console.log(`📅 Generating schedule for school ${schoolId} by user ${createdBy} (${req.user.role})`);

      const result = await scheduleService.generateSchoolSchedule(
        schoolId,
        createdBy,
        options
      );

      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        message: 'Schedule generated successfully',
        data: safeResult
      });
    } catch (error) {
      console.error('Error generating schedule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to generate schedule',
        error: error.toString()
      });
    }
  }

  /**
   * Get schedule for a specific class
   * GET /api/schedules/class/:classId
   */
  async getClassSchedule(req, res) {
    try {
      const { classId } = req.params;
      const schoolId = req.user.schoolId;

      const result = await scheduleService.getClassSchedule(classId, schoolId);
      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting class schedule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get class schedule',
        error: error.toString()
      });
    }
  }

  /**
   * Get schedule for a specific teacher
   * GET /api/schedules/teacher/:teacherId
   */
  async getTeacherSchedule(req, res) {
    try {
      const { teacherId } = req.params;
      const schoolId = req.user.schoolId;

      const result = await scheduleService.getTeacherSchedule(teacherId, schoolId);
      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting teacher schedule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get teacher schedule',
        error: error.toString()
      });
    }
  }

  /**
   * Get complete school schedule
   * GET /api/schedules/school
   */
  async getSchoolSchedule(req, res) {
    try {
      // For SUPER_ADMIN, allow schoolId from query or use their first school
      let schoolId = req.query.schoolId || req.user.schoolId;
      
      // If SUPER_ADMIN has multiple schools, use the first one if not specified
      if (req.user.role === 'SUPER_ADMIN' && !schoolId && req.user.schoolIds && req.user.schoolIds.length > 0) {
        schoolId = req.user.schoolIds[0];
      }

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required',
          error: 'SCHOOL_ID_REQUIRED'
        });
      }

      const result = await scheduleService.getSchoolSchedule(schoolId);
      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting school schedule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get school schedule',
        error: error.toString()
      });
    }
  }

  /**
   * Delete school schedule
   * DELETE /api/schedules/school
   */
  async deleteSchoolSchedule(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const result = await scheduleService.deleteSchoolSchedule(schoolId);
      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully',
        data: safeResult
      });
    } catch (error) {
      console.error('Error deleting school schedule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete school schedule',
        error: error.toString()
      });
    }
  }

  /**
   * Get schedule by day for a class
   * GET /api/schedules/class/:classId/day/:day
   */
  async getClassScheduleByDay(req, res) {
    try {
      const { classId, day } = req.params;
      const schoolId = req.user.schoolId;

      const fullSchedule = await scheduleService.getClassSchedule(classId, schoolId);
      const daySchedule = fullSchedule.schedule[day] || [];

      const safeResult = convertBigIntToString({
        classId,
        className: fullSchedule.className,
        day,
        schedule: daySchedule
      });

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting class schedule by day:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get class schedule by day',
        error: error.toString()
      });
    }
  }

  /**
   * Get schedule by day for a teacher
   * GET /api/schedules/teacher/:teacherId/day/:day
   */
  async getTeacherScheduleByDay(req, res) {
    try {
      const { teacherId, day } = req.params;
      const schoolId = req.user.schoolId;

      const fullSchedule = await scheduleService.getTeacherSchedule(teacherId, schoolId);
      const daySchedule = fullSchedule.schedule[day] || [];

      const safeResult = convertBigIntToString({
        teacherId,
        teacherName: fullSchedule.teacherName,
        day,
        schedule: daySchedule
      });

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting teacher schedule by day:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get teacher schedule by day',
        error: error.toString()
      });
    }
  }

  /**
   * Validate current schedule for conflicts
   * GET /api/schedules/validate
   */
  async validateSchedule(req, res) {
    try {
      const schoolId = req.user.schoolId;

      // Get current timetable
      const { schedule } = await scheduleService.getSchoolSchedule(schoolId);
      
      // Convert schedule format for validation
      const scheduleSlots = [];
      Object.entries(schedule).forEach(([dayName, periods]) => {
        Object.entries(periods).forEach(([periodKey, slots]) => {
          slots.forEach(slot => {
            scheduleSlots.push({
              dayName,
              period: parseInt(periodKey.replace('Period ', '')),
              ...slot
            });
          });
        });
      });

      const validation = scheduleService.validateSchedule(scheduleSlots);
      const safeResult = convertBigIntToString(validation);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error validating schedule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to validate schedule',
        error: error.toString()
      });
    }
  }

  /**
   * Get schedule statistics
   * GET /api/schedules/statistics
   */
  async getScheduleStatistics(req, res) {
    try {
      const schoolId = req.user.schoolId;

      const result = await scheduleService.getSchoolSchedule(schoolId);
      
      res.status(200).json({
        success: true,
        data: {
          totalSlots: result.totalSlots,
          statistics: result.statistics
        }
      });
    } catch (error) {
      console.error('Error getting schedule statistics:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get schedule statistics',
        error: error.toString()
      });
    }
  }

  /**
   * Get historical schedule by year and month
   * GET /api/schedules/historical
   * Query params: year, month, schoolId (optional for SUPER_ADMIN)
   */
  async getHistoricalSchedule(req, res) {
    try {
      let schoolId = req.query.schoolId || req.user.schoolId;
      
      // If SUPER_ADMIN has multiple schools, use the first one if not specified
      if (req.user.role === 'SUPER_ADMIN' && !schoolId && req.user.schoolIds && req.user.schoolIds.length > 0) {
        schoolId = req.user.schoolIds[0];
      }

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required',
          error: 'SCHOOL_ID_REQUIRED'
        });
      }

      const year = parseInt(req.query.year);
      const month = parseInt(req.query.month);

      if (!year || !month || month < 1 || month > 12) {
        return res.status(400).json({
          success: false,
          message: 'Valid year and month (1-12) are required',
          error: 'INVALID_DATE_PARAMS'
        });
      }

      const result = await scheduleService.getHistoricalSchedule(schoolId, year, month);
      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting historical schedule:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get historical schedule',
        error: error.toString()
      });
    }
  }

  /**
   * Get schedule change history - compares two time periods
   * GET /api/schedules/history/changes
   * Query params: fromYear, fromMonth, toYear, toMonth, schoolId
   */
  async getScheduleChangeHistory(req, res) {
    try {
      let schoolId = req.query.schoolId || req.user.schoolId;
      
      if (req.user.role === 'SUPER_ADMIN' && !schoolId && req.user.schoolIds && req.user.schoolIds.length > 0) {
        schoolId = req.user.schoolIds[0];
      }

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required',
          error: 'SCHOOL_ID_REQUIRED'
        });
      }

      const fromYear = parseInt(req.query.fromYear);
      const fromMonth = parseInt(req.query.fromMonth);
      const toYear = parseInt(req.query.toYear);
      const toMonth = parseInt(req.query.toMonth);

      if (!fromYear || !fromMonth || !toYear || !toMonth || 
          fromMonth < 1 || fromMonth > 12 || toMonth < 1 || toMonth > 12) {
        return res.status(400).json({
          success: false,
          message: 'Valid fromYear, fromMonth, toYear, and toMonth (1-12) are required',
          error: 'INVALID_DATE_PARAMS'
        });
      }

      const result = await scheduleService.getScheduleChangeHistory(
        schoolId, fromYear, fromMonth, toYear, toMonth
      );
      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting schedule change history:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get schedule change history',
        error: error.toString()
      });
    }
  }

  /**
   * Get all schedule versions for a school
   * GET /api/schedules/versions
   * Query params: schoolId
   */
  async getScheduleVersions(req, res) {
    try {
      let schoolId = req.query.schoolId || req.user.schoolId;
      
      if (req.user.role === 'SUPER_ADMIN' && !schoolId && req.user.schoolIds && req.user.schoolIds.length > 0) {
        schoolId = req.user.schoolIds[0];
      }

      if (!schoolId) {
        return res.status(400).json({
          success: false,
          message: 'School ID is required',
          error: 'SCHOOL_ID_REQUIRED'
        });
      }

      const result = await scheduleService.getScheduleVersions(schoolId);
      const safeResult = convertBigIntToString(result);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting schedule versions:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get schedule versions',
        error: error.toString()
      });
    }
  }

  /**
   * Get teachers assigned to a class (for schedule creation)
   * GET /api/schedules/class/:classId/teachers
   */
  async getClassTeachers(req, res) {
    try {
      const { classId } = req.params;
      const schoolId = req.user.schoolId;

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'Class ID is required',
          error: 'CLASS_ID_REQUIRED'
        });
      }

      // Get teachers assigned to this class via teacherClassSubject
      const assignments = await prisma.teacherClassSubject.findMany({
        where: {
          classId: BigInt(classId),
          schoolId: BigInt(schoolId),
          isActive: true,
          deletedAt: null
        },
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  displayName: true
                }
              }
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        }
      });

      // Format response - group by teacher
      const teacherMap = new Map();
      assignments.forEach(assignment => {
        const teacherId = assignment.teacherId.toString();
        if (!teacherMap.has(teacherId)) {
          teacherMap.set(teacherId, {
            id: Number(assignment.teacherId),
            name: `${assignment.teacher.user.firstName} ${assignment.teacher.user.lastName}`,
            displayName: assignment.teacher.user.displayName,
            subjects: []
          });
        }
        teacherMap.get(teacherId).subjects.push({
          id: Number(assignment.subjectId),
          name: assignment.subject.name,
          code: assignment.subject.code
        });
      });

      const teachers = Array.from(teacherMap.values());

      const safeResult = convertBigIntToString(teachers);

      res.status(200).json({
        success: true,
        data: safeResult
      });
    } catch (error) {
      console.error('Error getting class teachers:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to get class teachers',
        error: error.toString()
      });
    }
  }

  /**
   * Create or update a schedule slot manually
   * POST /api/schedules/slot
   * Body: { classId, subjectId, teacherId, day, period, roomNumber?, startTime?, endTime? }
   */
  async createScheduleSlot(req, res) {
    try {
      const { classId, subjectId, teacherId, day, period, roomNumber, startTime, endTime } = req.body;
      const schoolId = req.user.schoolId;
      const createdBy = req.user.id;

      // Validate required fields
      if (!classId || !subjectId || !teacherId || day === undefined || period === undefined) {
        return res.status(400).json({
          success: false,
          message: 'classId, subjectId, teacherId, day, and period are required',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Validate day (0-5, where 0=Saturday, 5=Thursday)
      if (day < 0 || day > 5) {
        return res.status(400).json({
          success: false,
          message: 'Day must be between 0 (Saturday) and 5 (Thursday)',
          error: 'INVALID_DAY'
        });
      }

      // Validate period (1-6)
      if (period < 1 || period > 6) {
        return res.status(400).json({
          success: false,
          message: 'Period must be between 1 and 6',
          error: 'INVALID_PERIOD'
        });
      }

      // Check if teacher is assigned to this class
      const assignment = await prisma.teacherClassSubject.findFirst({
        where: {
          teacherId: BigInt(teacherId),
          classId: BigInt(classId),
          subjectId: BigInt(subjectId),
          schoolId: BigInt(schoolId),
          isActive: true,
          deletedAt: null
        }
      });

      if (!assignment) {
        return res.status(400).json({
          success: false,
          message: 'This teacher is not assigned to teach this subject in this class',
          error: 'TEACHER_NOT_ASSIGNED'
        });
      }

      // Check for conflicts: same teacher in another class at the same time
      const existingConflict = await prisma.timetable.findFirst({
        where: {
          schoolId: BigInt(schoolId),
          teacherId: BigInt(teacherId),
          day: day,
          period: period,
          deletedAt: null,
          NOT: {
            classId: BigInt(classId) // Allow same teacher in same class (updating)
          }
        },
        include: {
          class: {
            select: { name: true, code: true }
          },
          subject: {
            select: { name: true, code: true }
          }
        }
      });

      if (existingConflict) {
        const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const periodTimes = {
          1: '08:00-09:00',
          2: '09:00-10:00',
          3: '10:00-11:00',
          4: '11:00-12:00',
          5: '12:00-13:00',
          6: '13:00-14:00'
        };
        const dayName = dayNames[day];
        const timeSlot = periodTimes[period];
        
        return res.status(400).json({
          success: false,
          message: `Teacher is already scheduled in ${existingConflict.class?.name} ${existingConflict.class?.code ? `(${existingConflict.class.code})` : ''} for ${existingConflict.subject?.name || 'subject'} on ${dayName} at ${timeSlot}`,
          error: 'TEACHER_CONFLICT',
          conflict: {
            classId: Number(existingConflict.classId),
            className: existingConflict.class?.name,
            classCode: existingConflict.class?.code,
            subjectId: Number(existingConflict.subjectId),
            subjectName: existingConflict.subject?.name,
            subjectCode: existingConflict.subject?.code,
            day,
            dayName,
            period,
            timeSlot
          }
        });
      }

      // Check for conflicts: same class has another teacher at the same time
      const classConflict = await prisma.timetable.findFirst({
        where: {
          schoolId: BigInt(schoolId),
          classId: BigInt(classId),
          day: day,
          period: period,
          deletedAt: null,
          NOT: {
            teacherId: BigInt(teacherId) // Allow same teacher updating
          }
        },
        include: {
          subject: {
            select: { name: true, code: true }
          }
        }
      });

      if (classConflict) {
        const conflictTeacher = await prisma.teacher.findUnique({
          where: { id: classConflict.teacherId },
          include: {
            user: {
              select: { firstName: true, lastName: true, displayName: true }
            }
          }
        });
        
        const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
        const periodTimes = {
          1: '08:00-09:00',
          2: '09:00-10:00',
          3: '10:00-11:00',
          4: '11:00-12:00',
          5: '12:00-13:00',
          6: '13:00-14:00'
        };
        const dayName = dayNames[day];
        const timeSlot = periodTimes[period];
        const teacherName = conflictTeacher?.user?.displayName || `${conflictTeacher?.user.firstName || ''} ${conflictTeacher?.user.lastName || ''}`.trim();
        
        return res.status(400).json({
          success: false,
          message: `This class already has ${teacherName} scheduled for ${classConflict.subject?.name || 'subject'} on ${dayName} at ${timeSlot}`,
          error: 'CLASS_CONFLICT',
          conflict: {
            teacherId: Number(classConflict.teacherId),
            teacherName,
            subjectId: Number(classConflict.subjectId),
            subjectName: classConflict.subject?.name,
            subjectCode: classConflict.subject?.code,
            day,
            dayName,
            period,
            timeSlot
          }
        });
      }

      // Default times if not provided
      const timeSlots = {
        1: { start: '08:00', end: '09:00' },
        2: { start: '09:00', end: '10:00' },
        3: { start: '10:00', end: '11:00' },
        4: { start: '11:00', end: '12:00' },
        5: { start: '12:00', end: '13:00' },
        6: { start: '13:00', end: '14:00' }
      };

      const slotTime = timeSlots[period] || { start: '08:00', end: '09:00' };
      const finalStartTime = startTime || slotTime.start;
      const finalEndTime = endTime || slotTime.end;

      // Delete existing slot for this class/day/period (if updating)
      await prisma.timetable.deleteMany({
        where: {
          schoolId: BigInt(schoolId),
          classId: BigInt(classId),
          day: day,
          period: period,
          deletedAt: null
        }
      });

      // Create new slot
      const newSlot = await prisma.timetable.create({
        data: {
          day: day,
          period: period,
          startTime: new Date(`1970-01-01T${finalStartTime}`),
          endTime: new Date(`1970-01-01T${finalEndTime}`),
          classId: BigInt(classId),
          subjectId: BigInt(subjectId),
          teacherId: BigInt(teacherId),
          roomNumber: roomNumber || null,
          schoolId: BigInt(schoolId),
          createdBy: BigInt(createdBy)
        },
        include: {
          class: {
            select: { id: true, name: true, code: true }
          },
          subject: {
            select: { id: true, name: true, code: true }
          }
        }
      });

      // Get teacher information separately (since there's no relation in Timetable model)
      const teacher = await prisma.teacher.findUnique({
        where: { id: BigInt(teacherId) },
        include: {
          user: {
            select: { firstName: true, lastName: true, displayName: true }
          }
        }
      });

      const safeResult = convertBigIntToString({
        ...newSlot,
        teacher
      });

      res.status(200).json({
        success: true,
        message: 'Schedule slot created successfully',
        data: safeResult
      });
    } catch (error) {
      console.error('Error creating schedule slot:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create schedule slot',
        error: error.toString()
      });
    }
  }

  /**
   * Delete a schedule slot
   * DELETE /api/schedules/slot
   * Query: { classId, day, period }
   */
  async deleteScheduleSlot(req, res) {
    try {
      const { classId, day, period } = req.query;
      const schoolId = req.user.schoolId;

      if (!classId || day === undefined || period === undefined) {
        return res.status(400).json({
          success: false,
          message: 'classId, day, and period are required',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      // Soft delete the slot
      const deleted = await prisma.timetable.updateMany({
        where: {
          schoolId: BigInt(schoolId),
          classId: BigInt(classId),
          day: parseInt(day),
          period: parseInt(period),
          deletedAt: null
        },
        data: {
          deletedAt: new Date()
        }
      });

      res.status(200).json({
        success: true,
        message: 'Schedule slot deleted successfully',
        data: { deletedCount: deleted.count }
      });
    } catch (error) {
      console.error('Error deleting schedule slot:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete schedule slot',
        error: error.toString()
      });
    }
  }
}

export default new ScheduleController();

