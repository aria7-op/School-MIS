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
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

interface ImportExportModalProps {
  visible: boolean;
  onClose: () => void;
  mode: 'import' | 'export';
  onImport?: (data: string, format: string) => Promise<void>;
  onExport?: (format: string, filters?: any) => Promise<void>;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  visible,
  onClose,
  mode,
  onImport,
  onExport,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('');
  const [importData, setImportData] = useState('');
  const [exportFilters, setExportFilters] = useState({
    status: '',
    emailVerified: null,
    dateRange: 'all',
  });

  const formats = [
    { id: 'json', name: 'JSON', icon: 'code', description: 'JavaScript Object Notation' },
    { id: 'csv', name: 'CSV', icon: 'table-chart', description: 'Comma Separated Values' },
    { id: 'xlsx', name: 'Excel', icon: 'grid-on', description: 'Microsoft Excel Format' },
    { id: 'pdf', name: 'PDF', icon: 'picture-as-pdf', description: 'Portable Document Format' },
  ];

  const handleFormatSelect = (format: string) => {
    setSelectedFormat(format);
  };

  const handleImport = async () => {
    if (!selectedFormat || !importData.trim()) {
      Alert.alert('Error', 'Please select a format and provide import data');
      return;
    }

    try {
      setLoading(true);
      await onImport?.(importData, selectedFormat);
      Alert.alert('Success', 'Data imported successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to import data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!selectedFormat) {
      Alert.alert('Error', 'Please select an export format');
      return;
    }

    try {
      setLoading(true);
      await onExport?.(selectedFormat, exportFilters);
      Alert.alert('Success', 'Data exported successfully');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  const renderImportSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Import Data</Text>
      <Text style={styles.sectionDescription}>
        Paste your data below in the selected format
      </Text>
      
      <TextInput
        style={styles.dataInput}
        placeholder="Paste your data here..."
        value={importData}
        onChangeText={setImportData}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />
      
      <View style={styles.importOptions}>
        <Text style={styles.optionLabel}>Import Options:</Text>
        <View style={styles.optionItem}>
          <MaterialIcons name="check-box" size={20} color={colors.primary} />
          <Text style={styles.optionText}>Skip duplicate emails</Text>
        </View>
        <View style={styles.optionItem}>
          <MaterialIcons name="check-box" size={20} color={colors.primary} />
          <Text style={styles.optionText}>Validate data format</Text>
        </View>
        <View style={styles.optionItem}>
          <MaterialIcons name="check-box" size={20} color={colors.primary} />
          <Text style={styles.optionText}>Send welcome emails</Text>
        </View>
      </View>
    </View>
  );

  const renderExportSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Export Options</Text>
      
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Status Filter:</Text>
        <View style={styles.filterOptions}>
          {['', 'ACTIVE', 'INACTIVE', 'SUSPENDED'].map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterOption,
                exportFilters.status === status && styles.filterOptionActive
              ]}
              onPress={() => setExportFilters(prev => ({ ...prev, status }))}
            >
              <Text style={[
                styles.filterOptionText,
                exportFilters.status === status && styles.filterOptionTextActive
              ]}>
                {status || 'All'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Email Verification:</Text>
        <View style={styles.filterOptions}>
          {[null, true, false].map(verified => (
            <TouchableOpacity
              key={String(verified)}
              style={[
                styles.filterOption,
                exportFilters.emailVerified === verified && styles.filterOptionActive
              ]}
              onPress={() => setExportFilters(prev => ({ ...prev, emailVerified: verified }))}
            >
              <Text style={[
                styles.filterOptionText,
                exportFilters.emailVerified === verified && styles.filterOptionTextActive
              ]}>
                {verified === null ? 'All' : verified ? 'Verified' : 'Not Verified'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Date Range:</Text>
        <View style={styles.filterOptions}>
          {[
            { key: 'all', label: 'All Time' },
            { key: '7d', label: 'Last 7 Days' },
            { key: '30d', label: 'Last 30 Days' },
            { key: '90d', label: 'Last 90 Days' },
          ].map(range => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.filterOption,
                exportFilters.dateRange === range.key && styles.filterOptionActive
              ]}
              onPress={() => setExportFilters(prev => ({ ...prev, dateRange: range.key }))}
            >
              <Text style={[
                styles.filterOptionText,
                exportFilters.dateRange === range.key && styles.filterOptionTextActive
              ]}>
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === 'import' ? 'Import Owners' : 'Export Owners'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Format Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Format</Text>
              <View style={styles.formatGrid}>
                {formats.map((format) => (
                  <TouchableOpacity
                    key={format.id}
                    style={[
                      styles.formatCard,
                      selectedFormat === format.id && styles.formatCardActive
                    ]}
                    onPress={() => handleFormatSelect(format.id)}
                  >
                    <MaterialIcons 
                      name={format.icon as any} 
                      size={32} 
                      color={selectedFormat === format.id ? colors.white : colors.primary} 
                    />
                    <Text style={[
                      styles.formatName,
                      selectedFormat === format.id && styles.formatNameActive
                    ]}>
                      {format.name}
                    </Text>
                    <Text style={[
                      styles.formatDescription,
                      selectedFormat === format.id && styles.formatDescriptionActive
                    ]}>
                      {format.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Import/Export Specific Content */}
            {mode === 'import' ? renderImportSection() : renderExportSection()}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={mode === 'import' ? handleImport : handleExport}
                disabled={loading || !selectedFormat}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {mode === 'import' ? 'Import Data' : 'Export Data'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    backgroundColor: colors.white,
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
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
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
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formatCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  formatName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 8,
  },
  formatNameActive: {
    color: colors.white,
  },
  formatDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  formatDescriptionActive: {
    color: colors.white,
    opacity: 0.8,
  },
  dataInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 120,
  },
  importOptions: {
    marginTop: 16,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 12,
    color: colors.text,
  },
  filterOptionTextActive: {
    color: colors.white,
    fontWeight: 'bold',
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
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ImportExportModal; 
