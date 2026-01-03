import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import secureApiService from '../../../services/secureApiService';

interface SearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  score: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  createdAt: string;
}

interface CustomerAdvancedSearchProps {
  onCustomerSelect?: (customer: any) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

const CustomerAdvancedSearch: React.FC<CustomerAdvancedSearchProps> = ({
  onCustomerSelect,
  loading = false,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [filters, setFilters] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<any>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSavedSearches();
    loadAvailableFilters();
  }, []);

  useEffect(() => {
    if (searchQuery.length > 2) {
      getSearchSuggestions(searchQuery).then(setSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [searchQuery]);

  const loadSavedSearches = async () => {
    try {
      const response = await secureApiService.getSavedSearches();
      if (response.success) {
        setSavedSearches(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load saved searches');
      }
    } catch (err: any) {
      
    }
  };

  const loadAvailableFilters = async () => {
    try {
      const response = await secureApiService.getFilters();
      if (response.success) {
        setFilters(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to load filters');
      }
    } catch (err: any) {
      
    }
  };

  const getSearchSuggestions = async (query: string) => {
    try {
      const response = await secureApiService.getSearchSuggestions(query);
      if (response.success) {
        return response.data || [];
      } else {
        throw new Error(response.message || 'Failed to get search suggestions');
      }
    } catch (error: any) {
      console.error('Error getting search suggestions:', error);
      return [];
    }
  };

  const searchCustomers = async (searchParams: any) => {
    try {
      setLoading(true);
      const response = await secureApiService.advancedSearch(searchParams);
      if (response.success) {
        setSearchResults(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to search customers');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to search customers');
    } finally {
      setLoading(false);
    }
  };

  const saveSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const searchData = {
        name: `Search: ${searchQuery}`,
        query: searchQuery,
        filters: selectedFilters
      };
      
      const response = await secureApiService.saveSearch(searchData);
      setSavedSearches(prev => [response.data, ...prev]);
      Alert.alert('Success', 'Search saved successfully');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save search');
    }
  };

  const deleteSavedSearch = async (searchId: string) => {
    Alert.alert(
      'Delete Saved Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureApiService.deleteSavedSearch(searchId);
              setSavedSearches(prev => prev.filter(s => s.id !== searchId));
              Alert.alert('Success', 'Search deleted successfully');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete search');
            }
          }
        }
      ]
    );
  };

  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    setSelectedFilters(savedSearch.filters);
    searchCustomers({ query: savedSearch.query, filters: savedSearch.filters });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadSavedSearches(),
      loadAvailableFilters()
    ]);
    setRefreshing(false);
    onRefresh?.();
  };

  const renderSearchResult = (result: SearchResult) => (
    <TouchableOpacity
      key={result.id}
      style={styles.searchResultCard}
      onPress={() => onCustomerSelect?.(result)}
    >
      <View style={styles.resultHeader}>
        <Text style={styles.resultName}>{result.name}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{result.score}%</Text>
        </View>
      </View>
      
      <Text style={styles.resultEmail}>{result.email}</Text>
      <Text style={styles.resultPhone}>{result.phone}</Text>
      
      <View style={styles.resultFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(result.status) }]}>
          <Text style={styles.statusText}>{result.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSavedSearch = (savedSearch: SavedSearch) => (
    <TouchableOpacity
      key={savedSearch.id}
      style={styles.savedSearchCard}
      onPress={() => loadSavedSearch(savedSearch)}
    >
      <View style={styles.savedSearchHeader}>
        <Text style={styles.savedSearchName}>{savedSearch.name}</Text>
        <TouchableOpacity
          onPress={() => deleteSavedSearch(savedSearch.id)}
          style={styles.deleteButton}
        >
          <MaterialIcons name="delete" size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>
      <Text style={styles.savedSearchQuery}>{savedSearch.query}</Text>
      <Text style={styles.savedSearchDate}>
        {new Date(savedSearch.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return '#10b981';
      case 'inactive':
        return '#6b7280';
      case 'pending':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorCard}>
          <View style={styles.errorContent}>
            <MaterialIcons name="error" size={24} color="#dc2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        </View>
      )}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialIcons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search customers..."
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={() => searchCustomers({ query: searchQuery, filters: selectedFilters })}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="clear" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.searchButton} onPress={() => searchCustomers({ query: searchQuery, filters: selectedFilters })}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => {
                setSearchQuery(suggestion);
                setShowSuggestions(false);
                searchCustomers({ query: suggestion, filters: selectedFilters });
              }}
            >
              <MaterialIcons name="search" size={16} color="#6b7280" />
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#6366f1']} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 20 }} />
        ) : searchResults.length > 0 ? (
          <View style={styles.resultsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Search Results ({searchResults.length})</Text>
              <TouchableOpacity onPress={saveSearch}>
                <MaterialIcons name="bookmark-border" size={20} color="#6366f1" />
              </TouchableOpacity>
            </View>
            {searchResults.map(renderSearchResult)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="search" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        )}

        <View style={styles.savedSearchesSection}>
          <Text style={styles.sectionTitle}>Saved Searches</Text>
          {savedSearches.map(renderSavedSearch)}
          
          {savedSearches.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="bookmark" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No saved searches</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  errorCard: {
    margin: 16,
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    marginLeft: 8,
    color: '#dc2626',
    fontSize: 14,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  resultsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  searchResultCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  scoreBadge: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  resultEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  resultPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  savedSearchesSection: {
    marginBottom: 24,
  },
  savedSearchCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  savedSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedSearchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  deleteButton: {
    padding: 4,
  },
  savedSearchQuery: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  savedSearchDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: '#9ca3af',
  },
});

export default CustomerAdvancedSearch; 
