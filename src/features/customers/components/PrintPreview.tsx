import React from 'react';
declare global {
  interface Document {
    execCommand(command: string): boolean;
  }
}
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PrintPreviewProps {
  customerName: string;
  purpose: string;
  onClose: () => void;
}

export default function PrintPreview({
  customerName,
  purpose,
  onClose
}: PrintPreviewProps) {
  const handlePrint = () => {
    try {
      // Create text content
      const content = `Customer Token
Name: ${customerName}
Purpose: ${purpose}
Date: ${new Date().toLocaleDateString()}
Time: ${new Date().toLocaleTimeString()}`;

      // For web, create a temporary textarea and copy the content
      const textarea = document.createElement('textarea');
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      
      Alert.alert('Success', 'Token copied to clipboard!');
      onClose();
    } catch (error) {
      
      Alert.alert('Error', 'Failed to copy token. Please try again.');
    }
  };
  return (
    <View style={styles.container}>
      {/* Header with close button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Print Preview</Text>
        <TouchableOpacity onPress={handlePrint} style={styles.printButton}>
          <MaterialIcons name="print" size={24} color="#2196F3" />
        </TouchableOpacity>
      </View>

      {/* Token Preview Card */}
      <View style={styles.tokenCard}>
        {/* Logo or icon */}
        <View style={styles.logoContainer}>
          <MaterialIcons name="person" size={40} color="#2196F3" />
        </View>

        {/* Customer Info */}
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.purpose}>{purpose}</Text>
        </View>

        {/* Timestamp */}
        <View style={styles.timestamp}>
          <Text style={styles.timestampText}>
            {new Date().toLocaleDateString()} | {new Date().toLocaleTimeString()}
          </Text>
        </View>
      </View>

      {/* Print Button */}
      <TouchableOpacity
        style={styles.printAction}
        onPress={handlePrint}
      >
        <MaterialIcons name="print" size={24} color="#fff" />
        <Text style={styles.printActionText}>Print Token</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    elevation: 5,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  printButton: {
    padding: 8,
  },
  tokenCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  customerInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  purpose: {
    fontSize: 16,
    color: '#666',
  },
  timestamp: {
    width: '100%',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  timestampText: {
    fontSize: 12,
    color: '#666',
  },
  printAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  printActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});
