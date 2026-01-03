// Customer Types for React + Vite Application

export interface Customer {
  id: string | number;
  name: string;
  serialNumber?: string;
  email?: string;
  phone: string;
  mobile?: string;
  address?: string;
  street?: string;
  city?: string;
  country?: string;
  purpose?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY' | 'Male' | 'Female';
  source?: string;
  remark?: string;
  remarks?: string;
  department?: string;
  postal_code?: string;
  occupation?: string;
  company?: string;
  website?: string;
  tags?: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  stage?: string;
  value?: number;
  lead_score?: number;
  refered_to?: string;
  referredTo: 'OWNER' | 'ADMIN' | 'FINANCE' | 'ACADEMIC' | 'SUPPORT' | 'OTHER';
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
  type: 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'PROSPECT' | 'ALUMNI' | 'Student' | 'Parent' | 'Teacher';
  pipelineStageId?: number;
  // Legacy fields for backward compatibility
  firstName?: string;
  lastName?: string;
  status?: string;
  lastContact?: string;
  assignedTo?: string;
  notes?: string;
  lastActivity?: string;
}

export interface CustomerResponse {
  success: boolean;
  data: Customer | Customer[] | null;
  message: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface CustomerFilters {
  search?: string;
  type?: string;
  priority?: string;
  source?: string;
  city?: string;
  purpose?: string;
  gender?: string;
  minValue?: number;
  maxValue?: number;
  page?: number;
  limit?: number;
}

export interface CustomerPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CustomerAnalytics {
  totalCustomers: number;
  categories: CustomerCategory[];
  totalValue: number;
  averageValue: number;
  conversionRate: number;
  topSources: Array<{ source: string; count: number; percentage: number }>;
  topCities: Array<{ city: string; count: number; percentage: number }>;
  priorityBreakdown: Array<{ priority: string; count: number; percentage: number }>;
  typeBreakdown: Array<{ type: string; count: number; percentage: number }>;
  genderBreakdown: Array<{ gender: string; count: number; percentage: number }>;
  purposeBreakdown: Array<{ purpose: string; count: number; percentage: number }>;
}

export interface CustomerCategory {
  name: string;
  count: number;
  percentage: number;
  customers: Customer[];
}

export interface CustomerEvent {
  id: number;
  customerId: number;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface CustomerConversionAnalytics {
  period: string;
  totalConversions: number;
  conversionRate: number;
  averageConversionTime: number;
  topConvertingSources: Array<{ source: string; conversions: number; rate: number }>;
  conversionTrends: Array<{ date: string; conversions: number }>;
}

export interface CustomerConversionStats {
  totalCustomers: number;
  convertedCustomers: number;
  conversionRate: number;
  averageConversionValue: number;
  topConvertingTypes: Array<{ type: string; count: number; rate: number }>;
}

// Form data interfaces
export interface CustomerFormData {
  name: string;
  phone: string;
  email?: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  type: 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'PROSPECT' | 'ALUMNI' | 'Student' | 'Parent' | 'Teacher';
  purpose?: string;
  department?: string;
  source?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  referredTo: 'OWNER' | 'ADMIN' | 'FINANCE' | 'ACADEMIC' | 'SUPPORT' | 'OTHER';
  remarks?: string;
  address?: string;
  city?: string;
  country?: string;
  company?: string;
  website?: string;
}

// API Response types
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

