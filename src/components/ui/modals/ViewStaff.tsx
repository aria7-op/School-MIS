import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';
import { Card, Button, Chip } from 'react-native-paper';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useTranslation } from '../../../contexts/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../services/api/api';
import { StaffMember } from '../../features/staff/types';
import { format } from 'date-fns';

interface Staff {
  id: number;
  last_name: string;
  father_name: string;
  gender: string;
  province: string;
  district: string;
  position: string;
  department: string;
  salary: number;
  salary_type: string;
  status: string;
  email: string;
  mobile: string;
  created_at: string;
  photo?: string;
  s_n?: string;
  added_by: number;
}

interface ViewStaffProps {
  visible: boolean;
  onClose: () => void;
  onEdit: (staff: Staff) => void;
  onDelete: (id: number) => void;
  staffMembers?: Staff[];
}

const ViewStaff: React.FC<ViewStaffProps> = ({
  visible,
  onClose,
  onEdit,
  onDelete,
  staffMembers,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [staffList, setStaffList] = useState<Staff[]>(staffMembers || []);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible && !staffMembers) {
      fetchStaffData();
    } else if (visible && staffMembers) {
      setStaffList(staffMembers);
      setIsLoading(false);
    }
  }, [visible, staffMembers]);

  const fetchStaffData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://sapi.ariadeltatravel.com/api/staffs');

      if (!response.ok) {
        throw new Error('Failed to fetch staff data');
      }
      const data = await response.json();

      const staffArray = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
          ? data.data
          : [];
      setStaffList(staffArray);
    } catch (err) {
      setError(err.message || 'An error occurred while fetching staff data');
      
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStaff = staffList.filter((staff) =>
    `${staff.last_name} ${staff.father_name} ${staff.position} ${staff.department}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this staff member? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(id) },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Staff Directory</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons 
              name="magnify" 
              size={20} 
              color="#94A3B8" 
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name, position or department..."
              placeholderTextColor="#94A3B8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons 
                name="alert-circle-outline" 
                size={40} 
                color="#EF4444" 
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton} 
                onPress={fetchStaffData}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={styles.loadingText}>Loading staff directory...</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.staffList}
              showsVerticalScrollIndicator={false}
            >
              {filteredStaff.length > 0 ? (
                filteredStaff.map((staff) => (
                  <View key={staff.id} style={styles.staffCard}>
                    <View style={styles.staffHeader}>
                      {staff.photo ? (
                        <Image 
                          source={{ uri: staff.photo }} 
                          style={styles.staffAvatar} 
                        />
                      ) : (
                        <View style={styles.avatarPlaceholder}>
                          <MaterialCommunityIcons 
                            name="account" 
                            size={28} 
                            color="#FFFFFF" 
                          />
                        </View>
                      )}
                      <View style={styles.staffTitle}>
                        <Text style={styles.staffName}>
                          {staff.last_name}
                        </Text>
                        <Text style={styles.staffPosition}>
                          {staff.position}
                        </Text>
                      </View>
                      <View style={styles.statusBadge}>
                        <Text style={[
                          styles.statusText,
                          staff.status === 'active' ? styles.activeStatus : styles.inactiveStatus
                        ]}>
                          {staff.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.staffDetails}>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons 
                          name="account-details" 
                          size={18} 
                          color="#64748B" 
                        />
                        <Text style={styles.detailText}>
                          {staff.father_name}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons 
                          name="office-building" 
                          size={18} 
                          color="#64748B" 
                        />
                        <Text style={styles.detailText}>
                          {staff.department}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons 
                          name="email-outline" 
                          size={18} 
                          color="#64748B" 
                        />
                        <Text style={styles.detailText}>
                          {staff.email}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons 
                          name="phone" 
                          size={18} 
                          color="#64748B" 
                        />
                        <Text style={styles.detailText}>
                          {staff.mobile}
                        </Text>
                      </View>
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons 
                          name="calendar" 
                          size={18} 
                          color="#64748B" 
                        />
                        <Text style={styles.detailText}>
                          Added on {formatDate(staff.created_at)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => onEdit(staff)}
                      >
                        <MaterialIcons name="edit" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDelete(staff.id)}
                      >
                        <MaterialIcons name="delete" size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noResultsContainer}>
                  <MaterialCommunityIcons 
                    name="database-remove" 
                    size={48} 
                    color="#CBD5E1" 
                  />
                  <Text style={styles.noResultsText}>No matching staff found</Text>
                  <Text style={styles.noResultsSubtext}>
                    Try adjusting your search or add a new staff member
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 14,
    color: '#1E293B',
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#64748B',
    fontSize: 14,
  },
  errorContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    color: '#1E293B',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  staffList: {
    flex: 1,
  },
  staffCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  staffTitle: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  staffPosition: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeStatus: {
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
  },
  inactiveStatus: {
    color: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  staffDetails: {
    marginLeft: 60, // Align with avatar
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#4F46E5',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  noResultsContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResultsText: {
    marginTop: 16,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  noResultsSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default ViewStaff;
