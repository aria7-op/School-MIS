import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

/**
 * Hook for managing car type fees and parking rates
 * Provides fee data with loading states and error handling
 */
export const useFees = (params = {}) => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Get all fees
   * @returns {Promise<Array>} Fees list
   */
  const getAllFees = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getAllCarTypeFees();
      return response?.data || [];
    } catch (err) {
      setError(err.message || 'خطا در دریافت نرخ‌ها');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load fees data
   */
  const loadFees = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Loading fees...');
      const response = await apiService.getAllCarTypeFees();
      console.log('Fees API response:', response);
      
      // Handle both response formats (with and without data property)
      let feesData = [];
      if (response && response.data) {
        feesData = response.data || [];
      } else if (Array.isArray(response)) {
        feesData = response;
      } else if (response && typeof response === 'object') {
        feesData = Object.values(response);
      }
      
      console.log('Processed fees data:', feesData);
      
      // Apply filters
      if (filters.carTypeId) {
        feesData = feesData.filter(fee => fee.carTypeId === filters.carTypeId);
      }

      if (filters.parkingTypeId) {
        feesData = feesData.filter(fee => fee.parkingTypeId === filters.parkingTypeId);
      }

      if (filters.status !== undefined) {
        feesData = feesData.filter(fee => fee.status === filters.status);
      }

      setFees(feesData);
    } catch (err) {
      console.error('Error loading fees:', err);
      setError(err.message || 'خطا در بارگذاری نرخ ها');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save fee
   */
  const saveFee = async (feeData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.saveCarTypeFee(feeData);
      
      // Backend returns data directly, not wrapped in success property
      if (response && response.data) {
        // Reload fees after successful save
        await loadFees(params);
        return response;
      } else {
        setError(response?.message || 'خطا در ذخیره نرخ');
        return response;
      }
    } catch (err) {
      setError(err.message || 'خطا در ذخیره نرخ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete fee
   */
  const deleteFee = async (feeId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.deleteCarTypeFee(feeId);
      
      if (response.success) {
        // Reload fees after successful deletion
        await loadFees(params);
        return response;
      } else {
        setError(response.message || 'خطا در حذف نرخ');
        return response;
      }
    } catch (err) {
      setError(err.message || 'خطا در حذف نرخ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change fee status
   */
  const changeFeeStatus = async (feeId, status) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.changeCarTypeFeeStatus(feeId, status);
      
      if (response.success) {
        // Reload fees after successful status change
        await loadFees(params);
        return response;
      } else {
        setError(response.message || 'خطا در تغییر وضعیت نرخ');
        return response;
      }
    } catch (err) {
      setError(err.message || 'خطا در تغییر وضعیت نرخ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get fee by ID
   */
  const getFeeById = async (feeId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getCarTypeFeeById(feeId);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.message || 'نرخ یافت نشد');
        return null;
      }
    } catch (err) {
      setError(err.message || 'خطا در دریافت نرخ');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get fees by car type
   */
  const getFeesByCarType = (carTypeId) => {
    return fees.filter(fee => fee.carTypeId === carTypeId);
  };

  /**
   * Get fees by parking type
   */
  const getFeesByParkingType = (parkingTypeId) => {
    return fees.filter(fee => fee.parkingTypeId === parkingTypeId);
  };

  /**
   * Get active fees
   */
  const getActiveFees = () => {
    return fees.filter(fee => fee.status);
  };

  /**
   * Get inactive fees
   */
  const getInactiveFees = () => {
    return fees.filter(fee => !fee.status);
  };

  /**
   * Calculate fee for a session
   */
  const calculateFee = (carTypeId, parkingTypeId, duration) => {
    const fee = fees.find(f => 
      f.carTypeId === carTypeId && 
      f.parkingTypeId === parkingTypeId && 
      f.status
    );
    
    if (!fee) return 0;
    return duration * fee.amount;
  };

  /**
   * Get fee amount
   */
  const getFeeAmount = (carTypeId, parkingTypeId) => {
    const fee = fees.find(f => 
      f.carTypeId === carTypeId && 
      f.parkingTypeId === parkingTypeId && 
      f.status
    );
    
    return fee ? fee.amount : 0;
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR'
    }).format(amount);
  };

  // Load fees on mount and when params change
  useEffect(() => {
    loadFees(params);
  }, []);

  return {
    fees,
    loading,
    error,
    loadFees,
    saveFee,
    deleteFee,
    changeFeeStatus,
    getFeeById,
    getFeesByCarType,
    getFeesByParkingType,
    getActiveFees,
    getInactiveFees,
    calculateFee,
    getFeeAmount,
    formatCurrency,
    getAllFees
  };
}; 