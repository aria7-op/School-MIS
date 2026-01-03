export interface Parent {
  id: string;
  uuid: string;
  userId: string;
  occupation?: string;
  annualIncome?: string;
  education?: string;
  schoolId: string;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  user: ParentUser;
  students?: Student[];
}

export interface ParentUser {
  id: string;
  uuid: string;
  username: string;
  email: string;
  phone?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName?: string;
  gender?: string;
  birthDate?: string;
  avatar?: string;
  status: string;
}

export interface Student {
  id: string;
  uuid: string;
  user: {
    id: string;
    uuid: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    status: string;
  };
  class?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

export interface ParentFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ParentStats {
  totalParents: number;
  activeParents: number;
}

export interface ParentsResponse {
  success: boolean;
  message: string;
  data: Parent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ParentResponse {
  success: boolean;
  message: string;
  data: Parent;
}

export interface ParentStudentsResponse {
  success: boolean;
  message: string;
  data: Student[];
}

export interface ParentStatsResponse {
  success: boolean;
  message: string;
  data: ParentStats;
}

export interface CreateParentData {
  userId: string;
  occupation?: string;
  annualIncome?: string;
  education?: string;
}

export interface UpdateParentData {
  occupation?: string;
  annualIncome?: string;
  education?: string;
}

export interface ApiError {
  message: string;
  status?: number;
} 