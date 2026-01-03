export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  schoolId: string;
  isSystem: boolean;
  isRead: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
  entityType?: string;
  entityId?: string;
}

// Alias for code that uses AppNotification
export type AppNotification = Notification;

export interface NotificationRecipient {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  readAt?: string | Date;
  createdAt: string | Date;
}

export interface NotificationAttachment {
  id: string;
  notificationId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string | Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  createdByOwnerId?: string;
  isActive: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export type NotificationType = 'SUCCESS' | 'WARNING' | 'ERROR' | 'SYSTEM' | 'STUDENT' | 'ATTENDANCE' | 'PAYMENT' | 'USER' | 'CUSTOMER' | 'INVENTORY';

export type NotificationPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type NotificationStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';

export type UserRole =
  | 'SUPER_DUPER_ADMIN'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OWNER'
  | 'PRINCIPAL'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT'
  | 'STAFF';

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  status?: NotificationStatus;
  isRead?: boolean;
  schoolId?: string;
  userId?: string;
  page?: number;
  limit?: number;
}

export interface NotificationResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}

// WebSocket related types
export interface WebSocketAuthData {
  userId: string;
  schoolId: string;
  ownerId?: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface WebSocketNotificationEvent {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string | Date;
  entityType?: string;
  entityId?: string;
}

export interface WebSocketReadEvent {
  notificationId: string;
  userId: string;
  readAt: string | Date;
}

export interface WebSocketDeleteEvent {
  notificationId: string;
  userId: string;
  deletedAt: string | Date;
}

export interface WebSocketCountEvent {
  userId: string;
  count: number;
} 