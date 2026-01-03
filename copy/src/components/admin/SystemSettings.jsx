import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SystemSettings = () => {
  const { user, hasPermission } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simulate loading settings data
    const loadSettings = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockSettings = {
          systemName: 'سیستم مدیریت پارکینگ',
          timezone: 'Asia/Kabul',
          language: 'fa',
          currency: 'AFN',
          maxSessionDuration: 24,
          autoLogout: true,
          notifications: {
            email: true,
            sms: false,
            push: true
          },
          security: {
            passwordMinLength: 8,
            requireSpecialChars: true,
            sessionTimeout: 30
          }
        };
        
        setTimeout(() => {
          setSettings(mockSettings);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('خطا در بارگذاری تنظیمات');
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleNestedSettingChange = (parentKey, childKey, value) => {
    setSettings(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Show success message
      alert('تنظیمات با موفقیت ذخیره شد');
    } catch (err) {
      setError('خطا در ذخیره تنظیمات');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('system.manage')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">دسترسی محدود</h3>
          <p className="text-gray-600">شما مجوز مدیریت تنظیمات سیستم را ندارید</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">تنظیمات سیستم</h2>
          <p className="text-gray-600 mt-1">مدیریت تنظیمات کلی سیستم</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="btn-primary"
        >
          {saving ? (
            <>
              <div className="loading-spinner w-4 h-4 ml-2"></div>
              در حال ذخیره...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              ذخیره تنظیمات
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="mr-3">
              <h3 className="text-sm font-medium text-red-800">خطا</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">تنظیمات عمومی</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نام سیستم
              </label>
              <input
                type="text"
                value={settings.systemName || ''}
                onChange={(e) => handleSettingChange('systemName', e.target.value)}
                className="input"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                منطقه زمانی
              </label>
              <select
                value={settings.timezone || ''}
                onChange={(e) => handleSettingChange('timezone', e.target.value)}
                className="input"
              >
                <option value="Asia/Kabul">کابل (UTC+4:30)</option>
                <option value="Asia/Tehran">تهران (UTC+3:30)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                زبان
              </label>
              <select
                value={settings.language || ''}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="input"
              >
                <option value="fa">فارسی</option>
                <option value="en">English</option>
                <option value="ps">پښتو</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ارز
              </label>
              <select
                value={settings.currency || ''}
                onChange={(e) => handleSettingChange('currency', e.target.value)}
                className="input"
              >
                <option value="AFN">افغانی (AFN)</option>
                <option value="USD">دالر (USD)</option>
                <option value="EUR">یورو (EUR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">تنظیمات امنیتی</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حداقل طول رمز عبور
              </label>
              <input
                type="number"
                value={settings.security?.passwordMinLength || 8}
                onChange={(e) => handleNestedSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                className="input"
                min="6"
                max="20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                مدت زمان نشست (دقیقه)
              </label>
              <input
                type="number"
                value={settings.security?.sessionTimeout || 30}
                onChange={(e) => handleNestedSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                className="input"
                min="5"
                max="120"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.security?.requireSpecialChars || false}
                onChange={(e) => handleNestedSettingChange('security', 'requireSpecialChars', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="mr-2 block text-sm text-gray-900">
                نیاز به کاراکترهای خاص در رمز عبور
              </label>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">تنظیمات اعلان‌ها</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications?.email || false}
                onChange={(e) => handleNestedSettingChange('notifications', 'email', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="mr-2 block text-sm text-gray-900">
                اعلان‌های ایمیل
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications?.sms || false}
                onChange={(e) => handleNestedSettingChange('notifications', 'sms', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="mr-2 block text-sm text-gray-900">
                اعلان‌های پیامک
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notifications?.push || false}
                onChange={(e) => handleNestedSettingChange('notifications', 'push', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="mr-2 block text-sm text-gray-900">
                اعلان‌های مرورگر
              </label>
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">تنظیمات جلسه</h3>
          </div>
          <div className="card-body space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حداکثر مدت جلسه (ساعت)
              </label>
              <input
                type="number"
                value={settings.maxSessionDuration || 24}
                onChange={(e) => handleSettingChange('maxSessionDuration', parseInt(e.target.value))}
                className="input"
                min="1"
                max="72"
              />
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.autoLogout || false}
                onChange={(e) => handleSettingChange('autoLogout', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="mr-2 block text-sm text-gray-900">
                خروج خودکار پس از عدم فعالیت
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 