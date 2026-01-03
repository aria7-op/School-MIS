# Staff Management System

A comprehensive staff management system built with React Native and NativeBase, featuring advanced analytics, bulk operations, and complete staff lifecycle management.

## Features

### 🏠 Dashboard
- **Staff Overview**: Total staff, active/inactive counts, department distribution
- **Quick Actions**: Add staff, import/export, generate reports
- **Recent Activity**: Latest staff additions and status changes
- **Performance Metrics**: Charts and key performance indicators

### 👥 Staff Management
- **Staff List**: Advanced filtering, search, and bulk operations
- **Staff Form**: Comprehensive form with validation and file uploads
- **Staff Analytics**: Interactive charts and performance metrics
- **Bulk Operations**: Import/export, bulk updates, mass actions

### 📊 Analytics & Reporting
- **Staff Analytics**: Interactive charts using Victory Native
- **Department Distribution**: Visual representation of staff by department
- **Status Analysis**: Staff status breakdown and trends
- **Salary Analysis**: Salary distribution and benchmarking

### 🔧 Advanced Features
- **Bulk Operations**: Import/export, bulk updates, mass actions
- **Real-time Updates**: Live data synchronization
- **Offline Support**: Cached data and offline capabilities
- **Multi-language**: Internationalization support
- **Accessibility**: Full accessibility compliance

## Components

### Core Components

#### StaffDashboard
- Overview cards with key metrics
- Quick action buttons
- Recent staff activity
- Department distribution charts

#### StaffList
- Advanced filtering and search
- Bulk selection and operations
- Sortable columns
- Pagination support

#### StaffForm
- Comprehensive form validation
- Profile picture upload
- Emergency contact information
- Qualifications and experience

#### StaffAnalytics
- Interactive charts
- Multiple chart types
- Real-time data
- Export capabilities

#### BulkOperations
- JSON file upload
- Bulk create/update/delete
- Validation and error handling
- Progress tracking

## API Integration

### useStaffApi Hook
```typescript
const {
  staff,
  loading,
  error,
  createStaff,
  updateStaff,
  deleteStaff,
  getStaff,
  searchStaff,
  getStaffAnalytics,
  bulkCreateStaff,
  bulkUpdateStaff,
  bulkDeleteStaff,
  importStaff,
  exportStaff,
} = useStaffApi();
```

### Key Endpoints
- `GET /api/staff` - List staff with filters
- `POST /api/staff` - Create new staff member
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member
- `GET /api/staff/analytics` - Get analytics data
- `POST /api/staff/bulk` - Bulk operations
- `POST /api/staff/import` - Import staff data
- `GET /api/staff/export` - Export staff data

## Installation

### Dependencies
```bash
npm install native-base react-native-svg victory-native
npm install expo-document-picker expo-file-system expo-image-picker
npm install react-native-print react-native-share
```

### NativeBase Setup
```typescript
import { NativeBaseProvider } from 'native-base';
import { theme } from './theme';

export default function App() {
  return (
    <NativeBaseProvider theme={theme}>
      {/* Your app components */}
    </NativeBaseProvider>
  );
}
```

### Victory Native Setup
```typescript
import { VictoryChart, VictoryBar, VictoryPie } from 'victory-native';
import Svg from 'react-native-svg';

// Wrap charts with Svg
<Svg>
  <VictoryChart>
    <VictoryBar data={data} />
  </VictoryChart>
</Svg>
```

## Usage Examples

### Basic Staff Creation
```typescript
import { StaffForm } from './components/StaffForm';

const MyComponent = () => {
  const handleStaffSuccess = (staff) => {
    console.log('Staff created:', staff);
  };

  return (
    <StaffForm
      onSuccess={handleStaffSuccess}
      onCancel={() => {}}
    />
  );
};
```

### Staff List with Filters
```typescript
import { StaffList } from './components/StaffList';

const MyComponent = () => {
  const handleViewStaff = (staff) => {
    // Handle staff view
  };

  return (
    <StaffList
      onViewStaff={handleViewStaff}
      showBulkActions={true}
    />
  );
};
```

### Bulk Operations
```typescript
import { BulkOperations } from './components/BulkOperations';

const MyComponent = () => {
  return <BulkOperations />;
};
```

### Analytics Dashboard
```typescript
import { StaffAnalytics } from './components/StaffAnalytics';

const MyComponent = () => {
  return <StaffAnalytics />;
};
```

## Data Models

### Staff Model
```typescript
interface Staff {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    profilePicture?: string;
  };
  employeeId: string;
  designation: string;
  departmentId: number;
  department?: {
    id: number;
    name: string;
  };
  joiningDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'suspended';
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  qualifications?: string;
  experience?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Bulk Operation Models
```typescript
interface BulkCreateRequest {
  staff: Staff[];
  skipDuplicates: boolean;
}

interface BulkUpdateRequest {
  updates: {
    id: number;
    data: Partial<Staff>;
  }[];
}

interface BulkDeleteRequest {
  staffIds: number[];
}
```

## Styling

### Theme Configuration
```typescript
// theme/index.ts
export const theme = extendTheme({
  colors: {
    primary: {
      50: '#E3F2FD',
      500: '#2196F3',
      900: '#0D47A1',
    },
  },
  components: {
    Button: {
      defaultProps: {
        borderRadius: 'md',
      },
    },
    Card: {
      defaultProps: {
        shadow: 2,
      },
    },
  },
});
```

### Custom Components
```typescript
// Custom styled components
const StyledCard = styled(Card)`
  border-radius: 12px;
  shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StyledButton = styled(Button)`
  border-radius: 8px;
  font-weight: 600;
`;
```

## Performance Optimization

### Lazy Loading
```typescript
const StaffAnalytics = lazy(() => import('./components/StaffAnalytics'));
const BulkOperations = lazy(() => import('./components/BulkOperations'));
```

### Memoization
```typescript
const MemoizedStaffList = memo(StaffList);
const MemoizedStaffForm = memo(StaffForm);
```

### Data Caching
```typescript
const { data: staff } = useQuery(['staff'], fetchStaff, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

## Testing

### Unit Tests
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { StaffForm } from './StaffForm';

describe('StaffForm', () => {
  it('should validate required fields', () => {
    const { getByText } = render(<StaffForm />);
    fireEvent.press(getByText('Submit'));
    expect(getByText('First name is required')).toBeTruthy();
  });
});
```

### Integration Tests
```typescript
import { render, waitFor } from '@testing-library/react-native';
import { StaffList } from './StaffList';

describe('StaffList Integration', () => {
  it('should load and display staff', async () => {
    const { getByText } = render(<StaffList />);
    await waitFor(() => {
      expect(getByText('Staff List')).toBeTruthy();
    });
  });
});
```

## Error Handling

### API Error Handling
```typescript
const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Handle unauthorized
  } else if (error.response?.status === 404) {
    // Handle not found
  } else {
    // Handle general error
  }
};
```

### Form Validation
```typescript
const validateStaff = (data) => {
  const errors = {};
  
  if (!data.user.firstName) errors.firstName = 'First name is required';
  if (!data.user.lastName) errors.lastName = 'Last name is required';
  if (!data.user.email) errors.email = 'Email is required';
  if (!data.employeeId) errors.employeeId = 'Employee ID is required';
  if (!data.designation) errors.designation = 'Designation is required';
  if (!data.departmentId) errors.departmentId = 'Department is required';
  if (!data.joiningDate) errors.joiningDate = 'Joining date is required';
  if (!data.salary) errors.salary = 'Salary is required';
  
  return errors;
};
```

## Security

### Data Validation
- Input sanitization
- XSS prevention
- SQL injection protection
- File upload validation

### Authentication
- JWT token management
- Role-based access control
- Session management
- API key protection

## Deployment

### Build Configuration
```json
{
  "expo": {
    "name": "Staff Management",
    "slug": "staff-management",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "plugins": [
      "expo-document-picker",
      "expo-file-system",
      "expo-image-picker"
    ]
  }
}
```

### Environment Variables
```bash
REACT_APP_API_URL=https://api.example.com
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## Changelog

### v1.0.0
- Initial release
- Basic staff management
- Analytics dashboard
- Bulk operations

### v1.1.0
- Added advanced analytics
- Enhanced bulk operations
- Performance improvements
- Better error handling

### v1.2.0
- NativeBase migration
- Victory Native charts
- Advanced filtering
- Export capabilities
- Complete UI overhaul 