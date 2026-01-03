import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Car Types Management Hook
 * Handles all car type and fee-related operations
 */
export const useCarTypes = (params = {}) => {
  const [carTypes, setCarTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all car types
   * @returns {Promise<Array>} Car types list
   */
  const getAllCarTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllCarTypes();
      return response?.data || [];
    } catch (err) {
      setError(err.message || 'خطا در دریافت انواع موتر');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load all car types
   */
  const loadCarTypes = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllCarTypes(filters);
      
      // Debug: Log the response
      // console.log('🔍 Car Types API Response:', response);
      
      // Handle different response formats
      let carTypesData = [];
      if (response.data && Array.isArray(response.data)) {
        carTypesData = response.data;
      } else if (Array.isArray(response)) {
        carTypesData = response;
      } else if (response.data && typeof response.data === 'object') {
        carTypesData = Object.values(response.data);
      } else {
        carTypesData = [];
      }
      
      // console.log('🔍 Car Types Data After Processing:', carTypesData);
      setCarTypes(carTypesData);
    } catch (err) {
      console.error('Error loading car types:', err);
      setError(err.message || 'خطا در بارگذاری انواع خودرو');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get active car types
   * @returns {Promise<Array>} Active car types
   */
  const getActiveCarTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getActiveCarTypes();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save car type
   * @param {Object} carTypeData - Car type data
   * @returns {Promise<Object>} Car type response
   */
  const saveCarType = useCallback(async (carTypeData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.saveCarType(carTypeData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get car type by ID
   * @param {number} carTypeId - Car type ID
   * @returns {Promise<Object>} Car type data
   */
  const getCarTypeById = useCallback(async (carTypeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getCarTypeById(carTypeId);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete car type
   * @param {number} carTypeId - Car type ID
   * @returns {Promise<Object>} Delete response
   */
  const deleteCarType = useCallback(async (carTypeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.deleteCarType(carTypeId);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Change car type status
   * @param {number} carTypeId - Car type ID
   * @param {boolean} status - New status
   * @returns {Promise<Object>} Status change response
   */
  const changeCarTypeStatus = useCallback(async (carTypeId, status) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.changeCarTypeStatus(carTypeId, status);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ==================== CAR TYPE FEES ====================

  /**
   * Get all car type fees
   * @returns {Promise<Array>} Car type fees list
   */
  const getAllCarTypeFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllCarTypeFees();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Save car type fee
   * @param {Object} feeData - Fee data
   * @returns {Promise<Object>} Fee response
   */
  const saveCarTypeFee = useCallback(async (feeData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.saveCarTypeFee(feeData);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get car type fee by ID
   * @param {number} feeId - Fee ID
   * @returns {Promise<Object>} Fee data
   */
  const getCarTypeFeeById = useCallback(async (feeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getCarTypeFeeById(feeId);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Delete car type fee
   * @param {number} feeId - Fee ID
   * @returns {Promise<Object>} Delete response
   */
  const deleteCarTypeFee = useCallback(async (feeId) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.deleteCarTypeFee(feeId);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Change car type fee status
   * @param {number} feeId - Fee ID
   * @param {boolean} status - New status
   * @returns {Promise<Object>} Status change response
   */
  const changeCarTypeFeeStatus = useCallback(async (feeId, status) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.changeCarTypeFeeStatus(feeId, status);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load car types on mount
  useEffect(() => {
    loadCarTypes(params);
  }, []);

  return {
    carTypes,
    loading,
    error,
    loadCarTypes,
    getAllCarTypes: loadCarTypes, // Alias for consistency with original
    getActiveCarTypes,
    saveCarType,
    getCarTypeById,
    deleteCarType,
    changeCarTypeStatus,
    getAllCarTypeFees,
    saveCarTypeFee,
    getCarTypeFeeById,
    deleteCarTypeFee,
    changeCarTypeFeeStatus,
  };
}; 