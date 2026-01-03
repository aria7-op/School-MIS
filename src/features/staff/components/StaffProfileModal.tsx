import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Staff } from '../hooks/useStaffApi';

interface StaffProfileModalProps {
  visible: boolean;
  staff: Staff | null;
  onClose: () => void;
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  onViewAnalytics?: (staff: Staff) => void;
}

const StaffProfileModal: React.FC<StaffProfileModalProps> = ({
  visible,
  staff,
  onClose,
  onEdit,
  onDelete,
  onViewAnalytics,
}) => {
  if (!staff) return null;

  const handleEdit = () => {
    if (onEdit) {
      onEdit(staff);
    }
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      `Are you sure you want to delete ${staff.firstName} ${staff.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (onDelete) {
              onDelete(staff);
            }
            onClose();
          },
        },
      ]
    );
  };

  const handleViewAnalytics = () => {
    if (onViewAnalytics) {
      onViewAnalytics(staff);
    }
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#10b981';
      case 'INACTIVE':
        return '#f59e0b';
      case 'SUSPENDED':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString();
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(salary);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Profile</Text>
          <View style={styles.headerActions}>
            {onEdit && (
              <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
                <MaterialIcons name="edit" size={20} color="#6366f1" />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.actionButton}>
                <MaterialIcons name="delete" size={20} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {staff.avatar ? (
                <Image source={{ uri: staff.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <MaterialIcons name="person" size={40} color="#6366f1" />
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.name}>
                {staff.firstName} {staff.lastName}
              </Text>
              <Text style={styles.designation}>{staff.designation}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getStatusColor(staff.status) },
                  ]}
                />
                <Text style={styles.statusText}>{staff.status}</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialIcons name="work" size={20} color="#6366f1" />
              <Text style={styles.statValue}>{staff.employeeId}</Text>
              <Text style={styles.statLabel}>Employee ID</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="attach-money" size={20} color="#10b981" />
              <Text style={styles.statValue}>{formatSalary(staff.salary)}</Text>
              <Text style={styles.statLabel}>Salary</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="event" size={20} color="#f59e0b" />
              <Text style={styles.statValue}>{formatDate(staff.joiningDate)}</Text>
              <Text style={styles.statLabel}>Joined</Text>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Information</Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="email" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{staff.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="phone" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{staff.phone}</Text>
            </View>
            {staff.bio && (
              <View style={styles.infoRow}>
                <MaterialIcons name="info" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Bio:</Text>
                <Text style={styles.infoValue}>{staff.bio}</Text>
              </View>
            )}
          </View>

          {/* Employment Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Employment Details</Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="business" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Department:</Text>
              <Text style={styles.infoValue}>
                {staff.department?.name || 'Not assigned'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Gender:</Text>
              <Text style={styles.infoValue}>{staff.gender}</Text>
            </View>
            {staff.birthDate && (
              <View style={styles.infoRow}>
                <MaterialIcons name="cake" size={16} color="#64748b" />
                <Text style={styles.infoLabel}>Birth Date:</Text>
                <Text style={styles.infoValue}>{formatDate(staff.birthDate)}</Text>
              </View>
            )}
          </View>

          {/* Banking Information */}
          {(staff.accountNumber || staff.bankName || staff.ifscCode) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Banking Information</Text>
              {staff.accountNumber && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="account-balance" size={16} color="#64748b" />
                  <Text style={styles.infoLabel}>Account:</Text>
                  <Text style={styles.infoValue}>{staff.accountNumber}</Text>
                </View>
              )}
              {staff.bankName && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="account-balance-wallet" size={16} color="#64748b" />
                  <Text style={styles.infoLabel}>Bank:</Text>
                  <Text style={styles.infoValue}>{staff.bankName}</Text>
                </View>
              )}
              {staff.ifscCode && (
                <View style={styles.infoRow}>
                  <MaterialIcons name="code" size={16} color="#64748b" />
                  <Text style={styles.infoLabel}>IFSC:</Text>
                  <Text style={styles.infoValue}>{staff.ifscCode}</Text>
                </View>
              )}
            </View>
          )}

          {/* System Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Information</Text>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Timezone:</Text>
              <Text style={styles.infoValue}>{staff.timezone || 'UTC'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="language" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Locale:</Text>
              <Text style={styles.infoValue}>{staff.locale || 'en'}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="update" size={16} color="#64748b" />
              <Text style={styles.infoLabel}>Last Updated:</Text>
              <Text style={styles.infoValue}>{formatDate(staff.updatedAt)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {onViewAnalytics && (
              <TouchableOpacity style={styles.actionButton} onPress={handleViewAnalytics}>
                <MaterialIcons name="analytics" size={20} color="#6366f1" />
                <Text style={styles.actionButtonText}>View Analytics</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eef2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  designation: {
    fontSize: 16,
    color: '#6366f1',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
    marginRight: 8,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#64748b',
    flex: 1,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default StaffProfileModal; 
