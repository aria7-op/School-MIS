import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Modal, Portal, TextInput, Button, List, Avatar, Chip, Searchbar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import api from '../../../services/api/client';

interface Student {
  id: number;
  uuid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  studentId: string;
  class?: any;
  parent?: any;
  outstandingFees?: number;
  totalFees?: number;
}

interface StudentSearchModalProps {
  visible: boolean;
  onDismiss: () => void;
  onStudentSelect: (student: Student) => void;
}

const StudentSearchModal: React.FC<StudentSearchModalProps> = ({
  visible,
  onDismiss,
  onStudentSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      loadStudents();
    }
  }, [visible]);

  useEffect(() => {
    filterStudents();
  }, [searchQuery, students, selectedFilters]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/students?include=class,parent&limit=100');
      const studentsData = response.data.data || response.data;
      
      // Add mock financial data for demonstration
      const studentsWithFees = studentsData.map((student: Student) => ({
        ...student,
        outstandingFees: Math.floor(Math.random() * 5000) + 1000,
        totalFees: Math.floor(Math.random() * 8000) + 2000
      }));
      
      setStudents(studentsWithFees);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load students');
      
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (selectedFilters.includes('outstanding')) {
      filtered = filtered.filter(student => (student.outstandingFees || 0) > 0);
    }
    if (selectedFilters.includes('overdue')) {
      filtered = filtered.filter(student => (student.outstandingFees || 0) > 2000);
    }

    setFilteredStudents(filtered);
  };

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const handleStudentSelect = (student: Student) => {
    onStudentSelect(student);
  };

  const renderStudentItem = (student: Student) => (
    <List.Item
      key={student.id}
      title={`${student.firstName} ${student.lastName}`}
      description={`ID: ${student.studentId} | ${student.class?.name || 'No Class'}`}
      left={(props) => (
        <Avatar.Text
          {...props}
          size={40}
          label={`${student.firstName[0]}${student.lastName[0]}`}
        />
      )}
      right={() => (
        <View style={styles.studentInfo}>
          <Text style={styles.feeAmount}>
            ${student.outstandingFees?.toLocaleString() || 0}
          </Text>
          <Text style={styles.feeLabel}>Outstanding</Text>
          {(student.outstandingFees || 0) > 2000 && (
            <Chip mode="outlined" textStyle={{ fontSize: 10 }} style={styles.overdueChip}>
              Overdue
            </Chip>
          )}
        </View>
      )}
      onPress={() => handleStudentSelect(student)}
      style={styles.studentItem}
    />
  );

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.modal}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Select Student for Payment</Text>
          <Button onPress={onDismiss} icon="close" />
        </View>

        {/* Search Bar */}
        <Searchbar
          placeholder="Search by name, ID, or email..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />

        {/* Filters */}
        <View style={styles.filters}>
          <Chip
            selected={selectedFilters.includes('outstanding')}
            onPress={() => toggleFilter('outstanding')}
            style={styles.filterChip}
          >
            Has Outstanding Fees
          </Chip>
          <Chip
            selected={selectedFilters.includes('overdue')}
            onPress={() => toggleFilter('overdue')}
            style={styles.filterChip}
          >
            Overdue
          </Chip>
        </View>

        {/* Students List */}
        <ScrollView style={styles.studentsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Loading students...</Text>
            </View>
          ) : filteredStudents.length > 0 ? (
            filteredStudents.map(renderStudentItem)
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="search-off" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No students found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''} found
          </Text>
          <Button mode="outlined" onPress={onDismiss}>
            Cancel
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  searchBar: {
    margin: 16,
    marginTop: 8,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  studentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  studentItem: {
    marginVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  studentInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 80,
  },
  feeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  feeLabel: {
    fontSize: 12,
    color: '#666',
  },
  overdueChip: {
    marginTop: 4,
    backgroundColor: '#ffebee',
    borderColor: '#F44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});

export default StudentSearchModal;
