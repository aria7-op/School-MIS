import React from 'react';
import LoginScreen from '../features/auth/screens/LoginScreen';
import TeacherNavigator from '../features/teacherPortal/navigation/TeacherNavigator';
import MainLayout from '../components/layout/MainLayout';
import ParentPortal from '../features/parentPortal/ParentPortal';
import { useAuth } from '../contexts/AuthContext';
import { SuperDuperAdminPortal } from '../features/superduperadmin';

const Navigation = () => {
  const { userToken, loading, user } = useAuth();

  // Debug logging
  // console.log('🧭 Navigation Debug:', {
  //   loading,
  //   hasToken: !!userToken,
  //   hasUser: !!user,
  //   userRole: user?.role,
  //   isAuthenticated: !!user && !!userToken
  // });

  const normalizeRoleValue = (value?: string | null) =>
    value ? value.replace(/-/g, '_').toUpperCase() : undefined;

  const normalizedRole = normalizeRoleValue(user?.role);
  const normalizedOriginalRole = normalizeRoleValue(user?.originalRole ?? user?.role);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-lg text-gray-600">Loading...</p>
      </div>
    );
  }

  // Simple conditional rendering instead of React Navigation
  if (!userToken) {
    return <LoginScreen />;
  }

  // Actual role checks based on original backend role
  if (normalizedOriginalRole === 'TEACHER') {
    // console.log('🧭 Original role TEACHER -> treat as admin (MainLayout)');
    return <MainLayout />;
  }

  if (normalizedOriginalRole === 'SCHOOL_ADMIN') {
    // console.log('🧭 Original role SCHOOL_ADMIN -> Teacher Portal');
    return <TeacherNavigator />;
  }

  // Route based on mapped/normalized role
  if (normalizedRole === 'SUPER_DUPER_ADMIN') {
    // console.log('🧭 Redirecting SUPER_DUPER_ADMIN to Super Duper Admin Portal');
    return <SuperDuperAdminPortal />;
  }

  // SUPER_ADMIN gets full access to MainLayout with all features including Superadmin portal
  if (normalizedRole === 'SUPER_ADMIN') {
    // console.log('🧭 Redirecting SUPER_ADMIN to MainLayout (Full Admin Interface + Superadmin Portal)');
    return <MainLayout />;
  }

  if (normalizedRole === 'SCHOOL_ADMIN') {
    // console.log('🧭 Redirecting mapped SCHOOL_ADMIN to MainLayout');
    return <MainLayout />;
  }

  if (normalizedRole === 'TEACHER') {
    // console.log('🧭 Redirecting TEACHER to MainLayout (Admin Interface)');
    return <MainLayout />;
  }

  if (normalizedRole === 'HRM') {
    // console.log('🧭 Redirecting HRM to MainLayout');
    return <MainLayout />;
  }

  // Redirect parents to the parent portal
  if (normalizedRole === 'PARENT') {
    // console.log('🧭 Redirecting PARENT to ParentPortal');
    return <ParentPortal />;
  }

  // For other roles, show login screen for now
  return <MainLayout />;
};


export default Navigation;
