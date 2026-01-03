import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Card, Button, TextInput, SegmentedButtons, Chip } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import useStaffApi, { ExportOptions, ImportStaffData } from '../hooks/useStaffApi';

interface ImportExportProps {
  onExport: (options: ExportOptions) => Promise<any>;
  onImport: (data: ImportStaffData) => Promise<any>;
  onSuccess: () => void;
}

const ImportExport: React.FC<ImportExportProps> = ({
  onExport,
  onImport,
  onSuccess
}) => {
  const {
    loading,
    error,
    exportStaff,
    importStaff,
    getStaffCountByDepartment,
    getStaffCountByDesignation,
    getStaffBySchool,
    getStaffByDepartment
  } = useStaffApi();

  const [activeTab, setActiveTab] = useState('export');
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [exportFilters, setExportFilters] = useState({
    departmentId: undefined as number | undefined,
    status: 'ACTIVE' as string,
    joiningDateAfter: '',
    joiningDateBefore: ''
  });
  const [importData, setImportData] = useState('');
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: false,
    validateData: true,
    createUsers: true
  });

  const handleExport = async () => {
    try {
      const options: ExportOptions = {
        format: exportFormat,
        ...exportFilters
      };

      const result = await onExport(options);
      
      if (exportFormat === 'json') {
        // For JSON, we can display the data or save it
        Alert.alert(
          'Export Successful',
          `Exported ${result.data?.length || 0} staff members`,
          [
            { text: 'OK' },
            { 
              text: 'View Data', 
              onPress: () => {
                Alert.alert('Exported Data', JSON.stringify(result.data, null, 2));
              }
            }
          ]
        );
      } else {
        // For CSV, we can share the file
        if (result.data) {
          const csvContent = result.data;
          const fileUri = `${FileSystem.documentDirectory}staff_export.csv`;
          await FileSystem.writeAsStringAsync(fileUri, csvContent);
          
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
          } else {
            Alert.alert('Export Successful', 'CSV file saved to documents');
          }
        }
      }
    } catch (err: any) {
      Alert.alert('Export Error', err.message);
    }
  };

  const handleImport = async () => {
    try {
      if (!importData.trim()) {
        Alert.alert('Error', 'Please provide import data');
        return;
      }

      const parsedData = JSON.parse(importData);
      const importPayload: ImportStaffData = {
        staff: parsedData.staff || parsedData,
        user: {
          id: 1, // Current user ID
          role: 'SCHOOL_ADMIN'
        }
      };

      const result = await onImport(importPayload);
      
      Alert.alert(
        'Import Successful',
        `Imported ${result.data?.imported || 0} staff members\nSkipped: ${result.data?.skipped || 0}\nErrors: ${result.data?.errors || 0}`,
        [
          { text: 'OK', onPress: onSuccess }
        ]
      );
      
      setImportData('');
    } catch (err: any) {
      Alert.alert('Import Error', err.message);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });
      
      if (!result.canceled && result.assets[0]) {
        const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
        setImportData(content);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleExportByDepartment = async (departmentId: number) => {
    try {
      const options: ExportOptions = {
        format: exportFormat,
        departmentId
      };

      const result = await onExport(options);
      Alert.alert('Export Successful', `Exported ${result.data?.length || 0} staff members from department`);
    } catch (err: any) {
      Alert.alert('Export Error', err.message);
    }
  };

  const handleExportBySchool = async (schoolId: number) => {
    try {
      const options: ExportOptions = {
        format: exportFormat,
        status: 'ACTIVE'
      };

      const result = await onExport(options);
      Alert.alert('Export Successful', `Exported ${result.data?.length || 0} staff members from school`);
    } catch (err: any) {
      Alert.alert('Export Error', err.message);
    }
  };

  const validateImportData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      const staff = parsed.staff || parsed;
      
      if (!Array.isArray(staff)) {
        return 'Data must be an array of staff objects';
      }

      const requiredFields = ['username', 'email', 'firstName', 'lastName', 'employeeId', 'departmentId', 'designation'];
      
      for (let i = 0; i < staff.length; i++) {
        const member = staff[i];
        for (const field of requiredFields) {
          if (!member[field]) {
            return `Staff member ${i + 1} is missing required field: ${field}`;
          }
        }
      }

      return null; // Valid
    } catch (err) {
      return 'Invalid JSON format';
    }
  };

  const renderExportTab = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Export Staff Data</Text>
          <Text style={styles.cardSubtitle}>
            Export staff data in JSON or CSV format with optional filters
          </Text>

          <View style={styles.formatSection}>
            <Text style={styles.sectionTitle}>Export Format:</Text>
            <SegmentedButtons
              value={exportFormat}
              onValueChange={(value) => setExportFormat(value as 'json' | 'csv')}
              buttons={[
                { value: 'json', label: 'JSON', icon: 'code-json' },
                { value: 'csv', label: 'CSV', icon: 'file-delimited' },
              ]}
              style={styles.segmentedButtons}
            />
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.sectionTitle}>Export Filters:</Text>
            
            <TextInput
              mode="outlined"
              placeholder="Department ID (optional)"
              value={exportFilters.departmentId?.toString() || ''}
              onChangeText={(text) => setExportFilters(prev => ({ 
                ...prev, 
                departmentId: text ? parseInt(text) : undefined 
              }))}
              style={styles.textInput}
              keyboardType="numeric"
            />

            <TextInput
              mode="outlined"
              placeholder="Status (ACTIVE, INACTIVE, SUSPENDED)"
              value={exportFilters.status}
              onChangeText={(text) => setExportFilters(prev => ({ ...prev, status: text }))}
              style={styles.textInput}
            />

            <View style={styles.row}>
              <TextInput
                mode="outlined"
                placeholder="Joining Date After (YYYY-MM-DD)"
                value={exportFilters.joiningDateAfter}
                onChangeText={(text) => setExportFilters(prev => ({ ...prev, joiningDateAfter: text }))}
                style={[styles.textInput, styles.halfInput]}
              />
              <TextInput
                mode="outlined"
                placeholder="Joining Date Before (YYYY-MM-DD)"
                value={exportFilters.joiningDateBefore}
                onChangeText={(text) => setExportFilters(prev => ({ ...prev, joiningDateBefore: text }))}
                style={[styles.textInput, styles.halfInput]}
              />
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleExport}
            loading={loading}
            icon="file-export"
            style={styles.exportButton}
          >
            Export Staff Data
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Quick Export Actions</Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              onPress={() => handleExportByDepartment(1)}
              icon="account-group"
              style={styles.quickButton}
            >
              Export Department 1
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleExportBySchool(1)}
              icon="school"
              style={styles.quickButton}
            >
              Export School 1
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  const renderImportTab = () => (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Import Staff Data</Text>
          <Text style={styles.cardSubtitle}>
            Import staff data from JSON format. Upload a file or paste JSON data.
          </Text>

          <View style={styles.importSection}>
            <Text style={styles.sectionTitle}>Import Data:</Text>
            
            <TextInput
              mode="outlined"
              placeholder="Paste JSON data here or upload a file"
              value={importData}
              onChangeText={setImportData}
              multiline
              numberOfLines={10}
              style={styles.textInput}
            />

            <View style={styles.buttonGroup}>
              <Button
                mode="outlined"
                onPress={handleFilePick}
                icon="file-upload"
                style={styles.secondaryButton}
              >
                Upload File
              </Button>
              <Button
                mode="outlined"
                onPress={() => {
                  const validation = validateImportData(importData);
                  if (validation) {
                    Alert.alert('Validation Error', validation);
                  } else {
                    Alert.alert('Validation Success', 'Data format is valid');
                  }
                }}
                icon="check-circle"
                style={styles.secondaryButton}
              >
                Validate
              </Button>
            </View>
          </View>

          <View style={styles.optionsSection}>
            <Text style={styles.sectionTitle}>Import Options:</Text>
            <View style={styles.chipGroup}>
              <Chip
                selected={importOptions.skipDuplicates}
                onPress={() => setImportOptions(prev => ({ ...prev, skipDuplicates: !prev.skipDuplicates }))}
                style={styles.chip}
              >
                Skip Duplicates
              </Chip>
              <Chip
                selected={importOptions.validateData}
                onPress={() => setImportOptions(prev => ({ ...prev, validateData: !prev.validateData }))}
                style={styles.chip}
              >
                Validate Data
              </Chip>
              <Chip
                selected={importOptions.createUsers}
                onPress={() => setImportOptions(prev => ({ ...prev, createUsers: !prev.createUsers }))}
                style={styles.chip}
              >
                Create Users
              </Chip>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleImport}
            loading={loading}
            disabled={!importData.trim()}
            icon="file-import"
            style={styles.importButton}
          >
            Import Staff Data
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.cardTitle}>Import Template</Text>
          <Text style={styles.cardSubtitle}>
            Use this template format for importing staff data:
          </Text>
          <Text style={styles.templateCode}>
            {JSON.stringify({
              staff: [
                {
                  username: "john.doe",
                  email: "john.doe@school.com",
                  phone: "+1234567890",
                  password: "Staff123!",
                  firstName: "John",
                  lastName: "Doe",
                  gender: "MALE",
                  employeeId: "STAFF001",
                  departmentId: 1,
                  designation: "Teacher",
                  joiningDate: "2024-01-15T00:00:00.000Z",
                  salary: 45000.00,
                  schoolId: 1
                }
              ]
            }, null, 2)}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            { value: 'export', label: 'Export', icon: 'file-export' },
            { value: 'import', label: 'Import', icon: 'file-import' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      <View style={styles.content}>
        {activeTab === 'export' && renderExportTab()}
        {activeTab === 'import' && renderImportTab()}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
          <Text>Processing...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginTop: 8,
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
  formatSection: {
    marginBottom: 20,
  },
  filterSection: {
    marginBottom: 20,
  },
  importSection: {
    marginBottom: 20,
  },
  optionsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  textInput: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  exportButton: {
    marginTop: 8,
  },
  importButton: {
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 8,
  },
  templateCode: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ImportExport;
