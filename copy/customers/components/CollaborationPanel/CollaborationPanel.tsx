import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import useCustomerCollaborations from '../../hooks/useCustomerCollaborations';

const customerId = 'demo-customer-id'; // TODO: Replace with real customer ID

const CollaborationPanel: React.FC = () => {
  const { loading, error, collaborations = [], getCustomerCollaborations } = useCustomerCollaborations(customerId);

  useEffect(() => {
    getCustomerCollaborations();
  }, [getCustomerCollaborations]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Collaboration Panel</Text>
          {loading && <ActivityIndicator animating size="small" />}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {!loading && !error && collaborations.length === 0 && (
            <Text>No collaborations found for this customer.</Text>
          )}
          <ScrollView>
            {collaborations.map((collab, idx) => (
              <Card key={collab.id || idx} style={{ marginVertical: 4 }}>
                <Card.Content>
                  <Text variant="bodyLarge">{collab.title || 'Untitled Collaboration'}</Text>
                  <Text variant="bodySmall">{collab.content || ''}</Text>
                  <Text variant="labelSmall">Type: {collab.type || 'N/A'}</Text>
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

export default CollaborationPanel; 
