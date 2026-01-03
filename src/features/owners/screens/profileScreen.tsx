import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ActivityIndicator, 
  ScrollView, 
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputChangeEventData
} from 'react-native';
import { useAuth } from '../../../context/authContext';
import ownerService from '../services/ownerService';
import { Owner } from '../../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../navigation/types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

interface FormData {
  name: string;
  phone: string;
  timezone: string;
  metadata: {
    department: string;
    location: string;
  };
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { userToken, userInfo, logout } = useAuth();
  const [profile, setProfile] = useState<Owner | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    timezone: '',
    metadata: { department: '', location: '' }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await ownerService.getProfile(userToken || '');
        setProfile(response.data);
        setFormData({
          name: response.data.name || '',
          phone: response.data.phone || '',
          timezone: response.data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          metadata: response.data.metadata || { department: '', location: '' }
        });
        setLoading(false);
      } catch (error) {
        setError('Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userToken]);

  const handleInputChange = (field: keyof FormData | string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.') as [keyof FormData, string];
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        [field as keyof FormData]: value 
      }));
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await ownerService.updateProfile(userToken || '', formData);
      setProfile(response.data);
      setEditMode(false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      setLoading(false);
    } catch (error) {
      setError('Failed to update profile');
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigation.navigate('Login');
  };

  if (loading && !profile) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Owner Profile</Text>
        {!editMode && (
          <TouchableOpacity onPress={() => setEditMode(true)}>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      {editMode ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.nativeEvent.text)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.nativeEvent.text)}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Timezone"
            value={formData.timezone}
            onChange={(e) => handleInputChange('timezone', e.nativeEvent.text)}
          />
          
          <Text style={styles.sectionTitle}>Metadata</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Department"
            value={formData.metadata.department}
            onChange={(e) => handleInputChange('metadata.department', e.nativeEvent.text)}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Location"
            value={formData.metadata.location}
            onChange={(e) => handleInputChange('metadata.location', e.nativeEvent.text)}
          />
          
          <View style={styles.buttonGroup}>
            <Button
              title="Cancel"
              onPress={() => {
                setEditMode(false);
                if (profile) {
                  setFormData({
                    name: profile.name || '',
                    phone: profile.phone || '',
                    timezone: profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
                    metadata: profile.metadata || { department: '', location: '' }
                  });
                }
              }}
              color="gray"
            />
            <Button
              title="Save"
              onPress={handleSave}
              disabled={loading}
            />
          </View>
        </>
      ) : (
        <>
          <View style={styles.profileInfo}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{profile?.name}</Text>
            
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{profile?.email}</Text>
            
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{profile?.phone || 'Not provided'}</Text>
            
            <Text style={styles.label}>Timezone:</Text>
            <Text style={styles.value}>{profile?.timezone}</Text>
            
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, styles[profile?.status.toLowerCase() as keyof typeof styles]]}>
              {profile?.status}
            </Text>
            
            {profile?.metadata && (
              <>
                <Text style={styles.sectionTitle}>Metadata</Text>
                <Text style={styles.label}>Department:</Text>
                <Text style={styles.value}>{profile.metadata.department || 'Not provided'}</Text>
                
                <Text style={styles.label}>Location:</Text>
                <Text style={styles.value}>{profile.metadata.location || 'Not provided'}</Text>
              </>
            )}
          </View>
          
          <View style={styles.actions}>
            <Button
              title="Change Password"
              onPress={() => navigation.navigate('ChangePassword')}
            />
            <Button
              title="Logout"
              onPress={handleLogout}
              color="red"
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  editButton: {
    color: 'blue',
    fontSize: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  profileInfo: {
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actions: {
    marginTop: 30,
    gap: 10,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  success: {
    color: 'green',
    marginBottom: 10,
    textAlign: 'center',
  },
  active: {
    color: 'green',
  },
  inactive: {
    color: 'orange',
  },
  suspended: {
    color: 'red',
  },
});

export default ProfileScreen;
