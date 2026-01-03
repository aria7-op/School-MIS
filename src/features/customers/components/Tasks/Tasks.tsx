import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import useCustomerTasks from '../../hooks/useCustomerTasks';

const customerId = 'demo-customer-id'; // TODO: Replace with real customer ID

const Tasks: React.FC = () => {
  const { loading, error, tasks, getCustomerTasks } = useCustomerTasks(customerId);

  useEffect(() => {
    getCustomerTasks();
  }, [getCustomerTasks]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Tasks</Text>
          {loading && <ActivityIndicator animating size="small" />}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {!loading && !error && tasks.length === 0 && (
            <Text>No tasks found for this customer.</Text>
          )}
          <ScrollView>
            {tasks.map((task, idx) => (
              <Card key={task.id || idx} style={{ marginVertical: 4 }}>
                <Card.Content>
                  <Text variant="bodyLarge">{task.title || 'Untitled Task'}</Text>
                  <Text variant="bodySmall">{task.description || ''}</Text>
                  <Text variant="labelSmall">Status: {task.status || 'N/A'}</Text>
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { marginBottom: 16 },
});

export default Tasks; 
