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
 * Hook for managing parking sessions
 * Provides parking session data with loading states and error handling
 */
export const useParkingSessions = (params = {}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    overdue: 0
  });

  /**
   * Load parking sessions
   */
  const loadSessions = async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Get parking status data
      const [statusTrue, statusFalse] = await Promise.all([
        apiService.getTotalParkingStatusTrue(),
        apiService.getTotalParkingStatusFalse()
      ]);

      // Get detailed parking data - fetch both active and completed
      const [activeParking, completedParking] = await Promise.all([
        apiService.getAllNotifications({ status: 1 }),
        apiService.getAllNotifications({ status: 2 })
      ]);

      // Combine both active and completed parking data
      let sessionsData = [];
      
      // Add active parking
      if (Array.isArray(activeParking)) {
        sessionsData = sessionsData.concat(activeParking);
      } else if (activeParking && Array.isArray(activeParking.data)) {
        sessionsData = sessionsData.concat(activeParking.data);
      }
      
      // Add completed parking
      if (Array.isArray(completedParking)) {
        sessionsData = sessionsData.concat(completedParking);
      } else if (completedParking && Array.isArray(completedParking.data)) {
        sessionsData = sessionsData.concat(completedParking.data);
      }

      // Apply filters ONLY on sessionsData
      let filteredSessions = sessionsData;
      
      if (filters.status) {
        filteredSessions = filteredSessions.filter(session => 
          session.status === filters.status
        );
      }

      if (filters.carType) {
        filteredSessions = filteredSessions.filter(session => 
          session.car_type_id === filters.carType
        );
      }

      if (filters.dateRange) {
        filteredSessions = filteredSessions.filter(session => {
          const sessionDate = safeParseDate(session.created_at);
          if (!sessionDate) return false;
          
          const startDate = safeParseDate(filters.dateRange.startDate);
          const endDate = safeParseDate(filters.dateRange.endDate);
          
          if (!startDate || !endDate) return false;
          
          return sessionDate >= startDate && sessionDate <= endDate;
        });
      }

      setSessions(filteredSessions);

      // Calculate stats from actual data
      const total = sessionsData.length;
      const active = sessionsData.filter(session => session.status === '1').length;
      const completed = sessionsData.filter(session => session.status === '2').length;
      const overdue = sessionsData.filter(session => {
        if (session.status === '1' && session.created_at) {
          const entryTime = safeParseDate(session.created_at);
          if (!entryTime) return false;
          
          const now = new Date();
          const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
          return hoursDiff > 24; // Overdue if more than 24 hours
        }
        return false;
      }).length;

      setStats({
        total,
        active,
        completed,
        overdue
      });
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError(err.message || 'خطا در بارگذاری جلسات پارکینگ');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save car entry
   */
  const saveCarEntry = async (entryData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.saveCarEntry(entryData);
      
      // Backend returns data directly, not wrapped in success property
      if (response && response.data) {
        // Reload sessions after successful entry
        await loadSessions(params);
        return response;
      } else {
        setError(response?.message || 'خطا در ثبت ورود موتر');
        return response;
      }
    } catch (err) {
      setError(err.message || 'خطا در ثبت ورود موتر');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save car exit
   */
  const saveCarExit = async (exitData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.saveCarExit(exitData);
      
      // Backend returns data directly, not wrapped in success property
      if (response && response.data) {
        // Reload sessions after successful exit
        await loadSessions(params);
        return response;
      } else {
        setError(response?.message || 'خطا در ثبت خروج موتر');
        return response;
      }
    } catch (err) {
      setError(err.message || 'خطا در ثبت خروج موتر');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Find car by code
   */
  const findCarByCode = async (code) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.findCarByCode(code);
      
      // Backend returns data directly, not wrapped in success property
      if (response && response.data) {
        return response.data;
      } else {
        setError(response?.message || 'موتر یافت نشد');
        return null;
      }
    } catch (err) {
      setError(err.message || 'خطا در جستجوی موتر');
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reject car entry
   */
  const rejectCarEntry = async (parkingId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.rejectCarEntry(parkingId);
      
      // Backend returns data directly, not wrapped in success property
      if (response && response.data) {
        // Reload sessions after rejection
        await loadSessions(params);
        return response;
      } else {
        setError(response?.message || 'خطا در رد کردن ورود موتر');
        return response;
      }
    } catch (err) {
      setError(err.message || 'خطا در رد کردن ورود موتر');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ignore payment
   */
  const ignorePayment = async (code) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.ignorePayment(code);
      
      // Backend returns data directly, not wrapped in success property
      if (response && response.data) {
        // Reload sessions after ignoring payment
        await loadSessions(params);
        return response;
      } else {
        setError(response?.message || 'خطا در صرف نظر کردن از پرداخت');
        return response;
      }
    } catch (err) {
      setError(err.message || 'خطا در صرف نظر کردن از پرداخت');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get session by ID
   */
  const getSessionById = (sessionId) => {
    return sessions.find(session => session.id === sessionId);
  };

  /**
   * Get active sessions
   */
  const getActiveSessions = () => {
    return sessions.filter(session => session.status === '1');
  };

  /**
   * Get completed sessions
   */
  const getCompletedSessions = () => {
    return sessions.filter(session => session.status === '2');
  };

  /**
   * Get overdue sessions
   */
  const getOverdueSessions = () => {
    return sessions.filter(session => {
      if (session.status === '1' && session.created_at) {
        const entryTime = safeParseDate(session.created_at);
        if (!entryTime) return false;
        
        const now = new Date();
        const hoursDiff = (now - entryTime) / (1000 * 60 * 60);
        return hoursDiff > 24;
      }
      return false;
    });
  };

  /**
   * Calculate session duration
   */
  const calculateDuration = (entryTime, exitTime = null) => {
    const entry = safeParseDate(entryTime);
    if (!entry) return 0;
    
    const exit = exitTime ? safeParseDate(exitTime) : new Date();
    if (!exit) return 0;
    
    const diffMs = exit - entry;
    const diffHours = diffMs / (1000 * 60 * 60);
    return Math.ceil(diffHours);
  };

  /**
   * Calculate session cost
   */
  const calculateCost = (session) => {
    if (!session.fee) return 0;
    return parseFloat(session.fee) || 0;
  };

  /**
   * Format session data for display
   */
  const formatSession = (session) => {
    return {
      ...session,
      id: session.id,
      card_number: session.code,
      cardNumber: session.code,
      entry_time: session.created_at,
      entryTime: session.created_at,
      exit_time: session.updated_at,
      exitTime: session.updated_at,
      status: session.status === '1' ? 'active' : session.status === '2' ? 'completed' : 'overdue',
      zone: session.parking_type,
      fee: session.fee,
      duration: calculateDuration(session.created_at, session.updated_at),
      cost: calculateCost(session),
      isActive: session.status === '1',
      isOverdue: session.status === '1' && calculateDuration(session.created_at) > 24
    };
  };

  // Load sessions on mount and when params change
  useEffect(() => {
    loadSessions(params);
  }, []);

  return {
    sessions: Array.isArray(sessions) ? sessions.map(formatSession) : [],
    loading,
    error,
    stats,
    loadSessions,
    saveCarEntry,
    saveCarExit,
    findCarByCode,
    rejectCarEntry,
    ignorePayment,
    getSessionById,
    getActiveSessions: () => Array.isArray(sessions) ? getActiveSessions().map(formatSession) : [],
    getCompletedSessions: () => Array.isArray(sessions) ? getCompletedSessions().map(formatSession) : [],
    getOverdueSessions: () => Array.isArray(sessions) ? getOverdueSessions().map(formatSession) : [],
    calculateDuration,
    calculateCost,
    formatSession
  };
}; 