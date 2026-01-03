import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface BillPreviewProps {
  bill?: {
    id?: string;
    name?: string;
    previewUrl?: string;
    downloadUrl?: string;
    createdTime?: string;
    templateName?: string;
    amount?: number;
    studentName?: string;
    status?: string;
  } | null;
}

const BillPreview: React.FC<BillPreviewProps> = ({ bill }) => {
  const { colors } = useTheme();

  if (!bill) {
    return (
      <View style={styles.emptyState}>
        <Icon name="receipt" size={64} color={colors.text} />
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No Bill Selected</Text>
        <Text style={[styles.emptyStateText, { color: colors.text }]}>Generate a payment bill to preview it here.</Text>
      </View>
    );
  }

  const handlePreview = () => {
    if (bill.previewUrl) {
      Linking.openURL(bill.previewUrl);
    } else {
      Alert.alert('No Preview', 'No preview URL available for this bill.');
    }
  };

  const handleDownload = () => {
    if (bill.downloadUrl) {
      Linking.openURL(bill.downloadUrl);
    } else {
      Alert.alert('No Download', 'No download URL available for this bill.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}> 
      <View style={styles.header}>
        <Icon name="receipt" size={32} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text }]}>Bill Preview</Text>
      </View>
      <View style={styles.meta}>
        <Text style={[styles.metaText, { color: colors.text }]}>Bill Name: <Text style={styles.metaValue}>{bill.name}</Text></Text>
        <Text style={[styles.metaText, { color: colors.text }]}>Student: <Text style={styles.metaValue}>{bill.studentName}</Text></Text>
        <Text style={[styles.metaText, { color: colors.text }]}>Amount: <Text style={styles.metaValue}>${bill.amount}</Text></Text>
        <Text style={[styles.metaText, { color: colors.text }]}>Template: <Text style={styles.metaValue}>{bill.templateName}</Text></Text>
        <Text style={[styles.metaText, { color: colors.text }]}>Created: <Text style={styles.metaValue}>{bill.createdTime ? new Date(bill.createdTime).toLocaleString() : 'N/A'}</Text></Text>
        <Text style={[styles.metaText, { color: colors.text }]}>Status: <Text style={styles.metaValue}>{bill.status || 'Ready'}</Text></Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.primary }]} onPress={handlePreview}>
          <Icon name="visibility" size={20} color="white" />
          <Text style={styles.actionButtonText}>Preview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.border }]} onPress={handleDownload}>
          <Icon name="download" size={20} color={colors.text} />
          <Text style={[styles.actionButtonText, { color: colors.text }]}>Download</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  meta: {
    marginBottom: 20,
  },
  metaText: {
    fontSize: 15,
    marginBottom: 4,
  },
  metaValue: {
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
});

export default BillPreview; 
