const BASE_URL = 'https://khwanzay.school/api';

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
  // ... other endpoints

  getStudents: async (token: string) => {
    const cacheKey = 'students_cache';
    const cached = await getCache(cacheKey);
    if (cached) {
      // Optionally, return cached data here if you want to use it before the API call
      // return cached;
    }
    const response = await fetch(`${BASE_URL}/students`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      if (cached) return cached;
      throw new Error('Failed to fetch students');
    }
    const data = await response.json();
    await clearCache(cacheKey);
    return data;
  },

  createPayment: async (token: string, paymentData: any) => {
    const cacheKey = 'payments_cache';
    const prevPayments = await getCache(cacheKey);
    if (prevPayments) await setCache(cacheKey, prevPayments);
    const response = await fetch(`${BASE_URL}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    if (!response.ok) {
      throw new Error('Failed to create payment');
    }
    await clearCache(cacheKey);
    return await response.json();
  },

  // Added getStaffMembers function
  getStaffMembers: async (token: string) => {
    const cacheKey = 'staff_cache';
    const cached = await getCache(cacheKey);
    if (cached) {
      // Optionally, return cached data here if you want to use it before the API call
      // return cached;
    }
          const response = await fetch('https://sapi.ariadeltatravel.com/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) {
      if (cached) return cached;
      throw new Error('Failed to fetch staff members');
    }
    const data = await response.json();
    await clearCache(cacheKey);
    return data;
  }
};

export default api;
