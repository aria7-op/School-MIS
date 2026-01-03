import {
  Notification,
  NotificationFilters,
  NotificationResponse,
  UnreadCountResponse,
} from '../types/notification';
import secureApiService from './secureApiService';

class NotificationService {
  private buildQueryString(filters: Record<string, unknown> = {}): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    });
    const query = params.toString();
    return query ? `?${query}` : '';
  }

  private assertSuccess<T>(response: { success: boolean; message?: string; data: T }): T {
    if (!response.success) {
      throw new Error(response.message || 'Request failed');
    }
    return response.data;
  }

  async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    const response = await secureApiService.get<NotificationResponse>(
      `/notifications${this.buildQueryString(filters)}`
    );
    const data = this.assertSuccess(response);
    // Ensure the response has the expected structure
    if (data && data.data && Array.isArray(data.data)) {
      return data as NotificationResponse;
    }
    // Handle case where API returns notifications directly
    if (Array.isArray(data)) {
      return {
        data: data as Notification[],
        total: (data as any).total || data.length,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 1
      };
    }
    return {
      data: [],
      total: 0,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: 0
    };
  }

  async getNotificationById(id: string): Promise<Notification> {
    const response = await secureApiService.get<Notification>(`/notifications/${id}`);
    return this.assertSuccess(response);
  }

  async getUserNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
    const response = await secureApiService.get<NotificationResponse>(
      `/notifications/user/me${this.buildQueryString(filters)}`
    );
    const data = this.assertSuccess(response);
    // Ensure the response has the expected structure
    if (data && data.data && Array.isArray(data.data)) {
      return data as NotificationResponse;
    }
    // Handle case where API returns notifications directly
    if (Array.isArray(data)) {
      return {
        data: data as Notification[],
        total: (data as any).total || data.length,
        page: filters.page || 1,
        limit: filters.limit || 10,
        totalPages: 1
      };
    }
    return {
      data: [],
      total: 0,
      page: filters.page || 1,
      limit: filters.limit || 10,
      totalPages: 0
    };
  }

  async getRealtimeNotifications(limit: number = 10, offset: number = 0): Promise<NotificationResponse> {
    const response = await secureApiService.get<NotificationResponse>(
      `/notifications/realtime${this.buildQueryString({ limit, offset })}`
    );
    const data = this.assertSuccess(response);
    // Ensure the response has the expected structure
    if (data && data.data && Array.isArray(data.data)) {
      return data as NotificationResponse;
    }
    // Handle case where API returns notifications directly
    if (Array.isArray(data)) {
      return {
        data: data as Notification[],
        total: (data as any).total || data.length,
        page: 1,
        limit: limit,
        totalPages: 1
      };
    }
    return {
      data: [],
      total: 0,
      page: 1,
      limit: limit,
      totalPages: 0
    };
  }

  async getUnreadCount(): Promise<number> {
    const response = await secureApiService.get<UnreadCountResponse>(`/notifications/unread/count`);
    const data = this.assertSuccess(response);
    return data.count;
  }

  async markNotificationAsRead(
    notificationIds: string[]
  ): Promise<{ success: boolean; message: string; updatedCount: number }> {
    const response = await secureApiService.post<{ updatedCount?: number }>(
      `/notifications/mark-read`,
      { notificationIds }
    );
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark notifications as read');
    }
    return {
      success: true,
      message: response.message || 'Notifications marked as read',
      updatedCount: response.data?.updatedCount ?? 0,
    };
  }

  async markSingleNotificationAsRead(
    id: string
  ): Promise<{ success: boolean; message: string; updatedCount: number }> {
    const response = await secureApiService.put<{ updatedCount?: number }>(`/notifications/${id}/read`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to mark notification as read');
    }
    return {
      success: true,
      message: response.message || 'Notification marked as read',
      updatedCount: response.data?.updatedCount ?? 0,
    };
  }

  async updateNotificationStatus(id: string, status: string): Promise<Notification> {
    const response = await secureApiService.put<Notification>(`/notifications/${id}/status`, { status });
    return this.assertSuccess(response);
  }

  async deleteNotification(id: string): Promise<{ success: boolean; message: string }> {
    const response = await secureApiService.delete<{ message?: string }>(`/notifications/${id}`);
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete notification');
    }
    return {
      success: true,
      message: response.message || response.data?.message || 'Notification deleted successfully',
    };
  }

  async createNotification(notificationData: Partial<Notification>): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications`, notificationData);
    return this.assertSuccess(response);
  }

  async updateNotification(id: string, updateData: Partial<Notification>): Promise<Notification> {
    const response = await secureApiService.put<Notification>(`/notifications/${id}`, updateData);
    return this.assertSuccess(response);
  }

  async sendBulkNotification(
    recipients: string[],
    notificationData: Partial<Notification>
  ): Promise<{
    success: boolean;
    message: string;
    data: {
      successful: number;
      failed: number;
      notifications: Notification[];
      errors: Array<{ recipientId: string; error: string }>;
    };
  }> {
    const response = await secureApiService.post<{
      successful: number;
      failed: number;
      notifications: Notification[];
      errors: Array<{ recipientId: string; error: string }>;
    }>(`/notifications/bulk`, { recipients, notificationData });
    if (!response.success) {
      throw new Error(response.message || 'Failed to send notifications');
    }
    return {
      success: true,
      message: response.message || 'Notifications sent successfully',
      data: {
        successful: response.data?.successful ?? 0,
        failed: response.data?.failed ?? 0,
        notifications: response.data?.notifications ?? [],
        errors: response.data?.errors ?? [],
      },
    };
  }

  async getNotificationStats(period: string = '30d'): Promise<any> {
    const response = await secureApiService.get<any>(`/notifications/stats${this.buildQueryString({ period })}`);
    return this.assertSuccess(response);
  }

  async getNotificationTemplates(): Promise<any[]> {
    const response = await secureApiService.get<any[]>(`/notifications/templates`);
    return this.assertSuccess(response);
  }

  async createStudentNotification(operation: string, studentData: any, additionalData: any = {}): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications/student`, {
      operation,
      studentData,
      additionalData,
    });
    return this.assertSuccess(response);
  }

  async createAttendanceNotification(operation: string, attendanceData: any): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications/attendance`, {
      operation,
      attendanceData,
    });
    return this.assertSuccess(response);
  }

  async createPaymentNotification(operation: string, paymentData: any): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications/payment`, {
      operation,
      paymentData,
    });
    return this.assertSuccess(response);
  }

  async createUserNotification(operation: string, userData: any): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications/user`, {
      operation,
      userData,
    });
    return this.assertSuccess(response);
  }

  async createSystemNotification(
    type: string,
    title: string,
    message: string,
    priority: string = 'NORMAL',
    recipients: string[] = []
  ): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications/system`, {
      type,
      title,
      message,
      priority,
      recipients,
    });
    return this.assertSuccess(response);
  }

  async createCustomerNotification(operation: string, customerData: any): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications/customer`, {
      operation,
      customerData,
    });
    return this.assertSuccess(response);
  }

  async createInventoryNotification(operation: string, inventoryData: any): Promise<Notification> {
    const response = await secureApiService.post<Notification>(`/notifications/inventory`, {
      operation,
      inventoryData,
    });
    return this.assertSuccess(response);
  }
}

const notificationService = new NotificationService();

export default notificationService;
