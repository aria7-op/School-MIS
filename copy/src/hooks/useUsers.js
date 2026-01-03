import { useState, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Users Hook
 * Handles all user management operations
 */
export const useUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all users
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Users list
   */
  const getAllUsers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllUsers(params);
      return response?.data || [];
    } catch (err) {
      setError(err.message || 'خطا در دریافت لیست کاربران');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User data
   */
  const getUserById = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserById(userId);
      return response?.data;
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات کاربر');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save user (create/update)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} User response
   */
  const saveUser = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.saveUser(userData);
      return response?.data;
    } catch (err) {
      setError(err.message || 'خطا در ذخیره کاربر');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Reset user password
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Reset response
   */
  const resetUserPassword = useCallback(async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.resetUserPassword(userId);
      return response?.data;
    } catch (err) {
      setError(err.message || 'خطا در بازنشانی رمز عبور');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get out users
   * @returns {Promise<Array>} Out users list
   */
  const getOutUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getOutUser();
      return response?.data || [];
    } catch (err) {
      setError(err.message || 'خطا در دریافت کاربران خروج');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAllUsers,
    getUserById,
    saveUser,
    resetUserPassword,
    getOutUsers
  };
}; 