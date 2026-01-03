import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomerAnalyticsProps {
  data: any;
}

const CustomerAnalytics: React.FC<CustomerAnalyticsProps> = ({ data }) => {
  if (!data) return null;

  const formatNumber = (num: number) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="analytics" size={20} color="#6366f1" />
        <Text style={styles.title}>Quick Stats</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Ionicons name="people" size={24} color="#3b82f6" />
          <Text style={styles.metricValue}>
            {formatNumber(data.totalCustomers || 0)}
          </Text>
          <Text style={styles.metricLabel}>Total Customers</Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
          <Text style={styles.metricValue}>
            {formatNumber(data.activeCustomers || 0)}
          </Text>
          <Text style={styles.metricLabel}>Active</Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="trending-up" size={24} color="#2563eb" />
          <Text style={styles.metricValue}>
            {formatNumber(data.convertedCustomers || 0)}
          </Text>
          <Text style={styles.metricLabel}>Converted</Text>
        </View>

        <View style={styles.metricCard}>
          <Ionicons name="cash" size={24} color="#d97706" />
          <Text style={styles.metricValue}>
            {formatCurrency(data.totalValue || 0)}
          </Text>
          <Text style={styles.metricLabel}>Total Value</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    minWidth: 100,
    alignItems: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default CustomerAnalytics; 