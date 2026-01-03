import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AttendanceRecord, User } from '../models';
import { AttendanceStatus } from '../types';

interface AttendanceListProps {
  records: AttendanceRecord[];
  users: User[];
  onEdit?: (recordId: string) => void;
  onAdd?: () => void;
}

const AttendanceList: React.FC<AttendanceListProps> = ({ records, users, onEdit, onAdd }) => {
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return '#4CAF50';
      case 'absent': return '#F44336';
      case 'late': return '#FFC107';
      case 'excused': return '#9C27B0';
      default: return '#9E9E9E';
    }
  };

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'present': return 'check-circle';
      case 'absent': return 'cancel';
      case 'late': return 'schedule';
      case 'excused': return 'assignment-turned-in';
      default: return 'help';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.headerText}>Attendance Records</Text>
            {onAdd && (
              <TouchableOpacity onPress={onAdd}>
                <MaterialIcons name="add-circle" size={24} color="#3f51b5" />
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.recordItem}>
            <View style={styles.recordInfo}>
              <MaterialIcons
                name={getStatusIcon(item.status)}
                size={20}
                color={getStatusColor(item.status)}
                style={styles.statusIcon}
              />
              <View>
                <Text style={styles.userName}>{getUserName(item.userId)}</Text>
                <Text style={styles.dateText}>
                  {new Date(item.date).toLocaleDateString()} • {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </Text>
                {item.notes && (
                  <Text style={styles.notesText} numberOfLines={1}>
                    Notes: {item.notes}
                  </Text>
                )}
              </View>
            </View>
            {onEdit && (
              <TouchableOpacity onPress={() => onEdit(item.id)}>
                <MaterialIcons name="edit" size={20} color="#3f51b5" />
              </TouchableOpacity>
            )}
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    margin: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  recordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginHorizontal: 16,
  },
});

export default AttendanceList;
