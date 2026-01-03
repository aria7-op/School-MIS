import { StatItem, QuickAction, Activity, Exam, CalendarEvent } from '../types/dashboard';

  export const statsData: StatItem[] = [
    { title: 'Total Students', value: '1,245', icon: 'account-multiple', color: '#4CAF50' },
    { title: 'Active Staff', value: '84', icon: 'account-tie', color: '#2196F3' },
    { title: 'Courses', value: '32', icon: 'book-open', color: '#9C27B0' },
    { title: 'Upcoming Events', value: '5', icon: 'calendar', color: '#FF9800' },
  ];

export const quickActions: QuickAction[] = [
  { title: 'Add Student', icon: 'account-plus', screen: 'AddStudent' },
  { title: 'Schedule Class', icon: 'calendar-plus', screen: 'ScheduleClass' },
  { title: 'Send Notice', icon: 'email-send', screen: 'SendNotice' },
  { title: 'Generate Report', icon: 'file-chart', screen: 'GenerateReport' },
];

export const recentActivities: Activity[] = [
  { id: 1, title: 'New student enrolled', time: '10 mins ago', icon: 'account' },
  { id: 2, title: 'Staff meeting scheduled', time: '1 hour ago', icon: 'calendar' },
  { id: 3, title: 'Exam results published', time: '3 hours ago', icon: 'clipboard-check' },
  { id: 4, title: 'System update completed', time: '1 day ago', icon: 'update' },
];

export const upcomingExams: Exam[] = [
  { id: 1, course: 'Mathematics', date: 'May 20', time: '9:00 AM', room: 'A-101' },
  { id: 2, course: 'Physics', date: 'May 22', time: '11:00 AM', room: 'B-205' },
  { id: 3, course: 'Chemistry', date: 'May 25', time: '2:00 PM', room: 'C-301' },
];

export const calendarEvents: CalendarEvent[] = [
  { id: 1, title: 'Faculty Meeting', date: '2023-05-18', type: 'event' },
  { id: 2, title: 'Midterm Exams', date: '2023-05-20', type: 'exam' },
  { id: 3, title: 'Spring Break', date: '2023-05-24', type: 'holiday' },
];
