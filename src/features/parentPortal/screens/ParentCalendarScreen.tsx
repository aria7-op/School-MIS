import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../theme';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'assignment' | 'event' | 'meeting';
  description?: string;
  studentId?: string;
}

const ParentCalendarScreen: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for calendar events
  const mockEvents: CalendarEvent[] = [
    {
      id: '1',
      title: 'Math Exam',
      date: '2024-01-15',
      type: 'exam',
      description: 'Chapter 5-7 Mathematics',
      studentId: 'student1'
    },
    {
      id: '2',
      title: 'Science Assignment Due',
      date: '2024-01-18',
      type: 'assignment',
      description: 'Lab Report Submission',
      studentId: 'student1'
    },
    {
      id: '3',
      title: 'Parent-Teacher Meeting',
      date: '2024-01-20',
      type: 'meeting',
      description: 'Quarterly Progress Review',
      studentId: 'student1'
    },
    {
      id: '4',
      title: 'School Sports Day',
      date: '2024-01-25',
      type: 'event',
      description: 'Annual Sports Competition',
      studentId: 'student1'
    }
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await apiService.getParentCalendarEvents(user?.id);
      // setEvents(response.data);
      
      // For now, use mock data
      setEvents(mockEvents);
    } catch (error) {
      console.error('Error loading calendar events:', error);
      Alert.alert('Error', 'Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return 'document-text';
      case 'assignment':
        return 'book';
      case 'event':
        return 'calendar';
      case 'meeting':
        return 'people';
      default:
        return 'information-circle';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'exam':
        return '#e74c3c';
      case 'assignment':
        return '#f39c12';
      case 'event':
        return '#3498db';
      case 'meeting':
        return '#9b59b6';
      default:
        return '#95a5a6';
    }
  };

  const getMarkedDates = () => {
    const marked: any = {};
    events.forEach(event => {
      marked[event.date] = {
        marked: true,
        dotColor: getEventTypeColor(event.type),
        textColor: '#000'
      };
    });
    return marked;
  };

  const getEventsForSelectedDate = (date: string) => {
    return events.filter(event => event.date === date);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const renderEventItem = (event: CalendarEvent) => (
    <TouchableOpacity
      key={event.id}
      style={[styles.eventItem, { borderLeftColor: getEventTypeColor(event.type) }]}
      onPress={() => Alert.alert(event.title, event.description || 'No description available')}
    >
      <View style={styles.eventHeader}>
        <Ionicons
          name={getEventTypeIcon(event.type) as any}
          size={20}
          color={getEventTypeColor(event.type)}
        />
        <Text style={styles.eventTitle}>{event.title}</Text>
        <View style={[styles.eventTypeBadge, { backgroundColor: getEventTypeColor(event.type) }]}>
          <Text style={styles.eventTypeText}>{event.type.toUpperCase()}</Text>
        </View>
      </View>
      {event.description && (
        <Text style={styles.eventDescription}>{event.description}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
        <Text style={styles.headerSubtitle}>Stay updated with important dates</Text>
      </View>

      <Calendar
        current={selectedDate}
        onDayPress={(day) => handleDateSelect(day.dateString)}
        markedDates={getMarkedDates()}
        markingType="dot"
        theme={{
          calendarBackground: theme.colors.white,
          textSectionTitleColor: theme.colors.primary,
          selectedDayBackgroundColor: theme.colors.primary,
          selectedDayTextColor: theme.colors.white,
          todayTextColor: theme.colors.primary,
          dayTextColor: theme.colors.text,
          textDisabledColor: theme.colors.gray,
          dotColor: theme.colors.primary,
          selectedDotColor: theme.colors.white,
          arrowColor: theme.colors.primary,
          monthTextColor: theme.colors.primary,
          indicatorColor: theme.colors.primary,
          textDayFontWeight: '300',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '300',
          textDayFontSize: 16,
          textMonthFontSize: 16,
          textDayHeaderFontSize: 13
        }}
      />

      <View style={styles.eventsSection}>
        <Text style={styles.eventsSectionTitle}>
          Events for {new Date(selectedDate).toLocaleDateString()}
        </Text>
        
        <ScrollView
          style={styles.eventsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {getEventsForSelectedDate(selectedDate).length > 0 ? (
            getEventsForSelectedDate(selectedDate).map(renderEventItem)
          ) : (
            <View style={styles.noEventsContainer}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.gray} />
              <Text style={styles.noEventsText}>No events for this date</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.8,
  },
  eventsSection: {
    flex: 1,
    padding: 20,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 15,
  },
  eventsList: {
    flex: 1,
  },
  eventItem: {
    backgroundColor: theme.colors.white,
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
    marginLeft: 10,
  },
  eventTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventTypeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  eventDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  noEventsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 16,
    color: theme.colors.gray,
    marginTop: 10,
  },
});

export default ParentCalendarScreen; 