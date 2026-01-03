import { useState, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Reports Hook
 * Handles all reporting operations and analytics
 */
export const useReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get parking reports
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Parking reports data
   */
  const getParkingReports = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllCarDetails(params);
      return response?.data || [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get revenue analytics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Revenue analytics data
   */
  const getRevenueAnalytics = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getReport(params);
      return response?.data || {};
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get car type statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Car type statistics
   */
  const getCarTypeStats = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getParkingStatusByCarTypeTrue();
      return response?.data || [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get hourly statistics
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Hourly statistics
   */
  const getHourlyStats = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, return empty array - you can implement hourly stats later
      return [];
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Export report
   * @param {Object} params - Export parameters
   * @returns {Promise<Object>} Export response
   */
  const exportReport = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      // For now, just log the export request
      console.log('Export requested:', params);
      return { success: true, message: 'Export functionality to be implemented' };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get total parking status (bill status true)
   * @returns {Promise<Object>} Parking statistics
   */
  const getTotalParkingStatusTrue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getTotalParkingStatusTrue();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get total parking status (bill status false)
   * @returns {Promise<Object>} Parking statistics
   */
  const getTotalParkingStatusFalse = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getTotalParkingStatusFalse();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get parking status by car type (true)
   * @returns {Promise<Object>} Car type statistics
   */
  const getParkingStatusByCarTypeTrue = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getParkingStatusByCarTypeTrue();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get parking status by car type (false)
   * @returns {Promise<Object>} Car type statistics
   */
  const getParkingStatusByCarTypeFalse = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getParkingStatusByCarTypeFalse();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user work status in shift
   * @returns {Promise<Object>} User work statistics
   */
  const getUserWorkStatusInShift = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserWorkStatusInShift();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user work status out shift
   * @returns {Promise<Object>} User work statistics
   */
  const getUserWorkStatusOutShift = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserWorkStatusOutShift();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get parking status
   * @returns {Promise<Object>} Parking status
   */
  const getParkingStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getParkingStatus();
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user all records
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User records
   */
  const getUserAllRecords = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserAllRecords(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get daily income by user
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Daily income data
   */
  const getDailyIncomeByUser = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getDailyIncomeByUser(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get comprehensive report
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Report data
   */
  const getReport = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getReport(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get user log
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} User log data
   */
  const getUserLog = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getUserLog(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get record analysis
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Analysis data
   */
  const getRecordAnalysis = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getRecordAnalysis(params);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getParkingReports,
    getRevenueAnalytics,
    getCarTypeStats,
    getHourlyStats,
    exportReport,
    getTotalParkingStatusTrue,
    getTotalParkingStatusFalse,
    getParkingStatusByCarTypeTrue,
    getParkingStatusByCarTypeFalse,
    getUserWorkStatusInShift,
    getUserWorkStatusOutShift,
    getParkingStatus,
    getUserAllRecords,
    getDailyIncomeByUser,
    getReport,
    getUserLog,
    getRecordAnalysis,
  };
}; 