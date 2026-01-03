import React from 'react';
import { Platform } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UltraAdvancedAccessControlProvider } from './contexts/UltraAdvancedAccessControlContext';
import { RoleProvider } from './contexts/RoleContext';
import { NotificationProvider } from './contexts/NotificationContext';
import AccessControlErrorBoundary from './components/AccessControlErrorBoundary';
import Navigation from './navigation/index';
import LoginScreen from './screens/LoginScreen';
import { NavigationContainer, Theme } from '@react-navigation/native';
import { theme as customTheme } from './theme';

// Create a query client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Authentication Wrapper Component
const AuthenticationWrapper: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#F8F9FA',
      }}>
        <div style={{
          textAlign: 'center',
          padding: 20,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔄</div>
          <h2 style={{ marginBottom: 8, color: '#333' }}>Loading...</h2>
          <p style={{ color: '#666' }}>Checking authentication status</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated || !user) {
    return <LoginScreen />;
  }

  // Show main app if authenticated
  const navigationTheme: Theme = {
    dark: false,
    colors: {
      primary: '#6366f1',
      background: '#ffffff',
      card: '#f8f9fa',
      text: '#212529',
      border: '#dee2e6',
      notification: '#6366f1',
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400',
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500',
      },
      light: {
        fontFamily: 'System',
        fontWeight: '300',
      },
      thin: {
        fontFamily: 'System',
        fontWeight: '100',
      },
      black: {
        fontFamily: 'System',
        fontWeight: '900',
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700',
      },
      semibold: {
        fontFamily: 'System',
        fontWeight: '600',
      },
      ultralight: {
        fontFamily: 'System',
        fontWeight: '200',
      },
    },
  };

  return <Navigation theme={navigationTheme} />;
};

// Error Boundary for Access Control
class AccessControlErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to error reporting service
      
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          padding: 20,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚨</div>
          <h2 style={{ marginBottom: 16, color: '#D32F2F' }}>Access Control Error</h2>
          <p style={{ marginBottom: 16, color: '#666' }}>
            Something went wrong with the access control system. Please try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '12px 24px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 16,
            }}
          >
            Try Again
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: 16, textAlign: 'left' }}>
              <summary style={{ cursor: 'pointer', color: '#007AFF' }}>Error Details</summary>
              <pre style={{
                backgroundColor: '#F5F5F5',
                padding: 12,
                borderRadius: 4,
                overflow: 'auto',
                fontSize: 12,
                marginTop: 8,
              }}>
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UltraAdvancedAccessControlProvider>
          <RoleProvider>
            <NotificationProvider>
              <AccessControlErrorBoundary>
                <AuthenticationWrapper />
              </AccessControlErrorBoundary>
            </NotificationProvider>
          </RoleProvider>
        </UltraAdvancedAccessControlProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App; 
