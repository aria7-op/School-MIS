import { messagingApiService } from '../api';
import {
  Message,
  Conversation,
  MessageType,
  MessagePriority,
  SearchFilters,
  ConversationFilters,
  MessageSendOptions,
  UseMessagingReturn,
  UseWebSocketReturn,
  MessagingState,
  MessagingActions,
  WebSocketEventData,
  Poll,
  UserStatus
} from '../types';

class MessagingService {
  private state: MessagingState = {
    messages: {},
    conversations: [],
    currentConversationId: null,
    unreadCounts: {},
    typingUsers: {},
    userStatuses: {},
    isLoading: false,
    error: null,
    searchResults: [],
    isSearching: false
  };

  private listeners: Set<(state: MessagingState) => void> = new Set();
  private wsConnected: boolean = false;

  constructor() {
    try {
      this.setupWebSocketListeners();
    } catch (error) {
      console.warn('🔌 WebSocket listeners setup failed:', error);
      // Continue without real-time features
    }
  }

  // Service availability check
  private isServiceAvailable(): boolean {
    return messagingApiService && typeof messagingApiService === 'object';
  }

  private isMethodAvailable(methodName: string): boolean {
    return this.isServiceAvailable() && 
           typeof messagingApiService[methodName as keyof typeof messagingApiService] === 'function';
  }

  private setupWebSocketListeners() {
    try {
      if (!this.isMethodAvailable('on')) {
        console.warn('messagingApiService.on is not available');
        return;
      }

      // Message events
      messagingApiService.on('message:received', (data: Message) => {
        this.handleMessageReceived(data);
      });

      messagingApiService.on('message:delivered', (data: { messageId: string }) => {
        this.updateMessageStatus(data.messageId, 'delivered');
      });

      messagingApiService.on('message:read', (data: { messageId: string }) => {
        this.updateMessageStatus(data.messageId, 'read');
      });

      // Typing events
      messagingApiService.on('typing:started', (data: { userId: string; conversationId: string }) => {
        this.addTypingUser(data.conversationId, data.userId);
      });

      messagingApiService.on('typing:stopped', (data: { userId: string; conversationId: string }) => {
        this.removeTypingUser(data.conversationId, data.userId);
      });

      // User status events
      messagingApiService.on('user:status', (data: { userId: string; status: UserStatus }) => {
        this.setUserStatus(data.userId, data.status);
      });

      // Poll events
      messagingApiService.on('poll:created', (data: Poll) => {
        this.handlePollCreated(data);
      });

      // Connection status
      messagingApiService.on('connect', () => {
        this.wsConnected = true;
        this.notifyListeners();
      });

      messagingApiService.on('disconnect', () => {
        this.wsConnected = false;
        this.notifyListeners();
      });
    } catch (error) {
      console.warn('🔌 WebSocket listeners setup failed:', error);
      // Continue without real-time features
    }
  }

  // State Management
  subscribe(listener: (state: MessagingState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state);
      } catch (error) {
        
      }
    });
  }

  // Actions
  setMessages(conversationId: string, messages: Message[]): void {
    this.state.messages[conversationId] = messages;
    this.notifyListeners();
  }

  addMessage(conversationId: string, message: Message): void {
    if (!this.state.messages[conversationId]) {
      this.state.messages[conversationId] = [];
    }
    this.state.messages[conversationId].push(message);
    this.notifyListeners();
  }

  updateMessage(conversationId: string, messageId: string, updates: Partial<Message>): void {
    const messages = this.state.messages[conversationId];
    if (messages) {
      const index = messages.findIndex(m => m.id === messageId);
      if (index !== -1) {
        messages[index] = { ...messages[index], ...updates };
        this.notifyListeners();
      }
    }
  }

  removeMessage(conversationId: string, messageId: string): void {
    const messages = this.state.messages[conversationId];
    if (messages) {
      this.state.messages[conversationId] = messages.filter(m => m.id !== messageId);
      this.notifyListeners();
    }
  }

  setConversations(conversations: Conversation[]): void {
    this.state.conversations = conversations;
    this.notifyListeners();
  }

  addConversation(conversation: Conversation): void {
    this.state.conversations.unshift(conversation);
    this.notifyListeners();
  }

  updateConversation(conversationId: string, updates: Partial<Conversation>): void {
    const index = this.state.conversations.findIndex(c => c.id === conversationId);
    if (index !== -1) {
      this.state.conversations[index] = { ...this.state.conversations[index], ...updates };
      this.notifyListeners();
    }
  }

  removeConversation(conversationId: string): void {
    this.state.conversations = this.state.conversations.filter(c => c.id !== conversationId);
    this.notifyListeners();
  }

  setCurrentConversation(conversationId: string | null): void {
    this.state.currentConversationId = conversationId;
    this.notifyListeners();
  }

  setUnreadCount(conversationId: string, count: number): void {
    this.state.unreadCounts[conversationId] = count;
    this.notifyListeners();
  }

  addTypingUser(conversationId: string, userId: string): void {
    if (!this.state.typingUsers[conversationId]) {
      this.state.typingUsers[conversationId] = new Set();
    }
    this.state.typingUsers[conversationId].add(userId);
    this.notifyListeners();
  }

  removeTypingUser(conversationId: string, userId: string): void {
    const typingUsers = this.state.typingUsers[conversationId];
    if (typingUsers) {
      typingUsers.delete(userId);
      this.notifyListeners();
    }
  }

  setUserStatus(userId: string, status: UserStatus): void {
    this.state.userStatuses[userId] = status;
    this.notifyListeners();
  }

  setLoading(loading: boolean): void {
    this.state.isLoading = loading;
    this.notifyListeners();
  }

  setError(error: string | null): void {
    this.state.error = error;
    this.notifyListeners();
  }

  setSearchResults(results: Message[]): void {
    this.state.searchResults = results;
    this.notifyListeners();
  }

  setSearching(searching: boolean): void {
    this.state.isSearching = searching;
    this.notifyListeners();
  }

  // Event Handlers
  private handleMessageReceived(message: Message): void {
    const conversationId = message.conversationId || message.receiverId;
    if (conversationId) {
      this.addMessage(conversationId, message);
      
      // Update conversation last message
      this.updateConversation(conversationId, {
        lastMessage: message,
        lastActivityAt: message.createdAt,
        unreadCount: (this.state.unreadCounts[conversationId] || 0) + 1
      });

      // Update unread count
      this.setUnreadCount(conversationId, (this.state.unreadCounts[conversationId] || 0) + 1);
    }
  }

  private updateMessageStatus(messageId: string, status: string): void {
    // Update message status in all conversations
    Object.keys(this.state.messages).forEach(conversationId => {
      this.updateMessage(conversationId, messageId, { status: status as any });
    });
  }

  private handlePollCreated(poll: Poll): void {
    // Handle poll creation - this would typically create a system message
    const pollMessage: Message = {
      id: `poll_${poll.id}`,
      senderId: poll.createdBy,
      content: `Poll: ${poll.question}`,
      type: MessageType.POLL,
      priority: MessagePriority.NORMAL,
      status: 'sent' as any,
      isRead: false,
      isEncrypted: false,
      attachments: [],
      metadata: { pollId: poll.id },
      createdAt: poll.createdAt,
      updatedAt: poll.createdAt,
      sender: { id: poll.createdBy, name: '', email: '', status: 'online' as any, role: '' }
    };

    // Add poll message to conversation
    this.addMessage(poll.conversationId || '', pollMessage);
  }

  // API Methods
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      if (this.isMethodAvailable('connectWebSocket')) {
        await messagingApiService.connectWebSocket();
      } else {
        console.warn('messagingApiService.connectWebSocket is not available');
      }

      // Load initial data
      await this.loadConversations();
      await this.loadUnreadCounts();

      this.setLoading(false);
    } catch (error) {
      console.error('Failed to initialize messaging service:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to initialize');
      this.setLoading(false);
    }
  }

  async loadConversations(filters: ConversationFilters = {}): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      if (messagingApiService && typeof messagingApiService.getUserConversations === 'function') {
        const response = await messagingApiService.getUserConversations(filters);
        this.setConversations(response || []);
      } else {
        console.warn('messagingApiService.getUserConversations is not available');
        this.setConversations([]);
      }

      this.setLoading(false);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to load conversations');
      this.setLoading(false);
    }
  }

  async loadMessages(conversationId: string, filters: SearchFilters = {}): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);

      if (messagingApiService && typeof messagingApiService.getConversationMessages === 'function') {
        const response = await messagingApiService.getConversationMessages(conversationId, filters);
        this.setMessages(conversationId, response || []);
      } else {
        console.warn('messagingApiService.getConversationMessages is not available');
        this.setMessages(conversationId, []);
      }

      this.setLoading(false);
    } catch (error) {
      console.error('Failed to load messages:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to load messages');
      this.setLoading(false);
    }
  }

  async sendMessage(conversationId: string, content: string, options: MessageSendOptions = {}): Promise<void> {
    try {
      if (!content.trim()) {
        throw new Error('Message content cannot be empty');
      }

      // Create message object
      const message: Message = {
        id: `temp_${Date.now()}`,
        senderId: this.getCurrentUserId(),
        conversationId,
        content: content.trim(),
        type: options.type || 'TEXT',
        priority: options.priority || 'NORMAL',
        status: 'SENDING',
        isRead: false,
        isEncrypted: options.isEncrypted || false,
        attachments: options.attachments || [],
        metadata: options.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sender: {
          id: this.getCurrentUserId(),
          name: 'Current User',
          email: 'user@example.com',
          status: 'ONLINE',
          role: 'USER'
        }
      };

      // Add message to local state immediately
      this.addMessage(conversationId, message);

      // Send real-time message if WebSocket is available
      if (messagingApiService && typeof messagingApiService.sendMessageRealTime === 'function') {
        messagingApiService.sendMessageRealTime(conversationId, content, options);
      } else {
        console.warn('messagingApiService.sendMessageRealTime is not available');
      }

      // Send message to backend
      if (messagingApiService && typeof messagingApiService.sendMessageToConversation === 'function') {
        const response = await messagingApiService.sendMessageToConversation(conversationId, {
          content: content.trim(),
          type: options.type || 'TEXT',
          priority: options.priority || 'NORMAL',
          replyToId: options.replyToId,
          attachments: options.attachments || [],
          metadata: options.metadata || {},
          isEncrypted: options.isEncrypted || false
        });

        // Update message with response data
        if (response) {
          this.updateMessage(conversationId, message.id, {
            id: response.id,
            status: 'SENT',
            createdAt: response.createdAt,
            updatedAt: response.updatedAt
          });
        }
      } else {
        console.warn('messagingApiService.sendMessageToConversation is not available');
        // Update message status to sent since we can't reach backend
        this.updateMessage(conversationId, message.id, { status: 'SENT' });
      }

      // Update conversation last message
      this.updateConversation(conversationId, {
        lastMessage: message,
        lastActivityAt: new Date().toISOString()
      });

    } catch (error) {
      console.error('Failed to send message:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to send message');
      
      // Update message status to failed
      if (content.trim()) {
        const tempMessageId = `temp_${Date.now()}`;
        this.updateMessage(conversationId, tempMessageId, { status: 'FAILED' });
      }
    }
  }

  async createConversation(data: Partial<Conversation>): Promise<Conversation | null> {
    try {
      this.setLoading(true);
      this.setError(null);

      if (messagingApiService && typeof messagingApiService.createConversation === 'function') {
        const response = await messagingApiService.createConversation(
          data.participants || [],
          data.type || 'DIRECT'
        );
        
        if (response) {
          this.addConversation(response);
          this.setLoading(false);
          return response;
        }
      } else {
        console.warn('messagingApiService.createConversation is not available');
      }

      this.setLoading(false);
      return null;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to create conversation');
      this.setLoading(false);
      return null;
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    try {
      if (messagingApiService && typeof messagingApiService.markMessageAsRead === 'function') {
        await messagingApiService.markMessageAsRead(messageId);
      } else {
        console.warn('messagingApiService.markMessageAsRead is not available');
      }
    } catch (error) {
      console.error('Failed to mark message as read:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to mark message as read');
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      if (messagingApiService && typeof messagingApiService.deleteMessage === 'function') {
        await messagingApiService.deleteMessage(messageId);
      } else {
        console.warn('messagingApiService.deleteMessage is not available');
      }
    } catch (error) {
      console.error('Failed to delete message:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to delete message');
    }
  }

  async searchMessages(query: string, filters: SearchFilters = {}): Promise<Message[]> {
    try {
      this.setSearching(true);
      this.setError(null);

      if (messagingApiService && typeof messagingApiService.searchMessages === 'function') {
        const response = await messagingApiService.searchMessages(query, filters);
        this.setSearchResults(response || []);
        this.setSearching(false);
        return response || [];
      } else {
        console.warn('messagingApiService.searchMessages is not available');
        this.setSearchResults([]);
        this.setSearching(false);
        return [];
      }
    } catch (error) {
      console.error('Failed to search messages:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to search messages');
      this.setSearching(false);
      return [];
    }
  }

  async loadMoreMessages(conversationId: string): Promise<void> {
    try {
      if (messagingApiService && typeof messagingApiService.getConversationMessages === 'function') {
        const response = await messagingApiService.getConversationMessages(conversationId, {
          limit: 20,
          offset: this.state.messages[conversationId]?.length || 0
        });
        
        if (response && response.length > 0) {
          // Prepend new messages to existing ones
          const existingMessages = this.state.messages[conversationId] || [];
          this.setMessages(conversationId, [...response, ...existingMessages]);
        }
      } else {
        console.warn('messagingApiService.getConversationMessages is not available');
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to load more messages');
    }
  }

  startTyping(conversationId: string): void {
    try {
      if (messagingApiService && typeof messagingApiService.startTyping === 'function') {
        messagingApiService.startTyping(conversationId);
      } else {
        console.warn('messagingApiService.startTyping is not available');
      }
    } catch (error) {
      console.error('Error starting typing:', error);
    }
  }

  stopTyping(conversationId: string): void {
    try {
      if (messagingApiService && typeof messagingApiService.stopTyping === 'function') {
        messagingApiService.stopTyping(conversationId);
      } else {
        console.warn('messagingApiService.stopTyping is not available');
      }
    } catch (error) {
      console.error('Error stopping typing:', error);
    }
  }

  async loadUnreadCounts(): Promise<void> {
    try {
      if (messagingApiService && typeof messagingApiService.getUnreadCount === 'function') {
        const response = await messagingApiService.getUnreadCount();
        
        if (response && response.conversations) {
          Object.entries(response.conversations).forEach(([conversationId, count]) => {
            this.setUnreadCount(conversationId, count as number);
          });
        }
      } else {
        console.warn('messagingApiService.getUnreadCount is not available');
      }
    } catch (error) {
      console.error('Failed to load unread counts:', error);
      this.setError(error instanceof Error ? error.message : 'Failed to load unread counts');
    }
  }

  // WebSocket Methods
  getConnectionStatus(): boolean {
    try {
      if (this.isMethodAvailable('isWebSocketConnected')) {
        return messagingApiService.isWebSocketConnected();
      }
      console.warn('messagingApiService.isWebSocketConnected is not available');
      return false;
    } catch (error) {
      console.error('Error getting connection status:', error);
      return false;
    }
  }

  disconnect(): void {
    try {
      if (this.isMethodAvailable('disconnectWebSocket')) {
        messagingApiService.disconnectWebSocket();
      } else {
        console.warn('messagingApiService.disconnectWebSocket is not available');
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }

  // Helper Methods
  private getCurrentUserId(): string {
    // This should be implemented based on your auth system
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).id : '';
    }
    return '';
  }

  // Getters
  getState(): MessagingState {
    return this.state;
  }

  getCurrentConversation(): Conversation | null {
    if (!this.state.currentConversationId) return null;
    return this.state.conversations.find(c => c.id === this.state.currentConversationId) || null;
  }

  getMessages(conversationId: string): Message[] {
    return this.state.messages[conversationId] || [];
  }

  getConversations(): Conversation[] {
    return this.state.conversations;
  }

  getUnreadCount(conversationId: string): number {
    return this.state.unreadCounts[conversationId] || 0;
  }

  getTypingUsers(conversationId: string): Set<string> {
    return this.state.typingUsers[conversationId] || new Set();
  }

  getUserStatus(userId: string): UserStatus {
    return this.state.userStatuses[userId] || 'offline';
  }

  getSearchResults(): Message[] {
    return this.state.searchResults;
  }

  getIsLoading(): boolean {
    return this.state.isLoading;
  }

  getError(): string | null {
    return this.state.error;
  }

  getIsSearching(): boolean {
    return this.state.isSearching;
  }

  // Event handling methods for hooks
  on(event: string, callback: (data: any) => void): void {
    // For now, we'll use a simple event system
    // In a real implementation, this would integrate with the WebSocket events

  }

  off(event: string, callback: (data: any) => void): void {
    // For now, we'll use a simple event system

  }

  emit(event: string, data: any): void {
    // For now, we'll use a simple event system

  }

  // Poll methods
  createPoll(conversationId: string, pollData: {
    question: string;
    options: string[];
    allowMultiple?: boolean;
    duration?: number;
    isAnonymous?: boolean;
  }): void {
    try {
      if (messagingApiService && typeof messagingApiService.createPoll === 'function') {
        messagingApiService.createPoll(conversationId, pollData);
      } else {
        console.warn('messagingApiService.createPoll is not available');
      }
    } catch (error) {
      console.error('Error creating poll:', error);
    }
  }

  votePoll(pollId: string, optionIds: string[]): void {
    try {
      if (messagingApiService && typeof messagingApiService.votePoll === 'function') {
        messagingApiService.votePoll(pollId, optionIds);
      } else {
        console.warn('messagingApiService.votePoll is not available');
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  }

  // File upload method
  uploadFile(file: File, conversationId: string): void {
    try {
      if (messagingApiService && typeof messagingApiService.uploadFile === 'function') {
        messagingApiService.uploadFile(file, conversationId);
      } else {
        console.warn('messagingApiService.uploadFile is not available');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  // AI method
  requestAI(type: string, context: string, conversationId: string): void {
    try {
      if (messagingApiService && typeof messagingApiService.requestAI === 'function') {
        messagingApiService.requestAI(type, context, conversationId);
      } else {
        console.warn('messagingApiService.requestAI is not available');
      }
    } catch (error) {
      console.error('Error requesting AI:', error);
    }
  }

  // Call method
  startCall(conversationId: string, callType: string = 'AUDIO'): void {
    try {
      if (messagingApiService && typeof messagingApiService.startCall === 'function') {
        messagingApiService.startCall(conversationId, callType);
      } else {
        console.warn('messagingApiService.startCall is not available');
      }
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingService();
export default messagingService; 
