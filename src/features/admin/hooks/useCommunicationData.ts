import { useState, useEffect } from 'react';
import { CommunicationData } from '../types';

interface UseCommunicationDataReturn {
  communicationData: CommunicationData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useCommunicationData = (): UseCommunicationDataReturn => {
  const [communicationData, setCommunicationData] = useState<CommunicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCommunicationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API call
      const mockCommunicationData: CommunicationData = {
        messages: [
          {
            id: '1',
            sender: 'John Doe',
            recipient: 'All Teachers',
            subject: 'Staff Meeting Reminder',
            content: 'Reminder: Staff meeting tomorrow at 3 PM in the conference room.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            status: 'sent',
            isRead: false,
          },
          {
            id: '2',
            sender: 'Jane Smith',
            recipient: 'Admin Team',
            subject: 'System Maintenance Notice',
            content: 'System maintenance scheduled for tonight at 11 PM. Expected downtime: 2 hours.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
            status: 'sent',
            isRead: true,
          },
        ],
        notices: [
          {
            id: '1',
            title: 'Holiday Notice',
            content: 'School will be closed for winter break from December 20th to January 5th.',
            author: 'Principal',
            priority: 'high',
            publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
            expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
            targetAudience: 'all',
          },
          {
            id: '2',
            title: 'Exam Schedule Update',
            content: 'Final exams have been rescheduled. Please check the updated timetable.',
            author: 'Academic Department',
            priority: 'medium',
            publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
            expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
            targetAudience: 'students',
          },
        ],
        events: [
          {
            id: '1',
            title: 'Annual Sports Day',
            description: 'Annual sports competition for all students',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
            time: '9:00 AM',
            location: 'School Ground',
            organizer: 'Sports Department',
            status: 'upcoming',
            attendees: 500,
          },
          {
            id: '2',
            title: 'Parent-Teacher Meeting',
            description: 'Quarterly parent-teacher meeting',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
            time: '2:00 PM',
            location: 'Main Hall',
            organizer: 'Administration',
            status: 'upcoming',
            attendees: 200,
          },
        ],
        announcements: [
          {
            id: '1',
            title: 'New Library Hours',
            content: 'Library will now be open until 8 PM on weekdays.',
            type: 'general',
            priority: 'normal',
            publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
            author: 'Library Staff',
          },
          {
            id: '2',
            title: 'Cafeteria Menu Update',
            content: 'New healthy menu options available in the cafeteria.',
            type: 'general',
            priority: 'normal',
            publishDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
            author: 'Cafeteria Manager',
          },
        ],
        unreadMessages: 23,
        communicationStats: {
          totalMessages: 1250,
          totalNotices: 45,
          totalEvents: 12,
          responseRate: 85.5,
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));

      setCommunicationData(mockCommunicationData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch communication data');
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchCommunicationData();
  };

  useEffect(() => {
    fetchCommunicationData();
  }, []);

  return {
    communicationData,
    loading,
    error,
    refetch,
  };
};

export default useCommunicationData; 
