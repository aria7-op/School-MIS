import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  from: string;
  to: string;
  subject: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  type: 'message' | 'announcement' | 'notification';
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

interface CommunicationCenterProps {
  studentId: string;
  studentName: string;
}

const CommunicationCenter: React.FC<CommunicationCenterProps> = ({
  studentId,
  studentName,
}) => {
  const [activeTab, setActiveTab] = useState<'messages' | 'announcements' | 'notifications'>('messages');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  // Mock data - replace with actual API calls
  const messages: Message[] = [
    {
      id: '1',
      from: 'Mrs. Johnson',
      to: 'Parent',
      subject: 'Student Performance Update',
      content: 'Your child has shown excellent progress in Mathematics this week. Keep up the great work!',
      timestamp: new Date('2024-01-15T10:30:00'),
      isRead: false,
      type: 'message',
    },
    {
      id: '2',
      from: 'School Admin',
      to: 'Parent',
      subject: 'Parent-Teacher Meeting Reminder',
      content: 'Reminder: Parent-Teacher meeting scheduled for next Friday at 3:00 PM.',
      timestamp: new Date('2024-01-14T14:15:00'),
      isRead: true,
      type: 'message',
    },
    {
      id: '3',
      from: 'Mr. Davis',
      to: 'Parent',
      subject: 'Homework Assignment',
      content: 'Please ensure your child completes the science project due next Monday.',
      timestamp: new Date('2024-01-13T09:45:00'),
      isRead: true,
      type: 'message',
    },
  ];

  const announcements: Announcement[] = [
    {
      id: '1',
      title: 'School Holiday Notice',
      content: 'School will be closed on Monday, January 22nd for Martin Luther King Jr. Day.',
      author: 'Principal Smith',
      timestamp: new Date('2024-01-15T08:00:00'),
      priority: 'high',
      category: 'General',
    },
    {
      id: '2',
      title: 'Sports Day Event',
      content: 'Annual Sports Day will be held on Friday, January 26th. All parents are welcome to attend.',
      author: 'Physical Education Department',
      timestamp: new Date('2024-01-14T16:30:00'),
      priority: 'medium',
      category: 'Events',
    },
    {
      id: '3',
      title: 'Library Week',
      content: 'This week is Library Week. Students are encouraged to visit the library and participate in reading activities.',
      author: 'Library Staff',
      timestamp: new Date('2024-01-13T11:20:00'),
      priority: 'low',
      category: 'Academic',
    },
  ];

  const notifications = [
    {
      id: '1',
      title: 'Grade Updated',
      content: 'New grade posted for Mathematics assignment',
      timestamp: new Date('2024-01-15T12:00:00'),
      isRead: false,
    },
    {
      id: '2',
      title: 'Attendance Alert',
      content: 'Absence recorded for yesterday',
      timestamp: new Date('2024-01-14T08:30:00'),
      isRead: true,
    },
    {
      id: '3',
      title: 'Fee Due Reminder',
      content: 'Monthly fee payment due in 3 days',
      timestamp: new Date('2024-01-13T15:45:00'),
      isRead: false,
    },
  ];

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      case 'low':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getPriorityIcon = (priority: string): string => {
    switch (priority) {
      case 'high':
        return 'alert-circle';
      case 'medium':
        return 'information-circle';
      case 'low':
        return 'checkmark-circle';
      default:
        return 'ellipse';
    }
  };

  const handleSendReply = () => {
    if (replyText.trim()) {
      Alert.alert('Reply Sent', 'Your reply has been sent successfully.');
      setReplyText('');
      setSelectedMessage(null);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={[styles.messageItem, !item.isRead && styles.unreadMessage]}
      onPress={() => setSelectedMessage(item)}
    >
      <View style={styles.messageHeader}>
        <View style={styles.messageInfo}>
          <Text style={styles.messageFrom}>{item.from}</Text>
          <Text style={styles.messageSubject}>{item.subject}</Text>
        </View>
        <View style={styles.messageMeta}>
          <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
          <Text style={styles.messageDate}>{formatDate(item.timestamp)}</Text>
        </View>
      </View>
      <Text style={styles.messagePreview} numberOfLines={2}>
        {item.content}
      </Text>
      {!item.isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <View style={styles.announcementItem}>
      <View style={styles.announcementHeader}>
        <View style={styles.announcementInfo}>
          <Text style={styles.announcementTitle}>{item.title}</Text>
          <Text style={styles.announcementAuthor}>by {item.author}</Text>
        </View>
        <View style={styles.priorityBadge}>
          <Ionicons
            name={getPriorityIcon(item.priority) as any}
            size={16}
            color={getPriorityColor(item.priority)}
          />
          <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
            {item.priority.toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.announcementContent}>{item.content}</Text>
      <View style={styles.announcementFooter}>
        <Text style={styles.announcementCategory}>{item.category}</Text>
        <Text style={styles.announcementTime}>
          {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );

  const renderNotificationItem = ({ item }: { item: any }) => (
    <View style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationText}>{item.content}</Text>
        <Text style={styles.notificationTime}>
          {formatDate(item.timestamp)} at {formatTime(item.timestamp)}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadIndicator} />}
    </View>
  );

  const renderMessageDetail = () => (
    <View style={styles.messageDetail}>
      <View style={styles.messageDetailHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedMessage(null)}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.messageDetailTitle}>Message Detail</Text>
      </View>
      
      <View style={styles.messageDetailContent}>
        <View style={styles.messageDetailMeta}>
          <Text style={styles.messageDetailFrom}>From: {selectedMessage?.from}</Text>
          <Text style={styles.messageDetailSubject}>Subject: {selectedMessage?.subject}</Text>
          <Text style={styles.messageDetailTime}>
            {selectedMessage?.timestamp && formatDate(selectedMessage.timestamp)} at{' '}
            {selectedMessage?.timestamp && formatTime(selectedMessage.timestamp)}
          </Text>
        </View>
        
        <Text style={styles.messageDetailBody}>{selectedMessage?.content}</Text>
        
        <View style={styles.replySection}>
          <Text style={styles.replyLabel}>Reply:</Text>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
            numberOfLines={4}
          />
          <TouchableOpacity
            style={[styles.sendButton, !replyText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendReply}
            disabled={!replyText.trim()}
          >
            <Ionicons name="send" size={20} color="white" />
            <Text style={styles.sendButtonText}>Send Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (selectedMessage) {
    return renderMessageDetail();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Communication Center</Text>
        <Text style={styles.subtitle}>Stay connected with {studentName}'s education</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages, announcements..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons
            name="mail"
            size={20}
            color={activeTab === 'messages' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
            Messages ({messages.filter(m => !m.isRead).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'announcements' && styles.activeTab]}
          onPress={() => setActiveTab('announcements')}
        >
          <Ionicons
            name="megaphone"
            size={20}
            color={activeTab === 'announcements' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'announcements' && styles.activeTabText]}>
            Announcements
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={activeTab === 'notifications' ? '#3b82f6' : '#6b7280'}
          />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
            Notifications ({notifications.filter(n => !n.isRead).length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'messages' && (
          <FlatList
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
        
        {activeTab === 'announcements' && (
          <FlatList
            data={announcements}
            renderItem={renderAnnouncementItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
        
        {activeTab === 'notifications' && (
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#3b82f6',
  },
  content: {
    flex: 1,
    margin: 20,
    marginTop: 16,
  },
  separator: {
    height: 12,
  },
  messageItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageInfo: {
    flex: 1,
    marginRight: 12,
  },
  messageFrom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  messageSubject: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  messageMeta: {
    alignItems: 'flex-end',
  },
  messageTime: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  messageDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messagePreview: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  announcementItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  announcementInfo: {
    flex: 1,
    marginRight: 12,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  announcementAuthor: {
    fontSize: 14,
    color: '#6b7280',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  announcementContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  announcementCategory: {
    fontSize: 12,
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  announcementTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  notificationItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    backgroundColor: '#f8fafc',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  messageDetail: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  messageDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginRight: 16,
  },
  messageDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  messageDetailContent: {
    flex: 1,
    padding: 20,
  },
  messageDetailMeta: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageDetailFrom: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  messageDetailSubject: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  messageDetailTime: {
    fontSize: 14,
    color: '#6b7280',
  },
  messageDetailBody: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  replySection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  replyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  replyInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    marginBottom: 16,
    minHeight: 100,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CommunicationCenter; 