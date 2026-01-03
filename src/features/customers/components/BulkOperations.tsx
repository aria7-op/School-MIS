import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Card, Button, TextInput, Checkbox, SegmentedButtons } from 'react-native-paper';
import useCustomerBulk from '../hooks/useCustomerBulk';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

const BulkOperations: React.FC = () => {
  const { loading, error, bulkCreateCustomers, bulkUpdateCustomers, bulkDeleteCustomers } = useCustomerBulk();
  const [activeTab, setActiveTab] = useState('create');
  const [createData, setCreateData] = useState('');
  const [updateData, setUpdateData] = useState('');
  const [deleteData, setDeleteData] = useState('');
  const [skipDuplicates, setSkipDuplicates] = useState(false);

  const handleFilePick = async (setData: (data: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });
      if (!result.canceled && result.assets[0]) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        setData(content);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleBulkCreate = async () => {
    try {
      const parsedData = JSON.parse(createData);
      const response = await bulkCreateCustomers({
        customers: parsedData,
        skipDuplicates,
      });
      const count = (response as any)?.created || (response as any)?.data?.created || 0;
      Alert.alert('Success', `${count} visitors created`);
      setCreateData('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create visitors');
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const parsedData = JSON.parse(updateData);
      const response = await bulkUpdateCustomers({
        updates: parsedData,
      });
      const count = (response as any)?.updated || (response as any)?.data?.updated || 0;
      Alert.alert('Success', `${count} visitors updated`);
      setUpdateData('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update visitors');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const parsedData = JSON.parse(deleteData);
      const response = await bulkDeleteCustomers({
        customerIds: parsedData,
      });
      const count = (response as any)?.deleted || (response as any)?.data?.deleted || 0;
      Alert.alert('Success', `${count} visitors deleted`);
      setDeleteData('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to delete visitors');
    }
  };

  const renderCreateTab = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Bulk Create Visitors</Text>
        <Text style={styles.cardSubtitle}>
          Create multiple visitors at once using CSV or JSON data
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Enter visitor data in JSON format..."
          multiline
          numberOfLines={6}
          value={createData}
          onChangeText={setCreateData}
          style={styles.textInput}
        />
        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={() => handleFilePick(setCreateData)}
            style={styles.secondaryButton}
          >
            Upload JSON File
          </Button>
          <Button
            mode="contained"
            onPress={handleBulkCreate}
            loading={loading}
            disabled={!createData}
            style={styles.primaryButton}
          >
            Create Visitors
          </Button>
        </View>
        <Checkbox
          status={skipDuplicates ? 'checked' : 'unchecked'}
          onPress={() => setSkipDuplicates(!skipDuplicates)}
        />
        <Text style={styles.checkboxLabel}>Skip duplicates</Text>
        <Text style={styles.exampleTitle}>Example JSON:</Text>
        <Text style={styles.exampleCode}>
          {JSON.stringify({
            customers: [
              {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                phone: "+1234567890",
                company: "ABC Corp",
                status: "lead",
                priority: "medium",
                source: "website"
              }
            ],
            skipDuplicates: false
          }, null, 2)}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderUpdateTab = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Bulk Update Visitors</Text>
        <Text style={styles.cardSubtitle}>
          Update multiple visitors with new data
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Enter visitor IDs and update data..."
          multiline
          numberOfLines={6}
          value={updateData}
          onChangeText={setUpdateData}
          style={styles.textInput}
        />
        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={() => handleFilePick(setUpdateData)}
            style={styles.secondaryButton}
          >
            Upload JSON File
          </Button>
          <Button
            mode="contained"
            onPress={handleBulkUpdate}
            loading={loading}
            disabled={!updateData}
            style={styles.primaryButton}
          >
            Update Visitors
          </Button>
        </View>
        <Text style={styles.exampleTitle}>Example JSON:</Text>
        <Text style={styles.exampleCode}>
          {JSON.stringify({
            updates: [
              {
                id: 1,
                data: {
                  status: "customer",
                  priority: "high"
                }
              }
            ]
          }, null, 2)}
        </Text>
      </Card.Content>
    </Card>
  );

  const renderDeleteTab = () => (
    <Card style={styles.card}>
      <Card.Content>
        <Text style={styles.cardTitle}>Bulk Delete Visitors</Text>
        <Text style={styles.cardSubtitle}>
          Delete multiple visitors by ID
        </Text>
        <TextInput
          mode="outlined"
          placeholder="Enter visitor IDs to delete..."
          multiline
          numberOfLines={6}
          value={deleteData}
          onChangeText={setDeleteData}
          style={styles.textInput}
        />
        <View style={styles.buttonGroup}>
          <Button
            mode="outlined"
            onPress={() => handleFilePick(setDeleteData)}
            style={styles.secondaryButton}
          >
            Upload JSON File
          </Button>
          <Button
            mode="contained"
            onPress={handleBulkDelete}
            loading={loading}
            disabled={!deleteData}
            style={styles.primaryButton}
          >
            Delete Visitors
          </Button>
        </View>
        <Text style={styles.exampleTitle}>Example JSON:</Text>
        <Text style={styles.exampleCode}>
          {JSON.stringify([
            1, 2, 3
          ], null, 2)}
        </Text>
      </Card.Content>
    </Card>
  );

  return (
    <ScrollView style={styles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          { value: 'create', label: 'Bulk Create' },
          { value: 'update', label: 'Bulk Update' },
          { value: 'delete', label: 'Bulk Delete' },
        ]}
        style={styles.tabs}
      />
      {error && <Text style={{ color: 'red', margin: 16 }}>{error}</Text>}
      {loading && <ActivityIndicator style={{ margin: 16 }} />}
      {activeTab === 'create' && renderCreateTab()}
      {activeTab === 'update' && renderUpdateTab()}
      {activeTab === 'delete' && renderDeleteTab()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  tabContent: {
    width: '100%',
  },
  card: {
    marginBottom: 16,
    borderRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  textInput: {
    marginBottom: 16,
    minHeight: 150,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  exampleCode: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
  },
  errorCard: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  errorText: {
    color: '#721c24',
    fontSize: 14,
  },
  tabs: {
    marginBottom: 16,
  },
});

export default BulkOperations; 
