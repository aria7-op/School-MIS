import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface PayrollSummaryProps {
  payrolls: any[];
  onPrint: (payrollId: string) => void;
}

const PayrollSummary: React.FC<PayrollSummaryProps> = ({ payrolls, onPrint }) => {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View style={styles.itemContent}>
        <Text style={[styles.staffName, { color: colors.text }]}>{item.employeeName}</Text>
        <Text style={[styles.amount, { color: colors.text }]}>Afg {item.netSalary !== undefined && item.netSalary !== null ? item.netSalary.toFixed(2) : '0.00'}</Text>
        <Text style={[styles.period, { color: item.status === 'pending' ? '#FFC107' : '#4CAF50' }]}>
          {item.month} {item.year} • {item.status}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.printButton}
        onPress={() => {

          onPrint(item.id);
        }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="print" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Recent Payroll</Text>
      <FlatList
        data={payrolls}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  listContent: {
    paddingRight: 16,
  },
  item: {
    width: 200,
    padding: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  staffName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  period: {
    fontSize: 12,
  },
  printButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PayrollSummary;
