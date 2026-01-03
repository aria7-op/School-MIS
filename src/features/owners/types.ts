export interface Owner {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  timezone: string;
  locale: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  metadata?: {
    department?: string;
    location?: string;
    preferences?: {
      theme?: string;
      notifications?: boolean;
    };
  };
  _count?: {
    schools?: number;
    createdUsers?: number;
  };
}

export interface LoginResponse {
  success: boolean;
  data: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    owner: Owner;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    distribution: Record<string, number>;
  };
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

export interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  userInfo: Owner | null;
  refreshToken: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (ownerData: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'> & { password: string }) => Promise<{ success: boolean; data?: any; error?: string }>;
  isLoggedIn: () => Promise<void>;
  checkStoredTokens: () => Promise<{ storedToken: string | null; storedRefreshToken: string | null }>;
}
