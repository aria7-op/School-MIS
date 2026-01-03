import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { colors } from '../../../constants/colors';
import OwnerForm from '../components/OwnerForm';
import { Owner } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../navigation/types';
import { useOwners } from '../contexts/OwnersContext';

type EditOwnerScreenNavigationProp = StackNavigationProp<RootStackParamList, 'EditOwner'>;
type EditOwnerScreenRouteProp = RouteProp<RootStackParamList, 'EditOwner'>;

interface EditOwnerScreenProps {
  navigation: EditOwnerScreenNavigationProp;
  route: EditOwnerScreenRouteProp;
}

const EditOwnerScreen: React.FC<EditOwnerScreenProps> = ({ navigation, route }) => {
  const { ownerId } = route.params;
  const { fetchOwnerById, updateOwner } = useOwners();
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchOwner = async () => {
    try {
      setLoading(true);
      const ownerData = await fetchOwnerById(ownerId);
      if (ownerData) {
        setOwner(ownerData);
      } else {
        Alert.alert('Error', 'Failed to fetch owner details');
        navigation.goBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.error || 'Failed to fetch owner details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwner();
  }, [ownerId]);

  const handleSubmit = async (formData: any) => {
    try {
      setSaving(true);
      
      const updateData = {
        name: formData.name,
        phone: formData.phone || undefined,
        status: formData.status,
        timezone: formData.timezone,
        locale: formData.locale,
        metadata: formData.metadata,
      };

      const result = await updateOwner(ownerId, updateData);
      
      if (result.success) {
        Alert.alert(
          'Success',
          `Owner "${result.data?.name || 'Owner'}" updated successfully!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to update owner');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update owner');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel',
      'Are you sure you want to cancel? All changes will be lost.',
      [
        { text: 'Continue Editing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading owner details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!owner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Owner not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Owner</Text>
        <Text style={styles.subtitle}>
          Update owner information and settings
        </Text>
      </View>

      {saving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Saving changes...</Text>
        </View>
      )}

      <OwnerForm
        owner={owner}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
        isEdit={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
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
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default EditOwnerScreen; 
