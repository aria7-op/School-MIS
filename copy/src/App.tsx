import React, { Suspense, useEffect } from 'react';
import i18n from './i18n';
import { I18nextProvider } from 'react-i18next';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ensureCsrfToken } from './utils/csrf';
import ErrorBoundary from './components/ErrorBoundary';
import SkipNavigation from './components/SkipNavigation';

// Create a client with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 60 * 1000, // 10 minutes - data stays fresh longer
      cacheTime: 15 * 60 * 1000, // 15 minutes - data stays in cache longer
      retry: 1,
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      refetchOnMount: false, // Don't refetch when component mounts if data exists
      refetchOnReconnect: false, // Don't refetch when network reconnects
    },
  },
});

// Import contexts and services
import { AuthProvider } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';
import { SuperAdminProvider } from './contexts/SuperAdminContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Import the main navigation component
import MainNavigation from './navigation';

// Local Navigation component removed - using MainNavigation instead

function App() {
  // Initialize CSRF token on app startup
  useEffect(() => {
    ensureCsrfToken().catch((err) => {
      if (typeof window !== 'undefined' && window.logger) {
        window.logger.warn('Failed to initialize CSRF token', err);
      }
    });
  }, []);

  // Sync HTML dir and lang attributes with i18n language
  useEffect(() => {
    const updateDirectionAndLang = () => {
      const language = i18n.language;
      const htmlElement = document.documentElement;
      
      // Set direction based on language (RTL for Farsi/Persian, Pashto)
      const direction = (language === 'fa-AF' || language === 'ps-AF') ? 'rtl' : 'ltr';
      htmlElement.dir = direction;
      htmlElement.lang = language;
    };

    // Update on initial load
    updateDirectionAndLang();

    // Update whenever language changes
    i18n.on('languageChanged', updateDirectionAndLang);

    return () => {
      i18n.off('languageChanged', updateDirectionAndLang);
    };
  }, []);

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <RoleProvider>
                <SuperAdminProvider>
                  <NotificationProvider>
                    <ToastProvider>
                      <SkipNavigation />
                      <main id="main-content" tabIndex={-1}>
                        <Suspense fallback={
                          <div className="flex items-center justify-center min-h-screen bg-gray-50" role="status" aria-live="polite">
                            <div className="text-center">
                              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" aria-hidden="true"></div>
                              <p className="mt-4 text-lg text-gray-600">Loading translations...</p>
                            </div>
                          </div>
                        }>
                          <MainNavigation />
                        </Suspense>
                      </main>
                    </ToastProvider>
                  </NotificationProvider>
                </SuperAdminProvider>
              </RoleProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App; 
