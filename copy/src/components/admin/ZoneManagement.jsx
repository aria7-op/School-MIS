import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ZoneManagement = () => {
  const { user, hasPermission } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading zones data
    const loadZones = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockZones = [
          {
            id: 1,
            name: 'منطقه A',
            hourlyRate: 5000,
            dailyRate: 50000,
            capacity: 50,
            occupied: 35,
            status: 'active'
          },
          {
            id: 2,
            name: 'منطقه B',
            hourlyRate: 3000,
            dailyRate: 30000,
            capacity: 30,
            occupied: 20,
            status: 'active'
          }
        ];
        
        setTimeout(() => {
          setZones(mockZones);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('خطا در بارگذاری مناطق');
        setLoading(false);
      }
    };

    loadZones();
  }, []);

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      active: 'فعال',
      inactive: 'غیرفعال'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  if (!hasPermission('zone.manage')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">دسترسی محدود</h3>
          <p className="text-gray-600">شما مجوز مدیریت مناطق را ندارید</p>
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
          <h2 className="text-2xl font-bold text-gray-900">مدیریت نرخ مناطق</h2>
          <p className="text-gray-600 mt-1">مدیریت مناطق و نرخ‌های پارکینگ</p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          افزودن منطقه جدید
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

      {/* Zones Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {zones.map((zone) => (
          <div key={zone.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="card-header">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">ظرفیت: {zone.capacity} موتر</p>
                </div>
                {getStatusBadge(zone.status)}
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">نرخ ساعتی:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {zone.hourlyRate.toLocaleString()} تومان
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">نرخ روزانه:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {zone.dailyRate.toLocaleString()} تومان
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">اشغال شده:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {zone.occupied}/{zone.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(zone.occupied / zone.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button className="flex-1 btn-secondary text-xs">ویرایش</button>
                <button className="flex-1 btn-danger text-xs">حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {zones.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">🏢</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ منطقه‌ای یافت نشد</h3>
          <p className="text-gray-600">برای شروع، منطقه جدیدی اضافه کنید</p>
        </div>
      )}
    </div>
  );
};

export default ZoneManagement; 