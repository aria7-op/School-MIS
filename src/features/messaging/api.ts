import { API_BASE_URL, WS_BASE_URL } from '../../constants/api';

// WebSocket Service for real-time messaging
class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(url: string) {
    this.url = url;
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Base API Service
class BaseApiService {
  protected baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  protected async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  protected async get(endpoint: string) {
    return this.request(endpoint);
  }

  protected async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  protected async put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  protected async delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }
}

// Message Types
export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  metadata?: Record<string, any>;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[];
  admins: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Messaging API Service
export class MessagingApiService {
  private webSocketService: WebSocketService;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor() {
    this.webSocketService = new WebSocketService(`${WS_BASE_URL}/messaging`);
  }

  // Event handling methods
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)?.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  // WebSocket methods
  async connectWebSocket() {
    this.webSocketService.connect();
  }

  async disconnectWebSocket() {
    this.webSocketService.disconnect();
  }

  isWebSocketConnected(): boolean {
    return this.webSocketService.isConnected();
  }

  // Message methods
  async sendMessage(message: Omit<Message, 'id' | 'timestamp' | 'status'>): Promise<Message> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const sentMessage = await response.json();
      this.webSocketService.send({
        type: 'message_sent',
        data: sentMessage,
      });

      return sentMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Additional methods needed by MessagingService
  async getUserConversations(filters: any = {}): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations?${new URLSearchParams(filters)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch user conversations');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching user conversations:', error);
      return [];
    }
  }

  async getConversationMessages(conversationId: string, filters: any = {}): Promise<Message[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversations/${conversationId}/messages?${new URLSearchParams(filters)}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch conversation messages');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      return [];
    }
  }

  sendMessageRealTime(conversationId: string, content: string, options: any = {}): void {
    this.webSocketService.send({
      type: 'message',
      conversationId,
      content,
      ...options,
    });
  }

  async sendMessageToConversation(conversationId: string, messageData: any): Promise<Message> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) {
        throw new Error('Failed to send message to conversation');
      }
      return response.json();
    } catch (error) {
      console.error('Error sending message to conversation:', error);
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async searchMessages(query: string, filters: any = {}): Promise<Message[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/messages/search?q=${encodeURIComponent(query)}&${new URLSearchParams(filters)}`
      );
      if (!response.ok) {
        throw new Error('Failed to search messages');
      }
      return response.json();
    } catch (error) {
      console.error('Error searching messages:', error);
      return [];
    }
  }

  startTyping(conversationId: string): void {
    this.webSocketService.send({
      type: 'typing_started',
      conversationId,
    });
  }

  stopTyping(conversationId: string): void {
    this.webSocketService.send({
      type: 'typing_stopped',
      conversationId,
    });
  }

  async getUnreadCount(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/unread-count`);
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      return response.json();
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return { total: 0, conversations: {} };
    }
  }

  createPoll(conversationId: string, pollData: any): void {
    this.webSocketService.send({
      type: 'poll_created',
      conversationId,
      pollData,
    });
  }

  votePoll(pollId: string, optionIds: string[]): void {
    this.webSocketService.send({
      type: 'poll_vote',
      pollId,
      optionIds,
    });
  }

  uploadFile(file: File, conversationId: string): void {
    // TODO: Implement file upload
    console.log('File upload not implemented yet');
  }

  requestAI(type: string, context: string, conversationId: string): void {
    this.webSocketService.send({
      type: 'ai_request',
      aiType: type,
      context,
      conversationId,
    });
  }

  startCall(conversationId: string, callType: string = 'AUDIO'): void {
    this.webSocketService.send({
      type: 'call_started',
      conversationId,
      callType,
    });
  }

  async getMessages(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversations/${conversationId}/messages?limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark message as read');
      }

      this.webSocketService.send({
        type: 'message_read',
        data: { messageId },
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Conversation methods
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      return response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async createConversation(participants: string[], type: 'direct' | 'group' = 'direct'): Promise<Conversation> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ participants, type }),
      });

      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Group methods
  async createGroup(name: string, description: string, members: string[]): Promise<Group> {
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description, members }),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      return response.json();
    } catch (error) {
      console.error('Error creating group:', error);
      throw error;
    }
  }

  async addGroupMembers(groupId: string, members: string[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ members }),
      });

      if (!response.ok) {
        throw new Error('Failed to add group members');
      }
    } catch (error) {
      console.error('Error adding group members:', error);
      throw error;
    }
  }

  async removeGroupMember(groupId: string, memberId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove group member');
      }
    } catch (error) {
      console.error('Error removing group member:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const messagingApiService = new MessagingApiService();
export default messagingApiService;
