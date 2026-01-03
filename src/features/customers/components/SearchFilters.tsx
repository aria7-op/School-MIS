import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, Button, Chip, TextInput, SegmentedButtons, Slider } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { CustomerFilters } from '../types';

interface SearchFiltersProps {
  filters: CustomerFilters;
  onFiltersChange: (filters: CustomerFilters) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['basic']);
  const [localFilters, setLocalFilters] = useState<CustomerFilters>(filters);

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const updateFilter = (key: keyof CustomerFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters: CustomerFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const renderSection = (title: string, section: string, children: React.ReactNode) => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <Button
          mode="text"
          onPress={() => toggleSection(section)}
          style={styles.sectionHeader}
          icon={expandedSections.includes(section) ? 'chevron-up' : 'chevron-down'}
        >
          <Text style={styles.sectionTitle}>{title}</Text>
        </Button>
        
        {expandedSections.includes(section) && (
          <View style={styles.sectionContent}>
            {children}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderBasicFilters = () => (
    <>
      <TextInput
        mode="outlined"
        label="Search by name, email, or company"
        value={localFilters.search || ''}
        onChangeText={(value) => updateFilter('search', value)}
        style={styles.input}
        left={<TextInput.Icon icon="magnify" />}
      />

      <Text style={styles.fieldLabel}>Status</Text>
      <View style={styles.chipGroup}>
        {['lead', 'prospect', 'customer', 'inactive'].map((status) => (
          <Chip
            key={status}
            selected={localFilters.status === status}
            onPress={() => updateFilter('status', localFilters.status === status ? undefined : status)}
            style={styles.filterChip}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Chip>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Priority</Text>
      <View style={styles.chipGroup}>
        {['low', 'medium', 'high'].map((priority) => (
          <Chip
            key={priority}
            selected={localFilters.priority === priority}
            onPress={() => updateFilter('priority', localFilters.priority === priority ? undefined : priority)}
            style={styles.filterChip}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Chip>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Source</Text>
      <View style={styles.chipGroup}>
        {['website', 'referral', 'social', 'other'].map((source) => (
          <Chip
            key={source}
            selected={localFilters.source === source}
            onPress={() => updateFilter('source', localFilters.source === source ? undefined : source)}
            style={styles.filterChip}
          >
            {source.charAt(0).toUpperCase() + source.slice(1)}
          </Chip>
        ))}
      </View>
    </>
  );

  const renderLocationFilters = () => (
    <>
      <TextInput
        mode="outlined"
        label="City"
        value={localFilters.city || ''}
        onChangeText={(value) => updateFilter('city', value)}
        style={styles.input}
      />

      <TextInput
        mode="outlined"
        label="State"
        value={localFilters.state || ''}
        onChangeText={(value) => updateFilter('state', value)}
        style={styles.input}
      />

      <TextInput
        mode="outlined"
        label="Country"
        value={localFilters.country || ''}
        onChangeText={(value) => updateFilter('country', value)}
        style={styles.input}
      />
    </>
  );

  const renderDateFilters = () => (
    <>
      <Text style={styles.fieldLabel}>Created Date Range</Text>
      <View style={styles.dateRow}>
        <TextInput
          mode="outlined"
          label="From Date"
          value={localFilters.createdFrom || ''}
          onChangeText={(value) => updateFilter('createdFrom', value)}
          style={[styles.input, styles.halfInput]}
          placeholder="YYYY-MM-DD"
        />
        <TextInput
          mode="outlined"
          label="To Date"
          value={localFilters.createdTo || ''}
          onChangeText={(value) => updateFilter('createdTo', value)}
          style={[styles.input, styles.halfInput]}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <Text style={styles.fieldLabel}>Last Contact Date Range</Text>
      <View style={styles.dateRow}>
        <TextInput
          mode="outlined"
          label="From Date"
          value={localFilters.lastContactFrom || ''}
          onChangeText={(value) => updateFilter('lastContactFrom', value)}
          style={[styles.input, styles.halfInput]}
          placeholder="YYYY-MM-DD"
        />
        <TextInput
          mode="outlined"
          label="To Date"
          value={localFilters.lastContactTo || ''}
          onChangeText={(value) => updateFilter('lastContactTo', value)}
          style={[styles.input, styles.halfInput]}
          placeholder="YYYY-MM-DD"
        />
      </View>
    </>
  );

  const renderFinancialFilters = () => (
    <>
      <Text style={styles.fieldLabel}>Revenue Range</Text>
      <View style={styles.rangeRow}>
        <TextInput
          mode="outlined"
          label="Min Revenue"
          value={localFilters.minRevenue?.toString() || ''}
          onChangeText={(value) => updateFilter('minRevenue', value ? parseFloat(value) : undefined)}
          style={[styles.input, styles.halfInput]}
          keyboardType="numeric"
        />
        <TextInput
          mode="outlined"
          label="Max Revenue"
          value={localFilters.maxRevenue?.toString() || ''}
          onChangeText={(value) => updateFilter('maxRevenue', value ? parseFloat(value) : undefined)}
          style={[styles.input, styles.halfInput]}
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.fieldLabel}>Order Count Range</Text>
      <View style={styles.rangeRow}>
        <TextInput
          mode="outlined"
          label="Min Orders"
          value={localFilters.minOrders?.toString() || ''}
          onChangeText={(value) => updateFilter('minOrders', value ? parseInt(value) : undefined)}
          style={[styles.input, styles.halfInput]}
          keyboardType="numeric"
        />
        <TextInput
          mode="outlined"
          label="Max Orders"
          value={localFilters.maxOrders?.toString() || ''}
          onChangeText={(value) => updateFilter('maxOrders', value ? parseInt(value) : undefined)}
          style={[styles.input, styles.halfInput]}
          keyboardType="numeric"
        />
      </View>
    </>
  );

  const renderTagFilters = () => (
    <>
      <TextInput
        mode="outlined"
        label="Tags (comma-separated)"
        value={localFilters.tags?.join(', ') || ''}
        onChangeText={(value) => updateFilter('tags', value.split(',').map(tag => tag.trim()).filter(tag => tag))}
        style={styles.input}
        placeholder="e.g., vip, enterprise, startup"
      />
    </>
  );

  const renderSortingOptions = () => (
    <>
      <Text style={styles.fieldLabel}>Sort By</Text>
      <SegmentedButtons
        value={localFilters.sortBy || 'name'}
        onValueChange={(value) => updateFilter('sortBy', value)}
        buttons={[
          { value: 'name', label: 'Name' },
          { value: 'email', label: 'Email' },
          { value: 'createdAt', label: 'Created' },
          { value: 'revenue', label: 'Revenue' },
        ]}
        style={styles.segmentedButtons}
      />

      <Text style={styles.fieldLabel}>Sort Order</Text>
      <SegmentedButtons
        value={localFilters.sortOrder || 'asc'}
        onValueChange={(value) => updateFilter('sortOrder', value as 'asc' | 'desc')}
        buttons={[
          { value: 'asc', label: 'Ascending' },
          { value: 'desc', label: 'Descending' },
        ]}
        style={styles.segmentedButtons}
      />
    </>
  );

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.header}>
            <MaterialIcons name="filter-list" size={24} color="#2196F3" />
            <Text style={styles.headerTitle}>Advanced Search & Filters</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Use these filters to find specific customers based on various criteria
          </Text>
        </Card.Content>
      </Card>

      {renderSection('Basic Filters', 'basic', renderBasicFilters())}
      {renderSection('Location Filters', 'location', renderLocationFilters())}
      {renderSection('Date Filters', 'date', renderDateFilters())}
      {renderSection('Financial Filters', 'financial', renderFinancialFilters())}
      {renderSection('Tag Filters', 'tags', renderTagFilters())}
      {renderSection('Sorting Options', 'sorting', renderSortingOptions())}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={clearFilters}
          style={styles.button}
          icon="clear"
        >
          Clear All
        </Button>
        <Button
          mode="contained"
          onPress={applyFilters}
          style={styles.button}
          icon="check"
        >
          Apply Filters
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerCard: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  sectionCard: {
    marginBottom: 12,
  },
  sectionHeader: {
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    marginTop: 12,
  },
  input: {
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 32,
    gap: 12,
  },
  button: {
    flex: 1,
  },
});

export default SearchFilters; 
