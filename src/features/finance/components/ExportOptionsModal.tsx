import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ExportOptionsModalProps {
  visible: boolean;
  onExport: (format: string, filters?: any) => Promise<void>;
  onCancel: () => void;
  colors?: any;
}

const ExportOptionsModal: React.FC<ExportOptionsModalProps> = ({
  visible,
  onExport,
  onCancel,
  colors,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [exportFilters, setExportFilters] = useState({
    dateRange: 'all',
    includeCharts: true,
    includeDetails: true,
  });

  // Default colors fallback
  const defaultColors = {
    card: '#ffffff',
    text: '#000000',
    textSecondary: '#666666',
    background: '#f5f5f5',
    primary: '#007AFF',
    border: '#e5e7eb',
  };

  const themeColors = colors || defaultColors;

  const formats = [
    { id: 'pdf', name: 'PDF', icon: 'picture-as-pdf', description: 'Portable Document Format' },
    { id: 'excel', name: 'Excel', icon: 'table-chart', description: 'Microsoft Excel Format' },
    { id: 'csv', name: 'CSV', icon: 'grid-on', description: 'Comma Separated Values' },
    { id: 'json', name: 'JSON', icon: 'code', description: 'JavaScript Object Notation' },
  ];

  const dateRanges = [
    { key: 'all', label: 'All Time' },
    { key: '7d', label: 'Last 7 Days' },
    { key: '30d', label: 'Last 30 Days' },
    { key: '90d', label: 'Last 90 Days' },
    { key: '1y', label: 'Last Year' },
  ];

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);
  };

  const handleExport = async () => {
    if (!selectedFormat) {
      Alert.alert('Error', 'Please select an export format');
      return;
    }

    try {
      setLoading(true);
      await onExport(selectedFormat, exportFilters);
      Alert.alert('Success', 'Report exported successfully');
      onCancel();
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.card }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Export Financial Report
            </Text>
            <TouchableOpacity onPress={onCancel}>
              <MaterialIcons name="close" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Format Selection */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Select Export Format
              </Text>
              <Text style={[styles.sectionDescription, { color: themeColors.textSecondary }]}>
                Choose the format for your financial report
              </Text>
              
              <View style={styles.formatGrid}>
                {formats.map((format) => (
                  <TouchableOpacity
                    key={format.id}
                    style={[
                      styles.formatCard,
                      { backgroundColor: themeColors.background },
                      selectedFormat === format.id && styles.formatCardActive
                    ]}
                    onPress={() => handleFormatSelect(format.id)}
                  >
                    <MaterialIcons 
                      name={format.icon as any} 
                      size={32} 
                      color={selectedFormat === format.id ? 'white' : themeColors.primary} 
                    />
                    <Text style={[
                      styles.formatName,
                      { color: selectedFormat === format.id ? 'white' : themeColors.text }
                    ]}>
                      {format.name}
                    </Text>
                    <Text style={[
                      styles.formatDescription,
                      { color: selectedFormat === format.id ? 'white' : themeColors.textSecondary }
                    ]}>
                      {format.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Export Options */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
                Export Options
              </Text>
              
              <View style={styles.filterSection}>
                <Text style={[styles.filterLabel, { color: themeColors.text }]}>Date Range:</Text>
                <View style={styles.filterOptions}>
                  {dateRanges.map(range => (
                    <TouchableOpacity
                      key={range.key}
                      style={[
                        styles.filterOption,
                        { backgroundColor: themeColors.background },
                        exportFilters.dateRange === range.key && styles.filterOptionActive
                      ]}
                      onPress={() => setExportFilters(prev => ({ ...prev, dateRange: range.key }))}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        { color: exportFilters.dateRange === range.key ? 'white' : themeColors.text }
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.checkboxSection}>
                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() => setExportFilters(prev => ({ 
                    ...prev, 
                    includeCharts: !prev.includeCharts 
                  }))}
                >
                  <MaterialIcons 
                    name={exportFilters.includeCharts ? 'check-box' : 'check-box-outline-blank'} 
                    size={20} 
                    color={themeColors.primary} 
                  />
                  <Text style={[styles.checkboxText, { color: themeColors.text }]}>
                    Include charts and graphs
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkboxItem}
                  onPress={() => setExportFilters(prev => ({ 
                    ...prev, 
                    includeDetails: !prev.includeDetails 
                  }))}
                >
                  <MaterialIcons 
                    name={exportFilters.includeDetails ? 'check-box' : 'check-box-outline-blank'} 
                    size={20} 
                    color={themeColors.primary} 
                  />
                  <Text style={[styles.checkboxText, { color: themeColors.text }]}>
                    Include detailed breakdowns
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: themeColors.border }]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelButtonText, { color: themeColors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: themeColors.primary },
                (!selectedFormat || loading) && styles.confirmButtonDisabled
              ]}
              onPress={handleExport}
              disabled={loading || !selectedFormat}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  Export Report
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 12,
    width: '90%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  formatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formatCard: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  formatName: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  formatDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterOptionActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkboxSection: {
    marginTop: 16,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ExportOptionsModal; 
