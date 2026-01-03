// Parent Portal Types
export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section: string;
  rollNumber: string;
  attendance: number;
  averageGrade: number;
  recentActivity: string;
  photo?: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  phoneNumber: string;
  bloodGroup: string;
  enrollmentDate: string;
  status: string;
  subjects: string[];
  teacherName: string;
  teacherEmail: string;
  teacherPhone: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  inTime?: string;
  outTime?: string;
  remarks?: string;
  subject?: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
  currentStreak: number;
  longestStreak: number;
}

export interface GradeRecord {
  id: string;
  subject: string;
  assignment: string;
  grade: number;
  maxGrade: number;
  percentage: number;
  date: string;
  remarks?: string;
}

export interface SubjectProgress {
  subject: string;
  averageGrade: number;
  totalAssignments: number;
  completedAssignments: number;
  trend: 'up' | 'down' | 'stable';
  lastGrade?: number;
}

export interface AssignmentRecord {
  id: string;
  title: string;
  description: string;
  subject: string;
  dueDate: string;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'OVERDUE';
  grade?: number;
  maxGrade?: number;
  submittedAt?: string;
}

export interface ExamRecord {
  id: string;
  title: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  grade?: number;
  maxGrade?: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export interface FeeRecord {
  id: string;
  type: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIAL' | 'COMPLETED';
  paidAmount: number;
  paidDate?: string;
  paymentMethod?: string;
  description?: string;
  feeType?: string;
  feeDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Enhanced financial types
export interface FinancialSummary {
  student: {
    id: string;
    name: string;
    class: string;
    classCode: string;
  };
  summary: {
    totalFees: number;
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    outstandingAmount: number;
    paymentPercentage: number;
  };
  feeStructure: FeeStructureItem[];
  recentPayments: PaymentRecord[];
  upcomingPayments: UpcomingPayment[];
}

export interface FeeStructureItem {
  id: string;
  type: string;
  description: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  dueDate: string;
  description: string;
}

export interface UpcomingPayment {
  id: string;
  amount: number;
  dueDate: string;
  description: string;
}

export interface FeeStructure {
  student: {
    id: string;
    name: string;
    class: string;
    classCode: string;
  };
  totalFees: number;
  feesByCategory: Record<string, FeeCategoryItem[]>;
  academicYear: number;
}

export interface FeeCategoryItem {
  id: string;
  name: string;
  description: string;
  amount: number;
  dueDate: string;
  isRecurring: boolean;
  isOptional: boolean;
}

export interface FinancialAnalytics {
  period: string;
  summary: {
    totalPaid: number;
    totalPending: number;
    totalOverdue: number;
    totalTransactions: number;
  };
  trends: {
    monthly: MonthlyTrend[];
  };
  paymentMethods: PaymentMethodBreakdown[];
}

export interface MonthlyTrend {
  month: string;
  paid: number;
  pending: number;
  overdue: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  count: number;
  total: number;
  percentage: number;
}

export interface ParentDashboardData {
  totalChildren: number;
  totalNotifications: number;
  unreadNotifications: number;
  upcomingEvents: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  quickStats: {
    averageAttendance: number;
    averageGrade: number;
    pendingFees: number;
    upcomingExams: number;
  };
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

export interface ParentSettings {
  id: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    showProfile: boolean;
    showContact: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    dateFormat: string;
  };
}

export type TabType = 'dashboard' | 'attendance' | 'academics' | 'assignments' | 'fees' | 'exams' | 'overview' | 'messages' | 'settings' | 'profile' | 'suggestions';

export interface ParentPortalProps {
  childrenData?: Child[];
  notificationsData?: Notification[];
  dashboardData?: ParentDashboardData;
}

export interface ParentPortalState {
  activeTab: TabType;
  selectedStudent: string | null;
  children: Child[];
  notifications: Notification[];
  dashboardData: ParentDashboardData | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}