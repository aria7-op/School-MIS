// src/screens/models.ts
export interface Customer {
  id?: number;
  uuid?: string;
  serial_number?: string;
  name: string;
  purpose: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  mobile: string;
  email?: string;
  source: string;
  remark?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CONVERTED' | 'LOST' | 'CHURNED';
  department: string;
  address?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  date_of_birth?: Date;
  occupation?: string;
  company?: string;
  website?: string;
  social_media?: any;
  preferences?: any;
  tags?: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lead_score?: number;
  stage: 'LEAD' | 'PROSPECT' | 'CUSTOMER' | 'CHURNED';
  value?: number;
  last_contact?: Date;
  next_follow_up?: Date;
  total_interactions?: number;
  total_value?: number;
  conversion_date?: Date;
  assigned_to?: number;
  source_details?: any;
  metadata?: any;
  schoolId?: number;
  added_by?: number;
  refered_to?: number;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

// Legacy interface for backward compatibility
export interface LegacyCustomer {
  id?: number;
  name: string;
  purpose: string;
  gender: 'male' | 'female' | 'other';
  mobile: string;
  source: string;
  remark: string;
  added_by: number;
  department: string;
  status: 'active' | 'inactive';
}
