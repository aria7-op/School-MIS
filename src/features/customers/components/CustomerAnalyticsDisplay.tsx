import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { CustomerAnalytics, Customer } from '../utils/customerDataUtils';

const { width } = Dimensions.get('window');
const isLargeScreen = width >= 768;

interface CustomerAnalyticsDisplayProps {
  analytics: CustomerAnalytics;
  onCustomerSelect?: (customer: Customer) => void;
  onCategorySelect?: (category: string) => void;
}

const CustomerAnalyticsDisplay: React.FC<CustomerAnalyticsDisplayProps> = ({
  analytics,
  onCustomerSelect,
  onCategorySelect
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return '#ff4444';
      case 'HIGH': return '#ff8800';
      case 'MEDIUM': return '#ffbb33';
      case 'LOW': return '#00C851';
      default: return '#666666';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'STUDENT': return '#2196F3';
      case 'PARENT': return '#4CAF50';
      case 'TEACHER': return '#FF9800';
      case 'STAFF': return '#9C27B0';
      case 'PROSPECT': return '#607D8B';
      case 'ALUMNI': return '#795548';
      default: return '#666666';
    }
  };

  const renderMetricCard = (title: string, value: string | number, subtitle: string, icon: string, color: string) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <MaterialIcons name={icon as any} size={24} color={color} />
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  const renderBreakdownCard = (title: string, data: Array<{ [key: string]: any }>, keyField: string, countField: string, percentageField: string, colorFunction: (value: string) => string) => (
    <View style={styles.breakdownCard}>
      <Text style={styles.breakdownTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.breakdownScroll}>
        {data.slice(0, 10).map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.breakdownItem, { borderLeftColor: colorFunction(item[keyField]) }]}
            onPress={() => onCategorySelect?.(item[keyField])}
          >
            <Text style={styles.breakdownItemLabel}>{item[keyField]}</Text>
            <Text style={styles.breakdownItemCount}>{item[countField]}</Text>
            <Text style={styles.breakdownItemPercentage}>{formatPercentage(item[percentageField])}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderCategoryCard = (category: any) => (
    <TouchableOpacity
      key={category.name}
      style={styles.categoryCard}
      onPress={() => onCategorySelect?.(category.name)}
    >
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categoryCount}>{category.count}</Text>
      </View>
      <Text style={styles.categoryPercentage}>{formatPercentage(category.percentage)}</Text>
      <View style={styles.categoryCustomers}>
        {category.customers.slice(0, 3).map((customer: Customer, index: number) => (
          <TouchableOpacity
            key={customer.id}
            style={styles.customerChip}
            onPress={() => onCustomerSelect?.(customer)}
          >
            <Text style={styles.customerChipText}>{customer.name}</Text>
            <Text style={styles.customerChipValue}>{formatCurrency(customer.value || 0)}</Text>
          </TouchableOpacity>
        ))}
        {category.customers.length > 3 && (
          <Text style={styles.moreCustomers}>+{category.customers.length - 3} more</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Main Metrics */}
      <View style={styles.metricsSection}>
        <Text style={styles.sectionTitle}>📊 Customer Overview</Text>
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Total Customers',
            analytics.totalCustomers.toLocaleString(),
            'All customers in system',
            'people',
            '#2196F3'
          )}
          {renderMetricCard(
            'Total Value',
            formatCurrency(analytics.totalValue),
            'Combined customer value',
            'attach-money',
            '#4CAF50'
          )}
          {renderMetricCard(
            'Average Value',
            formatCurrency(analytics.averageValue),
            'Per customer average',
            'trending-up',
            '#FF9800'
          )}
          {renderMetricCard(
            'Conversion Rate',
            formatPercentage(analytics.conversionRate),
            'Customers with value > 0',
            'check-circle',
            '#9C27B0'
          )}
        </View>
      </View>

      {/* Customer Categories */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>📋 Customer Categories</Text>
        <View style={styles.categoriesGrid}>
          {analytics.categories.map(renderCategoryCard)}
        </View>
      </View>

      {/* Top Sources */}
      <View style={styles.breakdownSection}>
        {renderBreakdownCard(
          'Top Sources',
          analytics.topSources,
          'source',
          'count',
          'percentage',
          () => '#2196F3'
        )}
      </View>

      {/* Top Cities */}
      <View style={styles.breakdownSection}>
        {renderBreakdownCard(
          'Top Cities',
          analytics.topCities,
          'city',
          'count',
          'percentage',
          () => '#4CAF50'
        )}
      </View>

      {/* Priority Breakdown */}
      <View style={styles.breakdownSection}>
        {renderBreakdownCard(
          'Priority Breakdown',
          analytics.priorityBreakdown,
          'priority',
          'count',
          'percentage',
          getPriorityColor
        )}
      </View>

      {/* Type Breakdown */}
      <View style={styles.breakdownSection}>
        {renderBreakdownCard(
          'Type Breakdown',
          analytics.typeBreakdown,
          'type',
          'count',
          'percentage',
          getTypeColor
        )}
      </View>

      {/* Gender Breakdown */}
      <View style={styles.breakdownSection}>
        {renderBreakdownCard(
          'Gender Breakdown',
          analytics.genderBreakdown,
          'gender',
          'count',
          'percentage',
          () => '#9C27B0'
        )}
      </View>

      {/* Purpose Breakdown */}
      <View style={styles.breakdownSection}>
        {renderBreakdownCard(
          'Purpose Breakdown',
          analytics.purposeBreakdown,
          'purpose',
          'count',
          'percentage',
          () => '#607D8B'
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  metricsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  metricsGrid: {
    flexDirection: isLargeScreen ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    flex: isLargeScreen ? 1 : undefined,
    minWidth: isLargeScreen ? 200 : undefined,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  categoriesSection: {
    padding: 16,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  categoryPercentage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  categoryCustomers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  customerChip: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  customerChipText: {
    fontSize: 12,
    color: '#333',
    marginRight: 4,
  },
  customerChipValue: {
    fontSize: 10,
    color: '#666',
  },
  moreCustomers: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  breakdownSection: {
    padding: 16,
  },
  breakdownCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  breakdownScroll: {
    flexGrow: 0,
  },
  breakdownItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderLeftWidth: 3,
    minWidth: 100,
  },
  breakdownItemLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  breakdownItemCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 2,
  },
  breakdownItemPercentage: {
    fontSize: 10,
    color: '#666',
  },
});

export default CustomerAnalyticsDisplay; 