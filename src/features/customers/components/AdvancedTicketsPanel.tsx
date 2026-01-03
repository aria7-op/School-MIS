import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, TextInput, Dialog, Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerTickets from '../hooks/useCustomerTickets';

const AdvancedTicketsPanel: React.FC = () => {
  const theme = useTheme();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'medium' });
  const [creating, setCreating] = useState(false);

  const {
    loading: ticketsLoading,
    error,
    tickets,
    slaAnalytics,
    getCustomerTickets,
    createTicket,
    assignTicket,
    resolveTicket,
    escalateTicket,
    deleteTicket,
    getSLAAnalytics,
  } = useCustomerTickets('all');

  useEffect(() => {
    getCustomerTickets('all');
    getSLAAnalytics();
  }, [getCustomerTickets, getSLAAnalytics]);

  const handleCreateTicket = async () => {
    if (!newTicket.title.trim()) return;
    setCreating(true);
    try {
      await createTicket(newTicket, 'all');
      setShowCreateDialog(false);
      setNewTicket({ title: '', description: '', priority: 'medium' });
      Alert.alert('Success', 'Ticket created successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const handleAssignTicket = async (ticketId: string) => {
    try {
      await assignTicket(ticketId, { assignedTo: 'current-user' }, 'all');
      Alert.alert('Success', 'Ticket assigned successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to assign ticket');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      await resolveTicket(ticketId, 'all');
      Alert.alert('Success', 'Ticket resolved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to resolve ticket');
    }
  };

  const handleEscalateTicket = async (ticketId: string) => {
    try {
      await escalateTicket(ticketId, 'all');
      Alert.alert('Success', 'Ticket escalated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to escalate ticket');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this ticket?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTicket(ticketId, 'all');
              Alert.alert('Success', 'Ticket deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete ticket');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return theme.colors.error;
      case 'medium':
        return theme.colors.warning;
      case 'low':
        return theme.colors.primary;
      default:
        return theme.colors.outline;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return theme.colors.error;
      case 'in-progress':
        return theme.colors.warning;
      case 'resolved':
        return theme.colors.primary;
      case 'closed':
        return theme.colors.outline;
      default:
        return theme.colors.outline;
    }
  };

  if (ticketsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading tickets...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create Ticket</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Title"
              value={newTicket.title}
              onChangeText={text => setNewTicket(s => ({ ...s, title: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Description"
              value={newTicket.description}
              onChangeText={text => setNewTicket(s => ({ ...s, description: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Priority"
              value={newTicket.priority}
              onChangeText={text => setNewTicket(s => ({ ...s, priority: text }))}
              style={{ marginBottom: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button loading={creating} onPress={handleCreateTicket}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Advanced Tickets</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage customer support tickets with SLA and escalation
          </Text>
        </Card.Content>
      </Card>
      <ScrollView style={styles.content}>
        {/* SLA Dashboard */}
        <Card style={styles.slaCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              SLA Performance
            </Text>
            {error && <Text style={{ color: 'red' }}>{error}</Text>}
            <View style={styles.slaMetrics}>
              <View style={styles.metric}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>{slaAnalytics?.responseTime ?? '-'}</Text>
                <Text variant="bodySmall">Response Time</Text>
              </View>
              <View style={styles.metric}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>{slaAnalytics?.resolutionRate ?? '-'}</Text>
                <Text variant="bodySmall">Resolution Rate</Text>
              </View>
              <View style={styles.metric}>
                <Text variant="titleLarge" style={{ color: theme.colors.error }}>{slaAnalytics?.overdue ?? '-'}</Text>
                <Text variant="bodySmall">Overdue</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        {/* Tickets List */}
        <Card style={styles.ticketsCard}>
          <Card.Content>
            <View style={styles.ticketsHeader}>
              <Text variant="titleMedium">Active Tickets</Text>
              <Button mode="contained" onPress={() => setShowCreateDialog(true)}>
                Create Ticket
              </Button>
            </View>
            {tickets.length === 0 ? (
              <View style={styles.emptyContent}>
                <MaterialIcons name="support-agent" size={64} color={theme.colors.outline} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No tickets found
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  All customer issues are resolved
                </Text>
              </View>
            ) : (
              <View style={styles.ticketsList}>
                {tickets.map((ticket) => (
                  <Card key={ticket.id} style={styles.ticketCard}>
                    <Card.Content>
                      <View style={styles.ticketHeader}>
                        <Text variant="titleSmall">{ticket.title}</Text>
                        <View style={styles.ticketChips}>
                          <Chip 
                            mode="outlined" 
                            textStyle={{ color: getPriorityColor(ticket.priority) }}
                            style={{ borderColor: getPriorityColor(ticket.priority) }}
                          >
                            {ticket.priority}
                          </Chip>
                          <Chip 
                            mode="outlined" 
                            textStyle={{ color: getStatusColor(ticket.status) }}
                            style={{ borderColor: getStatusColor(ticket.status) }}
                          >
                            {ticket.status}
                          </Chip>
                        </View>
                      </View>
                      <Text variant="bodyMedium">{ticket.description}</Text>
                      <Text variant="bodySmall" style={styles.ticketInfo}>
                        #{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString()}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => handleAssignTicket(ticket.id)}>
                        Assign
                      </Button>
                      <Button onPress={() => handleResolveTicket(ticket.id)}>
                        Resolve
                      </Button>
                      <Button onPress={() => handleEscalateTicket(ticket.id)}>
                        Escalate
                      </Button>
                      <IconButton
                        icon="delete"
                        onPress={() => handleDeleteTicket(ticket.id)}
                        iconColor={theme.colors.error}
                      />
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}
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
  slaCard: {
    margin: 16,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  slaMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  ticketsCard: {
    margin: 16,
    elevation: 2,
  },
  ticketsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketsList: {
    gap: 8,
  },
  ticketCard: {
    marginBottom: 8,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketChips: {
    flexDirection: 'row',
    gap: 4,
  },
  ticketInfo: {
    opacity: 0.7,
    marginTop: 8,
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

export default AdvancedTicketsPanel; 
