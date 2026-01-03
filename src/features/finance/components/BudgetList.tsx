import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from '../../../contexts/TranslationContext';

import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { useFinance } from '../hooks/useFinance';
import { Budget as BudgetType } from '../services/comprehensiveFinanceApi';

interface Budget {
  id: number;
  category: string;
  allocated_amount: string;
  spend_amount: string;
  currency: string;
  month: string;
  notes: string;
}

interface BudgetListProps {
  budgets: Budget[];
  isLoading?: boolean;
}

const BudgetList: React.FC<BudgetListProps> = ({ budgets, isLoading = false }) => {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const finance = useFinance();

  // Load comprehensive budget data
  useEffect(() => {
    const loadComprehensiveBudgetData = async () => {
      setLoading(true);
      try {

        // Load all comprehensive budget data
        await Promise.all([
          finance.fetchBudgets(),
          finance.getBudgetStatistics(),
          finance.getBudgetAnalytics(),
          finance.getBudgetDashboard()
        ]);

      } catch (error) {
        
      } finally {
        setLoading(false);
      }
    };

    loadComprehensiveBudgetData();
  }, []); // Empty dependency array to run only once on mount

  // Use only real data, no dummy fallback
  const displayBudgets = useMemo(() => {
    return budgets || [];
  }, [budgets]);

  // Calculate KPIs with comprehensive backend integration
  const kpis = useMemo(() => {
    const totalAllocated = displayBudgets.reduce((sum, item) => sum + parseFloat(item.allocated_amount), 0);
    const totalSpent = displayBudgets.reduce((sum, item) => sum + parseFloat(item.spend_amount), 0);
    const totalRemaining = totalAllocated - totalSpent;
    const utilizationRate = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;
    const overBudgetCategories = displayBudgets.filter(item => 
      parseFloat(item.spend_amount) > parseFloat(item.allocated_amount)
    ).length;

    return {
      totalAllocated,
      totalSpent,
      totalRemaining,
      utilizationRate,
      overBudgetCategories,
      currency: displayBudgets[0]?.currency || 'Afg'
    };
  }, [displayBudgets]);

  // Chart data
  const chartData = useMemo(() => {
    const categories = displayBudgets.map(item => item.category);
    const allocated = displayBudgets.map(item => parseFloat(item.allocated_amount));
    const spent = displayBudgets.map(item => parseFloat(item.spend_amount));

    return {
      lineChart: {
        labels: categories.slice(0, 6),
        datasets: [
          {
            data: allocated.slice(0, 6),
            color: (opacity = 1) => `rgba(16, 185, 129, Afg {opacity})`,
            strokeWidth: 2
          },
          {
            data: spent.slice(0, 6),
            color: (opacity = 1) => `rgba(239, 68, 68, Afg {opacity})`,
            strokeWidth: 2
          }
        ]
      },
      pieChart: {
        data: displayBudgets.slice(0, 5).map((item, index) => ({
          name: item.category,
          population: parseFloat(item.spend_amount),
          color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
          legendFontColor: '#7F7F7F',
          legendFontSize: 12
        }))
      },
      barChart: {
        labels: categories.slice(0, 5),
        datasets: [{
          data: displayBudgets.slice(0, 5).map(item => 
            ((parseFloat(item.spend_amount) / parseFloat(item.allocated_amount)) * 100)
          )
        }]
      }
    };
  }, [displayBudgets]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text style={styles.loadingText}>{t('loadingBudgets')}</Text>
      </View>
    );
  }

  if (!displayBudgets || displayBudgets.length === 0) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="account-balance-wallet" size={64} color="#64748b" />
        <Text style={styles.empty}>{t('noBudgetsFound')}</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialIcons name="add" size={20} color="white" />
          <Text style={styles.addButtonText}>{t('addBudget')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderKPI = (title: string, value: string, icon: string, color: string, subtitle?: string) => (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={styles.kpiHeader}>
        <MaterialIcons name={icon as any} size={24} color={color} />
        <Text style={styles.kpiTitle}>{title}</Text>
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.kpiSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderChart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{t('budgetUtilization')}</Text>
        <View style={styles.chartTabs}>
          <TouchableOpacity style={[styles.chartTab, styles.activeTab]}>
            <Text style={styles.activeTabText}>{t('line')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chartTab}>
            <Text style={styles.tabText}>{t('pie')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.chartTab}>
            <Text style={styles.tabText}>{t('bar')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <LineChart
        data={chartData.lineChart}
        width={screenWidth - 32}
        height={220}
        chartConfig={{
          backgroundColor: '#ffffff',
          backgroundGradientFrom: '#ffffff',
          backgroundGradientTo: '#ffffff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(30, 41, 59, Afg {opacity})`,
          labelColor: (opacity = 1) => `rgba(100, 116, 139, Afg {opacity})`,
          style: {
            borderRadius: 16
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#4f46e5'
          }
        }}
        bezier
        style={styles.chart}
      />
      
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>{t('allocated')}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>{t('spent')}</Text>
        </View>
      </View>
    </View>
  );

  const renderBudgetItem = ({ item }: { item: Budget }) => {
    const allocated = parseFloat(item.allocated_amount);
    const spent = parseFloat(item.spend_amount);
    const remaining = allocated - spent;
    const utilization = allocated > 0 ? (spent / allocated) * 100 : 0;
    const isOverBudget = spent > allocated;

    return (
      <View style={[styles.card, isOverBudget && styles.overBudgetCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.categoryContainer}>
            <MaterialIcons 
              name={getCategoryIcon(item.category)} 
              size={20} 
              color={isOverBudget ? '#ef4444' : '#10b981'} 
            />
            <Text style={[styles.category, isOverBudget && styles.overBudgetText]}>
              {item.category}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.month}>{item.month}</Text>
            {isOverBudget && (
              <View style={styles.overBudgetBadge}>
                <MaterialIcons name="warning" size={12} color="white" />
                <Text style={styles.overBudgetBadgeText}>{t('overBudget')}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>{t('utilization')}</Text>
            <Text style={styles.progressValue}>{utilization.toFixed(1)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `Afg {Math.min(utilization, 100)}%`,
                  backgroundColor: isOverBudget ? '#ef4444' : '#10b981'
                }
              ]} 
            />
          </View>
        </View>
        
        <View style={styles.amountContainer}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{t('allocated')}</Text>
            <Text style={styles.allocatedAmount}>
              {item.currency} {allocated.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{t('spent')}</Text>
            <Text style={[styles.spentAmount, isOverBudget && styles.overBudgetText]}>
              {item.currency} {spent.toLocaleString()}
            </Text>
          </View>
          
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>{t('remaining')}</Text>
            <Text style={[styles.remainingAmount, remaining < 0 && styles.overBudgetText]}>
              {item.currency} {remaining.toLocaleString()}
            </Text>
          </View>
        </View>
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>{t('notes')}:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="edit" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('edit')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="trending-up" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('analyze')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="notifications" size={16} color="#64748b" />
            <Text style={styles.actionText}>{t('alerts')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAlerts = () => {
    const overBudgetItems = displayBudgets.filter(item => 
      parseFloat(item.spend_amount) > parseFloat(item.allocated_amount)
    );

    if (overBudgetItems.length === 0) return null;

    return (
      <View style={styles.alertsContainer}>
        <View style={styles.alertsHeader}>
          <MaterialIcons name="warning" size={20} color="#f59e0b" />
          <Text style={styles.alertsTitle}>{t('budgetAlerts')}</Text>
        </View>
        {overBudgetItems.slice(0, 3).map(item => (
          <View key={item.id} style={styles.alertItem}>
            <MaterialIcons name="error" size={16} color="#ef4444" />
            <Text style={styles.alertText}>
              {t('overBudgetAlert', { category: item.category, amount: 
                (parseFloat(item.spend_amount) - parseFloat(item.allocated_amount)).toFixed(2) 
              })}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* KPI Cards */}
        <View style={styles.kpiGrid}>
          {renderKPI(
            t('totalAllocated'),
            `Afg {kpis.currency} Afg {kpis.totalAllocated.toLocaleString()}`,
            'account-balance-wallet',
            '#10b981'
          )}
          {renderKPI(
            t('totalSpent'),
            `Afg {kpis.currency} Afg {kpis.totalSpent.toLocaleString()}`,
            'trending-down',
            '#ef4444'
          )}
          {renderKPI(
            t('utilizationRate'),
            `Afg {kpis.utilizationRate.toFixed(1)}%`,
            'pie-chart',
            kpis.utilizationRate > 90 ? '#ef4444' : '#10b981'
          )}
          {renderKPI(
            t('overBudgetCategories'),
            kpis.overBudgetCategories.toString(),
            'warning',
            '#f59e0b',
            t('categories')
          )}
        </View>

        {/* Charts */}
        {renderChart()}

        {/* Alerts */}
        {renderAlerts()}

        {/* Budget List */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{t('budgetDetails')}</Text>
          <TouchableOpacity style={styles.addBudgetButton}>
            <MaterialIcons name="add" size={20} color="white" />
            <Text style={styles.addBudgetButtonText}>{t('addBudget')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={displayBudgets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBudgetItem}
          scrollEnabled={false}
          contentContainerStyle={styles.listContent}
        />
      </ScrollView>
    </View>
  );
};

// Helper function to get category icon
const getCategoryIcon = (category: string) => {
  const icons: { [key: string]: string } = {
    'Education': 'school',
    'Technology': 'computer',
    'Marketing': 'campaign',
    'Operations': 'build',
    'Administration': 'admin-panel-settings',
    'Maintenance': 'handyman',
    'Utilities': 'power',
    'Supplies': 'inventory',
    'Travel': 'flight',
    'Training': 'psychology'
  };
  return icons[category] || 'category';
};

// Generate dummy budget data

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  empty: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  kpiSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  chartTabs: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 4,
  },
  chartTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  tabText: {
    fontSize: 12,
    color: '#64748b',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#64748b',
  },
  alertsContainer: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    margin: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  alertsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginLeft: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 8,
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  addBudgetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBudgetButtonText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overBudgetCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  overBudgetText: {
    color: '#ef4444',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  month: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  overBudgetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  overBudgetBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e293b',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountBox: {
    alignItems: 'center',
    flex: 1,
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  allocatedAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  remainingAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  notesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#475569',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
});

export default BudgetList;  
