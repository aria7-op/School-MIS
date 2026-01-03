import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Card, Button, TextInput, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

interface TasksProps {
  tasksData?: any;
  onTaskCreate?: (taskData: any) => Promise<void>;
  onTaskUpdate?: (taskId: number, status: string) => Promise<void>;
  onTaskDelete?: (taskId: number) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

const Tasks: React.FC<TasksProps> = ({ 
  tasksData, 
  onTaskCreate, 
  onTaskUpdate, 
  onTaskDelete,
  loading = false,
  error = null
}) => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    customer: '',
    dueDate: '',
    priority: 'medium',
    type: 'call',
  });

  const { colors } = useTheme();

  // Handle undefined/null tasksData
  if (!tasksData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No tasks data provided</Text>
      </View>
    );
  }

  // Handle API response structure or direct data
  let displayTasks = [];
  if (tasksData.success && Array.isArray(tasksData.data)) {
    displayTasks = tasksData.data;
  } else if (Array.isArray(tasksData)) {
    displayTasks = tasksData;
  }

  if (displayTasks.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No tasks available.</Text>
        <Text style={styles.emptySubtext}>Create your first task to get started.</Text>
      </View>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return colors.error;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.success;
      default:
        return colors.onSurface;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'in-progress':
        return colors.primary;
      case 'pending':
        return colors.warning;
      default:
        return colors.onSurface;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call':
        return 'phone';
      case 'email':
        return 'email';
      case 'meeting':
        return 'event';
      case 'visit':
        return 'location-on';
      default:
        return 'task';
    }
  };

  const addTask = async () => {
    if (newTask.title && newTask.customer) {
      try {
        if (onTaskCreate) {
          await onTaskCreate({
            ...newTask,
            status: 'pending',
          });
        }
        
        // Reset form
        setNewTask({
          title: '',
          description: '',
          customer: '',
          dueDate: '',
          priority: 'medium',
          type: 'call',
        });
        setShowAddTask(false);
        Alert.alert('Success', 'Task created successfully');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to create task');
      }
    } else {
      Alert.alert('Error', 'Please fill in all required fields');
    }
  };

  const updateTaskStatus = async (taskId: number, status: string) => {
    try {
      if (onTaskUpdate) {
        await onTaskUpdate(taskId, status);
        Alert.alert('Success', `Task status updated to ${status}`);
      } else {
        Alert.alert('Info', `Task status updated to ${status}`);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update task status');
    }
  };

  const deleteTask = async (taskId: number) => {
    try {
      if (onTaskDelete) {
        await onTaskDelete(taskId);
        Alert.alert('Success', 'Task deleted successfully');
      } else {
        Alert.alert('Info', 'Task deleted successfully');
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading tasks...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const renderTaskCard = (task: any) => (
    <Card key={task.id} style={styles.taskCard}>
      <Card.Content>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <MaterialIcons
              name={getTypeIcon(task.type) as any}
              size={20}
              color={colors.primary}
            />
            <Text style={styles.taskTitle}>{task.title}</Text>
          </View>
          <View style={styles.taskActions}>
            <Chip
              style={[styles.priorityChip, { backgroundColor: getPriorityColor(task.priority) }]}
              textStyle={styles.priorityText}
            >
              {task.priority}
            </Chip>
            <Chip
              style={[styles.statusChip, { backgroundColor: getStatusColor(task.status) }]}
              textStyle={styles.statusText}
            >
              {task.status}
            </Chip>
          </View>
        </View>

        <Text style={styles.taskDescription}>{task.description}</Text>
        
        <View style={styles.taskMeta}>
          <View style={styles.metaItem}>
            <MaterialIcons name="person" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{task.customer}</Text>
          </View>
          <View style={styles.metaItem}>
            <MaterialIcons name="event" size={16} color={colors.onSurfaceVariant} />
            <Text style={styles.metaText}>{task.dueDate}</Text>
          </View>
        </View>

        <View style={styles.taskButtons}>
          {task.status === 'pending' && (
            <Button
              mode="outlined"
              onPress={() => updateTaskStatus(task.id, 'in-progress')}
              style={styles.taskButton}
              icon="play"
            >
              Start
            </Button>
          )}
          {task.status === 'in-progress' && (
            <Button
              mode="outlined"
              onPress={() => updateTaskStatus(task.id, 'completed')}
              style={styles.taskButton}
              icon="check"
            >
              Complete
            </Button>
          )}
          <Button
            mode="outlined"
            onPress={() => deleteTask(task.id)}
            style={[styles.taskButton, styles.deleteButton]}
            icon="delete"
          >
            Delete
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  const renderAddTaskForm = () => (
    <Card style={styles.addTaskCard}>
      <Card.Content>
        <Text style={styles.addTaskTitle}>Add New Task</Text>
        
        <TextInput
          mode="outlined"
          label="Task Title"
          value={newTask.title}
          onChangeText={(value) => setNewTask({ ...newTask, title: value })}
          style={styles.input}
        />
        
        <TextInput
          mode="outlined"
          label="Description"
          value={newTask.description}
          onChangeText={(value) => setNewTask({ ...newTask, description: value })}
          style={styles.input}
          multiline
        />
        
        <TextInput
          mode="outlined"
          label="Customer"
          value={newTask.customer}
          onChangeText={(value) => setNewTask({ ...newTask, customer: value })}
          style={styles.input}
        />
        
        <TextInput
          mode="outlined"
          label="Due Date"
          value={newTask.dueDate}
          onChangeText={(value) => setNewTask({ ...newTask, dueDate: value })}
          style={styles.input}
          placeholder="YYYY-MM-DD"
        />
        
        <View style={styles.formButtons}>
          <Button
            mode="outlined"
            onPress={() => setShowAddTask(false)}
            style={styles.formButton}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={addTask}
            style={styles.formButton}
          >
            Add Task
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {showAddTask && renderAddTaskForm()}
        
        {displayTasks.map(renderTaskCard)}
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => setShowAddTask(!showAddTask)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  taskCard: {
    marginBottom: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 4,
  },
  priorityChip: {
    height: 20,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
  },
  statusChip: {
    height: 20,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  taskMeta: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  taskButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  taskButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: '#F44336',
  },
  addTaskCard: {
    marginBottom: 16,
  },
  addTaskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    marginBottom: 12,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#2196F3',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F44336',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#666',
  },
});

export default Tasks; 
