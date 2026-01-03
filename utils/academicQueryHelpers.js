import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

/**
 * Academic Query Helpers
 * Utilities for filtering queries by academic session
 */

/**
 * Add academic session date range filter
 * For models with date fields (attendance, payments, etc.)
 */
export const addSessionDateFilter = (where, academicSession, dateField = 'date') => {
  if (!academicSession) {
    return where;
  }

  return {
    ...where,
    [dateField]: {
      gte: academicSession.startDate,
      lte: academicSession.endDate,
    },
  };
};

/**
 * Get where clause for current academic session
 */
export const getCurrentSessionWhere = async (schoolId) => {
  const school = await prisma.school.findUnique({
    where: { id: BigInt(schoolId) },
    include: {
      academicSessions: {
        where: { isCurrent: true },
        take: 1,
      },
    },
  });

  const currentSession = school?.academicSessions?.[0];

  if (!currentSession) {
    return {};
  }

  return {
    academicSession: currentSession,
  };
};

/**
 * Filter attendance records by academic session
 */
export const filterAttendanceBySession = (where, academicSession) => {
  return addSessionDateFilter(where, academicSession, 'date');
};

/**
 * Filter grades by academic session
 * Grades are linked through exams which have terms linked to sessions
 */
export const filterGradesBySession = (where, academicSessionId) => {
  if (!academicSessionId) {
    return where;
  }

  return {
    ...where,
    exam: {
      term: {
        academicSessionId: BigInt(academicSessionId),
      },
    },
  };
};

/**
 * Filter payments by academic session
 */
export const filterPaymentsBySession = (where, academicSession) => {
  return addSessionDateFilter(where, academicSession, 'paymentDate');
};

/**
 * Filter enrollments by academic session
 */
export const filterEnrollmentsBySession = (where, academicSessionId) => {
  if (!academicSessionId) {
    return where;
  }

  return {
    ...where,
    academicSessionId: BigInt(academicSessionId),
  };
};

/**
 * Filter fee structures by academic session
 */
export const filterFeeStructuresBySession = (where, academicSessionId) => {
  if (!academicSessionId) {
    return where;
  }

  return {
    ...where,
    academicSessionId: BigInt(academicSessionId),
  };
};

/**
 * Filter teacher assignments by academic session
 */
export const filterTeacherAssignmentsBySession = (where, academicSessionId) => {
  if (!academicSessionId) {
    return where;
  }

  return {
    ...where,
    academicSessionId: BigInt(academicSessionId),
  };
};

/**
 * Get student's enrollment for specific session
 */
export const getStudentEnrollmentForSession = async (studentId, academicSessionId) => {
  return await prisma.studentEnrollment.findUnique({
    where: {
      studentId_academicSessionId: {
        studentId: BigInt(studentId),
        academicSessionId: BigInt(academicSessionId),
      },
    },
    include: {
      class: true,
      section: true,
      academicSession: true,
    },
  });
};

/**
 * Get students enrolled in a class for an academic session
 */
export const getStudentsByClassAndSession = async (classId, academicSessionId, filters = {}) => {
  const where = {
    classId: BigInt(classId),
    academicSessionId: BigInt(academicSessionId),
    status: 'ENROLLED',
    ...filters,
  };

  const enrollments = await prisma.studentEnrollment.findMany({
    where,
    include: {
      student: {
        include: {
          user: true,
        },
      },
      section: true,
    },
    orderBy: {
      rollNo: 'asc',
    },
  });

  return enrollments.map((enrollment) => ({
    ...enrollment.student,
    enrollmentId: enrollment.id,
    rollNo: enrollment.rollNo,
    section: enrollment.section,
    enrollmentStatus: enrollment.status,
  }));
};

/**
 * Check if a date falls within an academic session
 */
export const isDateInSession = (date, academicSession) => {
  if (!academicSession) {
    return true;
  }

  const checkDate = new Date(date);
  const startDate = new Date(academicSession.startDate);
  const endDate = new Date(academicSession.endDate);

  return checkDate >= startDate && checkDate <= endDate;
};

/**
 * Get academic session by date
 */
export const getSessionByDate = async (schoolId, date) => {
  const checkDate = new Date(date);

  return await prisma.academicSession.findFirst({
    where: {
      schoolId: BigInt(schoolId),
      startDate: { lte: checkDate },
      endDate: { gte: checkDate },
    },
  });
};

/**
 * Build comprehensive where clause with academic session context
 */
export const buildSessionAwareWhere = (baseWhere, academicSession, options = {}) => {
  const { includeDateFilter = false, dateField = 'date' } = options;

  let where = { ...baseWhere };

  if (academicSession && includeDateFilter) {
    where = addSessionDateFilter(where, academicSession, dateField);
  }

  return where;
};

/**
 * Helper to convert BigInt to string for JSON serialization
 */
export const serializeAcademicData = (data) => {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};

export default {
  addSessionDateFilter,
  getCurrentSessionWhere,
  filterAttendanceBySession,
  filterGradesBySession,
  filterPaymentsBySession,
  filterEnrollmentsBySession,
  filterFeeStructuresBySession,
  filterTeacherAssignmentsBySession,
  getStudentEnrollmentForSession,
  getStudentsByClassAndSession,
  isDateInSession,
  getSessionByDate,
  buildSessionAwareWhere,
  serializeAcademicData,
};










