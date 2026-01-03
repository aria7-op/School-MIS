import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import secureApiService from '../services/secureApiService';

const EncryptionStatus: React.FC = () => {
  const [isEncrypted, setIsEncrypted] = useState<boolean>(false);
  const [encryptionKey, setEncryptionKey] = useState<boolean>(false);
  const [apiUrl, setApiUrl] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkEncryptionStatus();
  }, []);

  const checkEncryptionStatus = () => {
    const hasKey = !!process.env.REACT_APP_API_ENCRYPTION_KEY;
    const hasUrl = !!process.env.REACT_APP_API_BASE_URL;
    
    setEncryptionKey(hasKey);
    setApiUrl(process.env.REACT_APP_API_BASE_URL || 'Not set');
    setIsEncrypted(hasKey && hasUrl);
  };

  const testEncryption = async () => {
    try {
      setTestResult('Testing...');
      
      // Test a simple API call
      await secureApiService.get('/health');
      
      setTestResult('✅ Encryption working! Check console for details.');
      Alert.alert('Success', 'Encryption test passed! Check browser console for verification logs.');
      
    } catch (error: any) {
      setTestResult('❌ Test failed: ' + error.message);
      Alert.alert('Test Failed', 'Encryption test failed. Check console for details.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔐 Encryption Status</Text>
      
      <View style={styles.statusContainer}>
        <View style={styles.statusItem}>
          <MaterialIcons 
            name={isEncrypted ? 'security' : 'security'} 
            size={24} 
            color={isEncrypted ? '#4CAF50' : '#F44336'} 
          />
          <Text style={[styles.statusText, { color: isEncrypted ? '#4CAF50' : '#F44336' }]}>
            {isEncrypted ? 'ENCRYPTED' : 'NOT ENCRYPTED'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <MaterialIcons 
            name={encryptionKey ? 'key' : 'key-off'} 
            size={24} 
            color={encryptionKey ? '#4CAF50' : '#F44336'} 
          />
          <Text style={[styles.statusText, { color: encryptionKey ? '#4CAF50' : '#F44336' }]}>
            {encryptionKey ? 'KEY SET' : 'KEY MISSING'}
          </Text>
        </View>

        <View style={styles.statusItem}>
          <MaterialIcons 
            name="link" 
            size={24} 
            color={apiUrl !== 'Not set' ? '#4CAF50' : '#F44336'} 
          />
          <Text style={[styles.statusText, { color: apiUrl !== 'Not set' ? '#4CAF50' : '#F44336' }]}>
            {apiUrl !== 'Not set' ? 'API URL SET' : 'API URL MISSING'}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.testButton} onPress={testEncryption}>
        <Text style={styles.testButtonText}>🧪 Test Encryption</Text>
      </TouchableOpacity>

      {testResult && (
        <Text style={styles.testResult}>{testResult}</Text>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>📋 How to Verify:</Text>
        <Text style={styles.instruction}>1. Open browser console (F12)</Text>
        <Text style={styles.instruction}>2. Make any API call in your app</Text>
        <Text style={styles.instruction}>3. Look for "🔐 ENCRYPTION VERIFICATION" logs</Text>
        <Text style={styles.instruction}>4. All calls should show "✅ SET" for encryption key</Text>
        <Text style={styles.instruction}>5. POST/PUT/PATCH calls should show "✅ YES" for data encryption</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    margin: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  statusContainer: {
    marginBottom: 15,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
  statusText: {
    marginLeft: 10,
    fontWeight: 'bold',
  },
  testButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  testButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  testResult: {
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  instructions: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
  },
  instructionTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
  },
  instruction: {
    marginBottom: 5,
    fontSize: 12,
  },
});

export default EncryptionStatus; 