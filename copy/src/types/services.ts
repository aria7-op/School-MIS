// Service types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceError {
  message: string;
  code: string;
  details?: any;
}
