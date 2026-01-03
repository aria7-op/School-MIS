import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors as defaultColors } from '../../../constants/colors';

interface ReportsPanelProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  onGenerateReport: (type: string) => void;
  onExportReport: (type: string, format: string) => void;
  colors: any;
}

const ReportsPanel: React.FC<ReportsPanelProps> = ({
  dateRange,
  onGenerateReport,
  onExportReport,
  colors: propColors,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  // Safe color access with fallbacks
  const colors = {
    primary: propColors?.primary || defaultColors.primary,
    success: propColors?.success || defaultColors.success,
    error: propColors?.error || defaultColors.error,
    warning: propColors?.warning || defaultColors.warning,
    info: propColors?.info || defaultColors.info,
    secondary: propColors?.secondary || defaultColors.secondary,
    text: propColors?.text || defaultColors.text,
    textSecondary: propColors?.textSecondary || defaultColors.textSecondary,
    card: propColors?.card || defaultColors.card,
    background: propColors?.background || defaultColors.background,
    white: propColors?.white || defaultColors.white,
  };

  // Safe dateRange access with fallbacks
  const safeDateRange = {
    startDate: dateRange?.startDate || 'Start Date',
    endDate: dateRange?.endDate || 'End Date',
  };

  const reports = [
    {
      id: 'financial_summary',
      title: 'Financial Summary',
      subtitle: 'Overview of income, expenses, and profit',
      icon: 'assessment',
      color: colors.primary,
      formats: ['PDF', 'Excel', 'CSV'],
    },
    {
      id: 'cash_flow_statement',
      title: 'Cash Flow Statement',
      subtitle: 'Detailed cash flow analysis',
      icon: 'trending-up',
      color: colors.success,
      formats: ['PDF', 'Excel'],
    },
    {
      id: 'income_statement',
      title: 'Income Statement',
      subtitle: 'Revenue and expense breakdown',
      icon: 'account-balance',
      color: colors.info || colors.primary,
      formats: ['PDF', 'Excel', 'CSV'],
    },
    {
      id: 'payment_collection',
      title: 'Payment Collection',
      subtitle: 'Payment status and collection rates',
      icon: 'payment',
      color: colors.warning,
      formats: ['PDF', 'Excel'],
    },
    {
      id: 'payroll_report',
      title: 'Payroll Report',
      subtitle: 'Staff salary and payroll analysis',
      icon: 'account-balance-wallet',
      color: colors.error,
      formats: ['PDF', 'Excel'],
    },
    {
      id: 'budget_variance',
      title: 'Budget Variance',
      subtitle: 'Budget vs actual spending analysis',
      icon: 'pie-chart',
      color: colors.secondary || colors.primary,
      formats: ['PDF', 'Excel', 'CSV'],
    },
    {
      id: 'expense_analysis',
      title: 'Expense Analysis',
      subtitle: 'Detailed expense categorization',
      icon: 'money-off',
      color: colors.error,
      formats: ['PDF', 'Excel'],
    },
    {
      id: 'revenue_analysis',
      title: 'Revenue Analysis',
      subtitle: 'Revenue trends and sources',
      icon: 'trending-up',
      color: colors.success,
      formats: ['PDF', 'Excel', 'CSV'],
    },
  ];

  const handleGenerateReport = (reportId: string) => {
    onGenerateReport(reportId);
  };

  const handleExportReport = (reportId: string, format: string) => {
    onExportReport(reportId, format);
    setShowExportModal(false);
    setSelectedReport(null);
  };

  const openExportModal = (reportId: string) => {
    setSelectedReport(reportId);
    setShowExportModal(true);
  };

  const selectedReportData = reports.find(r => r.id === selectedReport);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Financial Reports</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {safeDateRange.startDate} to {safeDateRange.endDate}
        </Text>
      </View>

      <ScrollView style={styles.reportsList} showsVerticalScrollIndicator={false}>
        {reports.map((report) => (
          <View
            key={report.id}
            style={[styles.reportCard, { backgroundColor: colors.background }]}
          >
            <View style={styles.reportHeader}>
              <View style={[styles.iconContainer, { backgroundColor: report.color + '20' }]}>
                <Icon name={report.icon} size={24} color={report.color} />
              </View>
              
              <View style={styles.reportContent}>
                <Text style={[styles.reportTitle, { color: colors.text }]}>
                  {report.title}
                </Text>
                <Text style={[styles.reportSubtitle, { color: colors.textSecondary }]}>
                  {report.subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.reportActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: report.color }]}
                onPress={() => handleGenerateReport(report.id)}
              >
                <Icon name="visibility" size={16} color={colors.white} />
                <Text style={[styles.actionText, { color: colors.white }]}>
                  Generate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.background, borderColor: report.color }]}
                onPress={() => openExportModal(report.id)}
              >
                <Icon name="file-download" size={16} color={report.color} />
                <Text style={[styles.actionText, { color: report.color }]}>
                  Export
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Export Modal */}
      <Modal
        visible={showExportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Export {selectedReportData?.title}
              </Text>
              <TouchableOpacity
                onPress={() => setShowExportModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
              Choose export format:
            </Text>

            <View style={styles.formatOptions}>
              {selectedReportData?.formats.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={[styles.formatOption, { backgroundColor: colors.background }]}
                  onPress={() => handleExportReport(selectedReportData.id, format)}
                >
                  <Icon 
                    name={format === 'PDF' ? 'picture-as-pdf' : format === 'Excel' ? 'table-chart' : 'description'} 
                    size={24} 
                    color={colors.primary} 
                  />
                  <Text style={[styles.formatText, { color: colors.text }]}>
                    {format}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  reportsList: {
    maxHeight: 400,
  },
  reportCard: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportContent: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reportSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 16,
  },
  formatOptions: {
    gap: 12,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  formatText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  modalFooter: {
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportsPanel; 
