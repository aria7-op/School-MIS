import express from 'express';
import scheduleController from '../controllers/scheduleController.js';
import { authenticateToken } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';

const router = express.Router();

// ======================
// SCHEDULE GENERATION
// ======================

/**
 * @route POST /api/schedules/generate
 * @desc Generate complete schedule for school based on teacher-class-subject assignments
 * @access Private (School Admin)
 * 
 * @description
 * This endpoint generates a complete weekly schedule for a school based on:
 * - Teacher-Class-Subject assignments (which teacher teaches which subject in which class)
 * - Saturday to Thursday schedule (5 days)
 * - 6 periods per day (8:00 AM to 2:00 PM)
 * - Each teacher teaches 6 consecutive hours per day
 * - Same schedule repeats every day
 * - NO conflicts: no teacher in two places, no two teachers in same class at same time
 */
router.post(
  '/generate',
  authenticateToken,
  auditLog('SCHEDULE_GENERATION', 'Generate school schedule'),
  scheduleController.generateSchedule
);

// ======================
// VIEW SCHEDULES
// ======================

/**
 * @route GET /api/schedules/school
 * @desc Get complete school schedule (all classes, all teachers)
 * @access Private
 */
router.get(
  '/school',
  authenticateToken,
  scheduleController.getSchoolSchedule
);

/**
 * @route GET /api/schedules/class/:classId
 * @desc Get schedule for a specific class
 * @access Private
 */
router.get(
  '/class/:classId',
  authenticateToken,
  scheduleController.getClassSchedule
);

/**
 * @route GET /api/schedules/teacher/:teacherId
 * @desc Get schedule for a specific teacher
 * @access Private
 */
router.get(
  '/teacher/:teacherId',
  authenticateToken,
  scheduleController.getTeacherSchedule
);

/**
 * @route GET /api/schedules/class/:classId/day/:day
 * @desc Get schedule for a specific class on a specific day
 * @access Private
 * @param {string} day - Day name (Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday)
 */
router.get(
  '/class/:classId/day/:day',
  authenticateToken,
  scheduleController.getClassScheduleByDay
);

/**
 * @route GET /api/schedules/teacher/:teacherId/day/:day
 * @desc Get schedule for a specific teacher on a specific day
 * @access Private
 * @param {string} day - Day name (Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday)
 */
router.get(
  '/teacher/:teacherId/day/:day',
  authenticateToken,
  scheduleController.getTeacherScheduleByDay
);

// ======================
// SCHEDULE VALIDATION & STATISTICS
// ======================

/**
 * @route GET /api/schedules/validate
 * @desc Validate current schedule for conflicts
 * @access Private
 */
router.get(
  '/validate',
  authenticateToken,
  scheduleController.validateSchedule
);

/**
 * @route GET /api/schedules/statistics
 * @desc Get schedule statistics (total slots, teachers, classes, etc.)
 * @access Private
 */
router.get(
  '/statistics',
  authenticateToken,
  scheduleController.getScheduleStatistics
);

/**
 * @route GET /api/schedules/historical
 * @desc Get historical schedule for a specific year and month
 * @access Private
 * @query {number} year - Year (e.g., 2024)
 * @query {number} month - Month (1-12)
 * @query {number} schoolId - School ID (optional, defaults to user's school)
 */
router.get(
  '/historical',
  authenticateToken,
  scheduleController.getHistoricalSchedule
);

/**
 * @route GET /api/schedules/history/changes
 * @desc Get schedule change history between two time periods
 * @access Private
 * @query {number} fromYear - Start year
 * @query {number} fromMonth - Start month (1-12)
 * @query {number} toYear - End year
 * @query {number} toMonth - End month (1-12)
 * @query {number} schoolId - School ID (optional for SUPER_ADMIN)
 */
router.get(
  '/history/changes',
  authenticateToken,
  scheduleController.getScheduleChangeHistory
);

/**
 * @route GET /api/schedules/versions
 * @desc Get all schedule versions/changes for a school
 * @access Private
 * @query {number} schoolId - School ID (optional for SUPER_ADMIN)
 */
router.get(
  '/versions',
  authenticateToken,
  scheduleController.getScheduleVersions
);

/**
 * @route GET /api/schedules/class/:classId/teachers
 * @desc Get teachers assigned to a class (for manual schedule creation)
 * @access Private
 */
router.get(
  '/class/:classId/teachers',
  authenticateToken,
  scheduleController.getClassTeachers
);

/**
 * @route POST /api/schedules/slot
 * @desc Create or update a schedule slot manually (with conflict validation)
 * @access Private
 * @body { classId, subjectId, teacherId, day, period, roomNumber?, startTime?, endTime? }
 */
router.post(
  '/slot',
  authenticateToken,
  scheduleController.createScheduleSlot
);

/**
 * @route DELETE /api/schedules/slot
 * @desc Delete a schedule slot
 * @access Private
 * @query { classId, day, period }
 */
router.delete(
  '/slot',
  authenticateToken,
  scheduleController.deleteScheduleSlot
);

// ======================
// SCHEDULE MANAGEMENT
// ======================

/**
 * @route DELETE /api/schedules/school
 * @desc Delete entire school schedule
 * @access Private (School Admin)
 */
router.delete(
  '/school',
  authenticateToken,
  auditLog('SCHEDULE_DELETION', 'Delete school schedule'),
  scheduleController.deleteSchoolSchedule
);

export default router;

