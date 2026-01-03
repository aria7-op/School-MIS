import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

interface UpcomingBillsProps {
  bills: any[];
  onPrint: (billId: string) => void;
}

const UpcomingBills: React.FC<UpcomingBillsProps> = ({ bills, onPrint }) => {
  const { colors } = useTheme();

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.item, { backgroundColor: colors.card }]}>
      <View style={styles.itemContent}>
        <Text style={[styles.studentName, { color: colors.text }]}>{item.student}</Text>
        <Text style={[styles.amount, { color: colors.text }]}>Afg {item.amount.toFixed(2)}</Text>
        <Text style={[styles.dueDate, { color: item.status === 'unpaid' ? '#F44336' : '#4CAF50' }]}>
          Due: {item.dueDate} • {item.status}
        </Text>
      </View>
      <TouchableOpacity 
        style={styles.printButton}
        onPress={() => onPrint(item.id)}
      >
        <MaterialIcons name="print" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.title, { color: colors.text }]}>Upcoming Bills</Text>
      <FlatList
        data={bills}
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
  studentName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 12,
  },
  printButton: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});

export default UpcomingBills;
