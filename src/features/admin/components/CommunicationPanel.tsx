import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CommunicationPanelProps {
  data?: any;
  loading?: boolean;
  error?: string | null;
}

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', size = 'medium', icon, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      mode === 'outlined' && styles.buttonOutlined,
      size === 'small' && styles.buttonSmall,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    {icon && <MaterialIcons name={icon} size={16} color={mode === 'contained' ? '#fff' : '#007AFF'} style={styles.buttonIcon} />}
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
      size === 'small' && styles.buttonTextSmall,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const IconButton = ({ icon, size = 24, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={size} color="#666" />
  </TouchableOpacity>
);

const Chip = ({ children, mode = 'outlined', textStyle, style, ...props }: any) => (
  <View
    style={[
      styles.chip,
      mode === 'outlined' && styles.chipOutlined,
      mode === 'flat' && styles.chipFlat,
      style,
    ]}
    {...props}
  >
    <Text style={[
      styles.chipText,
      textStyle,
      mode === 'flat' && styles.chipTextFlat,
    ]}>
      {children}
    </Text>
  </View>
);

const Searchbar = ({ placeholder, style, ...props }: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const CommunicationPanel: React.FC<CommunicationPanelProps> = ({
  data,
  loading = false,
  error = null,
}) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading communication data...</Text>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text style={styles.errorText}>Error: {error}</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <CardContent>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>
                Communication
              </Text>
              <Text style={styles.subtitle}>
                Manage announcements, messages, and notifications
              </Text>
            </View>
            <View style={styles.headerRight}>
              <IconButton
                icon="search"
                size={24}
                onPress={() => setSearchVisible(!searchVisible)}
              />
              <IconButton
                icon="add"
                size={24}
                onPress={() => {
                  // TODO: Implement add communication functionality
                  console.log('Add new communication');
                }}
              />
            </View>
          </View>
          {searchVisible && (
            <Searchbar
              placeholder="Search communications..."
              style={styles.searchBar}
            />
          )}
        </CardContent>
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="announcement" size={24} color="#007AFF" />
              <Text style={styles.statNumber}>
                {data?.totalAnnouncements || 0}
              </Text>
            </View>
            <Text style={styles.statLabel}>
              Announcements
            </Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="message" size={24} color="#9C27B0" />
              <Text style={styles.statNumber}>
                {data?.totalMessages || 0}
              </Text>
            </View>
            <Text style={styles.statLabel}>
              Messages
            </Text>
          </CardContent>
        </Card>
        <Card style={styles.statCard}>
          <CardContent>
            <View style={styles.statHeader}>
              <MaterialIcons name="notifications" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>
                {data?.totalNotifications || 0}
              </Text>
            </View>
            <Text style={styles.statLabel}>
              Notifications
            </Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.card}>
        <CardContent>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Recent Communications
            </Text>
            <Button mode="outlined" size="small" onPress={() => {
              // TODO: Implement view all communications functionality
              console.log('View all communications');
            }}>
              View All
            </Button>
          </View>
          <ScrollView style={styles.activitiesList} showsVerticalScrollIndicator={false}>
            {data?.activities?.map((activity: any, index: number) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <MaterialIcons
                    name={activity.icon as any}
                    size={20}
                    color="#007AFF"
                  />
                  <Text style={styles.activityTitle}>
                    {activity.title}
                  </Text>
                  <Chip mode="outlined" textStyle={{ fontSize: 10 }}>
                    {activity.type}
                  </Chip>
                </View>
                <Text style={styles.activityDescription}>
                  {activity.description}
                </Text>
                <Text style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleString()}
                </Text>
              </View>
            ))}
          </ScrollView>
        </CardContent>
      </Card>

      <Card style={styles.card}>
        <CardContent>
          <Text style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <View style={styles.quickActions}>
            <Button
              mode="outlined"
              icon="announcement"
              onPress={() => {
                // TODO: Implement create announcement functionality
                console.log('Create announcement');
              }}
              style={styles.actionButton}
            >
              Create Announcement
            </Button>
            <Button
              mode="outlined"
              icon="message"
              onPress={() => {
                // TODO: Implement send message functionality
                console.log('Send message');
              }}
              style={styles.actionButton}
            >
              Send Message
            </Button>
            <Button
              mode="outlined"
              icon="notifications"
              onPress={() => {
                // TODO: Implement send notification functionality
                console.log('Send notification');
              }}
              style={styles.actionButton}
            >
              Send Notification
            </Button>
            <Button
              mode="outlined"
              icon="add"
              onPress={() => {
                // TODO: Implement add communication functionality
                console.log('Add communication');
              }}
              style={styles.actionButton}
            >
              Add Communication
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
  },
  searchBar: {
    marginTop: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  activitiesList: {
    maxHeight: 300,
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 10,
    color: '#999',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
  },
  // Custom component styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: '#007AFF',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  buttonIcon: {
    marginRight: 4,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipFlat: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextFlat: {
    color: '#fff',
  },
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchbarInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
});

export default CommunicationPanel; 
