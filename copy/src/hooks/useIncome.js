import { useState, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Income Hook
 * Handles all income management operations
 */
export const useIncome = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all income records
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Income list
   */
  const getAllIncome = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllIncome(params);
      // Fix: handle both array and object with data property
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (err) {
      setError(err.message || 'خطا در دریافت لیست عواید');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get income by ID
   * @param {number} incomeId - Income ID
   * @returns {Promise<Object>} Income data
   */
  const getIncomeById = useCallback(async (incomeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getIncomeById(incomeId);
      return response?.data;
    } catch (err) {
      setError(err.message || 'خطا در دریافت اطلاعات عواید');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save income record
   * @param {Object} incomeData - Income data
   * @returns {Promise<Object>} Income response
   */
  const saveIncome = useCallback(async (incomeData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.saveIncome(incomeData);
      return response?.data;
    } catch (err) {
      setError(err.message || 'خطا در ذخیره عواید');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Approve income
   * @param {number} incomeId - Income ID
   * @returns {Promise<Object>} Approve response
   */
  const approveIncome = useCallback(async (incomeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.approveIncome(incomeId);
      return response?.data;
    } catch (err) {
      setError(err.message || 'خطا در تایید عواید');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete income
   * @param {number} incomeId - Income ID
   * @returns {Promise<Object>} Delete response
   */
  const deleteIncome = useCallback(async (incomeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.deleteIncome(incomeId);
      return response?.data;
    } catch (err) {
      setError(err.message || 'خطا در حذف عواید');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getAllIncome,
    getIncomeById,
    saveIncome,
    approveIncome,
    deleteIncome
  };
}; 