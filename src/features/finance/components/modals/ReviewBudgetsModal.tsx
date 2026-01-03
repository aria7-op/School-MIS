import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../../contexts/TranslationContext';

interface Budget {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
  variance: number;
  variancePercentage: number;
  status: 'under_budget' | 'on_budget' | 'over_budget';
}

interface ReviewBudgetsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (budgetUpdates: any) => void;
}

const ReviewBudgetsModal: React.FC<ReviewBudgetsModalProps> = ({ visible, onClose, onSave }) => {
  const { colors } = useTheme();
  const { t, lang } = useTranslation();
  
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [selectedView, setSelectedView] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // TODO: Replace with actual budget data from props or API
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const periods = [
    { id: 'current_month', label: 'Current Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'current_quarter', label: 'Current Quarter' },
    { id: 'current_year', label: 'Current Year' },
  ];

  const views = [
    { id: 'all', label: 'All Budgets', icon: 'list' },
    { id: 'over_budget', label: 'Over Budget', icon: 'warning' },
    { id: 'under_budget', label: 'Under Budget', icon: 'check-circle' },
    { id: 'on_budget', label: 'On Budget', icon: 'balance' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over_budget': return '#ef4444';
      case 'under_budget': return '#10b981';
      case 'on_budget': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'over_budget': return 'warning';
      case 'under_budget': return 'check-circle';
      case 'on_budget': return 'balance';
      default: return 'help';
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    const matchesSearch = budget.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesView = selectedView === 'all' || budget.status === selectedView;
    return matchesSearch && matchesView;
  });

  const totalAllocated = budgets.reduce((sum, budget) => sum + budget.allocated, 0);
  const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = budgets.reduce((sum, budget) => sum + budget.remaining, 0);
  const totalVariance = budgets.reduce((sum, budget) => sum + budget.variance, 0);

  const handleSave = () => {
    const budgetUpdates = {
      period: selectedPeriod,
      view: selectedView,
      budgets: filteredBudgets,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        totalVariance,
      },
      reviewedAt: new Date().toISOString(),
    };

    onSave(budgetUpdates);
    onClose();
  };

  const renderBudgetItem = (budget: Budget) => (
    <View key={budget.id} style={[styles.budgetItem, { backgroundColor: colors.card }]}>
      <View style={styles.budgetHeader}>
        <Text style={[styles.budgetName, { color: colors.text }]}>{budget.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(budget.status) + '20' }]}>
          <Icon name={getStatusIcon(budget.status)} size={16} color={getStatusColor(budget.status)} />
          <Text style={[styles.statusText, { color: getStatusColor(budget.status) }]}>
            {budget.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View style={styles.budgetDetails}>
        <View style={styles.budgetRow}>
          <Text style={[styles.budgetLabel, { color: colors.text }]}>Allocated:</Text>
          <Text style={[styles.budgetValue, { color: colors.text }]}>
                                Afg ${budget.allocated.toLocaleString()}
          </Text>
        </View>
        <View style={styles.budgetRow}>
          <Text style={[styles.budgetLabel, { color: colors.text }]}>Spent:</Text>
          <Text style={[styles.budgetValue, { color: colors.text }]}>
            Afg ${budget.spent.toLocaleString()}
          </Text>
        </View>
        <View style={styles.budgetRow}>
          <Text style={[styles.budgetLabel, { color: colors.text }]}>Remaining:</Text>
          <Text style={[
            styles.budgetValue, 
            { color: budget.remaining >= 0 ? '#10b981' : '#ef4444' }
          ]}>
            Afg ${budget.remaining.toLocaleString()}
          </Text>
        </View>
        <View style={styles.budgetRow}>
          <Text style={[styles.budgetLabel, { color: colors.text }]}>Variance:</Text>
          <Text style={[
            styles.budgetValue, 
            { color: budget.variance <= 0 ? '#10b981' : '#ef4444' }
          ]}>
            {budget.variance >= 0 ? '+' : ''}Afg ${budget.variance.toLocaleString()} ({budget.variancePercentage}%)
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Review Budgets</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Period Selection */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Period</Text>
              <View style={styles.optionsGrid}>
                {periods.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionCard,
                      { backgroundColor: colors.card },
                      selectedPeriod === item.id && { borderColor: '#10b981', borderWidth: 2 }
                    ]}
                    onPress={() => setSelectedPeriod(item.id)}
                  >
                    <Text style={[
                      styles.optionLabel,
                      { color: colors.text },
                      selectedPeriod === item.id && { color: '#10b981', fontWeight: '600' }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* View Filter */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>View</Text>
              <View style={styles.optionsGrid}>
                {views.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.optionCard,
                      { backgroundColor: colors.card },
                      selectedView === item.id && { borderColor: '#10b981', borderWidth: 2 }
                    ]}
                    onPress={() => setSelectedView(item.id)}
                  >
                    <Icon 
                      name={item.icon} 
                      size={20} 
                      color={selectedView === item.id ? '#10b981' : colors.text} 
                    />
                    <Text style={[
                      styles.optionLabel,
                      { color: colors.text },
                      selectedView === item.id && { color: '#10b981', fontWeight: '600' }
                    ]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Search */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Search Budgets</Text>
              <TextInput
                style={[styles.searchInput, { borderColor: colors.border, color: colors.text }]}
                placeholder="Search by budget name..."
                placeholderTextColor={colors.text + '80'}
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>

            {/* Summary */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Summary</Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Allocated:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    Afg ${totalAllocated.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Spent:</Text>
                  <Text style={[styles.summaryValue, { color: colors.text }]}>
                    Afg ${totalSpent.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Remaining:</Text>
                  <Text style={[styles.summaryValue, { color: totalRemaining >= 0 ? '#10b981' : '#ef4444' }]}>
                    Afg ${totalRemaining.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>Total Variance:</Text>
                  <Text style={[styles.summaryValue, { color: totalVariance <= 0 ? '#10b981' : '#ef4444' }]}>
                    {totalVariance >= 0 ? '+' : ''}Afg ${totalVariance.toLocaleString()}
                  </Text>
                </View>
              </View>
            </View>

            {/* Budget List */}
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Budgets ({filteredBudgets.length})
              </Text>
              {filteredBudgets.map(renderBudgetItem)}
            </View>
          </ScrollView>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
              <Text style={styles.buttonText}>Save Review</Text>
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
    marginTop: 4,
    fontSize: 14,
    textAlign: 'center',
  },
  searchInput: {
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
  budgetItem: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  budgetDetails: {
    gap: 8,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  budgetValue: {
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
  saveButton: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ReviewBudgetsModal; 
