import { useState, useCallback } from 'react';
import { customerSearchApi } from '../../../services/api/client';

const useCustomerSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [autocomplete, setAutocomplete] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [availableFilters, setAvailableFilters] = useState<any[]>([]);

  // Advanced search
  const advancedSearch = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.advancedSearch(params);
      setSearchResults(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to perform advanced search');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get search suggestions
  const getSearchSuggestions = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.getSearchSuggestions(params);
      setSuggestions(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch search suggestions');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get autocomplete
  const getAutocomplete = useCallback(async (params?: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.getAutocomplete(params);
      setAutocomplete(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch autocomplete');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save search
  const saveSearch = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.saveSearch(data);
      await getSavedSearches();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to save search');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get saved searches
  const getSavedSearches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.getSavedSearches();
      setSavedSearches(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch saved searches');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete saved search
  const deleteSavedSearch = useCallback(async (searchId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.deleteSavedSearch(searchId);
      await getSavedSearches();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to delete saved search');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getSavedSearches]);

  // Get available filters
  const getAvailableFilters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.getAvailableFilters();
      setAvailableFilters(response.data || response);
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch available filters');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create custom filter
  const createCustomFilter = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await customerSearchApi.createCustomFilter(data);
      await getAvailableFilters();
      return response.data || response;
    } catch (err: any) {
      setError(err.message || 'Failed to create custom filter');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAvailableFilters]);

  return {
    loading,
    error,
    searchResults,
    suggestions,
    autocomplete,
    savedSearches,
    availableFilters,
    advancedSearch,
    getSearchSuggestions,
    getAutocomplete,
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    getAvailableFilters,
    createCustomFilter,
  };
};

export default useCustomerSearch; 
