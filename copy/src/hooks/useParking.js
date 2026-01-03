import { useState } from 'react';
import apiService from '../services/apiService';

export const useParking = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const saveCarEntry = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.saveCarEntry(data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const findByCode = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.findCarByCode(code);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveCarExit = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.saveCarExit(data);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const ignorePayment = async (code) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.ignorePayment(code);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveCarEntry,
    findByCode,
    saveCarExit,
    ignorePayment,
    loading,
    error
  };
}; 