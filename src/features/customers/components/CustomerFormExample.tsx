import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import CustomerForm from './CustomerForm';
import { useCustomerForm } from '../hooks/useCustomerForm';
import { Customer } from '../models';

interface CustomerFormExampleProps {
  visible: boolean;
  onClose: () => void;
  customer?: Customer | null;
  onCustomerSaved?: (customer: Customer) => void;
}

const CustomerFormExample: React.FC<CustomerFormExampleProps> = ({
  visible,
  onClose,
  customer,
  onCustomerSaved
}) => {
  const { saveCustomer, loading } = useCustomerForm({
    onSuccess: (savedCustomer) => {
      onCustomerSaved?.(savedCustomer);
      onClose();
    },
    onError: (error) => {
      
    }
  });

  const handleSave = async (customerData: Partial<Customer>) => {
    try {
      await saveCustomer(customerData);
    } catch (error) {
      
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </Text>
          <View style={styles.placeholder} />
        </View>
        
        <CustomerForm
          customer={customer}
          onSave={handleSave}
          onCancel={onClose}
          loading={loading}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
});

export default CustomerFormExample; 
