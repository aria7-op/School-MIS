# Superadmin Portal

A comprehensive superadmin portal with detailed analytics and reporting for school management systems.

## 🎯 Features

### Overview Dashboard
- **System-Wide Metrics**: Total schools, students, teachers, staff overview
- **Financial Summary**: Real-time revenue, expenses, and net profit tracking
- **Recent Activity**: Latest payments and transactions
- **System Health**: Current system status and performance indicators

### Financial Analytics
- **Revenue Analytics**: Detailed revenue tracking by time period (day/week/month/year)
- **Expense Analytics**: Comprehensive expense categorization and trending
- **Profit & Loss Reports**: Complete P&L statements with recommendations
- **Payment Trends**: Payment status distribution and completion rates
- **School Financial Comparison**: Side-by-side financial performance across schools
- **Visual Charts**: Area charts, pie charts, and bar charts for financial data

### Academic Analytics
- **Student Performance**: Comprehensive performance tracking and categorization
  - Excellent Performers (85%+)
  - Good Performers (70-84%)
  - Average Performers (50-69%)
  - Needs Attention (<50%)
- **Attendance Analytics**: Real-time attendance tracking and trends
- **Grade Distribution**: Academic performance visualization
- **Subject Performance**: Subject-wise performance analysis

### User Analytics
- **User Overview**: Total users by role and status
- **Student Demographics**: Gender distribution and enrollment trends
- **Teacher Analytics**: Workload distribution and engagement metrics
- **Staff Analytics**: Staff distribution and activity
- **Parent Analytics**: Parent engagement tracking
- **Activity Monitoring**: User activity and login patterns

### School Comparison
- **Performance Rankings**: 
  - Top schools by revenue
  - Top schools by profit
  - Top schools by efficiency (profit margin)
- **Resource Distribution**: Student, teacher, and class distribution
- **Comparative Analytics**: Side-by-side school performance metrics

### System Health Monitoring
- **Real-Time Metrics**: Active users, system load, recent activity
- **Database Health**: Connection pool, record counts, database size
- **Memory Usage**: Heap memory, RSS, external memory monitoring
- **Error Tracking**: 24-hour error logs with severity levels
- **Uptime Monitoring**: System uptime and availability tracking

## 📊 Data Visualization

### Chart Types
- **Area Charts**: Revenue vs Expenses trends
- **Bar Charts**: Expense categories, payment status, school comparisons
- **Pie Charts**: Payment method distribution, user role distribution, performance levels
- **Line Charts**: Attendance trends, enrollment patterns

### Interactive Features
- **Date Range Filtering**: Custom date range selection for all analytics
- **School Filtering**: Filter analytics by specific schools
- **Real-Time Updates**: Automatic data refresh every 30-60 seconds
- **Export Capabilities**: Export reports in various formats

## 🚀 Technology Stack

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling (consistent with project design)
- **React Query** (@tanstack/react-query) for data fetching and caching
- **Recharts** for data visualization
- **React Icons** for UI icons
- **i18n** for internationalization support

### Backend
- **Node.js** with Express
- **Prisma ORM** for database operations
- **MySQL** database
- **JWT** authentication
- **Role-based access control** (SUPER_ADMIN only)

## 📁 Project Structure

```
superadmin/
├── components/
│   ├── FinancialAnalyticsDashboard.tsx    # Financial reporting
│   ├── AcademicAnalyticsDashboard.tsx     # Academic analytics
│   ├── UserAnalyticsDashboard.tsx         # User metrics
│   ├── SchoolComparisonDashboard.tsx      # School comparisons
│   └── SystemHealthDashboard.tsx          # System monitoring
├── screens/
│   └── SuperadminDashboard.tsx            # Main dashboard
├── services/
│   └── superadminService.ts               # API service layer
├── types/
│   └── superadmin.ts                      # TypeScript types
├── index.ts                               # Exports
└── README.md                              # Documentation
```

## 🔐 Security & Access

### Authentication
- Protected routes with JWT authentication
- Role-based access control (RBAC)
- Only SUPER_ADMIN role has access

### API Endpoints
All endpoints require authentication and SUPER_ADMIN role:

```
/api/superadmin/dashboard/overview
/api/superadmin/analytics/financial/*
/api/superadmin/analytics/academic/*
/api/superadmin/analytics/users/*
/api/superadmin/analytics/schools/*
/api/superadmin/system/*
/api/superadmin/reports/*
/api/superadmin/metrics/*
/api/superadmin/insights/*
```

## 📈 Key Metrics Tracked

### Financial Metrics
- Total Revenue
- Total Expenses
- Net Profit
- Profit Margin
- Pending Payments
- Payment Completion Rate
- Revenue Per Student
- Payment Methods Distribution
- Expense Categories
- Refunds

### Academic Metrics
- Total Students
- Average Attendance Rate
- Average Grade/GPA
- Performance Distribution
- Class Performance
- Subject Performance
- Exam Results
- Assignment Completion

### User Metrics
- Total Users (All Roles)
- Active/Inactive Users
- User Distribution by Role
- Student Demographics
- Teacher Workload
- Parent Engagement
- Login Activity

### System Metrics
- Active Users (Real-time)
- System Load
- Memory Usage
- Database Size
- Error Rates
- Uptime
- Response Times
- API Performance

## 🎨 Design Principles

### Consistent with Project Design
- Uses Tailwind CSS utility classes
- Matches existing component styling
- Maintains design language consistency
- Responsive across all devices
- RTL support for Persian/Pashto languages

### Color Scheme
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow/Orange (#F59E0B)
- **Danger**: Red (#EF4444)
- **Info**: Purple (#8B5CF6)

### Card Layouts
- White background with shadow-sm
- Gray-200 borders
- Rounded-lg corners
- Consistent padding (p-6)
- Hover effects for interactive elements

## 🔄 Data Refresh Strategy

### Real-Time Updates
- System health: Every 60 seconds
- Real-time metrics: Every 30 seconds
- Dashboard overview: On mount + manual refresh
- Analytics: On date range change

### Caching Strategy
- React Query with 10-minute stale time
- 15-minute cache time
- Smart invalidation on updates
- Optimistic updates where applicable

## 🌐 Internationalization

The portal supports multiple languages through i18n:
- English (en)
- Persian/Farsi (fa-AF)
- Pashto (ps-AF)

RTL support is automatically applied for Persian and Pashto.

## 📱 Responsive Design

- **Mobile**: Single column layouts, optimized navigation
- **Tablet**: 2-column grids, collapsible sidebar
- **Desktop**: Full multi-column layouts, expanded sidebar

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MySQL database
- Backend server running
- SUPER_ADMIN user credentials

### Access the Portal
1. Login with SUPER_ADMIN credentials
2. Navigate to "Superadmin" tab in the main layout
3. Portal is only visible to SUPER_ADMIN role

### Features Access
- **Overview**: System-wide metrics and recent activity
- **Financial**: Complete financial analytics and reporting
- **Academic**: Student performance and attendance analytics
- **Users**: User distribution and activity tracking
- **Schools**: School comparison and rankings
- **System**: Real-time system health monitoring

## 🎯 Future Enhancements

### Planned Features
- Advanced predictive analytics
- Machine learning insights
- Automated report scheduling
- Email notifications for alerts
- Custom dashboard widgets
- Advanced filtering and search
- Data export in multiple formats (PDF, Excel, CSV)
- Audit trail visualization
- Performance benchmarking
- Budget forecasting

### Analytics Enhancements
- Enrollment predictions
- Revenue forecasting
- Risk analysis
- Trend predictions
- Anomaly detection

## 📞 Support

For issues or questions regarding the Superadmin Portal:
- Check backend logs for API errors
- Verify SUPER_ADMIN role assignment
- Ensure all required endpoints are registered
- Check browser console for frontend errors

## 🔧 Troubleshooting

### Common Issues

1. **Portal not visible**: Ensure user has SUPER_ADMIN role
2. **Data not loading**: Check API endpoints are registered in app.js
3. **Charts not rendering**: Verify Recharts is installed
4. **Real-time updates not working**: Check React Query configuration
5. **Authentication errors**: Verify JWT token and role permissions

### Debug Mode
Enable detailed logging in development:
```javascript
queryClient.setLogger({
  log: console.log,
  warn: console.warn,
  error: console.error,
});
```

## 📝 License

This superadmin portal is part of the school management system and follows the same license.

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintained by**: Development Team

