import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import TeacherNotifications from '../components/TeacherNotifications';
import NotificationCenter from '../../../components/NotificationCenter';

// Import teacher screens
import TeacherDashboard from '../screens/TeacherDashboard';
import ClassManagement from '../screens/ClassManagement';
import AttendanceManagement from '../screens/AttendanceManagement';
import AssignmentManagement from '../screens/AssignmentManagement';
import ProfileScreen from '../../../components/ProfileScreen';
import TeacherSuggestionComplaintBox from '../components/TeacherSuggestionComplaintBox';
import TeacherGradeEntryScreen from '../../gradeManagement/screens/TeacherGradeEntryScreen';

// Simple icon components for web
const Icon = ({ name, size = 24, color = '#666' }: { name: string; size?: number; color?: string }) => (
  <span style={{ fontSize: size, color }} className="material-icons">
    {name}
  </span>
);

const TeacherGradesTab: React.FC = () => (
  <TeacherGradeEntryScreen defaultView="grades" />
);

// Main Teacher Tab Navigator
const TeacherNavigator: React.FC = () => {
  const { user, logout } = useAuth();
  const { i18n, t } = useTranslation();

  // Tab configuration with translations
  const tabs = [
    { id: 'dashboard', label: t('teacherPortal.navigation.dashboard'), icon: 'home', component: TeacherDashboard },
    { id: 'classes', label: t('teacherPortal.navigation.classes'), icon: 'school', component: ClassManagement },
    { id: 'attendance', label: t('teacherPortal.navigation.attendance'), icon: 'calendar_today', component: AttendanceManagement },
    { id: 'assignments', label: t('teacherPortal.navigation.assignments'), icon: 'edit_note', component: AssignmentManagement },
    { id: 'grades', label: t('teacherPortal.navigation.exams'), icon: 'description', component: TeacherGradesTab },
    { id: 'suggestions', label: t('teacherPortal.navigation.suggestions'), icon: 'chat', component: TeacherSuggestionComplaintBox },
    { id: 'profile', label: t('teacherPortal.navigation.profile'), icon: 'person', component: ProfileScreen },
  ];
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Verify user is a teacher or school admin
  if (!user || (user.role !== 'SCHOOL_ADMIN' && user.role !== 'TEACHER')) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <h2>{t('teacherPortal.auth.accessDenied')}</h2>
        <p>{t('teacherPortal.auth.accessDeniedMessage')}</p>
      </div>
    );
  }

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || TeacherDashboard;
  
  // Pass props to components that need them
  const renderActiveComponent = () => {
    const Component = ActiveComponent;
    if (Component === TeacherSuggestionComplaintBox) {
      return <TeacherSuggestionComplaintBox teacherId={user?.id?.toString()} />;
    }
    return <Component />;
  };

  // Language options
  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fa-AF', name: 'Dari', flag: '🇦🇫' },
    { code: 'ps-AF', name: 'Pashto', flag: '🇦🇫' }
  ];

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'en' ? 'ltr' : 'rtl';
  };

  const getCurrentLanguage = () => {
    const current = languages.find(lang => lang.code === i18n.resolvedLanguage);
    return current || languages[0];
  };

  return (
    <div className="flex flex-col h-screen pb-20 lg:pb-0" dir={i18n.resolvedLanguage === 'en' ? 'ltr' : 'rtl'}>
      {/* Mobile Header - Only visible on mobile */}
      <div className="lg:hidden sticky top-0 z-50 bg-white border-b border-gray-200 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
        <div className="flex justify-between items-center">
          {/* Left: App Title */}
          <div className="flex items-center flex-1 min-w-0 gap-2 sm:gap-2.5">
            <Icon name="school" size={18} color="#3B82F6" className="flex-shrink-0 sm:text-xl" />
            <h1 className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
              {t('teacherPortal.header.title')}
            </h1>
          </div>
          
          {/* Right: Language and Notifications */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Language Selector - Compact on mobile */}
            <div className="relative">
              <select
                value={i18n.resolvedLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-300 rounded-md px-1.5 sm:px-2 py-1 pr-5 sm:pr-6 text-[10px] sm:text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[50px] sm:min-w-[70px]"
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.flag} {language.name.substring(0, 3)}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-gray-500">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Refresh Button - Compact */}
            <button 
              onClick={() => setRefreshKey((k) => k + 1)} 
              className="p-1 sm:p-1.5 rounded-md bg-gray-50 border border-gray-300 text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
              aria-label="Refresh"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Real-time Notification Center - Mobile optimized */}
            <div className="relative">
              <NotificationCenter user={user} isMobile={true} />
            </div>
            
            {/* Logout Button - Compact */}
            <button
              onClick={logout}
              className="p-1 sm:p-1.5 rounded-md bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 active:bg-red-200 transition-colors touch-manipulation"
              title={t('teacherPortal.common.logout')}
            >
              <Icon name="logout" size={14} color="#dc2626" className="sm:text-base" />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar - Mobile/Tablet: Bottom, Desktop: Top */}
      <div className="fixed bottom-0 left-0 right-0 lg:top-0 lg:bottom-auto bg-white border-t lg:border-t-0 lg:border-b border-gray-200 px-2 py-2 lg:px-5 lg:py-3 overflow-x-auto z-50 shadow-lg lg:shadow-sm">
        <div className="flex justify-between items-center w-full">
          {/* Language Selector and Notification Button - Only on Desktop */}
          <div className="hidden lg:flex gap-3 items-center lg:order-3">
            {/* Language Selector Dropdown */}
            <div className="relative">
              <select
                value={i18n.resolvedLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer shadow-sm transition-all duration-200 min-w-[120px]"
                title={t('teacherPortal.common.selectLanguage')}
              >
                {languages.map((language) => (
                  <option key={language.code} value={language.code}>
                    {language.flag} {language.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Refresh Button */}
            <button 
              onClick={() => setRefreshKey((k) => k + 1)} 
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-50 border border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-sm"
              aria-label="Refresh"
              title="Refresh"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            {/* Real-time Notification Center - Desktop */}
            <div className="relative">
              <NotificationCenter user={user} isMobile={false} />
            </div>
            
            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 border border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 transition-all duration-200 shadow-sm"
              title={t('teacherPortal.common.logout')}
            >
              <Icon name="logout" size={20} color="#dc2626" />
            </button>
          </div>
          
          {/* Main Navigation Tabs */}
          <div className="flex order-2 w-full justify-around sm:justify-center sm:gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex flex-col items-center justify-center
                  px-1 py-2 sm:px-2 lg:px-4 lg:py-3
                  flex-1 sm:flex-none sm:min-w-[60px] lg:min-w-[80px]
                  text-[9px] sm:text-[10px] lg:text-xs font-semibold
                  rounded-lg mx-0.5 lg:mx-2
                  transition-all duration-200
                  touch-manipulation
                  ${activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-500 hover:text-gray-700 active:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <Icon 
                    name={tab.icon} 
                    size={18} 
                    color={activeTab === tab.id ? '#2563eb' : '#6b7280'} 
                  />
                  <span className="text-center leading-tight hidden sm:block">{tab.label}</span>
                  <span className="text-center leading-tight sm:hidden text-[8px]">{tab.label.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
          
          {/* Empty div for layout balance */}
          <div className="hidden lg:block w-32 lg:order-1"></div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto pt-0 lg:pt-16">
        <div className="min-h-full" key={`${activeTab}-${refreshKey}`}>
          {renderActiveComponent()}
        </div>
      </div>

      {/* Teacher Notifications Modal */}
      {showNotifications && (
        <TeacherNotifications onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
};

export default TeacherNavigator;