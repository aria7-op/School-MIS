import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface GenerateReportModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (reportConfig: any) => void;
}

const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ visible, onClose, onGenerate }) => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [selectedReportType, setSelectedReportType] = useState('financial_summary');
  const [selectedDateRange, setSelectedDateRange] = useState('current_month');
  const [selectedFormat, setSelectedFormat] = useState('pdf');

  const reportTypes = [
    { id: 'financial_summary', label: 'Financial Summary', icon: 'assessment' },
    { id: 'cash_flow', label: 'Cash Flow Statement', icon: 'trending-up' },
    { id: 'profit_loss', label: 'Profit & Loss', icon: 'account-balance' },
    { id: 'balance_sheet', label: 'Balance Sheet', icon: 'pie-chart' },
    { id: 'revenue_analysis', label: 'Revenue Analysis', icon: 'bar-chart' },
    { id: 'expense_breakdown', label: 'Expense Breakdown', icon: 'money-off' },
    { id: 'payroll_report', label: 'Payroll Report', icon: 'people' },
    { id: 'tax_summary', label: 'Tax Summary', icon: 'receipt' },
  ];

  const dateRanges = [
    { id: 'current_month', label: 'Current Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'current_quarter', label: 'Current Quarter' },
    { id: 'last_quarter', label: 'Last Quarter' },
    { id: 'current_year', label: 'Current Year' },
    { id: 'last_year', label: 'Last Year' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const exportFormats = [
    { id: 'pdf', label: 'PDF', icon: 'picture-as-pdf' },
    { id: 'excel', label: 'Excel', icon: 'table-chart' },
    { id: 'csv', label: 'CSV', icon: 'grid-on' },
    { id: 'print', label: 'Print', icon: 'print' },
  ];

  const handleGenerate = () => {
    const reportConfig = {
      type: selectedReportType,
      dateRange: selectedDateRange,
      format: selectedFormat,
      generatedAt: new Date().toISOString(),
    };

    onGenerate(reportConfig);
    onClose();
  };

  const renderOption = (item: any, selected: string, onSelect: (id: string) => void) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.optionCard,
        { backgroundColor: colors.card },
        selected === item.id && { borderColor: '#10b981', borderWidth: 2 }
      ]}
      onPress={() => onSelect(item.id)}
    >
      {item.icon && (
        <Icon name={item.icon} size={24} color={selected === item.id ? '#10b981' : colors.text} />
      )}
      <Text style={[
        styles.optionLabel,
        { color: colors.text },
        selected === item.id && { color: '#10b981', fontWeight: '600' }
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
            <Text style={[styles.title, { color: colors.text }]}>Generate Report</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Report Type */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Report Type</Text>
              <View style={styles.optionsGrid}>
                {reportTypes.map(item => renderOption(item, selectedReportType, setSelectedReportType))}
              </View>
            </View>

            {/* Date Range */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Date Range</Text>
              <View style={styles.optionsGrid}>
                {dateRanges.map(item => renderOption(item, selectedDateRange, setSelectedDateRange))}
              </View>
            </View>

            {/* Export Format */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Export Format</Text>
              <View style={styles.optionsGrid}>
                {exportFormats.map(item => renderOption(item, selectedFormat, setSelectedFormat))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.generateButton]} onPress={handleGenerate}>
              <Text style={styles.buttonText}>Generate Report</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
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
  generateButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default GenerateReportModal; 
