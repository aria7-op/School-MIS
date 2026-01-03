import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PaymentManagement = () => {
  const { user, hasPermission } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate loading payments data
    const loadPayments = async () => {
      try {
        setLoading(true);
        // Mock data - replace with actual API call
        const mockPayments = [
          {
            id: 1,
            vehicleNumber: 'ABC-123',
            amount: 25000,
            method: 'cash',
            date: '2024-01-15 16:45',
            status: 'completed',
            operator: 'عامل اول'
          },
          {
            id: 2,
            vehicleNumber: 'XYZ-789',
            amount: 15000,
            method: 'card',
            date: '2024-01-15 14:30',
            status: 'completed',
            operator: 'عامل دوم'
          }
        ];
        
        setTimeout(() => {
          setPayments(mockPayments);
          setLoading(false);
        }, 1000);
      } catch (err) {
        setError('خطا در بارگذاری پرداخت‌ها');
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  const getMethodBadge = (method) => {
    const methodClasses = {
      cash: 'bg-green-100 text-green-800',
      card: 'bg-blue-100 text-blue-800',
      online: 'bg-purple-100 text-purple-800'
    };
    
    const methodText = {
      cash: 'نقدی',
      card: 'کارت',
      online: 'آنلاین'
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${methodClasses[method]}`}>
        {methodText[method]}
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

  if (!hasPermission('payment.manage')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">دسترسی محدود</h3>
          <p className="text-gray-600">شما مجوز مدیریت پرداخت‌ها را ندارید</p>
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
          <h2 className="text-2xl font-bold text-gray-900">مدیریت عواید</h2>
          <p className="text-gray-600 mt-1">مدیریت پرداخت‌ها و عواید پارکینگ</p>
        </div>
        <button className="btn-primary">
          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          گزارش جدید
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

      {/* Payments Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">لیست پرداخت‌ها</h3>
        </div>
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">شماره موتر</th>
                  <th className="table-header-cell">مبلغ</th>
                  <th className="table-header-cell">روش پرداخت</th>
                  <th className="table-header-cell">تاریخ</th>
                  <th className="table-header-cell">وضعیت</th>
                  <th className="table-header-cell">عامل</th>
                  <th className="table-header-cell">عملیات</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {payments.map((payment) => (
                  <tr key={payment.id} className="table-row">
                    <td className="table-cell font-medium text-gray-900">{payment.vehicleNumber}</td>
                    <td className="table-cell">{payment.amount.toLocaleString()} تومان</td>
                    <td className="table-cell">{getMethodBadge(payment.method)}</td>
                    <td className="table-cell">{payment.date}</td>
                    <td className="table-cell">{getStatusBadge(payment.status)}</td>
                    <td className="table-cell">{payment.operator}</td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button className="btn-secondary text-xs">جزئیات</button>
                        <button className="btn-danger text-xs">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {payments.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">هیچ پرداختی یافت نشد</h3>
          <p className="text-gray-600">هیچ پرداختی در سیستم ثبت نشده است</p>
        </div>
      )}
    </div>
  );
};

export default PaymentManagement; 