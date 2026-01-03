import { PrismaClient } from '../generated/prisma/index.js';
import {
  getNotificationBlueprint,
  listNotificationBlueprintKeys,
  resolveAudienceRecipients
} from './notificationBlueprints.js';
import {
  formatStudentName,
  formatCurrency,
  formatDate,
  getUsersByNotificationRoles
} from '../utils/notificationHelpers.js';

const prisma = new PrismaClient();

// WebSocket service removed - no longer needed

const convertBigInts = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(convertBigInts);
  if (typeof value === 'object') {
    const next = {};
    for (const [key, val] of Object.entries(value)) {
      next[key] = convertBigInts(val);
    }
    return next;
  }
  return value;
};

const serializeJsonField = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(convertBigInts(value));
};

// ======================
// NOTIFICATION TYPES & PRIORITIES
// ======================

export const NOTIFICATION_TYPES = {
  // System notifications
  SYSTEM_UPDATE: 'SYSTEM_UPDATE',
  MAINTENANCE: 'MAINTENANCE',
  SECURITY_ALERT: 'SECURITY_ALERT',
  
  // User management
  USER_CREATED: 'USER_CREATED',
  USER_UPDATED: 'USER_UPDATED',
  USER_DELETED: 'USER_DELETED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  
  // Student operations
  STUDENT_CREATED: 'STUDENT_CREATED',
  STUDENT_UPDATED: 'STUDENT_UPDATED',
  STUDENT_DELETED: 'STUDENT_DELETED',
  STUDENT_ENROLLED: 'STUDENT_ENROLLED',
  STUDENT_GRADUATED: 'STUDENT_GRADUATED',
  STUDENT_TRANSFERRED: 'STUDENT_TRANSFERRED',
  STUDENT_PROMOTED: 'STUDENT_PROMOTED',
  STUDENT_TRANSFERRED_OUT: 'STUDENT_TRANSFERRED_OUT',
  STUDENT_TRANSFERRED_IN: 'STUDENT_TRANSFERRED_IN',
  STUDENT_WITHDRAWN: 'STUDENT_WITHDRAWN',
  CLASS_CHANGED: 'CLASS_CHANGED',
  ROLL_NUMBER_ASSIGNED: 'ROLL_NUMBER_ASSIGNED',
  ID_CARD_READY: 'ID_CARD_READY',
  DOCUMENTS_INCOMPLETE: 'DOCUMENTS_INCOMPLETE',
  
  // Attendance - Basic
  ATTENDANCE_MARKED: 'ATTENDANCE_MARKED',
  ATTENDANCE_UPDATED: 'ATTENDANCE_UPDATED',
  ABSENT_NOTIFICATION: 'ABSENT_NOTIFICATION',
  LATE_ARRIVAL: 'LATE_ARRIVAL',
  
  // Attendance - Patterns & Recognition
  PERFECT_ATTENDANCE_WEEK: 'PERFECT_ATTENDANCE_WEEK',
  PERFECT_ATTENDANCE_MONTH: 'PERFECT_ATTENDANCE_MONTH',
  ATTENDANCE_STREAK: 'ATTENDANCE_STREAK',
  EARLY_ARRIVAL: 'EARLY_ARRIVAL',
  FREQUENT_LATE_PATTERN: 'FREQUENT_LATE_PATTERN',
  FREQUENT_ABSENT_PATTERN: 'FREQUENT_ABSENT_PATTERN',
  ATTENDANCE_IMPROVING: 'ATTENDANCE_IMPROVING',
  ATTENDANCE_DECLINING: 'ATTENDANCE_DECLINING',
  LEAVE_APPROVED: 'LEAVE_APPROVED',
  LEAVE_REJECTED: 'LEAVE_REJECTED',
  EXCUSED_ABSENCE: 'EXCUSED_ABSENCE',
  MONTHLY_ATTENDANCE_SUMMARY: 'MONTHLY_ATTENDANCE_SUMMARY',
  
  // Academic - Grades & Performance
  GRADE_POSTED: 'GRADE_POSTED',
  EXCELLENT_GRADE: 'EXCELLENT_GRADE',
  GRADE_IMPROVED: 'GRADE_IMPROVED',
  GRADE_DECLINED: 'GRADE_DECLINED',
  SUBJECT_EXCELLENCE: 'SUBJECT_EXCELLENCE',
  HONOR_ROLL: 'HONOR_ROLL',
  ACADEMIC_PROBATION: 'ACADEMIC_PROBATION',
  SUBJECT_PERFORMANCE_TREND: 'SUBJECT_PERFORMANCE_TREND',
  CLASS_RANK_IMPROVED: 'CLASS_RANK_IMPROVED',
  NEEDS_TUTORING: 'NEEDS_TUTORING',
  
  // Academic - Assignments & Exams
  ASSIGNMENT_CREATED: 'ASSIGNMENT_CREATED',
  ASSIGNMENT_SUBMITTED: 'ASSIGNMENT_SUBMITTED',
  ASSIGNMENT_DUE_TOMORROW: 'ASSIGNMENT_DUE_TOMORROW',
  ASSIGNMENT_OVERDUE: 'ASSIGNMENT_OVERDUE',
  HOMEWORK_NOT_SUBMITTED: 'HOMEWORK_NOT_SUBMITTED',
  EXAM_SCHEDULED: 'EXAM_SCHEDULED',
  EXAM_TOMORROW: 'EXAM_TOMORROW',
  EXAM_TODAY: 'EXAM_TODAY',
  EXAM_RESULT: 'EXAM_RESULT',
  EXAM_RESULT_READY: 'EXAM_RESULT_READY',
  EXTRA_CREDIT_AVAILABLE: 'EXTRA_CREDIT_AVAILABLE',
  STUDY_GROUP_RECOMMENDED: 'STUDY_GROUP_RECOMMENDED',
  
  // Financial - Basic
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_DUE: 'PAYMENT_DUE',
  PAYMENT_OVERDUE: 'PAYMENT_OVERDUE',
  FEE_STRUCTURE_UPDATED: 'FEE_STRUCTURE_UPDATED',
  
  // Financial - Advanced
  PAYMENT_DUE_7DAYS: 'PAYMENT_DUE_7DAYS',
  PAYMENT_DUE_3DAYS: 'PAYMENT_DUE_3DAYS',
  PAYMENT_DUE_TOMORROW: 'PAYMENT_DUE_TOMORROW',
  PAYMENT_OVERDUE_1DAY: 'PAYMENT_OVERDUE_1DAY',
  PAYMENT_OVERDUE_7DAYS: 'PAYMENT_OVERDUE_7DAYS',
  PARTIAL_PAYMENT_RECEIVED: 'PARTIAL_PAYMENT_RECEIVED',
  PAYMENT_PLAN_CREATED: 'PAYMENT_PLAN_CREATED',
  PAYMENT_PLAN_REMINDER: 'PAYMENT_PLAN_REMINDER',
  SCHOLARSHIP_AWARDED: 'SCHOLARSHIP_AWARDED',
  SCHOLARSHIP_RENEWED: 'SCHOLARSHIP_RENEWED',
  DISCOUNT_APPLIED: 'DISCOUNT_APPLIED',
  BALANCE_SUMMARY: 'BALANCE_SUMMARY',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  
  // Behavioral & Discipline
  POSITIVE_BEHAVIOR: 'POSITIVE_BEHAVIOR',
  DISCIPLINE_ISSUE: 'DISCIPLINE_ISSUE',
  DETENTION_ASSIGNED: 'DETENTION_ASSIGNED',
  PARENT_MEETING_REQUESTED: 'PARENT_MEETING_REQUESTED',
  PARENT_MEETING_SCHEDULED: 'PARENT_MEETING_SCHEDULED',
  COUNSELING_RECOMMENDED: 'COUNSELING_RECOMMENDED',
  IMPROVEMENT_NOTED: 'IMPROVEMENT_NOTED',
  ACHIEVEMENT_RECOGNITION: 'ACHIEVEMENT_RECOGNITION',
  
  // Communication & Engagement
  MESSAGE_RECEIVED: 'MESSAGE_RECEIVED',
  NOTICE_POSTED: 'NOTICE_POSTED',
  ANNOUNCEMENT_POSTED: 'ANNOUNCEMENT_POSTED',
  CLASS_ANNOUNCEMENT: 'CLASS_ANNOUNCEMENT',
  PARENT_MESSAGE_RECEIVED: 'PARENT_MESSAGE_RECEIVED',
  TEACHER_MESSAGE_RECEIVED: 'TEACHER_MESSAGE_RECEIVED',
  FEEDBACK_REQUESTED: 'FEEDBACK_REQUESTED',
  SURVEY_AVAILABLE: 'SURVEY_AVAILABLE',
  EVENT_CREATED: 'EVENT_CREATED',
  EVENT_REMINDER: 'EVENT_REMINDER',
  EVENT_INVITATION: 'EVENT_INVITATION',
  EMERGENCY_ALERT: 'EMERGENCY_ALERT',
  WEATHER_CLOSURE: 'WEATHER_CLOSURE',
  HOLIDAY_REMINDER: 'HOLIDAY_REMINDER',
  IMPORTANT_DEADLINE: 'IMPORTANT_DEADLINE',
  
  // Administrative
  TIMETABLE_UPDATED: 'TIMETABLE_UPDATED',
  TEACHER_ASSIGNED: 'TEACHER_ASSIGNED',
  TEACHER_CHANGED: 'TEACHER_CHANGED',
  REPORT_CARD_READY: 'REPORT_CARD_READY',
  PROGRESS_REPORT_READY: 'PROGRESS_REPORT_READY',
  DOCUMENT_UPLOADED: 'DOCUMENT_UPLOADED',
  DOCUMENT_VERIFIED: 'DOCUMENT_VERIFIED',
  DOCUMENT_REJECTED: 'DOCUMENT_REJECTED',
  TRANSPORT_UPDATE: 'TRANSPORT_UPDATE',
  LIBRARY_BOOK_DUE: 'LIBRARY_BOOK_DUE',
  
  // Inventory
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  INVENTORY_UPDATED: 'INVENTORY_UPDATED',
  
  // Customer operations
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  CUSTOMER_DELETED: 'CUSTOMER_DELETED',
  LEAD_CREATED: 'LEAD_CREATED',
  LEAD_CONVERTED: 'LEAD_CONVERTED',
  
  // General
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR'
};

export const NOTIFICATION_PRIORITIES = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

export const NOTIFICATION_CHANNELS = {
  IN_APP: 'IN_APP',
  EMAIL: 'EMAIL',
  SMS: 'SMS',
  PUSH: 'PUSH'
};

// ======================
// AUDIT LOG SERVICE
// ======================

/**
 * Create audit log entry
 */
export const createAuditLog = async (auditData) => {
  try {
    const {
      action,
      entity,
      entityId,
      userId,
      schoolId,
      ownerId,
      oldData,
      newData,
      details = {},
      ipAddress,
      userAgent
    } = auditData;

    const auditLog = await prisma.auditLog.create({
      data: {
        action,
        entityType: entity,
        entityId: entityId ? BigInt(entityId) : null,
        userId: userId ? BigInt(userId) : null,
        schoolId: schoolId ? BigInt(schoolId) : null,
        ownerId: ownerId ? BigInt(ownerId) : null,
        oldData,
        newData,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown'
      }
    });

    console.log(`Audit log created: ${action} on ${entity} ${entityId} by user ${userId}`);
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters = {}) => {
  try {
    const {
      entityType,
      entityId,
      userId,
      schoolId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;

    const where = {};

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = BigInt(entityId);
    if (userId) where.userId = BigInt(userId);
    if (schoolId) where.schoolId = BigInt(schoolId);
    if (action) where.action = action;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const totalCount = await prisma.auditLog.count({ where });

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      data: auditLogs,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw error;
  }
};

/**
 * Get audit log by ID
 */
export const getAuditLogById = async (auditLogId) => {
  try {
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: BigInt(auditLogId) },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true
          }
        },
        school: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    return auditLog;
  } catch (error) {
    console.error('Error getting audit log by ID:', error);
    throw error;
  }
};

// ======================
// CORE NOTIFICATION FUNCTIONS
// ======================

/**
 * Create a new notification with WebSocket broadcast
 */
export const createNotification = async (notificationData = {}) => {
  try {
    const {
      type = 'INFO',
      category = null,
      subType = null,
      title,
      message,
      summary,
      priority = 'NORMAL',
      status = 'PENDING',
      metadata = null,
      actions = null,
      expiresAt,
      scheduledAt,
      entityType,
      entityId,
      entityAction,
      senderId,
      schoolId,
      ownerId,
      templateKey,
      templateData = null,
      recipients = [],
      channels = ['IN_APP'],
      attachments = [],
      audienceRoles = [],
      contextScope = 'school',
      source = 'manual',
      actionRequired: defaultActionRequired = false,
      followUpAt: defaultFollowUpAt = null
    } = notificationData;

    if (!title || !message) {
      throw new Error('Title and message are required');
    }

    const metadataForBroadcast = convertBigInts(metadata) ?? {};
    const serializedMetadata = serializeJsonField(metadata);
    const serializedTemplateData = serializeJsonField(templateData);
    const serializedActions = serializeJsonField(actions);
    const normalizedAudienceRoles = (() => {
      if (audienceRoles === null || audienceRoles === undefined) return '[]';
      if (typeof audienceRoles === 'string') return audienceRoles;
      if (Array.isArray(audienceRoles)) return JSON.stringify(audienceRoles);
      return serializeJsonField(audienceRoles) ?? '[]';
    })();

    const channelSet = new Set(
      (channels && channels.length ? channels : ['IN_APP']).map(ch => ch.toUpperCase())
    );
    channelSet.add('IN_APP');
    const normalizedChannels = Array.from(channelSet);

    const defaultFollowUpDate = defaultFollowUpAt ? new Date(defaultFollowUpAt) : null;

    const recipientEntries = [];
    const seenRecipientIds = new Set();

    const pushRecipient = (entry) => {
      if (entry === null || entry === undefined) return;

      let userId;
      let channel = 'IN_APP';
      let statusValue = 'PENDING';
      let metadataValue = null;
      let actionRequiredValue = defaultActionRequired;
      let followUpValue = defaultFollowUpDate;
      let notesValue = null;

      if (typeof entry === 'object' && !Array.isArray(entry)) {
        userId = entry.userId ?? entry.id ?? entry.recipientId;
        if (!userId) return;
        channel = (entry.channel || 'IN_APP').toUpperCase();
        statusValue = entry.status || 'PENDING';
        if (Object.prototype.hasOwnProperty.call(entry, 'metadata')) {
          metadataValue = entry.metadata;
        }
        if (Object.prototype.hasOwnProperty.call(entry, 'actionRequired')) {
          actionRequiredValue = Boolean(entry.actionRequired);
        }
        if (Object.prototype.hasOwnProperty.call(entry, 'followUpAt') && entry.followUpAt) {
          followUpValue = new Date(entry.followUpAt);
        }
        if (Object.prototype.hasOwnProperty.call(entry, 'notes')) {
          notesValue = entry.notes;
        }
      } else {
        userId = entry;
      }

      try {
        userId = BigInt(userId);
      } catch (error) {
        console.error('Invalid recipient userId provided for notification', entry, error);
        return;
      }

      const dedupeKey = userId.toString();
      if (seenRecipientIds.has(dedupeKey)) {
        return;
      }

      seenRecipientIds.add(dedupeKey);

      recipientEntries.push({
        userId,
        channel,
        status: statusValue,
        metadata: metadataValue,
        actionRequired: actionRequiredValue,
        followUpAt: followUpValue,
        notes: notesValue
      });
    };

    const initialRecipients = Array.isArray(recipients) ? recipients : [recipients];
    initialRecipients.forEach(pushRecipient);

    if (schoolId) {
      try {
        const superAdmins = await prisma.user.findMany({
          where: {
            schoolId: BigInt(schoolId),
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            deletedAt: null
          },
          select: { id: true }
        });

        superAdmins.forEach(({ id }) => {
          pushRecipient({ userId: id, channel: 'IN_APP', actionRequired: defaultActionRequired, followUpAt: defaultFollowUpDate });
        });

        if (superAdmins.length) {
          console.log(`✅ Added ${superAdmins.length} SUPER_ADMIN users as recipients`);
        }
      } catch (error) {
        console.error('❌ Error adding SUPER_ADMIN recipients:', error);
      }
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        category,
        subType,
        title,
        message,
        summary,
        priority,
        status,
        metadata: serializedMetadata,
        actions: serializedActions,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        entityType,
        entityId: entityId ? BigInt(entityId) : null,
        entityAction,
        senderId: senderId ? BigInt(senderId) : null,
        schoolId: schoolId ? BigInt(schoolId) : null,
        ownerId: ownerId ? BigInt(ownerId) : null,
        templateKey,
        templateData: serializedTemplateData,
        audienceRoles: normalizedAudienceRoles,
        contextScope,
        source
      }
    });

    if (recipientEntries.length > 0) {
      const recipientData = recipientEntries.map(entry => ({
        notificationId: notification.id,
        userId: entry.userId,
        channel: entry.channel,
        status: entry.status,
        metadata: serializeJsonField(entry.metadata),
        actionRequired: entry.actionRequired,
        followUpAt: entry.followUpAt ?? null,
        notes: entry.notes ?? null
      }));

      await prisma.notificationRecipient.createMany({ data: recipientData });
    }

    if (attachments.length > 0) {
      const attachmentData = attachments.map(attachment => ({
        notificationId: notification.id,
        name: attachment.name,
        url: attachment.url,
        type: attachment.type,
        size: attachment.size,
        mimeType: attachment.mimeType,
        description: attachment.description
      }));

      await prisma.notificationAttachment.createMany({ data: attachmentData });
    }

    try {
      const io = global.io || null;
      if (io && recipientEntries.length > 0) {
        recipientEntries.forEach(entry => {
          io.to(`user:${entry.userId.toString()}`).emit('notification:new', {
            id: notification.id.toString(),
            type,
            category,
            subType,
            title,
            message,
            priority,
            createdAt: notification.createdAt,
            metadata: metadataForBroadcast,
            contextScope,
            source
          });
        });
        console.log(`📡 WebSocket: Broadcasted notification to ${recipientEntries.length} recipients`);
      }
    } catch (wsError) {
      console.error('❌ WebSocket broadcast failed:', wsError.message);
    }

    const recipientIds = recipientEntries.map(entry => entry.userId);
    const externalChannels = normalizedChannels.filter(channel => channel !== 'IN_APP');
    let recipientProfiles = [];

    if (externalChannels.length > 0 && recipientIds.length > 0) {
      recipientProfiles = await prisma.user.findMany({
        where: { id: { in: recipientIds } },
        select: {
          id: true,
          phone: true,
          metadata: true,
          firstName: true,
          lastName: true
        }
      });
    }

    for (const channel of externalChannels) {
      try {
        switch (channel) {
          case 'EMAIL': {
            const emails = recipientProfiles
              .map(profile => {
                if (!profile.metadata) return null;
                try {
                  const parsed = JSON.parse(profile.metadata);
                  return parsed?.email || parsed?.contactEmail || null;
                } catch (parseError) {
                  return null;
                }
              })
              .filter(Boolean);
            if (emails.length === 0) {
              console.warn('No email addresses resolved for notification email delivery');
              break;
            }
            await sendEmailNotification({
              to: emails,
              subject: title,
              body: message,
              notificationId: notification.id
            });
            break;
          }
          case 'SMS': {
            const phones = recipientProfiles
              .map(profile => {
                if (profile.phone) return profile.phone;
                if (!profile.metadata) return null;
                try {
                  const parsed = JSON.parse(profile.metadata);
                  return parsed?.phone || parsed?.contactPhone || null;
                } catch (parseError) {
                  return null;
                }
              })
              .filter(Boolean);
            if (phones.length === 0) {
              console.warn('No phone numbers resolved for notification SMS delivery');
              break;
            }
            await sendSMSNotification({
              to: phones,
              message,
              notificationId: notification.id
            });
            break;
          }
          case 'PUSH': {
            await sendPushNotification({
              to: recipientIds.map(id => id.toString()),
              title,
              body: message,
              notificationId: notification.id
            });
            break;
          }
          default:
            console.warn(`Unsupported notification channel requested: ${channel}`);
        }
      } catch (deliveryError) {
        console.error(`❌ ${channel} notification failed:`, deliveryError.message);
      }
    }

    console.log(`✅ Notification created: ${type} - ${title}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
};

export const sendBlueprintNotification = async (blueprintKey, context = {}, options = {}) => {
  try {
    const blueprint = getNotificationBlueprint(blueprintKey);
    const {
      audiences: blueprintAudiences = {},
      category,
      subType,
      priority: blueprintPriority = 'NORMAL',
      source,
      contextScope: blueprintScope
    } = blueprint;

    const allowAudiences = options.audiences ? new Set(options.audiences) : null;
    const additionalRecipients = options.additionalRecipients || {};
    const overrideChannels = options.channels || {};
    const results = [];

    const baseContext = {
      ...context,
      schoolId: context.schoolId ? BigInt(context.schoolId) : null,
      ownerId: context.ownerId ? BigInt(context.ownerId) : null,
      actorId: context.actorId || context.userId || null
    };

    const resolvedScope = typeof blueprintScope === 'function' ? blueprintScope(baseContext) : blueprintScope || 'school';
    const notificationType = subType || blueprintKey.toUpperCase();

    for (const [audienceKey, audienceConfig] of Object.entries(blueprintAudiences)) {
      if (allowAudiences && !allowAudiences.has(audienceKey)) {
        continue;
      }

      const resolvedRecipients = await resolveAudienceRecipients(audienceConfig, baseContext);
      const extra = additionalRecipients[audienceKey] || [];
      const mergedRecipients = [...new Set([...(resolvedRecipients || []), ...extra])];

      if (!mergedRecipients.length) {
        continue;
      }

      const resolvedChannels = overrideChannels[audienceKey] || audienceConfig.channels || ['IN_APP'];
      const title = typeof audienceConfig.title === 'function'
        ? audienceConfig.title(baseContext)
        : audienceConfig.title;
      const message = typeof audienceConfig.message === 'function'
        ? audienceConfig.message(baseContext)
        : audienceConfig.message;
      const summary = typeof audienceConfig.summary === 'function'
        ? audienceConfig.summary(baseContext)
        : audienceConfig.summary;
      const metadata = {
        blueprintKey,
        audienceKey,
        ...(typeof blueprint.metadata === 'function' ? blueprint.metadata(baseContext) : blueprint.metadata || {}),
        ...(typeof audienceConfig.metadata === 'function' ? audienceConfig.metadata(baseContext) : audienceConfig.metadata || {})
      };

      const actionRequired = typeof audienceConfig.actionRequired === 'function'
        ? audienceConfig.actionRequired(baseContext)
        : Boolean(audienceConfig.actionRequired);
      const followUpAt = typeof audienceConfig.followUpAt === 'function'
        ? audienceConfig.followUpAt(baseContext)
        : audienceConfig.followUpAt || null;

      try {
        const notification = await createNotification({
          type: notificationType,
          category,
          subType: subType || blueprintKey.toUpperCase(),
          title,
          message,
          summary,
          priority: audienceConfig.priority || blueprintPriority,
          metadata,
          entityType: context.entityType,
          entityId: context.entityId,
          entityAction: context.entityAction,
          senderId: baseContext.actorId,
          schoolId: baseContext.schoolId,
          ownerId: baseContext.ownerId,
          templateKey: blueprint.templateKey,
          templateData: context.templateData,
          recipients: mergedRecipients.map(userId => ({
            userId,
            channel: 'IN_APP',
            actionRequired,
            followUpAt
          })),
          channels: resolvedChannels,
          audienceRoles: [{ key: audienceKey, roles: audienceConfig.roles || [] }],
          contextScope: resolvedScope,
          source: source || `blueprint.${blueprintKey}`,
          actionRequired,
          followUpAt
        });
        results.push(notification);
      } catch (dispatchError) {
        console.error(`Failed to dispatch blueprint notification (${blueprintKey}:${audienceKey}):`, dispatchError.message);
      }
    }

    if (!results.length) {
      console.warn(`Blueprint notification produced no deliveries: ${blueprintKey}`);
    }

    return results;
  } catch (error) {
    console.error(`Error sending blueprint notification (${blueprintKey}):`, error.message);
    throw error;
  }
};

/**
 * Process notification delivery through multiple channels
 */
export const processNotificationDelivery = async (notification, channels = ['IN_APP']) => {
  try {
    const deliveryPromises = channels.map(channel => 
      deliverNotification(notification, channel)
    );

    const results = await Promise.allSettled(deliveryPromises);
    
    // Log delivery results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Notification delivered via ${channels[index]}: ${result.value}`);
      } else {
        console.error(`Failed to deliver notification via ${channels[index]}:`, result.reason);
      }
    });

    return results;
  } catch (error) {
    console.error('Error processing notification delivery:', error);
    throw error;
  }
};

/**
 * Deliver notification through a specific channel
 */
export const deliverNotification = async (notification, channel) => {
  try {
    let deliveryResult;

    switch (channel) {
      case 'EMAIL':
        deliveryResult = await sendEmailNotification({
          to: notification.recipients?.map(r => r.user?.email).filter(Boolean),
          subject: notification.title,
          body: notification.message,
          notificationId: notification.id
        });
        break;

      case 'SMS':
        deliveryResult = await sendSMSNotification({
          to: notification.recipients?.map(r => r.user?.phone).filter(Boolean),
          message: notification.message,
          notificationId: notification.id
        });
        break;

      case 'PUSH':
        deliveryResult = await sendPushNotification({
          to: notification.recipients?.map(r => r.user?.id).filter(Boolean),
          title: notification.title,
          body: notification.message,
          notificationId: notification.id
        });
        break;

      case 'IN_APP':
      default:
        deliveryResult = { success: true, message: 'In-app notification created' };
        break;
    }

    return deliveryResult;
  } catch (error) {
    console.error(`Error delivering notification via ${channel}:`, error);
    throw error;
  }
};

/**
 * Get notifications for a user with filters
 */
export const getUserNotifications = async (userId, filters = {}) => {
  try {
    const {
      status,
      type,
      priority,
      page = 1,
      limit = 20,
      include
    } = filters;

    const where = {
      recipients: {
        some: {
          userId: BigInt(userId)
        }
      }
    };

    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const totalCount = await prisma.notification.count({ where });

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        recipients: {
          where: { userId: BigInt(userId) },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                role: true
              }
            }
          }
        },
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            role: true
          }
        },
        attachments: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      data: notifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationIds, userId) => {
  try {
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];

    const updated = await prisma.notificationRecipient.updateMany({
      where: {
        notificationId: { in: ids.map(id => BigInt(id)) },
        userId: BigInt(userId)
      },
      data: {
        status: 'READ',
        readAt: new Date()
      }
    });

    // Also update the main notification if all recipients have read it
    for (const notificationId of ids) {
      const unreadRecipients = await prisma.notificationRecipient.count({
        where: {
          notificationId: BigInt(notificationId),
          status: { not: 'READ' }
        }
      });

      if (unreadRecipients === 0) {
        await prisma.notification.update({
          where: { id: BigInt(notificationId) },
          data: {
            status: 'READ'
          }
        });
      }
    }

    return {
      success: true,
      updatedCount: updated.count,
      message: 'Notifications marked as read'
    };
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId, userId) => {
  try {
    // Check if user has permission to delete this notification
    const notification = await prisma.notification.findFirst({
      where: {
        id: BigInt(notificationId),
        OR: [
          { senderId: BigInt(userId) },
          { createdBy: BigInt(userId) }
        ]
      }
    });

    if (!notification) {
      throw new Error('Notification not found or permission denied');
    }

    await prisma.notification.delete({
      where: { id: BigInt(notificationId) }
    });

    return {
      success: true,
      message: 'Notification deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// ======================
// EMAIL NOTIFICATION SERVICE
// ======================

/**
 * Send email notification
 */
export const sendEmailNotification = async (emailData) => {
  try {
    const {
      to,
      subject,
      body,
      html,
      from,
      replyTo,
      cc,
      bcc,
      attachments,
      notificationId
    } = emailData;

    // Validate email data
    if (!to || !subject || !body) {
      throw new Error('Missing required email fields: to, subject, body');
    }

    // For now, we'll just log the email notification
    // In a real implementation, this would integrate with an email service like SendGrid, AWS SES, etc.
    console.log('Email notification:', {
      to,
      subject,
      body,
      html,
      from,
      replyTo,
      cc,
      bcc,
      attachments,
      notificationId,
      timestamp: new Date().toISOString()
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      success: true,
      message: 'Email notification sent successfully',
      data: {
        messageId: `email_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send bulk email notifications
 */
export const sendBulkEmailNotifications = async (emails) => {
  try {
    const results = [];

    for (const emailData of emails) {
      try {
        const result = await sendEmailNotification(emailData);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          emailData
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return {
      success: true,
      message: `Bulk email notifications sent: ${successCount} successful, ${failureCount} failed`,
      data: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
        results
      }
    };
  } catch (error) {
    console.error('Error sending bulk email notifications:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ======================
// PUSH NOTIFICATION SERVICE
// ======================

/**
 * Send push notification
 */
export const sendPushNotification = async (pushData) => {
  try {
    const {
      to,
      title,
      body,
      data,
      badge,
      sound,
      priority,
      notificationId
    } = pushData;

    // Validate push notification data
    if (!to || !title || !body) {
      throw new Error('Missing required push notification fields: to, title, body');
    }

    // For now, we'll just log the push notification
    // In a real implementation, this would integrate with Firebase Cloud Messaging, OneSignal, etc.
    console.log('Push notification:', {
      to,
      title,
      body,
      data,
      badge,
      sound,
      priority,
      notificationId,
      timestamp: new Date().toISOString()
    });

    // Simulate push notification sending delay
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      success: true,
      message: 'Push notification sent successfully',
      data: {
        messageId: `push_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ======================
// SMS NOTIFICATION SERVICE
// ======================

/**
 * Send SMS notification
 */
export const sendSMSNotification = async (smsData) => {
  try {
    const {
      to,
      message,
      from,
      notificationId
    } = smsData;

    // Validate SMS data
    if (!to || !message) {
      throw new Error('Missing required SMS fields: to, message');
    }

    // For now, we'll just log the SMS notification
    // In a real implementation, this would integrate with Twilio, AWS SNS, etc.
    console.log('SMS notification:', {
      to,
      message,
      from,
      notificationId,
      timestamp: new Date().toISOString()
    });

    // Simulate SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 150));

    return {
      success: true,
      message: 'SMS notification sent successfully',
      data: {
        messageId: `sms_${Date.now()}`,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Error sending SMS notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ======================
// NOTIFICATION TEMPLATES
// ======================

/**
 * Get notification templates
 */
export const getNotificationTemplates = async () => {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    return templates;
  } catch (error) {
    console.error('Error getting notification templates:', error);
    throw error;
  }
};

/**
 * Process notification template with data
 */
export const processNotificationTemplate = async (templateKey, data) => {
  try {
    const template = await prisma.notificationTemplate.findUnique({
      where: { key: templateKey }
    });

    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Process template variables
    const processedTitle = processTemplateString(template.title, data);
    const processedMessage = processTemplateString(template.message, data);
    const processedEmailSubject = template.emailSubject ? processTemplateString(template.emailSubject, data) : null;
    const processedEmailBody = template.emailBody ? processTemplateString(template.emailBody, data) : null;
    const processedSmsBody = template.smsBody ? processTemplateString(template.smsBody, data) : null;
    const processedPushTitle = template.pushTitle ? processTemplateString(template.pushTitle, data) : null;
    const processedPushBody = template.pushBody ? processTemplateString(template.pushBody, data) : null;

    return {
      title: processedTitle,
      message: processedMessage,
      email: {
        subject: processedEmailSubject,
        body: processedEmailBody
      },
      sms: {
        body: processedSmsBody
      },
      push: {
        title: processedPushTitle,
        body: processedPushBody
      }
    };
  } catch (error) {
    console.error('Error processing notification template:', error);
    throw error;
  }
};

/**
 * Process template string with variables
 */
export const processTemplateString = (template, data) => {
  if (!template) return '';
  
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] || match;
  });
};

// ======================
// NOTIFICATION UTILITIES
// ======================

/**
 * Get notification statistics
 */
export const getNotificationStats = async (schoolId, userId, period = '30d') => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const where = {
      createdAt: { gte: startDate }
    };

    if (schoolId) where.schoolId = BigInt(schoolId);
    if (userId) {
      where.recipients = {
        some: { userId: BigInt(userId) }
      };
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        recipients: true,
        deliveries: true
      }
    });

    const stats = {
      total: notifications.length,
      byType: {},
      byStatus: {},
      byPriority: {},
      byChannel: {},
      readRate: 0,
      deliveryRate: 0
    };

    let totalRead = 0;
    let totalDelivered = 0;

    notifications.forEach(notification => {
      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

      // Count by status
      stats.byStatus[notification.status] = (stats.byStatus[notification.status] || 0) + 1;

      // Count by priority
      if (notification.priority) {
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1;
      }

      // Count by channel and delivery status
      notification.deliveries.forEach(status => {
        stats.byChannel[status.channel] = (stats.byChannel[status.channel] || 0) + 1;
        if (status.status === 'DELIVERED') totalDelivered++;
      });

      // Count read notifications
      notification.recipients.forEach(recipient => {
        if (recipient.status === 'READ') totalRead++;
      });
    });

    if (notifications.length > 0) {
      stats.readRate = Math.round((totalRead / notifications.length) * 100);
      stats.deliveryRate = Math.round((totalDelivered / notifications.length) * 100);
    }

    return stats;
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
};

// ======================
// AUTOMATIC NOTIFICATION TRIGGERS
// ======================

/**
 * Trigger automatic notifications for entity creation
 */
export const triggerEntityCreatedNotification = async (entityType, entityId, entityData, userId, schoolId, ownerId) => {
  try {
    // Get notification rules for this entity type
    const rules = await prisma.notificationRule.findMany({
      where: {
        eventType: 'entity_created',
        entityType,
        isActive: true,
        schoolId: schoolId ? BigInt(schoolId) : null
      }
    });

    for (const rule of rules) {
      // Check if conditions are met
      if (await checkRuleConditions(rule, entityData)) {
                // Process template
        let template;
        try {
          template = await processNotificationTemplate(rule.templateKey, {
            ...entityData,
            entityType,
            entityId,
            userId
          });
        } catch (templateError) {
          console.error('Error processing notification template:', templateError);
          // Use fallback template
          template = {
            title: 'Student Information Updated',
            message: 'Student information has been updated successfully'
          };
        }

        // Get recipients based on rule configuration
        const recipients = await getRuleRecipients(rule, entityData);

                // Create notification
        await createNotification({
          type: 'SYSTEM', // Default type since NotificationRule doesn't have a type field
          title: template.title,
          message: template.message,
          priority: 'NORMAL', // Default priority since NotificationRule doesn't have a priority field
          channels: rule.channels ? (() => {
            try {
              return JSON.parse(rule.channels);
            } catch (parseError) {
              console.error('Error parsing rule channels:', parseError);
              return ['IN_APP'];
            }
          })() : ['IN_APP'],
          entityType,
          entityId,
          entityAction: 'created',
          senderId: userId,
          schoolId,
          ownerId,
          templateKey: rule.templateKey,
          templateData: entityData,
          recipients
        });
      }
    }
  } catch (error) {
    console.error('Error triggering entity created notification:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

/**
 * Trigger automatic notifications for entity updates
 */
export const triggerEntityUpdatedNotification = async (entityType, entityId, entityData, oldData, userId, schoolId, ownerId) => {
  try {
    // Get notification rules for this entity type
    const rules = await prisma.notificationRule.findMany({
      where: {
        eventType: 'entity_updated',
        entityType,
        isActive: true,
        schoolId: schoolId ? BigInt(schoolId) : null
      }
    });

    for (const rule of rules) {
      // Check if conditions are met
      if (await checkRuleConditions(rule, entityData, oldData)) {
                // Process template
        let template;
        try {
          template = await processNotificationTemplate(rule.templateKey, {
            ...entityData,
            oldData,
            entityType,
            entityId,
            userId
          });
        } catch (templateError) {
          console.error('Error processing notification template:', templateError);
          // Use fallback template
          template = {
            title: 'Student Information Updated',
            message: 'Student information has been updated successfully'
          };
        }

        // Get recipients based on rule configuration
        const recipients = await getRuleRecipients(rule, entityData);

                // Create notification
        await createNotification({
          type: 'SYSTEM', // Default type since NotificationRule doesn't have a type field
          title: template.title,
          message: template.message,
          priority: 'NORMAL', // Default priority since NotificationRule doesn't have a priority field
          channels: rule.channels ? (() => {
            try {
              return JSON.parse(rule.channels);
            } catch (parseError) {
              console.error('Error parsing rule channels:', parseError);
              return ['IN_APP'];
            }
          })() : ['IN_APP'],
          entityType,
          entityId,
          entityAction: 'updated',
          senderId: userId,
          schoolId,
          ownerId,
          templateKey: rule.templateKey,
          templateData: { ...entityData, oldData },
          recipients
        });
      }
    }
  } catch (error) {
    console.error('Error triggering entity updated notification:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

/**
 * Check if rule conditions are met
 */
export const checkRuleConditions = async (rule, entityData, oldData = null) => {
  try {
    if (!rule.conditions) return true;

    // Parse conditions from JSON string
    let conditions;
    try {
      conditions = JSON.parse(rule.conditions);
    } catch (parseError) {
      console.error('Error parsing rule conditions:', parseError);
      return false;
    }
    
    for (const [field, condition] of Object.entries(conditions)) {
      const value = entityData[field];
      
      switch (condition.operator) {
        case 'equals':
          if (value !== condition.value) return false;
          break;
        case 'not_equals':
          if (value === condition.value) return false;
          break;
        case 'contains':
          if (!value || !value.includes(condition.value)) return false;
          break;
        case 'greater_than':
          if (!value || value <= condition.value) return false;
          break;
        case 'less_than':
          if (!value || value >= condition.value) return false;
          break;
        case 'changed':
          if (!oldData || value === oldData[field]) return false;
          break;
        case 'not_changed':
          if (oldData && value !== oldData[field]) return false;
          break;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking rule conditions:', error);
    return false;
  }
};

/**
 * Get recipients for a notification rule
 */
export const getRuleRecipients = async (rule, entityData) => {
  try {
    if (!rule.recipients) return [];

    // Parse recipients from JSON string
    let recipientConfig;
    try {
      recipientConfig = JSON.parse(rule.recipients);
    } catch (parseError) {
      console.error('Error parsing rule recipients:', parseError);
      return [];
    }

    const recipients = [];

    // Get users by role
    if (recipientConfig.roles) {
      const resolveId = (value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'bigint') return value.toString();
        if (typeof value === 'number') return value.toString();
        return value;
      };

      const resolvedSchoolId =
        resolveId(recipientConfig.schoolId) ??
        resolveId(entityData.schoolId) ??
        resolveId(entityData.school?.id) ??
        resolveId(entityData.student?.schoolId) ??
        null;

      const resolvedClassId =
        resolveId(recipientConfig.classId) ??
        resolveId(entityData.classId) ??
        resolveId(entityData.class?.id) ??
        resolveId(entityData.student?.classId) ??
        null;

      if (resolvedSchoolId) {
        const roleOptions = {
          includeInactive: Boolean(recipientConfig.includeInactive),
        };
        if (resolvedClassId) {
          roleOptions.classId = resolvedClassId;
        }

        const roleUsers = await getUsersByNotificationRoles(
          recipientConfig.roles,
          resolvedSchoolId,
          roleOptions
        );
        recipients.push(...roleUsers);
      } else {
        console.warn('Notification rule missing schoolId for role recipients', {
          ruleId: rule.id,
          roles: recipientConfig.roles,
        });
      }
    }

    // Get specific users
    if (recipientConfig.userIds) {
      recipients.push(...recipientConfig.userIds);
    }

    // Get entity-related users
    if (recipientConfig.entityUsers) {
      const entityUserIds = await getEntityUserIds(entityData);
      recipients.push(...entityUserIds);
    }

    // Remove duplicates
    return [...new Set(recipients)];
  } catch (error) {
    console.error('Error getting rule recipients:', error);
    return [];
  }
};

/**
 * Get user IDs related to an entity
 */
export const getEntityUserIds = async (entityData) => {
  try {
    const userIds = [];

    // Add entity owner/creator
    if (entityData.createdBy) {
      userIds.push(entityData.createdBy);
    }

    // Add entity-specific users based on entity type
    switch (entityData.entityType) {
      case 'student':
        if (entityData.parentId) {
          const parent = await prisma.parent.findUnique({
            where: { id: BigInt(entityData.parentId) },
            select: { userId: true }
          });
          if (parent) userIds.push(parent.userId);
        }
        break;
      case 'payment':
        if (entityData.studentId) {
          const student = await prisma.student.findUnique({
            where: { id: BigInt(entityData.studentId) },
            select: { userId: true, parentId: true }
          });
          if (student) {
            userIds.push(student.userId);
            if (student.parentId) {
              const parent = await prisma.parent.findUnique({
                where: { id: student.parentId },
                select: { userId: true }
              });
              if (parent) userIds.push(parent.userId);
            }
          }
        }
        break;
      case 'assignment':
        if (entityData.classId) {
          const students = await prisma.student.findMany({
            where: { 
              classId: BigInt(entityData.classId),
              user: {
                status: 'ACTIVE'
              }
            },
            select: { userId: true }
          });
          userIds.push(...students.map(s => s.userId));
        }
        break;
    }

    return userIds;
  } catch (error) {
    console.error('Error getting entity user IDs:', error);
    return [];
  }
};

// ======================
// SYSTEM OPERATION NOTIFICATIONS
// ======================

/**
 * Create student operation notifications
 */
export const createStudentNotification = async (operation, studentData, userId, schoolId, ownerId, additionalData = {}) => {
  try {
    const normalizedOperation = (operation || '').toLowerCase();
    const blueprintMap = {
      created: 'student.enrolled',
      enrolled: 'student.enrolled',
      updated: 'student.updated',
      promoted: 'student.updated',
      transferred: 'student.updated'
    };

    const blueprintKey = blueprintMap[normalizedOperation];
    const className = studentData.class?.name || additionalData.className || 'Unknown Class';
    const { additionalRecipients = {}, ...contextExtras } = additionalData;

    const context = {
      student: studentData,
      studentId: studentData.id,
      studentName: formatStudentName(studentData),
      classId: studentData.classId || null,
      className,
      admissionNo: studentData.admissionNo,
      admissionDate: studentData.admissionDate,
      totalStudentCount: normalizedOperation === 'created'
        ? await prisma.student.count({ where: { schoolId: BigInt(schoolId), deletedAt: null } })
        : undefined,
      actorId: userId,
      schoolId,
      ownerId,
      entityType: 'student',
      entityId: studentData.id,
      entityAction: normalizedOperation,
      ...contextExtras
    };

    if (blueprintKey) {
      const options = Object.keys(additionalRecipients).length ? { additionalRecipients } : {};
      const notifications = await sendBlueprintNotification(blueprintKey, context, options);
      if (notifications?.length) {
        return notifications[0];
      }
    }

    // Fallback to legacy notification for unsupported operations
    return await createNotification({
      type: NOTIFICATION_TYPES[`STUDENT_${operation.toUpperCase()}`] || NOTIFICATION_TYPES.INFO,
      title: `Student ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      message: `Student ${studentData.user?.firstName || 'Unknown'} ${studentData.user?.lastName || 'Student'} has been ${operation}`,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      entityType: 'student',
      entityId: studentData.id,
      entityAction: operation,
      senderId: userId,
      schoolId,
      ownerId,
      metadata: { ...context, additionalRecipients }
    });
  } catch (error) {
    console.error('Error creating student notification:', error);
    return null;
  }
};

/**
 * Create attendance operation notifications
 */
export const createAttendanceNotification = async (operation, attendanceData, userId, schoolId, ownerId) => {
  try {
    const normalizedOperation = (operation || '').toLowerCase();
    let blueprintKey = null;

    if (normalizedOperation === 'absent' || attendanceData.status === 'ABSENT') {
      blueprintKey = 'attendance.absent';
    } else if (normalizedOperation === 'late' || attendanceData.isLate) {
      blueprintKey = 'attendance.late';
    }

    const studentName = formatStudentName(attendanceData.student);
    const className = attendanceData.class?.name || attendanceData.className || 'Unknown Class';
    const inTime = attendanceData.inTime || attendanceData.checkInTime || null;
    const dateValue = attendanceData.date || attendanceData.markedDate || new Date();
    const dateFormatted = formatDate(dateValue);
    const context = {
      student: attendanceData.student,
      studentId: attendanceData.studentId,
      studentName,
      classId: attendanceData.classId || null,
      className,
      attendanceId: attendanceData.id,
      status: attendanceData.status,
      reason: attendanceData.reason || attendanceData.remarks,
      date: dateValue,
      dateFormatted,
      inTime,
      inTimeFormatted: inTime ? new Date(inTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
      followUpAt: attendanceData.followUpAt || null,
      actorId: userId,
      schoolId,
      ownerId,
      entityType: 'attendance',
      entityId: attendanceData.id,
      entityAction: normalizedOperation || attendanceData.status?.toLowerCase()
    };

    if (blueprintKey) {
      const notifications = await sendBlueprintNotification(blueprintKey, context);
      if (notifications?.length) {
        return notifications[0];
      }
    }

    return await createNotification({
      type: NOTIFICATION_TYPES[`ATTENDANCE_${operation.toUpperCase()}`] || NOTIFICATION_TYPES.INFO,
      title: `Attendance ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      message: `Attendance has been ${operation} for ${studentName}`,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      entityType: 'attendance',
      entityId: attendanceData.id,
      entityAction: operation,
      senderId: userId,
      schoolId,
      ownerId,
      metadata: context
    });
  } catch (error) {
    console.error('Error creating attendance notification:', error);
    return null;
  }
};

/**
 * Create payment operation notifications
 */
export const createPaymentNotification = async (operation, paymentData, userId, schoolId, ownerId) => {
  try {
    const normalizedOperation = (operation || '').toLowerCase();
    const blueprintMap = {
      received: 'payment.received',
      posted: 'payment.received',
      due: 'payment.due',
      overdue: 'payment.due'
    };

    const blueprintKey = blueprintMap[normalizedOperation];
    const amount = Number(paymentData.amount || 0);
    const dueDate = paymentData.dueDate ? new Date(paymentData.dueDate) : null;
    const now = new Date();
    const daysUntilDue = dueDate ? Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24)) : null;

    const urgencyEmoji = (() => {
      if (daysUntilDue === null) return '💰';
      if (daysUntilDue <= 0) return '🚨';
      if (daysUntilDue <= 1) return '⚠️';
      if (daysUntilDue <= 3) return '⏳';
      return '💰';
    })();

    const dueDescriptor = (() => {
      if (daysUntilDue === null) return 'soon';
      if (daysUntilDue < 0) return 'today';
      if (daysUntilDue === 0) return 'today';
      if (daysUntilDue === 1) return 'tomorrow';
      return `in ${daysUntilDue} days`;
    })();

    const stage = (() => {
      if (daysUntilDue === null) return 'informational';
      if (daysUntilDue <= 0) return 'urgent';
      if (daysUntilDue <= 3) return 'reminder';
      return 'informational';
    })();

    const studentName = formatStudentName(paymentData.student);
    const context = {
      student: paymentData.student,
      studentId: paymentData.studentId,
      studentName,
      studentUserId: paymentData.student?.userId,
      paymentId: paymentData.id,
      receiptNo: paymentData.receiptNo || paymentData.referenceNo,
      amount,
      amountFormatted: formatCurrency(amount),
      method: paymentData.paymentMethod || paymentData.method,
      dueDate,
      dueDateFormatted: dueDate ? formatDate(dueDate) : null,
      daysUntilDue,
      urgencyEmoji,
      dueDescriptor,
      stage,
      followUpAt: paymentData.followUpAt || dueDate,
      actorId: userId,
      schoolId,
      ownerId,
      entityType: 'payment',
      entityId: paymentData.id,
      entityAction: normalizedOperation
    };

    if (blueprintKey) {
      const notifications = await sendBlueprintNotification(blueprintKey, context);
      if (notifications?.length) {
        return notifications[0];
      }
    }

    return await createNotification({
      type: NOTIFICATION_TYPES[`PAYMENT_${operation.toUpperCase()}`] || NOTIFICATION_TYPES.INFO,
      title: `Payment ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      message: `Payment of ${formatCurrency(amount)} has been ${operation}`,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      entityType: 'payment',
      entityId: paymentData.id,
      entityAction: operation,
      senderId: userId,
      schoolId,
      ownerId,
      metadata: context
    });
  } catch (error) {
    console.error('Error creating payment notification:', error);
    return null;
  }
};

/**
 * Create user operation notifications
 */
export const createUserNotification = async (operation, userData, userId, schoolId, ownerId) => {
  try {
    const notificationData = {
      type: NOTIFICATION_TYPES[`USER_${operation.toUpperCase()}`] || NOTIFICATION_TYPES.INFO,
      title: `User ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      message: `User ${userData.firstName} ${userData.lastName} has been ${operation}`,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      entityType: 'user',
      entityId: userData.id,
      entityAction: operation,
      senderId: userId,
      schoolId,
      ownerId,
      channels: ['IN_APP'],
      metadata: {
        userId: userData.id,
        userName: `${userData.firstName} ${userData.lastName}`,
        userRole: userData.role,
        operation
      }
    };

    // Determine recipients
    let recipients = [];
    
    // Notify school admin
    if (schoolId) {
      const schoolAdmins = await prisma.user.findMany({
        where: {
          role: 'SCHOOL_ADMIN',
          schoolId: BigInt(schoolId)
        },
        select: { id: true }
      });
      recipients.push(...schoolAdmins.map(a => a.id));
    }
    
    // Notify owner
    if (ownerId) {
      recipients.push(ownerId);
    }

    if (recipients.length > 0) {
      notificationData.recipients = recipients;
    }

    return await createNotification(notificationData);
  } catch (error) {
    console.error('Error creating user notification:', error);
    return null;
  }
};

/**
 * Create system-wide notifications
 */
export const createSystemNotification = async (type, title, message, priority = 'NORMAL', schoolId = null, ownerId = null, recipients = []) => {
  try {
    const notificationData = {
      type: NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.INFO,
      title,
      message,
      priority: NOTIFICATION_PRIORITIES[priority] || NOTIFICATION_PRIORITIES.NORMAL,
      entityType: 'system',
      entityAction: type.toLowerCase(),
      schoolId: schoolId || 1,
      ownerId,
      channels: ['IN_APP'],
      metadata: {
        systemEvent: type,
        timestamp: new Date().toISOString()
      }
    };

    if (recipients.length > 0) {
      notificationData.recipients = recipients;
    }

    return await createNotification(notificationData);
  } catch (error) {
    console.error('Error creating system notification:', error);
    return null;
  }
};

/**
 * Create customer operation notifications
 */
export const createCustomerNotification = async (operation, customerData, userId, schoolId, ownerId) => {
  try {
    const notificationData = {
      type: NOTIFICATION_TYPES[`CUSTOMER_${operation.toUpperCase()}`] || NOTIFICATION_TYPES.INFO,
      title: `Customer ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      message: `Customer ${customerData.name} has been ${operation}`,
      priority: NOTIFICATION_PRIORITIES.NORMAL,
      entityType: 'customer',
      entityId: customerData.id,
      entityAction: operation,
      senderId: userId,
      schoolId,
      ownerId,
      channels: ['IN_APP'],
      metadata: {
        customerId: customerData.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        operation
      }
    };

    // Determine recipients
    let recipients = [];
    
    // Notify sales staff
    const salesStaff = await prisma.user.findMany({
      where: {
        role: { in: ['SALES_OFFICER', 'SCHOOL_ADMIN'] },
        schoolId: BigInt(schoolId)
      },
      select: { id: true }
    });
    recipients.push(...salesStaff.map(s => s.id));

    if (recipients.length > 0) {
      notificationData.recipients = recipients;
    }

    return await createNotification(notificationData);
  } catch (error) {
    console.error('Error creating customer notification:', error);
    return null;
  }
};

/**
 * Create inventory operation notifications
 */
export const createInventoryNotification = async (operation, inventoryData, userId, schoolId, ownerId) => {
  try {
    const notificationData = {
      type: NOTIFICATION_TYPES[`INVENTORY_${operation.toUpperCase()}`] || NOTIFICATION_TYPES.INFO,
      title: `Inventory ${operation.charAt(0).toUpperCase() + operation.slice(1)}`,
      message: `Inventory item ${inventoryData.name} has been ${operation}`,
      priority: operation === 'low_stock' ? NOTIFICATION_PRIORITIES.HIGH : NOTIFICATION_PRIORITIES.NORMAL,
      entityType: 'inventory',
      entityId: inventoryData.id,
      entityAction: operation,
      senderId: userId,
      schoolId,
      ownerId,
      channels: ['IN_APP'],
      metadata: {
        inventoryId: inventoryData.id,
        itemName: inventoryData.name,
        currentQuantity: inventoryData.quantity,
        minQuantity: inventoryData.minQuantity,
        operation
      }
    };

    // Determine recipients
    let recipients = [];
    
    // Notify inventory staff
    const inventoryStaff = await prisma.user.findMany({
      where: {
        role: { in: ['INVENTORY_OFFICER', 'SCHOOL_ADMIN'] },
        schoolId: BigInt(schoolId)
      },
      select: { id: true }
    });
    recipients.push(...inventoryStaff.map(s => s.id));

    if (recipients.length > 0) {
      notificationData.recipients = recipients;
    }

    return await createNotification(notificationData);
  } catch (error) {
    console.error('Error creating inventory notification:', error);
    return null;
  }
};

/**
 * Get unread notification count for a user
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const count = await prisma.notificationRecipient.count({
      where: {
        userId: BigInt(userId),
        status: { not: 'READ' }
      }
    });
    
    return count;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
};





// ======================
// EXPORTS
// ======================

// All functions are already exported as named exports above
// No need for duplicate exports here 