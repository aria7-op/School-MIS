import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface ExportDataModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (exportConfig: any) => void;
}

const ExportDataModal: React.FC<ExportDataModalProps> = ({ visible, onClose, onExport }) => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['payments']);
  const [selectedFormat, setSelectedFormat] = useState('excel');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [fileName, setFileName] = useState('finance_export');

  const dataTypes = [
    { id: 'payments', label: 'Payments', icon: 'payment' },
    { id: 'expenses', label: 'Expenses', icon: 'money-off' },
    { id: 'income', label: 'Income', icon: 'trending-up' },
    { id: 'budgets', label: 'Budgets', icon: 'account-balance' },
    { id: 'transactions', label: 'Transactions', icon: 'swap-horiz' },
    { id: 'payroll', label: 'Payroll', icon: 'people' },
    { id: 'reports', label: 'Reports', icon: 'assessment' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
  ];

  const exportFormats = [
    { id: 'excel', label: 'Excel (.xlsx)', icon: 'table-chart' },
    { id: 'csv', label: 'CSV', icon: 'grid-on' },
    { id: 'pdf', label: 'PDF', icon: 'picture-as-pdf' },
    { id: 'json', label: 'JSON', icon: 'code' },
  ];

  const toggleDataType = (id: string) => {
    setSelectedDataTypes(prev => 
      prev.includes(id) 
        ? prev.filter(type => type !== id)
        : [...prev, id]
    );
  };

  const selectAllDataTypes = () => {
    setSelectedDataTypes(dataTypes.map(type => type.id));
  };

  const deselectAllDataTypes = () => {
    setSelectedDataTypes([]);
  };

  const handleExport = () => {
    if (selectedDataTypes.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one data type to export.');
      return;
    }

    const exportConfig = {
      dataTypes: selectedDataTypes,
      format: selectedFormat,
      includeHeaders,
      dateFrom,
      dateTo,
      fileName,
      exportedAt: new Date().toISOString(),
    };

    onExport(exportConfig);
    onClose();
  };

  const renderOption = (item: any, selected: string | string[], onSelect: (id: string) => void) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.optionCard,
        { backgroundColor: colors.card },
        Array.isArray(selected) 
          ? selected.includes(item.id) && { borderColor: '#10b981', borderWidth: 2 }
          : selected === item.id && { borderColor: '#10b981', borderWidth: 2 }
      ]}
      onPress={() => onSelect(item.id)}
    >
      <Icon 
        name={item.icon} 
        size={24} 
        color={
          Array.isArray(selected) 
            ? selected.includes(item.id) ? '#10b981' : colors.text
            : selected === item.id ? '#10b981' : colors.text
        } 
      />
      <Text style={[
        styles.optionLabel,
        { color: colors.text },
        Array.isArray(selected) 
          ? selected.includes(item.id) && { color: '#10b981', fontWeight: '600' }
          : selected === item.id && { color: '#10b981', fontWeight: '600' }
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Export Data</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Data Types */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Types</Text>
                <View style={styles.selectionButtons}>
                  <TouchableOpacity onPress={selectAllDataTypes} style={styles.selectionButton}>
                    <Text style={styles.selectionButtonText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={deselectAllDataTypes} style={styles.selectionButton}>
                    <Text style={styles.selectionButtonText}>Deselect All</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.optionsGrid}>
                {dataTypes.map(item => renderOption(item, selectedDataTypes, toggleDataType))}
              </View>
            </View>

            {/* Export Format */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Export Format</Text>
              <View style={styles.optionsGrid}>
                {exportFormats.map(item => renderOption(item, selectedFormat, setSelectedFormat))}
              </View>
            </View>

            {/* Export Options */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Export Options</Text>
              
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Include Headers</Text>
                <Switch
                  value={includeHeaders}
                  onValueChange={setIncludeHeaders}
                  trackColor={{ false: '#767577', true: '#10b981' }}
                  thumbColor={includeHeaders ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.dateRangeContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Date Range (Optional)</Text>
                <View style={styles.dateInputs}>
                  <TextInput
                    style={[styles.dateInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="From (YYYY-MM-DD)"
                    placeholderTextColor={colors.text + '80'}
                    value={dateFrom}
                    onChangeText={setDateFrom}
                  />
                  <TextInput
                    style={[styles.dateInput, { borderColor: colors.border, color: colors.text }]}
                    placeholder="To (YYYY-MM-DD)"
                    placeholderTextColor={colors.text + '80'}
                    value={dateTo}
                    onChangeText={setDateTo}
                  />
                </View>
              </View>

              <View style={styles.fileNameContainer}>
                <Text style={[styles.label, { color: colors.text }]}>File Name</Text>
                <TextInput
                  style={[styles.fileNameInput, { borderColor: colors.border, color: colors.text }]}
                  value={fileName}
                  onChangeText={setFileName}
                  placeholder="Enter file name"
                  placeholderTextColor={colors.text + '80'}
                />
              </View>
            </View>

            {/* Summary */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Export Summary</Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Selected Data Types:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedDataTypes.length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Format:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {exportFormats.find(f => f.id === selectedFormat)?.label}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>File Name:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {fileName}.{selectedFormat === 'excel' ? 'xlsx' : selectedFormat}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.exportButton]} onPress={handleExport}>
              <Text style={styles.buttonText}>Export Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    borderRadius: 12,
    maxHeight: '90%',
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    padding: 16,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    backgroundColor: '#6b7280',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionLabel: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dateRangeContainer: {
    marginBottom: 16,
  },
  dateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  fileNameContainer: {
    marginBottom: 16,
  },
  fileNameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  summaryContainer: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6b7280',
    marginRight: 10,
  },
  exportButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ExportDataModal; 
