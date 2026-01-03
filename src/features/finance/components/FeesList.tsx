import React, { useEffect, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, RefreshControl, Alert } from 'react-native';
import { useFinance } from '../hooks/useFinance';
import { Fee } from '../services/comprehensiveFinanceApi';
import { Text, Button } from 'react-native-paper';
import { useTranslation } from '../../../contexts/TranslationContext';
import AddFeeModal from './AddFeeModal';
import ExportOptionsModal from './ExportOptionsModal';
import EmptyState from './EmptyState';
import StatsOverview from './StatsOverview';
import FallbackChart from './FallbackChart';
import AcademicYearSelector from '../../../components/AcademicYearSelector';

interface FeesListProps {
  onRefresh?: () => void;
  refreshing?: boolean;
}

const FeesList: React.FC<FeesListProps> = ({ onRefresh, refreshing = false }) => {
  const {
    fees,
    fetchFees,
    createFee,
    deleteFee,
    updateFee,
    bulkCreateFees,
    searchFees,
    generateFeeReport,
    loading,
    error,
    setShowAddFeeModal,
    showAddFeeModal,
    setShowExportModal,
    showExportModal,

  } = useFinance();
  const { t } = useTranslation();
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [academicSessionId, setAcademicSessionId] = useState('');

  useEffect(() => {
    fetchFees({ academicSessionId });
  }, [fetchFees, academicSessionId]);

  const handleRefresh = useCallback(() => {
    fetchFees();
    onRefresh && onRefresh();
  }, [fetchFees, onRefresh]);

  const handleDelete = async (id: string) => {
    try {
      await deleteFee(id);
      Alert.alert(t('fee_deleted'), t('fee_deleted_successfully'));
    } catch (e) {
      Alert.alert(t('error'), t('failed_to_delete_fee'));
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => deleteFee(id)));
      setSelectedIds([]);
      setBulkMode(false);
      Alert.alert(t('fees_deleted'), t('fees_deleted_successfully'));
    } catch (e) {
      Alert.alert(t('error'), t('failed_to_delete_fees'));
    }
  };

  const handleExport = async () => {
    try {
      await generateFeeReport();
      Alert.alert(t('export_complete'), t('fees_exported_successfully'));
    } catch (e) {
      Alert.alert(t('error'), t('export_failed'));
    }
  };

  const renderItem = ({ item }: { item: Fee }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.name}</Text>
      <Text>{t('amount')}: {item.amount}</Text>
      <Text>{t('status')}: {item.status}</Text>
      <Button onPress={() => setSelectedFee(item)}>{t('edit')}</Button>
      <Button onPress={() => handleDelete(item.id)}>{t('delete')}</Button>
      {bulkMode && (
        <Button
          onPress={() => setSelectedIds(ids => ids.includes(item.id) ? ids.filter(i => i !== item.id) : [...ids, item.id])}
        >
          {selectedIds.includes(item.id) ? t('deselect') : t('select')}
        </Button>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Academic Year Selector */}
      <View style={{ padding: 12 }}>
        <AcademicYearSelector value={academicSessionId} onChange={setAcademicSessionId} />
      </View>
      <StatsOverview type="fees" />
      <FallbackChart type="fees" />
      <Button onPress={() => setShowAddFeeModal(true)}>{t('add_fee')}</Button>
      <Button onPress={() => setBulkMode(b => !b)}>{bulkMode ? t('cancel_bulk') : t('bulk_actions')}</Button>
      {bulkMode && (
        <Button onPress={handleBulkDelete}>{t('delete_selected')}</Button>
      )}
      <Button onPress={() => setShowExportModal(true)}>{t('export_to_excel')}</Button>
      <FlatList
        data={fees}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={loading || refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={<EmptyState message={t('no_fees_found')} />}
      />
      <AddFeeModal
        visible={showAddFeeModal || !!selectedFee}
        onClose={() => { setShowAddFeeModal(false); setSelectedFee(null); }}
        fee={selectedFee}
        onSave={async (fee) => {
          if (selectedFee) {
            await updateFee(selectedFee.id, fee);
          } else {
            await createFee(fee);
          }
          setShowAddFeeModal(false);
          setSelectedFee(null);
        }}
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
  item: { backgroundColor: '#fff', marginVertical: 4, padding: 12, borderRadius: 8, elevation: 1 },
  title: { fontWeight: 'bold', fontSize: 16 },
});

export default FeesList; 
