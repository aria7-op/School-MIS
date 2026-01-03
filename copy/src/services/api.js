import { API_ENDPOINTS, HTTP_STATUS, STORAGE_KEYS } from '../constants';
import rbac from '../utils/rbac';

// API Configuration
const API_CONFIG = {
  BASE_URL: 'https://khwanzay.school/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 0, // Temporarily disable retries to debug
  RETRY_DELAY: 1000
};

// Both frontend and backend are using HTTPS

/**
 * API Service Class
 * Handles all HTTP requests with authentication, error handling, and interceptors
 */
class ApiService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
    this.retryDelay = API_CONFIG.RETRY_DELAY;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  /**
   * Get authentication headers
   * @returns {Object} Headers with auth token
   */
  getAuthHeaders() {
    // Try multiple possible token keys
    const tokenKeys = [STORAGE_KEYS.AUTH_TOKEN, 'userToken', 'authToken', 'token'];
    let token = null;
    
    for (const key of tokenKeys) {
      token = localStorage.getItem(key);
      if (token) {
        // console.log(`🔍 Found token with key: ${key}`);
        break;
      }
    }
    
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /**
   * Get default headers
   * @returns {Object} Default headers
   */
  getDefaultHeaders() {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.getAuthHeaders()
    };
  }

  /**
   * Process failed requests queue
   * @param {string} token - New auth token
   * @param {string} error - Error message
   */
  processQueue(token, error = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    this.failedQueue = [];
  }

  /**
   * Refresh authentication token
   * @returns {Promise<string>} New token
   */
  async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
      this.processQueue(null, 'No refresh token available');
      this.isRefreshing = false;
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${this.baseURL}${API_ENDPOINTS.REFRESH_TOKEN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      const { accessToken, refreshToken: newRefreshToken } = data;

      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

      this.processQueue(accessToken);
      this.isRefreshing = false;
      return accessToken;
    } catch (error) {
      this.processQueue(null, error.message);
      this.isRefreshing = false;
      this.logout();
      throw error;
    }
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch response
   * @returns {Promise<Object>} Processed response
   */
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    // console.log(`API Response Status: ${response.status} ${response.statusText}`);
    // console.log(`API Response URL: ${response.url}`);

    if (!response.ok) {
      console.error(`API Error - Status: ${response.status}, URL: ${response.url}`);
      
      if (response.status === HTTP_STATUS.UNAUTHORIZED) {
        // Try to refresh token
        try {
          await this.refreshToken();
          // Retry the original request - extract path from URL
          const path = response.url.replace(this.baseURL, '');
          return this.request(path, {
            method: response.method,
            headers: response.headers,
            body: response.body
          });
        } catch (error) {
          this.logout();
          throw new Error('Authentication failed');
        }
      }

      let errorData;
      try {
        errorData = isJson ? await response.json() : { message: response.statusText };
        // console.log('🔍 Error response body:', errorData);
      } catch (parseError) {
        errorData = { message: response.statusText };
        // console.log('🔍 Could not parse error response as JSON:', parseError);
      }
      
      console.error('API Error response:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === HTTP_STATUS.NO_CONTENT) {
      return null;
    }

    const responseData = isJson ? await response.json() : await response.text();
    
    // Normalize response format to match expected structure
    if (typeof responseData === 'object' && responseData !== null) {
      // If response already has success field, return as-is
      if ('success' in responseData) {
        return responseData;
      }
      // If response has data field, wrap it
      if ('data' in responseData) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.message || 'Success',
          meta: responseData.meta
        };
      }
      // If it's an array or object, wrap it in data field
      return {
        success: true,
        data: responseData,
        message: 'Success'
      };
    }
    
    return {
      success: true,
      data: responseData,
      message: 'Success'
    };
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestOptions = {
      headers: this.getDefaultHeaders(),
      signal: controller.signal,
      ...options
    };

    let lastError;
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
      // console.log(`🔍 API Request: ${fullUrl}`);
      // console.log(`🔍 Request options:`, {
      //   method: requestOptions.method || 'GET',
      //   headers: requestOptions.headers,
      //   hasBody: !!requestOptions.body
      // });
      // console.log(`🔍 Full headers:`, requestOptions.headers);
      // console.log(`🔍 Query string: ${new URL(fullUrl).search}`);
    
    for (let attempt = 1; attempt <= this.retryAttempts + 1; attempt++) {
      try {
        clearTimeout(timeoutId);
        // console.log(`🔍 API Request Attempt ${attempt}: ${fullUrl}`);
        const response = await fetch(fullUrl, requestOptions);
        // console.log(`🔍 Response received:`, {
        //   status: response.status,
        //   statusText: response.statusText,
        //   url: response.url,
        //   ok: response.ok
        // });
        return await this.handleResponse(response);
      } catch (error) {
        lastError = error;
        console.error(`❌ API Request Error (Attempt ${attempt}):`, error);
        
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        // Check for mixed content error
        if (error.message.includes('mixed-content') || error.message.includes('blocked')) {
          console.error('Mixed content error detected. Please check your API URL configuration.');
          throw new Error('Mixed content error: Please ensure your API is accessible via HTTPS or configure CORS properly.');
        }

        // Check for network errors
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.error('Network error detected. Please check if your backend server is running.');
          throw new Error('Network error: Please ensure your backend server is running on https://khwanzay.school/api');
        }

        if (attempt === this.retryAttempts) {
          throw error;
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw lastError;
  }

  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, params = {}) {
    let url = endpoint;
    if (Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          // Ensure values are strings to prevent array coercion
          const value = Array.isArray(params[key]) ? params[key].join(',') : String(params[key]);
          searchParams.append(key, value);
        }
      });
      url += `?${searchParams.toString()}`;
    }

    return this.request(url);
  }

  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body
   * @returns {Promise<Object>} Response data
   */
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  }

  /**
   * Upload file
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with file
   * @returns {Promise<Object>} Response data
   */
  async upload(endpoint, formData) {
    const headers = this.getAuthHeaders();
    delete headers['Content-Type']; // Let browser set content-type for FormData

    return this.request(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData
    });
  }

  /**
   * Download file
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise<Blob>} File blob
   */
  async download(endpoint, params = {}) {
    const url = new URL(`${this.baseURL}${endpoint}`);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    const response = await fetch(url.toString(), {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return response.blob();
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    rbac.clearUser();
    
    // Dispatch event for AuthContext to handle
    window.dispatchEvent(new CustomEvent('sessionExpired'));
  }

  /**
   * Verify authentication token
   * @returns {Promise<Object>} User data
   */
  async verifyToken() {
    try {
      const response = await this.get(API_ENDPOINTS.VERIFY_TOKEN);
      return response.data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService; 