import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../../constants/colors';

interface BulkOperationsModalProps {
  visible: boolean;
  onClose: () => void;
  selectedCount: number;
  onBulkAction: (action: string, options?: any) => Promise<void>;
}

const BulkOperationsModal: React.FC<BulkOperationsModalProps> = ({
  visible,
  onClose,
  selectedCount,
  onBulkAction,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const bulkActions = [
    {
      id: 'activate',
      title: 'Activate Owners',
      description: 'Set selected owners to active status',
      icon: 'check-circle',
      color: '#4CAF50',
      confirmation: 'Are you sure you want to activate the selected owners?',
    },
    {
      id: 'deactivate',
      title: 'Deactivate Owners',
      description: 'Set selected owners to inactive status',
      icon: 'pause-circle',
      color: '#FF9800',
      confirmation: 'Are you sure you want to deactivate the selected owners?',
    },
    {
      id: 'suspend',
      title: 'Suspend Owners',
      description: 'Temporarily suspend selected owners',
      icon: 'block',
      color: '#F44336',
      confirmation: 'Are you sure you want to suspend the selected owners?',
    },
    {
      id: 'delete',
      title: 'Delete Owners',
      description: 'Permanently delete selected owners',
      icon: 'delete-forever',
      color: '#9C27B0',
      confirmation: 'This action cannot be undone. Are you sure you want to delete the selected owners?',
    },
    {
      id: 'export',
      title: 'Export Selected',
      description: 'Export selected owners data',
      icon: 'download',
      color: '#2196F3',
      confirmation: 'Export selected owners data?',
    },
    {
      id: 'send_email',
      title: 'Send Email',
      description: 'Send email to selected owners',
      icon: 'email',
      color: '#FF5722',
      confirmation: 'Send email to selected owners?',
    },
  ];

  const handleActionPress = (action: any) => {
    setSelectedAction(action.id);
  };

  const handleConfirmAction = async () => {
    if (!selectedAction) return;

    const action = bulkActions.find(a => a.id === selectedAction);
    if (!action) return;

    Alert.alert(
      'Confirm Action',
      action.confirmation,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: selectedAction === 'delete' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await onBulkAction(selectedAction);
              setSelectedAction(null);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to perform bulk action');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleCancelAction = () => {
    setSelectedAction(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bulk Operations</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Selected Count */}
          <View style={styles.selectedCountContainer}>
            <MaterialIcons name="people" size={20} color={colors.primary} />
            <Text style={styles.selectedCountText}>
              {selectedCount} owner{selectedCount !== 1 ? 's' : ''} selected
            </Text>
          </View>

          {/* Actions List */}
          <ScrollView style={styles.actionsList}>
            {bulkActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionItem,
                  selectedAction === action.id && styles.actionItemSelected
                ]}
                onPress={() => handleActionPress(action)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <MaterialIcons name={action.icon as any} size={24} color="white" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionDescription}>{action.description}</Text>
                </View>
                {selectedAction === action.id && (
                  <MaterialIcons name="check-circle" size={24} color={action.color} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Action Buttons */}
          {selectedAction && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelAction}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: bulkActions.find(a => a.id === selectedAction)?.color }
                ]}
                onPress={handleConfirmAction}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirm Action</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Help Text */}
          <View style={styles.helpContainer}>
            <MaterialIcons name="info" size={16} color={colors.textSecondary} />
            <Text style={styles.helpText}>
              Select an action above to perform bulk operations on {selectedCount} selected owner{selectedCount !== 1 ? 's' : ''}
            </Text>
          </View>
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
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  selectedCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  selectedCountText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  actionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 4,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  actionItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 8,
    gap: 8,
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
});

export default BulkOperationsModal; 
