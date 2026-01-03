import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import useCustomerTickets from '../../hooks/useCustomerTickets';

const customerId = 'demo-customer-id'; // TODO: Replace with real customer ID

const SupportTickets: React.FC = () => {
  const { loading, error, tickets = [], getCustomerTickets } = useCustomerTickets(customerId);

  useEffect(() => {
    getCustomerTickets();
  }, [getCustomerTickets]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Support Tickets</Text>
          {loading && <ActivityIndicator animating size="small" />}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {!loading && !error && tickets.length === 0 && (
            <Text>No tickets found for this customer.</Text>
          )}
          <ScrollView>
            {tickets.map((ticket, idx) => (
              <Card key={ticket.id || idx} style={{ marginVertical: 4 }}>
                <Card.Content>
                  <Text variant="bodyLarge">{ticket.title || 'Untitled Ticket'}</Text>
                  <Text variant="bodySmall">{ticket.description || ''}</Text>
                  <Text variant="labelSmall">Status: {ticket.status || 'N/A'}</Text>
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

export default SupportTickets; 
