import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

const ROLE_MAPPING = {
  ADMIN: ['TEACHER'], // DB TEACHER = platform admins
  SCHOOL_ADMIN: ['SCHOOL_ADMIN'],
  TEACHER: ['SCHOOL_ADMIN'],
  SUPER_ADMIN: ['SUPER_ADMIN'],
  PARENT: ['PARENT'],
  STUDENT: ['STUDENT'],
  FINANCE: ['FINANCE_OFFICER', 'ACCOUNTANT', 'TEACHER'],
  INVENTORY: ['INVENTORY_OFFICER', 'TEACHER'],
  TRANSPORT: ['TRANSPORT_MANAGER', 'TEACHER']
};

export const mapNotificationRoles = (notificationRoles = []) => {
  const roles = Array.isArray(notificationRoles) ? notificationRoles : [notificationRoles];
  const mapped = roles.flatMap(role => ROLE_MAPPING[role] || [role]).filter(Boolean);
  return [...new Set(mapped)];
};

export const getUsersByNotificationRoles = async (roles = [], schoolId, options = {}) => {
  if (!roles.length || !schoolId) {
    return [];
  }

  const actualRoles = mapNotificationRoles(roles);
  if (!actualRoles.length) {
    return [];
  }

  const { classId, includeInactive = false } = options;

  if (classId) {
    const classIdBigInt = BigInt(classId);

    const teacherRecords = await prisma.teacher.findMany({
      where: {
        schoolId: BigInt(schoolId),
        deletedAt: null,
        user: {
          role: { in: actualRoles },
          deletedAt: null,
          ...(includeInactive ? {} : { status: 'ACTIVE' })
        },
        OR: [
          {
            classesAsClassTeacher: {
              some: { id: classIdBigInt }
            }
          },
          {
            classes: {
              some: { classId: classIdBigInt }
            }
          }
        ]
      },
      select: {
        userId: true
      }
    });

    return teacherRecords.map(record => record.userId);
  }

  const where = {
    schoolId: BigInt(schoolId),
    role: { in: actualRoles },
    deletedAt: null
  };

  if (!includeInactive) {
    where.status = 'ACTIVE';
  }

  const users = await prisma.user.findMany({
    where,
    select: { id: true }
  });

  return users.map(user => user.id);
};

// ======================
// RECIPIENT HELPERS
// ======================

/**
 * Get class teacher (SCHOOL_ADMIN role - actual teachers)
 */
export const getClassTeacher = async (classId) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: BigInt(classId) },
      include: {
        classTeacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true
              }
            }
          }
        }
      }
    });

    return classData?.classTeacher || null;
  } catch (error) {
    console.error('Error getting class teacher:', error);
    return null;
  }
};

/**
 * Get all admins (TEACHER role users)
 */
export const getAdminUsers = async (schoolId) => {
  try {
    return getUsersByNotificationRoles(['ADMIN'], schoolId);
  } catch (error) {
    console.error('Error getting admin users:', error);
    return [];
  }
};

/**
 * Get all teachers (SCHOOL_ADMIN role users)
 */
export const getTeachers = async (schoolId) => {
  try {
    return getUsersByNotificationRoles(['TEACHER'], schoolId);
  } catch (error) {
    console.error('Error getting teachers:', error);
    return [];
  }
};

/**
 * Get parents for a specific class
 */
export const getParentsByClass = async (classId) => {
  try {
    const students = await prisma.student.findMany({
      where: {
        classId: BigInt(classId),
        deletedAt: null,
        parentId: {
          not: null
        }
      },
      include: {
        parent: {
          select: {
            userId: true
          }
        }
      }
    });

    return students
      .filter(s => s.parent?.userId)
      .map(s => s.parent.userId);
  } catch (error) {
    console.error('Error getting parents by class:', error);
    return [];
  }
};

/**
 * Build comprehensive recipient list for student-related notifications
 */
export const getStudentNotificationRecipients = async (student, options = {}) => {
  const {
    includeParent = true,
    includeClassTeacher = false,
    includeAdmins = false,
    schoolId
  } = options;

  const recipients = [];

  try {
    // 1. Parent (always for student-related notifications)
    if (includeParent && student.parent?.userId) {
      recipients.push(student.parent.userId);
    }

    // 2. Class Teacher (SCHOOL_ADMIN role) - only for their students
    if (includeClassTeacher && student.classId) {
      const classTeacher = await getClassTeacher(student.classId);
      if (classTeacher?.userId) {
        recipients.push(classTeacher.userId);
      }
    }

    // 3. Admins (TEACHER role) - for important school-wide events
    if (includeAdmins && schoolId) {
      const admins = await getUsersByNotificationRoles(['ADMIN'], schoolId);
      recipients.push(...admins);
    }

    // Remove duplicates
    return [...new Set(recipients)];
  } catch (error) {
    console.error('Error getting student notification recipients:', error);
    return recipients;
  }
};

// ======================
// FORMATTING HELPERS
// ======================

/**
 * Format student name consistently
 */
export const formatStudentName = (student) => {
  if (!student || !student.user) return 'Unknown Student';
  
  const { firstName, lastName, dariName } = student.user;
  const englishName = `${firstName || ''} ${lastName || ''}`.trim();
  
  if (dariName) {
    return `${englishName} (${dariName})`;
  }
  
  return englishName || 'Unknown Student';
};

/**
 * Format currency amount (AFN)
 */
export const formatCurrency = (amount) => {
  if (!amount) return '0';
  return new Intl.NumberFormat('en-US').format(amount) + ' AFN';
};

/**
 * Format date nicely
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format time nicely
 */
export const formatTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Format percentage with emoji
 */
export const formatPercentageWithEmoji = (percentage) => {
  const emoji = percentage >= 90 ? '🌟' :
                percentage >= 80 ? '⭐' :
                percentage >= 70 ? '👍' :
                percentage >= 60 ? '📝' :
                percentage >= 40 ? '😐' : '⚠️';
  
  return `${emoji} ${percentage.toFixed(1)}%`;
};

// ======================
// PATTERN DETECTION
// ======================

/**
 * Calculate consecutive attendance streak
 */
export const calculateAttendanceStreak = async (studentId, schoolId) => {
  try {
    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: BigInt(studentId),
        schoolId: BigInt(schoolId),
        deletedAt: null
      },
      orderBy: { date: 'desc' },
      take: 30 // Last 30 days
    });

    let streak = 0;
    for (const att of attendances) {
      if (att.status === 'PRESENT' && att.inTime) {
        // Check if on time (before 8:30 AM)
        const inTime = new Date(att.inTime);
        const hours = inTime.getHours();
        const minutes = inTime.getMinutes();
        const isOnTime = hours < 8 || (hours === 8 && minutes <= 30);
        
        if (isOnTime) {
          streak++;
        } else {
          break; // Streak broken by late arrival
        }
      } else {
        break; // Streak broken by absence
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating attendance streak:', error);
    return 0;
  }
};

/**
 * Check for frequent late pattern (3+ times in last 7 days)
 */
export const checkFrequentLatePattern = async (studentId, schoolId) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const lateCount = await prisma.attendance.count({
      where: {
        studentId: BigInt(studentId),
        schoolId: BigInt(schoolId),
        date: { gte: sevenDaysAgo },
        status: 'PRESENT',
        inTime: { not: null },
        deletedAt: null
      }
    });

    // Count how many were late (after 8:30)
    const lateAttendances = await prisma.attendance.findMany({
      where: {
        studentId: BigInt(studentId),
        schoolId: BigInt(schoolId),
        date: { gte: sevenDaysAgo },
        status: 'PRESENT',
        inTime: { not: null },
        deletedAt: null
      }
    });

    const actualLateCount = lateAttendances.filter(att => {
      const inTime = new Date(att.inTime);
      const hours = inTime.getHours();
      const minutes = inTime.getMinutes();
      return hours > 8 || (hours === 8 && minutes > 30);
    }).length;

    return actualLateCount >= 3;
  } catch (error) {
    console.error('Error checking late pattern:', error);
    return false;
  }
};

/**
 * Check for frequent absent pattern (3+ times in last 30 days)
 */
export const checkFrequentAbsentPattern = async (studentId, schoolId) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const absentCount = await prisma.attendance.count({
      where: {
        studentId: BigInt(studentId),
        schoolId: BigInt(schoolId),
        date: { gte: thirtyDaysAgo },
        status: 'ABSENT',
        deletedAt: null
      }
    });

    return absentCount >= 3;
  } catch (error) {
    console.error('Error checking absent pattern:', error);
    return false;
  }
};

/**
 * Detect grade performance trend (improving/declining)
 */
export const detectPerformanceTrend = async (studentId, subjectId, examId) => {
  try {
    const grades = await prisma.grade.findMany({
      where: {
        studentId: BigInt(studentId),
        subjectId: BigInt(subjectId),
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        exam: {
          select: {
            totalMarks: true,
            passingMarks: true
          }
        }
      }
    });

    if (grades.length < 2) return null; // Need at least 2 grades to compare

    const currentGrade = grades[0];
    const previousGrade = grades[1];

    const currentPercentage = (parseFloat(currentGrade.marks) / parseFloat(currentGrade.exam.totalMarks)) * 100;
    const previousPercentage = (parseFloat(previousGrade.marks) / parseFloat(previousGrade.exam.totalMarks)) * 100;

    const difference = currentPercentage - previousPercentage;

    if (difference >= 10) {
      return { trend: 'IMPROVING', difference: difference.toFixed(1) };
    } else if (difference <= -10) {
      return { trend: 'DECLINING', difference: Math.abs(difference).toFixed(1) };
    }

    return null; // No significant trend
  } catch (error) {
    console.error('Error detecting performance trend:', error);
    return null;
  }
};

/**
 * Check if student qualifies for honor roll (avg >= 85%)
 */
export const checkHonorRoll = async (studentId, examId) => {
  try {
    const grades = await prisma.grade.findMany({
      where: {
        studentId: BigInt(studentId),
        examId: BigInt(examId),
        isAbsent: false,
        deletedAt: null
      },
      include: {
        exam: {
          select: { totalMarks: true }
        }
      }
    });

    if (grades.length === 0) return false;

    const totalPercentage = grades.reduce((sum, grade) => {
      const percentage = (parseFloat(grade.marks) / parseFloat(grade.exam.totalMarks)) * 100;
      return sum + percentage;
    }, 0);

    const averagePercentage = totalPercentage / grades.length;

    return averagePercentage >= 85;
  } catch (error) {
    console.error('Error checking honor roll:', error);
    return false;
  }
};

/**
 * Get monthly attendance summary for student
 */
export const getMonthlyAttendanceSummary = async (studentId, schoolId, year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        studentId: BigInt(studentId),
        schoolId: BigInt(schoolId),
        date: {
          gte: startDate,
          lte: endDate
        },
        deletedAt: null
      }
    });

    const totalDays = attendances.length;
    const presentDays = attendances.filter(a => a.status === 'PRESENT').length;
    const absentDays = attendances.filter(a => a.status === 'ABSENT').length;
    const lateDays = attendances.filter(a => {
      if (a.status !== 'PRESENT' || !a.inTime) return false;
      const inTime = new Date(a.inTime);
      return inTime.getHours() > 8 || (inTime.getHours() === 8 && inTime.getMinutes() > 30);
    }).length;
    const excusedDays = attendances.filter(a => a.status === 'EXCUSED').length;

    const attendancePercentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage: attendancePercentage.toFixed(1)
    };
  } catch (error) {
    console.error('Error getting monthly attendance summary:', error);
    return null;
  }
};

// ======================
// MESSAGE BUILDERS
// ======================

/**
 * Build detailed student enrollment notification
 */
export const buildEnrollmentNotification = (student, className) => {
  const studentName = formatStudentName(student);
  
  return {
    title: '🎓 New Student Enrolled',
    message: `${studentName} has been enrolled in Class ${className}. Admission Number: ${student.admissionNo}. Welcome to our school!`,
    priority: 'NORMAL'
  };
};

/**
 * Build student update notification with change details
 */
export const buildStudentUpdateNotification = (student, changes, className) => {
  const studentName = formatStudentName(student);
  const changeList = changes.slice(0, 3).join(', ');
  const moreChanges = changes.length > 3 ? ` and ${changes.length - 3} more` : '';
  
  return {
    title: '📝 Student Profile Updated',
    message: `${studentName} (Class ${className}) profile has been updated. Changes: ${changeList}${moreChanges}.`,
    priority: 'NORMAL'
  };
};

/**
 * Build perfect attendance notification
 */
export const buildPerfectAttendanceNotification = (student, period, className) => {
  const studentName = formatStudentName(student);
  const emoji = period === 'week' ? '🏆' : '🌟';
  const periodText = period === 'week' ? 'this week' : 'this month';
  
  return {
    title: `${emoji} Perfect Attendance Achievement`,
    message: `Congratulations! ${studentName} (Class ${className}) maintained perfect attendance ${periodText}. Keep up the excellent work!`,
    priority: 'LOW'
  };
};

/**
 * Build grade improvement notification
 */
export const buildGradeImprovementNotification = (student, subject, currentMarks, previousMarks, totalMarks, className) => {
  const studentName = formatStudentName(student);
  const currentPercent = (currentMarks / totalMarks) * 100;
  const previousPercent = (previousMarks / totalMarks) * 100;
  const improvement = currentPercent - previousPercent;
  
  return {
    title: '📈 Grade Improvement!',
    message: `Great news! ${studentName} (Class ${className}) improved in ${subject} from ${previousPercent.toFixed(1)}% to ${currentPercent.toFixed(1)}% - an improvement of ${improvement.toFixed(1)} percentage points!`,
    priority: 'NORMAL'
  };
};

/**
 * Build payment reminder notification
 */
export const buildPaymentReminderNotification = (student, amount, dueDate, daysUntilDue, className) => {
  const studentName = formatStudentName(student);
  const formattedAmount = formatCurrency(amount);
  const dueDateFormatted = formatDate(dueDate);
  
  const urgencyEmoji = daysUntilDue <= 1 ? '🚨' : daysUntilDue <= 3 ? '⚠️' : '💰';
  const urgencyText = daysUntilDue === 0 ? 'today' :
                      daysUntilDue === 1 ? 'tomorrow' :
                      `in ${daysUntilDue} days`;
  
  return {
    title: `${urgencyEmoji} Payment Reminder`,
    message: `Payment of ${formattedAmount} for ${studentName} (Class ${className}) is due ${urgencyText} (${dueDateFormatted}). Please ensure timely payment.`,
    priority: daysUntilDue <= 1 ? 'HIGH' : daysUntilDue <= 3 ? 'NORMAL' : 'LOW'
  };
};

/**
 * Build academic probation notification
 */
export const buildAcademicProbationNotification = (student, failingSubjects, className) => {
  const studentName = formatStudentName(student);
  const subjectList = failingSubjects.slice(0, 3).join(', ');
  const moreSubjects = failingSubjects.length > 3 ? ` and ${failingSubjects.length - 3} more` : '';
  
  return {
    title: '⚠️ Academic Intervention Required',
    message: `${studentName} (Class ${className}) is currently failing in ${failingSubjects.length} subject${failingSubjects.length > 1 ? 's' : ''}: ${subjectList}${moreSubjects}. Academic support and parent meeting recommended.`,
    priority: 'HIGH'
  };
};

/**
 * Build ID card ready notification
 */
export const buildIdCardReadyNotification = (student, className) => {
  const studentName = formatStudentName(student);
  
  return {
    title: '🎴 Student ID Card Ready',
    message: `Student ID card for ${studentName} (Class ${className}) is now ready for collection. Please visit the administration office.`,
    priority: 'NORMAL'
  };
};

/**
 * Build assignment due reminder
 */
export const buildAssignmentDueNotification = (student, assignmentTitle, subject, dueDate, className) => {
  const studentName = formatStudentName(student);
  const dueDateFormatted = formatDate(dueDate);
  
  return {
    title: '📚 Assignment Due Tomorrow',
    message: `Reminder for ${studentName} (Class ${className}): ${subject} assignment "${assignmentTitle}" is due tomorrow (${dueDateFormatted}). Please submit on time.`,
    priority: 'NORMAL'
  };
};

/**
 * Build emergency alert notification
 */
export const buildEmergencyAlertNotification = (title, message) => {
  return {
    title: `🚨 EMERGENCY: ${title}`,
    message,
    priority: 'URGENT'
  };
};

/**
 * Build report card ready notification
 */
export const buildReportCardReadyNotification = (student, term, className) => {
  const studentName = formatStudentName(student);
  
  return {
    title: '📊 Report Card Available',
    message: `${term} report card for ${studentName} (Class ${className}) is now available. Please check the parent portal to view detailed performance.`,
    priority: 'NORMAL'
  };
};

export default {
  ROLE_MAPPING,
  mapNotificationRoles,
  getUsersByNotificationRoles,
  getClassTeacher,
  getAdminUsers,
  getTeachers,
  getParentsByClass,
  getStudentNotificationRecipients,
  formatStudentName,
  formatCurrency,
  formatDate,
  formatTime,
  formatPercentageWithEmoji,
  calculateAttendanceStreak,
  checkFrequentLatePattern,
  checkFrequentAbsentPattern,
  detectPerformanceTrend,
  checkHonorRoll,
  getMonthlyAttendanceSummary,
  buildEnrollmentNotification,
  buildStudentUpdateNotification,
  buildPerfectAttendanceNotification,
  buildGradeImprovementNotification,
  buildPaymentReminderNotification,
  buildAcademicProbationNotification,
  buildIdCardReadyNotification,
  buildAssignmentDueNotification,
  buildEmergencyAlertNotification,
  buildReportCardReadyNotification
};

