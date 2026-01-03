import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import useCustomerAutomations from '../../hooks/useCustomerAutomations';

const customerId = 'demo-customer-id'; // TODO: Replace with real customer ID

const AutomationCenter: React.FC = () => {
  const { loading, error, automations = [], getCustomerAutomations } = useCustomerAutomations(customerId);

  useEffect(() => {
    getCustomerAutomations();
  }, [getCustomerAutomations]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Automation Center</Text>
          {loading && <ActivityIndicator animating size="small" />}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {!loading && !error && automations.length === 0 && (
            <Text>No automations found for this customer.</Text>
          )}
          <ScrollView>
            {automations.map((automation, idx) => (
              <Card key={automation.id || idx} style={{ marginVertical: 4 }}>
                <Card.Content>
                  <Text variant="bodyLarge">{automation.name || 'Untitled Automation'}</Text>
                  <Text variant="bodySmall">{automation.description || ''}</Text>
                  <Text variant="labelSmall">Status: {automation.status || 'N/A'}</Text>
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

export default AutomationCenter; 
