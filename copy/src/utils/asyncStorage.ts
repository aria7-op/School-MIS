// Web-compatible storage utility using localStorage

// Storage keys constants
export const STORAGE_KEYS = {
  // Auth related
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  USER_PREFERENCES: 'user_preferences',
  
  // App settings
  APP_SETTINGS: 'app_settings',
  THEME: 'theme',
  LANGUAGE: 'language',
  NOTIFICATIONS: 'notifications',
  
  // Data caching
  CUSTOMER_CACHE: 'customer_cache',
  ANALYTICS_CACHE: 'analytics_cache',
  DASHBOARD_CACHE: 'dashboard_cache',
  REPORTS_CACHE: 'reports_cache',
  
  // Offline data
  OFFLINE_QUEUE: 'offline_queue',
  SYNC_STATUS: 'sync_status',
  
  // User preferences
  DASHBOARD_LAYOUT: 'dashboard_layout',
  CHART_PREFERENCES: 'chart_preferences',
  FILTER_PREFERENCES: 'filter_preferences',
  
  // Session data
  LAST_SYNC: 'last_sync',
  SESSION_DATA: 'session_data',
} as const;

// Type for storage keys
export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// Storage utility class
class StorageManager {
  /**
   * Store data with error handling
   */
  async setItem(key: StorageKey, value: any): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify(value);
      localStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Retrieve data with error handling
   */
  async getItem<T = any>(key: StorageKey): Promise<T | null> {
    try {
      const jsonValue = localStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Remove specific item
   */
  async removeItem(key: StorageKey): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<boolean> {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Get all keys
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) keys.push(key);
      }
      return keys;
    } catch (error) {
      
      return [];
    }
  }

  /**
   * Multi-get operation
   */
  async multiGet(keys: StorageKey[]): Promise<[string, any][]> {
    try {
      const result: [string, any][] = [];
      for (const key of keys) {
        const value = localStorage.getItem(key);
        result.push([key, value ? JSON.parse(value) : null]);
      }
      return result;
    } catch (error) {
      
      return [];
    }
  }

  /**
   * Multi-set operation
   */
  async multiSet(keyValuePairs: [StorageKey, any][]): Promise<boolean> {
    try {
      for (const [key, value] of keyValuePairs) {
        localStorage.setItem(key, JSON.stringify(value));
      }
      return true;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async hasKey(key: StorageKey): Promise<boolean> {
    try {
      return localStorage.getItem(key) !== null;
    } catch (error) {
      
      return false;
    }
  }

  /**
   * Get storage size info
   */
  async getStorageInfo(): Promise<{ size: number; keys: string[] }> {
    try {
      const keys = await this.getAllKeys();
      const size = keys.length;
      return { size, keys: [...keys] };
    } catch (error) {
      
      return { size: 0, keys: [] };
    }
  }

  /**
   * Cache data with expiration
   */
  async setCacheData(key: StorageKey, data: any, expirationMinutes: number = 60): Promise<boolean> {
    const cacheData = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (expirationMinutes * 60 * 1000)
    };
    return this.setItem(key, cacheData);
  }

  /**
   * Get cached data with expiration check
   */
  async getCacheData<T = any>(key: StorageKey): Promise<T | null> {
    try {
      const cacheData = await this.getItem<{ data: T; timestamp: number; expiresAt: number }>(key);
      
      if (!cacheData) return null;
      
      if (Date.now() > cacheData.expiresAt) {
        await this.removeItem(key);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      
      return null;
    }
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    try {
      const keys = await this.getAllKeys();
      const cacheKeys = keys.filter(key => key.includes('_cache'));
      let clearedCount = 0;

      for (const key of cacheKeys) {
        const cacheData = await this.getItem<{ expiresAt: number }>(key as StorageKey);
        if (cacheData && Date.now() > cacheData.expiresAt) {
          await this.removeItem(key as StorageKey);
          clearedCount++;
        }
      }

      return clearedCount;
    } catch (error) {
      
      return 0;
    }
  }
}

// Export singleton instance
export const storageManager = new StorageManager();

// Convenience functions
export const setItem = (key: StorageKey, value: any) => storageManager.setItem(key, value);
export const getItem = <T = any>(key: StorageKey) => storageManager.getItem<T>(key);
export const removeItem = (key: StorageKey) => storageManager.removeItem(key);
export const clear = () => storageManager.clear();
export const getAllKeys = () => storageManager.getAllKeys();
export const multiGet = (keys: StorageKey[]) => storageManager.multiGet(keys);
export const multiSet = (keyValuePairs: [StorageKey, any][]) => storageManager.multiSet(keyValuePairs);
export const hasKey = (key: StorageKey) => storageManager.hasKey(key);
export const getStorageInfo = () => storageManager.getStorageInfo();
export const setCacheData = (key: StorageKey, data: any, expirationMinutes?: number) => 
  storageManager.setCacheData(key, data, expirationMinutes);
export const getCacheData = <T = any>(key: StorageKey) => storageManager.getCacheData<T>(key);
export const clearExpiredCache = () => storageManager.clearExpiredCache();

export default storageManager;

export const setStorageItem = async (key: string, value: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    
  }
};

export const getStorageItem = async <T = any>(key: string): Promise<T | null> => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (e) {
    
    return null;
  }
};

export const removeStorageItem = async (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    
  }
}; 
