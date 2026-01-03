import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../constants/colors';
import { Owner } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import { useOwners } from '../contexts/OwnersContext';

type OwnerDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'OwnerDetails'>;
type OwnerDetailScreenRouteProp = RouteProp<RootStackParamList, 'OwnerDetails'>;

interface OwnerDetailScreenProps {
  navigation: OwnerDetailScreenNavigationProp;
  route: OwnerDetailScreenRouteProp;
}

const OwnerDetailScreen: React.FC<OwnerDetailScreenProps> = ({ navigation, route }) => {
  const { ownerId } = route.params;
  const { fetchOwnerById, deleteOwner } = useOwners();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchOwnerDetails = async () => {
    try {
      setLoading(true);
      const ownerData = await fetchOwnerById(ownerId);
      if (ownerData) {
        setOwner(ownerData);
        setError('');
      } else {
        setError('Owner not found');
      }
    } catch (error: any) {
      setError(error.error || 'Failed to fetch owner details');
      Alert.alert('Error', error.error || 'Failed to fetch owner details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOwnerDetails();
  }, [ownerId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOwnerDetails();
  };

  const handleEdit = () => {
    navigation.navigate('EditOwner', { ownerId });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Owner',
      `Are you sure you want to delete ${owner?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteOwner(ownerId);
            if (result.success) {
              Alert.alert('Success', 'Owner deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } else {
              Alert.alert('Error', result.error || 'Failed to delete owner');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return colors.success;
      case 'INACTIVE':
        return colors.warning;
      case 'SUSPENDED':
        return colors.danger;
      default:
        return colors.gray;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'check-circle';
      case 'INACTIVE':
        return 'pause-circle';
      case 'SUSPENDED':
        return 'block';
      default:
        return 'help';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading owner details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color={colors.danger} />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!owner) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="person-off" size={48} color={colors.textSecondary} />
        <Text style={styles.errorTitle}>Owner not found</Text>
        <Text style={styles.errorMessage}>The requested owner could not be found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ alignItems: 'center' }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {owner?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{owner?.name}</Text>
            <Text style={styles.email}>{owner?.email}</Text>
            <View style={styles.statusContainer}>
              <Icon
                name={getStatusIcon(owner?.status || '')}
                size={16}
                color={getStatusColor(owner?.status || '')}
              />
              <Text style={[styles.status, { color: getStatusColor(owner?.status || '') }]}>
                {owner?.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
            <Icon name="edit" size={20} color={colors.white} />
            <Text style={styles.editButtonText}>Edit Owner</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Icon name="delete" size={20} color={colors.white} />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="person" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{owner.name}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="email" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{owner.email}</Text>
                {owner.emailVerified && (
                  <View style={styles.verifiedBadge}>
                    <Icon name="verified" size={12} color={colors.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            </View>

            {owner.phone && (
              <View style={styles.infoRow}>
                <Icon name="phone" size={20} color={colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Phone Number</Text>
                  <Text style={styles.infoValue}>{owner.phone}</Text>
                </View>
              </View>
            )}

            <View style={styles.infoRow}>
              <Icon name="schedule" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(owner.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="update" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>
                  {new Date(owner.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Icon name="language" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Locale</Text>
                <Text style={styles.infoValue}>{owner.locale}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Icon name="access-time" size={20} color={colors.primary} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Timezone</Text>
                <Text style={styles.infoValue}>{owner.timezone}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Additional Information */}
        {owner.metadata && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Information</Text>
            <View style={styles.infoCard}>
              {owner.metadata.department && (
                <View style={styles.infoRow}>
                  <Icon name="business" size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Department</Text>
                    <Text style={styles.infoValue}>{owner.metadata.department}</Text>
                  </View>
                </View>
              )}

              {owner.metadata.location && (
                <View style={styles.infoRow}>
                  <Icon name="location-on" size={20} color={colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Location</Text>
                    <Text style={styles.infoValue}>{owner.metadata.location}</Text>
                  </View>
                </View>
              )}

              {owner.metadata.preferences && (
                <>
                  <View style={styles.infoRow}>
                    <Icon name="palette" size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Theme Preference</Text>
                      <Text style={styles.infoValue}>
                        {owner.metadata.preferences.theme?.charAt(0).toUpperCase() + 
                         owner.metadata.preferences.theme?.slice(1) || 'Light'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Icon name="notifications" size={20} color={colors.primary} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoLabel}>Email Notifications</Text>
                      <Text style={styles.infoValue}>
                        {owner.metadata.preferences.notifications ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        {/* Statistics */}
        {owner._count && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistics</Text>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Icon name="school" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{owner._count.schools || 0}</Text>
                <Text style={styles.statLabel}>Schools</Text>
              </View>
              <View style={styles.statItem}>
                <Icon name="people" size={24} color={colors.primary} />
                <Text style={styles.statValue}>{owner._count.createdUsers || 0}</Text>
                <Text style={styles.statLabel}>Created Users</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 4,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default OwnerDetailScreen;
