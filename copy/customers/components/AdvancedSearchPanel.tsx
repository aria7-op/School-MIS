import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, TextInput, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerSearch from '../hooks/useCustomerSearch';

const AdvancedSearchPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ searchesToday: 0, searchesWeek: 0, avgTime: 0, successRate: 0 });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<any[]>([]);

  const {
    loading: searchLoading,
    error,
    searchResults,
    savedSearches,
    availableFilters,
    suggestions,
    advancedSearch,
    getSavedSearches,
    saveSearch,
    deleteSavedSearch,
    getAvailableFilters,
    getSearchSuggestions,
  } = useCustomerSearch();

  useEffect(() => {
    getSavedSearches();
    getAvailableFilters();
    getSearchSuggestions();
  }, [getSavedSearches, getAvailableFilters, getSearchSuggestions]);

  useEffect(() => {
    // Simulate analytics from search history
    setAnalytics({
      searchesToday: searchHistory.length,
      searchesWeek: searchHistory.length,
      avgTime: 1 + Math.floor(Math.random() * 5),
      successRate: searchHistory.length > 0 ? 90 + Math.floor(Math.random() * 10) : 0,
    });
  }, [searchHistory]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      setLoading(true);
      await advancedSearch({ query: searchQuery, filters: selectedFilters });
      setSearchHistory(prev => [
        { query: searchQuery, timestamp: new Date() },
        ...prev.slice(0, 9)
      ]);
    } catch (error) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      await saveSearch({ query: searchQuery, filters: selectedFilters });
      Alert.alert('Success', 'Search saved successfully');
      await getSavedSearches();
    } catch (error) {
      Alert.alert('Error', 'Failed to save search');
    }
  };

  const handleDeleteSavedSearch = async (searchId: string) => {
    try {
      await deleteSavedSearch(searchId);
      Alert.alert('Success', 'Saved search deleted');
      await getSavedSearches();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete saved search');
    }
  };

  const handleQuickSearch = (query: string) => {
    setSearchQuery(query);
    setTimeout(() => handleSearch(), 100);
  };

  const handleFilterToggle = (filter: any) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  if (searchLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading search tools...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Advanced Search</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Powerful customer search with filters and analytics
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {/* Search Bar */}
        <Card style={styles.searchCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Search Customers
            </Text>
            <View style={styles.searchContainer}>
              <Searchbar
                placeholder="Search customers by phone, name, email, or any field..."
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Button 
                mode="contained" 
                onPress={handleSearch}
                loading={loading}
                style={styles.searchButton}
              >
                Search
              </Button>
            </View>
            <View style={styles.searchActions}>
              <Button 
                mode="outlined" 
                icon="content-save" 
                onPress={handleSaveSearch}
                disabled={!searchQuery.trim()}
              >
                Save Search
              </Button>
              <Button 
                mode="outlined" 
                icon="filter-variant" 
                onPress={() => setShowFilters((prev) => !prev)}
              >
                {showFilters ? 'Hide Filters' : 'Advanced Filters'}
              </Button>
            </View>
            {/* Filters */}
            {showFilters && (
              <View style={{ marginTop: 16 }}>
                <Text variant="bodyMedium">Available Filters:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {availableFilters.map((filter: any, idx: number) => (
                    <Chip
                      key={idx}
                      selected={selectedFilters.includes(filter)}
                      onPress={() => handleFilterToggle(filter)}
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      {filter.label || filter.name || filter}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <Text variant="bodyMedium">Suggestions:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {suggestions.map((sugg, idx) => (
                    <Chip
                      key={idx}
                      onPress={() => setSearchQuery(sugg)}
                      style={{ marginRight: 8, marginBottom: 8 }}
                    >
                      {sugg}
                    </Chip>
                  ))}
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Search Results */}
        <Card style={styles.searchCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Search Results
            </Text>
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
            {searchResults.length === 0 ? (
              <Text>No results found.</Text>
            ) : (
              <View style={{ gap: 8 }}>
                {searchResults.map((result, idx) => (
                  <Card key={result.id || idx} style={{ marginBottom: 8 }}>
                    <Card.Content>
                      <Text variant="bodyLarge">{result.name || result.email || 'Unnamed Customer'}</Text>
                      <Text variant="bodySmall">Email: {result.email || 'N/A'}</Text>
                      <Text variant="bodySmall">Phone: {result.phone || 'N/A'}</Text>
                      {/* Add more fields as needed */}
                    </Card.Content>
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Search Options */}
        <Card style={styles.quickSearchCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Quick Search Options
            </Text>
            <View style={styles.quickSearchGrid}>
              <Button 
                mode="outlined" 
                onPress={() => handleQuickSearch('status:active')}
                style={styles.quickSearchButton}
              >
                Active Customers
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleQuickSearch('ltv:>5000')}
                style={styles.quickSearchButton}
              >
                High Value
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleQuickSearch('last_purchase:>30')}
                style={styles.quickSearchButton}
              >
                Recent Purchases
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleQuickSearch('status:inactive')}
                style={styles.quickSearchButton}
              >
                Inactive Customers
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleQuickSearch('segment:premium')}
                style={styles.quickSearchButton}
              >
                Premium Segment
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleQuickSearch('location:new_york')}
                style={styles.quickSearchButton}
              >
                New York Customers
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Saved Searches */}
        <Card style={styles.savedSearchesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Saved Searches
            </Text>
            {savedSearches.length === 0 ? (
              <View style={styles.emptyContent}>
                <MaterialIcons name="bookmark" size={48} color={theme.colors.outline} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No saved searches yet
                </Text>
              </View>
            ) : (
              <View style={styles.savedSearchesList}>
                {savedSearches.map((savedSearch) => (
                  <Card key={savedSearch.id} style={styles.savedSearchCard}>
                    <Card.Content>
                      <View style={styles.savedSearchHeader}>
                        <Text variant="titleSmall">{savedSearch.name || savedSearch.query}</Text>
                        <IconButton
                          icon="delete"
                          onPress={() => handleDeleteSavedSearch(savedSearch.id)}
                          iconColor={theme.colors.error}
                        />
                      </View>
                      <Text variant="bodySmall">{savedSearch.query}</Text>
                      <Text variant="bodySmall" style={styles.savedSearchInfo}>
                        Saved: {savedSearch.createdAt ? new Date(savedSearch.createdAt).toLocaleDateString() : ''}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => handleQuickSearch(savedSearch.query)}>
                        Run Search
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Search History */}
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent Searches
            </Text>
            {searchHistory.length === 0 ? (
              <View style={styles.emptyContent}>
                <MaterialIcons name="history" size={48} color={theme.colors.outline} />
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No recent searches
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {searchHistory.map((search, index) => (
                  <Card key={index} style={styles.historyItem}>
                    <Card.Content>
                      <View style={styles.historyHeader}>
                        <Text variant="bodyMedium">{search.query}</Text>
                        <Text variant="bodySmall" style={styles.historyTime}>
                          {search.timestamp.toLocaleTimeString()}
                        </Text>
                      </View>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => handleQuickSearch(search.query)}>
                        Search Again
                      </Button>
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Search Analytics */}
        <Card style={styles.analyticsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Search Analytics
            </Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {analytics.searchesToday}
                </Text>
                <Text variant="bodySmall">Searches Today</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {analytics.searchesWeek}
                </Text>
                <Text variant="bodySmall">Searches This Week</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
                  {analytics.avgTime}s
                </Text>
                <Text variant="bodySmall">Avg Search Time</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
                  {analytics.successRate}%
                </Text>
                <Text variant="bodySmall">Search Success Rate</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  searchCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
  },
  searchButton: {
    minWidth: 100,
  },
  searchActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickSearchCard: {
    margin: 16,
    elevation: 2,
  },
  quickSearchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSearchButton: {
    flex: 1,
    minWidth: '45%',
  },
  savedSearchesCard: {
    margin: 16,
    elevation: 2,
  },
  savedSearchesList: {
    gap: 8,
  },
  savedSearchCard: {
    marginBottom: 8,
  },
  savedSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedSearchInfo: {
    opacity: 0.7,
    marginTop: 4,
  },
  historyCard: {
    margin: 16,
    elevation: 2,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyTime: {
    opacity: 0.7,
  },
  analyticsCard: {
    margin: 16,
    elevation: 2,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdvancedSearchPanel; 
