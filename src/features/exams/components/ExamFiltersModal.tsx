import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ExamFilters } from '../services/examApi';

interface ExamFiltersModalProps {
  visible: boolean;
  filters: ExamFilters;
  onClose: () => void;
  onApply: (filters: ExamFilters) => void;
}

const ExamFiltersModal: React.FC<ExamFiltersModalProps> = ({
  visible,
  filters,
  onClose,
  onApply
}) => {
  const { colors } = useTheme();
  const [localFilters, setLocalFilters] = useState<ExamFilters>(filters);

  const examTypes = ['MIDTERM', 'FINAL', 'QUIZ', 'ASSIGNMENT', 'PROJECT', 'PRACTICAL'];
  const sortOptions = [
    { key: 'startDate', label: 'Start Date' },
    { key: 'name', label: 'Name' },
    { key: 'totalMarks', label: 'Total Marks' },
    { key: 'createdAt', label: 'Created Date' }
  ];

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const resetFilters: ExamFilters = {
      page: 1,
      limit: 20,
      sortBy: 'startDate',
      sortOrder: 'desc'
    };
    setLocalFilters(resetFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.resetButton, { color: colors.text + '80' }]}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.filters}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Exam Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.card },
                    !localFilters.type && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, type: undefined }))}
                >
                  <Text style={[
                    styles.typeButtonText,
                    { color: !localFilters.type ? '#fff' : colors.text }
                  ]}>
                    All Types
                  </Text>
                </TouchableOpacity>
                {examTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      { backgroundColor: colors.card },
                      localFilters.type === type && { backgroundColor: colors.primary }
                    ]}
                    onPress={() => setLocalFilters(prev => ({ 
                      ...prev, 
                      type: prev.type === type ? undefined : type as any 
                    }))}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      { color: localFilters.type === type ? '#fff' : colors.text }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sort By</Text>
              <View style={styles.sortOptions}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      { backgroundColor: colors.card },
                      localFilters.sortBy === option.key && { backgroundColor: colors.primary + '20' }
                    ]}
                    onPress={() => setLocalFilters(prev => ({ ...prev, sortBy: option.key }))}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      { color: localFilters.sortBy === option.key ? colors.primary : colors.text }
                    ]}>
                      {option.label}
                    </Text>
                    {localFilters.sortBy === option.key && (
                      <Ionicons 
                        name="checkmark" 
                        size={16} 
                        color={colors.primary} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Sort Order</Text>
              <View style={styles.orderButtons}>
                <TouchableOpacity
                  style={[
                    styles.orderButton,
                    { backgroundColor: colors.card },
                    localFilters.sortOrder === 'desc' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'desc' }))}
                >
                  <Ionicons 
                    name="arrow-down" 
                    size={16} 
                    color={localFilters.sortOrder === 'desc' ? '#fff' : colors.text} 
                  />
                  <Text style={[
                    styles.orderButtonText,
                    { color: localFilters.sortOrder === 'desc' ? '#fff' : colors.text }
                  ]}>
                    Descending
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.orderButton,
                    { backgroundColor: colors.card },
                    localFilters.sortOrder === 'asc' && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setLocalFilters(prev => ({ ...prev, sortOrder: 'asc' }))}
                >
                  <Ionicons 
                    name="arrow-up" 
                    size={16} 
                    color={localFilters.sortOrder === 'asc' ? '#fff' : colors.text} 
                  />
                  <Text style={[
                    styles.orderButtonText,
                    { color: localFilters.sortOrder === 'asc' ? '#fff' : colors.text }
                  ]}>
                    Ascending
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleApply}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  resetButton: {
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  filters: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  sortOptionText: {
    fontSize: 14,
  },
  orderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  orderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  orderButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  applyButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ExamFiltersModal;