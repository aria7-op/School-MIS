import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Card,
  Text,
  useTheme,
  Button,
  IconButton,
  Chip,
  Divider,
  ActivityIndicator,
  Portal,
  Modal,
  TextInput,
  Switch,
  List,
  FAB,
  Badge,
  ProgressBar,
  Surface,
  Avatar,
} from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import useCustomerIntegrations from '../hooks/useCustomerIntegrations';

const { width } = Dimensions.get('window');

const IntegrationsPanel: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  
  const {
    loading: integrationsLoading,
    error,
    integrations,
    getIntegrations,
    createIntegration,
    deleteIntegration,
    syncIntegration,
  } = useCustomerIntegrations();

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      await getIntegrations();
    } catch (error) {
      
    }
  };

  const handleCreateIntegration = () => {
    Alert.alert('Create Integration', 'Integration creation feature coming soon');
  };

  const handleSyncIntegration = async (integrationId: string) => {
    try {
      await syncIntegration(integrationId);
      Alert.alert('Success', 'Integration synced successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to sync integration');
    }
  };

  const handleDeleteIntegration = async (integrationId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this integration?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteIntegration(integrationId);
              Alert.alert('Success', 'Integration deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete integration');
            }
          },
        },
      ]
    );
  };

  if (integrationsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text>Loading integrations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text variant="headlineSmall">Integrations</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage external system connections and data synchronization
          </Text>
        </Card.Content>
      </Card>

      <ScrollView style={styles.content}>
        {integrations.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <MaterialIcons name="integration-instructions" size={64} color={theme.colors.outline} />
              <Text variant="titleMedium" style={styles.emptyTitle}>
                No integrations found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Create your first integration to start syncing data
              </Text>
              <Button mode="contained" onPress={handleCreateIntegration}>
                Create Integration
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.integrationsContainer}>
            {integrations.map((integration) => (
              <Card key={integration.id} style={styles.integrationCard}>
                <Card.Content>
                  <View style={styles.cardHeader}>
                    <Text variant="titleMedium">{integration.name}</Text>
                    <Chip mode="outlined">{integration.status}</Chip>
                  </View>
                  <Text variant="bodyMedium">{integration.description}</Text>
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => handleSyncIntegration(integration.id)}>
                    Sync
                  </Button>
                  <Button onPress={() => {}}>Edit</Button>
                  <IconButton
                    icon="delete"
                    onPress={() => handleDeleteIntegration(integration.id)}
                    iconColor={theme.colors.error}
                  />
                </Card.Actions>
              </Card>
            ))}
          </View>
        )}
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
  integrationsContainer: {
    margin: 16,
    gap: 12,
  },
  integrationCard: {
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

export default IntegrationsPanel; 
