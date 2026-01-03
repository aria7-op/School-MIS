import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerBulk from '../hooks/useCustomerBulk';

const defaultTemplates = [
  {
    name: 'Activate Inactive Visitors',
    description: 'Activate all inactive visitors',
    operation: 'bulkUpdateCustomers',
    icon: 'check-circle',
    color: '#10b981'
  },
  {
    name: 'Assign to Premium Segment',
    description: 'Move high-value customers to premium segment',
    operation: 'bulkUpdateCustomers',
    data: { customerIds: ['4', '5'], updates: { segment: 'premium' } },
  },
  {
    name: 'Export Customer Data',
    description: 'Export complete customer data for analysis',
    operation: 'bulkExportCustomers',
    data: { customerIds: ['1', '2', '3', '4', '5'] },
  },
];

const AdvancedBulkOperationsPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentJob, setCurrentJob] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({ operationsToday: 0, successRate: 0, avgDuration: 0, customersProcessed: 0 });
  const [templates] = useState(defaultTemplates);

  const {
    loading: bulkLoading,
    error,
    bulkCreateCustomers,
    bulkUpdateCustomers,
    bulkDeleteCustomers,
    bulkImportCustomers,
    bulkExportCustomers,
    bulkMergeCustomers,
    bulkDuplicateCustomers,
    bulkAssignCustomers,
    bulkTagCustomers,
    getBulkJobStatus,
    jobStatus,
  } = useCustomerBulk();

  // Simulate fetching stats/history from backend
  useEffect(() => {
    setStats({ operationsToday: history.length, successRate: 98, avgDuration: 2.3, customersProcessed: 1234 });
  }, [history]);

  // Simulate progress updates for current job
  useEffect(() => {
    if (currentJob && currentJob.status === 'processing') {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentJob]);

  // Poll job status if job is processing
  useEffect(() => {
    let poll: any;
    if (currentJob && currentJob.id) {
      poll = setInterval(async () => {
        try {
          await getBulkJobStatus(currentJob.id);
        } catch {}
      }, 2000);
    }
    return () => poll && clearInterval(poll);
  }, [currentJob, getBulkJobStatus]);

  // Add to history when job completes
  useEffect(() => {
    if (currentJob && progress === 100) {
      setHistory(prev => [
        { ...currentJob, completedAt: new Date(), status: 'Completed' },
        ...prev,
      ]);
      setCurrentJob(null);
      setProgress(0);
    }
  }, [progress, currentJob]);

  // Dynamic operation handlers
  const handleOperation = useCallback(async (operation, data) => {
    try {
      setLoading(true);
      setCurrentJob({ id: `${operation}-${Date.now()}`, status: 'processing', operation });
      setProgress(0);
      if (operation === 'bulkUpdateCustomers') await bulkUpdateCustomers(data);
      else if (operation === 'bulkDeleteCustomers') await bulkDeleteCustomers(data);
      else if (operation === 'bulkCreateCustomers') await bulkCreateCustomers(data);
      else if (operation === 'bulkImportCustomers') await bulkImportCustomers(data);
      else if (operation === 'bulkExportCustomers') await bulkExportCustomers(data);
      else if (operation === 'bulkMergeCustomers') await bulkMergeCustomers(data);
      else if (operation === 'bulkDuplicateCustomers') await bulkDuplicateCustomers(data);
      else if (operation === 'bulkAssignCustomers') await bulkAssignCustomers(data);
      else if (operation === 'bulkTagCustomers') await bulkTagCustomers(data);
      Alert.alert('Success', `${operation} completed successfully`);
    } catch (error) {
      Alert.alert('Error', `${operation} failed`);
    } finally {
      setLoading(false);
    }
  }, [bulkUpdateCustomers, bulkDeleteCustomers, bulkCreateCustomers, bulkImportCustomers, bulkExportCustomers, bulkMergeCustomers, bulkDuplicateCustomers, bulkAssignCustomers, bulkTagCustomers]);

  // Example operation data
  const exampleData = {
    customerIds: ['1', '2', '3'],
    updates: { status: 'active', segment: 'premium' },
  };

  if (bulkLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading bulk operations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Advanced Bulk Operations</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Perform batch operations on multiple customers efficiently
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {/* Current Job Progress */}
        {currentJob && (
          <Card style={styles.progressCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Current Operation: {currentJob.operation.replace('_', ' ').toUpperCase()}
              </Text>
              <View style={styles.progressContainer}>
                <ProgressBar 
                  progress={progress / 100} 
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <Text variant="bodySmall" style={styles.progressText}>
                  {progress}% Complete
                </Text>
              </View>
              <Text variant="bodySmall" style={styles.jobStatus}>
                Status: {currentJob.status}
              </Text>
              {jobStatus && (
                <Text variant="bodySmall" style={styles.jobStatus}>
                  Job Status: {JSON.stringify(jobStatus)}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Bulk Operations */}
        <Card style={styles.operationsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Bulk Operations
            </Text>
            <View style={styles.operationsGrid}>
              <Button 
                mode="contained" 
                icon="update" 
                onPress={() => handleOperation('bulkUpdateCustomers', exampleData)}
                loading={loading && currentJob?.operation === 'bulkUpdateCustomers'}
                style={styles.operationButton}
              >
                Bulk Update
              </Button>
              <Button 
                mode="outlined" 
                icon="delete" 
                onPress={() => handleOperation('bulkDeleteCustomers', { customerIds: ['1', '2', '3'] })}
                loading={loading && currentJob?.operation === 'bulkDeleteCustomers'}
                style={styles.operationButton}
                buttonColor={theme.colors.error}
                textColor={theme.colors.error}
              >
                Bulk Delete
              </Button>
              <Button 
                mode="outlined" 
                icon="download" 
                onPress={() => handleOperation('bulkExportCustomers', { customerIds: ['1', '2', '3'] })}
                loading={loading && currentJob?.operation === 'bulkExportCustomers'}
                style={styles.operationButton}
              >
                Bulk Export
              </Button>
              <Button 
                mode="outlined" 
                icon="upload" 
                onPress={() => handleOperation('bulkImportCustomers', { customers: [{ name: 'New Customer' }] })}
                loading={loading && currentJob?.operation === 'bulkImportCustomers'}
                style={styles.operationButton}
              >
                Bulk Import
              </Button>
              <Button 
                mode="outlined" 
                icon="merge" 
                onPress={() => handleOperation('bulkMergeCustomers', { customerIds: ['1', '2'] })}
                loading={loading && currentJob?.operation === 'bulkMergeCustomers'}
                style={styles.operationButton}
              >
                Bulk Merge
              </Button>
              <Button 
                mode="outlined" 
                icon="content-copy" 
                onPress={() => handleOperation('bulkDuplicateCustomers', { customerIds: ['1', '2'] })}
                loading={loading && currentJob?.operation === 'bulkDuplicateCustomers'}
                style={styles.operationButton}
              >
                Bulk Duplicate
              </Button>
              <Button 
                mode="outlined" 
                icon="account-multiple" 
                onPress={() => handleOperation('bulkAssignCustomers', { customerIds: ['1', '2'], assignee: 'staff-1' })}
                loading={loading && currentJob?.operation === 'bulkAssignCustomers'}
                style={styles.operationButton}
              >
                Bulk Assign
              </Button>
              <Button 
                mode="outlined" 
                icon="tag" 
                onPress={() => handleOperation('bulkTagCustomers', { customerIds: ['1', '2'], tags: ['VIP'] })}
                loading={loading && currentJob?.operation === 'bulkTagCustomers'}
                style={styles.operationButton}
              >
                Bulk Tag
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Operation Templates */}
        <Card style={styles.templatesCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Operation Templates
            </Text>
            <View style={styles.templatesList}>
              {templates.map((tpl, idx) => (
                <Card style={styles.templateCard} key={idx}>
                  <Card.Content>
                    <Text variant="titleSmall">{tpl.name}</Text>
                    <Text variant="bodySmall">{tpl.description}</Text>
                  </Card.Content>
                  <Card.Actions>
                    <Button onPress={() => handleOperation(tpl.operation, tpl.data)}>
                      Use Template
                    </Button>
                  </Card.Actions>
                </Card>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Validation Tools */}
        <Card style={styles.validationCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Validation Tools
            </Text>
            <View style={styles.validationActions}>
              <Button 
                mode="outlined" 
                icon="check-circle" 
                onPress={() => Alert.alert('Validation', 'Validation logic coming soon')}
                style={styles.validationButton}
              >
                Validate Operation
              </Button>
              <Button 
                mode="outlined" 
                icon="preview" 
                onPress={() => Alert.alert('Preview', 'Operation preview coming soon')}
                style={styles.validationButton}
              >
                Preview Changes
              </Button>
              <Button 
                mode="outlined" 
                icon="backup-restore" 
                onPress={() => Alert.alert('Backup', 'Backup creation coming soon')}
                style={styles.validationButton}
              >
                Create Backup
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Operation History */}
        <Card style={styles.historyCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Recent Operations
            </Text>
            <View style={styles.historyList}>
              {history.length === 0 ? (
                <Text>No recent operations.</Text>
              ) : (
                history.map((item, idx) => (
                  <Card style={styles.historyItem} key={idx}>
                    <Card.Content>
                      <View style={styles.historyHeader}>
                        <Text variant="titleSmall">{item.operation.replace('_', ' ').toUpperCase()}</Text>
                        <Chip mode="outlined" style={{ borderColor: theme.colors.primary }}>
                          {item.status}
                        </Chip>
                      </View>
                      <Text variant="bodySmall">Job ID: {item.id}</Text>
                      <Text variant="bodySmall" style={styles.historyTime}>
                        {item.completedAt ? item.completedAt.toLocaleString() : ''}
                      </Text>
                    </Card.Content>
                  </Card>
                ))
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Operation Statistics
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {stats.operationsToday}
                </Text>
                <Text variant="bodySmall">Operations Today</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {stats.successRate}%
                </Text>
                <Text variant="bodySmall">Success Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
                  {stats.avgDuration}s
                </Text>
                <Text variant="bodySmall">Avg Duration</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
                  {stats.customersProcessed}
                </Text>
                <Text variant="bodySmall">Customers Processed</Text>
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
  progressCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    marginBottom: 8,
  },
  progressText: {
    textAlign: 'center',
  },
  jobStatus: {
    textAlign: 'center',
    opacity: 0.7,
  },
  operationsCard: {
    margin: 16,
    elevation: 2,
  },
  operationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  operationButton: {
    flex: 1,
    minWidth: '45%',
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
  validationCard: {
    margin: 16,
    elevation: 2,
  },
  validationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  validationButton: {
    flex: 1,
    minWidth: '45%',
  },
  historyCard: {
    margin: 16,
    elevation: 2,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    marginBottom: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTime: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AdvancedBulkOperationsPanel; 
