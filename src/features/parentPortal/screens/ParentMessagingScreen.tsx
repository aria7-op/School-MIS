import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../../../theme';
import MessageThread from '../components/MessageThread';

const { width } = Dimensions.get('window');

interface ParentMessagingScreenProps {
  parentData?: any;
  onRefresh?: () => void;
}

const ParentMessagingScreen: React.FC<ParentMessagingScreenProps> = ({ 
  parentData, 
  onRefresh 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = async () => {
    setRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setRefreshing(false);
  };

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudent(studentId);
  };

  const handleContactSelect = (contactId: string) => {
    setSelectedContact(contactId);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    
    // Here you would typically send the message to your backend
    Alert.alert('Success', 'Message sent successfully!');
    setMessageText('');
  };

  // Mock data for demonstration
  const mockParentData = {
    students: [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        grade: '10th Grade',
        class: 'Class A',
        status: 'Active'
      }
    ]
  };

  const data = parentData || mockParentData;

  // Mock contacts data
  const mockContacts = [
    {
      id: '1',
      name: 'Mrs. Sarah Johnson',
      role: 'Class Teacher',
      subject: 'Mathematics',
      avatar: 'SJ',
      lastMessage: 'John has been doing great in class!',
      lastMessageTime: '2 hours ago',
      unreadCount: 2
    },
    {
      id: '2',
      name: 'Mr. David Wilson',
      role: 'Science Teacher',
      subject: 'Physics',
      avatar: 'DW',
      lastMessage: 'Please check the homework assignment',
      lastMessageTime: '1 day ago',
      unreadCount: 0
    },
    {
      id: '3',
      name: 'Ms. Emily Brown',
      role: 'School Counselor',
      subject: 'Guidance',
      avatar: 'EB',
      lastMessage: 'Let\'s schedule a meeting next week',
      lastMessageTime: '3 days ago',
      unreadCount: 1
    },
    {
      id: '4',
      name: 'Principal Office',
      role: 'Administration',
      subject: 'General',
      avatar: 'PO',
      lastMessage: 'School event reminder for next Friday',
      lastMessageTime: '1 week ago',
      unreadCount: 0
    }
  ];

  const filteredContacts = mockContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>School Communication</Text>
        <Text style={styles.headerSubtitle}>Stay connected with teachers and staff</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Student Selection */}
        <View style={styles.studentSelector}>
          <Text style={styles.sectionTitle}>Select Student</Text>
          {data.students.map((student: any) => (
            <TouchableOpacity
              key={student.id}
              style={[
                styles.studentCard,
                selectedStudent === student.id && styles.selectedStudentCard
              ]}
              onPress={() => handleStudentSelect(student.id)}
            >
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>
                  {student.firstName} {student.lastName}
                </Text>
                <Text style={styles.studentDetails}>
                  {student.grade} • {student.class}
                </Text>
                <Text style={styles.studentStatus}>{student.status}</Text>
              </View>
              {selectedStudent === student.id && (
                <View style={styles.selectedIndicator}>
                  <Text style={styles.selectedIndicatorText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Search Contacts */}
        {selectedStudent && (
          <View style={styles.searchSection}>
            <Text style={styles.sectionTitle}>Search Contacts</Text>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search teachers, staff, or subjects..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
          </View>
        )}

        {/* Contacts List */}
        {selectedStudent && (
          <View style={styles.contactsSection}>
            <Text style={styles.sectionTitle}>School Contacts</Text>
            {filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={[
                  styles.contactCard,
                  selectedContact === contact.id && styles.selectedContactCard
                ]}
                onPress={() => handleContactSelect(contact.id)}
              >
                <View style={styles.contactAvatar}>
                  <Text style={styles.avatarText}>{contact.avatar}</Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactRole}>{contact.role}</Text>
                  <Text style={styles.contactSubject}>{contact.subject}</Text>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {contact.lastMessage}
                  </Text>
                  <Text style={styles.lastMessageTime}>{contact.lastMessageTime}</Text>
                </View>
                {contact.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{contact.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Message Thread */}
        {selectedStudent && selectedContact && (
          <View style={styles.messageThreadSection}>
            <Text style={styles.sectionTitle}>Messages</Text>
            <MessageThread
              student={data.students.find((s: any) => s.id === selectedStudent)}
              contact={mockContacts.find((c: any) => c.id === selectedContact)}
              parentData={data}
            />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>📞</Text>
              <Text style={styles.quickActionText}>Call School</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>📧</Text>
              <Text style={styles.quickActionText}>Email</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>📅</Text>
              <Text style={styles.quickActionText}>Schedule Meeting</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionCard}>
              <Text style={styles.quickActionIcon}>📋</Text>
              <Text style={styles.quickActionText}>Request Report</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Message Input */}
      {selectedStudent && selectedContact && (
        <View style={styles.messageInputContainer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type your message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            placeholderTextColor={theme.colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scrollView: {
    flex: 1,
  },
  studentSelector: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: theme.colors.text,
  },
  studentCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedStudentCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: theme.colors.text,
  },
  studentDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  studentStatus: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '500',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchSection: {
    padding: 20,
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    padding: 15,
    fontSize: 16,
    color: theme.colors.text,
  },
  contactsSection: {
    padding: 20,
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedContactCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  contactAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 3,
    color: theme.colors.text,
  },
  contactRole: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 2,
    fontWeight: '500',
  },
  contactSubject: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 3,
  },
  lastMessageTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageThreadSection: {
    padding: 20,
  },
  quickActionsSection: {
    padding: 20,
    paddingBottom: 40,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  messageInputContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  messageInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 16,
    color: theme.colors.text,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ParentMessagingScreen; 