import secureApiService from '../../../services/secureApiService';

export const fetchAllCustomers = async () => {
  const response = await secureApiService.get('/customers');
  return response.data;
};

export const fetchCustomersByStatus = async () => {
  const response = await secureApiService.get('/customers?status=ACTIVE&status=PENDING&status=LEAD');
  return response.data;
};