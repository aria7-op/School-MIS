import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Button, 
  TextInput, 
  Chip, 
  SegmentedButtons,
  Checkbox,
  ActivityIndicator
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useStaffApi, { StaffFilters, Staff } from '../hooks/useStaffApi';

interface SearchFiltersProps {
  onSearch: (query: string) => void;
  onFilter: (filters: StaffFilters) => Promise<{ data: Staff[]; meta: any }>;
  onSuccess: (data: Staff[]) => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  onSearch,
  onFilter,
  onSuccess
}) => {
  const {
    loading,
    error,
    searchStaff,
    getStaff,
    getStaffByDepartment,
    getStaffBySchool,
    getEmployeeIdSuggestions,
    getStaffCountByDepartment,
    getStaffCountByDesignation
  } = useStaffApi();

  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StaffFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [includeRelations, setIncludeRelations] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [deptStats, desigStats] = await Promise.all([
        getStaffCountByDepartment(),
        getStaffCountByDesignation()
      ]);
      
      setDepartments(deptStats || []);
      setDesignations(desigStats || []);
    } catch (err) {
      
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const include = includeRelations.length > 0 ? includeRelations.join(',') : undefined;
        const response = await searchStaff(searchQuery, include);
        onSuccess(response.data);
      } catch (err) {
        Alert.alert('Error', 'Search failed');
      }
    }
  };

  const handleFilter = async () => {
    try {
      const filterParams: StaffFilters = {
        ...filters,
        departmentId: selectedDepartments.length === 1 ? selectedDepartments[0] : undefined,
        designation: selectedDesignations.length === 1 ? selectedDesignations[0] : undefined,
        include: includeRelations.length > 0 ? includeRelations.join(',') : undefined
      };

      const response = await onFilter(filterParams);
      onSuccess(response.data);
    } catch (err) {
      Alert.alert('Error', 'Filter failed');
    }
  };

  const handleGetEmployeeIdSuggestions = async () => {
    try {
      const designation = selectedDesignations.length === 1 ? selectedDesignations[0] : undefined;
      const suggestions = await getEmployeeIdSuggestions(designation);
      Alert.alert(
        'Employee ID Suggestions',
        `Available: ${suggestions.suggestions.join(', ')}\nNext: ${suggestions.nextAvailable}`
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleGetStaffByDepartment = async (departmentId: number) => {
    try {
      const include = includeRelations.length > 0 ? includeRelations.join(',') : undefined;
      const response = await getStaffByDepartment(departmentId, include);
      onSuccess(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to get staff by department');
    }
  };

  const handleGetStaffBySchool = async (schoolId: number) => {
    try {
      const include = includeRelations.length > 0 ? includeRelations.join(',') : undefined;
      const response = await getStaffBySchool(schoolId, include);
      onSuccess(response.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to get staff by school');
    }
  };

  const toggleDepartment = (departmentId: number) => {
    setSelectedDepartments(prev => 
      prev.includes(departmentId) 
        ? prev.filter(id => id !== departmentId)
        : [...prev, departmentId]
    );
  };

  const toggleDesignation = (designation: string) => {
    setSelectedDesignations(prev => 
      prev.includes(designation) 
        ? prev.filter(d => d !== designation)
        : [...prev, designation]
    );
  };

  const toggleIncludeRelation = (relation: string) => {
    setIncludeRelations(prev => 
      prev.includes(relation) 
        ? prev.filter(r => r !== relation)
        : [...prev, relation]
    );
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSelectedDepartments([]);
    setSelectedDesignations([]);
    setIncludeRelations([]);
    setSearchQuery('');
  };

  const renderSearchTab = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Search Staff</Text>
          <Text style={styles.cardSubtitle}>
            Search staff members by name, email, employee ID, or designation
          </Text>
          
          <TextInput
            mode="outlined"
            placeholder="Enter search query..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.textInput}
            right={
              <TextInput.Icon 
                icon="magnify" 
                onPress={handleSearch}
              />
            }
          />

          <View style={styles.includeSection}>
            <Text style={styles.sectionTitle}>Include Relations:</Text>
            <View style={styles.chipGroup}>
              {['department', 'attendances', 'payrolls', 'documents', 'school'].map(relation => (
                <Chip
                  key={relation}
                  selected={includeRelations.includes(relation)}
                  onPress={() => toggleIncludeRelation(relation)}
                  style={styles.chip}
                >
                  {relation}
                </Chip>
              ))}
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleSearch}
            loading={loading}
            disabled={!searchQuery.trim()}
            style={styles.searchButton}
          >
            Search
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              onPress={handleGetEmployeeIdSuggestions}
              icon="id-card"
              style={styles.quickButton}
            >
              Get Employee ID Suggestions
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleGetStaffBySchool(1)}
              icon="school"
              style={styles.quickButton}
            >
              Get Staff by School
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderFiltersTab = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Advanced Filters</Text>
          <Text style={styles.cardSubtitle}>
            Filter staff members by various criteria
          </Text>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Basic Filters:</Text>
            
            <TextInput
              mode="outlined"
              placeholder="Search term"
              value={filters.search || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, search: text }))}
              style={styles.textInput}
            />

            <TextInput
              mode="outlined"
              placeholder="Designation"
              value={filters.designation || ''}
              onChangeText={(text) => setFilters(prev => ({ ...prev, designation: text }))}
              style={styles.textInput}
            />

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                placeholder="Min Salary"
                value={filters.minSalary?.toString() || ''}
                onChangeText={(text) => setFilters(prev => ({ ...prev, minSalary: parseFloat(text) || undefined }))}
                style={[styles.textInput, styles.halfInput]}
                keyboardType="numeric"
              />
              <TextInput
                mode="outlined"
                placeholder="Max Salary"
                value={filters.maxSalary?.toString() || ''}
                onChangeText={(text) => setFilters(prev => ({ ...prev, maxSalary: parseFloat(text) || undefined }))}
                style={[styles.textInput, styles.halfInput]}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                placeholder="Page"
                value={filters.page?.toString() || '1'}
                onChangeText={(text) => setFilters(prev => ({ ...prev, page: parseInt(text) || 1 }))}
                style={[styles.textInput, styles.halfInput]}
                keyboardType="numeric"
              />
              <TextInput
                mode="outlined"
                placeholder="Limit"
                value={filters.limit?.toString() || '20'}
                onChangeText={(text) => setFilters(prev => ({ ...prev, limit: parseInt(text) || 20 }))}
                style={[styles.textInput, styles.halfInput]}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Departments:</Text>
            <View style={styles.chipGroup}>
              {departments.map(dept => (
                <Chip
                  key={dept.departmentId}
                  selected={selectedDepartments.includes(dept.departmentId)}
                  onPress={() => toggleDepartment(dept.departmentId)}
                  style={styles.chip}
                >
                  {dept.departmentName} ({dept.count})
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Designations:</Text>
            <View style={styles.chipGroup}>
              {designations.map(desig => (
                <Chip
                  key={desig.designation}
                  selected={selectedDesignations.includes(desig.designation)}
                  onPress={() => toggleDesignation(desig.designation)}
                  style={styles.chip}
                >
                  {desig.designation} ({desig.count})
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Include Relations:</Text>
            <View style={styles.chipGroup}>
              {['department', 'attendances', 'payrolls', 'documents', 'school'].map(relation => (
                <Chip
                  key={relation}
                  selected={includeRelations.includes(relation)}
                  onPress={() => toggleIncludeRelation(relation)}
                  style={styles.chip}
                >
                  {relation}
                </Chip>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Sort Options:</Text>
            <View style={styles.row}>
              <TextInput
                mode="outlined"
                placeholder="Sort by (e.g., createdAt, salary, firstName)"
                value={filters.sortBy || 'createdAt'}
                onChangeText={(text) => setFilters(prev => ({ ...prev, sortBy: text }))}
                style={[styles.textInput, styles.halfInput]}
              />
              <SegmentedButtons
                value={filters.sortOrder || 'desc'}
                onValueChange={(value) => setFilters(prev => ({ ...prev, sortOrder: value as 'asc' | 'desc' }))}
                buttons={[
                  { value: 'asc', label: 'Asc' },
                  { value: 'desc', label: 'Desc' },
                ]}
                style={styles.sortButtons}
              />
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <Button
              mode="outlined"
              onPress={clearFilters}
              style={styles.secondaryButton}
            >
              Clear Filters
            </Button>
            <Button
              mode="contained"
              onPress={handleFilter}
              loading={loading}
              style={styles.primaryButton}
            >
              Apply Filters
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'search', label: 'Search', icon: 'magnify' },
            { value: 'filters', label: 'Advanced Filters', icon: 'filter-variant' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.content}>
        {activeTab === 'search' && renderSearchTab()}
        {activeTab === 'filters' && renderFiltersTab()}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text>Loading...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  includeSection: {
    marginBottom: 20,
  },
  searchButton: {
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  primaryButton: {
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
  },
  sortButtons: {
    flex: 1,
    marginLeft: 8,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default SearchFilters;
