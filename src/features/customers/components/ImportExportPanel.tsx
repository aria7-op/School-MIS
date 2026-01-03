import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerImportExport from '../hooks/useCustomerImportExport';

const ImportExportPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [importJobs, setImportJobs] = useState<any[]>([]);
  const [exportJobs, setExportJobs] = useState<any[]>([]);
  
  const {
    loading: importExportLoading,
    error,
    exportCustomers,
    importCustomers,
    getImportTemplates,
    validateImport,
    getImportStatus,
    getExportFormats,
    scheduleExport,
  } = useCustomerImportExport();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        getImportTemplates(),
        getExportFormats(),
      ]);
    } catch (error) {
      
    }
  };

  const handleExportCustomers = async () => {
    try {
      await exportCustomers({ format: 'csv', includeAll: true });
      Alert.alert('Success', 'Export started successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to start export');
    }
  };

  const handleImportCustomers = async () => {
    Alert.alert('Import Customers', 'Import feature coming soon');
  };

  const handleScheduleExport = async () => {
    try {
      await scheduleExport({
        format: 'csv',
        schedule: 'daily',
        time: '09:00',
      });
      Alert.alert('Success', 'Export scheduled successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to schedule export');
    }
  };

  const handleValidateImport = async () => {
    try {
      await validateImport({ file: 'sample.csv' });
      Alert.alert('Success', 'Import validation completed');
    } catch (error) {
      Alert.alert('Error', 'Failed to validate import');
    }
  };

  if (importExportLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading import/export tools...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Import/Export</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage customer data import and export operations
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Quick Actions
            </Text>
            
            <View style={styles.actionsGrid}>
              <Button 
                mode="contained" 
                icon="download" 
                onPress={handleExportCustomers}
                style={styles.actionButton}
              >
                Export Customers
              </Button>
              
              <Button 
                mode="outlined" 
                icon="upload" 
                onPress={handleImportCustomers}
                style={styles.actionButton}
              >
                Import Customers
              </Button>
              
              <Button 
                mode="outlined" 
                icon="schedule" 
                onPress={handleScheduleExport}
                style={styles.actionButton}
              >
                Schedule Export
              </Button>
              
              <Button 
                mode="outlined" 
                icon="check-circle" 
                onPress={handleValidateImport}
                style={styles.actionButton}
              >
                Validate Import
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Export Formats */}
        <Card style={styles.formatsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Supported Formats
            </Text>
            
            <View style={styles.formatsGrid}>
              <Chip mode="outlined" style={styles.formatChip}>CSV</Chip>
              <Chip mode="outlined" style={styles.formatChip}>Excel</Chip>
              <Chip mode="outlined" style={styles.formatChip}>JSON</Chip>
              <Chip mode="outlined" style={styles.formatChip}>XML</Chip>
              <Chip mode="outlined" style={styles.formatChip}>PDF</Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Import Templates */}
        <Card style={styles.templatesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Import Templates
            </Text>
            
            <View style={styles.templatesList}>
              <Card style={styles.templateCard}>
                <Card.Content>
                  <Text variant="titleSmall">Customer Import Template</Text>
                  <Text variant="bodySmall">Standard template for importing customer data</Text>
                </Card.Content>
                <Card.Actions>
                  <Button>Download</Button>
                </Card.Actions>
              </Card>
              
              <Card style={styles.templateCard}>
                <Card.Content>
                  <Text variant="titleSmall">Bulk Update Template</Text>
                  <Text variant="bodySmall">Template for bulk customer updates</Text>
                </Card.Content>
                <Card.Actions>
                  <Button>Download</Button>
                </Card.Actions>
              </Card>
            </View>
          </Card.Content>
        </Card>

        {/* Job Status */}
        <Card style={styles.jobsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent Jobs
            </Text>
            
            {importJobs.length === 0 && exportJobs.length === 0 ? (
              <View style={styles.emptyContent}>
                <MaterialIcons name="assignment" size={64} color={theme.colors.outline} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No recent jobs
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  Start an import or export operation to see job status
                </Text>
              </View>
            ) : (
              <View style={styles.jobsList}>
                {/* Sample job items */}
                <Card style={styles.jobCard}>
                  <Card.Content>
                    <View style={styles.jobHeader}>
                      <Text variant="titleSmall">Customer Export</Text>
                      <Chip mode="outlined" style={{ borderColor: theme.colors.primary }}>
                        Completed
                      </Chip>
                    </View>
                    <Text variant="bodySmall">Exported 1,234 customers to CSV</Text>
                    <Text variant="bodySmall" style={styles.jobTime}>
                      2 minutes ago
                    </Text>
                  </Card.Content>
                </Card>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Import/Export Statistics
            </Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  156
                </Text>
                <Text variant="bodySmall">Total Exports</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  89
                </Text>
                <Text variant="bodySmall">Total Imports</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  98%
                </Text>
                <Text variant="bodySmall">Success Rate</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  45s
                </Text>
                <Text variant="bodySmall">Avg Duration</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    elevation: 2,
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  actionsCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '45%',
  },
  formatsCard: {
    margin: 16,
    elevation: 2,
  },
  formatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatChip: {
    marginRight: 8,
  },
  templatesCard: {
    margin: 16,
    elevation: 2,
  },
  templatesList: {
    gap: 8,
  },
  templateCard: {
    marginBottom: 8,
  },
  jobsCard: {
    margin: 16,
    elevation: 2,
  },
  jobsList: {
    gap: 8,
  },
  jobCard: {
    marginBottom: 8,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTime: {
    opacity: 0.7,
    marginTop: 4,
  },
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 16,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ImportExportPanel; 
