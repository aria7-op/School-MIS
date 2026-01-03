// Customer types for the comprehensive CRM system - completely dynamic based on backend schema
export interface Customer {
  // Core fields from Prisma schema
  id: number;
  uuid?: string;
  name: string;
  serialNumber?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  gender?: string;
  source?: string;
  purpose?: string;
  department?: string;
  referredTo?: string;
  refered_to?: string;
  referredById?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  ownerId?: number;
  schoolId?: number;
  createdBy?: number;
  updatedBy?: number;
  userId?: number;
  totalSpent?: number;
  orderCount?: number;
  type?: string;
  pipelineStageId?: number;
  remark?: string;
  priority?: string;

  // Extended fields for enhanced functionality
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CONVERTED' | 'LOST' | 'CHURNED';
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  company?: string;
  position?: string;
  occupation?: string;
  website?: string;
  tags?: string[];
  value?: number;
  leadScore?: number;
  stage?: string;
  lastContact?: string;
  nextFollowUp?: string;
  totalInteractions?: number;
  conversionDate?: string;
  assignedTo?: number;
  sourceDetails?: any;

  // Relationship fields
  referredBy?: Customer;
  referrals?: Customer[];
  owner?: any;
  school?: any;
  createdByUser?: any;
  updatedByUser?: any;
  pipelineStage?: CustomerPipelineStage;
  payments?: any[];
  documents?: any[];
  auditLogs?: any[];
  events?: CustomerEvent[];
  convertedStudents?: any[];
}

export interface CustomerPipelineStage {
  id: number;
  uuid: string;
  name: string;
  order: number;
  description?: string;
  color?: string;
  schoolId: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  school?: any;
  customers?: Customer[];
}

export interface CustomerEvent {
  id: number;
  uuid: string;
  customerId: number;
  eventType: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  severity: string;
  schoolId: number;
  createdBy?: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  school?: any;
  createdByUser?: any;
}

export interface CustomerFilters {
  // Basic filters
  status?: string;
  gender?: string;
  department?: string;
  source?: string;
  stage?: string;
  priority?: string;
  type?: string;
  
  // Advanced filters
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  valueRange?: {
    min: number;
    max: number;
  };
  leadScoreRange?: {
    min: number;
    max: number;
  };
  pipelineStageId?: number;
  ownerId?: number;
  schoolId?: number;
  createdBy?: number;
  
  // Search filters
  search?: string;
  email?: string;
  phone?: string;
  serialNumber?: string;
  
  // Metadata filters
  metadata?: Record<string, any>;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  activeCustomers: number;
  convertedCustomers: number;
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  leadScoreDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  stageDistribution: Record<string, number>;
  monthlyGrowth: Record<string, number>;
  topCustomers: Customer[];
  recentConversions: Customer[];
}

export interface CustomerBulkOperation {
  operationId: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'EXPORT' | 'MERGE' | 'DUPLICATE' | 'ASSIGN' | 'TAG';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  totalItems: number;
  processedItems: number;
  successItems: number;
  failedItems: number;
  errors?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerImportTemplate {
  fields: string[];
  requiredFields: string[];
  optionalFields: string[];
  sampleData: Record<string, any>[];
  validationRules: Record<string, any>;
}

export interface CustomerExportFormat {
  format: 'CSV' | 'EXCEL' | 'PDF' | 'JSON';
  fields: string[];
  filters?: CustomerFilters;
  includeRelations?: boolean;
}

// Navigation types
export type RootStackParamList = {
  Customers: undefined;
  AddCustomer: undefined;
  EditCustomer: { customerId: number };
  CustomerDetail: { customerId: number };
  CustomerAnalytics: undefined;
  CustomerSegments: undefined;
  CustomerPipeline: undefined;
  CustomerImport: undefined;
  CustomerExport: undefined;
  CustomerBulkOperations: undefined;
  CustomerSettings: undefined;
};

// This helps with type checking and IntelliSense
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
