# Advanced Customer Management System

A comprehensive, ERP-level customer management system with advanced analytics, automation, and collaboration features.

## 🚀 Features

### Core Customer Management
- **360° Customer View**: Complete customer profile with timeline, interactions, and analytics
- **Advanced Search & Filtering**: Multi-criteria search with saved filters
- **Bulk Operations**: Create, update, and delete multiple customers simultaneously
- **Customer Segmentation**: Advanced segmentation and targeting capabilities
- **Pipeline Management**: Visual sales pipeline with drag-and-drop functionality

### Analytics & Reporting
- **Real-time Analytics**: Comprehensive customer analytics dashboard
- **Performance Metrics**: Conversion rates, revenue tracking, and customer satisfaction
- **Custom Reports**: Generate and export detailed customer reports
- **Data Visualization**: Charts and graphs for better insights
- **Trend Analysis**: Historical data analysis and forecasting

### Automation & Workflows
- **Automation Center**: Create automated workflows and triggers
- **Email Campaigns**: Automated email marketing campaigns
- **Task Management**: Automated task creation and follow-ups
- **Lead Scoring**: Intelligent lead scoring and prioritization
- **Workflow Rules**: Custom business rules and automation

### Collaboration & Communication
- **Team Collaboration**: Multi-user collaboration features
- **Internal Notes**: Team notes and communication
- **Activity Timeline**: Complete customer interaction history
- **Shared Calendars**: Team scheduling and meeting management
- **Real-time Notifications**: Instant updates and alerts

### Support & Service
- **Support Tickets**: Integrated customer support system
- **Document Management**: Centralized document storage and sharing
- **Knowledge Base**: Customer self-service portal
- **Service History**: Complete service and support history
- **Escalation Management**: Automated escalation workflows

### Advanced Features
- **Cache Management**: Performance optimization with intelligent caching
- **Data Import/Export**: Bulk data operations with validation
- **API Integration**: RESTful API for external integrations
- **Mobile Responsive**: Optimized for mobile and tablet devices
- **Multi-language Support**: Internationalization support

## 📁 Project Structure

```
src/features/customers/
├── components/
│   ├── Customer360View.tsx          # 360° customer view component
│   ├── CustomerList.tsx             # Advanced customer list with filtering
│   ├── CustomerForm.tsx             # Customer creation/editing form
│   ├── SearchFilters.tsx            # Advanced search and filtering
│   ├── BulkOperations.tsx           # Bulk customer operations
│   ├── CacheManagement.tsx          # Cache management and optimization
│   ├── AnalyticsDashboard.tsx       # Analytics and reporting dashboard
│   ├── PipelineBoard.tsx            # Sales pipeline management
│   ├── SegmentsManager.tsx          # Customer segmentation
│   ├── AutomationCenter.tsx         # Workflow automation
│   ├── CollaborationPanel.tsx       # Team collaboration features
│   ├── SupportTickets.tsx           # Customer support system
│   ├── Documents/                   # Document management
│   │   └── Documents.tsx
│   └── Tasks.tsx                    # Task management
├── hooks/
│   └── useCustomerApi.ts            # Comprehensive API hook
├── screens/
│   └── CustomerScreen.tsx           # Main customer management screen
├── services/
│   └── customerService.ts           # Business logic services
├── types/
│   └── types.ts                     # TypeScript type definitions
└── README.md                        # This file
```

## 🛠 Technology Stack

- **Frontend**: React Native with TypeScript
- **UI Framework**: React Native Paper
- **Navigation**: React Navigation v6
- **State Management**: React Hooks with Context API
- **API Integration**: Axios with interceptors
- **Caching**: Intelligent cache management
- **Charts**: Custom chart components
- **Icons**: Expo Vector Icons

## 🔧 API Integration

The system integrates with a comprehensive backend API that provides:

### Customer Management Endpoints
- `GET /customers` - Get customers with filtering and pagination
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /customers/:id` - Get customer details

### Analytics Endpoints
- `GET /customers/analytics` - Customer analytics data
- `GET /customers/performance` - Performance metrics
- `GET /customers/dashboard` - Dashboard data
- `GET /customers/reports` - Custom reports

### Bulk Operations
- `POST /customers/bulk/create` - Bulk create customers
- `PUT /customers/bulk/update` - Bulk update customers
- `DELETE /customers/bulk/delete` - Bulk delete customers

### Advanced Features
- `GET /customers/interactions` - Customer interactions
- `POST /customers/assignments` - Customer assignments
- `GET /customers/conversions` - Conversion tracking
- `POST /customers/notes` - Customer notes
- `GET /customers/follow-ups` - Follow-up management

## 🎯 Usage Instructions

### Basic Customer Management

1. **View Customers**: Navigate to the Customers tab to see all customers
2. **Add Customer**: Click the "+" button to add a new customer
3. **Edit Customer**: Click on a customer to view details and edit
4. **Delete Customer**: Use the delete button in customer details

### Advanced Features

1. **Search & Filter**: Use the search bar and filters to find specific customers
2. **Bulk Operations**: Use the Bulk Ops tab for mass operations
3. **Analytics**: View customer analytics in the Analytics tab
4. **Pipeline**: Manage sales pipeline in the Pipeline tab
5. **Automation**: Set up workflows in the Automation tab

### Cache Management

1. **View Cache Stats**: Check cache performance in the Cache tab
2. **Refresh Cache**: Update cache with latest data
3. **Clear Cache**: Clear cache when experiencing issues

## ⚙️ Configuration

### API Configuration
```typescript
// Configure API base URL and endpoints
const API_CONFIG = {
  baseURL: 'https://your-api.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};
```

### Cache Configuration
```typescript
// Configure cache settings
const CACHE_CONFIG = {
  ttl: 300000, // 5 minutes
  maxSize: 1000,
  enableCompression: true,
};
```

## 📊 Performance Optimization

- **Intelligent Caching**: Reduces API calls and improves performance
- **Lazy Loading**: Components load only when needed
- **Virtual Scrolling**: Efficient rendering of large lists
- **Image Optimization**: Compressed images and lazy loading
- **Bundle Splitting**: Code splitting for better load times

## 🔒 Security Features

- **Authentication**: Secure API authentication
- **Authorization**: Role-based access control
- **Data Validation**: Input validation and sanitization
- **Error Handling**: Secure error handling without data leakage
- **Audit Logging**: Complete audit trail of all operations

## 📈 Analytics & Reporting

### Key Metrics
- Total customers and growth rate
- Customer acquisition cost (CAC)
- Customer lifetime value (CLV)
- Conversion rates by source
- Customer satisfaction scores
- Revenue by customer segment

### Custom Reports
- Customer acquisition reports
- Revenue analysis reports
- Customer behavior reports
- Performance comparison reports
- Trend analysis reports

## 🔄 Automation & Workflows

### Available Automations
- Lead scoring automation
- Email campaign automation
- Task creation automation
- Follow-up automation
- Escalation automation
- Customer segmentation automation

### Workflow Rules
- Time-based triggers
- Event-based triggers
- Conditional logic
- Multi-step workflows
- Integration triggers

## 🤝 Collaboration Features

### Team Features
- Shared customer views
- Internal notes and comments
- Activity tracking
- Team notifications
- Collaborative editing
- Permission management

### Communication
- In-app messaging
- Email integration
- Meeting scheduling
- Task assignment
- Progress tracking

## 📱 Mobile Optimization

- **Responsive Design**: Optimized for all screen sizes
- **Touch Gestures**: Intuitive touch interactions
- **Offline Support**: Basic offline functionality
- **Push Notifications**: Real-time updates
- **Performance**: Optimized for mobile devices

## 🚀 Future Enhancements

### Planned Features
- **AI-Powered Insights**: Machine learning for customer insights
- **Advanced Automation**: AI-driven workflow automation
- **Predictive Analytics**: Customer behavior prediction
- **Integration Hub**: Third-party integrations
- **Mobile App**: Native mobile applications
- **Voice Commands**: Voice-activated features

### Technical Improvements
- **Real-time Updates**: WebSocket integration
- **Advanced Caching**: Redis-based caching
- **Microservices**: Service-oriented architecture
- **Cloud Deployment**: Multi-cloud support
- **API Versioning**: Backward compatibility

## 🐛 Troubleshooting

### Common Issues

1. **Cache Issues**: Clear cache in Cache Management tab
2. **API Errors**: Check network connection and API status
3. **Performance Issues**: Optimize cache settings
4. **Data Sync Issues**: Refresh data manually

### Debug Mode
Enable debug mode for detailed logging:
```typescript
const DEBUG_MODE = true;
```

## 📞 Support

For technical support and questions:
- **Documentation**: Check this README and inline comments
- **API Documentation**: Refer to backend API docs
- **Issues**: Report bugs through the issue tracker
- **Feature Requests**: Submit feature requests

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This is an advanced ERP-level customer management system designed for enterprise use. It includes comprehensive features for customer relationship management, analytics, automation, and collaboration. 

# Customer Management System

This module provides a comprehensive customer management system with a modern, user-friendly interface that's fully compatible with the backend API.

## 🚀 Features

### ✨ Enhanced Customer Form
- **Modern Design**: Clean, professional, and cute UI with smooth animations
- **Comprehensive Fields**: All fields from the Prisma schema are supported
- **Smart Validation**: Real-time validation with helpful error messages
- **Responsive Layout**: Works perfectly on mobile and web
- **Accessibility**: Proper labels, icons, and keyboard navigation

### 📊 Advanced CRM Features
- **Customer Stages**: Lead → Prospect → Customer → Churned
- **Priority Levels**: Low, Medium, High, Urgent
- **Status Tracking**: Active, Inactive, Pending, Converted, Lost, Churned
- **Lead Scoring**: 0-100 scale for lead qualification
- **Value Tracking**: Customer lifetime value and total interactions
- **Tags System**: Flexible tagging for better organization

### 🔧 Technical Features
- **Backend Compatible**: Fully compatible with the Prisma schema
- **Type Safety**: Full TypeScript support with proper interfaces
- **API Integration**: Seamless integration with the backend API
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Proper loading indicators and disabled states

## 📁 File Structure

```
src/features/customers/
├── components/
│   ├── CustomerForm.tsx              # Main customer form component
│   ├── CustomerFormExample.tsx       # Example usage component
│   └── ...                           # Other customer components
├── hooks/
│   └── useCustomerForm.ts            # Custom hook for form operations
├── services/
│   ├── customerApi.ts                # API service for customer operations
│   └── customerAdvancedApi.ts        # Advanced CRM features
├── models.ts                         # TypeScript interfaces
└── README.md                         # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- React Native with TypeScript
- Expo Vector Icons
- React Native Community DateTimePicker
- AsyncStorage for token management

### Dependencies
```bash
npm install @react-native-community/datetimepicker
npm install @expo/vector-icons
npm install @react-native-async-storage/async-storage
```

## 📖 Usage

### Basic Usage

```tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import CustomerFormExample from './components/CustomerFormExample';
import { Customer } from './models';

const CustomerScreen = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleCustomerSaved = (customer: Customer) => {
    console.log('Customer saved:', customer);
    // Refresh your customer list or navigate
  };

  return (
    <View>
      <TouchableOpacity onPress={() => setShowForm(true)}>
        <Text>Add New Customer</Text>
      </TouchableOpacity>

      <CustomerFormExample
        visible={showForm}
        onClose={() => setShowForm(false)}
        customer={selectedCustomer}
        onCustomerSaved={handleCustomerSaved}
      />
    </View>
  );
};
```

### Advanced Usage with Custom Hook

```tsx
import React from 'react';
import { useCustomerForm } from './hooks/useCustomerForm';
import CustomerForm from './components/CustomerForm';

const CustomCustomerForm = () => {
  const { saveCustomer, loading } = useCustomerForm({
    onSuccess: (customer) => {
      console.log('Customer saved successfully:', customer);
    },
    onError: (error) => {
      console.error('Failed to save customer:', error);
    }
  });

  const handleSave = async (customerData: Partial<Customer>) => {
    try {
      await saveCustomer(customerData);
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  return (
    <CustomerForm
      onSave={handleSave}
      onCancel={() => {/* handle cancel */}}
      loading={loading}
    />
  );
};
```

## 🎨 Form Fields

### Basic Information
- **Name** (Required): Full customer name
- **Mobile** (Required): Contact number with validation
- **Email**: Email address with format validation
- **Gender**: Male, Female, Other, Prefer not to say
- **Date of Birth**: Date picker with age validation
- **Occupation**: Professional occupation

### Business Information
- **Purpose** (Required): Reason for contact
- **Company**: Company or organization name
- **Website**: Company website URL
- **Source**: How they found you (Website, Referral, Social Media, etc.)
- **Department**: Sales, Support, Marketing, Finance, HR

### Address Information
- **Address**: Full address with multiline support
- **City**: City name
- **Country**: Country name
- **Postal Code**: ZIP/Postal code

### CRM Information
- **Status**: Active, Inactive, Pending, Converted, Lost, Churned
- **Stage**: Lead, Prospect, Customer, Churned
- **Priority**: Low, Medium, High, Urgent
- **Value**: Customer lifetime value
- **Lead Score**: 0-100 lead qualification score

### Additional Features
- **Tags**: Flexible tagging system with add/remove functionality
- **Notes**: Multiline notes and remarks
- **Date Picker**: Native date picker for date fields

## 🔌 API Integration

### Backend Compatibility
The form is fully compatible with the backend Prisma schema:

```typescript
interface BackendCustomer {
  name: string;
  purpose: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
  mobile: string;
  email?: string;
  source: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CONVERTED' | 'LOST' | 'CHURNED';
  department: string;
  // ... and many more fields
}
```

### API Endpoints
- `POST /customers` - Create new customer
- `PUT /customers/:id` - Update customer
- `GET /customers/:id` - Get customer by ID
- `DELETE /customers/:id` - Delete customer
- `GET /customers` - Get all customers with filters

## 🎯 Key Features

### 🎨 Design Highlights
- **Modern UI**: Clean, professional design with subtle shadows and rounded corners
- **Color Scheme**: Consistent purple theme (#6366f1) with proper contrast
- **Typography**: Clear hierarchy with proper font weights and sizes
- **Spacing**: Consistent padding and margins throughout
- **Icons**: Meaningful icons for better UX
- **Animations**: Smooth transitions and loading states

### 🔧 Technical Highlights
- **Type Safety**: Full TypeScript support with proper interfaces
- **Validation**: Real-time validation with helpful error messages
- **Responsive**: Works on all screen sizes
- **Accessible**: Proper labels, focus management, and keyboard navigation
- **Performance**: Optimized rendering and minimal re-renders
- **Error Handling**: Comprehensive error handling with user feedback

### 📱 Mobile Optimized
- **Touch Friendly**: Proper touch targets and spacing
- **Keyboard Aware**: Handles keyboard properly on mobile
- **Native Components**: Uses native date picker and other components
- **Smooth Scrolling**: Optimized scroll performance
- **Loading States**: Proper loading indicators

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install @react-native-community/datetimepicker
   ```

2. **Import Components**:
   ```tsx
   import CustomerFormExample from './components/CustomerFormExample';
   ```

3. **Use in Your App**:
   ```tsx
   <CustomerFormExample
     visible={showForm}
     onClose={() => setShowForm(false)}
     onCustomerSaved={handleCustomerSaved}
   />
   ```

## 🔧 Configuration

### Environment Variables
Make sure your API client is configured with the correct base URL:

```typescript
// services/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.API_BASE_URL || 'https://khwanzay.school/api',
  timeout: 10000,
});
```

### Authentication
The form automatically handles authentication using AsyncStorage:

```typescript
const token = await AsyncStorage.getItem('userToken');
```

## 🐛 Troubleshooting

### Common Issues

1. **Date Picker Not Working**:
   - Ensure `@react-native-community/datetimepicker` is installed
   - Check platform-specific setup requirements

2. **API Calls Failing**:
   - Verify API base URL configuration
   - Check authentication token in AsyncStorage
   - Ensure backend is running and accessible

3. **Form Validation Errors**:
   - Check required fields are filled
   - Verify email format if provided
   - Ensure mobile number format is correct

### Debug Mode
Enable debug logging by setting:

```typescript
console.log('Form Data:', formData);
console.log('API Response:', response);
```

## 🤝 Contributing

1. Follow the existing code style and patterns
2. Add proper TypeScript types for new features
3. Include proper error handling
4. Test on both mobile and web platforms
5. Update this README for any new features

## 📄 License

This project is part of the tailoring-app and follows the same license terms.

---

**Happy Coding! 🎉** 