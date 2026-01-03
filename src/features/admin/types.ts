export type AdminSection = 
  | 'overview' 
  | 'users' 
  | 'academic' 
  | 'finance' 
  | 'resources' 
  | 'communication' 
  | 'system'
  | 'monitoring';

export interface AdminMetrics {
  totalUsers: number;
  activeUsers: number;
  totalSchools: number;
  totalClasses: number;
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalRevenue: number;
  totalExpenses: number;
  systemHealth: number;
  criticalIssues: number;
  pendingApprovals: number;
  upcomingEvents: number;
  unreadMessages: number;
  lowStockItems: number;
  pendingPayments: number;
  systemUptime: number;
  lastBackup: string;
}

export interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  isRead: boolean;
  actionRequired: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'pending';
}

export interface UserData {
  users: any[];
  pendingApprovals: number;
  activeUsers: number;
  inactiveUsers: number;
  userStats: {
    byRole: Record<string, number>;
    byStatus: Record<string, number>;
    bySchool: Record<string, number>;
  };
  recentActivity: ActivityLog[];
}

export interface AcademicData {
  classes: any[];
  subjects: any[];
  grades: any[];
  examTimetables: any[];
  upcomingExams: number;
  totalStudents: number;
  totalTeachers: number;
  academicStats: {
    averageGrade: number;
    attendanceRate: number;
    completionRate: number;
  };
}

export interface FinancialData {
  payments: any[];
  refunds: any[];
  installments: any[];
  expenses: any[];
  incomes: any[];
  budgets: any[];
  pendingPayments: number;
  totalRevenue: number;
  totalExpenses: number;
  financialStats: {
    monthlyRevenue: number[];
    monthlyExpenses: number[];
    paymentMethods: Record<string, number>;
  };
}

export interface ResourceData {
  library: any[];
  hostel: any[];
  transport: any[];
  equipment: any[];
  inventory: any[];
  suppliers: any[];
  purchaseOrders: any[];
  lowStockItems: number;
  resourceStats: {
    libraryBooks: number;
    hostelOccupancy: number;
    transportRoutes: number;
    equipmentStatus: Record<string, number>;
  };
}

export interface CommunicationData {
  messages: any[];
  notices: any[];
  events: any[];
  announcements: any[];
  unreadMessages: number;
  communicationStats: {
    totalMessages: number;
    totalNotices: number;
    totalEvents: number;
    responseRate: number;
  };
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkUsage: number;
  uptime: number;
  criticalIssues: number;
  warnings: number;
  lastBackup: string;
  systemVersion: string;
  databaseStatus: 'healthy' | 'warning' | 'error';
  cacheStatus: 'healthy' | 'warning' | 'error';
  apiStatus: 'healthy' | 'warning' | 'error';
}

export interface AdminAnalytics {
  overview: AdminMetrics;
  trends: {
    userGrowth: number[];
    revenueGrowth: number[];
    systemPerformance: number[];
  };
  charts: {
    userDistribution: any;
    revenueBreakdown: any;
    systemHealth: any;
  };
}

export interface FilterOptions {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
  role?: string[];
  school?: string[];
  category?: string[];
  priority?: string[];
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
  includeData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface BulkAction {
  action: 'activate' | 'deactivate' | 'delete' | 'export' | 'import';
  items: string[];
  options?: any;
}

export interface SearchResult {
  id: string;
  type: string;
  title: string;
  description: string;
  url: string;
  relevance: number;
} 
