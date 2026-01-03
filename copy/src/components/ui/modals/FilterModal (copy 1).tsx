import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';

// Components
import { Icon } from '../Icon';
import { Button } from '../buttons/Button';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface FilterSection {
  title: string;
  key: string;
  options: FilterOption[];
  multiSelect?: boolean;
}

interface FilterModalProps {
  visible: boolean;
  sections: FilterSection[];
  initialFilters?: Record<string, string | string[]>;
  onApply: (filters: Record<string, string | string[]>) => void;
  onClear: () => void;
  onClose: () => void;
  title?: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  sections,
  initialFilters = {},
  onApply,
  onClear,
  onClose,
  title = 'Filters'
}) => {
  const [localFilters, setLocalFilters] = useState<Record<string, string | string[]>>(initialFilters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Reset local filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(initialFilters);
    }
  }, [visible, initialFilters]);

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const handleOptionSelect = (sectionKey: string, value: string, multiSelect?: boolean) => {
    setLocalFilters(prev => {
      const currentValue = prev[sectionKey];
      
      if (multiSelect) {
        const currentArray = Array.isArray(currentValue) ? currentValue : [];
        const newArray = currentArray.includes(value)
          ? currentArray.filter(v => v !== value)
          : [...currentArray, value];
        return { ...prev, [sectionKey]: newArray };
      } else {
        return { ...prev, [sectionKey]: currentValue === value ? undefined : value };
      }
    });
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Filters',
      'Are you sure you want to clear all filters?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setLocalFilters({});
            onClear();
            onClose();
          }
        }
      ]
    );
  };

  const getSelectedCount = (sectionKey: string) => {
    const value = localFilters[sectionKey];
    if (!value) return 0;
    return Array.isArray(value) ? value.length : 1;
  };

  const renderSection = (section: FilterSection) => {
    const isExpanded = expandedSections.has(section.key);
    const selectedCount = getSelectedCount(section.key);
    const currentValue = localFilters[section.key];

    return (
      <View key={section.key} style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(section.key)}
        >
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {selectedCount > 0 && (
              <View style={styles.selectedBadge}>
                <Text style={styles.selectedBadgeText}>{selectedCount}</Text>
              </View>
            )}
          </View>
          <Icon 
            name={isExpanded ? 'expand-less' : 'expand-more'} 
            size={20} 
            color={COLORS.textSecondary} 
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.sectionContent}>
            {section.options.map((option) => {
              const isSelected = section.multiSelect
                ? Array.isArray(currentValue) && currentValue.includes(option.value)
                : currentValue === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected
                  ]}
                  onPress={() => handleOptionSelect(section.key, option.value, section.multiSelect)}
                >
                  <View style={styles.optionContent}>
                    <View style={[
                      styles.checkbox,
                      isSelected && styles.checkboxSelected
                    ]}>
                      {isSelected && (
                        <Icon name="check" size={12} color={COLORS.white} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                    {option.count !== undefined && (
                      <Text style={styles.optionCount}>({option.count})</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {sections.map(renderSection)}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              title="Clear All"
              onPress={handleClear}
              variant="outline"
              style={styles.clearButton}
            />
            <Button
              title="Apply Filters"
              onPress={handleApply}
              style={styles.applyButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  content: {
    padding: SPACING.md,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  selectedBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  sectionContent: {
    marginTop: SPACING.sm,
  },
  option: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: 6,
  },
  optionSelected: {
    backgroundColor: COLORS.primary + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    flex: 1,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  optionCount: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
}); 
