import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { tasksApi } from '../services/staffApi';

const dummyTasks = {
  tasks: [
    {
      id: 1,
      title: 'Complete Student Assessments',
      description: 'Grade and submit all student assessments for the current semester',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      assignedTo: 'John Doe',
      assignedBy: 'Department Head',
      dueDate: '2024-01-25',
      completedAt: null,
      tags: ['Academic', 'Grading'],
      progress: 60
    },
    {
      id: 2,
      title: 'Update Curriculum Materials',
      description: 'Review and update curriculum materials for next academic year',
      priority: 'MEDIUM',
      status: 'PENDING',
      assignedTo: 'Sarah Johnson',
      assignedBy: 'Curriculum Director',
      dueDate: '2024-02-15',
      completedAt: null,
      tags: ['Curriculum', 'Planning'],
      progress: 0
    },
    {
      id: 3,
      title: 'Staff Training Session',
      description: 'Conduct training session on new educational software',
      priority: 'HIGH',
      status: 'COMPLETED',
      assignedTo: 'Michael Brown',
      assignedBy: 'IT Manager',
      dueDate: '2024-01-20',
      completedAt: '2024-01-19',
      tags: ['Training', 'Technology'],
      progress: 100
    }
  ],
  statistics: {
    total: 15,
    pending: 5,
    inProgress: 7,
    completed: 3,
    overdue: 2,
    completionRate: 20,
    averageCompletionTime: 4.5
  },
  overdueTasks: [
    { id: 4, title: 'Submit Monthly Report', daysOverdue: 3 },
    { id: 5, title: 'Student Feedback Review', daysOverdue: 1 }
  ]
};

const StaffTasks = () => {
  const [tasks, setTasks] = useState(dummyTasks.tasks);
  const [statistics, setStatistics] = useState(dummyTasks.statistics);
  const [overdueTasks, setOverdueTasks] = useState(dummyTasks.overdueTasks);
  const [loading, setLoading] = useState(false);
  const [usingDummyData, setUsingDummyData] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: '',
    assignedTo: '',
    tags: ''
  });

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [tasksResponse, statsResponse, overdueResponse] = await Promise.all([
        tasksApi.getStaffTasks('1'),
        tasksApi.getTaskStatistics('1'),
        tasksApi.getOverdueTasks('1')
      ]);
      
      setTasks(tasksResponse.data);
      setStatistics(statsResponse.data);
      setOverdueTasks(overdueResponse.data);
      setUsingDummyData(false);
    } catch (error) {
      
      setUsingDummyData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      const response = await tasksApi.createStaffTask('1', {
        ...newTask,
        tags: newTask.tags.split(',').map(tag => tag.trim())
      });
      setTasks(prev => [...prev, response.data]);
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', priority: 'MEDIUM', dueDate: '', assignedTo: '', tags: '' });
      Alert.alert('Success', 'Task created successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await tasksApi.completeStaffTask('1', taskId);
      setTasks(prev => prev.map(task => 
        task.id === taskId ? response.data : task
      ));
      Alert.alert('Success', 'Task completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tasksApi.deleteStaffTask('1', taskId);
              setTasks(prev => prev.filter(task => task.id !== taskId));
              Alert.alert('Success', 'Task deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  const filteredTasks = tasks.filter(task => 
    selectedStatus === 'all' || task.status === selectedStatus
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#6b7280';
      case 'IN_PROGRESS': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      case 'OVERDUE': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const renderStatistics = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitle}>Task Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.total}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.inProgress}</Text>
          <Text style={styles.statLabel}>In Progress</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{statistics.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>Completion Rate: {statistics.completionRate}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${statistics.completionRate}%` }]} />
        </View>
      </View>
    </View>
  );

  const renderOverdueTasks = () => {
    if (overdueTasks.length === 0) return null;

    return (
      <View style={styles.overdueSection}>
        <Text style={styles.sectionTitle}>⚠️ Overdue Tasks</Text>
        {overdueTasks.map(task => (
          <View key={task.id} style={styles.overdueCard}>
            <Text style={styles.overdueTitle}>{task.title}</Text>
            <Text style={styles.overdueDays}>
              {task.daysOverdue} day{task.daysOverdue > 1 ? 's' : ''} overdue
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderTaskCard = (task: any) => (
    <View key={task.id} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <View style={styles.taskInfo}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <Text style={styles.taskDescription}>{task.description}</Text>
        </View>
        <View style={styles.taskPriority}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority) }]}>
            <Text style={styles.priorityText}>{task.priority}</Text>
          </View>
        </View>
      </View>

      <View style={styles.taskDetails}>
        <Text style={styles.taskMeta}>Assigned to: {task.assignedTo}</Text>
        <Text style={styles.taskMeta}>Due: {new Date(task.dueDate).toLocaleDateString()}</Text>
        <Text style={styles.taskMeta}>Status: {task.status.replace('_', ' ')}</Text>
        {task.progress > 0 && (
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Progress: {task.progress}%</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.taskTags}>
        {task.tags.map((tag: string, index: number) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.taskActions}>
        {task.status !== 'COMPLETED' && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => handleCompleteTask(task.id)}
          >
            <MaterialIcons name="check" size={16} color="#10b981" />
            <Text style={styles.actionButtonText}>Complete</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => {
            setSelectedTask(task);
            setShowTaskModal(true);
          }}
        >
          <MaterialIcons name="edit" size={16} color="#3b82f6" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => handleDeleteTask(task.id)}
        >
          <MaterialIcons name="delete" size={16} color="#ef4444" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreateModal = () => (
    <Modal visible={showCreateModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modal}>
          <Text style={styles.modalTitle}>Create New Task</Text>
          
          <TextInput
            style={styles.modalInput}
            placeholder="Task Title"
            value={newTask.title}
            onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Description"
            value={newTask.description}
            onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
            multiline
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Assigned To"
            value={newTask.assignedTo}
            onChangeText={(text) => setNewTask(prev => ({ ...prev, assignedTo: text }))}
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Due Date (YYYY-MM-DD)"
            value={newTask.dueDate}
            onChangeText={(text) => setNewTask(prev => ({ ...prev, dueDate: text }))}
          />
          
          <TextInput
            style={styles.modalInput}
            placeholder="Tags (comma-separated)"
            value={newTask.tags}
            onChangeText={(text) => setNewTask(prev => ({ ...prev, tags: text }))}
          />
          
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={() => setShowCreateModal(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalButtonPrimary]} 
              onPress={handleCreateTask}
            >
              <Text style={styles.modalButtonTextPrimary}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {usingDummyData && (
        <View style={styles.dummyDataNotification}>
          <MaterialIcons name="info" size={16} color="#f59e0b" />
          <Text style={styles.dummyDataText}>Showing sample data due to connection issues</Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>Staff Tasks</Text>
        <TouchableOpacity 
          style={styles.createButton} 
          onPress={() => setShowCreateModal(true)}
        >
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Task</Text>
        </TouchableOpacity>
      </View>

      {renderStatistics()}
      {renderOverdueTasks()}

      <View style={styles.filtersSection}>
        <Text style={styles.sectionTitle}>Filter by Status</Text>
        <View style={styles.statusFilters}>
          {['all', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE'].map(status => (
            <TouchableOpacity
              key={status}
              style={[styles.statusChip, selectedStatus === status && styles.statusChipActive]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.statusChipText, 
                selectedStatus === status && styles.statusChipTextActive
              ]}>
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.tasksSection}>
        <Text style={styles.sectionTitle}>Tasks ({filteredTasks.length})</Text>
        {filteredTasks.map(renderTaskCard)}
      </View>

      {renderCreateModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  dummyDataNotification: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fef3c7', 
    padding: 12, 
    margin: 16,
    borderRadius: 8 
  },
  dummyDataText: { marginLeft: 8, color: '#92400e', fontSize: 14 },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1f2937' },
  createButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#3b82f6', 
    padding: 8, 
    borderRadius: 8 
  },
  createButtonText: { marginLeft: 4, color: '#fff', fontWeight: '600' },
  statsSection: { padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#1f2937' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  statCard: { 
    width: '48%', 
    backgroundColor: '#f9fafb', 
    borderRadius: 8, 
    padding: 16, 
    marginBottom: 8, 
    marginHorizontal: '1%',
    alignItems: 'center'
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#3b82f6' },
  statLabel: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  progressSection: { marginTop: 16 },
  progressLabel: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  progressBar: { 
    height: 8, 
    backgroundColor: '#e5e7eb', 
    borderRadius: 4, 
    overflow: 'hidden' 
  },
  progressFill: { 
    height: '100%', 
    backgroundColor: '#3b82f6', 
    borderRadius: 4 
  },
  overdueSection: { padding: 16, backgroundColor: '#fef2f2' },
  overdueCard: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 8, 
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },
  overdueTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  overdueDays: { fontSize: 14, color: '#ef4444', fontWeight: '500' },
  filtersSection: { padding: 16, backgroundColor: '#fff', marginBottom: 8 },
  statusFilters: { flexDirection: 'row', flexWrap: 'wrap' },
  statusChip: { 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 16, 
    backgroundColor: '#f3f4f6', 
    margin: 2 
  },
  statusChipActive: { backgroundColor: '#3b82f6' },
  statusChipText: { color: '#6b7280', fontSize: 14 },
  statusChipTextActive: { color: '#fff', fontWeight: '600' },
  tasksSection: { padding: 16, backgroundColor: '#fff' },
  taskCard: { 
    backgroundColor: '#f9fafb', 
    borderRadius: 12, 
    padding: 16, 
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  taskHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start',
    marginBottom: 12
  },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 },
  taskDescription: { fontSize: 14, color: '#6b7280' },
  taskPriority: { marginLeft: 8 },
  priorityBadge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12 
  },
  priorityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  taskDetails: { marginBottom: 12 },
  taskMeta: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  progressContainer: { marginTop: 8 },
  progressText: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  taskTags: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    marginBottom: 12 
  },
  tag: { 
    backgroundColor: '#e0e7ff', 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 12, 
    marginRight: 8, 
    marginBottom: 4 
  },
  tagText: { fontSize: 12, color: '#3730a3' },
  taskActions: { 
    flexDirection: 'row', 
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 12
  },
  actionButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 8 
  },
  actionButtonText: { marginLeft: 4, fontSize: 14, color: '#6b7280' },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  modal: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    padding: 24, 
    width: 320 
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  modalInput: { 
    borderWidth: 1, 
    borderColor: '#d1d5db', 
    borderRadius: 8, 
    padding: 12, 
    marginBottom: 12,
    backgroundColor: '#fff'
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  modalButton: { 
    flex: 1, 
    padding: 12, 
    borderRadius: 8, 
    marginHorizontal: 4, 
    borderWidth: 1, 
    borderColor: '#d1d5db' 
  },
  modalButtonPrimary: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  modalButtonText: { textAlign: 'center', color: '#6b7280', fontWeight: '600' },
  modalButtonTextPrimary: { textAlign: 'center', color: '#fff', fontWeight: '600' },
});

export default StaffTasks; 
