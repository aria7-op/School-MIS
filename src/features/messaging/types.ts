export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  conversationId?: string;
  content: string;
  contentHtml?: string;
  contentMarkdown?: string;
  type: MessageType;
  priority: MessagePriority;
  status: MessageStatus;
  isRead: boolean;
  isEncrypted: boolean;
  encryptionType?: EncryptionType;
  replyToId?: string;
  replyToMessage?: Message;
  attachments: MessageAttachment[];
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deliveredAt?: string;
  readAt?: string;
  sender: User;
  receiver?: User;
}

export interface Conversation {
  id: string;
  name?: string;
  description?: string;
  type: ConversationType;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  isEncrypted: boolean;
  encryptionType: EncryptionType;
  settings: ConversationSettings;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

export interface ConversationParticipant {
  userId: string;
  role: ParticipantRole;
  joinedAt: string;
  leftAt?: string;
  isActive: boolean;
  user: User;
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  metadata: Record<string, any>;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: UserStatus;
  customStatus?: string;
  lastSeen?: string;
  role: string;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  allowMultiple: boolean;
  isAnonymous: boolean;
  duration?: number;
  endTime?: string;
  isActive: boolean;
  totalVotes: number;
  createdBy: string;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  userName: string;
  startedAt: string;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: string;
  user: User;
}

export interface MessageStatistics {
  totalMessages: number;
  unreadMessages: number;
  sentMessages: number;
  receivedMessages: number;
  conversationsCount: number;
  activeConversations: number;
  averageResponseTime: number;
  messagesByType: Record<MessageType, number>;
  messagesByPriority: Record<MessagePriority, number>;
}

export interface ConversationAnalytics {
  conversationId: string;
  totalMessages: number;
  participantsCount: number;
  averageMessageLength: number;
  mostActiveHour: number;
  responseRate: number;
  messagesByDay: Record<string, number>;
  topParticipants: Array<{
    userId: string;
    messageCount: number;
    userName: string;
  }>;
}

export interface SearchFilters {
  query?: string;
  senderId?: string;
  receiverId?: string;
  conversationId?: string;
  type?: MessageType;
  priority?: MessagePriority;
  dateFrom?: string;
  dateTo?: string;
  hasAttachments?: boolean;
  isEncrypted?: boolean;
  isRead?: boolean;
  page?: number;
  limit?: number;
}

export interface ConversationFilters {
  type?: ConversationType;
  isArchived?: boolean;
  isPinned?: boolean;
  hasUnread?: boolean;
  participantId?: string;
  page?: number;
  limit?: number;
}

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface FileUpload {
  file: {
    name: string;
    type: string;
    size: number;
    data: string; // base64
  };
  conversationId: string;
  metadata?: Record<string, any>;
}

export interface AIRequest {
  type: AIRequestType;
  context: string;
  conversationId: string;
  parameters?: Record<string, any>;
}

export interface CallData {
  conversationId: string;
  callType: CallType;
  participants: string[];
  callId: string;
  status: CallStatus;
}

// Enums
export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE',
  LOCATION = 'LOCATION',
  CONTACT = 'CONTACT',
  POLL = 'POLL',
  SYSTEM = 'SYSTEM',
  ENCRYPTED = 'ENCRYPTED'
}

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum MessageStatus {
  SENDING = 'SENDING',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED'
}

export enum ConversationType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  BROADCAST = 'BROADCAST',
  CHANNEL = 'CHANNEL'
}

export enum ParticipantRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST'
}

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  AWAY = 'AWAY',
  BUSY = 'BUSY',
  INVISIBLE = 'INVISIBLE'
}

export enum EncryptionType {
  NONE = 'NONE',
  AES_256 = 'AES_256',
  END_TO_END = 'END_TO_END',
  CUSTOM = 'CUSTOM'
}

export enum AIRequestType {
  SUMMARIZE = 'SUMMARIZE',
  TRANSLATE = 'TRANSLATE',
  SENTIMENT = 'SENTIMENT',
  SUGGEST_REPLY = 'SUGGEST_REPLY',
  SMART_REPLY = 'SMART_REPLY',
  CONTENT_MODERATION = 'CONTENT_MODERATION'
}

export enum CallType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  SCREEN_SHARE = 'SCREEN_SHARE'
}

export enum CallStatus {
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  ENDED = 'ENDED',
  MISSED = 'MISSED',
  DECLINED = 'DECLINED'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface MessagesResponse extends ApiResponse<{
  messages: Message[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {}

export interface ConversationsResponse extends ApiResponse<{
  conversations: Conversation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {}

export interface MessageResponse extends ApiResponse<Message> {}
export interface ConversationResponse extends ApiResponse<Conversation> {}
export interface StatisticsResponse extends ApiResponse<MessageStatistics> {}
export interface AnalyticsResponse extends ApiResponse<ConversationAnalytics> {}

// WebSocket Event Types
export interface WebSocketMessageEvent {
  type: 'message:received' | 'message:delivered' | 'message:read' | 'message:reaction';
  data: Message | MessageReaction;
}

export interface WebSocketTypingEvent {
  type: 'typing:started' | 'typing:stopped';
  data: TypingIndicator;
}

export interface WebSocketUserEvent {
  type: 'user:status' | 'user:online' | 'user:offline';
  data: User;
}

export interface WebSocketPollEvent {
  type: 'poll:created' | 'poll:updated' | 'poll:ended';
  data: Poll;
}

export interface WebSocketFileEvent {
  type: 'file:uploaded' | 'file:failed';
  data: MessageAttachment;
}

export interface WebSocketAIEvent {
  type: 'ai:response' | 'ai:suggestions';
  data: any;
}

export interface WebSocketCallEvent {
  type: 'call:started' | 'call:incoming' | 'call:ended' | 'call:missed';
  data: CallData;
}

export type WebSocketEventData = 
  | WebSocketMessageEvent
  | WebSocketTypingEvent
  | WebSocketUserEvent
  | WebSocketPollEvent
  | WebSocketFileEvent
  | WebSocketAIEvent
  | WebSocketCallEvent;

// Component Props Types
export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
  onReply?: (message: Message) => void;
  onReaction?: (messageId: string, reaction: string) => void;
  onLongPress?: (message: Message) => void;
}

export interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onPress: (conversation: Conversation) => void;
  onLongPress?: (conversation: Conversation) => void;
}

export interface MessageInputProps {
  conversationId: string;
  onSend: (content: string, options?: MessageSendOptions) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export interface MessageSendOptions {
  type?: MessageType;
  priority?: MessagePriority;
  replyToId?: string;
  attachments?: MessageAttachment[];
  metadata?: Record<string, any>;
  isEncrypted?: boolean;
}

export interface ConversationHeaderProps {
  conversation: Conversation;
  onBack: () => void;
  onMenuPress: () => void;
  onSearchPress: () => void;
  onCallPress: () => void;
}

export interface MessageSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  onClear: () => void;
  isLoading?: boolean;
}

export interface PollCreatorProps {
  conversationId: string;
  onPollCreated: (poll: Poll) => void;
  onCancel: () => void;
}

export interface FileUploaderProps {
  conversationId: string;
  onFileUploaded: (attachment: MessageAttachment) => void;
  onUploadError: (error: string) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
}

export interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  visible: boolean;
}

export interface MessageReactionsProps {
  message: Message;
  onReactionAdd: (reaction: string) => void;
  onReactionRemove: (reaction: string) => void;
}

export interface ConversationSettingsProps {
  conversation: Conversation;
  onSettingsUpdate: (settings: ConversationSettings) => void;
  onClose: () => void;
}

export interface ConversationSettings {
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
  encryption: boolean;
  readReceipts: boolean;
  typingIndicators: boolean;
  autoArchive: boolean;
  theme: 'light' | 'dark' | 'auto';
}

// Hook Return Types
export interface UseMessagingReturn {
  messages: Message[];
  conversations: Conversation[];
  currentConversation: Conversation | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, options?: MessageSendOptions) => Promise<void>;
  createConversation: (data: Partial<Conversation>) => Promise<Conversation>;
  markAsRead: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  searchMessages: (query: string, filters?: SearchFilters) => Promise<Message[]>;
  loadMoreMessages: () => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
  isConnected: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}

// State Management Types
export interface MessagingState {
  messages: Record<string, Message[]>;
  conversations: Conversation[];
  currentConversationId: string | null;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, Set<string>>;
  userStatuses: Record<string, UserStatus>;
  isLoading: boolean;
  error: string | null;
  searchResults: Message[];
  isSearching: boolean;
}

export interface MessagingActions {
  setMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  removeMessage: (conversationId: string, messageId: string) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  removeConversation: (conversationId: string) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  addTypingUser: (conversationId: string, userId: string) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  setUserStatus: (userId: string, status: UserStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchResults: (results: Message[]) => void;
  setSearching: (searching: boolean) => void;
} 
