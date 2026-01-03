// Test configuration for owners feature
export const TEST_CONFIG = {
  // Test token for John Doe (ID: 1)
  TEST_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJlbWFpbCI6ImpvaG4uZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6IlNVUEVSX0FETUlOIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNzUwMjU4NDI0LCJleHAiOjE3NTAzNDQ4MjR9.JY1ovw0WBTXUqUVmVXohGamPYG2-wwPPscQZhx3lDSE',
  
  // Test credentials
  TEST_CREDENTIALS: {
    email: 'john.doe@example.com',
    password: 'testpassword123'
  },
  
  // Test owner data
  TEST_OWNER: {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    status: 'ACTIVE',
    timezone: 'America/New_York',
    locale: 'en-US',
    emailVerified: true,
    createdAt: '2024-01-15T10:30:00.000Z',
    updatedAt: '2024-01-15T10:30:00.000Z',
    metadata: {
      department: 'Administration',
      location: 'New York',
      preferences: {
        theme: 'light',
        notifications: true
      }
    },
    _count: {
      schools: 3,
      createdUsers: 15
    }
  },
  
  // API base URL
  API_BASE_URL: 'https://khwanzay.school/api/owners'
};

export const getAuthHeaders = (token?: string) => ({
  Authorization: `Bearer ${token}`
});

export const isTestMode = () => {
  return false;
};
