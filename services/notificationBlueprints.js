import notificationHelpers from '../utils/notificationHelpers.js';

/**
 * Notification blueprints define reusable, role-aware notification templates.
 * Each blueprint is keyed by a `domain.scenario` string and describes the
 * category, subType, default priority, and per-audience templates.
 */
export const notificationBlueprints = {
  'student.enrolled': {
    category: 'STUDENT',
    subType: 'STUDENT_ENROLLED',
    priority: 'NORMAL',
    contextScope: ctx => ctx.classId ? 'class' : 'school',
    source: 'blueprint.student',
    audiences: {
      parent: {
        roles: ['PARENT'],
        channels: ['IN_APP', 'SMS'],
        title: ctx => `🎓 Welcome ${ctx.studentName}`,
        message: ctx => `${ctx.studentName} has been enrolled in ${ctx.className}. Admission No: ${ctx.admissionNo}. We are excited to support their journey!`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: true,
          includeClassTeacher: false,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          studentId: ctx.studentId,
          classId: ctx.classId,
          admissionNo: ctx.admissionNo,
          admissionDate: ctx.admissionDate,
          actorId: ctx.actorId
        })
      },
      teacher: {
        roles: ['SCHOOL_ADMIN'],
        channels: ['IN_APP', 'PUSH'],
        title: ctx => `👨‍🏫 New Student Assigned`,
        message: ctx => `${ctx.studentName} joined ${ctx.className}. Please prepare materials and update attendance rosters.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: false,
          includeClassTeacher: true,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          studentId: ctx.studentId,
          classId: ctx.classId,
          className: ctx.className,
          actorId: ctx.actorId
        })
      },
      admin: {
        roles: ['TEACHER'],
        channels: ['IN_APP'],
        title: ctx => `📋 New Enrollment Recorded`,
        message: ctx => `${ctx.studentName} enrolled into ${ctx.className}. Admission #${ctx.admissionNo}. Total students: ${ctx.totalStudentCount}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: false,
          includeClassTeacher: false,
          includeAdmins: true,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          studentId: ctx.studentId,
          schoolId: ctx.schoolId,
          totalStudentCount: ctx.totalStudentCount,
          actorId: ctx.actorId
        })
      }
    }
  },
  'student.updated': {
    category: 'STUDENT',
    subType: 'STUDENT_UPDATED',
    priority: 'NORMAL',
    contextScope: 'class',
    source: 'blueprint.student',
    audiences: {
      parent: {
        roles: ['PARENT'],
        channels: ['IN_APP'],
        title: ctx => `📝 Student Profile Updated`,
        message: ctx => `${ctx.studentName}'s profile was updated: ${ctx.changeSummary}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: true,
          includeClassTeacher: false,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          studentId: ctx.studentId,
          updatedFields: ctx.updatedFields,
          actorId: ctx.actorId
        })
      },
      admin: {
        roles: ['TEACHER'],
        channels: ['IN_APP'],
        title: ctx => `🛠 Student Profile Changes`,
        message: ctx => `${ctx.studentName} (${ctx.className}) updated fields: ${ctx.changeSummary}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: false,
          includeClassTeacher: false,
          includeAdmins: true,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          studentId: ctx.studentId,
          updatedFields: ctx.updatedFields,
          actorId: ctx.actorId,
          classId: ctx.classId
        })
      }
    }
  },
  'attendance.absent': {
    category: 'ATTENDANCE',
    subType: 'ATTENDANCE_ABSENT',
    priority: 'HIGH',
    contextScope: 'class',
    source: 'blueprint.attendance',
    audiences: {
      parent: {
        roles: ['PARENT'],
        channels: ['IN_APP', 'SMS'],
        title: ctx => `🚨 Absence Alert: ${ctx.studentName}`,
        message: ctx => `${ctx.studentName} was marked ABSENT on ${ctx.dateFormatted}. Please contact the school if this is unexpected.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: true,
          includeClassTeacher: false,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          attendanceId: ctx.attendanceId,
          date: ctx.date,
          status: ctx.status,
          actorId: ctx.actorId
        })
      },
      teacher: {
        roles: ['SCHOOL_ADMIN'],
        channels: ['IN_APP'],
        title: ctx => `🕘 Attendance Recorded`,
        message: ctx => `${ctx.studentName} marked ABSENT on ${ctx.dateFormatted}. Ensure follow-up per policy.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: false,
          includeClassTeacher: true,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          attendanceId: ctx.attendanceId,
          status: ctx.status,
          classId: ctx.classId,
          actorId: ctx.actorId
        })
      },
      admin: {
        roles: ['TEACHER'],
        channels: ['IN_APP'],
        title: ctx => `Attendance Exception Logged`,
        message: ctx => `${ctx.studentName} absent on ${ctx.dateFormatted}. Reason: ${ctx.reason || 'N/A'}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: false,
          includeClassTeacher: false,
          includeAdmins: true,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          attendanceId: ctx.attendanceId,
          reason: ctx.reason,
          schoolId: ctx.schoolId,
          actorId: ctx.actorId
        }),
        actionRequired: ctx => true,
        followUpAt: ctx => ctx.followUpAt || null
      }
    }
  },
  'attendance.late': {
    category: 'ATTENDANCE',
    subType: 'ATTENDANCE_LATE',
    priority: 'NORMAL',
    contextScope: 'class',
    source: 'blueprint.attendance',
    audiences: {
      parent: {
        roles: ['PARENT'],
        channels: ['IN_APP'],
        title: ctx => `⏰ Late Arrival Notice`,
        message: ctx => `${ctx.studentName} arrived late at ${ctx.inTimeFormatted} on ${ctx.dateFormatted}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: true,
          includeClassTeacher: false,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          attendanceId: ctx.attendanceId,
          inTime: ctx.inTime,
          actorId: ctx.actorId
        })
      },
      admin: {
        roles: ['TEACHER'],
        channels: ['IN_APP'],
        title: ctx => `Late Arrival Logged`,
        message: ctx => `${ctx.studentName} (Class ${ctx.className}) late at ${ctx.inTimeFormatted}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: false,
          includeClassTeacher: false,
          includeAdmins: true,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          attendanceId: ctx.attendanceId,
          inTime: ctx.inTime,
          classId: ctx.classId,
          actorId: ctx.actorId
        })
      }
    }
  },
  'payment.received': {
    category: 'FINANCE',
    subType: 'PAYMENT_RECEIVED',
    priority: 'HIGH',
    contextScope: 'school',
    source: 'blueprint.finance',
    audiences: {
      parent: {
        roles: ['PARENT'],
        channels: ['IN_APP'],
        title: ctx => `💰 Payment Received`,
        message: ctx => `We received ${ctx.amountFormatted} for ${ctx.studentName}. Receipt #: ${ctx.receiptNo}. Thank you!`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: true,
          includeClassTeacher: false,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          paymentId: ctx.paymentId,
          amount: ctx.amount,
          actorId: ctx.actorId
        })
      },
      finance: {
        roles: ['FINANCE', 'TEACHER'],
        channels: ['IN_APP'],
        title: ctx => `Finance Update: Payment Posted`,
        message: ctx => `${ctx.amountFormatted} received for ${ctx.studentName}. Method: ${ctx.method}.`,
        resolveRecipients: ctx => notificationHelpers.getUsersByNotificationRoles(['FINANCE'], ctx.schoolId),
        metadata: ctx => ({
          paymentId: ctx.paymentId,
          amount: ctx.amount,
          method: ctx.method,
          schoolId: ctx.schoolId,
          actorId: ctx.actorId
        })
      }
    }
  },
  'payment.due': {
    category: 'FINANCE',
    subType: 'PAYMENT_DUE',
    priority: 'NORMAL',
    contextScope: 'school',
    source: 'blueprint.finance',
    audiences: {
      parent: {
        roles: ['PARENT'],
        channels: ['IN_APP', 'SMS'],
        title: ctx => `${ctx.urgencyEmoji} Payment Due ${ctx.dueDescriptor}`,
        message: ctx => `${ctx.studentName} has ${ctx.amountFormatted} due ${ctx.dueDescriptor} (${ctx.dueDateFormatted}).`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: true,
          includeClassTeacher: false,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          paymentScheduleId: ctx.paymentScheduleId,
          dueDate: ctx.dueDate,
          amount: ctx.amount,
          actorId: ctx.actorId
        })
      },
      finance: {
        roles: ['FINANCE', 'TEACHER'],
        channels: ['IN_APP'],
        title: ctx => `Fee Due Reminder Scheduled`,
        message: ctx => `${ctx.studentName} owes ${ctx.amountFormatted} by ${ctx.dueDateFormatted}. Stage: ${ctx.stage}.`,
        resolveRecipients: ctx => notificationHelpers.getUsersByNotificationRoles(['FINANCE'], ctx.schoolId),
        metadata: ctx => ({
          paymentScheduleId: ctx.paymentScheduleId,
          dueDate: ctx.dueDate,
          amount: ctx.amount,
          urgency: ctx.stage,
          actorId: ctx.actorId
        }),
        actionRequired: ctx => ctx.stage !== 'informational',
        followUpAt: ctx => ctx.followUpAt || null
      }
    }
  },
  'academic.grade.posted': {
    category: 'ACADEMIC',
    subType: 'GRADE_POSTED',
    priority: 'NORMAL',
    contextScope: 'class',
    source: 'blueprint.academic',
    audiences: {
      parent: {
        roles: ['PARENT'],
        channels: ['IN_APP'],
        title: ctx => `📊 ${ctx.subject} Grade Released`,
        message: ctx => `${ctx.studentName} scored ${ctx.scoreFormatted} in ${ctx.subject}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: true,
          includeClassTeacher: false,
          includeAdmins: false,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          gradeId: ctx.gradeId,
          subject: ctx.subject,
          examId: ctx.examId,
          actorId: ctx.actorId
        })
      },
      student: {
        roles: ['STUDENT'],
        channels: ['IN_APP'],
        title: ctx => `✅ ${ctx.subject} Result Available`,
        message: ctx => `You scored ${ctx.scoreFormatted} (${ctx.percentage}%). Keep it up!`,
        resolveRecipients: ctx => (ctx.studentUserId ? [ctx.studentUserId] : []),
        metadata: ctx => ({
          gradeId: ctx.gradeId,
          subject: ctx.subject,
          examId: ctx.examId
        })
      },
      admin: {
        roles: ['TEACHER'],
        channels: ['IN_APP'],
        title: ctx => `Grade Posted: ${ctx.studentName}`,
        message: ctx => `${ctx.studentName} scored ${ctx.scoreFormatted} in ${ctx.subject}. Trend: ${ctx.trendSummary}.`,
        resolveRecipients: ctx => notificationHelpers.getStudentNotificationRecipients(ctx.student, {
          includeParent: false,
          includeClassTeacher: false,
          includeAdmins: true,
          schoolId: ctx.schoolId
        }),
        metadata: ctx => ({
          gradeId: ctx.gradeId,
          trend: ctx.trend,
          actorId: ctx.actorId
        })
      }
    }
  },
  'system.maintenance': {
    category: 'SYSTEM',
    subType: 'MAINTENANCE',
    priority: 'URGENT',
    contextScope: 'global',
    source: 'blueprint.system',
    audiences: {
      admin: {
        roles: ['SUPER_ADMIN', 'TEACHER'],
        channels: ['IN_APP', 'EMAIL'],
        title: ctx => `⚙️ Scheduled Maintenance ${ctx.windowLabel}`,
        message: ctx => `Platform maintenance from ${ctx.startFormatted} to ${ctx.endFormatted}. Impact: ${ctx.impact}.`,
        resolveRecipients: ctx => notificationHelpers.getUsersByNotificationRoles(['SUPER_ADMIN', 'ADMIN'], ctx.schoolId || 1),
        metadata: ctx => ({
          maintenanceId: ctx.maintenanceId,
          start: ctx.start,
          end: ctx.end,
          impact: ctx.impact
        })
      },
      teacher: {
        roles: ['SCHOOL_ADMIN'],
        channels: ['IN_APP'],
        title: ctx => `⚠️ Maintenance Window`,
        message: ctx => `Expect limited access ${ctx.windowLabel}. Please plan markers and uploads accordingly.`,
        resolveRecipients: ctx => notificationHelpers.getUsersByNotificationRoles(['TEACHER'], ctx.schoolId || 1),
        metadata: ctx => ({
          maintenanceId: ctx.maintenanceId,
          start: ctx.start,
          end: ctx.end
        })
      }
    }
  }
};

export const listNotificationBlueprintKeys = () => Object.keys(notificationBlueprints);

export const getNotificationBlueprint = (key) => {
  const blueprint = notificationBlueprints[key];
  if (!blueprint) {
    throw new Error(`Notification blueprint not found: ${key}`);
  }
  return blueprint;
};

export const resolveAudienceRecipients = async (audienceConfig, context) => {
  if (typeof audienceConfig.resolveRecipients === 'function') {
    return audienceConfig.resolveRecipients(context);
  }

  const roles = audienceConfig.roles || [];
  if (!context.schoolId && roles.length) {
    return [];
  }

  return notificationHelpers.getUsersByNotificationRoles(roles, context.schoolId, {
    classId: context.classId,
    studentId: context.studentId
  });
};

export default {
  notificationBlueprints,
  getNotificationBlueprint,
  listNotificationBlueprintKeys,
  resolveAudienceRecipients
};
