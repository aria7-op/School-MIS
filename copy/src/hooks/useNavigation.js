import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NAVIGATION_ITEMS, USER_ROLES } from '../constants';

/**
 * Custom Navigation Hook
 * Manages internal routing without changing the address bar
 */
export const useNavigation = () => {
  const { user } = useAuth();
  const [currentComponent, setCurrentComponent] = useState('Dashboard');
  const [navigationHistory, setNavigationHistory] = useState(['Dashboard']);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Get navigation items based on user role
  const getNavigationItems = useCallback(() => {
    if (!user) return [];
    
    switch (user.role) {
      case USER_ROLES.ADMIN:
        return NAVIGATION_ITEMS.ADMIN;
      case USER_ROLES.WAZIRI:
        return NAVIGATION_ITEMS.WAZIRI;
      default:
        return NAVIGATION_ITEMS.ADMIN; // Default to admin items
    }
  }, [user]);

  /**
   * Navigate to a component
   * @param {string} componentName - Name of the component to navigate to
   */
  const navigateTo = useCallback((componentName) => {
    setCurrentComponent(componentName);
    
    // Add to history if it's not the current component
    if (componentName !== currentComponent) {
      const newHistory = navigationHistory.slice(0, currentIndex + 1);
      newHistory.push(componentName);
      setNavigationHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    }
  }, [currentComponent, navigationHistory, currentIndex]);

  /**
   * Navigate back
   */
  const navigateBack = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentComponent(navigationHistory[newIndex]);
    }
  }, [currentIndex, navigationHistory]);

  /**
   * Navigate forward
   */
  const navigateForward = useCallback(() => {
    if (currentIndex < navigationHistory.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentComponent(navigationHistory[newIndex]);
    }
  }, [currentIndex, navigationHistory]);

  /**
   * Check if can go back
   */
  const canGoBack = currentIndex > 0;

  /**
   * Check if can go forward
   */
  const canGoForward = currentIndex < navigationHistory.length - 1;

  /**
   * Get current navigation item
   */
  const getCurrentNavigationItem = useCallback(() => {
    const items = getNavigationItems();
    return items.find(item => item.component === currentComponent);
  }, [currentComponent, getNavigationItems]);

  /**
   * Get breadcrumb trail
   */
  const getBreadcrumbs = useCallback(() => {
    const items = getNavigationItems();
    return navigationHistory.slice(0, currentIndex + 1).map(componentName => {
      const item = items.find(item => item.component === componentName);
      return {
        component: componentName,
        title: item?.title || componentName,
        icon: item?.icon
      };
    });
  }, [navigationHistory, currentIndex, getNavigationItems]);

  /**
   * Reset navigation to dashboard
   */
  const resetToDashboard = useCallback(() => {
    setCurrentComponent('Dashboard');
    setNavigationHistory(['Dashboard']);
    setCurrentIndex(0);
  }, []);

  return {
    // State
    currentComponent,
    navigationHistory,
    currentIndex,
    
    // Navigation methods
    navigateTo,
    navigateBack,
    navigateForward,
    
    // Navigation info
    canGoBack,
    canGoForward,
    getCurrentNavigationItem,
    getBreadcrumbs,
    getNavigationItems,
    resetToDashboard
  };
}; 