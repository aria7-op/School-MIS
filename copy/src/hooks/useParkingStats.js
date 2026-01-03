import { useState, useEffect } from 'react';
import apiService from '../services/apiService';

/**
 * Safe date parsing function
 * @param {string|Date} dateValue - Date value to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
const safeParseDate = (dateValue) => {
  if (!dateValue) return null;
  
  try {
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn('Invalid date value:', dateValue);
    return null;
  }
};

/**
 * Hook for managing parking statistics
 * Provides parking statistics and analytics data with loading states and error handling
 */
export const useParkingStats = (params = {}) => {
  const [stats, setStats] = useState({
    totalParking: 0,
    activeParking: 0,
    completedParking: 0,
    totalIncome: 0,
    todayIncome: 0,
    monthlyIncome: 0,
    carTypeBreakdown: [],
    hourlyBreakdown: [],
    dailyBreakdown: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Load parking statistics
   */
  const loadStats = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Get all parking statistics
      const [
        statusTrue,
        statusFalse,
        carTypeTrue,
        carTypeFalse,
        parkingStatus,
        dailyIncome
      ] = await Promise.all([
        apiService.getTotalParkingStatusTrue(),
        apiService.getTotalParkingStatusFalse(),
        apiService.getParkingStatusByCarTypeTrue(),
        apiService.getParkingStatusByCarTypeFalse(),
        apiService.getAllNotifications({ status: 1 }), // Get active parking
        apiService.getDailyIncomeByUser(filters)
      ]);

      // Defensive: Always make parkingData an array
      let parkingData = [];
      if (Array.isArray(parkingStatus)) {
        parkingData = parkingStatus;
      } else if (parkingStatus.data && Array.isArray(parkingStatus.data)) {
        parkingData = parkingStatus.data;
      } else if (parkingStatus.data && typeof parkingStatus.data === 'object') {
        parkingData = Object.values(parkingStatus.data);
      } else {
        parkingData = [];
      }

      // Calculate basic stats from actual parking data
      let activeParking = parkingData.filter(session => session.status === '1').length;
      let completedParking = parkingData.filter(session => session.status === '2').length;
      const totalParking = activeParking + completedParking;

      // Calculate income stats - handle different response formats
      let totalIncome = 0;
      let todayIncome = 0;
      let monthlyIncome = 0;

      if (dailyIncome) {
        let incomeData = [];
        
        // Handle different response formats
        if (dailyIncome.data && Array.isArray(dailyIncome.data)) {
          incomeData = dailyIncome.data;
        } else if (Array.isArray(dailyIncome)) {
          incomeData = dailyIncome;
        } else if (dailyIncome.data && typeof dailyIncome.data === 'object') {
          incomeData = Object.values(dailyIncome.data);
        }
        
        if (incomeData.length > 0) {
          totalIncome = incomeData.reduce((sum, item) => sum + (item.income || 0), 0);
          
          const today = new Date();
          todayIncome = incomeData.find(item => {
            const itemDate = safeParseDate(item.date);
            return itemDate && itemDate.toDateString() === today.toDateString();
          })?.income || 0;
          
          // Calculate monthly income (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          monthlyIncome = incomeData
            .filter(item => {
              const itemDate = safeParseDate(item.date);
              return itemDate && itemDate >= thirtyDaysAgo;
            })
            .reduce((sum, item) => sum + (item.income || 0), 0);
        }
      }

      // Calculate car type breakdown
      const carTypeBreakdown = [];
      if (carTypeTrue && carTypeTrue.data && carTypeTrue.data.record) {
        carTypeTrue.data.record.forEach(item => {
          carTypeBreakdown.push({
            type: item.type,
            count: item.count,
            percentage: Math.round((item.count / totalParking) * 100)
          });
        });
      }

      // Generate hourly breakdown (last 24 hours)
      const hourlyBreakdown = [];
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - (i * 60 * 60 * 1000));
        const hourStr = hour.getHours().toString().padStart(2, '0');
        
        // Count parking sessions for this hour
        let count = 0;
        if (parkingData.length > 0) {
          count = parkingData.filter(session => {
            const sessionTime = safeParseDate(session.created_at);
            if (!sessionTime) return false;
            
            return sessionTime.getHours() === hour.getHours() &&
                   sessionTime.getDate() === hour.getDate() &&
                   sessionTime.getMonth() === hour.getMonth() &&
                   sessionTime.getFullYear() === hour.getFullYear();
          }).length;
        }

        hourlyBreakdown.push({
          hour: hourStr,
          count,
          label: `${hourStr}:00`
        });
      }

      // Generate daily breakdown (last 30 days)
      const dailyBreakdown = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = date.toISOString().split('T')[0];
        
        // Count parking sessions for this day
        let count = 0;
        let income = 0;
        
        if (parkingData.length > 0) {
          const daySessions = parkingData.filter(session => {
            const sessionDate = safeParseDate(session.created_at);
            if (!sessionDate) return false;
            return sessionDate.toISOString().split('T')[0] === dateStr;
          });
          count = daySessions.length;
          
          // Calculate income for this day
          income = daySessions.reduce((sum, session) => {
            return sum + (parseFloat(session.fee) || 0);
          }, 0);
        }

        dailyBreakdown.push({
          date: dateStr,
          count,
          income,
          label: date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' })
        });
      }

      setStats({
        totalParking,
        activeParking,
        completedParking,
        totalIncome,
        todayIncome,
        monthlyIncome,
        carTypeBreakdown,
        hourlyBreakdown,
        dailyBreakdown
      });
    } catch (err) {
      console.error('Error loading parking stats:', err);
      setError(err.message || 'خطا در بارگذاری آمار پارکینگ');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get car type statistics
   */
  const getCarTypeStats = () => {
    return stats.carTypeBreakdown;
  };

  /**
   * Get hourly statistics
   */
  const getHourlyStats = () => {
    return stats.hourlyBreakdown;
  };

  /**
   * Get daily statistics
   */
  const getDailyStats = () => {
    return stats.dailyBreakdown;
  };

  /**
   * Get income statistics
   */
  const getIncomeStats = () => {
    return {
      total: stats.totalIncome,
      today: stats.todayIncome,
      monthly: stats.monthlyIncome
    };
  };

  /**
   * Get parking statistics
   */
  const getParkingStats = () => {
    return {
      total: stats.totalParking,
      active: stats.activeParking,
      completed: stats.completedParking
    };
  };

  /**
   * Calculate growth percentage
   */
  const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  /**
   * Get top performing car types
   */
  const getTopCarTypes = (limit = 5) => {
    return stats.carTypeBreakdown
      .sort((a, b) => (b.count + b.completed) - (a.count + a.completed))
      .slice(0, limit);
  };

  /**
   * Get peak hours
   */
  const getPeakHours = (limit = 3) => {
    return stats.hourlyBreakdown
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  };

  /**
   * Get peak days
   */
  const getPeakDays = (limit = 7) => {
    return stats.dailyBreakdown
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
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

  /**
   * Format percentage
   */
  const formatPercentage = (value) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Load stats on mount and when params change
  useEffect(() => {
    loadStats(params);
  }, []);

  return {
    stats,
    loading,
    error,
    loadStats,
    getCarTypeStats,
    getHourlyStats,
    getDailyStats,
    getIncomeStats,
    getParkingStats,
    calculateGrowth,
    getTopCarTypes,
    getPeakHours,
    getPeakDays,
    formatCurrency,
    formatPercentage
  };
}; 