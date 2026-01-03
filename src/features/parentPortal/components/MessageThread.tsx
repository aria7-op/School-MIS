import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { theme } from '../../../theme';

const { width } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  sender: 'parent' | 'contact';
  timestamp: Date;
  isRead: boolean;
}

interface MessageThreadProps {
  student: any;
  contact: any;
  parentData: any;
}

const MessageThread: React.FC<MessageThreadProps> = ({ 
  student, 
  contact, 
  parentData 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock messages for demonstration
  useEffect(() => {
    const mockMessages: Message[] = [
      {
        id: '1',
        text: `Hi ${contact.name}, I wanted to check on ${student.firstName}'s progress in ${contact.subject}.`,
        sender: 'parent',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
      },
      {
        id: '2',
        text: `${student.firstName} has been doing great in class! They're very engaged and participate actively.`,
        sender: 'contact',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), // 23 hours ago
        isRead: true,
      },
      {
        id: '3',
        text: 'That\'s wonderful to hear! Is there anything specific I should focus on at home?',
        sender: 'parent',
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000), // 22 hours ago
        isRead: true,
      },
      {
        id: '4',
        text: 'I would recommend practicing the homework problems we discussed. ${student.firstName} sometimes struggles with the more complex equations.',
        sender: 'contact',
        timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000), // 21 hours ago
        isRead: true,
      },
      {
        id: '5',
        text: 'Thank you for the feedback. I\'ll make sure we practice those equations together.',
        sender: 'parent',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago
        isRead: false,
      },
    ];
    setMessages(mockMessages);
  }, [student, contact]);

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const renderMessage = (message: Message) => {
    const isParent = message.sender === 'parent';
    
    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isParent ? styles.parentMessage : styles.contactMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isParent ? styles.parentBubble : styles.contactBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isParent ? styles.parentText : styles.contactText,
            ]}
          >
            {message.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={styles.timestamp}>
              {formatTime(message.timestamp)}
            </Text>
            {isParent && (
              <View style={styles.readStatus}>
                <Text style={styles.readStatusText}>
                  {message.isRead ? '✓✓' : '✓'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  if (!student || !contact) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          Please select a student and contact to view messages
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Thread Header */}
      <View style={styles.threadHeader}>
        <View style={styles.contactInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {contact.avatar}
            </Text>
          </View>
          <View style={styles.contactDetails}>
            <Text style={styles.contactName}>{contact.name}</Text>
            <Text style={styles.contactRole}>
              {contact.role} • {contact.subject}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Text style={styles.callButtonText}>📞</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView 
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length > 0 ? (
          messages.map(renderMessage)
        ) : (
          <View style={styles.emptyMessages}>
            <Text style={styles.emptyMessagesText}>
              No messages yet. Start a conversation!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  contactRole: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  callButton: {
    padding: 8,
  },
  callButtonText: {
    fontSize: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    marginBottom: 15,
    flexDirection: 'row',
  },
  parentMessage: {
    justifyContent: 'flex-end',
  },
  contactMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: 12,
    borderRadius: 18,
  },
  parentBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 6,
  },
  contactBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  parentText: {
    color: 'white',
  },
  contactText: {
    color: theme.colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  timestamp: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  readStatus: {
    marginLeft: 8,
  },
  readStatusText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default MessageThread; 