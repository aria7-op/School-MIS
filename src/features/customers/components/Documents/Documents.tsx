import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import useCustomerDocuments from '../../hooks/useCustomerDocuments';

const customerId = 'demo-customer-id'; // TODO: Replace with real customer ID

const Documents: React.FC = () => {
  const { loading, error, documents = [], getCustomerDocuments } = useCustomerDocuments(customerId);

  useEffect(() => {
    getCustomerDocuments();
  }, [getCustomerDocuments]);

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Documents</Text>
          {loading && <ActivityIndicator animating size="small" />}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {!loading && !error && documents.length === 0 && (
            <Text>No documents found for this customer.</Text>
          )}
          <ScrollView>
            {documents.map((doc, idx) => (
              <Card key={doc.id || idx} style={{ marginVertical: 4 }}>
                <Card.Content>
                  <Text variant="bodyLarge">{doc.title || 'Untitled Document'}</Text>
                  <Text variant="bodySmall">{doc.description || ''}</Text>
                  <Text variant="labelSmall">Type: {doc.type || 'N/A'}</Text>
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

export default Documents; 
