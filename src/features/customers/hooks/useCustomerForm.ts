import { useState } from 'react';
import { Alert } from 'react-native';
import { Customer } from '../models';
import { customerApiService, BackendCustomer } from '../services/customerApi';

interface UseCustomerFormProps {
  onSuccess?: (customer: Customer) => void;
  onError?: (error: string) => void;
}

export const useCustomerForm = ({ onSuccess, onError }: UseCustomerFormProps = {}) => {
  const [loading, setLoading] = useState(false);

  const createCustomer = async (customerData: Partial<BackendCustomer>) => {
    setLoading(true);
    try {
      const response = await customerApiService.createCustomer(customerData);
      
      if (response.success) {
        Alert.alert('Success', 'Customer created successfully!');
        onSuccess?.(response.data as Customer);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create customer');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create customer';
      Alert.alert('Error', errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<BackendCustomer>) => {
    setLoading(true);
    try {
      const response = await customerApiService.updateCustomer(id, customerData);
      
      if (response.success) {
        Alert.alert('Success', 'Customer updated successfully!');
        onSuccess?.(response.data as Customer);
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update customer');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update customer';
      Alert.alert('Error', errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteCustomer = async (id: string) => {
    setLoading(true);
    try {
      const response = await customerApiService.deleteCustomer(id);
      
      if (response.success) {
        Alert.alert('Success', 'Customer deleted successfully!');
        return true;
      } else {
        throw new Error(response.message || 'Failed to delete customer');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete customer';
      Alert.alert('Error', errorMessage);
      onError?.(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const saveCustomer = async (customer: Partial<BackendCustomer>) => {
    if (customer.id) {
      return await updateCustomer(customer.id.toString(), customer);
    } else {
      return await createCustomer(customer);
    }
  };

  return {
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    saveCustomer,
  };
}; 
