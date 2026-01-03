# Teacher Portal - Dynamic Dashboard

## Overview

The Teacher Portal provides a comprehensive dashboard for teachers to manage their classes, students, assignments, and track performance metrics. The dashboard is now **fully dynamic** and fetches real-time data from the backend APIs.

## 🚀 Key Features

### Dynamic Data Loading
- **Real-time API Integration**: All dashboard data is fetched from backend endpoints
- **Smart Caching**: Implements intelligent caching with TTL (Time To Live) for optimal performance
- **Auto-refresh**: Pull-to-refresh functionality for latest data
- **Error Handling**: Graceful error handling with retry mechanisms

### Dashboard Components
- **Overview Stats**: Total classes, students, assignments, attendance rates
- **Performance Analytics**: Charts and metrics for class performance
- **Quick Actions**: Create assignments, exams, mark attendance, grade papers
- **Recent Activities**: Real-time activity feed from the system
- **Class Overview**: Detailed view of each class with performance metrics

## 🏗️ Architecture

### Service Layer (`teacherDashboardService.ts`)
```typescript
// Handles all API communication with encryption/decryption
class TeacherDashboardService {
  async getTeacherDashboard(): Promise<TeacherDashboardData>
  async getAssignmentDashboard()
  async getTeacherClasses()
  async getTeacherStudents()
  async getAttendanceSummary()
  // ... more methods
}
```

### Hook Layer (`useTeacherDashboard.ts`)
```typescript
// React hook for state management and data fetching
export const useTeacherDashboard = (): UseTeacherDashboardReturn => {
  // State management
  // API calls
  // Cache management
  // Error handling
}
```

### Component Layer (`TeacherDashboard.tsx`)
```typescript
// Main dashboard component with real data integration
const TeacherDashboard: React.FC<TeacherDashboardProps> = () => {
  const { dashboardData, isLoading, error, refreshDashboard } = useTeacherDashboard();
  // Render dynamic content
}
```

## 🔌 API Endpoints

### Core Dashboard Data
- `GET /api/assignments/dashboard` - Assignment overview and statistics
- `GET /api/classes?teacherId=me` - Teacher's assigned classes
- `GET /api/students?teacherId=me` - Students taught by teacher
- `GET /api/attendances/summary?teacherId=me` - Attendance summary

### Class Management
- `GET /api/classes/:id/analytics` - Class performance analytics
- `GET /api/classes/:id/students` - Students in specific class
- `GET /api/classes/:id/attendances` - Class attendance records

### Assignment Management
- `GET /api/assignments?teacherId=me` - Teacher's assignments
- `GET /api/assignments/submissions?status=submitted` - Pending submissions
- `POST /api/assignments` - Create new assignment

### Attendance Management
- `GET /api/attendances/analytics?teacherId=me` - Attendance trends
- `GET /api/attendances/monthly-matrix` - Monthly attendance matrix

## 🔐 Security & Encryption

### Encryption Pattern
The service follows the same encryption pattern as the students feature:

1. **Request Encryption**: Data is encrypted using AES encryption before sending
2. **Response Decryption**: Backend responses are automatically decrypted
3. **Token Management**: JWT tokens are handled securely
4. **Permission Checks**: Role-based access control (RBAC) enforcement

### Implementation
```typescript
// Uses secureApiService for all API calls
import secureApiService from '../../../services/secureApiService';

// Automatic encryption/decryption
const response = await secureApiService.get('/assignments/dashboard');
```

## 📊 Data Flow

### 1. Initial Load
```
Component Mount → Hook Initialization → API Calls → Data Processing → State Update → UI Render
```

### 2. Data Refresh
```
User Pull-to-Refresh → Hook Refresh → Cache Invalidation → New API Calls → UI Update
```

### 3. Cache Management
```
Data Request → Check Cache → If Valid: Return Cached → If Invalid: Fetch New → Update Cache
```

## 🎯 Performance Optimizations

### Caching Strategy
- **Dashboard Data**: 15 minutes TTL
- **Class Data**: 30 minutes TTL
- **Student Data**: 30 minutes TTL
- **Assignment Data**: 15 minutes TTL

### Smart Loading
- **Parallel API Calls**: Multiple endpoints fetched simultaneously
- **Lazy Loading**: Data loaded only when needed
- **Abort Controller**: Cancels previous requests on new requests

## 🛠️ Usage Examples

### Basic Dashboard Usage
```typescript
import { useTeacherDashboard } from '../hooks/useTeacherDashboard';

const MyComponent = () => {
  const { dashboardData, isLoading, error, refreshDashboard } = useTeacherDashboard();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <DashboardView 
      data={dashboardData} 
      onRefresh={refreshDashboard}
    />
  );
};
```

### Custom Data Fetching
```typescript
import teacherDashboardService from '../services/teacherDashboardService';

// Fetch specific class performance
const classPerformance = await teacherDashboardService.getClassPerformance('class-123');

// Get upcoming assignments
const upcoming = await teacherDashboardService.getUpcomingAssignments();
```

## 🔧 Configuration

### Environment Variables
```bash
REACT_APP_API_ENCRYPTION_KEY=your-encryption-key
REACT_APP_API_BASE_URL=https://khwanzay.school/api
```

### Cache Configuration
```typescript
// Default TTL values (in milliseconds)
const DEFAULT_TTL = 1800000; // 30 minutes
const DASHBOARD_TTL = 900000; // 15 minutes
```

## 🚨 Error Handling

### Network Errors
- Automatic retry with exponential backoff
- User-friendly error messages
- Fallback to cached data when possible

### API Errors
- Graceful degradation
- Error logging for debugging
- User notification system

### Cache Errors
- Silent fallback to API calls
- Automatic cache cleanup on corruption

## 📱 Mobile Optimizations

### Pull-to-Refresh
- Native refresh control
- Visual feedback during refresh
- Optimized for mobile performance

### Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Optimized for small screens

## 🔄 State Management

### Local State
- Component-level state for UI interactions
- Form data management
- Modal visibility states

### Global State
- Dashboard data caching
- User preferences
- Theme settings

## 🧪 Testing

### Unit Tests
- Service layer testing
- Hook testing
- Component testing

### Integration Tests
- API integration testing
- End-to-end workflows
- Error scenario testing

## 🚀 Future Enhancements

### Planned Features
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: More detailed performance metrics
- **Offline Support**: Offline data access and sync
- **Push Notifications**: Important updates and reminders

### Performance Improvements
- **Virtual Scrolling**: For large datasets
- **Image Optimization**: Lazy loading and compression
- **Bundle Splitting**: Code splitting for better performance

## 📚 Dependencies

### Core Dependencies
- `@react-navigation/native` - Navigation
- `native-base` - UI components
- `@expo/vector-icons` - Icons
- `react-native` - Core framework

### Service Dependencies
- `secureApiService` - Encrypted API communication
- `AsyncStorage` - Local caching
- `axios` - HTTP client

## 🤝 Contributing

### Code Style
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error boundaries
- Write comprehensive JSDoc comments

### Testing
- Maintain high test coverage
- Test error scenarios
- Performance testing for large datasets

---

**Note**: This dashboard is now fully dynamic and will automatically fetch real data from your backend APIs. Make sure all the required endpoints are properly configured and accessible. 