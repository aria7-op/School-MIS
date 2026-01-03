// api.tsx
import axios from 'axios';

const API_BASE_URL = 'https://khwanzay.school/api';

// Safe AsyncStorage wrapper functions
const getCache = async (key: string) => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const cached = await AsyncStorage.default.getItem(key);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.warn('AsyncStorage not available:', error);
    return null;
  }
};

const setCache = async (key: string, value: any) => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('AsyncStorage not available:', error);
  }
};

const clearCache = async (key: string) => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.removeItem(key);
  } catch (error) {
    console.warn('AsyncStorage not available:', error);
  }
};

const api = {

      getUsers: async (token: string) => {
    const cacheKey = 'users_cache';
    const cached = await getCache(cacheKey);
    if (cached) {
      // Optionally, return cached data here if you want to use it before the API call
      // return cached;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      await clearCache(cacheKey);
      return response.data;
    } catch (error) {
      if (cached) return cached;
      
      throw error;
    }
  },

  getStudents: async () => {
    const cacheKey = 'students_cache';
    const cached = await getCache(cacheKey);
    if (cached) {
      // Optionally, return cached data here if you want to use it before the API call
      // return cached;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/students`);
      await clearCache(cacheKey);
      return response.data;
    } catch (error) {
      if (cached) return cached;
      
      throw error;
    }
  },

  registerUser: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    const cacheKey = 'register_user_cache';
    const prev = await getCache(cacheKey);
    if (prev) await setCache(cacheKey, prev);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      await clearCache(cacheKey);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Registration failed'
        );
      }
      throw new Error('Network error');
    }
  },
  // ... other API methods
};

// src/services/api/endpoints.ts
// import axios from 'axios';

// const API_BASE_URL = 'https://sapi.ariadeltatravel.com/api';

// export default {

//   // Add other API methods here...
// };
export default api;
