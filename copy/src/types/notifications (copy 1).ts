export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
  recipients?: string[];
  entityType?: string;
  entityId?: string;
}

export type NotificationType = 
  | 'STUDENT_CREATED' | 'STUDENT_UPDATED' | 'STUDENT_DELETED' | 'STUDENT_STATUS_CHANGED'
  | 'CUSTOMER_CREATED' | 'CUSTOMER_UPDATED' | 'CUSTOMER_DELETED'
  | 'TEACHER_CREATED' | 'TEACHER_UPDATED' | 'TEACHER_DELETED'
  | 'FEE_STRUCTURE_CREATED' | 'FEE_STRUCTURE_UPDATED' | 'FEE_STRUCTURE_DELETED'
  | 'CLASS_CREATED' | 'CLASS_UPDATED' | 'CLASS_DELETED'
  | 'STUDENT_BULK_CREATE' | 'CUSTOMER_BULK_UPDATE' | 'CLASS_BULK_DELETE'
  | 'PAYMENT_RECEIVED' | 'PAYMENT_FAILED' | 'PAYMENT_PENDING'
  | 'EXAM_SCHEDULED' | 'EXAM_RESULTS' | 'EXAM_CANCELLED'
  | 'ATTENDANCE_MARKED' | 'ATTENDANCE_REMINDER'
  | 'SYSTEM_UPDATE' | 'MAINTENANCE_NOTICE'
  | 'CUSTOM_NOTIFICATION';

export type NotificationPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type NotificationStatus = 'PENDING' | 'READ' | 'ARCHIVED';

export type ActionType = 'PRIMARY' | 'SECONDARY' | 'DANGER';

export interface NotificationAction {
  id: string;
  label: string;
  type: ActionType;
  url?: string;
  action?: string;
  icon?: string;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  entityType?: string;
  entityId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  archived: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NotificationStatsResponse {
  success: boolean;
  data: NotificationStats;
}

export interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  recipients?: string[];
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface MarkNotificationsRequest {
  notificationIds: string[];
}

export interface WebSocketNotificationEvent {
  type: 'notification:new' | 'notification:updated' | 'notification:deleted';
  data: Notification | string;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  inApp: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  types: Record<NotificationType, boolean>;
}

export interface NotificationBadge {
  count: number;
  lastUpdated: string;
}

export interface NotificationToast {
  id: string;
  notification: Notification;
  visible: boolean;
  autoHide: boolean;
} 
