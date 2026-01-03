import React, { useState, useEffect } from 'react';
import { IoEye, IoEyeOff, IoPersonOutline, IoLogInOutline, IoSchoolOutline } from 'react-icons/io5';
import { LuMoveRight } from 'react-icons/lu';
import { useAuth } from '../../../contexts/AuthContext';
import secureApiService from '../../../services/secureApiService';

// Background image for the login screen
const backgroundImg = 'https://applescoop.org/image/wallpapers/ipad/39555922105788908-33106927849764161.jpg';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, isAuthenticated, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // console.log('🔄 User is authenticated, redirecting...', { user: user.role });
      // The Navigation component will handle the actual redirect based on role
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // console.log('🔐 Login form submitted:', { username, password: '***' });
    
    // Check if login function exists
    if (!login) {
      console.error('❌ Login function is not available');
      return;
    }
    
    setLoading(true);
    try {
      // console.log('🔐 Calling login function...');
      const result = await login(username, password);
      // console.log('🔐 Login result:', result);
      
      if (result.success) {
        // console.log('✅ Login successful!');
      } else {
        // console.log('❌ Login failed:', result.error);
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      console.error('❌ Login failed with error:', error);
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTempReset = async () => {
    if (!resetUserId || !resetPassword) {
      setResetMessage('User ID and password are required');
      return;
    }

    setResetting(true);
    setResetMessage(null);
    try {
      const response = await secureApiService.api.post('/users/temp-reset-password', {
        userId: Number(resetUserId),
        password: resetPassword,
      });

      if (response?.data?.success) {
        setResetMessage('Temporary password reset successfully. Use the new password above to log in.');
      } else {
        setResetMessage(response?.data?.error || 'Failed to reset password');
      }
    } catch (resetError: any) {
      const apiError = resetError?.response?.data?.error || resetError?.message || 'Failed to reset password';
      setResetMessage(apiError);
      console.error('Temporary password reset failed:', resetError);
    } finally {
      setResetting(false);
    }
  };

  // Don't render login screen if user is authenticated
  if (isAuthenticated && user) {
    return null; // Navigation component will handle the redirect
  }

  return (
<div
  className="w-full min-h-screen flex items-center justify-center px-4 py-6 sm:px-6 md:px-10 lg:px-20 bg-cover bg-center"
  style={{ backgroundImage: `url('${backgroundImg}')` }}
>
  <div className="w-full max-w-md sm:max-w-lg md:max-w-[800px] bg-white/10 backdrop-blur-lg flex flex-col md:flex-row items-stretch shadow-2xl rounded-lg overflow-hidden border border-white/20">
    {/* Left informational panel – hidden on small screens */}
    <div className="hidden md:flex md:w-[380px] lg:w-[400px] bg-[#121214a3] items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="p-4 bg-white/10 rounded-full">
          <IoSchoolOutline className="w-16 h-16 text-white" />
        </div>
        <h1 className="text-white text-xl font-bold">
          School Management System
        </h1>
      </div>
    </div>

    {/* Right form */}
    <form
      onSubmit={handleSubmit}
      className="w-full p-5 sm:p-8 flex flex-col gap-4 bg-[#1515ff00] md:bg-transparent z-20"
    >
      <div className="text-center mb-2 sm:mb-4">
        <h1 className="font-bold text-xl sm:text-2xl text-white flex items-center justify-center gap-2">
          <div className="p-2 bg-white/10 rounded-full">
            <IoLogInOutline className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          WELCOME BACK
        </h1>
        <p className="text-xs sm:text-sm text-white/80">
          Sign in to your account
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-md text-xs sm:text-sm text-center mb-2">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Username */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <label
            htmlFor="username"
            className="text-white text-sm sm:text-base flex items-center gap-2"
          >
            <IoPersonOutline className="w-4 h-4" />
            Username
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <IoPersonOutline className="w-5 h-5 text-gray-600" />
            </div>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your username or email address"
              disabled={loading || authLoading}
              className="bg-white border border-white/30 text-gray-900 w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5 sm:gap-2">
          <label
            htmlFor="password"
            className="text-white text-sm sm:text-base flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Enter your password"
              disabled={loading || authLoading}
              className="bg-white border border-white/30 text-gray-900 w-full h-11 sm:h-12 pl-11 sm:pl-12 pr-11 sm:pr-12 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-gray-700 hover:text-blue-600 transition-colors z-10"
              disabled={loading || authLoading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <IoEye className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <IoEyeOff className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex flex-row items-center gap-2 pl-0 sm:pl-1 mt-1 text-white text-xs sm:text-sm">
          <input
            type="checkbox"
            id="remember"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading || authLoading}
            className="h-4 w-4"
          />
          <label htmlFor="remember">Remember me</label>
        </div>

        {/* (Your reset block can stay commented here if needed) */}
      </div>

      <button
        type="submit"
        disabled={loading || authLoading}
        className="font-bold py-2.5 sm:py-3 bg-[#232478] text-white mt-3 cursor-pointer rounded-md hover:bg-[#0f1056] hover:shadow-xl transition-all duration-300 flex flex-row items-center gap-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#232478] text-sm sm:text-base"
      >
        <span>{loading || authLoading ? 'Signing in...' : 'Login'}</span>
        <LuMoveRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </form>
  </div>
</div>
  );
};

export default LoginScreen;