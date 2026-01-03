import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import secureApiService from '../services/secureApiService';

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { profile, isLoading, error, refetch } = useProfile();

  // Helper function to calculate time difference
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSeconds < 60) return t('profile.justNow');
    if (diffInMinutes < 60) return `${diffInMinutes} ${diffInMinutes > 1 ? t('profile.minutesAgo') : t('profile.minuteAgo')}`;
    if (diffInHours < 24) return `${diffInHours} ${diffInHours > 1 ? t('profile.hoursAgo') : t('profile.hourAgo')}`;
    if (diffInDays < 7) return `${diffInDays} ${diffInDays > 1 ? t('profile.daysAgo') : t('profile.dayAgo')}`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} ${Math.floor(diffInDays / 7) > 1 ? t('profile.weeksAgo') : t('profile.weekAgo')}`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} ${Math.floor(diffInDays / 30) > 1 ? t('profile.monthsAgo') : t('profile.monthAgo')}`;
    return `${Math.floor(diffInDays / 365)} ${Math.floor(diffInDays / 365) > 1 ? t('profile.yearsAgo') : t('profile.yearAgo')}`;
  };

  // Helper function to swap role display
  const getDisplayRole = (actualRole: string) => {
    if (actualRole === 'SCHOOL_ADMIN') return 'TEACHER';
    if (actualRole === 'TEACHER') return 'SCHOOL_ADMIN';
    return actualRole; // Return original role for any other values
  };
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showTwoFactorAuth, setShowTwoFactorAuth] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'sms' | 'email' | 'app'>('sms');
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorErrors, setTwoFactorErrors] = useState<{[key: string]: string}>({});
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: '',
    department: '',
    joinDate: '',
    lastLogin: ''
  });

  // Update profile data when profile is fetched
  useEffect(() => {
    if (profile) {
      setProfileData({
        username: profile.username || user?.username || '',
        email: profile.username || user?.email || '', // Using username as email since API doesn't have email field
        firstName: profile.firstName || user?.firstName || '',
        lastName: profile.lastName || user?.lastName || '',
        phone: profile.phone || (user as any)?.phone || '',
        role: getDisplayRole(profile.role || user?.role || ''),
        department: profile.school?.name || (user as any)?.department || '',
        joinDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ((user as any)?.createdAt ? new Date((user as any)?.createdAt).toLocaleDateString() : ''),
        lastLogin: profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : (user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '')
      });
    }
  }, [profile, user]);

  const handleSave = () => {
    // Here you would typically make an API call to update the profile
    console.log('Saving profile:', profileData);
    setIsEditing(false);
    // Show success message
  };

  const handleCancel = () => {
    // Reset to original data from profile or user
    if (profile) {
    setProfileData({
        username: profile.username || user?.username || '',
        email: profile.username || user?.email || '', // Using username as email since API doesn't have email field
        firstName: profile.firstName || user?.firstName || '',
        lastName: profile.lastName || user?.lastName || '',
        phone: profile.phone || (user as any)?.phone || '',
        role: getDisplayRole(profile.role || user?.role || ''),
        department: profile.school?.name || (user as any)?.department || '',
        joinDate: profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : ((user as any)?.createdAt ? new Date((user as any)?.createdAt).toLocaleDateString() : ''),
        lastLogin: profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : (user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : '')
      });
    }
    setIsEditing(false);
  };

  const validatePassword = () => {
    const errors: {[key: string]: string} = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = t('profile.passwordRequired');
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = t('profile.newPasswordRequired');
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = t('profile.passwordMinLength');
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = t('profile.confirmPasswordRequired');
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('profile.passwordsDoNotMatch');
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    
    setIsChangingPassword(true);
    
    try {
      // Make API call to change password
      const response = await secureApiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      // Reset form and close modal
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      setShowChangePassword(false);
      
      // Show success message
      alert(t('profile.passwordChangedSuccess'));
      
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordErrors({ general: t('profile.passwordChangeError') });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setPasswordErrors({});
    setShowChangePassword(false);
  };

  const validateTwoFactorCode = () => {
    const errors: {[key: string]: string} = {};
    
    if (!twoFactorCode) {
      errors.code = t('profile.twoFactorCodeRequired');
    } else if (twoFactorCode.length !== 6) {
      errors.code = t('profile.twoFactorCodeLength');
    }
    
    setTwoFactorErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSetupTwoFactor = async () => {
    if (!validateTwoFactorCode()) return;
    
    setIsSettingUp2FA(true);
    
    try {
      // Here you would typically make an API call to setup 2FA
      console.log('Setting up 2FA:', {
        method: twoFactorMethod,
        code: twoFactorCode
      });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reset form and close modal
      setTwoFactorCode('');
      setTwoFactorErrors({});
      setShowTwoFactorAuth(false);
      
      // Show success message
      alert(t('profile.twoFactorSetupSuccess'));
      
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      setTwoFactorErrors({ general: t('profile.twoFactorSetupError') });
    } finally {
      setIsSettingUp2FA(false);
    }
  };

  const handleCancelTwoFactor = () => {
    setTwoFactorCode('');
    setTwoFactorErrors({});
    setShowTwoFactorAuth(false);
  };

  const sendTwoFactorCode = async () => {
    try {
      // Here you would typically make an API call to send the code
      console.log('Sending 2FA code via:', twoFactorMethod);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert(t('profile.twoFactorCodeSent'));
      
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      setTwoFactorErrors({ general: t('profile.twoFactorCodeSendError') });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.errorLoading')}</h2>
          <p className="text-gray-600 mb-4">{error.message || t('profile.errorMessage')}</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('common.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-1 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-300 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profileData.firstName} {profileData.lastName}
                </h1>
                <p className="text-gray-600">{profileData.email}</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 mt-2">
                  {profileData.role}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {isEditing && (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    {t('common.save')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {t('profile.personalInfo')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.firstName')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.firstName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.lastName')}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.lastName}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.email')}
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profileData.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('profile.accountInfo')}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.username')}
                </label>
                <p className="text-gray-900">{profileData.username}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.role')}
                </label>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                  {profileData.role}
                </div>
              </div>
              
              
              {profile?.school && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('profile.school')}
                </label>
                  <p className="text-gray-900">{profile.school.name} ({profile.school.shortName})</p>
              </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.joinDate')}
                </label>
                <p className="text-gray-900">{profileData.joinDate}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.lastLogin')}
                </label>
                <p className="text-gray-900">{profileData.lastLogin}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {t('profile.quickStats')}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{t('profile.totalSessions')}</span>
                <span className="text-lg font-semibold text-gray-900">
                  {profile?.totalSessions || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">{t('profile.lastActive')}</span>
                <span className="text-sm text-gray-900">
                  {profile?.lastLogin ? getTimeAgo(profile.lastLogin) : 'N/A'}
                </span>
          </div>

              {profile?.createdAt && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">{t('profile.accountAge')}</span>
                  <span className="text-sm text-gray-900">
                    {(() => {
                      const createdAt = new Date(profile.createdAt);
                      const now = new Date();
                      const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffInDays < 30) return `${diffInDays} ${t('profile.days')}`;
                      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} ${t('profile.months')}`;
                      return `${Math.floor(diffInDays / 365)} ${t('profile.years')}`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Security Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {t('profile.security')}
          </h2>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setShowChangePassword(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              {t('profile.changePassword')}
            </button>
            <button 
              onClick={() => setShowTwoFactorAuth(true)}
              className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {t('profile.twoFactorAuth')}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('profile.changePassword')}
              </h3>
              <button
                onClick={handleCancelPasswordChange}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {passwordErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{passwordErrors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.currentPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    passwordErrors.currentPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('profile.enterCurrentPassword')}
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.newPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    passwordErrors.newPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('profile.enterNewPassword')}
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.confirmNewPassword')}
                </label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    passwordErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={t('profile.confirmNewPassword')}
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelPasswordChange}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isChangingPassword}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('profile.changing')}
                  </>
                ) : (
                  t('profile.changePassword')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Factor Authentication Modal */}
      {showTwoFactorAuth && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('profile.twoFactorAuth')}
              </h3>
              <button
                onClick={handleCancelTwoFactor}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {twoFactorErrors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{twoFactorErrors.general}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.selectMethod')}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="twoFactorMethod"
                      value="sms"
                      checked={twoFactorMethod === 'sms'}
                      onChange={(e) => setTwoFactorMethod(e.target.value as 'sms')}
                      className="text-orange-600"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{t('profile.smsMethod')}</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="twoFactorMethod"
                      value="email"
                      checked={twoFactorMethod === 'email'}
                      onChange={(e) => setTwoFactorMethod(e.target.value as 'email')}
                      className="text-orange-600"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{t('profile.emailMethod')}</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="twoFactorMethod"
                      value="app"
                      checked={twoFactorMethod === 'app'}
                      onChange={(e) => setTwoFactorMethod(e.target.value as 'app')}
                      className="text-orange-600"
                    />
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-700">{t('profile.appMethod')}</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('profile.verificationCode')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-lg tracking-widest ${
                      twoFactorErrors.code ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="000000"
                    maxLength={6}
                    dir="ltr"
                    style={{ textAlign: 'center' }}
                  />
                  <button
                    onClick={sendTwoFactorCode}
                    className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                  >
                    {t('profile.sendCode')}
                  </button>
                </div>
                {twoFactorErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{twoFactorErrors.code}</p>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  {twoFactorMethod === 'sms' && t('profile.smsInstructions')}
                  {twoFactorMethod === 'email' && t('profile.emailInstructions')}
                  {twoFactorMethod === 'app' && t('profile.appInstructions')}
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelTwoFactor}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                disabled={isSettingUp2FA}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSetupTwoFactor}
                disabled={isSettingUp2FA}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSettingUp2FA ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('profile.settingUp')}
                  </>
                ) : (
                  t('profile.setup2FA')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
