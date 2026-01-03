# School Management System - Copy Project

This is a React-based school management system with finance features.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation
```bash
npm install
```

### Running the Development Server

#### Local Development (localhost only)
```bash
npm run dev
```

#### Network Development (accessible from other devices)
```bash
npm run dev:network
```

### Accessing the Application

- **Local access**: http://localhost:3000
- **Network access**: http://192.168.0.7:3000

### Configuration

The application is configured to:
- Run on port 3000
- Accept connections from any IP address (0.0.0.0)
- Connect to API at http://192.168.0.7:3000/api

### Features

- **Finance Management**: Complete finance system with payments, expenses, and payroll
- **Student Management**: Student records and analytics
- **Customer Management**: Customer relationship management
- **Teacher Portal**: Teacher-specific features
- **Parent Portal**: Parent dashboard and features

### Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: React Query (@tanstack/react-query)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS

### API Configuration

The API base URL is configured in `src/config/api.ts` and defaults to:
```
http://192.168.0.7:3000/api
```

### Development Notes

- The application uses React Query for efficient data fetching and caching
- All components are built with TypeScript for type safety
- Tailwind CSS is used for styling with a consistent design system
- The finance feature includes comprehensive CRUD operations with real-time updates

### Troubleshooting

If you encounter issues:

1. **Port already in use**: Change the port in `vite.config.ts`
2. **Network access issues**: Ensure your firewall allows connections on port 3000
3. **API connection issues**: Verify the API server is running on the configured IP and port

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.