import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useFinance } from '../hooks/useFinance';
import PayrollPrintModal from './PayrollPrintModal';
import { useTranslation } from '../../../contexts/TranslationContext';
import ExportOptionsModal from './ExportOptionsModal';
import EmptyState from './EmptyState';

interface PayrollListProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

const PayrollList: React.FC<PayrollListProps> = ({ onRefresh, refreshing = false }) => {
  const { colors } = useTheme();
  const {
    payrolls,
    fetchPayrolls,
    loading,
    error,
    generatePayrollReport,
    setShowExportModal,
    showExportModal,
  } = useFinance();
  const [selectedPayroll, setSelectedPayroll] = useState<any>(null);
  const [printModalVisible, setPrintModalVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const handleRefresh = useCallback(() => {
    fetchPayrolls();
    onRefresh?.();
  }, [fetchPayrolls, onRefresh]);

  const handlePrintPayroll = (payroll: any) => {
    setSelectedPayroll(payroll);
    setPrintModalVisible(true);
  };

  const handleClosePrintModal = () => {
    setPrintModalVisible(false);
    setSelectedPayroll(null);
  };

  const handleExport = async () => {
    try {
      await generatePayrollReport();
      Alert.alert(t('export_complete'), t('payrolls_exported_successfully'));
    } catch (e) {
      Alert.alert(t('error'), t('export_failed'));
    }
  };

  const renderPayrollItem = ({ item }: { item: any }) => (
    <View style={[styles.payrollItem, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <View style={styles.payrollHeader}>
        <View style={styles.employeeInfo}>
          <Text style={[styles.employeeName, { color: colors.text }]}>{item.employeeName}</Text>
          <Text style={[styles.employeeId, { color: colors.textSecondary }]}>{item.employeeId}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}> 
          <Feather name="check-circle" size={12} color={colors.primary} />
          <Text style={[styles.statusText, { color: colors.primary }]}>{item.status?.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.payrollDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('period')}:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.month} {item.year}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('basic_salary')}:</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{item.basicSalary}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('allowances')}:</Text>
          <Text style={[styles.detailValue, { color: colors.success }]}>{item.allowances}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('deductions')}:</Text>
          <Text style={[styles.detailValue, { color: colors.error }]}>{item.deductions}</Text>
        </View>
        <View style={[styles.detailRow, styles.netSalaryRow]}>
          <Text style={[styles.detailLabel, styles.netSalaryLabel, { color: colors.text }]}>{t('net_salary')}:</Text>
          <Text style={[styles.detailValue, styles.netSalaryValue, { color: colors.primary }]}>{item.netSalary}</Text>
        </View>
      </View>
      <View style={styles.payrollFooter}>
        <View style={styles.footerInfo}>
          {item.paidAt && (
            <Text style={[styles.paymentDate, { color: colors.textSecondary }]}>{t('paid')}: {item.paidAt}</Text>
          )}
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={() => handlePrintPayroll(item)}>
            <Feather name="printer" size={16} color="white" />
            <Text style={styles.actionButtonText}>{t('print')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowExportModal(true)} style={styles.exportButton}>
        <Text style={styles.exportButtonText}>{t('export_to_excel')}</Text>
      </TouchableOpacity>
      <FlatList
        data={payrolls}
        keyExtractor={item => item.id}
        renderItem={renderPayrollItem}
        refreshControl={<RefreshControl refreshing={loading || refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<EmptyState message={t('no_payrolls_found')} />}
      />
      <PayrollPrintModal
        visible={printModalVisible}
        onClose={handleClosePrintModal}
        payroll={selectedPayroll}
      />
      <ExportOptionsModal
        visible={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  payrollItem: { marginVertical: 8, padding: 12, borderRadius: 8, borderWidth: 1 },
  payrollHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  employeeInfo: {},
  employeeName: { fontWeight: 'bold', fontSize: 16 },
  employeeId: { fontSize: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  statusText: { marginLeft: 4, fontSize: 12 },
  payrollDetails: { marginTop: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  detailLabel: { fontWeight: 'bold', fontSize: 13 },
  detailValue: { fontSize: 13 },
  netSalaryRow: { marginTop: 8 },
  netSalaryLabel: { fontWeight: 'bold' },
  netSalaryValue: { fontWeight: 'bold', fontSize: 15 },
  payrollFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  footerInfo: {},
  paymentDate: { fontSize: 12 },
  actionButtons: { flexDirection: 'row' },
  actionButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginLeft: 8 },
  actionButtonText: { color: 'white', marginLeft: 4 },
  exportButton: { alignSelf: 'flex-end', marginBottom: 8 },
  exportButtonText: { color: '#007bff', fontWeight: 'bold' },
});

export default PayrollList; 
