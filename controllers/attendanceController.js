import prisma from '../utils/prismaClient.js';
import { createSuccessResponse, createErrorResponse, createAuditLog } from '../utils/responseUtils.js';
import smsService from '../services/smsService.js';
import { getSessionByDate } from '../utils/academicQueryHelpers.js';
import fs from 'fs';
import path from 'path';
import { createNotification, createAttendanceNotification } from '../services/notificationService.js';
import StudentEventService from '../services/studentEventService.js';
import { updateSubscriptionUsage } from '../services/subscriptionService.js';
import { resolveManagedScope } from '../utils/contextScope.js';

// Optional OCR service - gracefully handle if not available
let extractSingleRowAttendance = null;
try {
  const ocrModule = await import('../services/attendanceOCRService.js');
  extractSingleRowAttendance = ocrModule.extractSingleRowAttendance;
} catch (error) {
  console.warn('⚠️  OCR service not available:', error.message);
  console.warn('⚠️  Bulk OCR attendance feature will be disabled');
}

// ======================
// TIME-BASED ATTENDANCE CONSTRAINTS
// ======================

// Afghanistan timezone (UTC+4:30)
const AFGHANISTAN_TIMEZONE = 'Asia/Kabul';
// Fixed offset in minutes for Asia/Kabul (no DST)
const AFGHANISTAN_UTC_OFFSET_MIN = 270; // 4 hours 30 minutes

// Attendance time windows (in Afghanistan time)
const ATTENDANCE_TIMES = {
  MARK_IN_START: 7,    // 7:00 AM
  MARK_IN_END: 8,      // 8:00 AM
  MARK_OUT_START: 12,  // 12:00 PM (noon)
  MARK_OUT_END: 13,    // 1:00 PM
  AUTO_ABSENT_TIME: 9  // 9:00 AM - after this time, mark absent if no mark-in
};

/**
 * Get current time in Afghanistan timezone
 */
const getAfghanistanTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: AFGHANISTAN_TIMEZONE }));
};

// ======================
// TIMEZONE HELPERS
// ======================

// Robustly parse 'YYYY-M-D HH:mm:ss' or 'YYYY-MM-DD HH:mm:ss' (or with 'T') as Afghanistan local and return UTC Date
const parseAfghanistanLocalToUTC = (input) => {
  if (!input) return null;
  const str = String(input).trim();
  const [datePart, timePartRaw] = str.split(/[T ]/);
  if (!datePart) return null;
  const [yStr, mStr, dStr] = datePart.split('-');
  const [hStr = '00', minStr = '00', sStr = '00'] = (timePartRaw || '').split(':');
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1; // 0-based
  const day = Number(dStr);
  const hour = Number(hStr);
  const minute = Number(minStr);
  const second = Number(sStr);
  if ([year, monthIndex, day, hour, minute, second].some((n) => Number.isNaN(n))) return null;
  
  // Create a Date object treating the input as Afghanistan local time
  // Then convert to UTC by subtracting the Afghanistan offset
  const afghanDate = new Date(year, monthIndex, day, hour, minute, second, 0);
  const utcDate = new Date(afghanDate.getTime() - (AFGHANISTAN_UTC_OFFSET_MIN * 60 * 1000));
  return Number.isNaN(utcDate.getTime()) ? null : utcDate;
};

// Given a UTC Date, format as Afghanistan-local ISO-like string 'YYYY-MM-DDTHH:mm:ss'
const formatAfghanistanLocalISO = (date) => {
  if (!date) return null;
  const afMillis = date.getTime() + (AFGHANISTAN_UTC_OFFSET_MIN * 60 * 1000);
  const af = new Date(afMillis);
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = af.getUTCFullYear();
  const mm = pad(af.getUTCMonth() + 1);
  const dd = pad(af.getUTCDate());
  const HH = pad(af.getUTCHours());
  const MM = pad(af.getUTCMinutes());
  const SS = pad(af.getUTCSeconds());
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}:${SS}`;
};

// Get Afghanistan day range (start/end) in UTC for a given input (Date or string)
const getAfghanistanDayRangeUTC = (input) => {
  const str = String(input || '').trim();
  const [datePart] = str.split(/[T ]/);
  const parts = (datePart || '').split('-');
  
  // Handle both YYYY-M-D and YYYY-MM-DD formats
  const yStr = parts[0];
  const mStr = parts[1];
  const dStr = parts[2];
  
  const year = Number(yStr);
  const monthIndex = Number(mStr) - 1; // 0-based for Date.UTC
  const day = Number(dStr);
  
  console.log('🔍 Date parsing:', { input, datePart, year, monthIndex: monthIndex + 1, day });
  
  if ([year, monthIndex, day].some((n) => Number.isNaN(n))) {
    console.error('❌ Invalid date components:', { year, monthIndex, day });
    return { startOfDayUTC: null, endOfDayUTC: null };
  }
  
  const startUTCms = Date.UTC(year, monthIndex, day, 0, 0, 0, 0) - (AFGHANISTAN_UTC_OFFSET_MIN * 60 * 1000);
  const endUTCms = Date.UTC(year, monthIndex, day, 23, 59, 59, 999) - (AFGHANISTAN_UTC_OFFSET_MIN * 60 * 1000);
  
  const result = { startOfDayUTC: new Date(startUTCms), endOfDayUTC: new Date(endUTCms) };
  console.log('✅ Date parsed successfully:', result);
  
  return result;
};

const appendAttendanceAndClause = (existing, clause) => {
  if (!existing) return [clause];
  if (Array.isArray(existing)) return [...existing, clause];
  return [existing, clause];
};

const fetchScopedAttendanceIds = async (scope) => {
  if (
    !scope ||
    (scope.schoolId === null || scope.schoolId === undefined) &&
    (scope.branchId === null || scope.branchId === undefined) &&
    (scope.courseId === null || scope.courseId === undefined)
  ) {
    return null;
  }

  const filters = ['`deletedAt` IS NULL'];
  const params = [];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  if (params.length === 0) {
    return null;
  }

  const sql = `SELECT id FROM attendances WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.map((row) => (typeof row.id === 'bigint' ? row.id : BigInt(row.id)));
};

const ensureScopedAttendanceWhere = async (scope, baseWhere = {}) => {
  const where = { ...baseWhere };

  if (where.schoolId !== undefined && typeof where.schoolId !== 'bigint') {
    where.schoolId = BigInt(where.schoolId);
  }

  if (scope && scope.schoolId !== null && scope.schoolId !== undefined) {
    where.schoolId = BigInt(scope.schoolId);
  }

  const scopedIds = await fetchScopedAttendanceIds(scope);
  if (!scopedIds) {
    return { where, empty: false };
  }

  if (scopedIds.length === 0) {
    const scopedClause = { id: { in: [] } };
    where.AND = appendAttendanceAndClause(where.AND, scopedClause);
    return { where, empty: true };
  }

  const scopedClause = { id: { in: scopedIds } };
  where.AND = appendAttendanceAndClause(where.AND, scopedClause);
  return { where, empty: false };
};

const appendStudentAndClause = appendAttendanceAndClause;

const fetchScopedStudentIds = async (scope) => {
  if (
    !scope ||
    (scope.schoolId === null || scope.schoolId === undefined) &&
    (scope.branchId === null || scope.branchId === undefined) &&
    (scope.courseId === null || scope.courseId === undefined)
  ) {
    return null;
  }

  const filters = ['`deletedAt` IS NULL'];
  const params = [];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  if (params.length === 0) {
    return null;
  }

  const sql = `SELECT id FROM students WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.map((row) => (typeof row.id === 'bigint' ? row.id : BigInt(row.id)));
};

const ensureScopedStudentWhere = async (scope, baseWhere = {}) => {
  const where = { ...baseWhere };

  if (where.schoolId !== undefined && typeof where.schoolId !== 'bigint') {
    where.schoolId = BigInt(where.schoolId);
  }

  if (scope && scope.schoolId !== null && scope.schoolId !== undefined) {
    where.schoolId = BigInt(scope.schoolId);
  }

  const scopedIds = await fetchScopedStudentIds(scope);
  if (!scopedIds) {
    return { where, empty: false };
  }

  if (scopedIds.length === 0) {
    const scopedClause = { id: { in: [] } };
    where.AND = appendStudentAndClause(where.AND, scopedClause);
    return { where, empty: true };
  }

  const scopedClause = { id: { in: scopedIds } };
  where.AND = appendStudentAndClause(where.AND, scopedClause);
  return { where, empty: false };
};

const verifyAttendanceInScope = async (attendanceId, scope) => {
  if (!scope) return true;

  const filters = ['`id` = ?', '`deletedAt` IS NULL'];
  const params = [attendanceId.toString()];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  const sql = `SELECT id FROM attendances WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.length > 0;
};

const verifyStudentInManagedScope = async (studentId, scope) => {
  if (!scope) return true;
  
  if (!studentId) {
    console.warn('⚠️ verifyStudentInManagedScope: studentId is undefined or null');
    return false;
  }

  const filters = ['`id` = ?', '`deletedAt` IS NULL'];
  const params = [studentId.toString()];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  const sql = `SELECT id FROM students WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.length > 0;
};

const verifyClassInManagedScope = async (classId, scope) => {
  if (!scope) return true;

  const filters = ['`id` = ?', '`deletedAt` IS NULL'];
  const params = [classId.toString()];

  if (scope.schoolId !== null && scope.schoolId !== undefined) {
    filters.push('`schoolId` = ?');
    params.push(scope.schoolId.toString());
  }
  if (scope.branchId !== null && scope.branchId !== undefined) {
    filters.push('`branchId` = ?');
    params.push(scope.branchId.toString());
  }
  if (scope.courseId !== null && scope.courseId !== undefined) {
    filters.push('`courseId` = ?');
    params.push(scope.courseId.toString());
  }

  const sql = `SELECT id FROM classes WHERE ${filters.join(' AND ')}`;
  const rows = await prisma.$queryRawUnsafe(sql, ...params);
  return rows.length > 0;
};

const toBigIntSafe = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number') return BigInt(value);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      return BigInt(trimmed);
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const normalizeScopeWithSchool = (scope, fallbackSchoolId) => {
  const normalizedSchoolId = scope?.schoolId ?? fallbackSchoolId;
  return {
    schoolId: normalizedSchoolId,
    branchId: scope?.branchId ?? null,
    courseId: scope?.courseId ?? null,
    derivedBranchFromCourse: scope?.derivedBranchFromCourse ?? false
  };
};

const resolveParentChildIdsInScope = async (req, scope, schoolId) => {
  if (!req?.user || req.user.role !== 'PARENT') {
    return null;
  }

  const parent = await prisma.parent.findFirst({
    where: {
      userId: BigInt(req.user.id),
      schoolId,
      deletedAt: null
    },
    include: {
      students: {
        where: { deletedAt: null },
        select: { id: true }
      }
    }
  });

  if (!parent || parent.students.length === 0) {
    return [];
  }

  const accessibleIds = [];
  for (const student of parent.students) {
    if (!student?.id) continue;
    const inScope = await verifyStudentInManagedScope(student.id, scope);
    if (inScope) {
      accessibleIds.push(student.id);
    }
  }

  return accessibleIds;
};

/**
 * Check if current time is within mark-in window (7-8 AM Afghanistan time)
 */
const isMarkInTimeWindow = () => {
  const afghanTime = getAfghanistanTime();
  const hour = afghanTime.getHours();
  return hour >= ATTENDANCE_TIMES.MARK_IN_START && hour < ATTENDANCE_TIMES.MARK_IN_END;
};

/**
 * Check if current time is within mark-out window (12-1 PM Afghanistan time)
 */
const isMarkOutTimeWindow = () => {
  const afghanTime = getAfghanistanTime();
  const hour = afghanTime.getHours();
  return hour >= ATTENDANCE_TIMES.MARK_OUT_START && hour < ATTENDANCE_TIMES.MARK_OUT_END;
};

/**
 * Check if it's time to automatically mark absent students (after 9 AM)
 */
const isAutoAbsentTime = () => {
  const afghanTime = getAfghanistanTime();
  const hour = afghanTime.getHours();
  return hour >= ATTENDANCE_TIMES.AUTO_ABSENT_TIME;
};

/**
 * Get formatted Afghanistan time string
 */
const getFormattedAfghanTime = () => {
  const afghanTime = getAfghanistanTime();
  return afghanTime.toLocaleString('en-US', { 
    timeZone: AFGHANISTAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};

/**
 * Get all attendances with optional filtering
 */
export const getAllAttendances = async (req, res) => {
  try {
    const { 
      studentId, 
      classId, 
      date, 
      startDate,
      endDate,
      status,
      academicSessionId,
      schoolId = undefined,
      page = 1, 
      limit = 50 
    } = req.query;

    const scope = await resolveManagedScope(req);

    let resolvedSchoolId =
      (scope?.schoolId !== null && scope?.schoolId !== undefined) ? Number(scope.schoolId) :
      (schoolId !== undefined ? Number(schoolId) :
      (req.user?.schoolId ?? 1));

    const where = {
      schoolId: BigInt(resolvedSchoolId),
      deletedAt: null
    };

    // Parent access control - restrict to their children only
    if (req.user.role === 'PARENT') {
      // Get parent's children
      const parent = await prisma.parent.findFirst({
        where: {
          userId: BigInt(req.user.id),
          schoolId: BigInt(resolvedSchoolId),
          deletedAt: null
        },
        include: {
          students: {
            where: { deletedAt: null },
            select: { id: true }
          }
        }
      });

      if (!parent || parent.students.length === 0) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }

      // Filter to only parent's children
      const childIds = parent.students.map(student => student.id);
      where.studentId = { in: childIds };
    }

    if (studentId) where.studentId = BigInt(studentId);
    
    // Filter by class - use student relationship since attendance doesn't have direct classId
    if (classId) {
      where.student = {
        classId: BigInt(classId)
      };
    }
    
    // Handle date filtering - support both single date and date range
    if (startDate && endDate) {
      // Date range filtering
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else if (date) {
      // Single date filtering (existing functionality)
      const { startOfDayUTC, endOfDayUTC } = getAfghanistanDayRangeUTC(date);
      if (startOfDayUTC && endOfDayUTC) {
        where.date = { gte: startOfDayUTC, lte: endOfDayUTC };
      }
    }
    
    if (status) where.status = status;
    if (academicSessionId) where.academicSessionId = BigInt(academicSessionId);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const { where: scopedWhere, empty } = await ensureScopedAttendanceWhere(scope, where);
    if (empty) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        }
      });
    }

    const [attendances, total] = await Promise.all([
      prisma.attendance.findMany({
        where: scopedWhere,
        include: {
          student: {
            select: {
              id: true,
              uuid: true,
              rollNo: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  dariName: true
                }
              }
            }
          },
          class: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true
            }
          }
        },
        orderBy: { date: 'desc' },
        skip,
        take
      }),
      prisma.attendance.count({ where: scopedWhere })
    ]);

    // Convert BigInt values to regular numbers for JSON serialization
    const serializedAttendances = attendances.map(attendance => ({
      ...attendance,
      id: Number(attendance.id),
      studentId: attendance.studentId ? Number(attendance.studentId) : null,
      classId: attendance.classId ? Number(attendance.classId) : null,
      subjectId: attendance.subjectId ? Number(attendance.subjectId) : null,
      academicSessionId: attendance.academicSessionId ? Number(attendance.academicSessionId) : null,
      schoolId: attendance.schoolId ? Number(attendance.schoolId) : null,
      createdBy: attendance.createdBy ? Number(attendance.createdBy) : null,
      updatedBy: attendance.updatedBy ? Number(attendance.updatedBy) : null,
      student: attendance.student ? {
        ...attendance.student,
        id: Number(attendance.student.id),
        user: attendance.student.user ? {
          ...attendance.student.user
        } : null
      } : null,
      class: attendance.class ? {
        ...attendance.class,
        id: Number(attendance.class.id)
      } : null,
      subject: attendance.subject ? {
        ...attendance.subject,
        id: Number(attendance.subject.id)
      } : null,
      // Times formatted in Afghanistan local time
      date: attendance.date ? formatAfghanistanLocalISO(attendance.date) : null,
      inTime: attendance.inTime ? formatAfghanistanLocalISO(attendance.inTime) : null,
      outTime: attendance.outTime ? formatAfghanistanLocalISO(attendance.outTime) : null,
      // SMS Status fields
      smsInStatus: attendance.smsInStatus || null,
      smsInSentAt: attendance.smsInSentAt ? attendance.smsInSentAt.toISOString() : null,
      smsInError: attendance.smsInError || null,
      smsInAttempts: attendance.smsInAttempts || 0,
      smsInRequestId: attendance.smsInRequestId || null,
      smsOutStatus: attendance.smsOutStatus || null,
      smsOutSentAt: attendance.smsOutSentAt ? attendance.smsOutSentAt.toISOString() : null,
      smsOutError: attendance.smsOutError || null,
      smsOutAttempts: attendance.smsOutAttempts || 0,
      smsOutRequestId: attendance.smsOutRequestId || null
    }));

    res.json({
      success: true,
      message: 'Attendances retrieved successfully',
      data: {
        attendances: serializedAttendances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error in getAllAttendances:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve attendances',
      message: error.message
    });
  }
};

/**
 * Get attendance by ID
 */
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const scope = await resolveManagedScope(req);

    const inScope = await verifyAttendanceInScope(BigInt(id), scope);
    if (!inScope) {
      return res.status(404).json({
        success: false,
        error: 'Attendance not found',
        meta: { timestamp: new Date().toISOString() }
      });
    }
    
  const attendance = await prisma.attendance.findUnique({
      where: { id: BigInt(id) },
      include: {
        student: {
          select: {
            id: true,
            uuid: true,
            rollNo: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                dariName: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
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

    if (!attendance) {
      return createErrorResponse(res, 'Attendance not found', 404);
    }

    const formatted = {
      ...attendance,
      date: attendance.date ? formatAfghanistanLocalISO(attendance.date) : null,
      inTime: attendance.inTime ? formatAfghanistanLocalISO(attendance.inTime) : null,
      outTime: attendance.outTime ? formatAfghanistanLocalISO(attendance.outTime) : null
    };

    return createSuccessResponse(res, 'Attendance retrieved successfully', formatted);
  } catch (error) {
    console.error('Error in getAttendanceById:', error);
    return createErrorResponse(res, 'Failed to retrieve attendance', 500);
  }
};

/**
 * Create new attendance record
 */
export const createAttendance = async (req, res) => {
  try {
    const {
      studentId,
      classId,
      subjectId,
      date,
      status,
      inTime,
      outTime,
      remarks
    } = req.body;

    const scope = await resolveManagedScope(req);
    const schoolId = (scope?.schoolId ?? req.user.schoolId);
    // SCOPE FIX: Use actual branchId and courseId from scope
    const branchId = scope?.branchId ? Number(scope.branchId) : null;
    const courseId = scope?.courseId ? Number(scope.courseId) : null;
    const createdBy = req.user.id;
    console.log('🔍 Attendance scope:', { schoolId, branchId, courseId });

    // Validate required fields
    if (!studentId || !classId || !date || !status) {
      return createErrorResponse(res, 'Missing required fields: studentId, classId, date, status', 400);
    }

    // Check if attendance already exists for this student, class, subject, and date
    // Normalize incoming datetime and match by day range
    const parsedDate = new Date(String(date).replace(' ', 'T'));
    const cStart = new Date(parsedDate); cStart.setHours(0,0,0,0);
    const cEnd = new Date(parsedDate);   cEnd.setHours(23,59,59,999);
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: BigInt(studentId),
        classId: BigInt(classId),
        subjectId: subjectId ? BigInt(subjectId) : null,
        date: { gte: cStart, lte: cEnd },
        schoolId: BigInt(schoolId),
        ...(branchId ? { branchId: BigInt(branchId) } : {}),
        ...(courseId ? { courseId: BigInt(courseId) } : {}),
        deletedAt: null
      }
    });

    if (existingAttendance) {
      return createErrorResponse(res, 'Attendance record already exists for this student, class, and date', 409);
    }

    // Get academic session for this date
    const attendanceDateUTC = parseAfghanistanLocalToUTC(parsedDate);
    const academicSession = await getSessionByDate(schoolId, attendanceDateUTC);
    const academicSessionId = academicSession ? BigInt(academicSession.id) : null;

    // Create attendance record (store UTC based on Afghanistan local input)
  const attendance = await prisma.attendance.create({
      data: {
        date: attendanceDateUTC,
        status,
        inTime: inTime ? parseAfghanistanLocalToUTC(inTime) : null,
        outTime: outTime ? parseAfghanistanLocalToUTC(outTime) : null,
        remarks,
        studentId: BigInt(studentId),
        classId: BigInt(classId),
        subjectId: subjectId ? BigInt(subjectId) : null,
        academicSessionId,
        schoolId: BigInt(schoolId),
        branchId: branchId ? BigInt(branchId) : null,
        courseId: courseId ? BigInt(courseId) : null,
        createdBy: BigInt(createdBy)
      },
      include: {
        student: {
          select: {
            id: true,
            rollNo: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Format times as Afghanistan local in response
    const responseAttendance = {
      ...attendance,
      date: attendance.date ? formatAfghanistanLocalISO(attendance.date) : null,
      inTime: attendance.inTime ? formatAfghanistanLocalISO(attendance.inTime) : null,
      outTime: attendance.outTime ? formatAfghanistanLocalISO(attendance.outTime) : null
    };

    return createSuccessResponse(res, 'Attendance created successfully', responseAttendance, 201);
  } catch (error) {
    console.error('Error in createAttendance:', error);
    return createErrorResponse(res, 'Failed to create attendance', 500);
  }
};

/**
 * Update attendance record
 */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      inTime,
      outTime,
      remarks
    } = req.body;

    const updatedBy = req.user.id;
    const scope = await resolveManagedScope(req);

    const inScope = await verifyAttendanceInScope(BigInt(id), scope);
    if (!inScope) {
      return createErrorResponse(res, 'Attendance not found', 404);
    }

    // Check if attendance exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: BigInt(id) }
    });

    if (!existingAttendance) {
      return createErrorResponse(res, 'Attendance not found', 404);
    }

    // Update attendance (normalize times if provided; store UTC)
  const attendance = await prisma.attendance.update({
      where: { id: BigInt(id) },
      data: {
        status,
        inTime: inTime ? parseAfghanistanLocalToUTC(inTime) : undefined,
        outTime: outTime ? parseAfghanistanLocalToUTC(outTime) : undefined,
        remarks,
        updatedBy: BigInt(updatedBy)
      },
      include: {
        student: {
          select: {
            id: true,
            rollNo: true,
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        class: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const responseAttendance = {
      ...attendance,
      date: attendance.date ? formatAfghanistanLocalISO(attendance.date) : null,
      inTime: attendance.inTime ? formatAfghanistanLocalISO(attendance.inTime) : null,
      outTime: attendance.outTime ? formatAfghanistanLocalISO(attendance.outTime) : null
    };
    return createSuccessResponse(res, 'Attendance updated successfully', responseAttendance);
  } catch (error) {
    console.error('Error in updateAttendance:', error);
    return createErrorResponse(res, 'Failed to update attendance', 500);
  }
};

/**
 * Mark student in-time (arrival)
 */
export async function markInTime(req, res) {
  try {
    console.log('🚀 markInTime endpoint called');
    console.log('📝 Request body:', req.body);
    
    const { studentId, employeeId, cardNo, subjectId, date } = req.body;
    const scope = await resolveManagedScope(req);
    const schoolId = Number(scope?.schoolId ?? req.user?.schoolId ?? 1);
    // SCOPE FIX: Use actual branchId and courseId from scope
    const branchId = scope?.branchId ? Number(scope.branchId) : null;
    const courseId = scope?.courseId ? Number(scope.courseId) : null;
    const createdBy = req.user?.id || 1;
    console.log('🔍 Mark-in scope:', { schoolId, branchId, courseId });

    const userIdBigInt = toBigIntSafe(employeeId ?? studentId);
    const studentIdBigInt = toBigIntSafe(studentId);
    const branchIdBigInt = null;
    const courseIdBigInt = toBigIntSafe(courseId);
    const subjectIdBigInt = toBigIntSafe(subjectId);
    const normalizedCardNo = cardNo ? cardNo.toString() : null;
    
    console.log('🔍 Extracted values:', { studentId, employeeId, cardNo, subjectId, date });
    
    // Validate required fields - either employeeId, studentId, or cardNo must be provided
    if ((!employeeId && !studentId && !cardNo) || !date) {
      console.log('❌ Missing required fields');
      return createErrorResponse(res, 400, 'Missing required fields: (employeeId, studentId, or cardNo) and date');
    }

    const currentTime = new Date();
    const attendanceDateUTC = parseAfghanistanLocalToUTC(date); // store in UTC
    const { startOfDayUTC: startOfDay, endOfDayUTC: endOfDay } = getAfghanistanDayRangeUTC(date);

    // NO TIME RESTRICTIONS - Accept attendance at any time
    const markInStatus = 'PRESENT'; // Always mark as PRESENT when marking in
    console.log('✅ No time restrictions - marking attendance');
    console.log('🏷️ Status:', markInStatus);
    console.log('📅 Attendance date (UTC stored, Kabul local shown):', formatAfghanistanLocalISO(attendanceDateUTC));
    console.log('🏫 School ID:', schoolId);
    console.log('👤 Created by:', createdBy);

    // Build where clause
    let whereClause = {
      schoolId: BigInt(schoolId),
      deletedAt: null,
      user: {
        status: 'ACTIVE'
      }
    };
    
    let student = null;
    const studentInclude = {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phone: true
        }
      },
      parent: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        }
      },
      class: {
        select: {
          id: true,
          name: true
        }
      }
    };

    const shouldUseCardLookup =
      (studentIdBigInt !== null && studentIdBigInt === BigInt(1)) ||
      (userIdBigInt !== null && userIdBigInt === BigInt(1));

    const lookupByCard = async (cardValue) => {
      if (!cardValue) return null;

      console.log('🔍 Finding student by cardNo:', cardValue);
      const exactMatch = await prisma.student.findFirst({
        where: {
          ...whereClause,
          cardNo: cardValue
        },
        include: studentInclude
      });

      if (exactMatch) {
        return exactMatch;
      }

      if (cardValue.length >= 10) {
        console.log('🔍 Exact card match not found, trying match by first 10 digits...');
        const firstTenDigits = cardValue.substring(0, 10);
        console.log('🔢 First 10 digits to match:', firstTenDigits);

        const allStudents = await prisma.student.findMany({
          where: whereClause,
          include: studentInclude
        });

        const fallbackMatch = allStudents.find(std => {
          if (!std.cardNo) return false;
          const stdCard = std.cardNo.toString();
          return stdCard.length >= 10 && stdCard.substring(0, 10) === firstTenDigits;
        });

        if (fallbackMatch) {
          console.log(`✅ Found match with first 10 digits: "${firstTenDigits}"`);
          return fallbackMatch;
        }
      }

      return null;
    };

    // Prefer card lookup when provided
    if (shouldUseCardLookup) {
      if (!normalizedCardNo) {
        console.log('⚠️ Special ID provided but card number missing - trying fallback to userId lookup');
        // Don't return error immediately, try to find by userId first
      } else {
        student = await lookupByCard(normalizedCardNo);

        if (!student) {
          console.log('❌ Student not found using provided card number for special ID lookup - trying fallback');
        }
      }
    } else {
      if (normalizedCardNo) {
        student = await lookupByCard(normalizedCardNo);
      }
    }

    // Try userId lookup (even if shouldUseCardLookup is true, as fallback when card is missing)
    if (!student && userIdBigInt !== null) {
      console.log('🔍 Finding student by userId (employeeId/studentId treated as userId):', userIdBigInt.toString());
      student = await prisma.student.findFirst({
        where: {
          ...whereClause,
          userId: userIdBigInt
        },
        include: studentInclude
      });
    }

    // Only try studentId lookup if shouldUseCardLookup is false (normal case)
    if (!student && !shouldUseCardLookup && studentIdBigInt !== null) {
      console.log('🔍 Finding student by studentId:', studentIdBigInt.toString());
      student = await prisma.student.findFirst({
        where: {
          ...whereClause,
          id: studentIdBigInt
        },
        include: studentInclude
      });
    }

    // If we still haven't found and shouldUseCardLookup was true but card was missing, return error
    if (!student && shouldUseCardLookup && !normalizedCardNo) {
      console.log('❌ Special ID provided but card number missing and no student found by userId');
      return createErrorResponse(res, 400, 'Card number is required when using shared studentId/employeeId 1');
    }

    if (!student) {
      const searchType = (employeeId || studentId) ? 'userId (employeeId/studentId)' : 'cardNo';
      const searchValue = employeeId || studentId || cardNo;
      console.log(`❌ Student not found with ${searchType}:`, searchValue);
      return createErrorResponse(res, 404, `Student with ${searchType} ${searchValue} not found`);
    }

    const studentAccessible = await verifyStudentInManagedScope(student.id, scope);
    if (!studentAccessible) {
      return createErrorResponse(res, 404, 'Student not found in the selected context');
    }

    console.log('✅ Student found:', {
      id: student.id,
      rollNo: student.rollNo,
      name: `${student.user.firstName} ${student.user.lastName}`
    });

    // Check if attendance record exists for the same day
    console.log('🔍 Checking if attendance record exists...');
    const baseAttendanceWhere = {
      studentId: student.id,
      classId: student.class?.id || null,
      subjectId: subjectIdBigInt,
      date: { gte: startOfDay, lte: endOfDay },
      deletedAt: null
    };

    const { where: scopedAttendanceWhere, empty: noAccessibleAttendance } = await ensureScopedAttendanceWhere(
      scope,
      baseAttendanceWhere
    );

    let attendance = null;
    if (!noAccessibleAttendance) {
      attendance = await prisma.attendance.findFirst({
        where: scopedAttendanceWhere
      });
    }

    if (attendance) {
      // AUTO-TOGGLE: If inTime exists, this is the second request - mark OUT instead
      if (attendance.inTime) {
        console.log('🔄 Student already marked in today - AUTO-CONVERTING to MARK-OUT');
        console.log('📝 Existing inTime:', formatAfghanistanLocalISO(attendance.inTime));
        console.log('✨ Second request of the day - marking OUT automatically');
        
        // Check if already marked out
        if (attendance.outTime) {
          console.log('⚠️ Student already marked out today');
          console.log('📝 Existing outTime:', formatAfghanistanLocalISO(attendance.outTime));
          return createErrorResponse(res, 400, `Student already marked out at ${formatAfghanistanLocalISO(attendance.outTime)}. Attendance is complete for today.`);
        }
        
        // Auto-redirect to mark-out logic
        console.log('🔀 Auto-redirecting to markOutTime...');
        return markOutTime(req, res, { autoConvertedFromMarkIn: true });
      }
      
      console.log('📝 Updating existing attendance record with mark-in:', attendance.id);
      // Update existing record with in-time using actual current timestamp
      attendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          inTime: currentTime,
          status: markInStatus
        }
      });
      console.log('✅ Attendance record updated successfully with mark-in');
    } else {
      console.log('🆕 Creating new attendance record...');
      // Get academic session for this date
      const academicSession = await getSessionByDate(schoolId, attendanceDateUTC);
      const academicSessionId = academicSession ? BigInt(academicSession.id) : null;
      
      // Create new record using actual current timestamp for inTime
      attendance = await prisma.attendance.create({
        data: {
          date: attendanceDateUTC, // UTC based on Afghanistan local
              status: markInStatus,
          inTime: currentTime,
          studentId: student.id,
          classId: student.class?.id || null,
          ...(subjectIdBigInt !== null ? { subjectId: subjectIdBigInt } : {}),
          academicSessionId,
          schoolId: BigInt(schoolId),
          createdBy: BigInt(createdBy)
        }
      });
      console.log('✅ New attendance record created with ID:', attendance.id);
    }

    // Convert BigInt values to regular numbers and dates to ISO strings for JSON serialization
    console.log('🔄 Serializing attendance data...');
    const serializedAttendance = {
      ...attendance,
      id: Number(attendance.id),
      studentId: attendance.studentId ? Number(attendance.studentId) : null,
      classId: attendance.classId ? Number(attendance.classId) : null,
      subjectId: attendance.subjectId ? Number(attendance.subjectId) : null,
      academicSessionId: attendance.academicSessionId ? Number(attendance.academicSessionId) : null,
      schoolId: attendance.schoolId ? Number(attendance.schoolId) : null,
      createdBy: attendance.createdBy ? Number(attendance.createdBy) : null,
      updatedBy: attendance.updatedBy ? Number(attendance.updatedBy) : null,
      date: attendance.date ? formatAfghanistanLocalISO(attendance.date) : null,
      inTime: attendance.inTime ? formatAfghanistanLocalISO(attendance.inTime) : null,
      outTime: attendance.outTime ? formatAfghanistanLocalISO(attendance.outTime) : null,
      createdAt: attendance.createdAt ? attendance.createdAt.toISOString() : null,
      updatedAt: attendance.updatedAt ? attendance.updatedAt.toISOString() : null
    };
    console.log('✅ Data serialized successfully');

    // Send SMS notification and track status
    let smsInStatus = 'NOT_SENT';
    let smsInError = null;
    let smsInRequestId = null;
    let smsInSentAt = null;
    
    try {
      console.log('🔍 Starting SMS process for student ID:', studentId);
      console.log('📱 About to call SMS service...');
      
      const classInfo = student.class;
      const recipientPhone = student?.parent?.user?.phone || student?.user?.phone || null;
      
      if (!student || !recipientPhone) {
        console.log('⚠️ No recipient phone found - SMS not sent');
        smsInStatus = 'NO_PHONE';
        smsInError = 'No phone number available for student or parent';
      } else {
        console.log('👤 Student found:', {
          name: `${student.user.firstName} ${student.user.lastName}`,
          phone: recipientPhone,
          parentPhoneUsed: !!student?.parent?.user?.phone
        });
        
        console.log('📱 Calling SMS service...');
        
        // Send SMS and wait for result to track status
        const smsResult = await smsService.sendAttendanceSMS(
          {
            name: `${student.user.firstName} ${student.user.lastName}`,
            phone: recipientPhone
          },
          {
            inTime: formatAfghanistanLocalISO(currentTime),
            date: formatAfghanistanLocalISO(attendanceDateUTC),
            className: classInfo?.name || 'Unknown Class',
            status: markInStatus
          },
          'inTime' // Use mark-in template (campaign 403)
        );
        
        if (smsResult && smsResult.success) {
          console.log('✅ SMS sent successfully!');
          smsInStatus = 'SENT';
          smsInSentAt = new Date();
          smsInRequestId = smsResult.data?.RequestID || smsResult.campaignId || null;
        } else if (smsResult === null) {
          console.log('❌ SMS failed - service returned null');
          smsInStatus = 'FAILED';
          smsInError = 'SMS service returned null - check logs for details';
        } else {
          console.log('❌ SMS failed with error');
          smsInStatus = 'FAILED';
          smsInError = smsResult.error || smsResult.warning || 'Unknown SMS error';
        }
      }
    } catch (smsError) {
      console.error('❌ SMS Error:', smsError.message);
      smsInStatus = 'FAILED';
      smsInError = smsError.message || 'Failed to send SMS';
    }

    // Update attendance record with SMS status
    try {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          smsInStatus: smsInStatus,
          smsInError: smsInError,
          smsInSentAt: smsInSentAt,
          smsInRequestId: smsInRequestId,
          smsInAttempts: 1,
          smsInSource: 'AUTO', // Automatically sent by mark-in endpoint
          smsInSentBy: null // No manual user trigger
        }
      });
      console.log('✅ SMS status updated in database:', smsInStatus);
      
      // Update serialized attendance with SMS info
      serializedAttendance.smsInStatus = smsInStatus;
      serializedAttendance.smsInError = smsInError;
      serializedAttendance.smsInSentAt = smsInSentAt ? smsInSentAt.toISOString() : null;
      serializedAttendance.smsInSource = 'AUTO';
    } catch (updateError) {
      console.error('❌ Failed to update SMS status in database:', updateError.message);
    }

    // ===== AUDIT LOG, EVENTS & NOTIFICATIONS =====
    
    // 1. Create audit log
    try {
      await createAuditLog({
        action: 'MARK_IN',
        entityType: 'Attendance',
        entityId: attendance.id,
        userId: BigInt(createdBy),
        schoolId: BigInt(schoolId),
        newData: JSON.stringify({
          studentId: student.id.toString(),
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          classId: student.class?.id?.toString(),
          className: student.class?.name,
          date: formatAfghanistanLocalISO(attendanceDateUTC),
          inTime: formatAfghanistanLocalISO(currentTime),
          status: attendance.status
        }),
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });
      console.log('✅ Audit log created for mark in');
    } catch (auditError) {
      console.error('❌ Failed to create audit log for mark in:', auditError);
    }
    
    // 2. Create student event
    try {
      const studentEventService = new StudentEventService();
      await studentEventService.createStudentAttendanceEvent(
        student.id,
        {
          date: attendanceDateUTC,
          status: attendance.status,
          classId: student.class?.id,
          inTime: currentTime
        },
        BigInt(createdBy),
        BigInt(schoolId)
      );
      console.log('✅ Student event created for attendance');
    } catch (eventError) {
      console.error('❌ Failed to create student event for attendance:', eventError);
    }
    
    // 3. Send notifications if late arrival
    try {
      const inTimeHour = afghanTime.getHours();
      const inTimeMinute = afghanTime.getMinutes();
      const isLate = inTimeHour > 8 || (inTimeHour === 8 && inTimeMinute > 30);

      if (isLate) {
        await createAttendanceNotification(
          'late',
          {
            id: attendance.id,
            studentId: student.id,
            student,
            classId: student.class?.id || student.classId,
            class: student.class,
        status: markInStatus,
            date: attendanceDateUTC,
            inTime: currentTime,
            isLate: true,
            remarks: attendance.remarks
          },
          BigInt(createdBy),
          BigInt(schoolId),
          req.user?.createdByOwnerId
        );
      }
    } catch (notifError) {
      console.error('❌ Failed to send late arrival notification:', notifError);
    }

    console.log('📤 Sending success response...');
    res.json({
      success: true,
      message: 'In-time marked successfully',
      data: serializedAttendance
    });
    console.log('✅ Response sent successfully');
  } catch (error) {
    console.error('Error in markInTime:', error);
    return createErrorResponse(res, 500, 'Failed to mark in-time');
  }
}

/**
 * Mark student out-time (departure)
 */
export async function markOutTime(req, res, options = {}) {
  try {
    console.log('🚀 markOutTime endpoint called');
    console.log('📝 Request body:', req.body);
    const autoConvertedFromMarkIn = options?.autoConvertedFromMarkIn || req.__autoConvertedFromMarkIn || false;
    
    if (autoConvertedFromMarkIn) {
      console.log('✨ Processing mark-out logic for request auto-converted from mark-in endpoint (12:00 PM - 1:00 PM)');
    }
    
    const { studentId, employeeId, cardNo, subjectId, date } = req.body;
    const scope = await resolveManagedScope(req);
    const schoolId = Number(scope?.schoolId ?? req.user?.schoolId ?? 1);
    const branchId = scope?.branchId ?? null;
    const courseId = scope?.courseId ?? null;
    const updatedBy = req.user?.id || 1; // Default user ID for testing

    const userIdBigInt = toBigIntSafe(employeeId ?? studentId);
    const studentIdBigInt = toBigIntSafe(studentId);
    const branchIdBigInt = toBigIntSafe(branchId);
    const courseIdBigInt = toBigIntSafe(courseId);
    const subjectIdBigInt = toBigIntSafe(subjectId);
    const normalizedCardNo = cardNo ? cardNo.toString() : null;

    console.log('🔍 Extracted values:', { studentId, employeeId, cardNo, subjectId, date });

    // Validate required fields - either employeeId, studentId, or cardNo must be provided
    if ((!employeeId && !studentId && !cardNo) || !date) {
      console.log('❌ Missing required fields');
      return createErrorResponse(res, 400, 'Missing required fields: (employeeId, studentId, or cardNo) and date');
    }

    const currentTime = new Date();
    const attendanceDateUTC = parseAfghanistanLocalToUTC(date); // store in UTC
    const { startOfDayUTC: startOfDay, endOfDayUTC: endOfDay } = getAfghanistanDayRangeUTC(date);

    // NO TIME RESTRICTIONS - Accept mark-out at any time
    console.log('✅ No time restrictions - processing mark-out');

    // Build where clause and helpers shared across flows
    const whereClause = {
      schoolId: BigInt(schoolId),
      deletedAt: null,
      user: {
        status: 'ACTIVE'
      }
    };
    
    const studentInclude = {
      user: {
        select: {
          firstName: true,
          lastName: true,
          phone: true
        }
      },
      parent: {
        select: {
          id: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        }
      },
      class: {
        select: {
          id: true,
          name: true
        }
      }
    };

    const shouldUseCardLookup =
      (studentIdBigInt !== null && studentIdBigInt === BigInt(1)) ||
      (userIdBigInt !== null && userIdBigInt === BigInt(1));

    const lookupByCard = async (cardValue) => {
      if (!cardValue) return null;

      console.log('🔍 Finding student by cardNo:', cardValue);

      const exactMatch = await prisma.student.findFirst({
        where: {
          ...whereClause,
          cardNo: cardValue
        },
        include: studentInclude
      });

      if (exactMatch) {
        return exactMatch;
      }

      if (cardValue.length >= 10) {
        console.log('🔍 Exact card match not found, trying first 10 digits fallback...');
        const firstTenDigits = cardValue.substring(0, 10);
        console.log('🔢 First 10 digits to match:', firstTenDigits);

        const candidates = await prisma.student.findMany({
          where: whereClause,
          include: studentInclude
        });

        const fallbackMatch = candidates.find(std => {
          if (!std.cardNo) return false;
          const stdCard = std.cardNo.toString();
          return stdCard.length >= 10 && stdCard.substring(0, 10) === firstTenDigits;
        });

        if (fallbackMatch) {
          console.log(`✅ Found fallback match with first 10 digits: "${firstTenDigits}"`);
          return fallbackMatch;
        }
      }

      return null;
    };

    const findStudentRecord = async () => {
      if (shouldUseCardLookup) {
        if (!normalizedCardNo) {
          console.log('⚠️ Special ID provided but card number missing - trying fallback to userId lookup');
          // Don't return error immediately, try to find by userId first
        } else {
          const byCard = await lookupByCard(normalizedCardNo);
          if (byCard) {
            return byCard;
          }
          console.log('❌ Student not found using provided card number for special ID lookup - trying fallback');
        }
      }

      let cardToUse = normalizedCardNo;

      if (cardToUse && !shouldUseCardLookup) {
        const byCard = await lookupByCard(cardToUse);
        if (byCard) return byCard;
      }

      // Try userId lookup (even if shouldUseCardLookup is true, as fallback when card is missing)
      if (userIdBigInt !== null) {
        console.log('🔍 Finding student by userId (employeeId/studentId treated as userId):', userIdBigInt.toString());
        const byUserId = await prisma.student.findFirst({
          where: {
            ...whereClause,
            userId: userIdBigInt
          },
          include: studentInclude
        });
        if (byUserId) {
          return byUserId;
        }
      }

      // Only try studentId lookup if shouldUseCardLookup is false (normal case)
      if (!shouldUseCardLookup && studentIdBigInt !== null) {
        console.log('🔍 Finding student by studentId:', studentIdBigInt.toString());
        const byStudentId = await prisma.student.findFirst({
          where: {
            ...whereClause,
            id: studentIdBigInt
          },
          include: studentInclude
        });
        if (byStudentId) {
          return byStudentId;
        }
      }

      // If we still haven't found and shouldUseCardLookup was true but card was missing, return error
      if (shouldUseCardLookup && !normalizedCardNo) {
        console.log('❌ Special ID provided but card number missing and no student found by userId');
        return { error: 'CARD_REQUIRED', message: 'Card number is required when using shared studentId/employeeId 1' };
      }

      if (!cardToUse && normalizedCardNo) {
        return lookupByCard(normalizedCardNo);
      }

      return null;
    };
    
    // NO TIME-BASED AUTO-CONVERSION - Process mark-out directly
    console.log('📅 Attendance date (UTC stored, Kabul local shown):', formatAfghanistanLocalISO(attendanceDateUTC));
    console.log('🏫 School ID:', schoolId);
    console.log('👤 Updated by:', updatedBy);

    const studentResult = await findStudentRecord();

    if (studentResult?.error === 'CARD_REQUIRED') {
      return createErrorResponse(res, 400, studentResult.message);
    }

    if (studentResult?.error === 'CARD_NOT_FOUND') {
      return createErrorResponse(res, 404, studentResult.message);
    }

    const student = studentResult;

    if (!student) {
      const searchType = (employeeId || studentId) ? 'userId (employeeId/studentId)' : 'cardNo';
      const searchValue = employeeId || studentId || cardNo;
      console.log(`❌ Student not found with ${searchType}:`, searchValue);
      return createErrorResponse(res, 404, `Student with ${searchType} ${searchValue} not found`);
    }

    const studentAccessible = await verifyStudentInManagedScope(student.id, scope);
    if (!studentAccessible) {
      return createErrorResponse(res, 404, 'Student not found in the selected context');
    }

    console.log('✅ Student found:', {
      id: student.id,
      rollNo: student.rollNo,
      name: `${student.user.firstName} ${student.user.lastName}`
    });

    // Find existing attendance record for the same day
    const baseAttendanceWhere = {
      studentId: student.id,
      classId: student.class?.id || null,
      subjectId: subjectIdBigInt,
      date: { gte: startOfDay, lte: endOfDay },
      schoolId: BigInt(schoolId),
      deletedAt: null
    };

    const {
      where: scopedAttendanceWhere,
      empty: attendanceOutOfScope
    } = await ensureScopedAttendanceWhere(scope, baseAttendanceWhere);

    let attendance = null;
    if (!attendanceOutOfScope) {
      attendance = await prisma.attendance.findFirst({
        where: scopedAttendanceWhere
      });
    }

    let updatedAttendance;
    
    if (!attendance) {
      // No existing attendance record - auto-create one with mark-out
      console.log('⚠️ No attendance record found - auto-creating with mark-out');
      console.log('💡 Student did not mark-in today, creating record with only outTime');
      console.log('📅 Date to use:', attendanceDateUTC);
      
      // Get academic session for today (make it optional - don't fail if session lookup fails)
      let session = null;
      try {
        if (attendanceDateUTC && !isNaN(attendanceDateUTC.getTime())) {
          session = await getSessionByDate(schoolId, attendanceDateUTC);
          console.log('📚 Session found:', session?.id || 'No session');
        } else {
          console.log('⚠️ Invalid date for session lookup, skipping');
        }
      } catch (sessionError) {
        console.log('⚠️ Failed to get session (non-critical):', sessionError.message);
      }
      const sessionId = session?.id ? BigInt(session.id) : null;
      
      const markOutCreateData = {
        studentId: student.id,
        classId: student.class?.id || null,
        date: attendanceDateUTC,
        inTime: null, // No mark-in time
        outTime: currentTime,
        status: 'LATE', // Mark as LATE since they didn't mark in properly
        academicSessionId: sessionId,
        schoolId: BigInt(schoolId),
        createdBy: BigInt(updatedBy),
        updatedBy: BigInt(updatedBy),
        deletedAt: null
      };

      if (subjectIdBigInt !== null) {
        markOutCreateData.subjectId = subjectIdBigInt;
      }
      updatedAttendance = await prisma.attendance.create({
        data: markOutCreateData
      });
      
      console.log('✅ Auto-created attendance record with ID:', updatedAttendance.id);
    } else {
      // Check if outTime already exists - prevent duplicate mark-out requests
      if (attendance.outTime) {
        console.log('⚠️ Mark-out already exists for this student today');
        console.log('📝 Existing outTime:', formatAfghanistanLocalISO(attendance.outTime));
        console.log('🚫 Rejecting duplicate mark-out request');
        return createErrorResponse(res, 400, `Student already marked out at ${formatAfghanistanLocalISO(attendance.outTime)}. Duplicate mark-out requests are not allowed.`);
      }
      
      // Update existing attendance record with out-time using actual current timestamp
      console.log('✅ Existing attendance record found - updating with mark-out');
      const shouldMarkLate = !attendance.inTime;
      updatedAttendance = await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          outTime: currentTime,
          updatedBy: BigInt(updatedBy),
          ...(shouldMarkLate ? { status: 'LATE' } : {}),
          ...(courseIdBigInt !== null ? { courseId: courseIdBigInt } : {})
        }
      });
    }

    // Send SMS notification for out-time and track status
    let smsOutStatus = 'NOT_SENT';
    let smsOutError = null;
    let smsOutRequestId = null;
    let smsOutSentAt = null;
    
    try {
      console.log('🔍 Starting SMS process for student ID:', studentId);
      console.log('📱 About to call SMS service...');
      
      const recipientPhone = student?.parent?.user?.phone || student?.user?.phone || null;
      
      if (!student || !recipientPhone) {
        console.log('⚠️ No recipient phone found - SMS not sent');
        smsOutStatus = 'NO_PHONE';
        smsOutError = 'No phone number available for student or parent';
      } else {
        // Determine status based on whether inTime exists
        const departureStatus = !attendance || !attendance.inTime ? 'LATE' : 'DEPARTED';
        
        console.log('📱 Calling SMS service for out-time...');
        
        // Send SMS and wait for result to track status
        const smsResult = await smsService.sendAttendanceSMS(
          {
            name: `${student.user.firstName} ${student.user.lastName}`,
            phone: recipientPhone
          },
          {
            outTime: formatAfghanistanLocalISO(currentTime),
            date: formatAfghanistanLocalISO(attendanceDateUTC),
            className: student.class?.name || 'Unknown Class',
            status: departureStatus,
            note: !attendance ? 'No mark-in recorded today' : undefined
          },
          'outTime' // Use mark-out template (campaign 404)
        );
        
        if (smsResult && smsResult.success) {
          console.log('✅ Out-time SMS sent successfully!');
          smsOutStatus = 'SENT';
          smsOutSentAt = new Date();
          smsOutRequestId = smsResult.data?.RequestID || smsResult.campaignId || null;
        } else if (smsResult === null) {
          console.log('❌ Out-time SMS failed - service returned null');
          smsOutStatus = 'FAILED';
          smsOutError = 'SMS service returned null - check logs for details';
        } else {
          console.log('❌ Out-time SMS failed with error');
          smsOutStatus = 'FAILED';
          smsOutError = smsResult.error || smsResult.warning || 'Unknown SMS error';
        }
      }
    } catch (smsError) {
      console.error('❌ Out-time SMS Error:', smsError.message);
      smsOutStatus = 'FAILED';
      smsOutError = smsError.message || 'Failed to send SMS';
    }

    // Update attendance record with out-time SMS status
    try {
      updatedAttendance = await prisma.attendance.update({
        where: { id: updatedAttendance.id },
        data: {
          smsOutStatus: smsOutStatus,
          smsOutError: smsOutError,
          smsOutSentAt: smsOutSentAt,
          smsOutRequestId: smsOutRequestId,
          smsOutAttempts: 1,
          smsOutSource: 'AUTO', // Automatically sent by mark-out endpoint
          smsOutSentBy: null // No manual user trigger
        }
      });
      console.log('✅ Out-time SMS status updated in database:', smsOutStatus);
    } catch (updateError) {
      console.error('❌ Failed to update out-time SMS status in database:', updateError.message);
    }

    // ===== AUDIT LOG =====
    
    // Create audit log with oldData tracking (this is an UPDATE operation)
    try {
      await createAuditLog({
        action: 'MARK_OUT',
        entityType: 'Attendance',
        entityId: updatedAttendance.id,
        userId: BigInt(updatedBy),
        schoolId: BigInt(schoolId),
        oldData: attendance ? JSON.stringify({
          id: attendance.id.toString(),
          inTime: attendance.inTime ? attendance.inTime.toISOString() : null,
          outTime: attendance.outTime ? attendance.outTime.toISOString() : null,
          status: attendance.status
        }) : null,
        newData: JSON.stringify({
          studentId: student.id.toString(),
          studentName: `${student.user.firstName} ${student.user.lastName}`,
          classId: student.class?.id?.toString(),
          className: student.class?.name,
          date: updatedAttendance.date ? updatedAttendance.date.toISOString() : null,
          inTime: updatedAttendance.inTime ? updatedAttendance.inTime.toISOString() : null,
          outTime: updatedAttendance.outTime.toISOString(),
          status: updatedAttendance.status
        }),
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });
      console.log('✅ Audit log created for mark out');
    } catch (auditError) {
      console.error('❌ Failed to create audit log for mark out:', auditError);
    }

    // Serialize the attendance data to handle BigInt values and dates
    const serializedAttendance = {
      ...updatedAttendance,
      id: Number(updatedAttendance.id),
      studentId: Number(updatedAttendance.studentId),
      classId: Number(updatedAttendance.classId),
      subjectId: updatedAttendance.subjectId ? Number(updatedAttendance.subjectId) : null,
      academicSessionId: updatedAttendance.academicSessionId ? Number(updatedAttendance.academicSessionId) : null,
      schoolId: Number(updatedAttendance.schoolId),
      createdBy: Number(updatedAttendance.createdBy),
      updatedBy: Number(updatedAttendance.updatedBy),
      date: updatedAttendance.date ? updatedAttendance.date.toISOString() : null,
      inTime: updatedAttendance.inTime ? updatedAttendance.inTime.toISOString() : null,
      outTime: updatedAttendance.outTime ? updatedAttendance.outTime.toISOString() : null,
      createdAt: updatedAttendance.createdAt ? updatedAttendance.createdAt.toISOString() : null,
      updatedAt: updatedAttendance.updatedAt ? updatedAttendance.updatedAt.toISOString() : null,
      // Include SMS status in response
      smsOutStatus: smsOutStatus,
      smsOutError: smsOutError,
      smsOutSentAt: smsOutSentAt ? smsOutSentAt.toISOString() : null
    };

    const successMessage = autoConvertedFromMarkIn
      ? 'Mark-in request received during midday hours (12:00-1:00 PM) - automatically marked OUT instead'
      : 'Out-time marked successfully';
    return createSuccessResponse(res, successMessage, serializedAttendance);
  } catch (error) {
    console.error('Error in markOutTime:', error);
    return createErrorResponse(res, 500, 'Failed to mark out-time');
  }
}

/**
 * Bulk create attendance records
 */
export const bulkCreateAttendance = async (req, res) => {
  try {
    const { attendances } = req.body;
    const scope = await resolveManagedScope(req);
    const schoolId = Number(scope?.schoolId ?? req.user.schoolId);
    const branchIdBigInt = scope?.branchId !== null && scope?.branchId !== undefined ? BigInt(scope.branchId) : null;
    const courseIdBigInt = scope?.courseId !== null && scope?.courseId !== undefined ? BigInt(scope.courseId) : null;
    const createdBy = req.user.id;

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return createErrorResponse(res, 'Attendances array is required and must not be empty', 400);
    }

    const attendanceData = [];

    for (const att of attendances) {
      if (!att?.studentId || !att?.classId || !att?.date || !att?.status) {
        return createErrorResponse(res, 'Each attendance entry requires studentId, classId, date, and status', 400);
      }

      const studentIdBigInt = BigInt(att.studentId);
      const studentAccessible = await verifyStudentInManagedScope(studentIdBigInt, scope);
      if (!studentAccessible) {
        return createErrorResponse(res, 'Student not found in the selected context', 404);
      }

      const attendanceDate = new Date(att.date);
      const academicSession = await getSessionByDate(schoolId, attendanceDate);
      const academicSessionId = academicSession ? BigInt(academicSession.id) : null;

      attendanceData.push({
        date: attendanceDate,
        status: att.status,
        inTime: att.inTime ? new Date(att.inTime) : null,
        outTime: att.outTime ? new Date(att.outTime) : null,
        remarks: att.remarks,
        studentId: studentIdBigInt,
        classId: BigInt(att.classId),
        subjectId: att.subjectId ? BigInt(att.subjectId) : null,
        academicSessionId,
        schoolId: BigInt(schoolId),
        ...(branchIdBigInt !== null ? { branchId: branchIdBigInt } : {}),
        courseId: courseIdBigInt,
        createdBy: BigInt(createdBy)
      });
    }

    if (attendanceData.length === 0) {
      return createErrorResponse(res, 'No attendance records to create', 400);
    }

    const createdAttendances = await prisma.attendance.createMany({
      data: attendanceData,
      skipDuplicates: true
    });

    return createSuccessResponse(res, 'Bulk attendance created successfully', {
      created: createdAttendances.count
    }, 201);
  } catch (error) {
    console.error('Error in bulkCreateAttendance:', error);
    return createErrorResponse(res, 'Failed to create bulk attendance', 500);
  }
};

/**
 * Delete attendance record (soft delete)
 */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedBy = req.user.id;
    const scope = await resolveManagedScope(req);
    const attendanceId = BigInt(id);

    const accessible = await verifyAttendanceInScope(attendanceId, scope);
    if (!accessible) {
      return createErrorResponse(res, 'Attendance not found', 404);
    }

    // Check if attendance exists
    const existingAttendance = await prisma.attendance.findUnique({
      where: { id: attendanceId }
    });

    if (!existingAttendance) {
      return createErrorResponse(res, 'Attendance not found', 404);
    }

    // Soft delete
    await prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        deletedAt: new Date(),
        updatedBy: BigInt(updatedBy)
      }
    });

    return createSuccessResponse(res, 'Attendance deleted successfully');
  } catch (error) {
    console.error('Error in deleteAttendance:', error);
    return createErrorResponse(res, 'Failed to delete attendance', 500);
  }
};

/**
 * Get attendance summary for a specific class and date
 */
export const getClassAttendanceSummary = async (req, res) => {
  try {
    console.log('🔍 getClassAttendanceSummary called with:', { query: req.query, user: req.user });
    
    const { classId, date, schoolId: querySchoolId } = req.query;

    if (!classId || !date) {
      return createErrorResponse(res, 'Class ID and date are required', 400);
    }

    const scope = await resolveManagedScope(req);

    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      toBigIntSafe(querySchoolId) ??
      BigInt(1);

    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const classIdBigInt = toBigIntSafe(classId);

    const classAccessible = await verifyClassInManagedScope(classIdBigInt, normalizedScope);
    if (!classAccessible) {
      return createErrorResponse(res, 'Class not found in the selected context', 404);
    }

    const classInfo = await prisma.class.findUnique({
      where: { id: classIdBigInt },
      select: {
        id: true,
        name: true,
        code: true
      }
    });

    console.log('🔍 Fetching students for class:', classId, 'school:', resolvedSchoolId.toString());
    
    // Build student filter
    const studentWhere = {
      classId: classIdBigInt,
      schoolId: resolvedSchoolId,
      deletedAt: null,
      user: {
        status: 'ACTIVE'
      }
    };

    if (normalizedScope.branchId !== null && normalizedScope.branchId !== undefined) {
      studentWhere.branchId = normalizedScope.branchId;
    }
    if (normalizedScope.courseId !== null && normalizedScope.courseId !== undefined) {
      studentWhere.courseId = normalizedScope.courseId;
    }

    // Parent access control - restrict to their children only
    let parentChildIds = null;
    if (req.user.role === 'PARENT') {
      parentChildIds = await resolveParentChildIdsInScope(req, normalizedScope, resolvedSchoolId);
      if (Array.isArray(parentChildIds) && parentChildIds.length === 0) {
        return res.json({
          success: true,
          data: {
            classId: Number(classId),
            className: 'Unknown Class',
            date,
            totalStudents: 0,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            halfDay: 0,
            attendanceRate: 0,
            students: []
          }
        });
      }
      if (Array.isArray(parentChildIds)) {
        studentWhere.id = { in: parentChildIds };
      }
    }

    // Get all students in the class (with parent filtering if applicable)
    const classStudents = await prisma.student.findMany({
      where: studentWhere,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            dariName: true,
            avatar: true
          }
        },
        class: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });
    
    console.log('🔍 Found students:', classStudents.length);

    console.log(
      '🔍 Fetching attendance records for class:',
      classId,
      'date:',
      date,
      'school:',
      resolvedSchoolId.toString()
    );
    
    // Build attendance filter
    const attendanceWhereBase = {
      classId: classIdBigInt,
      schoolId: resolvedSchoolId,
      deletedAt: null
    };

    if (date) {
      const { startOfDayUTC, endOfDayUTC } = getAfghanistanDayRangeUTC(date);
      if (startOfDayUTC && endOfDayUTC) {
        attendanceWhereBase.date = { gte: startOfDayUTC, lte: endOfDayUTC };
      }
    }

    // Parent access control - restrict attendance records to parent's children only
    let attendanceWhere = attendanceWhereBase;
    if (Array.isArray(parentChildIds) && parentChildIds.length > 0) {
      attendanceWhere = {
        ...attendanceWhereBase,
        studentId: { in: parentChildIds }
      };
    }

    const { where: scopedAttendanceWhere, empty: attendanceEmpty } = await ensureScopedAttendanceWhere(
      normalizedScope,
      attendanceWhere
    );

    const attendanceRecords = attendanceEmpty
      ? []
      : await prisma.attendance.findMany({
          where: scopedAttendanceWhere,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    dariName: true,
                    avatar: true
                  }
                }
              }
            }
          }
        });
    
    console.log('🔍 Found attendance records:', attendanceRecords.length);
    
    // Debug: Show sample attendance records
    if (attendanceRecords.length > 0) {
      console.log('🔍 Sample attendance records:');
      attendanceRecords.slice(0, 3).forEach((record, index) => {
        console.log(`  Record ${index + 1}:`, {
          studentId: record.studentId.toString(),
          date: record.date.toISOString().split('T')[0],
          dateRaw: record.date,
          status: record.status,
          inTime: record.inTime?.toISOString(),
          outTime: record.outTime?.toISOString()
        });
      });
    }

    const totalStudents = classStudents.length;
    const presentLikeStatuses = new Set(['PRESENT', 'LATE', 'EXCUSED', 'HALF_DAY']);
    let present = 0;
    let late = 0;
    let excused = 0;
    let halfDay = 0;
    let markedInAndOut = 0;
    let markedInOnly = 0;
    let markedOutOnly = 0;
    let notMarked = 0;

    const students = classStudents.map(student => {
      console.log('🔍 Processing student:', { studentId: student.id, studentIdType: typeof student.id });
      console.log('🔍 Available attendance records:', attendanceRecords.map(r => ({ 
        attendanceStudentId: r.studentId, 
        attendanceStudentIdType: typeof r.studentId,
        status: r.status 
      })));
      
      const attendance = attendanceRecords.find(r => {
        const match = BigInt(r.studentId) === student.id;
        console.log('🔍 Attendance matching:', { 
          attendanceStudentId: r.studentId, 
          studentId: student.id, 
          match 
        });
        return match;
      });
      const status = attendance?.status || 'ABSENT';
      const hasInTime = Boolean(attendance?.inTime);
      const hasOutTime = Boolean(attendance?.outTime);
      const hasCompleteAttendance = hasInTime && hasOutTime;
      const attendanceCategory = hasCompleteAttendance
        ? 'COMPLETE'
        : hasInTime
          ? 'MARKED_IN_ONLY'
          : hasOutTime
            ? 'MARKED_OUT_ONLY'
            : 'NOT_MARKED';

      if (presentLikeStatuses.has(status) || hasInTime || hasOutTime) {
        present++;
      }
      if (status === 'LATE') late++;
      if (status === 'EXCUSED') excused++;
      if (status === 'HALF_DAY') halfDay++;

      if (hasCompleteAttendance) {
        markedInAndOut++;
      } else if (hasInTime) {
        markedInOnly++;
      } else if (hasOutTime) {
        markedOutOnly++;
      } else {
        notMarked++;
      }
      
      // Check if user data exists
      if (!student.user || !student.user.firstName || !student.user.lastName) {
        console.warn('⚠️ Student missing user data:', student.id);
        return {
          studentId: Number(student.id).toString(),
          studentName: 'Unknown Student',
          dariName: null,
          rollNo: student.rollNo || '',
          status,
          inTime: attendance?.inTime ? attendance.inTime.toISOString() : null,
          outTime: attendance?.outTime ? attendance.outTime.toISOString() : null,
          profileImage: null,
          id: attendance?.id ? attendance.id.toString() : null,
          remarks: attendance?.remarks || null,
          leaveDocumentPath: attendance?.leaveDocumentPath || null,
          hasInTime,
          hasOutTime,
          hasCompleteAttendance,
          attendanceCategory,
          statusLabel: status
        };
      }
      
      return {
        studentId: Number(student.id).toString(),
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        dariName: student.user.dariName || null,
        rollNo: student.rollNo || '',
        status,
        inTime: attendance?.inTime ? formatAfghanistanLocalISO(attendance.inTime) : null,
        outTime: attendance?.outTime ? formatAfghanistanLocalISO(attendance.outTime) : null,
        profileImage: student.user.avatar ? `https://khwanzay.school/api/students/${student.id}/avatar` : null,
        id: attendance?.id ? attendance.id.toString() : null,
        remarks: attendance?.remarks || null,
        leaveDocumentPath: attendance?.leaveDocumentPath || null,
        // SMS Status fields for mark-in
        smsInStatus: attendance?.smsInStatus || null,
        smsInSentAt: attendance?.smsInSentAt ? attendance.smsInSentAt.toISOString() : null,
        smsInError: attendance?.smsInError || null,
        smsInAttempts: attendance?.smsInAttempts || 0,
        smsInRequestId: attendance?.smsInRequestId || null,
        smsInSource: attendance?.smsInSource || null,
        smsInSentBy: attendance?.smsInSentBy ? Number(attendance.smsInSentBy) : null,
        // SMS Status fields for mark-out
        smsOutStatus: attendance?.smsOutStatus || null,
        smsOutSentAt: attendance?.smsOutSentAt ? attendance.smsOutSentAt.toISOString() : null,
        smsOutError: attendance?.smsOutError || null,
        smsOutAttempts: attendance?.smsOutAttempts || 0,
        smsOutRequestId: attendance?.smsOutRequestId || null,
        smsOutSource: attendance?.smsOutSource || null,
        smsOutSentBy: attendance?.smsOutSentBy ? Number(attendance.smsOutSentBy) : null,
        hasInTime,
        hasOutTime,
        hasCompleteAttendance,
        attendanceCategory,
        statusLabel: status
      };
    });

    const absent = Math.max(totalStudents - present, 0);
    const attendanceRate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;

    const summary = {
      classId: Number(classId),
      className: classInfo?.name || classStudents[0]?.class?.name || 'Unknown Class',
      date,
      totalStudents,
      present,
      absent,
      late,
      excused,
      halfDay,
      attendanceRate,
      markedInAndOut,
      markedInOnly,
      markedOutOnly,
      notMarked,
      students
    };

    console.log('🔍 Returning summary:', summary);
    console.log('🔍 Sample student data:', students[0]);
    console.log('🔍 All students data:', students);
    console.log('🔍 Attendance records:', attendanceRecords);
    return createSuccessResponse(res, 'Class attendance summary retrieved successfully', summary);
  } catch (error) {
    console.error('❌ Error in getClassAttendanceSummary:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a Prisma error
    if (error.code) {
      console.error('❌ Prisma error code:', error.code);
    }
    
    return createErrorResponse(res, 'Failed to retrieve class attendance summary', 500);
  }
};

/**
 * Get overall attendance summary with filters
 */
export const getAttendanceSummary = async (req, res) => {
  try {
    console.log('🔍 getAttendanceSummary called with:', { query: req.query, user: req.user });
    
    const { classId, date, schoolId: querySchoolId = 1 } = req.query;
    const scope = await resolveManagedScope(req);

    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      toBigIntSafe(querySchoolId) ??
      BigInt(1);

    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const classIdBigInt = classId ? toBigIntSafe(classId) : null;
    let classInfo = null;

    if (classIdBigInt) {
      const classAccessible = await verifyClassInManagedScope(classIdBigInt, normalizedScope);
      if (!classAccessible) {
        return createErrorResponse(res, 'Class not found in the selected context', 404);
      }
      classInfo = await prisma.class.findUnique({
        where: { id: classIdBigInt },
        select: { name: true }
      });
    }

    const studentWhere = {
      schoolId: resolvedSchoolId,
      deletedAt: null,
      user: {
        status: 'ACTIVE'
      }
    };

    if (classIdBigInt) {
      studentWhere.classId = classIdBigInt;
    }

    let childIds = null;
    if (req.user.role === 'PARENT') {
      const parent = await resolveParentChildIdsInScope(req, normalizedScope, resolvedSchoolId);
      if (Array.isArray(parent) && parent.length === 0) {
        const emptySummary = {
          date: date || new Date().toISOString().split('T')[0],
          classId: classId || '',
          className: classInfo?.name || 'All Classes',
          totalStudents: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          halfDay: 0,
          attendanceRate: 0,
          onTimeRate: 0,
          lateRate: 0
        };
        return createSuccessResponse(res, 'Attendance summary retrieved successfully', emptySummary);
      }

      if (Array.isArray(parent)) {
        childIds = parent;
        studentWhere.id = { in: parent };
      }
    }

    const { where: scopedStudentWhere, empty: studentOutOfScope } = await ensureScopedStudentWhere(
      normalizedScope,
      studentWhere
    );

    if (studentOutOfScope) {
      const emptySummary = {
        date: date || new Date().toISOString().split('T')[0],
        classId: classId || '',
        className: classInfo?.name || 'All Classes',
        totalStudents: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        halfDay: 0,
        attendanceRate: 0,
        onTimeRate: 0,
        lateRate: 0
      };
      return createSuccessResponse(res, 'Attendance summary retrieved successfully', emptySummary);
    }

    const students = await prisma.student.findMany({
      where: scopedStudentWhere,
      include: {
        class: {
          select: { name: true }
        }
      }
    });

    const totalStudents = students.length;
    console.log('🔍 Total students in class:', totalStudents);

    const attendanceWhereBase = {
      schoolId: resolvedSchoolId,
      deletedAt: null
    };

    if (classIdBigInt) {
      attendanceWhereBase.student = {
        classId: classIdBigInt
      };
    }

    if (date) {
      const { startOfDayUTC, endOfDayUTC } = getAfghanistanDayRangeUTC(date);
      attendanceWhereBase.date = { gte: startOfDayUTC, lte: endOfDayUTC };
    }

    if (childIds && childIds.length > 0) {
      attendanceWhereBase.studentId = { in: childIds };
    }

    const { where: scopedAttendanceWhere, empty: attendanceOutOfScope } = await ensureScopedAttendanceWhere(
      normalizedScope,
      attendanceWhereBase
    );

    const attendances = attendanceOutOfScope
      ? []
      : await prisma.attendance.findMany({
          where: scopedAttendanceWhere,
          include: {
            class: {
              select: { name: true }
            }
          }
        });

    console.log('🔍 Total attendance records:', attendances.length);
    
    // Count attendance statuses
    const present = attendances.filter(r => r.status === 'PRESENT').length;
    const absent = attendances.filter(r => r.status === 'ABSENT').length;
    const late = attendances.filter(r => r.status === 'LATE').length;
    const excused = attendances.filter(r => r.status === 'EXCUSED').length;
    const halfDay = attendances.filter(r => r.status === 'HALF_DAY').length;

    // Calculate rates based on actual student count, not attendance record count
    const attendanceRate = totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0;
    const onTimeRate = totalStudents > 0 ? Math.round(((present - late) / totalStudents) * 100) : 0;
    const lateRate = totalStudents > 0 ? Math.round((late / totalStudents) * 100) : 0;
    
    console.log('🔍 Calculated rates:', { totalStudents, present, absent, late, attendanceRate });

    const summary = {
      date: date || new Date().toISOString().split('T')[0],
      classId: classId || '',
      className: classInfo?.name || students[0]?.class?.name || attendances[0]?.class?.name || 'All Classes',
      totalStudents,
      present,
      absent,
      late,
      excused,
      halfDay,
      attendanceRate,
      onTimeRate,
      lateRate
    };

    return createSuccessResponse(res, 'Attendance summary retrieved successfully', summary);
  } catch (error) {
    console.error('Error in getAttendanceSummary:', error);
    return createErrorResponse(res, 'Failed to retrieve attendance summary', 500);
  }
};

/**
 * Get comprehensive attendance statistics and analytics
 */
export const getAttendanceStats = async (req, res) => {
  try {
    console.log('🔍 getAttendanceStats called with:', { query: req.query, user: req.user });
    
    const { classId, startDate, endDate, schoolId: querySchoolId = 1 } = req.query;
    const scope = await resolveManagedScope(req);

    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      toBigIntSafe(querySchoolId) ??
      BigInt(1);

    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const classIdBigInt = classId ? toBigIntSafe(classId) : null;
    if (classIdBigInt) {
      const classAccessible = await verifyClassInManagedScope(classIdBigInt, normalizedScope);
      if (!classAccessible) {
        return createErrorResponse(res, 'Class not found in the selected context', 404);
      }
    }

    let childIds = null;
    if (req.user.role === 'PARENT') {
      const parentChildIds = await resolveParentChildIdsInScope(req, normalizedScope, resolvedSchoolId);
      if (Array.isArray(parentChildIds) && parentChildIds.length === 0) {
        return createSuccessResponse(res, 'Comprehensive attendance statistics retrieved successfully', {
          totalDays: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          totalExcused: 0,
          averageAttendanceRate: 0,
          totalHours: 0,
          dailyTrends: [],
          weeklyPatterns: [],
          monthlyTrends: [],
          studentStats: [],
          topStudents: [],
          bottomStudents: [],
          timeAnalysis: {
            earlyArrivals: 0,
            onTime: 0,
            lateArrivals: 0,
            earlyDepartures: 0,
            onTimeDepartures: 0,
            lateDepartures: 0
          },
          recentTrend: 0,
          trendDirection: 'stable',
          trendPercentage: 0,
          insights: {
            bestDay: { date: '', rate: 0 },
            worstDay: { date: '', rate: 0 },
            mostPunctualStudent: null,
            needsAttention: []
          }
        });
      }
      if (Array.isArray(parentChildIds)) {
        childIds = parentChildIds;
      }
    }

    const attendanceWhereBase = {
      schoolId: resolvedSchoolId,
      deletedAt: null
    };

    if (classIdBigInt) {
      attendanceWhereBase.student = {
        classId: classIdBigInt
      };
    }

    if (startDate && endDate) {
      attendanceWhereBase.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (Array.isArray(childIds) && childIds.length > 0) {
      attendanceWhereBase.studentId = { in: childIds };
    }

    const { where: scopedAttendanceWhere, empty: attendanceOutOfScope } = await ensureScopedAttendanceWhere(
      normalizedScope,
      attendanceWhereBase
    );

    const attendances = attendanceOutOfScope
      ? []
      : await prisma.attendance.findMany({
          where: scopedAttendanceWhere,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    dariName: true
                  }
                }
              }
            },
            class: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: { date: 'asc' }
        });

    // Calculate basic statistics
    const totalDays = new Set(attendances.map(r => (r.date ? formatAfghanistanLocalISO(r.date).split('T')[0] : ''))).size;
    const totalPresent = attendances.filter(r => r.status === 'PRESENT').length;
    const totalAbsent = attendances.filter(r => r.status === 'ABSENT').length;
    const totalLate = attendances.filter(r => r.status === 'LATE').length;
    const totalExcused = attendances.filter(r => r.status === 'EXCUSED').length;
    const averageAttendanceRate = totalDays > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;

    // Calculate total hours and average time
    const totalHours = attendances.reduce((total, record) => {
      if (record.inTime && record.outTime) {
        const diffMs = new Date(record.outTime) - new Date(record.inTime);
        return total + (diffMs / (1000 * 60 * 60));
      }
      return total;
    }, 0);

    // Daily attendance trends
    const dailyTrends = {};
    attendances.forEach(record => {
      const date = record.date ? formatAfghanistanLocalISO(record.date).split('T')[0] : '';
      if (!dailyTrends[date]) {
        dailyTrends[date] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      
      dailyTrends[date].total++;
      if (record.status === 'PRESENT') dailyTrends[date].present++;
      else if (record.status === 'ABSENT') dailyTrends[date].absent++;
      else if (record.status === 'LATE') dailyTrends[date].late++;
      else if (record.status === 'EXCUSED') dailyTrends[date].excused++;
    });

    // Weekly patterns
    const weeklyPatterns = {};
    attendances.forEach(record => {
      const date = record.date ? new Date(record.date) : new Date();
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyPatterns[weekKey]) {
        weeklyPatterns[weekKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      
      weeklyPatterns[weekKey].total++;
      if (record.status === 'PRESENT') weeklyPatterns[weekKey].present++;
      else if (record.status === 'ABSENT') weeklyPatterns[weekKey].absent++;
      else if (record.status === 'LATE') weeklyPatterns[weekKey].late++;
      else if (record.status === 'EXCUSED') weeklyPatterns[weekKey].excused++;
    });

    // Monthly trends
    const monthlyTrends = {};
    attendances.forEach(record => {
      const date = record.date ? new Date(record.date) : new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      }
      
      monthlyTrends[monthKey].total++;
      if (record.status === 'PRESENT') monthlyTrends[monthKey].present++;
      else if (record.status === 'ABSENT') monthlyTrends[monthKey].absent++;
      else if (record.status === 'LATE') monthlyTrends[monthKey].late++;
      else if (record.status === 'EXCUSED') monthlyTrends[monthKey].excused++;
    });

    // Student performance ranking
    const studentStats = {};
    attendances.forEach(record => {
      const studentId = record.studentId.toString();
      if (!studentStats[studentId]) {
        const studentUser = record.student && record.student.user ? record.student.user : null;
        const studentName = studentUser ? `${studentUser.firstName} ${studentUser.lastName}` : 'Unknown Student';
        const dariName = studentUser && studentUser.dariName ? studentUser.dariName : null;
        studentStats[studentId] = {
          studentId,
          studentName: studentName,
          dariName: dariName,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          total: 0,
          averageTime: 0,
          totalTime: 0
        };
      }
      
      studentStats[studentId].total++;
      if (record.status === 'PRESENT') studentStats[studentId].present++;
      else if (record.status === 'ABSENT') studentStats[studentId].absent++;
      else if (record.status === 'LATE') studentStats[studentId].late++;
      else if (record.status === 'EXCUSED') studentStats[studentId].excused++;
      
      if (record.inTime && record.outTime) {
        const diffMs = new Date(record.outTime) - new Date(record.inTime);
        const hours = diffMs / (1000 * 60 * 60);
        studentStats[studentId].totalTime += hours;
      }
    });

    // Calculate averages and rankings
    Object.values(studentStats).forEach(student => {
      if (student.total > 0) {
        student.averageTime = Math.round((student.totalTime / student.total) * 100) / 100;
        student.attendanceRate = Math.round((student.present / student.total) * 100);
      }
    });

    // Sort students by attendance rate
    const topStudents = Object.values(studentStats)
      .sort((a, b) => b.attendanceRate - a.attendanceRate)
      .slice(0, 10);

    const bottomStudents = Object.values(studentStats)
      .sort((a, b) => a.attendanceRate - b.attendanceRate)
      .slice(0, 10);

    // Time-based analysis
    const timeAnalysis = {
      earlyArrivals: 0, // Before 8 AM
      onTime: 0, // 8 AM - 8:30 AM
      lateArrivals: 0, // After 8:30 AM
      earlyDepartures: 0, // Before 3 PM
      onTimeDepartures: 0, // 3 PM - 3:30 PM
      lateDepartures: 0 // After 3:30 PM
    };

    attendances.forEach(record => {
      if (record.inTime) {
        const hour = new Date(record.inTime).getHours();
        const minutes = new Date(record.inTime).getMinutes();
        const timeInMinutes = hour * 60 + minutes;
        
        if (timeInMinutes < 480) timeAnalysis.earlyArrivals++; // Before 8 AM
        else if (timeInMinutes <= 510) timeAnalysis.onTime++; // 8 AM - 8:30 AM
        else timeAnalysis.lateArrivals++; // After 8:30 AM
      }
      
      if (record.outTime) {
        const hour = new Date(record.outTime).getHours();
        const minutes = new Date(record.outTime).getMinutes();
        const timeInMinutes = hour * 60 + minutes;
        
        if (timeInMinutes < 900) timeAnalysis.earlyDepartures++; // Before 3 PM
        else if (timeInMinutes <= 930) timeAnalysis.onTimeDepartures++; // 3 PM - 3:30 PM
        else timeAnalysis.lateDepartures++; // After 3:30 PM
      }
    });

    // Predictive analytics
    const recentTrend = Object.values(dailyTrends)
      .slice(-7) // Last 7 days
      .reduce((sum, day) => sum + (day.present / day.total), 0) / 7;

    const trendDirection = recentTrend > (averageAttendanceRate / 100) ? 'improving' : 'declining';
    const trendPercentage = Math.abs(recentTrend - (averageAttendanceRate / 100)) * 100;

    const comprehensiveStats = {
      // Basic stats
      totalDays,
      totalPresent,
      totalAbsent,
      totalLate,
      totalExcused,
      averageAttendanceRate,
      totalHours: Math.round(totalHours * 100) / 100,
      
      // Trends
      dailyTrends: Object.entries(dailyTrends).map(([date, data]) => ({
        date,
        ...data,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      })),
      weeklyPatterns: Object.entries(weeklyPatterns).map(([week, data]) => ({
        week,
        ...data,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      })),
      monthlyTrends: Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        ...data,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      })),
      
      // Student performance
      studentStats: Object.values(studentStats),
      topStudents,
      bottomStudents,
      
      // Time analysis
      timeAnalysis,
      
      // Predictive analytics
      recentTrend: Math.round(recentTrend * 100),
      trendDirection,
      trendPercentage: Math.round(trendPercentage * 100) / 100,
      
      // Insights
      insights: {
        bestDay: Object.entries(dailyTrends).reduce((best, [date, data]) => 
          data.total > 0 && (data.present / data.total) > (best.rate || 0) 
            ? { date, rate: data.present / data.total } 
            : best, { date: '', rate: 0 }
        ),
        worstDay: Object.entries(dailyTrends).reduce((worst, [date, data]) => 
          data.total > 0 && (data.present / data.total) < (worst.rate || 1) 
            ? { date, rate: data.present / data.total } 
            : worst, { date: '', rate: 1 }
        ),
        mostPunctualStudent: topStudents[0] || null,
        needsAttention: bottomStudents.slice(0, 3) || []
      }
    };

    return createSuccessResponse(res, 'Comprehensive attendance statistics retrieved successfully', comprehensiveStats);
  } catch (error) {
    console.error('Error in getAttendanceStats:', error);
    return createErrorResponse(res, 500, 'Failed to retrieve attendance statistics', error?.message || 'ATTENDANCE_STATS_ERROR');
  }
};

/**
 * Get comprehensive attendance analytics with chart data
 */
export const getAttendanceAnalytics = async (req, res) => {
  try {
    console.log('🔍 getAttendanceAnalytics called with:', { query: req.query, user: req.user });
    
    const { classId, period = 'daily', startDate, endDate, schoolId: querySchoolId = 1, chartType = 'all' } = req.query;
    const scope = await resolveManagedScope(req);

    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      toBigIntSafe(querySchoolId) ??
      BigInt(1);

    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const classIdBigInt = classId ? toBigIntSafe(classId) : null;
    if (classIdBigInt) {
      const classAccessible = await verifyClassInManagedScope(classIdBigInt, normalizedScope);
      if (!classAccessible) {
        return createErrorResponse(res, 'Class not found in the selected context', 404);
      }
    }

    let childIds = null;
    if (req.user.role === 'PARENT') {
      const parentChildIds = await resolveParentChildIdsInScope(req, normalizedScope, resolvedSchoolId);
      if (Array.isArray(parentChildIds) && parentChildIds.length === 0) {
        return createSuccessResponse(res, 'Attendance analytics retrieved successfully', {
          chartData: {},
          metadata: {
            totalRecords: 0,
            dateRange: {
              start: startDate || 'all',
              end: endDate || 'all'
            },
            classId: classId || 'all',
            period,
            chartType,
            generatedAt: new Date().toISOString()
          }
        });
      }
      if (Array.isArray(parentChildIds)) {
        childIds = parentChildIds;
      }
    }

    const attendanceWhereBase = {
      schoolId: resolvedSchoolId,
      deletedAt: null
    };

    if (classIdBigInt) {
      attendanceWhereBase.student = {
        classId: classIdBigInt
      };
    }

    if (startDate && endDate) {
      attendanceWhereBase.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (Array.isArray(childIds) && childIds.length > 0) {
      attendanceWhereBase.studentId = { in: childIds };
    }

    const { where: scopedAttendanceWhere, empty: attendanceOutOfScope } = await ensureScopedAttendanceWhere(
      normalizedScope,
      attendanceWhereBase
    );

    const attendances = attendanceOutOfScope
      ? []
      : await prisma.attendance.findMany({
          where: scopedAttendanceWhere,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            class: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: { date: 'asc' }
        });

    // Generate chart data based on requested type
    let chartData = {};

    if (chartType === 'all' || chartType === 'daily') {
      // Daily attendance trends
      const dailyTrends = {};
      attendances.forEach(record => {
        // Skip records without valid date
        if (!record.date) {
          console.warn('Skipping attendance record without valid date:', record.id);
          return;
        }
        
        const date = record.date.toISOString().split('T')[0];
        if (!dailyTrends[date]) {
          dailyTrends[date] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        
        dailyTrends[date].total++;
        if (record.status === 'PRESENT') dailyTrends[date].present++;
        else if (record.status === 'ABSENT') dailyTrends[date].absent++;
        else if (record.status === 'LATE') dailyTrends[date].late++;
        else if (record.status === 'EXCUSED') dailyTrends[date].excused++;
      });

      chartData.daily = Object.entries(dailyTrends).map(([date, data]) => ({
      date,
        ...data,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      }));
    }

    if (chartType === 'all' || chartType === 'weekly') {
      // Weekly patterns
      const weeklyPatterns = {};
      attendances.forEach(record => {
        // Skip records without valid date
        if (!record.date) {
          console.warn('Skipping attendance record without valid date for weekly analysis:', record.id);
          return;
        }
        
        const date = new Date(record.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyPatterns[weekKey]) {
          weeklyPatterns[weekKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        
        weeklyPatterns[weekKey].total++;
        if (record.status === 'PRESENT') weeklyPatterns[weekKey].present++;
        else if (record.status === 'ABSENT') weeklyPatterns[weekKey].absent++;
        else if (record.status === 'LATE') weeklyPatterns[weekKey].late++;
        else if (record.status === 'EXCUSED') weeklyPatterns[weekKey].excused++;
      });

      chartData.weekly = Object.entries(weeklyPatterns).map(([week, data]) => ({
        week,
        ...data,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      }));
    }

    if (chartType === 'all' || chartType === 'monthly') {
      // Monthly trends
      const monthlyTrends = {};
      attendances.forEach(record => {
        const date = new Date(record.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyTrends[monthKey]) {
          monthlyTrends[monthKey] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        
        monthlyTrends[monthKey].total++;
        if (record.status === 'PRESENT') monthlyTrends[monthKey].present++;
        else if (record.status === 'ABSENT') monthlyTrends[monthKey].absent++;
        else if (record.status === 'LATE') monthlyTrends[monthKey].late++;
        else if (record.status === 'EXCUSED') monthlyTrends[monthKey].excused++;
      });

      chartData.monthly = Object.entries(monthlyTrends).map(([month, data]) => ({
        month,
        ...data,
        rate: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
      }));
    }

    if (chartType === 'all' || chartType === 'student') {
      // Student performance ranking
      const studentStats = {};
      attendances.forEach(record => {
        // Skip records without complete student/user data
        if (!record.student || !record.student.user) {
          console.warn('Skipping attendance record with incomplete student data:', record.id);
          return;
        }
        
        const studentId = record.studentId.toString();
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            studentId,
            studentName: `${record.student.user.firstName} ${record.student.user.lastName}`,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
            attendanceRate: 0
          };
        }
        
        studentStats[studentId].total++;
        if (record.status === 'PRESENT') studentStats[studentId].present++;
        else if (record.status === 'ABSENT') studentStats[studentId].absent++;
        else if (record.status === 'LATE') studentStats[studentId].late++;
        else if (record.status === 'EXCUSED') studentStats[studentId].excused++;
      });

      // Calculate attendance rates
      Object.values(studentStats).forEach(student => {
        if (student.total > 0) {
          student.attendanceRate = Math.round((student.present / student.total) * 100);
        }
      });

      chartData.student = Object.values(studentStats);
    }

    if (chartType === 'all' || chartType === 'time') {
      // Time-based analysis
      const timeAnalysis = {
        earlyArrivals: 0, // Before 8 AM
        onTime: 0, // 8 AM - 8:30 AM
        lateArrivals: 0, // After 8:30 AM
        earlyDepartures: 0, // Before 3 PM
        onTimeDepartures: 0, // 3 PM - 3:30 PM
        lateDepartures: 0 // After 3:30 PM
      };

      attendances.forEach(record => {
        if (record.inTime) {
          try {
            const hour = new Date(record.inTime).getHours();
            const minutes = new Date(record.inTime).getMinutes();
            const timeInMinutes = hour * 60 + minutes;
            
            if (timeInMinutes < 480) timeAnalysis.earlyArrivals++;
            else if (timeInMinutes <= 510) timeAnalysis.onTime++;
            else timeAnalysis.lateArrivals++;
          } catch (timeError) {
            console.warn('Skipping record with invalid inTime:', record.id, record.inTime);
          }
        }
        
        if (record.outTime) {
          try {
            const hour = new Date(record.outTime).getHours();
            const minutes = new Date(record.outTime).getMinutes();
            const timeInMinutes = hour * 60 + minutes;
            
            if (timeInMinutes < 900) timeAnalysis.earlyDepartures++;
            else if (timeInMinutes <= 930) timeAnalysis.onTimeDepartures++;
            else timeAnalysis.lateDepartures++;
          } catch (timeError) {
            console.warn('Skipping record with invalid outTime:', record.id, record.outTime);
          }
        }
      });

      chartData.time = timeAnalysis;
    }

    if (chartType === 'all' || chartType === 'comparison') {
      // Class comparison (if multiple classes)
      const classStats = {};
      attendances.forEach(record => {
        // Skip records without complete class data
        if (!record.class) {
          console.warn('Skipping attendance record with incomplete class data:', record.id);
          return;
        }
        
        const className = record.class.name;
        if (!classStats[className]) {
          classStats[className] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        
        classStats[className].total++;
        if (record.status === 'PRESENT') classStats[className].present++;
        else if (record.status === 'ABSENT') classStats[className].absent++;
        else if (record.status === 'LATE') classStats[className].late++;
        else if (record.status === 'EXCUSED') classStats[className].excused++;
      });

      // Calculate rates
      Object.values(classStats).forEach(cls => {
        if (cls.total > 0) {
          cls.rate = Math.round((cls.present / cls.total) * 100);
        }
      });

      chartData.comparison = Object.entries(classStats).map(([className, data]) => ({
        className,
        ...data
      }));
    }

    // Add metadata
    const analytics = {
      chartData,
      metadata: {
        totalRecords: attendances.length,
        dateRange: {
          start: startDate || 'all',
          end: endDate || 'all'
        },
        classId: classId || 'all',
        period,
        chartType,
        generatedAt: new Date().toISOString()
      }
    };

    return createSuccessResponse(res, 'Attendance analytics retrieved successfully', analytics);
  } catch (error) {
    console.error('Error in getAttendanceAnalytics:', error);
    return createErrorResponse(res, 'Failed to retrieve attendance analytics', 500);
  }
};

/**
 * Get monthly attendance matrix for a class
 */
export const getMonthlyAttendanceMatrix = async (req, res) => {
  try {
    console.log('🔍 getMonthlyAttendanceMatrix called with:', { query: req.query, user: req.user });
    
    const { classId, month, year, schoolId: querySchoolId = 1 } = req.query;

    if (!classId || !month || !year) {
      return createErrorResponse(res, 'Class ID, month, and year are required', 400);
    }

    const scope = await resolveManagedScope(req);

    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      toBigIntSafe(querySchoolId) ??
      BigInt(1);

    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const classIdBigInt = toBigIntSafe(classId);
    if (!classIdBigInt) {
      return createErrorResponse(res, 'Invalid class ID', 400);
    }

    const classAccessible = await verifyClassInManagedScope(classIdBigInt, normalizedScope);
    if (!classAccessible) {
      return createErrorResponse(res, 'Class not found in the selected context', 404);
    }

    // Validate and parse year (ensure it's a reasonable 4-digit year)
    const parsedYear = parseInt(year);
    const parsedMonth = parseInt(month);
    
    if (isNaN(parsedYear) || parsedYear < 1900 || parsedYear > 2100) {
      return createErrorResponse(res, 'Invalid year. Year must be between 1900 and 2100', 400);
    }
    
    if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      return createErrorResponse(res, 'Invalid month. Month must be between 1 and 12', 400);
    }

    console.log('🔍 Fetching monthly attendance for class:', classId, 'month:', parsedMonth, 'year:', parsedYear, 'school:', resolvedSchoolId.toString());
    
    const studentWhere = {
      classId: classIdBigInt,
      schoolId: resolvedSchoolId,
      deletedAt: null,
      user: {
        status: 'ACTIVE'
      }
    };

    if (normalizedScope.branchId !== null && normalizedScope.branchId !== undefined) {
      studentWhere.branchId = normalizedScope.branchId;
    }
    if (normalizedScope.courseId !== null && normalizedScope.courseId !== undefined) {
      studentWhere.courseId = normalizedScope.courseId;
    }

    let parentChildIds = null;
    if (req.user.role === 'PARENT') {
      parentChildIds = await resolveParentChildIdsInScope(req, normalizedScope, resolvedSchoolId);
      if (Array.isArray(parentChildIds) && parentChildIds.length === 0) {
        return createSuccessResponse(res, 'Monthly attendance matrix retrieved successfully', {
          classId: Number(classId),
          month: parsedMonth,
          year: parsedYear,
          monthStart: null,
          monthEnd: null,
          totalStudents: 0,
          students: []
        });
      }
      if (Array.isArray(parentChildIds)) {
        studentWhere.id = { in: parentChildIds };
      }
    }

    const classStudents = await prisma.student.findMany({
      where: studentWhere,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            dariName: true
          }
        }
      }
    });
    
    console.log('🔍 Found students:', classStudents.length);
    console.log('🔍 First student user data:', classStudents[0] ? {
      firstName: classStudents[0].user.firstName,
      lastName: classStudents[0].user.lastName,
      dariName: classStudents[0].user.dariName
    } : 'No students');

    // Get month range - FIXED
    const monthStart = new Date(parsedYear, parsedMonth - 1, 1);
    const monthEnd = new Date(parsedYear, parsedMonth, 0); // Last day of the month
    const monthEndInclusive = new Date(monthEnd);
    monthEndInclusive.setHours(23, 59, 59, 999);
    
    console.log('🔍 Month range:', monthStart.toISOString(), 'to', monthEndInclusive.toISOString());
    console.log('🔍 Month start date:', monthStart.toDateString());
    console.log('🔍 Month end date:', monthEnd.toDateString());
    
    // Debug: Check what classes have attendance records
    const groupByWhere = {
      schoolId: resolvedSchoolId,
      deletedAt: null,
      date: {
        gte: monthStart,
        lte: monthEndInclusive
      }
    };
    if (normalizedScope.branchId !== null && normalizedScope.branchId !== undefined) {
      groupByWhere.branchId = normalizedScope.branchId;
    }
    if (normalizedScope.courseId !== null && normalizedScope.courseId !== undefined) {
      groupByWhere.courseId = normalizedScope.courseId;
    }
    
    const classesWithAttendance = await prisma.attendance.groupBy({
      by: ['classId'],
      where: groupByWhere,
      _count: {
        classId: true
      }
    });
    
    console.log('🔍 Classes with attendance in this month:', classesWithAttendance);
    
    // Debug: Check what attendance records exist in the database for this class
    const classHistoryWhere = {
      classId: classIdBigInt,
      schoolId: resolvedSchoolId,
      deletedAt: null
    };
    if (normalizedScope.branchId !== null && normalizedScope.branchId !== undefined) {
      classHistoryWhere.branchId = normalizedScope.branchId;
    }
    if (normalizedScope.courseId !== null && normalizedScope.courseId !== undefined) {
      classHistoryWhere.courseId = normalizedScope.courseId;
    }
    
    const allClassAttendance = await prisma.attendance.findMany({
      where: classHistoryWhere,
      select: {
        date: true,
        status: true,
        studentId: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    });
    
    console.log('🔍 Recent attendance records for this class:', allClassAttendance.length);
    if (allClassAttendance.length > 0) {
      console.log('🔍 Sample dates in database:', allClassAttendance.slice(0, 5).map(r => r.date.toISOString().split('T')[0]));
    }
    
    // Get attendance records for the month - DATE FILTERED (inclusive end of month)
    const monthAttendanceWhere = {
      classId: classIdBigInt,
      date: {
        gte: monthStart,
        lte: monthEndInclusive
      },
      schoolId: resolvedSchoolId,
      deletedAt: null
    };
    if (normalizedScope.branchId !== null && normalizedScope.branchId !== undefined) {
      monthAttendanceWhere.branchId = normalizedScope.branchId;
    }
    if (normalizedScope.courseId !== null && normalizedScope.courseId !== undefined) {
      monthAttendanceWhere.courseId = normalizedScope.courseId;
    }
    if (Array.isArray(parentChildIds) && parentChildIds.length > 0) {
      monthAttendanceWhere.studentId = { in: parentChildIds };
    }

    const { where: scopedMonthWhere, empty: monthOutOfScope } = await ensureScopedAttendanceWhere(
      normalizedScope,
      monthAttendanceWhere
    );

    const attendanceRecords = monthOutOfScope
      ? []
      : await prisma.attendance.findMany({
          where: scopedMonthWhere,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    dariName: true
                  }
                }
              }
            }
          },
          orderBy: {
            date: 'asc'
          }
        });
    
    console.log('🔍 Found attendance records for month (date-filtered):', attendanceRecords.length);

    // Create monthly matrix data
    const monthlyMatrix = {};
    
    classStudents.forEach(student => {
      monthlyMatrix[student.id] = {
        studentId: Number(student.id).toString(),
        studentName: `${student.user.firstName} ${student.user.lastName}`,
        dariName: student.user.dariName || '',
        rollNo: student.rollNo || '',
        dailyAttendance: {}
      };
      
      // Initialize all days of the month - FIXED
      for (let d = new Date(monthStart); d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        monthlyMatrix[student.id].dailyAttendance[dateStr] = {
          status: null,
          inTime: null,
          outTime: null
        };
      }
      
      console.log(`🔍 Created matrix for student ${student.id} with ${Object.keys(monthlyMatrix[student.id].dailyAttendance).length} days`);
    });
    
    console.log('🔍 Created matrix for 31 days of August');

    // Fill in actual attendance data - SIMPLIFIED
    attendanceRecords.forEach((record) => {
      const studentId = record.studentId.toString();
      const dateStr = record.date ? formatAfghanistanLocalISO(record.date).split('T')[0] : null;
      
      console.log(`🔍 Processing attendance record: Student ${studentId}, Date ${dateStr}, Status ${record.status}`);
      
      if (monthlyMatrix[studentId]) {
        if (dateStr) {
          monthlyMatrix[studentId].dailyAttendance[dateStr] = {
            status: record.status,
            inTime: record.inTime ? formatAfghanistanLocalISO(record.inTime) : null,
            outTime: record.outTime ? formatAfghanistanLocalISO(record.outTime) : null
          };
        }
        console.log(`✅ Updated matrix for student ${studentId} on ${dateStr}`);
      } else {
        console.log(`❌ Student ${studentId} not found in matrix`);
      }
    });
    
    console.log('🔍 Finished processing attendance records');

    // Convert to array format
    const matrixData = Object.values(monthlyMatrix);
    
    console.log('🔍 Returning monthly matrix with', matrixData.length, 'students');
    console.log('🔍 Sample data:', matrixData[0] ? Object.keys(matrixData[0].dailyAttendance).length : 0, 'days');
    console.log('🔍 First student data:', JSON.stringify(matrixData[0], null, 2));
    
    return createSuccessResponse(res, 'Monthly attendance matrix retrieved successfully', {
      classId: Number(classId),
      month: parsedMonth,
      year: parsedYear,
      monthStart: monthStart.toISOString(),
      monthEnd: monthEnd.toISOString(),
      totalStudents: matrixData.length,
      students: matrixData
    });
  } catch (error) {
    console.error('Error in getMonthlyAttendanceMatrix:', error);
    return createErrorResponse(res, 'Failed to retrieve monthly attendance matrix', 500);
  }
};

/**
 * Export attendance data in various formats
 */
export const exportAttendanceData = async (req, res) => {
  try {
    console.log('🔍 exportAttendanceData called with:', { query: req.query, user: req.user });
    
    const { 
      format = 'pdf', 
      classId, 
      startDate, 
      endDate, 
      schoolId: querySchoolId = 1 
    } = req.query;
    
    const scope = await resolveManagedScope(req);

    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      toBigIntSafe(querySchoolId) ??
      BigInt(1);

    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const classIdBigInt = classId ? toBigIntSafe(classId) : null;
    if (classIdBigInt) {
      const classAccessible = await verifyClassInManagedScope(classIdBigInt, normalizedScope);
      if (!classAccessible) {
        return createErrorResponse(res, 'Class not found in the selected context', 404);
      }
    }

    if (!['pdf', 'excel', 'csv'].includes(format)) {
      return createErrorResponse(res, 'Invalid export format. Supported formats: pdf, excel, csv', 400);
    }

    console.log('🔍 Exporting attendance data:', { format, classId, startDate, endDate, schoolId: resolvedSchoolId.toString() });

    const attendanceWhereBase = {
      schoolId: resolvedSchoolId,
      deletedAt: null
    };

    if (classIdBigInt) {
      attendanceWhereBase.student = {
        classId: classIdBigInt
      };
    }
    if (startDate && endDate) {
      attendanceWhereBase.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    let childIds = null;
    if (req.user.role === 'PARENT') {
      const parentChildIds = await resolveParentChildIdsInScope(req, normalizedScope, resolvedSchoolId);
      if (Array.isArray(parentChildIds) && parentChildIds.length === 0) {
        return createErrorResponse(res, 'No attendance data available for export in the selected context', 404);
      }
      if (Array.isArray(parentChildIds)) {
        childIds = parentChildIds;
        attendanceWhereBase.studentId = { in: parentChildIds };
      }
    }

    const { where: scopedAttendanceWhere, empty: attendanceOutOfScope } = await ensureScopedAttendanceWhere(
      normalizedScope,
      attendanceWhereBase
    );

    // Fetch attendance data
    const attendances = attendanceOutOfScope
      ? []
      : await prisma.attendance.findMany({
          where: scopedAttendanceWhere,
          include: {
            student: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            },
            class: {
              select: {
                name: true,
                code: true
              }
            }
          },
          orderBy: [
            { date: 'desc' },
            { student: { rollNo: 'asc' } }
          ]
        });

    console.log('🔍 Found attendance records for export:', attendances.length);

    // Filter out incomplete records and log any issues
    const filteredAttendances = attendances.filter(attendance => {
      if (!attendance.student) {
        console.warn('Skipping attendance record without student data:', attendance.id);
        return false;
      }
      if (!attendance.student.user) {
        console.warn('Skipping attendance record without user data:', attendance.id, 'studentId:', attendance.studentId);
        return false;
      }
      if (!attendance.class) {
        console.warn('Skipping attendance record without class data:', attendance.id, 'classId:', attendance.classId);
        return false;
      }
      return true;
    });

    console.log('🔍 Filtered attendance records for export:', filteredAttendances.length);

    // Prepare data for export
    const exportData = filteredAttendances
      .map(attendance => ({
        date: attendance.date ? formatAfghanistanLocalISO(attendance.date).split('T')[0] : '',
        studentName: `${attendance.student.user.firstName} ${attendance.student.user.lastName}`,
        rollNo: attendance.student.rollNo || 'N/A',
        className: attendance.class.name,
        status: attendance.status,
        inTime: attendance.inTime ? formatAfghanistanLocalISO(attendance.inTime).split('T')[1].substring(0, 5) : '--',
        outTime: attendance.outTime ? formatAfghanistanLocalISO(attendance.outTime).split('T')[1].substring(0, 5) : '--',
        remarks: attendance.remarks || ''
      }));

    // Generate export based on format
    let exportContent, contentType, filename;

    switch (format) {
      case 'csv':
        const csvHeaders = ['Date', 'Student Name', 'Roll No', 'Class', 'Status', 'In Time', 'Out Time', 'Remarks'];
        const csvRows = exportData.map(row => [
          row.date,
          row.studentName,
          row.rollNo,
          row.className,
          row.status,
          row.inTime,
          row.outTime,
          row.remarks
        ]);
        
        exportContent = [csvHeaders, ...csvRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        contentType = 'text/csv';
        filename = `attendance_${startDate || 'all'}_${endDate || 'data'}.csv`;
        break;

      case 'excel':
        // For now, return CSV as Excel (you can implement proper Excel generation later)
        const excelHeaders = ['Date', 'Student Name', 'Roll No', 'Class', 'Status', 'In Time', 'Out Time', 'Remarks'];
        const excelRows = exportData.map(row => [
          row.date,
          row.studentName,
          row.rollNo,
          row.className,
          row.status,
          row.inTime,
          row.outTime,
          row.remarks
        ]);
        
        exportContent = [excelHeaders, ...excelRows]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `attendance_${startDate || 'all'}_${endDate || 'data'}.xlsx`;
        break;

      case 'pdf':
      default:
        try {
          console.log('🔍 Generating PDF file...');
          
          // Import PDFKit library dynamically to avoid issues
          const PDFDocument = require('pdfkit');
          console.log('✅ PDFKit imported successfully');
          
          // Create a new PDF document
          const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
              Title: 'Attendance Report',
              Author: 'School Management System',
              Subject: 'Student Attendance Report',
              Keywords: 'attendance, students, report',
              CreationDate: new Date()
            }
          });
          
          console.log('✅ PDF document created');
          
          // Validate that we have data to export
          if (!exportData || exportData.length === 0) {
            console.error('❌ No data to export for PDF');
            throw new Error('No attendance data available for export');
          }
          
          console.log('🔍 Data validation passed, rows to export:', exportData.length);
          
          // Set up response headers for PDF
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="attendance_${startDate || 'all'}_${endDate || 'data'}.pdf"`);
          res.setHeader('Cache-Control', 'no-cache');
          
          // Pipe the PDF to the response
          doc.pipe(res);
          
          console.log('🔍 Starting PDF content generation...');
          
          // Add title
          doc.fontSize(24)
             .font('Helvetica-Bold')
             .text('ATTENDANCE REPORT', { align: 'center' });
          
          doc.moveDown(0.5);
          console.log('✅ Title added');
          
          // Add subtitle
          doc.fontSize(14)
             .font('Helvetica')
             .text(`Generated on: ${new Date().toLocaleDateString()}`, { align: 'center' });
          
          doc.moveDown(0.5);
          console.log('✅ Subtitle added');
          
          // Add report details
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text('Report Details:', { underline: true });
          
          doc.fontSize(10)
             .font('Helvetica')
             .text(`Class: ${classId ? 'Specific Class' : 'All Classes'}`)
             .text(`Date Range: ${startDate || 'All'} to ${endDate || 'All'}`)
             .text(`Total Records: ${exportData.length}`);
          
          doc.moveDown(1);
          console.log('✅ Report details added');
          
          // Create table headers
          const tableTop = doc.y;
          const tableLeft = 50;
          const colWidths = [80, 120, 80, 80, 80, 80, 80];
          const headers = ['Date', 'Student Name', 'Roll No', 'Class', 'Status', 'In Time', 'Out Time'];
          
          console.log('🔍 Creating table headers at Y position:', tableTop);
          
          // Draw table headers
          doc.fontSize(10)
             .font('Helvetica-Bold')
             .fillColor('black');
          
          headers.forEach((header, i) => {
            doc.text(header, tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0), tableTop);
          });
          
          // Draw header underline
          doc.moveTo(tableLeft, tableTop + 15)
             .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
             .stroke();
          
          doc.moveDown(0.5);
          console.log('✅ Table headers created');
          
          // Add data rows
          let currentY = doc.y;
          doc.fontSize(9)
             .font('Helvetica');
          
          console.log('🔍 Adding data rows, starting Y position:', currentY);
          console.log('🔍 Total rows to add:', exportData.length);
          
          exportData.forEach((row, index) => {
            // Check if we need a new page
            if (currentY > 700) {
              doc.addPage();
              currentY = 50;
              console.log('📄 Added new page at row:', index);
            }
            
            const rowData = [
              row.date,
              row.studentName,
              row.rollNo,
              row.className,
              row.status,
              row.inTime,
              row.outTime
            ];
            
            // Draw row data
            rowData.forEach((cell, i) => {
              const x = tableLeft + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
              doc.text(cell || '--', x, currentY);
            });
            
            currentY += 20;
            
            // Add alternating row background
            if (index % 2 === 0) {
              doc.rect(tableLeft, currentY - 20, colWidths.reduce((a, b) => a + b, 0), 20)
                 .fillColor('#f8f9fa')
                 .fill();
              doc.fillColor('black'); // Reset fill color
            }
            
            // Log progress every 10 rows
            if (index % 10 === 0 || index === exportData.length - 1) {
              console.log(`📝 Processed row ${index + 1}/${exportData.length}, Y position: ${currentY}`);
            }
          });
          
          console.log('✅ All data rows added successfully');
          
          // Add summary at the end
          doc.addPage();
          doc.fontSize(16)
             .font('Helvetica-Bold')
             .text('Summary', { underline: true });
          
          doc.moveDown(0.5);
          
          const statusCounts = {};
          exportData.forEach(row => {
            statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
          });
          
          doc.fontSize(12)
             .font('Helvetica');
          
          Object.entries(statusCounts).forEach(([status, count]) => {
            doc.text(`${status}: ${count} students`);
          });
          
          doc.moveDown(1);
          doc.text(`Total Students: ${exportData.length}`);
          doc.text(`Report Generated: ${new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })}`);
          
          console.log('✅ PDF content added successfully');
          console.log('🔍 PDF document info:', {
            pageCount: doc.bufferedPageRange().count,
            currentPage: doc.page.pageNumber,
            yPosition: doc.y
          });
          
          // Finalize the PDF
          doc.end();
          console.log('✅ PDF finalized and sent');
          
          // Add a small delay to ensure the PDF is fully written
          setTimeout(() => {
            console.log('✅ PDF generation completed');
          }, 100);
          
          // Return early since we're piping to response
          return;
          
        } catch (pdfError) {
          console.error('❌ PDF generation failed, falling back to CSV:', pdfError);
          console.error('❌ Error details:', {
            message: pdfError.message,
            stack: pdfError.stack,
            name: pdfError.name
          });
          
          // Try to generate a simple text-based PDF as fallback
          try {
            console.log('🔄 Attempting simple PDF fallback...');
            
            const simpleDoc = new (require('pdfkit'))({
              size: 'A4',
              margin: 50
            });
            
            // Set headers for fallback PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_${startDate || 'all'}_${endDate || 'data'}.pdf"`);
            
            simpleDoc.pipe(res);
            simpleDoc.fontSize(16).text('ATTENDANCE REPORT', { align: 'center' });
            simpleDoc.moveDown(1);
            simpleDoc.fontSize(12).text(`Generated on: ${new Date().toLocaleDateString()}`);
            simpleDoc.moveDown(1);
            simpleDoc.text(`Total Records: ${exportData.length}`);
            simpleDoc.moveDown(1);
            simpleDoc.text('Note: This is a simplified version due to generation error.');
            simpleDoc.end();
            
            console.log('✅ Simple PDF fallback sent');
            return;
          } catch (fallbackError) {
            console.error('❌ PDF fallback also failed:', fallbackError);
            
            // Final fallback to CSV
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_${startDate || 'all'}_${endDate || 'data'}.csv"`);
            res.send(exportContent);
            console.log('✅ Final fallback CSV sent');
            return;
          }
        }
        break;
      }

      // Set response headers for file download (only for non-PDF formats)
      if (format !== 'pdf') {
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(exportContent, 'utf8'));
      }

      console.log('✅ Export completed successfully:', { format, filename, records: exportData.length });
      
      // For Excel format, we need to create a proper Excel file
      if (format === 'excel') {
        try {
          console.log('🔍 Generating Excel file...');
          
          // Import ExcelJS library dynamically to avoid issues
          const ExcelJS = require('exceljs');
          console.log('✅ ExcelJS imported successfully');
          
          // Create workbook and worksheet
          const workbook = new ExcelJS.Workbook();
          const worksheet = workbook.addWorksheet('Attendance Data');
          console.log('✅ Workbook and worksheet created');
          
          // Add headers
          worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Student Name', key: 'studentName', width: 25 },
            { header: 'Roll No', key: 'rollNo', width: 15 },
            { header: 'Class', key: 'className', width: 20 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'In Time', key: 'inTime', width: 15 },
            { header: 'Out Time', key: 'outTime', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 30 }
          ];
          console.log('✅ Headers added');
          
          // Add data rows
          exportData.forEach((row, index) => {
            worksheet.addRow(row);
            if (index < 5) console.log('📝 Added row:', row); // Log first 5 rows for debugging
          });
          console.log(`✅ Added ${exportData.length} data rows`);
          
          // Style the header row
          worksheet.getRow(1).font = { bold: true };
          worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
          console.log('✅ Header styling applied');
          
          // Write to buffer
          console.log('🔍 Writing to buffer...');
          const buffer = await workbook.xlsx.writeBuffer();
          console.log('✅ Buffer created, size:', buffer.length);
          
          // Set proper headers for Excel
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Length', buffer.length);
          res.setHeader('Cache-Control', 'no-cache');
          console.log('✅ Headers set for Excel');
          
          // Send the buffer
          res.send(buffer);
          console.log('✅ Excel buffer sent successfully');
        } catch (excelError) {
          console.error('❌ Excel generation failed, falling back to CSV:', excelError);
          console.error('❌ Error details:', {
            message: excelError.message,
            stack: excelError.stack,
            name: excelError.name
          });
          
          // Fallback to CSV if Excel fails
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="attendance_${startDate || 'all'}_${endDate || 'data'}.csv"`);
          res.send(exportContent);
          console.log('✅ Fallback CSV sent');
        }
      } else if (format === 'csv') {
        // Send the CSV content
        res.send(exportContent);
        console.log('✅ CSV content sent');
      }
      // Note: PDF is handled separately above with doc.pipe(res)

    } catch (error) {
      console.error('Error in exportAttendanceData:', error);
      return createErrorResponse(res, 'Failed to export attendance data', 500);
    }
  };

  /**
   * Automatically mark absent students who haven't marked in by 9 AM
   * This function should be called by a scheduled task/cron job
   * COMMENTED OUT: Automatic attendance marking is disabled
   */
  /*
  export const autoMarkAbsentStudents = async (req, res) => {
    try {
      console.log('🤖 Auto-marking absent students...');
      
      // Check if it's time to auto-mark absent (after 9 AM Afghanistan time)
      if (!isAutoAbsentTime()) {
        const afghanTime = getFormattedAfghanTime();
        console.log('⏰ Not yet time to auto-mark absent. Current Afghanistan time:', afghanTime);
        console.log('⏰ Auto-mark absent runs after 9:00 AM Afghanistan time');
        return createErrorResponse(res, 'Not yet time to auto-mark absent', 400, {
          message: `Auto-mark absent runs after 9:00 AM Afghanistan time. Current time: ${afghanTime}`,
          currentAfghanTime: afghanTime,
          autoMarkTime: 'After 9:00 AM (Afghanistan time)'
        });
      }

      const afghanTime = getFormattedAfghanTime();
      const today = new Date();
      const schoolId = req.user?.schoolId || 1;

      console.log('🌍 Current Afghanistan time:', afghanTime);
      console.log('📅 Processing date:', today.toISOString());
      console.log('🏫 School ID:', schoolId);

      // Get all active students for the school
      const students = await prisma.student.findMany({
        where: {
          schoolId: BigInt(schoolId),
          deletedAt: null,
          user: {
            status: 'ACTIVE'
          }
        },
        include: {
          class: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          }
        }
      });

      console.log(`📚 Found ${students.length} active students`);

      const presentLikeStatuses = new Set(['PRESENT', 'LATE', 'EXCUSED', 'HALF_DAY', 'ON_LEAVE', 'APPROVED_LEAVE', 'LEAVE_APPROVED']);

      let absentCount = 0;
      let presentCount = 0;
      let errorCount = 0;

      // Process each student
      for (const student of students) {
        try {
          // Check if attendance record already exists for today
          const existingAttendance = await prisma.attendance.findFirst({
            where: {
              studentId: student.id,
              classId: student.classId,
              date: today,
              schoolId: BigInt(schoolId),
              deletedAt: null
            }
          });

          if (existingAttendance) {
            // Student already has attendance record for today
            if (existingAttendance.status === 'PRESENT' || existingAttendance.inTime) {
              presentCount++;
              console.log(`✅ Student ${student.user.firstName} ${student.user.lastName} already marked present`);
            } else {
              // Update existing record to mark as absent
              await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                  status: 'ABSENT',
                  updatedAt: new Date()
                }
              });
              absentCount++;
              console.log(`❌ Updated student ${student.user.firstName} ${student.user.lastName} as absent`);
            }
          } else {
            // Create new absent record
            await prisma.attendance.create({
              data: {
                date: today,
                status: 'ABSENT',
                studentId: student.id,
                classId: student.classId,
                schoolId: BigInt(schoolId),
                createdBy: BigInt(req.user?.id || 1),
                createdAt: new Date()
              }
            });
            absentCount++;
            console.log(`❌ Created absent record for student ${student.user.firstName} ${student.user.lastName}`);

            // Send SMS notification for absent student (non-blocking)
            try {
              if (student.user && student.user.phone) {
                smsService.sendAttendanceSMS(
                  {
                    name: `${student.user.firstName} ${student.user.lastName}`,
                    phone: student.user.phone
                  },
                  {
                    date: today,
                    className: student.class?.name || 'Unknown Class',
                    status: 'ABSENT',
                    reason: 'No mark-in recorded by 9:00 AM'
                  },
                  'absent' // Use appropriate campaign ID for absent notifications
                ).then(smsResult => {
                  if (smsResult && smsResult.success) {
                    console.log(`📱 Absent SMS sent to ${student.user.firstName} ${student.user.lastName}`);
                  }
                }).catch(smsError => {
                  console.error(`❌ Failed to send absent SMS to ${student.user.firstName}:`, smsError.message);
                });
              }
            } catch (smsError) {
              console.error(`❌ SMS preparation failed for ${student.user.firstName}:`, smsError.message);
            }
          }
        } catch (studentError) {
          errorCount++;
          console.error(`❌ Error processing student ${student.user?.firstName || 'Unknown'}:`, studentError.message);
        }
      }

      const summary = {
        totalStudents: students.length,
        presentCount,
        absentCount,
        errorCount,
        processedAt: afghanTime,
        date: today.toISOString()
      };

      console.log('📊 Auto-mark absent summary:', summary);

      return createSuccessResponse(res, 'Auto-mark absent completed successfully', summary);
    } catch (error) {
      console.error('❌ Error in autoMarkAbsentStudents:', error);
      return createErrorResponse(res, 'Failed to auto-mark absent students', 500, {
        error: error.message
      });
    }
  };
  */

  /**
   * Automatically mark absent students who don't have both inTime and outTime before today
   * This function checks for students without complete attendance records and marks them absent
   */
export const markIncompleteAttendanceAsAbsent = async (req, res) => {
  try {
    console.log('🤖 Marking students with incomplete attendance as absent...');

    const afghanTime = getFormattedAfghanTime();

    // Determine target date and optional class scope
    const dateInput = req.body.date || req.query.date || new Date().toISOString().split('T')[0];
    const classIdInput = req.body.classId || req.query.classId || null;

    const scope = await resolveManagedScope(req);
    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      BigInt(1);

    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);
    const classIdBigInt = classIdInput ? toBigIntSafe(classIdInput) : null;

    if (classIdBigInt) {
      const classAccessible = await verifyClassInManagedScope(classIdBigInt, normalizedScope);
      if (!classAccessible) {
        return createErrorResponse(res, 'Class not found in the selected context', 404);
      }
    }

    const { startOfDayUTC, endOfDayUTC } = getAfghanistanDayRangeUTC(dateInput);
    const targetDate = parseAfghanistanLocalToUTC(`${dateInput} 12:00:00`);

    console.log('🌍 Current Afghanistan time:', afghanTime);
    console.log('📅 Processing date:', dateInput);
    console.log('📅 Target date (UTC):', targetDate?.toISOString());
    console.log('🏫 School ID:', resolvedSchoolId.toString());
    console.log('🎓 Class ID filter:', classIdInput || 'All classes');

    const studentWhere = {
      schoolId: resolvedSchoolId,
      deletedAt: null,
      user: {
        status: 'ACTIVE'
      }
    };

    if (classIdBigInt) {
      studentWhere.classId = classIdBigInt;
    }
    if (normalizedScope.branchId !== null && normalizedScope.branchId !== undefined) {
      studentWhere.branchId = normalizedScope.branchId;
    }
    if (normalizedScope.courseId !== null && normalizedScope.courseId !== undefined) {
      studentWhere.courseId = normalizedScope.courseId;
    }

    let parentChildIds = null;
    if (req.user.role === 'PARENT') {
      parentChildIds = await resolveParentChildIdsInScope(req, normalizedScope, resolvedSchoolId);
      if (Array.isArray(parentChildIds) && parentChildIds.length === 0) {
        return createSuccessResponse(res, 'Marked incomplete attendance as absent successfully', {
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          errorCount: 0,
          processedAt: afghanTime,
          date: dateInput,
          classId: classIdInput || 'All classes',
          markedStudents: [],
          description: 'No students in the selected context'
        });
      }
      if (Array.isArray(parentChildIds)) {
        studentWhere.id = { in: parentChildIds };
      }
    }

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        class: {
          select: {
            id: true,
            name: true
          }
        },
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        parent: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        }
      }
    });

    console.log(`📚 Found ${students.length} active students`);

    const presentLikeStatuses = new Set(['PRESENT', 'LATE', 'EXCUSED', 'HALF_DAY', 'ON_LEAVE', 'APPROVED_LEAVE', 'LEAVE_APPROVED']);

    let absentCount = 0;
    let presentCount = 0;
    let errorCount = 0;
    const markedStudents = [];

    for (const student of students) {
      try {
        const attendanceWhereBase = {
          studentId: student.id,
          classId: student.classId,
          date: {
            gte: startOfDayUTC,
            lte: endOfDayUTC
          },
          schoolId: resolvedSchoolId,
          deletedAt: null
        };

        const { where: scopedAttendanceWhere } = await ensureScopedAttendanceWhere(
          normalizedScope,
          attendanceWhereBase
        );

        const existingAttendance = await prisma.attendance.findFirst({
          where: scopedAttendanceWhere
        });

        let markedAbsentThisStudent = false;
        let absenceReason = '';

        const branchIdForRecords =
          normalizedScope.branchId ??
          (student?.branchId ? toBigIntSafe(student.branchId) : null);

        const courseIdForRecords =
          normalizedScope.courseId ??
          (student?.courseId ? toBigIntSafe(student.courseId) : null);

        if (existingAttendance) {
          const hasInTime = Boolean(existingAttendance.inTime);
          const hasOutTime = Boolean(existingAttendance.outTime);
          const currentStatus = existingAttendance.status || 'UNKNOWN';

          if (hasInTime && hasOutTime) {
            presentCount++;
            if (!presentLikeStatuses.has(currentStatus)) {
              await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
            status: markInStatus,
                  branchId: branchIdForRecords ?? existingAttendance.branchId ?? null,
                  courseId: courseIdForRecords ?? existingAttendance.courseId ?? null,
                  updatedAt: new Date(),
                  updatedBy: BigInt(req.user?.id || 1)
                }
              });
            }
            continue;
          }

          if (hasInTime || hasOutTime) {
            presentCount++;
            if (!presentLikeStatuses.has(currentStatus)) {
              await prisma.attendance.update({
                where: { id: existingAttendance.id },
                data: {
                  status: 'HALF_DAY',
                  branchId: branchIdForRecords ?? existingAttendance.branchId ?? null,
                  courseId: courseIdForRecords ?? existingAttendance.courseId ?? null,
                  updatedAt: new Date(),
                  updatedBy: BigInt(req.user?.id || 1)
                }
              });
            }
            continue;
          }

          const alreadyAbsent = currentStatus === 'ABSENT';
          if (!alreadyAbsent) {
            await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: {
                status: 'ABSENT',
                branchId: branchIdForRecords ?? existingAttendance.branchId ?? null,
                courseId: courseIdForRecords ?? existingAttendance.courseId ?? null,
                updatedAt: new Date(),
                updatedBy: BigInt(req.user?.id || 1)
              }
            });
          }

          absentCount++;
          if (!alreadyAbsent) {
            markedAbsentThisStudent = true;
            absenceReason = 'No mark-in or mark-out recorded';
            markedStudents.push({
              name: `${student.user.firstName} ${student.user.lastName}`,
              class: student.class?.name || 'Unknown',
              reason: absenceReason
            });
          }
        } else {
          await prisma.attendance.create({
            data: {
              date: targetDate,
              status: 'ABSENT',
              studentId: student.id,
              classId: student.classId,
              schoolId: resolvedSchoolId,
              branchId: branchIdForRecords,
              courseId: courseIdForRecords,
              createdBy: BigInt(req.user?.id || 1),
              createdAt: new Date()
            }
          });
          absentCount++;
          markedAbsentThisStudent = true;
          absenceReason = 'No attendance record';
          markedStudents.push({
            name: `${student.user.firstName} ${student.user.lastName}`,
            class: student.class?.name || 'Unknown',
            reason: absenceReason
          });
        }

        if (markedAbsentThisStudent) {
          try {
            const recipientPhone = student?.parent?.user?.phone || student?.user?.phone || null;
            if (recipientPhone) {
              const smsResult = await smsService.sendAttendanceSMS(
                {
                  name: `${student.user.firstName} ${student.user.lastName}`,
                  phone: recipientPhone
                },
                {
                  date: formatAfghanistanLocalISO(targetDate),
                  className: student.class?.name || 'Unknown Class',
                  status: 'ABSENT',
                  reason: absenceReason
                },
                'absent'
              );

              if (smsResult && smsResult.success) {
                console.log(`📱 Absent SMS sent to ${student.user.firstName} ${student.user.lastName}`);
              }
            }
          } catch (smsError) {
            console.error(`❌ SMS preparation failed for ${student.user.firstName}:`, smsError.message);
          }
        } else {
          presentCount++;
        }
      } catch (studentError) {
        errorCount++;
        console.error(`❌ Error processing student ${student.user?.firstName || 'Unknown'}:`, studentError.message);
      }
    }

    const summary = {
      totalStudents: students.length,
      presentCount,
      absentCount,
      errorCount,
      processedAt: afghanTime,
      date: dateInput,
      classId: classIdInput || 'All classes',
      markedStudents: markedStudents.slice(0, 20),
      description: 'Marked students absent who have incomplete attendance records (missing inTime or outTime)'
    };

    console.log('📊 Mark incomplete attendance as absent summary:', summary);

    return createSuccessResponse(res, 'Marked incomplete attendance as absent successfully', summary);
  } catch (error) {
    console.error('❌ Error in markIncompleteAttendanceAsAbsent:', error);
    return createErrorResponse(res, 'Failed to mark incomplete attendance as absent', 500, {
      error: error.message
    });
  }
};

  /**
   * Get attendance time windows and current status
   */
  export const getAttendanceTimeStatus = async (req, res) => {
    try {
      const afghanTime = getAfghanistanTime();
      const currentHour = afghanTime.getHours();
      const currentMinute = afghanTime.getMinutes();

      const status = {
        currentAfghanTime: getFormattedAfghanTime(),
        currentHour,
        currentMinute,
        timeWindows: {
          markIn: {
            start: 'Any time',
            end: 'Any time',
            isOpen: true,
            description: 'Time restrictions removed - attendance can be marked at any time'
          },
          markOut: {
            start: 'Any time',
            end: 'Any time',
            isOpen: true,
            description: 'Time restrictions removed - attendance can be marked at any time'
          },
          autoAbsent: {
            time: 'Disabled',
            isActive: false,
            description: 'Auto-absent feature disabled - time restrictions removed'
          }
        },
        nextWindow: getNextWindowInfo(currentHour),
        timezone: AFGHANISTAN_TIMEZONE,
        utcOffset: '+04:30'
      };

      return createSuccessResponse(res, 'Attendance time status retrieved successfully', status);
    } catch (error) {
      console.error('❌ Error in getAttendanceTimeStatus:', error);
      return createErrorResponse(res, 'Failed to get attendance time status', 500, {
        error: error.message
      });
    }
  };

  /**
   * Get information about the next available time window
   */
  const getNextWindowInfo = (currentHour) => {
    if (currentHour < ATTENDANCE_TIMES.MARK_IN_START) {
      return {
        type: 'markIn',
        time: `${ATTENDANCE_TIMES.MARK_IN_START}:00 AM`,
        description: 'Mark-in window opens at 7:00 AM',
        waitTime: `${ATTENDANCE_TIMES.MARK_IN_START - currentHour} hours`
      };
    } else if (currentHour < ATTENDANCE_TIMES.MARK_IN_END) {
      return {
        type: 'markIn',
        time: `${ATTENDANCE_TIMES.MARK_IN_END}:00 AM`,
        description: 'Mark-in window closes at 8:00 AM',
        remainingTime: `${ATTENDANCE_TIMES.MARK_IN_END - currentHour} hours`
      };
    } else if (currentHour < ATTENDANCE_TIMES.MARK_OUT_START) {
      return {
        type: 'markOut',
        time: `${ATTENDANCE_TIMES.MARK_OUT_START}:00 PM`,
        description: 'Mark-out window opens at 12:00 PM',
        waitTime: `${ATTENDANCE_TIMES.MARK_OUT_START - currentHour} hours`
      };
    } else if (currentHour < ATTENDANCE_TIMES.MARK_OUT_END) {
      return {
        type: 'markOut',
        time: `${ATTENDANCE_TIMES.MARK_OUT_END}:00 PM`,
        description: 'Mark-out window closes at 1:00 PM',
        remainingTime: `${ATTENDANCE_TIMES.MARK_OUT_END - currentHour} hours`
      };
    } else {
      return {
        type: 'nextDay',
        time: '7:00 AM tomorrow',
        description: 'Next mark-in window opens tomorrow at 7:00 AM',
        waitTime: 'Next day'
      };
    }
  };

/**
 * Download leave document
 */
export const downloadLeaveDocument = async (req, res) => {
  try {
    const { id } = req.params; // Attendance ID
    
    console.log('📥 Downloading leave document for attendance:', id);

    const scope = await resolveManagedScope(req);
    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      BigInt(1);
    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const attendanceId = BigInt(id);
    const accessible = await verifyAttendanceInScope(attendanceId, normalizedScope);
    if (!accessible) {
      return createErrorResponse(res, 404, 'Attendance record not found');
    }

    const { where: scopedAttendanceWhere } = await ensureScopedAttendanceWhere(
      normalizedScope,
      {
        id: attendanceId,
        status: 'EXCUSED',
        deletedAt: null
      }
    );
    
    const attendance = await prisma.attendance.findFirst({
      where: scopedAttendanceWhere
    });

    if (!attendance) {
      return createErrorResponse(res, 404, 'Attendance record not found');
    }

    if (!attendance.leaveDocumentPath) {
      return createErrorResponse(res, 404, 'No leave document found for this record');
    }

    // Check if file exists
    if (!fs.existsSync(attendance.leaveDocumentPath)) {
      console.error('❌ File not found:', attendance.leaveDocumentPath);
      return createErrorResponse(res, 404, 'Leave document file not found on server');
    }

    // Get file info
    const filename = path.basename(attendance.leaveDocumentPath);
    const ext = path.extname(filename).toLowerCase();
    
    // Set content type based on extension
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Set headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(attendance.leaveDocumentPath);
    fileStream.on('error', (error) => {
      console.error('❌ Error streaming file:', error);
      return createErrorResponse(res, 500, 'Error reading file');
    });
    
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Error downloading leave document:', error);
    return createErrorResponse(res, 500, `Failed to download document: ${error.message}`);
  }
};

/**
 * Mark student leave with document upload
 * Enhanced version that saves leave document and updates attendance
 */
export const markStudentLeave = async (req, res) => {
  try {
    console.log('📝 Mark Student Leave - START');
    console.log('📋 Body:', req.body);
    console.log('📋 Body keys:', Object.keys(req.body));
    console.log('📄 File:', req.file);
    console.log('📄 Files:', req.files);
    console.log('🔑 Headers:', req.headers['content-type']);
    
    const {
      studentId,
      classId,
      date,
      reason,
      remarks
    } = req.body;

    const schoolId = req.user.schoolId;
    const createdBy = req.user.id;

    // Validate required fields
    if (!studentId || !date || !reason) {
      return createErrorResponse(res, 400, 'Missing required fields: studentId, date, reason');
    }

    // Get leave document path if uploaded
    const leaveDocumentPath = req.file ? req.file.path : null;
    const leaveDocumentInfo = req.leaveDocument || null;

    console.log('📄 Leave document path:', leaveDocumentPath);
    console.log('📄 File uploaded:', req.file ? 'YES' : 'NO');
    console.log('📄 File details:', req.file ? {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    } : 'N/A');

    // Parse and normalize the date - handle YYYY-MM-DD format
    console.log('📅 Parsing date:', date);
    let dateString = String(date).trim();
    
    // If it's already in YYYY-MM-DD format, use it directly
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      // Good format, use as-is
    } else {
      // Try to parse and reformat
      dateString = new Date(dateString).toISOString().split('T')[0];
    }
    
    console.log('📅 Normalized date:', dateString);
    const { startOfDayUTC, endOfDayUTC } = getAfghanistanDayRangeUTC(dateString);

    console.log('📅 UTC range:', { startOfDayUTC, endOfDayUTC });

    if (!startOfDayUTC || !endOfDayUTC) {
      console.error('❌ Failed to parse date:', dateString);
      return createErrorResponse(res, 400, `Invalid date format. Expected YYYY-MM-DD, received: ${date}`);
    }

    // Get or determine classId
    let finalClassId = classId;
    if (!finalClassId) {
      const student = await prisma.student.findUnique({
        where: { id: BigInt(studentId) },
        select: { classId: true }
      });
      finalClassId = student?.classId;
    }

    if (!finalClassId) {
      return createErrorResponse(res, 400, 'Could not determine class ID for student');
    }

    // Check if attendance already exists for this student on this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: BigInt(studentId),
        classId: BigInt(finalClassId),
        date: {
          gte: startOfDayUTC,
          lte: endOfDayUTC
        },
        schoolId: BigInt(schoolId),
        deletedAt: null
      }
    });

    let attendance;
    const leaveReason = reason || remarks || 'Leave';

    if (existingAttendance) {
      // Update existing attendance to EXCUSED (leave) status
      console.log('📝 Updating existing attendance to EXCUSED status');
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: 'EXCUSED',
          remarks: leaveReason,
          leaveDocumentPath: leaveDocumentPath,
          updatedBy: BigInt(createdBy),
          updatedAt: new Date()
        },
        include: {
          student: {
            include: {
              user: true,
              class: true,
              parent: {
                include: {
                  user: true
                }
              }
            }
          },
          class: true,
          school: true
        }
      });
    } else {
      // Create new attendance record with EXCUSED status
      console.log('📝 Creating new attendance record with EXCUSED status');
      attendance = await prisma.attendance.create({
        data: {
          studentId: BigInt(studentId),
          classId: BigInt(finalClassId),
          schoolId: BigInt(schoolId),
          date: startOfDayUTC,
          status: 'EXCUSED',
          remarks: leaveReason,
          leaveDocumentPath: leaveDocumentPath,
          createdBy: BigInt(createdBy)
        },
        include: {
          student: {
            include: {
              user: true,
              class: true,
              parent: {
                include: {
                  user: true
                }
              }
            }
          },
          class: true,
          school: true
        }
      });
    }

    console.log('✅ Leave marked successfully');

    // ===== AUDIT LOG, EVENTS & NOTIFICATIONS =====

    // 1. Create audit log
    try {
      await createAuditLog({
        action: existingAttendance ? 'UPDATE' : 'CREATE',
        entityType: 'Attendance',
        entityId: attendance.id,
        userId: BigInt(createdBy),
        schoolId: BigInt(schoolId),
        oldData: existingAttendance ? JSON.stringify({
          id: existingAttendance.id.toString(),
          status: existingAttendance.status,
          remarks: existingAttendance.remarks,
          leaveDocumentPath: existingAttendance.leaveDocumentPath
        }) : null,
        newData: JSON.stringify({
          studentId: attendance.studentId?.toString(),
          studentName: `${attendance.student.user.firstName} ${attendance.student.user.lastName}`,
          classId: attendance.classId?.toString(),
          className: attendance.class?.name,
          date: formatAfghanistanLocalISO(attendance.date),
          status: attendance.status,
          reason: leaveReason,
          leaveDocumentPath: attendance.leaveDocumentPath
        }),
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      });
      console.log('✅ Audit log created for leave');
    } catch (auditError) {
      console.error('❌ Failed to create audit log for leave:', auditError);
    }

    // 2. Create student event
    try {
      const studentEventService = new StudentEventService();
      await studentEventService.createStudentAttendanceEvent(
        attendance.studentId,
        {
          date: attendance.date,
          status: attendance.status,
          classId: attendance.classId,
          remarks: leaveReason,
          leaveDocumentPath: attendance.leaveDocumentPath
        },
        BigInt(createdBy),
        BigInt(schoolId)
      );
      console.log('✅ Student event created for leave');
    } catch (eventError) {
      console.error('❌ Failed to create student event for leave:', eventError);
    }

    // 3. Send notifications
    try {
      const recipients = [];
      if (attendance.student?.userId) recipients.push(attendance.student.userId);
      if (attendance.student?.parent?.userId) recipients.push(attendance.student.parent.userId);

      if (recipients.length > 0) {
        const studentName = `${attendance.student.user.firstName} ${attendance.student.user.lastName}`;
        const className = attendance.class?.name || 'Unknown Class';
        const dateFormatted = new Date(attendance.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        await createNotification({
          type: 'ATTENDANCE_MARKED',
          title: '🏥 Student Leave Marked',
          message: `${studentName} (Class ${className}) has been marked on leave for ${dateFormatted}. Reason: ${leaveReason}${attendance.leaveDocumentPath ? ' (Document attached)' : ''}`,
          recipients,
          priority: 'NORMAL',
          schoolId: BigInt(schoolId),
          senderId: BigInt(createdBy),
          channels: ['IN_APP', 'SMS', 'PUSH'],
          entityType: 'attendance',
          entityId: attendance.id,
          metadata: JSON.stringify({
            studentId: attendance.studentId?.toString(),
            studentName,
            className,
            date: formatAfghanistanLocalISO(attendance.date),
            status: attendance.status,
            reason: leaveReason,
            hasDocument: !!attendance.leaveDocumentPath
          })
        });
        console.log('✅ Leave notification sent');
      }
    } catch (notifError) {
      console.error('❌ Failed to send leave notification:', notifError);
    }

    // Send SMS notification to parent if phone is available
    const recipientPhone = attendance.student?.parent?.user?.phone || attendance.student?.user?.phone;
    if (recipientPhone) {
      console.log('📱 Sending SMS notification for leave...');
      smsService.sendAttendanceSMS(
        {
          name: `${attendance.student.user.firstName} ${attendance.student.user.lastName}`,
          phone: recipientPhone
        },
        {
          date: formatAfghanistanLocalISO(attendance.date),
          className: attendance.class?.name || 'Unknown Class',
          status: 'EXCUSED',
          note: leaveReason
        },
        '405' // Campaign ID for leave
      ).then(smsResult => {
        console.log('📱 SMS sent successfully for leave');
      }).catch(smsError => {
        console.log('📱 SMS failed (non-critical):', smsError.message);
      });
    }

    // Serialize response data
    const serializedAttendance = JSON.parse(
      JSON.stringify(attendance, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      )
    );

    if (leaveDocumentInfo) {
      try {
        await updateSubscriptionUsage(Number(resolvedSchoolId));
      } catch (usageError) {
        console.warn('Failed to refresh subscription usage after leave document upload:', usageError);
      }
    }

    return createSuccessResponse(res, 201, 'Leave marked successfully', {
      attendance: serializedAttendance,
      leaveDocument: leaveDocumentInfo ? {
        path: leaveDocumentInfo.relativePath,
        filename: leaveDocumentInfo.filename,
        size: leaveDocumentInfo.size,
        uploadedAt: leaveDocumentInfo.uploadedAt
      } : null
    });

  } catch (error) {
    console.error('❌ Error in markStudentLeave:', error);
    return createErrorResponse(res, 500, `Failed to mark leave: ${error.message}`);
  }
};

const sanitizeAttendanceForResponse = (attendance) => {
  if (!attendance) return null;
  const serializeId = (value) => (typeof value === 'bigint' ? value.toString() : value ?? null);

  return {
    ...attendance,
    id: serializeId(attendance.id),
    studentId: serializeId(attendance.studentId),
    staffId: serializeId(attendance.staffId),
    teacherId: serializeId(attendance.teacherId),
    classId: serializeId(attendance.classId),
    schoolId: serializeId(attendance.schoolId),
    createdBy: serializeId(attendance.createdBy),
    updatedBy: serializeId(attendance.updatedBy),
    date: attendance.date ? formatAfghanistanLocalISO(attendance.date) : null,
    createdAt: attendance.createdAt ? attendance.createdAt.toISOString() : null,
    updatedAt: attendance.updatedAt ? attendance.updatedAt.toISOString() : null,
  };
};

const buildStaffLeaveSlipHtml = (attendance, staffRecord, reason, requester) => {
  const personUser = staffRecord?.user;
  const staffName =
    `${personUser?.firstName ?? ''} ${personUser?.lastName ?? ''}`.trim() ||
    personUser?.displayName ||
    'Unknown Staff';
  const department =
    staffRecord?.department?.name ||
    staffRecord?.department?.title ||
    personUser?.department ||
    'Unassigned';
  const schoolName = staffRecord?.school?.name || 'School';
  const requesterName = requester?.displayName || `${requester?.firstName ?? ''} ${requester?.lastName ?? ''}`.trim();
  const leaveDate = attendance?.date ? new Date(attendance.date).toLocaleDateString() : 'N/A';
  const submissionDate = new Date().toLocaleString();

  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>Staff Leave Slip - ${staffName}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
        .card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; max-width: 720px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 24px; }
        .header h1 { margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 3px; color: #475569; }
        .header h2 { margin: 8px 0 0; font-size: 28px; color: #0f172a; }
        .row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .row label { font-weight: bold; color: #475569; }
        .section { margin-top: 24px; }
        .section-title { text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; font-size: 13px; margin-bottom: 8px; }
        .reason { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; background: #f8fafc; min-height: 80px; }
        .footer { margin-top: 32px; display: flex; justify-content: space-between; font-size: 14px; color: #475569; }
        hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${schoolName}</h1>
          <h2>Staff Leave Authorization</h2>
        </div>
        <div class="row">
          <label>Staff name:</label>
          <span>${staffName}</span>
        </div>
        <div class="row">
          <label>Department:</label>
          <span>${department}</span>
        </div>
        <div class="row">
          <label>Leave date:</label>
          <span>${leaveDate}</span>
        </div>
        <div class="row">
          <label>Recorded by:</label>
          <span>${requesterName || '—'}</span>
        </div>
        <div class="section">
          <div class="section-title">Reason / Notes</div>
          <div class="reason">
            ${reason || '—'}
          </div>
        </div>
        <hr />
        <div class="footer">
          <div>
            <div>Signature</div>
            <div>__________________________</div>
          </div>
          <div>
            <div>Submitted on</div>
            <div>${submissionDate}</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
};

const normalizeBigInt = (value) => {
  if (value === null || value === undefined) return null;
  try {
    return BigInt(value);
  } catch (error) {
    return null;
  }
};

const resolvePersonnelRecord = async (identifier, schoolId) => {
  const numericId = normalizeBigInt(identifier);
  const stringId = typeof identifier === 'string' ? identifier.trim() : null;

  const buildOrClauses = () => {
    const clauses = [];
    if (numericId !== null) {
      clauses.push({ id: numericId });
      clauses.push({ userId: numericId });
    }
    if (stringId) {
      clauses.push({ user: { username: stringId } });
      clauses.push({ user: { uuid: stringId } });
    }
    return clauses.length ? clauses : undefined;
  };

  const staffRecord = await prisma.staff.findFirst({
    where: {
      schoolId: BigInt(schoolId),
      deletedAt: null,
      OR: buildOrClauses(),
    },
    include: {
      user: true,
      department: true,
      school: true,
    },
  });

  if (staffRecord) {
    return { staffRecord };
  }

  const teacherRecord = await prisma.teacher.findFirst({
    where: {
      schoolId: BigInt(schoolId),
      deletedAt: null,
      OR: buildOrClauses(),
    },
    include: {
      user: true,
      department: true,
      school: true,
    },
  });

  if (teacherRecord) {
    return { teacherRecord };
  }

  return null;
};

export const markStaffLeave = async (req, res) => {
  try {
    const { staffId, date, reason, remarks } = req.body;
    const scope = await resolveManagedScope(req);
    const schoolId = scope?.schoolId ?? req.user?.schoolId;
    const createdBy = req.user?.id;

    if (!staffId || !date || !reason) {
      return createErrorResponse(res, 400, 'Missing required fields: staffId, date, reason');
    }

    if (!schoolId) {
      return createErrorResponse(res, 400, 'Unable to resolve school context for leave request');
    }

    const personnel = await resolvePersonnelRecord(staffId, schoolId);

    if (!personnel) {
      return createErrorResponse(res, 404, 'Staff or teacher record not found for this school');
    }

    const staffRecord = personnel.staffRecord ?? null;
    const teacherRecord = personnel.teacherRecord ?? null;

    const dateString = String(date).trim();
    const { startOfDayUTC, endOfDayUTC } = getAfghanistanDayRangeUTC(dateString);

    if (!startOfDayUTC || !endOfDayUTC) {
      return createErrorResponse(res, 400, `Invalid date format. Expected YYYY-MM-DD, received: ${date}`);
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        schoolId: BigInt(schoolId),
        date: {
          gte: startOfDayUTC,
          lte: endOfDayUTC,
        },
        deletedAt: null,
        ...(staffRecord ? { staffId: staffRecord.id } : {}),
        ...(teacherRecord ? { teacherId: teacherRecord.id } : {}),
      },
    });

    const leaveReason = reason || remarks || 'Staff leave';
    let attendance;

    const attendanceInclude = {
      staff: {
        include: {
          user: true,
          department: true,
        },
      },
      teacher: {
        include: {
          user: true,
          department: true,
        },
      },
      school: true,
    };

    if (existingAttendance) {
      attendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: 'EXCUSED',
          remarks: leaveReason,
          leaveDocumentPath: existingAttendance.leaveDocumentPath,
          updatedBy: BigInt(createdBy),
          updatedAt: new Date(),
        },
        include: attendanceInclude,
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          staffId: staffRecord ? staffRecord.id : null,
          teacherId: teacherRecord ? teacherRecord.id : null,
          schoolId: BigInt(schoolId),
          date: startOfDayUTC,
          status: 'EXCUSED',
          remarks: leaveReason,
          createdBy: BigInt(createdBy),
        },
        include: attendanceInclude,
      });
    }

    try {
      await createAuditLog({
        action: existingAttendance ? 'UPDATE' : 'CREATE',
        entityType: 'Attendance',
        entityId: attendance.id,
        userId: BigInt(createdBy),
        schoolId: BigInt(schoolId),
        newData: JSON.stringify({
          staffId: attendance.staffId?.toString() ?? null,
          teacherId: attendance.teacherId?.toString() ?? null,
          date: formatAfghanistanLocalISO(attendance.date),
          reason: leaveReason,
        }),
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
      });
    } catch (auditError) {
      console.error('Failed to create audit log for staff leave:', auditError);
    }

    const printableHtml = buildStaffLeaveSlipHtml(
      attendance,
      staffRecord ?? teacherRecord,
      leaveReason,
      req.user
    );

    return createSuccessResponse(
      res,
      'Staff leave recorded successfully',
      {
        attendance: sanitizeAttendanceForResponse(attendance),
        printableHtml,
      },
      existingAttendance ? 200 : 201,
    );
  } catch (error) {
    console.error('Error in markStaffLeave:', error);
    return createErrorResponse(res, 500, 'Failed to record staff leave', error.message);
  }
};

/**
 * Resend SMS for attendance (mark-in or mark-out)
 */
export const resendAttendanceSMS = async (req, res) => {
  try {
    const { attendanceId, smsType } = req.body; // smsType: 'in' or 'out'
    
    console.log('🔄 Resending SMS for attendance:', { attendanceId, smsType });
    
    if (!attendanceId || !smsType) {
      return createErrorResponse(res, 400, 'Missing required fields: attendanceId and smsType');
    }
    
    if (smsType !== 'in' && smsType !== 'out') {
      return createErrorResponse(res, 400, 'Invalid smsType. Must be "in" or "out"');
    }

    const scope = await resolveManagedScope(req);
    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      BigInt(1);
    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const attendanceIdBigInt = toBigIntSafe(attendanceId);
    if (!attendanceIdBigInt) {
      return createErrorResponse(res, 400, 'Invalid attendance ID');
    }

    const accessible = await verifyAttendanceInScope(attendanceIdBigInt, normalizedScope);
    if (!accessible) {
      return createErrorResponse(res, 404, 'Attendance record not found');
    }

    const { where: scopedAttendanceWhere } = await ensureScopedAttendanceWhere(
      normalizedScope,
      {
        id: attendanceIdBigInt,
        deletedAt: null
      }
    );
    
    const attendance = await prisma.attendance.findFirst({
      where: scopedAttendanceWhere,
      include: {
        student: {
          include: {
            user: true,
            parent: {
              include: {
                user: true
              }
            },
            class: true
          }
        }
      }
    });
    
    if (!attendance) {
      return createErrorResponse(res, 404, 'Attendance record not found');
    }
    
    const student = attendance.student;
    const recipientPhone = student?.parent?.user?.phone || student?.user?.phone || null;
    
    if (!recipientPhone) {
      return createErrorResponse(res, 400, 'No phone number available for student or parent');
    }
    
    const resolvedActorId =
      toBigIntSafe(req.user?.id) ??
      toBigIntSafe(attendance.updatedBy) ??
      toBigIntSafe(attendance.createdBy) ??
      null;

    // Determine which SMS to send
    let smsStatus, smsError, smsRequestId, smsSentAt;
    let campaignId, timeValue, statusValue;
    
    if (smsType === 'in') {
      if (!attendance.inTime) {
        return createErrorResponse(res, 400, 'No in-time recorded for this attendance');
      }
      campaignId = '403';
      timeValue = attendance.inTime;
      statusValue = 'PRESENT';
    } else {
      if (!attendance.outTime) {
        return createErrorResponse(res, 400, 'No out-time recorded for this attendance');
      }
      campaignId = '404';
      timeValue = attendance.outTime;
      statusValue = attendance.inTime ? 'DEPARTED' : 'LATE_DEPARTURE';
    }
    
    console.log('📱 Resending SMS:', {
      student: `${student.user.firstName} ${student.user.lastName}`,
      phone: recipientPhone,
      type: smsType,
      campaignId
    });
    
    // Send SMS
    try {
      const smsResult = await smsService.sendAttendanceSMS(
        {
          name: `${student.user.firstName} ${student.user.lastName}`,
          phone: recipientPhone
        },
        {
          [smsType === 'in' ? 'inTime' : 'outTime']: formatAfghanistanLocalISO(timeValue),
          date: formatAfghanistanLocalISO(attendance.date),
          className: student.class?.name || 'Unknown Class',
          status: statusValue,
          note: smsType === 'out' && !attendance.inTime ? 'No mark-in recorded today' : undefined
        },
        campaignId
      );
      
      if (smsResult && smsResult.success) {
        console.log('✅ SMS resent successfully');
        smsStatus = 'SENT';
        smsSentAt = new Date();
        smsRequestId = smsResult.data?.RequestID || smsResult.campaignId || null;
        smsError = null;
      } else {
        console.error('❌ SMS resend failed:', smsResult?.error || smsResult?.warning || 'Unknown error');
        smsStatus = 'FAILED';
        smsError = smsResult?.error || smsResult?.warning || 'Unknown SMS error';
      }
    } catch (smsErrorCaught) {
      console.error('❌ Error resending SMS:', smsErrorCaught);
      smsStatus = 'FAILED';
      smsError = smsErrorCaught.message;
    }
    
    // Update attendance record with SMS status
    try {
      const updateData = smsType === 'in'
        ? {
            smsInStatus: smsStatus,
            smsInError: smsError,
            smsInSentAt: smsSentAt,
            smsInRequestId: smsRequestId,
            smsInAttempts: (attendance.smsInAttempts || 0) + 1,
            smsInSource: 'MANUAL',
            ...(resolvedActorId ? { smsInSentBy: resolvedActorId } : {})
          }
        : {
            smsOutStatus: smsStatus,
            smsOutError: smsError,
            smsOutSentAt: smsSentAt,
            smsOutRequestId: smsRequestId,
            smsOutAttempts: (attendance.smsOutAttempts || 0) + 1,
            smsOutSource: 'MANUAL',
            ...(resolvedActorId ? { smsOutSentBy: resolvedActorId } : {})
          };

      await prisma.attendance.update({
        where: { id: attendance.id },
        data: updateData
      });

      console.log('📝 Attendance record updated with SMS status');
    } catch (statusUpdateError) {
      console.error('❌ Failed to update attendance SMS status:', statusUpdateError);
    }
    
    return createSuccessResponse(res, 200, 'SMS resend processed', {
      attendanceId: attendance.id.toString(),
      smsType,
      status: smsStatus,
      error: smsError,
      sentAt: smsSentAt ? smsSentAt.toISOString() : null
    });
  } catch (error) {
    console.error('❌ Error in resendAttendanceSMS:', error);
    return createErrorResponse(res, 500, `Failed to resend attendance SMS: ${error.message}`);
  }
};

/**
 * Bulk OCR Attendance
 * Process attendance sheet image using OCR and create attendance records
 * Uses Node.js OCR service to extract attendance data from image
 */
export const bulkOCRAttendance = async (req, res) => {
  try {
    // DEBUG: Log the entire request body
    console.log('🔍 RAW REQUEST BODY KEYS:', Object.keys(req.body));
    console.log('🔍 RAW REQUEST BODY (without image):', {
      ...req.body,
      image: req.body.image ? `[${req.body.image.substring(0, 50)}...]` : 'NO IMAGE'
    });

    // Check if OCR service is available
    if (!extractSingleRowAttendance) {
      return createErrorResponse(res, 503, 'OCR service is not available. Please install required dependencies (tesseract.js, sharp) or contact system administrator.');
    }

    const { studentId, classId, image, rowNumber, startDate, numDays } = req.body;
    const userId = req.user?.id;

    console.log('📸 Bulk OCR Attendance Request (after destructuring):', {
      studentId,
      studentIdType: typeof studentId,
      classId,
      rowNumber,
      startDate,
      numDays,
      imageLength: image ? image.length : 0,
      userId
    });

    // Validate required fields
    if (!studentId) {
      console.error('❌ VALIDATION FAILED: studentId is missing or falsy');
      return createErrorResponse(res, 400, 'Student ID is required');
    }

    if (!image) {
      return createErrorResponse(res, 400, 'Attendance sheet image is required');
    }

    if (!rowNumber || rowNumber < 1) {
      return createErrorResponse(res, 400, 'Valid row number is required (must be >= 1)');
    }

    if (!startDate) {
      return createErrorResponse(res, 400, 'Start date is required');
    }

    if (!numDays || numDays < 1) {
      return createErrorResponse(res, 400, 'Number of days is required (must be >= 1)');
    }

    const scope = await resolveManagedScope(req);
    const resolvedSchoolId =
      toBigIntSafe(scope?.schoolId) ??
      toBigIntSafe(req.user?.schoolId) ??
      BigInt(1);
    const normalizedScope = normalizeScopeWithSchool(scope, resolvedSchoolId);

    const studentIdBigInt = toBigIntSafe(studentId);
    if (!studentIdBigInt) {
      return createErrorResponse(res, 400, 'Invalid student ID');
    }

    const studentAccessible = await verifyStudentInManagedScope(studentIdBigInt, normalizedScope);
    if (!studentAccessible) {
      return createErrorResponse(res, 404, 'Student not found in the selected context');
    }

    // Verify student exists and fetch relations
    const student = await prisma.student.findUnique({
      where: { id: studentIdBigInt },
      include: {
        class: true,
        user: true,
        parent: {
          include: {
            user: true
          }
        }
      }
    });

    if (!student) {
      return createErrorResponse(res, 404, 'Student not found');
    }

    const branchIdForRecords =
      normalizedScope.branchId ??
      (student.branchId ? toBigIntSafe(student.branchId) : null);
    const courseIdForRecords =
      normalizedScope.courseId ??
      (student.courseId ? toBigIntSafe(student.courseId) : null);

    const effectiveClassId = classId ? toBigIntSafe(classId) : student.classId;

    if (!effectiveClassId) {
      return createErrorResponse(res, 400, 'Class ID is required');
    }

    const classAccessible = await verifyClassInManagedScope(effectiveClassId, normalizedScope);
    if (!classAccessible) {
      return createErrorResponse(res, 404, 'Class not found in the selected context');
    }

    // Decode base64 image to buffer
    console.log('📡 Processing image with Node.js OCR service...');
    const imageData = image.includes(',') ? image.split(',')[1] : image;
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Call Node.js OCR service
    const ocrResult = await extractSingleRowAttendance(
      imageBuffer,
      rowNumber,
      startDate,
      numDays
    );

    console.log('✅ OCR result:', {
      success: ocrResult.success,
      datesExtracted: Object.keys(ocrResult.attendance || {}).length
    });

    if (!ocrResult.success || !ocrResult.attendance) {
      return createErrorResponse(res, 500, 'OCR processing failed to extract attendance data');
    }

    const attendanceData = ocrResult.attendance;
    const attendanceDates = Object.keys(attendanceData);

    console.log(`📊 Extracted attendance for ${attendanceDates.length} dates`);

    // Create or update attendance records
    const createdRecords = [];
    const updatedRecords = [];
    const errors = [];

    for (const dateStr of attendanceDates) {
      try {
        const dayData = attendanceData[dateStr];
        const status = dayData.status;

        const { startOfDayUTC, endOfDayUTC } = getAfghanistanDayRangeUTC(dateStr);

        if (!startOfDayUTC || !endOfDayUTC) {
          errors.push({ date: dateStr, error: 'Invalid date format' });
          continue;
        }

        const { where: scopedExistingWhere } = await ensureScopedAttendanceWhere(
          normalizedScope,
          {
            studentId: studentIdBigInt,
            classId: effectiveClassId,
            date: {
              gte: startOfDayUTC,
              lte: endOfDayUTC
            },
            schoolId: resolvedSchoolId,
            deletedAt: null
          }
        );

        const existingAttendance = await prisma.attendance.findFirst({
          where: scopedExistingWhere
        });

        const attendancePayload = {
          studentId: studentIdBigInt,
          classId: effectiveClassId,
          schoolId: resolvedSchoolId,
          branchId: branchIdForRecords,
          courseId: courseIdForRecords,
          date: startOfDayUTC,
          status: status,
          remarks: `Bulk OCR import from attendance sheet (row ${rowNumber})`,
          createdBy: userId ? BigInt(userId) : null,
          updatedBy: userId ? BigInt(userId) : null
        };

        if (existingAttendance) {
          const updated = await prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: {
              status: status,
              remarks: `Bulk OCR update from attendance sheet (row ${rowNumber})`,
              branchId: branchIdForRecords ?? existingAttendance.branchId ?? null,
              courseId: courseIdForRecords ?? existingAttendance.courseId ?? null,
              updatedBy: userId ? BigInt(userId) : null,
              updatedAt: new Date()
            }
          });
          updatedRecords.push(updated);
          console.log(`✏️ Updated attendance for ${dateStr}: ${status}`);
        } else {
          const created = await prisma.attendance.create({
            data: attendancePayload
          });
          createdRecords.push(created);
          console.log(`➕ Created attendance for ${dateStr}: ${status}`);
        }

      } catch (error) {
        console.error(`❌ Error processing date ${dateStr}:`, error);
        errors.push({ date: dateStr, error: error.message });
      }
    }

    console.log('📊 Bulk OCR Attendance Summary:', {
      created: createdRecords.length,
      updated: updatedRecords.length,
      errors: errors.length
    });

    return res.json({
      success: true,
      message: `Successfully processed ${createdRecords.length + updatedRecords.length} attendance records`,
      data: {
        created: createdRecords.length,
        updated: updatedRecords.length,
        total: attendanceDates.length,
        errors: errors.length > 0 ? errors : undefined,
        studentId: studentId,
        studentName: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`.trim(),
        classId: effectiveClassId.toString(),
        startDate: startDate,
        numDays: numDays,
        branchId: branchIdForRecords ? branchIdForRecords.toString() : null,
        courseId: courseIdForRecords ? courseIdForRecords.toString() : null
      }
    });
  } catch (error) {
    console.error('❌ Error in bulkOCRAttendance:', error);
    return createErrorResponse(res, 500, `Failed to process bulk OCR attendance: ${error.message}`);
  }
};

  export default {
    getAllAttendances,
    getAttendanceById,
    createAttendance,
    updateAttendance,
    markInTime,
    markOutTime,
    bulkCreateAttendance,
    bulkOCRAttendance,
    deleteAttendance,
    getClassAttendanceSummary,
    getAttendanceSummary,
    getAttendanceStats,
    getAttendanceAnalytics,
    getMonthlyAttendanceMatrix,
    exportAttendanceData,
    // autoMarkAbsentStudents, // COMMENTED OUT: Automatic attendance marking is disabled
    markIncompleteAttendanceAsAbsent,
    getAttendanceTimeStatus,
    markStudentLeave,
    downloadLeaveDocument,
    resendAttendanceSMS
  };
