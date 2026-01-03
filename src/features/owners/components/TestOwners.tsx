import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import ownerService from '../services/ownerService';
import { TEST_CONFIG } from '../config/testConfig';

const TestOwners: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
      Alert.alert('Success', `${testName} completed successfully!`);
    } catch (error: any) {
      setResults(prev => ({ ...prev, [testName]: { success: false, error: error.message || error } }));
      Alert.alert('Error', `${testName} failed: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  const tests = [
    {
      name: 'Health Check',
      function: () => ownerService.healthCheck()
    },
    {
      name: 'Get Profile',
      function: () => ownerService.getProfile()
    },
    {
      name: 'Get Analytics',
      function: () => ownerService.getAnalytics('1')
    },
    {
      name: 'Get All Owners',
      function: () => ownerService.getAllOwners()
    },
    {
      name: 'Get Owner Stats',
      function: () => ownerService.getOwnerStats()
    },
    {
      name: 'Get Owner by ID',
      function: () => ownerService.getOwnerById('1')
    }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Owners API Test</Text>
        <Text style={styles.subtitle}>Using test token for John Doe</Text>
        <Text style={styles.token}>Token: {TEST_CONFIG.TEST_TOKEN.substring(0, 50)}...</Text>
      </View>

      <View style={styles.testSection}>
        <Text style={styles.sectionTitle}>API Tests</Text>
        {tests.map((test, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.testButton, loading && styles.disabledButton]}
            onPress={() => runTest(test.name, test.function)}
            disabled={loading}
          >
            <Text style={styles.testButtonText}>{test.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>Test Results</Text>
        {Object.entries(results).map(([testName, result]: [string, any]) => (
          <View key={testName} style={styles.resultItem}>
            <Text style={[styles.resultTitle, result.success ? styles.success : styles.error]}>
              {testName}: {result.success ? '✅ PASS' : '❌ FAIL'}
            </Text>
            <Text style={styles.resultData}>
              {result.success 
                ? JSON.stringify(result.data, null, 2)
                : result.error
              }
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  token: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  testSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsSection: {
    padding: 20,
  },
  resultItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  success: {
    color: '#28a745',
  },
  error: {
    color: '#dc3545',
  },
  resultData: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default TestOwners; 
