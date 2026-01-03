import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface ViewAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
  onGenerate: (analyticsConfig: any) => void;
}

const ViewAnalyticsModal: React.FC<ViewAnalyticsModalProps> = ({ visible, onClose, onGenerate }) => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [selectedCharts, setSelectedCharts] = useState<string[]>(['revenue_trend']);
  const [selectedTimeframe, setSelectedTimeframe] = useState('last_30_days');
  const [includeComparisons, setIncludeComparisons] = useState(true);
  const [groupBy, setGroupBy] = useState('month');
  const [showForecasts, setShowForecasts] = useState(false);

  const chartTypes = [
    { id: 'revenue_trend', label: 'Revenue Trend', icon: 'trending-up' },
    { id: 'expense_breakdown', label: 'Expense Breakdown', icon: 'pie-chart' },
    { id: 'cash_flow', label: 'Cash Flow', icon: 'account-balance' },
    { id: 'profit_margin', label: 'Profit Margin', icon: 'show-chart' },
    { id: 'payment_analysis', label: 'Payment Analysis', icon: 'payment' },
    { id: 'budget_variance', label: 'Budget Variance', icon: 'compare' },
    { id: 'payroll_analytics', label: 'Payroll Analytics', icon: 'people' },
    { id: 'financial_ratios', label: 'Financial Ratios', icon: 'analytics' },
  ];

  const timeframes = [
    { id: 'last_7_days', label: 'Last 7 Days' },
    { id: 'last_30_days', label: 'Last 30 Days' },
    { id: 'last_90_days', label: 'Last 90 Days' },
    { id: 'last_6_months', label: 'Last 6 Months' },
    { id: 'last_year', label: 'Last Year' },
    { id: 'year_to_date', label: 'Year to Date' },
    { id: 'custom', label: 'Custom Range' },
  ];

  const groupByOptions = [
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'quarter', label: 'Quarter' },
    { id: 'year', label: 'Year' },
  ];

  const toggleChart = (id: string) => {
    setSelectedCharts(prev => 
      prev.includes(id) 
        ? prev.filter(chart => chart !== id)
        : [...prev, id]
    );
  };

  const selectAllCharts = () => {
    setSelectedCharts(chartTypes.map(chart => chart.id));
  };

  const deselectAllCharts = () => {
    setSelectedCharts([]);
  };

  const handleGenerate = () => {
    if (selectedCharts.length === 0) {
      Alert.alert('Validation Error', 'Please select at least one chart type.');
      return;
    }

    const analyticsConfig = {
      charts: selectedCharts,
      timeframe: selectedTimeframe,
      includeComparisons,
      groupBy,
      showForecasts,
      generatedAt: new Date().toISOString(),
    };

    onGenerate(analyticsConfig);
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
            <Text style={[styles.title, { color: colors.text }]}>View Analytics</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Chart Types */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Chart Types</Text>
                <View style={styles.selectionButtons}>
                  <TouchableOpacity onPress={selectAllCharts} style={styles.selectionButton}>
                    <Text style={styles.selectionButtonText}>Select All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={deselectAllCharts} style={styles.selectionButton}>
                    <Text style={styles.selectionButtonText}>Deselect All</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.optionsGrid}>
                {chartTypes.map(item => renderOption(item, selectedCharts, toggleChart))}
              </View>
            </View>

            {/* Timeframe */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Timeframe</Text>
              <View style={styles.optionsGrid}>
                {timeframes.map(item => renderOption(item, selectedTimeframe, setSelectedTimeframe))}
              </View>
            </View>

            {/* Group By */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Group By</Text>
              <View style={styles.optionsGrid}>
                {groupByOptions.map(item => renderOption(item, groupBy, setGroupBy))}
              </View>
            </View>

            {/* Analytics Options */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Analytics Options</Text>
              
              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Include Comparisons</Text>
                <Switch
                  value={includeComparisons}
                  onValueChange={setIncludeComparisons}
                  trackColor={{ false: '#767577', true: '#10b981' }}
                  thumbColor={includeComparisons ? '#fff' : '#f4f3f4'}
                />
              </View>

              <View style={styles.optionRow}>
                <Text style={[styles.optionLabel, { color: colors.text }]}>Show Forecasts</Text>
                <Switch
                  value={showForecasts}
                  onValueChange={setShowForecasts}
                  trackColor={{ false: '#767577', true: '#10b981' }}
                  thumbColor={showForecasts ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>

            {/* Summary */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Analytics Summary</Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Selected Charts:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {selectedCharts.length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Timeframe:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {timeframes.find(t => t.id === selectedTimeframe)?.label}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Group By:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {groupByOptions.find(g => g.id === groupBy)?.label}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Comparisons:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {includeComparisons ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Forecasts:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    {showForecasts ? 'Enabled' : 'Disabled'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.generateButton]} onPress={handleGenerate}>
              <Text style={styles.buttonText}>Generate Analytics</Text>
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
  generateButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ViewAnalyticsModal; 
