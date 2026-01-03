import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Card, Text, useTheme, Button, IconButton, Chip, ActivityIndicator, TextInput, Dialog, Portal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import useCustomerSegments from '../hooks/useCustomerSegments';

const AdvancedSegmentsPanel: React.FC = () => {
  const theme = useTheme();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSegment, setNewSegment] = useState({ name: '', description: '', criteria: '' });
  const [creating, setCreating] = useState(false);
  const [autoSegmenting, setAutoSegmenting] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const {
    loading: segmentsLoading,
    error,
    segments,
    analytics,
    getSegments,
    createSegment,
    updateSegment,
    deleteSegment,
    getSegmentAnalytics,
    autoSegmentCustomers,
  } = useCustomerSegments();

  useEffect(() => {
    getSegments();
    getSegmentAnalytics();
  }, [getSegments, getSegmentAnalytics]);

  const handleCreateSegment = async () => {
    if (!newSegment.name.trim()) return;
    setCreating(true);
    try {
      await createSegment({ ...newSegment });
      setShowCreateDialog(false);
      setNewSegment({ name: '', description: '', criteria: '' });
      Alert.alert('Success', 'Segment created successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to create segment');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this segment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSegment(segmentId);
              Alert.alert('Success', 'Segment deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete segment');
            }
          },
        },
      ]
    );
  };

  const handleAutoSegment = async () => {
    setAutoSegmenting(true);
    try {
      await autoSegmentCustomers({});
      Alert.alert('Success', 'Auto-segmentation completed');
    } catch (err) {
      Alert.alert('Error', 'Auto-segmentation failed');
    } finally {
      setAutoSegmenting(false);
    }
  };

  if (segmentsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading segments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Create Segment</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={newSegment.name}
              onChangeText={text => setNewSegment(s => ({ ...s, name: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Description"
              value={newSegment.description}
              onChangeText={text => setNewSegment(s => ({ ...s, description: text }))}
              style={{ marginBottom: 8 }}
            />
            <TextInput
              label="Criteria"
              value={newSegment.criteria}
              onChangeText={text => setNewSegment(s => ({ ...s, criteria: text }))}
              style={{ marginBottom: 8 }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button loading={creating} onPress={handleCreateSegment}>Create</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Advanced Segments</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Dynamic customer segmentation and behavioral analysis
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
                icon="plus" 
                onPress={() => setShowCreateDialog(true)}
                style={styles.actionButton}
              >
                Create Segment
              </Button>
              <Button 
                mode="outlined" 
                icon="auto-fix-high" 
                onPress={handleAutoSegment}
                loading={autoSegmenting}
                style={styles.actionButton}
              >
                Auto Segment
              </Button>
              <Button 
                mode="outlined" 
                icon="analytics" 
                onPress={() => setShowAnalytics((prev) => !prev)}
                style={styles.actionButton}
              >
                {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
              </Button>
              <Button 
                mode="outlined" 
                icon="campaign" 
                onPress={() => Alert.alert('Campaign', 'Targeted campaign feature coming soon')}
                style={styles.actionButton}
              >
                Create Campaign
              </Button>
            </View>
          </Card.Content>
        </Card>
        {/* Segment Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Segment Statistics
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                  {segments.length}
                </Text>
                <Text variant="bodySmall">Total Segments</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                  {analytics?.totalCustomers ?? '-'}
                </Text>
                <Text variant="bodySmall">Total Visitors</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.secondary }}>
                  {analytics?.segmentationRate ? `${analytics.segmentationRate}%` : '-'}
                </Text>
                <Text variant="bodySmall">Segmentation Rate</Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="titleLarge" style={{ color: theme.colors.tertiary }}>
                  {analytics?.activeCampaigns ?? '-'}
                </Text>
                <Text variant="bodySmall">Active Campaigns</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
        {/* Segments List */}
        <Card style={styles.segmentsCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Customer Segments
            </Text>
            {segments.length === 0 ? (
              <View style={styles.emptyContent}>
                <MaterialIcons name="group" size={64} color={theme.colors.outline} />
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  No segments found
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtitle}>
                  Create your first customer segment to get started
                </Text>
              </View>
            ) : (
              <View style={styles.segmentsList}>
                {segments.map((segment) => (
                  <Card key={segment.id} style={styles.segmentCard}>
                    <Card.Content>
                      <View style={styles.segmentHeader}>
                        <Text variant="titleSmall">{segment.name}</Text>
                        <View style={styles.segmentChips}>
                          <Chip mode="outlined" style={styles.segmentChip}>
                            {segment.customerCount} customers
                          </Chip>
                          <Chip 
                            mode="outlined" 
                            style={[
                              styles.segmentChip,
                              { borderColor: segment.isActive ? theme.colors.primary : theme.colors.outline }
                            ]}
                          >
                            {segment.isActive ? 'Active' : 'Inactive'}
                          </Chip>
                        </View>
                      </View>
                      <Text variant="bodyMedium">{segment.description}</Text>
                      <Text variant="bodySmall" style={styles.segmentInfo}>
                        Created: {new Date(segment.createdAt).toLocaleDateString()}
                      </Text>
                    </Card.Content>
                    <Card.Actions>
                      <Button onPress={() => Alert.alert('Edit', 'Edit segment feature coming soon')}>Edit</Button>
                      <Button onPress={() => Alert.alert('View', 'View segment details')}>View</Button>
                      <IconButton
                        icon="delete"
                        onPress={() => handleDeleteSegment(segment.id)}
                        iconColor={theme.colors.error}
                      />
                    </Card.Actions>
                  </Card>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>
        {/* Behavioral Segments (from analytics if available) */}
        {analytics?.behavioralSegments && (
          <Card style={styles.behavioralCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Behavioral Segments
              </Text>
              <View style={styles.behavioralList}>
                {analytics.behavioralSegments.map((b: any, idx: number) => (
                  <Card style={styles.behavioralItem} key={idx}>
                    <Card.Content>
                      <Text variant="titleSmall">{b.name}</Text>
                      <Text variant="bodySmall">{b.description}</Text>
                      <Text variant="bodySmall" style={styles.behavioralCount}>{b.count} customers</Text>
                    </Card.Content>
                  </Card>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
        {/* Analytics Details */}
        {showAnalytics && analytics && (
          <Card style={styles.behavioralCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Analytics Details
              </Text>
              <Text>{JSON.stringify(analytics, null, 2)}</Text>
            </Card.Content>
          </Card>
        )}
        {/* Automation Rules (static for now) */}
        <Card style={styles.automationCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Automation Rules
            </Text>
            <View style={styles.automationList}>
              <Card style={styles.automationItem}>
                <Card.Content>
                  <Text variant="titleSmall">New Customer Welcome</Text>
                  <Text variant="bodySmall">Automatically add new customers to welcome segment</Text>
                </Card.Content>
                <Card.Actions>
                  <Button>Edit Rule</Button>
                </Card.Actions>
              </Card>
              <Card style={styles.automationItem}>
                <Card.Content>
                  <Text variant="titleSmall">Inactive Customer Alert</Text>
                  <Text variant="bodySmall">Move customers to at-risk segment after 60 days</Text>
                </Card.Content>
                <Card.Actions>
                  <Button>Edit Rule</Button>
                </Card.Actions>
              </Card>
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
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  segmentsCard: {
    margin: 16,
    elevation: 2,
  },
  segmentsList: {
    gap: 8,
  },
  segmentCard: {
    marginBottom: 8,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  segmentChips: {
    flexDirection: 'row',
    gap: 4,
  },
  segmentChip: {
    marginLeft: 4,
  },
  segmentInfo: {
    opacity: 0.7,
    marginTop: 8,
  },
  behavioralCard: {
    margin: 16,
    elevation: 2,
  },
  behavioralList: {
    gap: 8,
  },
  behavioralItem: {
    marginBottom: 8,
  },
  behavioralCount: {
    color: '#666',
    marginTop: 4,
  },
  automationCard: {
    margin: 16,
    elevation: 2,
  },
  automationList: {
    gap: 8,
  },
  automationItem: {
    marginBottom: 8,
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

export default AdvancedSegmentsPanel; 
