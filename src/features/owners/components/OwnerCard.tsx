import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../constants/colors';
import { Owner } from '../types';

interface OwnerCardProps {
  owner: Owner;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const OwnerCard: React.FC<OwnerCardProps> = ({
  owner,
  onPress,
  onEdit,
  onDelete,
  showActions = false,
}) => {
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {owner.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{owner.name}</Text>
          <View style={styles.statusContainer}>
            <Icon
              name={getStatusIcon(owner.status)}
              size={16}
              color={getStatusColor(owner.status)}
            />
            <Text style={[styles.status, { color: getStatusColor(owner.status) }]}>
              {owner.status}
            </Text>
          </View>
        </View>
        {showActions && (
          <View style={styles.actions}>
            {onEdit && (
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={onEdit}
              >
                <Icon name="edit" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={onDelete}
              >
                <Icon name="delete" size={16} color={colors.white} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <Icon name="email" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>{owner.email}</Text>
        </View>
        
        {owner.phone && (
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{owner.phone}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="schedule" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Joined {new Date(owner.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {owner._count && (
          <View style={styles.statsContainer}>
            {owner._count.schools !== undefined && (
              <View style={styles.statItem}>
                <Icon name="school" size={16} color={colors.primary} />
                <Text style={styles.statText}>{owner._count.schools} Schools</Text>
              </View>
            )}
            {owner._count.createdUsers !== undefined && (
              <View style={styles.statItem}>
                <Icon name="people" size={16} color={colors.primary} />
                <Text style={styles.statText}>{owner._count.createdUsers} Users</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Icon name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: colors.dark,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
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
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: colors.info,
  },
  deleteButton: {
    backgroundColor: colors.danger,
  },
  content: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
});

export default OwnerCard; 
