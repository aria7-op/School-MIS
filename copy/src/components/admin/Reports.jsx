import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Reports = () => {
  const { user, hasPermission } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading reports data
    const loadReports = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockReports = [
          {
            id: 1,
            title: 'گزارش روزانه',
            type: 'daily',
            date: '2024-01-15',
            status: 'completed',
            totalVehicles: 45,
            totalRevenue: 1250000
          },
          {
            id: 2,
            title: 'گزارش هفتگی',
            type: 'weekly',
            date: '2024-01-08 تا 2024-01-14',
            status: 'completed',
            totalVehicles: 320,
            totalRevenue: 8500000
          }
        ];
        
        setTimeout(() => {
          setReports(mockReports);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('خطا در بارگذاری گزارشات');
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const getTypeBadge = (type) => {
    const typeClasses = {
      daily: 'bg-blue-100 text-blue-800',
      weekly: 'bg-green-100 text-green-800',
      monthly: 'bg-purple-100 text-purple-800'
    };
    
    const typeText = {
      daily: 'روزانه',
      weekly: 'هفتگی',
      monthly: 'ماهانه'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeClasses[type]}`}>
        {typeText[type]}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    const statusText = {
      completed: 'تکمیل شده',
      pending: 'در انتظار',
      failed: 'ناموفق'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status]}`}>
        {statusText[status]}
      </span>
    );
  };

  if (!hasPermission('reports.view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">دسترسی محدود</h3>
          <p className="text-gray-600">شما مجوز مشاهده گزارشات را ندارید</p>
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
          <h2 className="text-2xl font-bold text-gray-900">گزارشات</h2>
          <p className="text-gray-600 mt-1">مدیریت و مشاهده گزارشات پارکینگ</p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ایجاد گزارش جدید
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

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="card hover:shadow-md transition-shadow duration-200">
            <div className="card-header">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{report.date}</p>
                </div>
                <div className="flex flex-col space-y-1">
                  {getTypeBadge(report.type)}
                  {getStatusBadge(report.status)}
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">تعداد موترها:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {report.totalVehicles.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">کل عواید:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {report.totalRevenue.toLocaleString()} تومان
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button className="flex-1 btn-secondary text-xs">مشاهده</button>
                <button className="flex-1 btn-primary text-xs">دانلود</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {reports.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ گزارشی یافت نشد</h3>
          <p className="text-gray-600">برای شروع، گزارش جدیدی ایجاد کنید</p>
        </div>
      )}
    </div>
  );
};

export default Reports; 