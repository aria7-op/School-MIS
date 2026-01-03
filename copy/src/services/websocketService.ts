import { io, Socket } from 'socket.io-client';
import { 
  WebSocketAuthData, 
  WebSocketNotificationEvent, 
  WebSocketReadEvent, 
  WebSocketDeleteEvent, 
  WebSocketCountEvent 
} from '../types/notification';

export interface WebSocketCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onAuthSuccess?: (data: any) => void;
  onAuthError?: (error: any) => void;
  onNotificationNew?: (notification: WebSocketNotificationEvent) => void;
  onNotificationRead?: (data: WebSocketReadEvent) => void;
  onNotificationDeleted?: (data: WebSocketDeleteEvent) => void;
  onNotificationCount?: (data: WebSocketCountEvent) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private forceClosed = false;

  constructor() {
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    // Handle page visibility change to reconnect when tab becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && !this.isConnected && this.socket) {
        this.reconnect();
      }
    });

    // Handle online/offline events
    window.addEventListener('online', () => {
      if (!this.isConnected) {
        this.reconnect();
      }
    });

    window.addEventListener('offline', () => {
      this.isConnected = false;
    });
  }

  connect(url: string, authData: WebSocketAuthData, callbacks: WebSocketCallbacks = {}) {
    try {
      // console.log('🔌 WebSocketService: Connecting to:', url);
      // console.log('🔌 WebSocketService: Auth data:', authData);
      
      this.callbacks = callbacks;
      
      // Close existing connection if any
      if (this.socket) {
        this.socket.close();
      }

      // Create new socket connection
      // Extract base URL and path for Socket.IO
      const baseUrl = url.includes('/api') ? url.replace('/api', '') : url;
      const socketPath = url.includes('/api') ? '/api/socket.io' : '/socket.io';
      
      // console.log('🔌 WebSocketService: Base URL:', baseUrl);
      // console.log('🔌 WebSocketService: Socket path:', socketPath);
      
      this.forceClosed = false;
      this.socket = io(baseUrl, {
        path: socketPath,
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        auth: {
          token: localStorage.getItem('userToken') || localStorage.getItem('token') || ''
        }
      });

      this.setupEventHandlers(authData);
      
      // console.log('WebSocket connection initiated');
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.handleConnectionError();
    }
  }

  private setupEventHandlers(authData: WebSocketAuthData) {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      // console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Authenticate with user data
      this.socket?.emit('auth:login', authData);
      
      this.callbacks.onConnect?.();
    });

    this.socket.on('auth:success', (data) => {
      // console.log('WebSocket authenticated:', data);
      this.callbacks.onAuthSuccess?.(data);
    });

    this.socket.on('auth:error', (error) => {
      console.error('WebSocket authentication failed:', error);
      this.callbacks.onAuthError?.(error);
      this.forceClosed = true;
      this.disconnect();
    });

    this.socket.on('notification:new', (notification: WebSocketNotificationEvent) => {
      // console.log('New notification received:', notification);
      this.callbacks.onNotificationNew?.(notification);
    });

    this.socket.on('notification:read', (data: WebSocketReadEvent) => {
      // console.log('Notification marked as read:', data);
      this.callbacks.onNotificationRead?.(data);
    });

    this.socket.on('notification:deleted', (data: WebSocketDeleteEvent) => {
      // console.log('Notification deleted:', data);
      this.callbacks.onNotificationDeleted?.(data);
    });

    this.socket.on('notification:count', (data: WebSocketCountEvent) => {
      // console.log('Notification count update:', data);
      this.callbacks.onNotificationCount?.(data);
    });

    this.socket.on('disconnect', (reason) => {
      // console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.callbacks.onDisconnect?.();
      
      // Attempt to reconnect if not a manual disconnect or forced close
      if (!this.forceClosed && reason !== 'io client disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      if (this.isAuthenticationError(error)) {
        this.forceClosed = true;
        this.callbacks.onAuthError?.(error);
        this.disconnect();
        return;
      }
      this.handleConnectionError();
    });

    this.socket.on('reconnect', (attemptNumber) => {
      // console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Re-authenticate after reconnection
      this.socket?.emit('auth:login', authData);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
      if (this.isAuthenticationError(error)) {
        this.forceClosed = true;
        this.callbacks.onAuthError?.(error);
        this.disconnect();
        return;
      }

      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.stopReconnection();
      }
    });

    this.socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      this.stopReconnection();
    });
  }

  private isAuthenticationError(error: any): boolean {
    if (!error) return false;
    const message =
      typeof error === 'string'
        ? error
        : error?.message || error?.data?.message || error?.description || '';
    if (!message) return false;
    const normalized = message.toLowerCase();
    return normalized.includes('invalid token') ||
      normalized.includes('invalid signature') ||
      normalized.includes('authentication required') ||
      normalized.includes('jwt') ||
      normalized.includes('auth');
  }

  private handleConnectionError() {
    this.isConnected = false;
    this.scheduleReconnect();
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnect();
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  private reconnect() {
    if (this.socket && !this.isConnected) {
      // console.log('Attempting to reconnect...');
      this.socket.connect();
    }
  }

  private stopReconnection() {
    this.reconnectAttempts = this.maxReconnectAttempts;
    this.forceClosed = true;
    // console.log('Stopped reconnection attempts');
  }

  disconnect() {
    if (this.socket) {
      this.forceClosed = true;
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
      // console.log('WebSocket disconnected');
    }
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  emit(event: string, data: any) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Cannot emit event: WebSocket not connected');
    }
  }

  // Specific notification methods
  markNotificationAsRead(notificationId: string, userId: string) {
    this.emit('notification:read', { notificationId, userId });
  }

  deleteNotification(notificationId: string, userId: string) {
    this.emit('notification:delete', { notificationId, userId });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }

  // Update callbacks
  updateCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService; 