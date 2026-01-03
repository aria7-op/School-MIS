export interface User {
  id: string;
  name: string;
  avatar?: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  class?: string; // Only for students
  department?: string; // For staff
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
  recordedBy: string;
  recordedAt: Date;
}

export interface Class {
  id: string;
  name: string;
  teacherId: string;
  schedule: string;
  room: string;
}

// Static data
export const classes: Class[] = [
  {
    id: 'class-1',
    name: 'Mathematics 101',
    teacherId: 'teacher-1',
    schedule: 'Mon/Wed/Fri 9:00-10:30',
    room: 'Room 301',
  },
  {
    id: 'class-2',
    name: 'Physics 201',
    teacherId: 'teacher-2',
    schedule: 'Tue/Thu 11:00-12:30',
    room: 'Room 205',
  },
  {
    id: 'class-3',
    name: 'Computer Science 301',
    teacherId: 'teacher-3',
    schedule: 'Mon/Wed 14:00-15:30',
    room: 'Room 412',
  },
];

export const users: User[] = [
  // Teachers
  {
    id: 'teacher-1',
    name: 'Dr. Sarah Johnson',
    email: 's.johnson@university.edu',
    role: 'teacher',
    department: 'Mathematics',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    id: 'teacher-2',
    name: 'Prof. Michael Chen',
    email: 'm.chen@university.edu',
    role: 'teacher',
    department: 'Physics',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    id: 'teacher-3',
    name: 'Dr. Emily Wilson',
    email: 'e.wilson@university.edu',
    role: 'teacher',
    department: 'Computer Science',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  
  // Students
  {
    id: 'student-1',
    name: 'Alex Rodriguez',
    email: 'a.rodriguez@university.edu',
    role: 'student',
    class: 'class-1',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
  },
  {
    id: 'student-2',
    name: 'Jamie Smith',
    email: 'j.smith@university.edu',
    role: 'student',
    class: 'class-1',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
  },
  {
    id: 'student-3',
    name: 'Taylor Brown',
    email: 't.brown@university.edu',
    role: 'student',
    class: 'class-2',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
  },
  {
    id: 'student-4',
    name: 'Jordan Lee',
    email: 'j.lee@university.edu',
    role: 'student',
    class: 'class-2',
    avatar: 'https://randomuser.me/api/portraits/women/55.jpg',
  },
  {
    id: 'student-5',
    name: 'Casey Kim',
    email: 'c.kim@university.edu',
    role: 'student',
    class: 'class-3',
    avatar: 'https://randomuser.me/api/portraits/women/25.jpg',
  },
];

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'record-1',
    userId: 'student-1',
    date: '2023-05-01',
    status: 'present',
    recordedBy: 'teacher-1',
    recordedAt: new Date('2023-05-01T09:05:00'),
  },
  {
    id: 'record-2',
    userId: 'student-2',
    date: '2023-05-01',
    status: 'late',
    notes: 'Arrived at 9:15',
    recordedBy: 'teacher-1',
    recordedAt: new Date('2023-05-01T09:15:00'),
  },
  // Add more records as needed
];
