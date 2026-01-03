import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EnvTest: React.FC = () => {
  useEffect(() => {
    // Check if we're in browser
    if (typeof window !== 'undefined') {
      }
    
    // Check if we're in React Native
    if (typeof global !== 'undefined') {
      }
    
    }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔍 Environment Test</Text>
      <Text style={styles.text}>
        Encryption Key: {process.env.REACT_APP_API_ENCRYPTION_KEY ? '✅ SET' : '❌ MISSING'}
      </Text>
      <Text style={styles.text}>
        API URL: {process.env.REACT_APP_API_BASE_URL ? '✅ SET' : '❌ MISSING'}
      </Text>
      <Text style={styles.text}>
        Environment: {process.env.NODE_ENV || '❌ NOT SET'}
      </Text>
      <Text style={styles.instruction}>
        Check browser console for detailed logs
      </Text>
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
    marginBottom: 15,
  },
  text: {
    fontSize: 14,
    marginBottom: 5,
  },
  instruction: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
  },
});

export default EnvTest; 