import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const TestCustomerScreen: React.FC = () => {
  console.log('TestCustomerScreen is rendering!');
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Test Customer Screen</Text>
      <Text style={styles.subtitle}>This is a test to see if navigation works</Text>
      <Text style={styles.message}>If you can see this, navigation is working!</Text>
      
      <TouchableOpacity style={styles.button} onPress={() => console.log('Button pressed!')}>
        <Text style={styles.buttonText}>Test Button</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e8f4fd',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TestCustomerScreen;
