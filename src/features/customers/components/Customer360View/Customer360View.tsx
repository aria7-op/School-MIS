import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SegmentedButtons, Card, Text, ActivityIndicator } from 'react-native-paper';
import useCustomerApi from '../../hooks/useCustomerApi';

const TABS = [
  { value: 'timeline', label: 'Timeline' },
  { value: 'details', label: 'Details' },
  { value: 'documents', label: 'Documents' },
  { value: 'tickets', label: 'Tickets' },
  { value: 'tasks', label: 'Tasks' },
  { value: 'interactions', label: 'Interactions' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'automations', label: 'Automations' },
  { value: 'collaboration', label: 'Collaboration' },
];

const customerId = 'demo-customer-id'; // TODO: Replace with real customer ID

const Customer360View: React.FC = () => {
  const [activeTab, setActiveTab] = useState('timeline');
  const { loading, error, customer, getCustomerById } = useCustomerApi();

  useEffect(() => {
    getCustomerById(customerId);
  }, [getCustomerById]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'timeline':
        return <Card style={styles.card}><Card.Content><Text>Timeline (all interactions, activities, notes, etc.)</Text></Card.Content></Card>;
      case 'details':
        return <Card style={styles.card}><Card.Content><Text>Customer Details (profile, contact, segmentation, etc.)</Text></Card.Content></Card>;
      case 'documents':
        return <Card style={styles.card}><Card.Content><Text>Documents (contracts, proposals, invoices, etc.)</Text></Card.Content></Card>;
      case 'tickets':
        return <Card style={styles.card}><Card.Content><Text>Support Tickets (open, closed, SLA, etc.)</Text></Card.Content></Card>;
      case 'tasks':
        return <Card style={styles.card}><Card.Content><Text>Tasks & Reminders (follow-ups, assignments, etc.)</Text></Card.Content></Card>;
      case 'interactions':
        return <Card style={styles.card}><Card.Content><Text>Interactions (calls, emails, meetings, WhatsApp, etc.)</Text></Card.Content></Card>;
      case 'analytics':
        return <Card style={styles.card}><Card.Content><Text>Analytics & Insights (charts, KPIs, trends, etc.)</Text></Card.Content></Card>;
      case 'automations':
        return <Card style={styles.card}><Card.Content><Text>Automations & Workflows (drip, reminders, triggers, etc.)</Text></Card.Content></Card>;
      case 'collaboration':
        return <Card style={styles.card}><Card.Content><Text>Collaboration (comments, mentions, notifications, etc.)</Text></Card.Content></Card>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge">Customer 360 View</Text>
          {loading && <ActivityIndicator animating size="small" />}
          {error && <Text style={{ color: 'red' }}>{error}</Text>}
          {!loading && !error && !customer && (
            <Text>No customer data found.</Text>
          )}
          {customer && (
            <View>
              <Text variant="bodyLarge">Name: {customer.name || 'N/A'}</Text>
              <Text variant="bodySmall">Email: {customer.email || 'N/A'}</Text>
              <Text variant="bodySmall">Phone: {customer.phone || 'N/A'}</Text>
              {/* Add more fields as needed */}
            </View>
          )}
        </Card.Content>
      </Card>
      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={TABS}
        style={styles.segmentedButtons}
      />
      <ScrollView style={styles.content}>{renderTabContent()}</ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  segmentedButtons: { margin: 16 },
  content: { flex: 1, padding: 16 },
  card: { marginBottom: 16 },
});

export default Customer360View; 
