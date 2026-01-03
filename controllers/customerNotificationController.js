import prisma from '../utils/prismaClient.js';
import logger from '../config/logger.js';
import {
  resolveManagedScope,
  normalizeScopeWithSchool,
  applyScopeToWhere,
  verifyRecordInScope,
  toBigIntSafe,
  toBigIntOrNull
} from '../utils/contextScope.js';

const convertBigInts = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (Array.isArray(value)) return value.map(convertBigInts);
  if (typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, convertBigInts(val)]));
  }
  return value;
};

const respondWithScopedError = (res, error, fallbackMessage) => {
  const status = error?.statusCode || error?.status || 500;
  const message = error?.message || fallbackMessage;
  logger.error(message, error);
  return res.status(status).json({ success: false, message });
};

const resolveNotificationScope = async (req, entityName) => {
  const scope = normalizeScopeWithSchool(
    await resolveManagedScope(req),
    toBigIntSafe(req.user?.schoolId)
  );
  if (!scope?.schoolId) {
    const error = new Error(`No managed school selected for ${entityName}`);
    error.statusCode = 400;
    throw error;
  }
  return scope;
};

const ensureCustomerAccessible = async (customerId, scope) => {
  if (!customerId) return false;
  return verifyRecordInScope('customers', customerId, scope, {
    branchColumn: 'branchId',
    useCourse: false
  });
};

export const getNotifications = async (req, res) => {
  try {
    const scope = await resolveNotificationScope(req, 'customer notifications');
    const customerId = toBigIntOrNull(req.query.customerId ?? req.params?.customerId);
    if (customerId) {
      const accessible = await ensureCustomerAccessible(customerId, scope);
      if (!accessible) {
        return respondWithScopedError(res, { statusCode: 404, message: 'Customer not found in the selected context' }, 'Customer not found');
      }
    }

    const notifications = await prisma.notification.findMany({
      where: applyScopeToWhere({
        entityType: 'customer',
        entityId: customerId ?? undefined
      }, scope, { useCourse: false }),
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: convertBigInts(notifications) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to fetch notifications');
  }
};

export const markNotificationsAsRead = async (req, res) => {
  try {
    const scope = await resolveNotificationScope(req, 'notification mark read');
    const { notificationIds } = req.body;
    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No notification IDs provided' });
    }

    const ids = notificationIds
      .map(toBigIntOrNull)
      .filter(Boolean);

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid notification IDs provided' });
    }

    await prisma.notification.updateMany({
      where: applyScopeToWhere({ id: { in: ids } }, scope, { useCourse: false }),
      data: { status: 'READ', readAt: new Date() }
    });

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to mark notifications as read');
  }
};

export const updateNotificationSettings = async (req, res) => {
  try {
    const scope = await resolveNotificationScope(req, 'notification settings update');
    const userId = toBigIntSafe(req.user?.id);
    const settingsData = req.body;

    const settings = await prisma.notificationSetting.upsert({
      where: { userId },
      update: {
        ...settingsData,
        schoolId: toBigIntSafe(scope.schoolId)
      },
      create: {
        userId,
        schoolId: toBigIntSafe(scope.schoolId),
        ...settingsData
      }
    });

    res.json({ success: true, message: 'Notification settings updated', data: convertBigInts(settings) });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to update notification settings');
  }
};

export const getNotificationSettings = async (req, res) => {
  try {
    const scope = await resolveNotificationScope(req, 'notification settings get');
    const userId = toBigIntSafe(req.user?.id);

    const settings = await prisma.notificationSetting.findUnique({
      where: { userId },
      select: {
        email: true,
        sms: true,
        push: true,
        web: true,
        inApp: true,
        dailyDigest: true
      }
    });

    res.json({ success: true, data: settings || {} });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to load notification settings');
  }
};

export const testNotification = async (req, res) => {
  try {
    const scope = await resolveNotificationScope(req, 'notification test');
    const userId = toBigIntSafe(req.user?.id);

    await prisma.notification.create({
      data: {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'TEST',
        schoolId: toBigIntSafe(scope.schoolId),
        entityType: 'user',
        entityId: userId,
        status: 'PENDING',
        createdBy: userId
      }
    });

    res.json({ success: true, message: 'Test notification queued' });
  } catch (error) {
    return respondWithScopedError(res, error, 'Failed to send test notification');
  }
}; 