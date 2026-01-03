import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../../../theme';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  class: string;
  status: string;
}

interface FeeCalculatorProps {
  student?: Student;
  parentData?: any;
}

const FeeCalculator: React.FC<FeeCalculatorProps> = ({ student, parentData }) => {
  const calculateFees = () => {
    // Mock fee calculation logic
    const baseTuition = 800;
    const transportFee = student?.grade === '10th Grade' ? 200 : 150;
    const libraryFee = 50;
    const sportsFee = 100;
    
    return {
      tuition: baseTuition,
      transport: transportFee,
      library: libraryFee,
      sports: sportsFee,
      total: baseTuition + transportFee + libraryFee + sportsFee
    };
  };

  const fees = calculateFees();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="calculate" size={24} color={theme.colors.primary} />
        <Text style={styles.title}>Fee Breakdown</Text>
      </View>
      
      <View style={styles.feeItems}>
        <View style={styles.feeItem}>
          <Text style={styles.feeLabel}>Tuition Fee</Text>
          <Text style={styles.feeAmount}>${fees.tuition}</Text>
        </View>
        
        <View style={styles.feeItem}>
          <Text style={styles.feeLabel}>Transport Fee</Text>
          <Text style={styles.feeAmount}>${fees.transport}</Text>
        </View>
        
        <View style={styles.feeItem}>
          <Text style={styles.feeLabel}>Library Fee</Text>
          <Text style={styles.feeAmount}>${fees.library}</Text>
        </View>
        
        <View style={styles.feeItem}>
          <Text style={styles.feeLabel}>Sports Fee</Text>
          <Text style={styles.feeAmount}>${fees.sports}</Text>
        </View>
      </View>
      
      <View style={styles.totalSection}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Fees</Text>
          <Text style={styles.totalAmount}>${fees.total}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.calculateButton}>
        <Text style={styles.calculateButtonText}>Calculate Installments</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
  },
  feeItems: {
    marginBottom: 16,
  },
  feeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  feeLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  totalSection: {
    borderTopWidth: 2,
    borderTopColor: theme.colors.border,
    paddingTop: 16,
    marginBottom: 16,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  calculateButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FeeCalculator; 