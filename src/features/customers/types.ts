// Customer types for the comprehensive CRM system
export interface Customer {
  id: number;
  name: string;
  serialNumber: string;
  purpose?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  phone?: string;
  source?: string;
  remark?: string;
  added_by?: number;
  department?: string;
  status?: 'active' | 'inactive';
  email?: string;
  address?: string;
  street?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  company?: string;
  position?: string;
  occupation?: string;
  website?: string;
  tags?: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  stage?: string;
  value?: number;
  lead_score?: number;
  refered_to?: string;
  referredTo?: string;
  referredById?: number;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  last_contact?: string;
  next_follow_up?: string;
  ownerId?: number;
  schoolId?: number;
  createdBy?: number;
  updatedBy?: number;
  userId?: number;
  totalSpent?: number;
  orderCount?: number;
  type?: 'STUDENT' | 'PARENT' | 'TEACHER' | 'STAFF' | 'PROSPECT' | 'ALUMNI';
  pipelineStageId?: number;
}

export interface CustomerFilters {
  status?: string;
  gender?: string;
  department?: string;
  source?: string;
  stage?: string;
  priority?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  valueRange?: {
    min: number;
    max: number;
  };
}

// Navigation types
export type RootStackParamList = {
  Customers: undefined;
  AddCustomer: undefined;
  EditCustomer: { customerId: number };
  CustomerDetail: { customerId: number };
  // Add other screens here
};

// This helps with type checking and IntelliSense
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
