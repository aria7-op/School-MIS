// Core Types for Parking Management System
export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParkingCard {
  id: string;
  cardNumber: string;
  cardType: CardType;
  status: CardStatus;
  assignedTo?: string; // User ID
  issuedAt: Date;
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  maxUsageCount?: number;
}

export interface ParkingSession {
  id: string;
  cardId: string;
  userId?: string;
  entryTime: Date;
  exitTime?: Date;
  duration?: number; // in minutes
  fee?: number;
  status: SessionStatus;
  entryGate: string;
  exitGate?: string;
  vehicleInfo?: VehicleInfo;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleInfo {
  licensePlate: string;
  make: string;
  model: string;
  color: string;
  year?: number;
}

export interface ParkingZone {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  hourlyRate: number;
  isActive: boolean;
  description?: string;
}

export interface ParkingGate {
  id: string;
  name: string;
  type: GateType;
  zoneId: string;
  isActive: boolean;
  location: string;
}

export interface Payment {
  id: string;
  sessionId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  uuid?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  entityType?: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  requestMethod?: string;
  requestPath?: string;
  requestUrl?: string;
  responseStatus?: number;
  responseTimeMs?: number;
  isSuccess?: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  changes?: Record<string, { from: unknown; to: unknown }>;
  summary?: string;
  timestamp: Date | string;
}

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  OPERATOR = 'OPERATOR',
  VIEWER = 'VIEWER'
}

export enum Permission {
  // User Management
  CREATE_USER = 'CREATE_USER',
  READ_USER = 'READ_USER',
  UPDATE_USER = 'UPDATE_USER',
  DELETE_USER = 'DELETE_USER',
  
  // Card Management
  CREATE_CARD = 'CREATE_CARD',
  READ_CARD = 'READ_CARD',
  UPDATE_CARD = 'UPDATE_CARD',
  DELETE_CARD = 'DELETE_CARD',
  ASSIGN_CARD = 'ASSIGN_CARD',
  
  // Session Management
  CREATE_SESSION = 'CREATE_SESSION',
  READ_SESSION = 'READ_SESSION',
  UPDATE_SESSION = 'UPDATE_SESSION',
  DELETE_SESSION = 'DELETE_SESSION',
  
  // Zone Management
  CREATE_ZONE = 'CREATE_ZONE',
  READ_ZONE = 'READ_ZONE',
  UPDATE_ZONE = 'UPDATE_ZONE',
  DELETE_ZONE = 'DELETE_ZONE',
  
  // Gate Management
  CREATE_GATE = 'CREATE_GATE',
  READ_GATE = 'READ_GATE',
  UPDATE_GATE = 'UPDATE_GATE',
  DELETE_GATE = 'DELETE_GATE',
  
  // Payment Management
  CREATE_PAYMENT = 'CREATE_PAYMENT',
  READ_PAYMENT = 'READ_PAYMENT',
  UPDATE_PAYMENT = 'UPDATE_PAYMENT',
  DELETE_PAYMENT = 'DELETE_PAYMENT',
  
  // Reports & Analytics
  VIEW_REPORTS = 'VIEW_REPORTS',
  EXPORT_DATA = 'EXPORT_DATA',
  
  // System Management
  MANAGE_SYSTEM = 'MANAGE_SYSTEM',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS'
}

export enum CardType {
  REGULAR = 'REGULAR',
  VIP = 'VIP',
  TEMPORARY = 'TEMPORARY',
  STAFF = 'STAFF'
}

export enum CardStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED',
  LOST = 'LOST'
}

export enum SessionStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  OVERDUE = 'OVERDUE'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER'
}

export enum GateType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  BOTH = 'BOTH'
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface CreateUserForm {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  password: string;
  confirmPassword: string;
}

export interface CreateCardForm {
  cardNumber: string;
  cardType: CardType;
  assignedTo?: string;
  expiresAt?: Date;
  maxUsageCount?: number;
}

// State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: Permission[];
}

export interface AppState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Notification[];
  globalLoading: boolean;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 