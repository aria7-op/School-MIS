// Dashboard types
export interface StatItem {
  title: string;
  value: string;
  icon: string;
  color: string;
}

export interface QuickAction {
  title: string;
  icon: string;
  screen: string;
}

export interface Activity {
  id: number;
  title: string;
  time: string;
  icon: string;
}

export interface Exam {
  id: number;
  course: string;
  date: string;
  time: string;
  room: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: 'event' | 'exam' | 'holiday';
}