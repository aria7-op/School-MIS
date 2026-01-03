import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRole } from '../../contexts/RoleContext';
import { ROLES } from '../../config/roleConfig';

interface RoleSelectorProps {
  style?: any;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ style }) => {
  const [showModal, setShowModal] = useState(false);
  const { selectedRole, setSelectedRole, getRoleDisplayName, getRoleColor, getRoleIcon } = useRole();

  const currentRole = ROLES.find(role => role.id === selectedRole);

  const handleRoleSelect = async (roleId: string) => {
    await setSelectedRole(roleId);
    setShowModal(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.roleSelector, style]}
        onPress={() => setShowModal(true)}
      >
        <View style={[styles.roleIcon, { backgroundColor: getRoleColor(selectedRole) }]}>
          <MaterialCommunityIcons 
            name={getRoleIcon(selectedRole) as any} 
            size={16} 
            color="#fff" 
          />
        </View>
        <Text style={styles.roleText}>
          {getRoleDisplayName(selectedRole)}
        </Text>
        <MaterialCommunityIcons 
          name="chevron-down" 
          size={16} 
          color="#6B7280" 
        />
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Role</Text>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.roleList}>
              {ROLES.map((role) => (
                <TouchableOpacity
                  key={role.id}
                  style={[
                    styles.roleItem,
                    selectedRole === role.id && styles.selectedRoleItem
                  ]}
                  onPress={() => handleRoleSelect(role.id)}
                >
                  <View style={[styles.roleItemIcon, { backgroundColor: role.color }]}>
                    <MaterialCommunityIcons 
                      name={role.icon as any} 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                  <View style={styles.roleItemContent}>
                    <Text style={[
                      styles.roleItemName,
                      selectedRole === role.id && styles.selectedRoleItemName
                    ]}>
                      {role.displayName}
                    </Text>
                    <Text style={styles.roleItemDescription}>
                      {role.description}
                    </Text>
                  </View>
                  {selectedRole === role.id && (
                    <MaterialCommunityIcons 
                      name="check" 
                      size={20} 
                      color="#10B981" 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
  },
  roleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  roleText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  roleList: {
    padding: 16,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedRoleItem: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#6366F1',
  },
  roleItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleItemContent: {
    flex: 1,
  },
  roleItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  selectedRoleItemName: {
    color: '#6366F1',
    fontWeight: '600',
  },
  roleItemDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default RoleSelector; 
