# Owners Feature

A comprehensive owner management system for the School Management App with full CRUD operations, authentication, and modern UI.

## Features

### 🔐 Authentication & Security
- **Owner Registration**: Create new owners with validation
- **Login/Logout**: Secure authentication with JWT tokens
- **Password Management**: Change password with current password verification
- **Token Refresh**: Automatic token refresh mechanism
- **Session Management**: Secure session handling

### 👥 Owner Management
- **List Owners**: Paginated list with search and filtering
- **Create Owner**: Comprehensive form with validation
- **View Details**: Detailed owner information with statistics
- **Edit Owner**: Update owner information and settings
- **Delete Owner**: Secure deletion with confirmation
- **Profile Management**: Current owner profile management

### 📊 Statistics & Analytics
- **Owner Statistics**: Dashboard with owner counts and distribution
- **Real-time Data**: Live statistics updates
- **Visual Charts**: Beautiful statistics cards with icons

### 🔍 Search & Filtering
- **Advanced Search**: Search by name, email, or phone
- **Status Filtering**: Filter by active, inactive, or suspended status
- **Email Verification Filter**: Filter by email verification status
- **Pagination**: Efficient pagination with load more functionality

### 🎨 Modern UI/UX
- **Responsive Design**: Works on all screen sizes
- **Material Design**: Modern Material Design components
- **Smooth Animations**: Fluid transitions and interactions
- **Error Handling**: Comprehensive error states and messages
- **Loading States**: Beautiful loading indicators
- **Empty States**: Helpful empty state messages

## File Structure

```
src/features/owners/
├── components/
│   ├── OwnerCard.tsx          # Owner list item component
│   ├── OwnerStatsCard.tsx     # Statistics display component
│   ├── SearchFilterBar.tsx    # Search and filter component
│   └── OwnerForm.tsx          # Create/edit owner form
├── screens/
│   ├── OwnersScreen.tsx       # Main owners list screen
│   ├── AddOwnerScreen.tsx     # Create new owner screen
│   ├── OwnerDetailScreen.tsx  # Owner details view
│   ├── EditOwnerScreen.tsx    # Edit owner screen
│   └── OwnerProfileScreen.tsx # Current owner profile
├── services/
│   └── ownerService.ts        # API service layer
├── types.ts                   # TypeScript type definitions
├── index.ts                   # Feature exports
└── README.md                  # This file
```

## Components

### OwnerCard
Beautiful card component displaying owner information with:
- Avatar with initials
- Name and email
- Status indicator with colors
- Action buttons (edit/delete)
- Statistics (schools, users)

### OwnerStatsCard
Statistics dashboard showing:
- Total owners count
- Active owners count
- Inactive owners count
- Suspended owners count
- Visual icons and colors

### SearchFilterBar
Advanced search and filtering with:
- Real-time search input
- Status filter dropdown
- Email verification filter
- Clear filters option
- Modern modal design

### OwnerForm
Comprehensive form for creating/editing owners with:
- Basic information fields
- Account settings
- Additional metadata
- Theme preferences
- Form validation
- Error handling

## Screens

### OwnersScreen
Main owners list with:
- Header with title and actions
- Search and filter bar
- Paginated owner list
- Statistics modal
- Pull-to-refresh
- Load more functionality
- Empty state handling

### AddOwnerScreen
Create new owner with:
- Form validation
- Loading states
- Success/error handling
- Navigation integration

### OwnerDetailScreen
Detailed owner view with:
- Profile header
- Action buttons
- Comprehensive information sections
- Statistics display
- Edit/delete functionality

### EditOwnerScreen
Edit existing owner with:
- Pre-filled form data
- Update functionality
- Validation
- Success handling

### OwnerProfileScreen
Current owner profile with:
- Profile information
- Account settings
- Password change
- Logout functionality
- Statistics

## API Integration

The feature integrates with the backend API endpoints:

- `GET /api/owners/health` - Health check
- `POST /api/owners` - Create owner
- `POST /api/owners/login` - Owner login
- `POST /api/owners/refresh-token` - Refresh token
- `POST /api/owners/logout` - Owner logout
- `GET /api/owners/me` - Get current profile
- `PUT /api/owners/me` - Update current profile
- `POST /api/owners/me/change-password` - Change password
- `GET /api/owners` - Get all owners (with pagination/filtering)
- `GET /api/owners/:id` - Get owner by ID
- `PUT /api/owners/:id` - Update owner
- `DELETE /api/owners/:id` - Delete owner
- `GET /api/owners/stats` - Get owner statistics

## Usage

### Basic Import
```typescript
import { 
  OwnersScreen, 
  AddOwnerScreen, 
  OwnerDetailScreen,
  ownerService 
} from '../features/owners';
```

### Navigation
```typescript
// Navigate to owners list
navigation.navigate('OwnersList');

// Navigate to add owner
navigation.navigate('AddOwner');

// Navigate to owner details
navigation.navigate('OwnerDetails', { ownerId: '123' });

// Navigate to edit owner
navigation.navigate('EditOwner', { ownerId: '123' });

// Navigate to profile
navigation.navigate('OwnerProfile');
```

### API Service Usage
```typescript
// Get all owners
const owners = await ownerService.getAllOwners(token, {
  page: 1,
  limit: 10,
  search: 'john',
  status: 'ACTIVE'
});

// Create owner
const newOwner = await ownerService.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePassword123!'
});

// Update owner
const updatedOwner = await ownerService.updateOwner(token, ownerId, {
  name: 'John Updated',
  phone: '+1234567890'
});
```

## Styling

The feature uses a consistent design system with:
- **Colors**: Defined in `src/constants/colors.ts`
- **Typography**: Consistent font sizes and weights
- **Spacing**: Standardized padding and margins
- **Shadows**: Subtle elevation effects
- **Border Radius**: Consistent rounded corners

## Error Handling

Comprehensive error handling includes:
- Network errors
- Validation errors
- Authentication errors
- Server errors
- User-friendly error messages
- Retry mechanisms

## Performance

Optimized for performance with:
- Efficient list rendering
- Pagination
- Image optimization
- Lazy loading
- Memoization where appropriate
- Minimal re-renders

## Testing

The feature is designed for easy testing with:
- Separated business logic
- Mockable service layer
- Testable components
- Clear interfaces

## Future Enhancements

Potential improvements:
- Bulk operations
- Advanced analytics
- Export functionality
- Activity logs
- Permission management
- Multi-language support 