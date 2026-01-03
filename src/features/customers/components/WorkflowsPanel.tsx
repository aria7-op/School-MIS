import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, Dialog, Portal, TextInput } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerWorkflows from '../hook/useCustomerWorkflows';

const initialWorkflowState = { name: '', description: '', status: 'active' };

const WorkflowsPanel: React.FC = () => {
  const theme = useTheme();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogLoading, setDialogLoading] = useState(false);
  const [form, setForm] = useState(initialWorkflowState);
  const [editId, setEditId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    loading: workflowsLoading,
    error,
    workflows,
    getWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
  } = useCustomerWorkflows();

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      await getWorkflows();
    } catch (error) {
      // error handled in hook
    }
  };

  const openCreateDialog = () => {
    setForm(initialWorkflowState);
    setEditId(null);
    setLocalError(null);
    setDialogVisible(true);
  };

  const openEditDialog = (workflow: any) => {
    setForm({ name: workflow.name, description: workflow.description, status: workflow.status });
    setEditId(workflow.id);
    setLocalError(null);
    setDialogVisible(true);
  };

  const closeDialog = () => {
    setDialogVisible(false);
    setForm(initialWorkflowState);
    setEditId(null);
    setLocalError(null);
  };

  const handleDialogSubmit = async () => {
    setDialogLoading(true);
    setLocalError(null);
    try {
      if (editId) {
        await updateWorkflow(editId, form);
        Alert.alert('Success', 'Workflow updated successfully');
      } else {
        await createWorkflow(form);
        Alert.alert('Success', 'Workflow created successfully');
      }
      closeDialog();
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to save workflow');
    } finally {
      setDialogLoading(false);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow(workflowId);
      Alert.alert('Success', 'Workflow executed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to execute workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this workflow?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkflow(workflowId);
              Alert.alert('Success', 'Workflow deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workflow');
            }
          },
        },
      ]
    );
  };

  if (workflowsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading workflows...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Workflows</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Automate customer processes and business logic
          </Text>
        </Card.Content>
      </Card>

      <Button mode="contained" style={{ marginHorizontal: 16, marginBottom: 8 }} onPress={openCreateDialog}>
        Create Workflow
      </Button>

      {error && (
        <Card style={{ margin: 16, backgroundColor: theme.colors.errorContainer }}>
          <Card.Content>
            <Text style={{ color: theme.colors.onErrorContainer }}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.content}>
        {workflows.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="workflow" size={64} color={theme.colors.outline} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No workflows found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Create your first workflow to automate processes
              </Text>
              <Button mode="contained" onPress={openCreateDialog}>
                Create Workflow
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.workflowsContainer}>
            {workflows.map((workflow) => (
              <Card key={workflow.id} style={styles.workflowCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium">{workflow.name}</Text>
                    <Chip mode="outlined">{workflow.status}</Chip>
                  </View>
                  <Text variant="bodyMedium">{workflow.description}</Text>
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => handleExecuteWorkflow(workflow.id)}>
                    Execute
                  </Button>
                  <Button onPress={() => openEditDialog(workflow)}>Edit</Button>
                  <IconButton
                    icon="delete"
                    onPress={() => handleDeleteWorkflow(workflow.id)}
                    iconColor={theme.colors.error}
                  />
                </Card.Actions>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={closeDialog}>
          <Dialog.Title>{editId ? 'Edit Workflow' : 'Create Workflow'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={form.name}
              onChangeText={(text) => setForm((f) => ({ ...f, name: text }))}
              style={{ marginBottom: 12 }}
              disabled={dialogLoading}
            />
            <TextInput
              label="Description"
              value={form.description}
              onChangeText={(text) => setForm((f) => ({ ...f, description: text }))}
              style={{ marginBottom: 12 }}
              disabled={dialogLoading}
              multiline
            />
            <TextInput
              label="Status"
              value={form.status}
              onChangeText={(text) => setForm((f) => ({ ...f, status: text }))}
              style={{ marginBottom: 12 }}
              disabled={dialogLoading}
            />
            {localError && <Text style={{ color: theme.colors.error }}>{localError}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeDialog} disabled={dialogLoading}>Cancel</Button>
            <Button onPress={handleDialogSubmit} loading={dialogLoading} disabled={dialogLoading}>
              {editId ? 'Save' : 'Create'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  workflowsContainer: {
    margin: 16,
    gap: 12,
  },
  workflowCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyCard: {
    margin: 16,
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
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WorkflowsPanel; 
