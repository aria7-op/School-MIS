import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
// Web-only build: remove react-native and async-storage
import { ensureCsrfToken, setCsrfToken, readCsrfTokenFromCookie } from '../utils/csrf';
import { sanitizeObject } from '../utils/sanitize';

// ============================================================================
// SECURE API SERVICE - CENTRALIZED API COMMUNICATION
// ============================================================================

// Types
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

export interface AccessTokenResponse {
  token: string;
  expiresAt: string;
  permissions: any;
  dataScopes: string[];
  // User data fields
  id?: string;
  userId?: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  userRole?: string;
  schoolId?: string;
  department?: string;
  lastLogin?: string;
  isActive?: boolean;
  status?: string;
  accessToken?: string;
  jwt?: string;
  metadata?: {
    permissions?: any;
    dataScopes?: string[];
    department?: string;
  };
  school?: {
    id?: string;
  };
}

export interface AccessCheckResponse {
  allowed: boolean;
  reason?: string;
  conditions?: any;
  context?: any;
}

const resolveConfigValue = (keys: string[], errorMessage: string): string => {
  const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : undefined;
  for (const key of keys) {
    const candidate = metaEnv?.[key];
    if (typeof candidate === 'string' && candidate.trim() !== '') {
      return candidate;
    }
  }

  if (typeof globalThis !== 'undefined' && 'process' in globalThis) {
    const processEnv = (globalThis as any).process?.env;
    for (const key of keys) {
      const candidate = processEnv?.[key];
      if (typeof candidate === 'string' && candidate.trim() !== '') {
        return candidate;
      }
    }
  }

  throw new Error(errorMessage);
};

// Encryption Configuration (support multiple env keys)
const API_BASE_URL = resolveConfigValue(
  ['VITE_API_URL', 'API_BASE_URL', 'REACT_APP_API_URL'],
  'Missing API base URL environment variable (set VITE_API_URL)'
);
const MANAGED_CONTEXT_STORAGE_KEY = 'managedContext';

export interface ManagedContextState {
  schoolId: string | null;
  branchId: string | null;
  courseId: string | null;
}

// Encryption Utilities
class EncryptionService {
  static encryptRequest(): null {
    return null;
  }

  static decryptResponse<T>(response: T): T {
    return response;
  }
}

// Token Management
class TokenManager {
  static async getAuthToken(): Promise<string | null> {
    try {
      return localStorage.getItem('userToken');
    } catch (error) {
      return null;
    }
  }

  static async setAuthToken(token: string): Promise<void> {
    try {
      localStorage.setItem('userToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  static async removeAuthToken(): Promise<void> {
    try {
      localStorage.removeItem('userToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  static isJWTTokenValid(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      if (!token || token.trim() === '') return false;
      if (token.length < 50) return false;
      
      // Check if token is expired
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = typeof atob === 'function' ? atob(padded) : window.atob(padded);
      const payload = JSON.parse(json);
      
      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return true;
      
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      const json = typeof atob === 'function' ? atob(padded) : window.atob(padded);
      const payload = JSON.parse(json);
      
      // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
      return payload.exp && payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }
}

// Main Secure API Service
class SecureApiService {
  private api: AxiosInstance;
  private tokenRefreshPromise: Promise<string> | null = null;
  private managedContext: ManagedContextState | null = null;
  
  // Retry configuration for slow internet
  private readonly MAX_RETRIES = 5;
  private readonly INITIAL_RETRY_DELAY = 2000; // 2 seconds
  private readonly MAX_RETRY_DELAY = 30000; // 30 seconds

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      // 30 second timeout to match backend
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      // Additional axios optimizations for slow networks
      maxRedirects: 3,
      maxContentLength: 50 * 1024 * 1024, // 50MB max response size
      maxBodyLength: 10 * 1024 * 1024, // 10MB max request size
      // Enable compression
      decompress: true,
      // Retry configuration for network issues
      validateStatus: (status) => {
        // Accept all status codes, handle errors manually for better retry logic
        return status >= 200 && status < 600;
      },
    });

    this.setupInterceptors();
    this.loadManagedContextFromStorage();
  }

  private normalizeContextValue(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
        return null;
      }
      return trimmed;
    }
    try {
      return String(value);
    } catch (error) {
      return null;
    }
  }

  private isDemoUser(): boolean {
    try {
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const user = JSON.parse(userJson);
        return user?.username === 'demo.teacher';
      }
    } catch (error) {
      // Silently fail - user is not demo user
    }
    return false;
  }

  private throwDemoUserError(): never {
    const error = new Error('Demo user cannot access this resource');
    (error as any).isDemoUserError = true;
    throw error;
  }

  private loadManagedContextFromStorage(): ManagedContextState {
    if (this.managedContext) {
      return this.managedContext;
    }
    try {
      const stored = localStorage.getItem(MANAGED_CONTEXT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.managedContext = {
          schoolId: this.normalizeContextValue(parsed?.schoolId),
          branchId: this.normalizeContextValue(parsed?.branchId),
          courseId: this.normalizeContextValue(parsed?.courseId),
        };
      } else {
        this.managedContext = {
          schoolId: null,
          branchId: null,
          courseId: null,
        };
      }
    } catch (error) {
      this.managedContext = {
        schoolId: null,
        branchId: null,
        courseId: null,
      };
    }
    return this.managedContext;
  }

  private persistManagedContext(context: ManagedContextState | null): void {
    try {
      if (!context) {
        localStorage.removeItem(MANAGED_CONTEXT_STORAGE_KEY);
        this.managedContext = {
          schoolId: null,
          branchId: null,
          courseId: null,
        };
        return;
      }
      localStorage.setItem(
        MANAGED_CONTEXT_STORAGE_KEY,
        JSON.stringify({
          schoolId: context.schoolId,
          branchId: context.branchId,
          courseId: context.courseId,
        }),
      );
      this.managedContext = context;
    } catch (error) {
      console.error('Failed to persist managed context:', error);
    }
  }

  public setManagedContext(context: Partial<ManagedContextState> | null): void {
    if (!context) {
      this.persistManagedContext({
        schoolId: null,
        branchId: null,
        courseId: null,
      });
      return;
    }
    const normalized: ManagedContextState = {
      schoolId: this.normalizeContextValue(context.schoolId) ?? null,
      branchId: this.normalizeContextValue(context.branchId) ?? null,
      courseId: this.normalizeContextValue(context.courseId) ?? null,
    };
    this.persistManagedContext(normalized);
  }

  public clearManagedContext(): void {
    this.persistManagedContext({
      schoolId: null,
      branchId: null,
      courseId: null,
    });
  }

  public getManagedContext(): ManagedContextState {
    return this.loadManagedContextFromStorage();
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        if (config.method === 'OPTIONS') {
          return config;
        }

        const token = await TokenManager.getAuthToken();
        
        if (token && TokenManager.isJWTTokenValid(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (token && TokenManager.isTokenExpired(token)) {
          // Token is expired, dispatch session expired event
          window.dispatchEvent(new CustomEvent('sessionExpired'));
          return Promise.reject(new Error('Token expired'));
        }

        // Add security headers (web only)
        config.headers['X-Device-Type'] = 'web';
        config.headers['X-Client-Version'] = '1.0.0';
        config.headers['X-Request-Timestamp'] = new Date().toISOString();
        config.headers['X-Request-ID'] = this.generateRequestId();

        const context = this.getManagedContext();
        if (context?.schoolId) {
          config.headers['X-Managed-School-Id'] = context.schoolId;
        } else {
          delete config.headers['X-Managed-School-Id'];
        }

        if (context?.branchId) {
          config.headers['X-Managed-Branch-Id'] = context.branchId;
        } else {
          delete config.headers['X-Managed-Branch-Id'];
        }

        if (context?.courseId) {
          config.headers['X-Managed-Course-Id'] = context.courseId;
        } else {
          delete config.headers['X-Managed-Course-Id'];
        }

        let csrfToken = readCsrfTokenFromCookie();
        if (!csrfToken) {
          csrfToken = await ensureCsrfToken();
        }
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        } else {
          console.warn('⚠️ Unable to resolve CSRF token before request:', {
            url: config.url,
            method: config.method,
          });
        }

        // IMPORTANT: Don't set Content-Type for FormData - let browser set it with boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => {
        // Decrypt response if needed
        if (response.data && response.data.encrypted) {
          response.data = EncryptionService.decryptResponse(response.data);
        }
        const headerToken = response.headers?.['x-csrf-token'];
        if (typeof headerToken === 'string' && headerToken.trim() !== '') {
          setCsrfToken(headerToken);
        } else if (response.data?.csrfToken) {
          setCsrfToken(response.data.csrfToken);
        } else {
          setCsrfToken(readCsrfTokenFromCookie());
        }
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          await TokenManager.removeAuthToken();
          window.dispatchEvent(new CustomEvent('sessionExpired'));
        }
        const headerToken = error.response?.headers?.['x-csrf-token'];
        if (typeof headerToken === 'string' && headerToken.trim() !== '') {
          setCsrfToken(headerToken);
        } else {
          setCsrfToken(readCsrfTokenFromCookie());
        }
        return Promise.reject(error);
      }
    );
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper method to detect if error is retryable
  private isRetryableError(error: any): boolean {
    if (!error.response) {
      // Network errors, timeouts, connection refused, etc.
      return true;
    }
    
    const status = error.response.status;
    // Retry on server errors, rate limiting, and temporary failures
    return status >= 500 || status === 429 || status === 408 || status === 502 || status === 503 || status === 504;
  }

  // Helper method to calculate retry delay with exponential backoff
  private calculateRetryDelay(attempt: number): number {
    const delay = this.INITIAL_RETRY_DELAY * Math.pow(2, attempt);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 1000;
    return Math.min(delay + jitter, this.MAX_RETRY_DELAY);
  }

  // Helper method to wait for specified duration
  private async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Enhanced request method with retry logic
  private async makeRequestWithRetry<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    operation: string,
    url: string
  ): Promise<AxiosResponse<T>> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await requestFn();
        
        // Check if response indicates server error despite 2xx status
        if (response.status >= 500) {
          throw new Error(`Server error: ${response.status}`);
        }
        
        return response;
        
      } catch (error: any) {
        lastError = error;
        
        // Log the error details
        const errorMsg = error.code === 'ECONNABORTED' 
          ? 'Request timeout' 
          : error.message || 'Unknown error';
        
        // Don't retry if it's the last attempt or error is not retryable
        if (attempt === this.MAX_RETRIES || !this.isRetryableError(error)) {
          break;
        }
        
        // Calculate delay and wait before retry
        const delay = this.calculateRetryDelay(attempt);
        await this.wait(delay);
      }
    }
    
    // All retries failed
    throw lastError;
  }

  // Add encryption verification logging
  private logEncryptionStatus(method: string, url: string, data?: any) {
    // Logging disabled for production
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Block all GET requests for demo.teacher except allowed endpoints
    if (this.isDemoUser()) {
      const allowedEndpoints = ['/auth/profile', '/auth/logout'];
      if (!allowedEndpoints.some(endpoint => url.includes(endpoint))) {
        console.log('🎭 Demo user blocked from GET:', url);
        this.throwDemoUserError();
      }
    }
    
    this.logEncryptionStatus('GET', url);
    
    const response = await this.makeRequestWithRetry(
      () => this.api.get<ApiResponse<T>>(url, { 
        ...config, 
        timeout: 30000 // 30 seconds to match backend
      }),
      'GET',
      url
    );

    return response.data as ApiResponse<T>;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Block all POST requests for demo.teacher except allowed endpoints
    if (this.isDemoUser()) {
      const allowedEndpoints = ['/users/login', '/auth/logout'];
      if (!allowedEndpoints.some(endpoint => url.includes(endpoint))) {
        console.log('🎭 Demo user blocked from POST:', url);
        this.throwDemoUserError();
      }
    }
    
    // Sanitize data before sending (skip FormData and File objects)
    let sanitizedData = data;
    if (data && !(data instanceof FormData) && !(data instanceof File) && typeof data === 'object') {
      sanitizedData = sanitizeObject(data);
    }
    
    this.logEncryptionStatus('POST', url, sanitizedData);

    const response = await this.makeRequestWithRetry(
      () => this.api.post<ApiResponse<T>>(url, sanitizedData, {
        ...config,
        timeout: 90000, // Increased to 90s for slow connections
      }),
      'POST',
      url
    );

    return response.data as ApiResponse<T>;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Block all PUT requests for demo.teacher
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from PUT:', url);
      this.throwDemoUserError();
    }
    
    // Sanitize data before sending (skip FormData and File objects)
    let sanitizedData = data;
    if (data && !(data instanceof FormData) && !(data instanceof File) && typeof data === 'object') {
      sanitizedData = sanitizeObject(data);
    }
    
    this.logEncryptionStatus('PUT', url, sanitizedData);

    const response = await this.makeRequestWithRetry(
      () => this.api.put<ApiResponse<T>>(url, sanitizedData, {
        ...config,
        timeout: 90000, // Increased to 90s for slow connections
      }),
      'PUT',
      url
    );

    return response.data as ApiResponse<T>;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Block all PATCH requests for demo.teacher
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from PATCH:', url);
      this.throwDemoUserError();
    }
    
    // Sanitize data before sending (skip FormData and File objects)
    let sanitizedData = data;
    if (data && !(data instanceof FormData) && !(data instanceof File) && typeof data === 'object') {
      sanitizedData = sanitizeObject(data);
    }
    
    this.logEncryptionStatus('PATCH', url, sanitizedData);

    const response = await this.makeRequestWithRetry(
      () => this.api.patch<ApiResponse<T>>(url, sanitizedData, {
        ...config,
        timeout: 90000, // Increased to 90s for slow connections
      }),
      'PATCH',
      url
    );

    return response.data as ApiResponse<T>;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    // Block all DELETE requests for demo.teacher
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from DELETE:', url);
      this.throwDemoUserError();
    }
    
    this.logEncryptionStatus('DELETE', url);
    const response = await this.makeRequestWithRetry(
      () => this.api.delete<ApiResponse<T>>(url, {
        ...config,
        timeout: 30000 // 30 seconds to match backend
      }),
      'DELETE',
      url
    );

    return response.data as ApiResponse<T>;
  }

  // Authentication Methods
  async login(credentials: { username: string; password: string }): Promise<ApiResponse<AccessTokenResponse>> {
    // CRITICAL: Fetch CSRF token BEFORE login attempt
    await ensureCsrfToken();

    // Use the proper users login endpoint - bypass encryption for login
    this.logEncryptionStatus('POST (LOGIN)', '/users/login', credentials);

    // Send unencrypted data for login endpoint
    const response = await this.api.post<ApiResponse<AccessTokenResponse> | any>('/users/login', credentials, {
      timeout: 30000,
      withCredentials: true, // Ensure cookies are sent
    });

    const decryptedResponse = response.data as ApiResponse<AccessTokenResponse>;

    if (decryptedResponse?.success && decryptedResponse.data?.token) {
      await TokenManager.setAuthToken(decryptedResponse.data.token);
    }
    if ((decryptedResponse.data as any)?.csrfToken) {
      setCsrfToken((decryptedResponse.data as any).csrfToken);
    } else {
      setCsrfToken(readCsrfTokenFromCookie());
    }
    return {
      success: true,
      message: 'Login successful',
      data: decryptedResponse.data
    };
  }

  async logout(): Promise<ApiResponse<void>> {
    const response = await this.post<void>('/auth/logout');
    await TokenManager.removeAuthToken();
    if ((response as any)?.csrfToken) {
      setCsrfToken((response as any).csrfToken);
    } else {
      setCsrfToken(readCsrfTokenFromCookie());
    }
    return {
      success: true,
      message: 'Logout successful',
      data: undefined
    };
  }

  async refreshToken(): Promise<ApiResponse<AccessTokenResponse>> {
    const response = await this.post<AccessTokenResponse>('/auth/refresh');
    if (response.success && response.data?.token) {
      await TokenManager.setAuthToken(response.data.token);
    }
    return response;
  }

  async getProfile(): Promise<ApiResponse<any>> {
    return this.get<any>('/auth/profile');
  }

  // Token Management
  async getAccessToken(): Promise<string | null> {
    return TokenManager.getAuthToken();
  }

  async setAccessToken(token: string): Promise<void> {
    await TokenManager.setAuthToken(token);
  }

  async clearAccessToken(): Promise<void> {
    await TokenManager.removeAuthToken();
  }

  isTokenValid(): boolean {
    const token = localStorage.getItem('userToken');
    return token ? TokenManager.isJWTTokenValid(token) : false;
  }

  isTokenExpired(): boolean {
    const token = localStorage.getItem('userToken');
    return token ? TokenManager.isTokenExpired(token) : true;
  }

  // Health Check
  async testBackendConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.get('/health');
      return {
        success: true,
        message: 'Backend connection successful'
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Backend connection failed'
      };
    }
  }

  // RBAC Methods
  async fetchUserPermissions(userId: string): Promise<ApiResponse<any>> {
    return this.get(`/rbac/permissions/user/${userId}/effective`);
  }

  async fetchAllPermissions(): Promise<ApiResponse<any>> {
    return this.get('/rbac/permissions');
  }

  async fetchAllRoles(): Promise<ApiResponse<any>> {
    return this.get('/rbac/roles');
  }

  async checkAccess(resource: string, action: string, context?: any): Promise<ApiResponse<AccessCheckResponse>> {
    return this.post<AccessCheckResponse>('/rbac/access/check', { resource, action, context });
  }

  // ============================================================================
  // CUSTOMER API METHODS
  // ============================================================================

  // Core Customer CRUD
  async getCustomers(params?: any): Promise<ApiResponse<any>> {
    const response = await this.get('/customers', { params });
    return response;
  }

  async getCustomerById(id: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/customers/${id}`, { params });
  }

  async createCustomer(data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for customer creation
    this.logEncryptionStatus('POST (CUSTOMER CREATE)', '/customers', data);
    const response = await this.api.post<ApiResponse<any>>('/customers', data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Customer created successfully',
      data: response.data
    };
  }

  async updateCustomer(id: string, data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for customer update
    this.logEncryptionStatus('PUT (CUSTOMER UPDATE)', `/customers/${id}`, data);
    const response = await this.api.put<ApiResponse<any>>(`/customers/${id}`, data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Customer updated successfully',
      data: response.data
    };
  }

  async deleteCustomer(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/customers/${id}`);
  }

  // Customer Analytics
  async getCustomerAnalytics(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/analytics/dashboard', { params });
  }

  async getAnalyticsReports(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/analytics/reports', { params });
  }

  async getAnalyticsTrends(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/analytics/trends', { params });
  }

  async getForecastingAnalytics(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/analytics/forecasting', { params });
  }

  async exportAnalytics(data: any): Promise<ApiResponse<any>> {
    return this.post('/customers/analytics/export', data);
  }

  // Customer Documents
  async getCustomerDocuments(customerId: string): Promise<ApiResponse<any>> {
    return this.get(`/customers/${customerId}/documents`);
  }

  async uploadDocument(customerId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/customers/${customerId}/documents`, data);
  }

  async getDocumentAnalytics(): Promise<ApiResponse<any>> {
    return this.get('/customers/documents/analytics');
  }

  // Customer Tasks
  async getCustomerTasks(customerId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/customers/${customerId}/tasks`, { params });
  }

  async createTask(customerId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/customers/${customerId}/tasks`, data);
  }

  async getTaskDashboard(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/tasks/dashboard', { params });
  }

  // Customer Automations
  async getCustomerAutomations(customerId: string): Promise<ApiResponse<any>> {
    return this.get(`/customers/${customerId}/automations`);
  }

  async createAutomation(customerId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/customers/${customerId}/automations`, data);
  }

  async getAutomationTemplates(): Promise<ApiResponse<any>> {
    return this.get('/customers/automations/templates');
  }

  // Customer Collaborations
  async getCustomerCollaborations(customerId: string): Promise<ApiResponse<any>> {
    return this.get(`/customers/${customerId}/collaborations`);
  }

  async createCollaboration(customerId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/customers/${customerId}/collaborations`, data);
  }

  async getCollaborationFeed(): Promise<ApiResponse<any>> {
    return this.get('/customers/collaborations/feed');
  }

  // Customer Reports
  async getCustomerReports(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/reports', { params });
  }

  async getCustomerComparisons(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/reports/comparisons', { params });
  }

  async getCustomerDashboard(customerId: string): Promise<ApiResponse<any>> {
    return this.get(`/customers/${customerId}/dashboard`);
  }

  // Customer Suggestions
  async getCustomerSuggestions(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/suggestions', { params });
  }

  async getCustomerIdSuggestion(params?: any): Promise<ApiResponse<any>> {
    return this.get('/customers/suggestions/id', { params });
  }

  // Customer Search
  async advancedSearch(params?: any): Promise<ApiResponse<any>> {
    return this.post('/customers/search/advanced', params);
  }

  async getSearchSuggestions(query: string, limit?: number): Promise<ApiResponse<any>> {
    return this.get('/customers/search/suggestions', { 
      params: { q: query, limit } 
    });
  }

  async getAutocomplete(query: string, limit?: number): Promise<ApiResponse<any>> {
    return this.get('/customers/search/autocomplete', { 
      params: { q: query, limit } 
    });
  }

  async saveSearch(searchData: any): Promise<ApiResponse<any>> {
    return this.post('/customers/search/save', searchData);
  }

  async getSavedSearches(): Promise<ApiResponse<any>> {
    return this.get('/customers/search/saved');
  }

  async deleteSavedSearch(searchId: string): Promise<ApiResponse<any>> {
    return this.delete(`/customers/search/saved/${searchId}`);
  }

  async getAvailableFilters(): Promise<ApiResponse<any>> {
    return this.get('/customers/search/filters');
  }

  async createCustomFilter(filterData: any): Promise<ApiResponse<any>> {
    return this.post('/customers/search/filters', filterData);
  }

  // Partial update customer
  async partialUpdateCustomer(id: string, data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for customer partial update
    this.logEncryptionStatus('PATCH (CUSTOMER PARTIAL UPDATE)', `/customers/${id}`, data);
    const response = await this.api.patch<ApiResponse<any>>(`/customers/${id}`, data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Customer updated successfully',
      data: response.data
    };
  }

  // Customer Conversion
  async getCustomerConversionAnalytics(period: string): Promise<ApiResponse<any>> {
    return this.get(`/customers/conversion-analytics?period=${period}`);
  }

  async getCustomerConversionHistory(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    return this.get(`/customers/conversion-history?page=${page}&limit=${limit}`);
  }

  async getCustomerConversionRates(period: string): Promise<ApiResponse<any>> {
    return this.get(`/customers/conversion-rates?period=${period}`);
  }

  // Customer Conversion
  async convertCustomerToStudent(customerId: string, conversionData: any): Promise<ApiResponse<any>> {
    return this.post(`/customers/${customerId}/convert-to-student`, conversionData);
  }

  // ============================================================================
  // STUDENT API METHODS
  // ============================================================================

  async getStudents(params?: any): Promise<ApiResponse<any>> {
    return this.get('/students', { params });
  }

  async getStudentById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/students/${id}`);
  }

  async getStudentDetails(studentId: string): Promise<ApiResponse<any>> {
    return this.get(`/students/${studentId}`);
  }

  async createStudent(data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for student creation endpoint
    this.logEncryptionStatus('POST (STUDENT CREATE)', '/students', data);
    
    // Send unencrypted data for student creation endpoint
    const response = await this.api.post<ApiResponse<any>>('/students', data, {
      timeout: 60000, // 60 seconds for student creation
    });
    
    return {
      success: true,
      message: 'Student created successfully',
      data: response.data
    };
  }

  async updateStudent(id: string, data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for student update endpoint
    this.logEncryptionStatus('PUT (STUDENT UPDATE)', `/students/${id}`, data);
    
    // Send unencrypted data for student update endpoint
    const response = await this.api.put<ApiResponse<any>>(`/students/${id}`, data, {
      timeout: 60000, // 60 seconds for student update
    });
    
    return {
      success: true,
      message: 'Student updated successfully',
      data: response.data
    };
  }

  async updateStudentClass(id: string, data: any): Promise<ApiResponse<any>> {
    console.log('🔍 updateStudentClass called with:', { id, data });
    
    // Bypass encryption for student class update endpoint
    this.logEncryptionStatus('PUT (STUDENT CLASS UPDATE)', `/students/${id}`, data);
    
    // Send unencrypted data directly using raw axios instance
    const response = await this.api.put<ApiResponse<any>>(`/students/${id}`, data, {
      timeout: 60000, // 60 seconds for student class update
    });
    
    console.log('🔍 updateStudentClass response:', response.data);
    return {
      success: true,
      message: 'Student class updated successfully',
      data: response.data
    };
  }

  async deleteStudent(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/students/${id}`);
  }

  async uploadStudentDocuments(studentId: number | string, formData: FormData): Promise<ApiResponse<any>> {
    console.log(`📤 Uploading documents for student ${studentId}`);
    
    try {
      const response = await this.api.post<ApiResponse<any>>(
        `/students/${studentId}/documents/bulk`,
        formData,
        {
          timeout: 120000, // 120 seconds for file uploads
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Document upload response:', response.data);
      return {
        success: true,
        message: 'Documents uploaded successfully',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Document upload error:', error);
      throw error;
    }
  }

  async uploadStudentAvatar(studentId: number | string, file: File | Blob): Promise<ApiResponse<any>> {
    console.log(`🖼️ Uploading avatar for student ${studentId}`);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await this.api.post<ApiResponse<any>>(
        `/students/${studentId}/avatar`,
        formData,
        {
          timeout: 60000, // 60 seconds for avatar upload
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('✅ Avatar upload response:', response.data);
      return {
        success: true,
        message: 'Avatar uploaded successfully',
        data: response.data
      };
    } catch (error: any) {
      console.error('❌ Avatar upload error:', error);
      throw error;
    }
  }

  async getStudentConversionAnalytics(period: string): Promise<ApiResponse<any>> {
    return this.get(`/students/conversion-analytics?period=${period}`);
  }

  async getStudentConversionStats(): Promise<ApiResponse<any>> {
    return this.get('/students/conversion-stats');
  }

  async getStudentEvents(studentId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    return this.get(`/students/${studentId}/events?page=${page}&limit=${limit}`);
  }

  // Student Conversion
  async getConvertedStudents(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    return this.get(`/students/converted?page=${page}&limit=${limit}`);
  }

  // Customer Events
  async getCustomerEvents(customerId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    return this.get(`/customers/${customerId}/events?page=${page}&limit=${limit}`);
  }

  // Unconverted Customers
  async getUnconvertedCustomers(page: number = 1, limit: number = 20): Promise<ApiResponse<any>> {
    // Use the dedicated unconverted customers endpoint
    const response = await this.get(`/customers/unconverted?page=${page}&limit=${limit}`);
    return response;
  }

  // ============================================================================
  // STAFF API METHODS
  // ============================================================================

  async getStaffMembers(params?: any): Promise<ApiResponse<any>> {
    return this.get('/users', { params });
  }

  async getStaffById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/users/${id}`);
  }

  async createStaff(data: any): Promise<ApiResponse<any>> {
    return this.post('/users', data);
  }

  async updateStaff(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/users/${id}`, data);
  }

  async deleteStaff(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/users/${id}`);
  }

  // Password Change
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<any>> {
    return this.post('/me/change-password', passwordData);
  }

  // Staff Collaboration
  async getStaffCollaboration(staffId: string): Promise<ApiResponse<any>> {
    return this.get(`/staff/${staffId}/collaboration`);
  }

  async createStaffCollaboration(staffId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/staff/${staffId}/collaboration`, data);
  }

  async updateStaffCollaboration(staffId: string, collaborationId: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/staff/${staffId}/collaboration/${collaborationId}`, data);
  }

  async deleteStaffCollaboration(staffId: string, collaborationId: string): Promise<ApiResponse<any>> {
    return this.delete(`/staff/${staffId}/collaboration/${collaborationId}`);
  }

  // Staff Documents
  async getStaffDocuments(staffId: string): Promise<ApiResponse<any>> {
    return this.get(`/staff/${staffId}/documents`);
  }

  async uploadStaffDocument(staffId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/staff/${staffId}/documents`, data);
  }

  async updateStaffDocument(staffId: string, documentId: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/staff/${staffId}/documents/${documentId}`, data);
  }

  async deleteStaffDocument(staffId: string, documentId: string): Promise<ApiResponse<any>> {
    return this.delete(`/staff/${staffId}/documents/${documentId}`);
  }

  async verifyStaffDocument(staffId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/staff/${staffId}/documents/verify`, data);
  }

  // Staff Tasks
  async getStaffTasks(staffId: string): Promise<ApiResponse<any>> {
    return this.get(`/staff/${staffId}/tasks`);
  }

  async createStaffTask(staffId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/staff/${staffId}/tasks`, data);
  }

  async updateStaffTask(staffId: string, taskId: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/staff/${staffId}/tasks/${taskId}`, data);
  }

  async deleteStaffTask(staffId: string, taskId: string): Promise<ApiResponse<any>> {
    return this.delete(`/staff/${staffId}/tasks/${taskId}`);
  }

  async completeStaffTask(staffId: string, taskId: string): Promise<ApiResponse<any>> {
    return this.post(`/staff/${staffId}/tasks/${taskId}/complete`);
  }

  // Staff Bulk Operations
  async bulkCreateStaff(data: any): Promise<ApiResponse<any>> {
    return this.post('/staff/bulk', data);
  }

  async bulkUpdateStaff(data: any): Promise<ApiResponse<any>> {
    return this.put('/staff/bulk', data);
  }

  // ============================================================================
  // FINANCE API METHODS
  // ============================================================================

  async getPayments(params?: any): Promise<ApiResponse<any>> {
    // Block demo user from accessing payments
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from payments');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payments endpoint
    this.logEncryptionStatus('GET (PAYMENTS)', '/payments', params);
    const response = await this.api.get<ApiResponse<any>>('/payments', { 
      params,
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payments retrieved successfully',
      data: response.data
    };
  }

  async createPayment(data: any): Promise<ApiResponse<any>> {
    // Block demo user from creating payments
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from creating payments');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payment creation
    this.logEncryptionStatus('POST (PAYMENT CREATE)', '/payments', data);
    const response = await this.api.post<ApiResponse<any>>('/payments', data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payment created successfully',
      data: response.data
    };
  }

  async updatePayment(id: string, data: any): Promise<ApiResponse<any>> {
    // Block demo user from updating payments
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from updating payments');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payment update
    this.logEncryptionStatus('PUT (PAYMENT UPDATE)', `/payments/${id}`, data);
    const response = await this.api.put<ApiResponse<any>>(`/payments/${id}`, data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payment updated successfully',
      data: response.data
    };
  }

  async deletePayment(id: string): Promise<ApiResponse<any>> {
    // Block demo user from deleting payments
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from deleting payments');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payment deletion
    this.logEncryptionStatus('DELETE (PAYMENT DELETE)', `/payments/${id}`, null);
    const response = await this.api.delete<ApiResponse<any>>(`/payments/${id}`, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payment deleted successfully',
      data: response.data
    };
  }

  async getPaymentAnalytics(params?: any): Promise<ApiResponse<any>> {
    return this.get('/payments/analytics', { params });
  }

  // Payroll
  async getPayrolls(params?: any): Promise<ApiResponse<any>> {
    // Block demo user from accessing payrolls
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from payrolls');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payrolls endpoint
    this.logEncryptionStatus('GET (PAYROLLS)', '/payrolls', params);
    const response = await this.api.get<ApiResponse<any>>('/payrolls', { 
      params,
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payrolls retrieved successfully',
      data: response.data
    };
  }

  async createPayroll(data: any): Promise<ApiResponse<any>> {
    // Block demo user from creating payrolls
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from creating payrolls');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payroll creation
    this.logEncryptionStatus('POST (PAYROLL CREATE)', '/payrolls', data);
    const response = await this.api.post<ApiResponse<any>>('/payrolls', data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payroll created successfully',
      data: response.data
    };
  }

  async updatePayroll(id: string, data: any): Promise<ApiResponse<any>> {
    // Block demo user from updating payrolls
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from updating payrolls');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payroll update
    this.logEncryptionStatus('PUT (PAYROLL UPDATE)', `/payrolls/${id}`, data);
    const response = await this.api.put<ApiResponse<any>>(`/payrolls/${id}`, data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payroll updated successfully',
      data: response.data
    };
  }

  async deletePayroll(id: string): Promise<ApiResponse<any>> {
    // Block demo user from deleting payrolls
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from deleting payrolls');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance payroll deletion
    this.logEncryptionStatus('DELETE (PAYROLL DELETE)', `/payrolls/${id}`, null);
    const response = await this.api.delete<ApiResponse<any>>(`/payrolls/${id}`, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Payroll deleted successfully',
      data: response.data
    };
  }

  // Expenses
  async getExpenses(params?: any): Promise<ApiResponse<any>> {
    // Block demo user from accessing expenses
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from expenses');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance expenses endpoint
    this.logEncryptionStatus('GET (EXPENSES)', '/expenses', params);
    const response = await this.api.get<ApiResponse<any>>('/expenses', { 
      params,
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Expenses retrieved successfully',
      data: response.data
    };
  }

  async createExpense(data: any): Promise<ApiResponse<any>> {
    // Block demo user from creating expenses
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from creating expenses');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance expense creation
    this.logEncryptionStatus('POST (EXPENSE CREATE)', '/expenses', data);
    const response = await this.api.post<ApiResponse<any>>('/expenses', data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Expense created successfully',
      data: response.data
    };
  }

  async updateExpense(id: string, data: any): Promise<ApiResponse<any>> {
    // Block demo user from updating expenses
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from updating expenses');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance expense update
    this.logEncryptionStatus('PUT (EXPENSE UPDATE)', `/expenses/${id}`, data);
    const response = await this.api.put<ApiResponse<any>>(`/expenses/${id}`, data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Expense updated successfully',
      data: response.data
    };
  }

  async deleteExpense(id: string): Promise<ApiResponse<any>> {
    // Block demo user from deleting expenses
    if (this.isDemoUser()) {
      console.log('🎭 Demo user blocked from deleting expenses');
      this.throwDemoUserError();
    }
    
    // Bypass encryption for finance expense deletion
    this.logEncryptionStatus('DELETE (EXPENSE DELETE)', `/expenses/${id}`, null);
    const response = await this.api.delete<ApiResponse<any>>(`/expenses/${id}`, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Expense deleted successfully',
      data: response.data
    };
  }

  // Income
  async getIncomes(params?: any): Promise<ApiResponse<any>> {
    return this.get('/incomes', { params });
  }

  async createIncome(data: any): Promise<ApiResponse<any>> {
    return this.post('/incomes', data);
  }

  async updateIncome(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/incomes/${id}`, data);
  }

  async deleteIncome(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/incomes/${id}`);
  }

  // Budgets
  async getBudgets(params?: any): Promise<ApiResponse<any>> {
    return this.get('/budgets', { params });
  }

  async createBudget(data: any): Promise<ApiResponse<any>> {
    return this.post('/budgets', data);
  }

  async updateBudget(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/budgets/${id}`, data);
  }

  async deleteBudget(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/budgets/${id}`);
  }

  // Fee Structures
  async getFeeStructures(): Promise<ApiResponse<any>> {
    return this.get('/fee-structures');
  }

  async createFeeStructure(data: any): Promise<ApiResponse<any>> {
    return this.post('/fee-structures', data);
  }

  async updateFeeStructure(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/fee-structures/${id}`, data);
  }

  async deleteFeeStructure(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/fee-structures/${id}`);
  }

  // Finance Analytics
  async getFinanceAnalytics(params?: any): Promise<ApiResponse<any>> {
    // Bypass encryption for finance analytics endpoint
    this.logEncryptionStatus('GET (FINANCE ANALYTICS)', '/finance/analytics', params);
    const response = await this.api.get<ApiResponse<any>>('/finance/analytics', { 
      params,
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Finance analytics retrieved successfully',
      data: response.data
    };
  }

  async getFinanceDashboard(params?: any): Promise<ApiResponse<any>> {
    // Bypass encryption for finance dashboard endpoint
    this.logEncryptionStatus('GET (FINANCE DASHBOARD)', '/finance/dashboard', params);
    const response = await this.api.get<ApiResponse<any>>('/finance/dashboard', { 
      params,
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Finance dashboard retrieved successfully',
      data: response.data
    };
  }

  async getFinanceReports(params?: any): Promise<ApiResponse<any>> {
    return this.get('/finance/reports', { params });
  }

  async generateFinanceReport(data: any): Promise<ApiResponse<any>> {
    return this.post('/finance/reports/generate', data);
  }

  // Transactions
  async getTransactions(params?: any): Promise<ApiResponse<any>> {
    return this.get('/transactions', { params });
  }

  async createTransaction(data: any): Promise<ApiResponse<any>> {
    return this.post('/transactions', data);
  }

  async updateTransaction(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/transactions/${id}`, data);
  }

  async deleteTransaction(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/transactions/${id}`);
  }

  // ============================================================================
  // MESSAGING API METHODS
  // ============================================================================

  async getMessages(params?: any): Promise<ApiResponse<any>> {
    return this.get('/messages', { params });
  }

  async createMessage(data: any): Promise<ApiResponse<any>> {
    return this.post('/messages', data);
  }

  async updateMessage(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/messages/${id}`, data);
  }

  async deleteMessage(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/messages/${id}`);
  }

  async markMessageAsRead(id: string): Promise<ApiResponse<any>> {
    return this.patch(`/messages/${id}/read`);
  }

  async getUnreadMessagesCount(): Promise<ApiResponse<any>> {
    return this.get('/messages/unread/count');
  }

  // Conversations
  async getConversations(params?: any): Promise<ApiResponse<any>> {
    return this.get('/conversations', { params });
  }

  async createConversation(data: any): Promise<ApiResponse<any>> {
    return this.post('/conversations', data);
  }

  async updateConversation(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/conversations/${id}`, data);
  }

  async deleteConversation(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/conversations/${id}`);
  }

  async getConversationMessages(conversationId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/conversations/${conversationId}/messages`, { params });
  }

  async sendMessageToConversation(conversationId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/conversations/${conversationId}/messages`, data);
  }

  async searchMessages(query: string, filters?: any): Promise<ApiResponse<any>> {
    return this.get('/messages/search', { params: { query, ...filters } });
  }

  // Advanced messaging features
  async createPoll(conversationId: string, pollData: any): Promise<ApiResponse<any>> {
    return this.post(`/conversations/${conversationId}/polls`, pollData);
  }

  async votePoll(pollId: string, optionIds: string[]): Promise<ApiResponse<any>> {
    return this.post(`/polls/${pollId}/vote`, { optionIds });
  }

  async uploadFile(file: any, conversationId: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);
    return this.post('/messages/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async requestAI(type: string, context: any, conversationId: string): Promise<ApiResponse<any>> {
    return this.post('/ai/request', { type, context, conversationId });
  }

  async startCall(conversationId: string, callType: string): Promise<ApiResponse<any>> {
    return this.post(`/conversations/${conversationId}/calls`, { type: callType });
  }

  // ============================================================================
  // ATTENDANCE API METHODS
  // ============================================================================

  async getAttendanceRecords(params?: any): Promise<ApiResponse<any>> {
    return this.get('/attendances', { params });
  }

  async getAttendanceById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/attendances/${id}`);
  }

  async createAttendanceRecord(data: any): Promise<ApiResponse<any>> {
    return this.post('/attendances', data);
  }

  async updateAttendanceRecord(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/attendances/${id}`, data);
  }

  async deleteAttendanceRecord(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/attendances/${id}`);
  }

  async getAttendanceAnalytics(params?: any): Promise<ApiResponse<any>> {
    return this.get('/attendances/analytics', { params });
  }

  async getAttendanceSummary(params?: any): Promise<ApiResponse<any>> {
    return this.get('/attendances/summary', { params });
  }

  async getClassAttendanceSummary(params?: any): Promise<ApiResponse<any>> {
    return this.get('/attendances/class-summary', { params });
  }

  async getAttendanceStats(params?: any): Promise<ApiResponse<any>> {
    return this.get('/attendances/stats', { params });
  }

  async markInTime(data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for attendance mark-in-time endpoint
    this.logEncryptionStatus('POST (ATTENDANCE MARK IN)', '/attendances/mark-in-time', data);
    const response = await this.api.post<ApiResponse<any>>('/attendances/mark-in-time', data, {
      timeout: 30000, // 30 seconds for attendance operations
    });
    return {
      success: true,
      message: 'Attendance marked in successfully',
      data: response.data
    };
  }

  async markOutTime(data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for attendance mark-out-time endpoint
    this.logEncryptionStatus('POST (ATTENDANCE MARK OUT)', '/attendances/mark-out-time', data);
    const response = await this.api.post<ApiResponse<any>>('/attendances/mark-out-time', data, {
      timeout: 30000, // 30 seconds for attendance operations
    });
    return {
      success: true,
      message: 'Attendance marked out successfully',
      data: response.data
    };
  }

  async markStaffLeave(data: any): Promise<ApiResponse<any>> {
    return this.post('/attendances/staff/mark-leave', data);
  }

  async bulkCreateAttendance(data: any): Promise<ApiResponse<any>> {
    return this.post('/attendances/bulk', data);
  }

  async markIncompleteAttendanceAsAbsent(data: { date?: string; classId?: string }): Promise<ApiResponse<any>> {
    return this.post('/attendances/mark-incomplete-absent', data);
  }

  // ============================================================================
  // CLASSES API METHODS
  // ============================================================================

  async getClasses(params?: any): Promise<ApiResponse<any>> {
    return this.get('/classes', { params });
  }

  async getClassById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/classes/${id}`);
  }

  async createClass(data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for class creation endpoint
    this.logEncryptionStatus('POST (CLASS CREATE)', '/classes', data);
    const response = await this.api.post<ApiResponse<any>>('/classes', data, {
      timeout: 60000, // 60 seconds for class creation
    });
    return {
      success: true,
      message: 'Class created successfully',
      data: response.data
    };
  }

  async updateClass(id: string, data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for class update endpoint
    this.logEncryptionStatus('PUT (CLASS UPDATE)', `/classes/${id}`, data);
    const response = await this.api.put<ApiResponse<any>>(`/classes/${id}`, data, {
      timeout: 60000, // 60 seconds for class update
    });
    return {
      success: true,
      message: 'Class updated successfully',
      data: response.data
    };
  }

  async deleteClass(id: string): Promise<ApiResponse<any>> {
    // Bypass encryption for class deletion endpoint
    this.logEncryptionStatus('DELETE (CLASS DELETE)', `/classes/${id}`, null);
    const response = await this.api.delete<ApiResponse<any>>(`/classes/${id}`, {
      timeout: 60000, // 60 seconds for class deletion
    });
    return {
      success: true,
      message: 'Class deleted successfully',
      data: response.data
    };
  }

  // ============================================================================
  // ASSIGNMENTS API METHODS
  // ============================================================================

  async getAssignments(params?: any): Promise<ApiResponse<any>> {
    return this.get('/assignments', { params });
  }

  async getAssignmentById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/assignments/${id}`);
  }

  async createAssignment(data: any): Promise<ApiResponse<any>> {
    // Bypass encryption for assignments create
    this.logEncryptionStatus('POST (ASSIGNMENT CREATE)', '/assignments', data);
    const response = await this.api.post<ApiResponse<any>>('/assignments', data, {
      timeout: 60000,
    });
    return {
      success: true,
      message: 'Assignment created successfully',
      data: response.data
    };
  }

  async updateAssignment(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/assignments/${id}`, data);
  }

  async updateAssignmentStatus(id: string, status: string): Promise<ApiResponse<any>> {
    console.log('API: Updating assignment status:', { id, status, statusType: typeof status });
    // Bypass encryption for assignment status update
    this.logEncryptionStatus('PATCH (ASSIGNMENT STATUS UPDATE)', `/assignments/${id}/status`, { status });
    const response = await this.api.patch<ApiResponse<any>>(`/assignments/${id}/status`, { status }, {
      timeout: 30000,
    });
    return {
      success: true,
      message: 'Assignment status updated successfully',
      data: response.data
    };
  }

  async deleteAssignment(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/assignments/${id}`);
  }

  async getAssignmentStudents(assignmentId: string): Promise<ApiResponse<any>> {
    return this.get(`/assignments/${assignmentId}/students`);
  }

  async getStudentAssignmentSubmission(assignmentId: string, studentId: string): Promise<ApiResponse<any>> {
    return this.get(`/assignments/${assignmentId}/students/${studentId}/submission`);
  }

  async gradeSubmission(assignmentId: string, studentId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/assignments/${assignmentId}/students/${studentId}/grade`, data);
  }

  async submitAssignment(assignmentId: string, formData: FormData): Promise<ApiResponse<any>> {
    return this.post(`/assignments/${assignmentId}/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // ============================================================================
  // TEACHERS API METHODS
  // ============================================================================

  async getTeachers(params?: any): Promise<ApiResponse<any>> {
    return this.get('/teachers', { params });
  }

  async getTeacherById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/teachers/${id}`);
  }

  async getTeacherDetails(teacherId: string): Promise<ApiResponse<any>> {
    return this.get(`/teachers/${teacherId}/details`);
  }

  async createTeacher(data: any): Promise<ApiResponse<any>> {
    return this.post('/teachers', data);
  }

  async updateTeacher(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/teachers/${id}`, data);
  }

  async deleteTeacher(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/teachers/${id}`);
  }

  // ============================================================================
  // OWNERS API METHODS
  // ============================================================================

  async getOwners(params?: any): Promise<ApiResponse<any>> {
    return this.get('/owners', { params });
  }

  async getOwnerById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/owners/${id}`);
  }

  async createOwner(data: any): Promise<ApiResponse<any>> {
    return this.post('/owners', data);
  }

  async updateOwner(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/owners/${id}`, data);
  }

  async deleteOwner(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/owners/${id}`);
  }

  // ============================================================================
  // REPORTS API METHODS
  // ============================================================================

  async getReports(params?: any): Promise<ApiResponse<any>> {
    return this.get('/reports', { params });
  }

  async generateReport(data: any): Promise<ApiResponse<any>> {
    return this.post('/reports/generate', data);
  }

  async exportReport(reportId: string, format: string = 'pdf'): Promise<ApiResponse<any>> {
    return this.get(`/reports/${reportId}/export`, { params: { format } });
  }

  // ============================================================================
  // SETTINGS API METHODS
  // ============================================================================

  async getSettings(): Promise<ApiResponse<any>> {
    return this.get('/settings');
  }

  async updateSettings(data: any): Promise<ApiResponse<any>> {
    return this.put('/settings', data);
  }

  async getSystemSettings(): Promise<ApiResponse<any>> {
    return this.get('/settings/system');
  }

  async updateSystemSettings(data: any): Promise<ApiResponse<any>> {
    return this.put('/settings/system', data);
  }

  // ============================================================================
  // ANNOUNCEMENTS API METHODS
  // ============================================================================

  async getAnnouncements(params?: any): Promise<ApiResponse<any>> {
    return this.get('/announcements', { params });
  }

  async createAnnouncement(data: any): Promise<ApiResponse<any>> {
    return this.post('/announcements', data);
  }

  async updateAnnouncement(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/announcements/${id}`, data);
  }

  async deleteAnnouncement(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/announcements/${id}`);
  }

  // ============================================================================
  // GRADES API METHODS
  // ============================================================================

  async getGrades(params?: any): Promise<ApiResponse<any>> {
    return this.get('/grades', { params });
  }

  async createGrade(data: any): Promise<ApiResponse<any>> {
    return this.post('/grades', data);
  }

  async updateGrade(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/grades/${id}`, data);
  }

  async deleteGrade(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/grades/${id}`);
  }

  // ============================================================================
  // EXAMS API METHODS
  // ============================================================================

  async getExams(params?: any): Promise<ApiResponse<any>> {
    return this.get('/exams', { params });
  }

  async createExam(data: any): Promise<ApiResponse<any>> {
    return this.post('/exams', data);
  }

  async updateExam(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/exams/${id}`, data);
  }

  async deleteExam(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/exams/${id}`);
  }

  // ============================================================================
  // TIMETABLE API METHODS
  // ============================================================================

  async getTimetables(params?: any): Promise<ApiResponse<any>> {
    return this.get('/timetables', { params });
  }

  async createTimetable(data: any): Promise<ApiResponse<any>> {
    return this.post('/timetables', data);
  }

  async updateTimetable(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/timetables/${id}`, data);
  }

  async deleteTimetable(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/timetables/${id}`);
  }

  // ============================================================================
  // SUBJECTS API METHODS
  // ============================================================================

  async getSubjects(params?: any): Promise<ApiResponse<any>> {
    return this.get('/subjects', { params });
  }

  async createSubject(data: any): Promise<ApiResponse<any>> {
    return this.post('/subjects', data);
  }

  async updateSubject(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/subjects/${id}`, data);
  }

  async deleteSubject(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/subjects/${id}`);
  }

  // ============================================================================
  // SCHOOLS API METHODS
  // ============================================================================

  async getSchools(params?: any): Promise<ApiResponse<any>> {
    return this.get('/schools', { params });
  }

  async getSchoolById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/schools/${id}`);
  }

  async createSchool(data: any): Promise<ApiResponse<any>> {
    return this.post('/schools', data);
  }

  async updateSchool(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/schools/${id}`, data);
  }

  async deleteSchool(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/schools/${id}`);
  }

  // ============================================================================
  // RESOURCES API METHODS
  // ============================================================================

  async getResources(params?: any): Promise<ApiResponse<any>> {
    return this.get('/resources', { params });
  }

  async uploadResource(data: any): Promise<ApiResponse<any>> {
    return this.post('/resources', data);
  }

  async updateResource(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/resources/${id}`, data);
  }

  async deleteResource(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/resources/${id}`);
  }

  // ============================================================================
  // PAYMENTS API METHODS
  // ============================================================================

  async getPaymentMethods(params?: any): Promise<ApiResponse<any>> {
    return this.get('/payments/methods', { params });
  }

  async createPaymentMethod(data: any): Promise<ApiResponse<any>> {
    return this.post('/payments/methods', data);
  }

  async updatePaymentMethod(id: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/payments/methods/${id}`, data);
  }

  async deletePaymentMethod(id: string): Promise<ApiResponse<any>> {
    return this.delete(`/payments/methods/${id}`);
  }

  // ========================================
  // PAYMENT ANALYTICS - ENHANCED
  // ========================================

  async getDetailedPaymentAnalytics(params?: any): Promise<ApiResponse<any>> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/analytics/detailed${queryString ? `?${queryString}` : ''}`;
      return await this.get(url);
    } catch (error: any) {
      console.error('❌ getDetailedPaymentAnalytics error:', error);
      throw new Error(error.message || 'Failed to fetch detailed payment analytics');
    }
  }

  async getRevenueAnalytics(params?: any): Promise<ApiResponse<any>> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/analytics/revenue${queryString ? `?${queryString}` : ''}`;
      return await this.get(url);
    } catch (error: any) {
      console.error('❌ getRevenueAnalytics error:', error);
      throw new Error(error.message || 'Failed to fetch revenue analytics');
    }
  }

  async getRecentPaymentsDetailed(params?: any): Promise<ApiResponse<any>> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/analytics/recent${queryString ? `?${queryString}` : ''}`;
      return await this.get(url);
    } catch (error: any) {
      console.error('❌ getRecentPaymentsDetailed error:', error);
      throw new Error(error.message || 'Failed to fetch recent payments detailed');
    }
  }

  // Enhanced payment analytics with comprehensive data
  async getComprehensivePaymentAnalytics(params?: any): Promise<ApiResponse<any>> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/analytics/detailed${queryString ? `?${queryString}` : ''}`;
      return await this.get(url);
    } catch (error: any) {
      console.error('❌ getComprehensivePaymentAnalytics error:', error);
      throw new Error(error.message || 'Failed to fetch comprehensive payment analytics');
    }
  }

  // Get payment trends for charts
  async getPaymentTrends(params?: any): Promise<ApiResponse<any>> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/analytics/detailed${queryString ? `?${queryString}` : ''}`;
      const response = await this.get(url);
      
      if (response.success && (response.data as any)?.trends) {
        return {
          success: true,
          message: 'Payment trends retrieved successfully',
          data: {
            monthly: (response.data as any).trends.monthly || [],
            daily: (response.data as any).trends.daily || [],
            summary: (response.data as any).summary || {}
          }
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ getPaymentTrends error:', error);
      throw new Error(error.message || 'Failed to fetch payment trends');
    }
  }

  // Get payment breakdowns for pie charts
  async getPaymentBreakdowns(params?: any): Promise<ApiResponse<any>> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/analytics/detailed${queryString ? `?${queryString}` : ''}`;
      const response = await this.get(url);
      
      if (response.success && response.data) {
        return {
          success: true,
          message: 'Payment breakdowns retrieved successfully',
          data: {
            statusBreakdown: (response.data as any).statusBreakdown || [],
            methodBreakdown: (response.data as any).methodBreakdown || [],
            categories: (response.data as any).categories || []
          }
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ getPaymentBreakdowns error:', error);
      throw new Error(error.message || 'Failed to fetch payment breakdowns');
    }
  }

  // Get top performing students
  async getTopPerformingStudents(params?: any): Promise<ApiResponse<any>> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const url = `/payments/analytics/detailed${queryString ? `?${queryString}` : ''}`;
      const response = await this.get(url);
      
      if (response.success && (response.data as any)?.topStudents) {
        return {
          success: true,
          message: 'Top performing students retrieved successfully',
          data: (response.data as any).topStudents
        };
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ getTopPerformingStudents error:', error);
      throw new Error(error.message || 'Failed to fetch top performing students');
    }
  }

  // ============================================================================
  // AUDIT LOGS API METHODS
  // ============================================================================

  async getAuditLogs(params?: any): Promise<ApiResponse<any>> {
    return this.get('/audit/logs', { params });
  }

  async getAuditLogById(id: string): Promise<ApiResponse<any>> {
    return this.get(`/audit/logs/${id}`);
  }

  async getUserAuditLogs(userId: string): Promise<ApiResponse<any>> {
    return this.get(`/audit/logs/user/${userId}`);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async healthCheck(): Promise<{ success: boolean; message: string }> {
    return this.testBackendConnection();
  }

  async getApiStatus(): Promise<{ isOnline: boolean; message: string }> {
    try {
      const response = await this.get('/health');
      return {
        isOnline: response.success,
        message: response.message || 'API is online'
      };
    } catch (error: any) {
      return {
        isOnline: false,
        message: error.message || 'API is offline'
      };
    }
  }

  // User Permissions Management
  setUserPermissions(permissions: any): void {
    try {
      localStorage.setItem('userPermissions', JSON.stringify(permissions));
    } catch (error) {
      console.error('Error setting user permissions:', error);
    }
  }

  getUserPermissions(): any {
    try {
      const stored = localStorage.getItem('userPermissions');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  // Token Generation (for compatibility)
  async generateAccessToken(context: any): Promise<string> {
    try {
      const token = await this.getAccessToken();
      if (token) {
        return token;
      } else {
        throw new Error('No access token available');
      }
    } catch (error) {
      throw new Error('Failed to generate access token');
    }
  }

  // Customer Pipeline
  async getPipeline(): Promise<ApiResponse<any>> {
    return this.get('/customers/pipeline');
  }

  // Customer Search Filters
  async getFilters(): Promise<ApiResponse<any>> {
    return this.get('/customers/filters');
  }

  // Student Management
  async restoreStudent(studentId: string): Promise<ApiResponse<any>> {
    return this.patch(`/students/${studentId}/restore`);
  }

  async getStudentStats(studentId: string): Promise<ApiResponse<any>> {
    return this.get(`/students/${studentId}/stats`);
  }

  async getStudentAnalytics(studentId: string, period: string): Promise<ApiResponse<any>> {
    return this.get(`/students/${studentId}/analytics?period=${period}`);
  }

  async getStudentPerformance(studentId: string): Promise<ApiResponse<any>> {
    return this.get(`/students/${studentId}/performance`);
  }

  async bulkCreateStudents(students: any[]): Promise<ApiResponse<any>> {
    return this.post('/students/bulk/create', { students });
  }

  async bulkUpdateStudents(updates: any[]): Promise<ApiResponse<any>> {
    return this.put('/students/bulk/update', { updates });
  }

  async bulkDeleteStudents(studentIds: string[]): Promise<ApiResponse<any>> {
    return this.delete('/students/bulk/delete', { data: { studentIds } });
  }

  async searchStudents(query: string): Promise<ApiResponse<any>> {
    return this.get(`/students/search?${query}`);
  }

  async exportStudents(query: string): Promise<ApiResponse<any>> {
    return this.get(`/students/export?${query}`);
  }

  async importStudents(students: any[]): Promise<ApiResponse<any>> {
    return this.post('/students/import', { students });
  }

  async generateCodeSuggestions(name: string, schoolId: string): Promise<ApiResponse<any>> {
    return this.get(`/students/suggestions/code?name=${encodeURIComponent(name)}&schoolId=${schoolId}`);
  }

  async getStudentCountByClass(query: string): Promise<ApiResponse<any>> {
    return this.get(`/students/stats/class${query}`);
  }

  async getStudentCountByStatus(query: string): Promise<ApiResponse<any>> {
    return this.get(`/students/stats/status${query}`);
  }

  async getStudentsBySchool(schoolId: string, query: string): Promise<ApiResponse<any>> {
    return this.get(`/students/school/${schoolId}${query}`);
  }

  async getStudentsByClass(classId: string, query: string): Promise<ApiResponse<any>> {
    return this.get(`/students/class/${classId}${query}`);
  }

  async getStudentAttendance(studentId: string): Promise<ApiResponse<any>> {
    return this.get(`/attendances?studentId=${studentId}`);
  }

  async updateStudentAttendance(studentId: string, attendanceData: any): Promise<ApiResponse<any>> {
    return this.post('/attendances', { studentId, ...attendanceData });
  }

  async getStudentDocuments(studentId: string): Promise<ApiResponse<any>> {
    return this.get(`/documents?studentId=${studentId}`);
  }

  async getAcademicCustomers(): Promise<ApiResponse<any>> {
    return this.get('/customers?purpose=academic');
  }

  async getCacheStats(): Promise<ApiResponse<any>> {
    return this.get('/students/cache/stats');
  }

  async warmCache(studentIds: string[], schoolId: string): Promise<ApiResponse<any>> {
    return this.post('/students/cache/warm', { studentIds, schoolId });
  }

  // Class Management
  async getClassPerformance(classId: string, query: string): Promise<ApiResponse<any>> {
    return this.get(`/classes/performance/${classId}${query ? `?${query}` : ''}`);
  }

  async getClassAnalytics(classId: string, period: string): Promise<ApiResponse<any>> {
    return this.get(`/classes/${classId}/analytics?period=${period}`);
  }

  async getClassStats(classId: string): Promise<ApiResponse<any>> {
    return this.get(`/classes/${classId}/stats`);
  }

  // Teacher Management
  async getTeacherPerformance(teacherId: string): Promise<ApiResponse<any>> {
    return this.get(`/teachers/${teacherId}/performance`);
  }

  // Subject Management
  async getSubjectPerformance(subjectId: string): Promise<ApiResponse<any>> {
    return this.get(`/subjects/${subjectId}/performance`);
  }

  // Grade Management
  async getGradePerformance(gradeId: string): Promise<ApiResponse<any>> {
    return this.get(`/grades/${gradeId}/performance`);
  }

  // School Management
  async getSchoolPerformance(schoolId: string): Promise<ApiResponse<any>> {
    return this.get(`/schools/${schoolId}/performance`);
  }

  // Parent Management
  async getParentPerformance(parentId: string): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/performance`);
  }

  async getParentProfile(parentId: string): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}`);
  }

  // ======================
  // PARENT PORTAL METHODS
  // ======================

  async getParentStudents(parentId: string): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students`);
  }

  async getParentStudentAttendance(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/attendance`, { params });
  }

  async getParentStudentGrades(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/grades`, { params });
  }

  async getParentStudentAssignments(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/assignments`, { params });
  }

  async getParentStudentExams(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/exams`, { params });
  }

  async getParentStudentTimetable(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/timetable`, { params });
  }

  async getParentStudentFees(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/fees`, { params });
  }

  async getParentStudentPayments(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/payments`, { params });
  }

  async getParentStudentReports(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/reports`, { params });
  }

  async getParentStudentDocuments(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/documents`, { params });
  }

  async getParentStudentAnnouncements(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/announcements`, { params });
  }

  async getParentStudentMessages(parentId: string, studentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/students/${studentId}/messages`, { params });
  }

  async sendParentMessage(parentId: string, data: any): Promise<ApiResponse<any>> {
    return this.post(`/parents/${parentId}/messages`, data);
  }

  async getParentNotifications(parentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/notifications`, { params });
  }

  async markParentNotificationAsRead(parentId: string, notificationId: string): Promise<ApiResponse<any>> {
    return this.patch(`/parents/${parentId}/notifications/${notificationId}/read`);
  }

  async getParentDashboard(parentId: string): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/dashboard`);
  }

  async getParentCalendar(parentId: string, params?: any): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/calendar`, { params });
  }

  async getParentSettings(parentId: string): Promise<ApiResponse<any>> {
    return this.get(`/parents/${parentId}/settings`);
  }

  async updateParentSettings(parentId: string, data: any): Promise<ApiResponse<any>> {
    return this.put(`/parents/${parentId}/settings`, data);
  }

  // Exam Timetable Management
  async getExamTimetablePerformance(timetableId: string): Promise<ApiResponse<any>> {
    return this.get(`/exam-timetables/${timetableId}/performance`);
  }

  // Monthly Attendance Matrix
  async getMonthlyAttendanceMatrix(classId: string, month: number, year: number): Promise<ApiResponse<any>> {
    return this.get(`/attendances/monthly-matrix`, { 
      params: { classId, month, year } 
    });
  }

  // Export Attendance Data
  async exportAttendanceData(params: any): Promise<Blob> {
    // Use a special method for blob responses that bypasses encryption handling
    return this.getBlob(`/attendances/export`, { params });
  }

  // Special method for blob responses (no encryption handling)
  async getBlob(url: string, config?: AxiosRequestConfig): Promise<Blob> {
    const response = await this.makeRequestWithRetry(
      () => this.api.get(url, { 
        ...config, 
        responseType: 'blob',
        timeout: 60000 // 60 seconds for file downloads
      }),
      'GET',
      url
    );
    
    // For blob responses, return the data directly
    return response.data;
  }
}

// Export singleton instance
export { TokenManager };
export default new SecureApiService(); 