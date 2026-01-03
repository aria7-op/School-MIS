import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Scanner Reports Component
 * Professional scanning reports and statistics interface
 */
const ScannerReports = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalScanned: 0,
    successfulScans: 0,
    failedScans: 0,
    averageScanTime: 0
  });

  // Mock data for demonstration
  useEffect(() => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setReports([
        {
          id: 1,
          plateNumber: 'ABC-123',
          timestamp: new Date('2024-01-15T10:30:00'),
          camera: 'کمره 1',
          status: 'success',
          scanTime: 2.5
        },
        {
          id: 2,
          plateNumber: 'XYZ-789',
          timestamp: new Date('2024-01-15T10:35:00'),
          camera: 'کمره 2',
          status: 'success',
          scanTime: 1.8
        },
        {
          id: 3,
          plateNumber: 'DEF-456',
          timestamp: new Date('2024-01-15T10:40:00'),
          camera: 'کمره 1',
          status: 'failed',
          scanTime: 0
        }
      ]);
      
      setStats({
        totalScanned: 150,
        successfulScans: 142,
        failedScans: 8,
        averageScanTime: 2.1
      });
      
      setLoading(false);
    }, 1000);
  }, [selectedPeriod]);

  /**
   * Get status color
   * @param {string} status - Scan status
   * @returns {string} CSS classes
   */
  const getStatusColor = (status) => {
    return status === 'success' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  /**
   * Get status text
   * @param {string} status - Scan status
   * @returns {string} Status text
   */
  const getStatusText = (status) => {
    return status === 'success' ? 'موفق' : 'ناموفق';
  };

  /**
   * Export report
   * @param {string} format - Export format
   */
  const exportReport = (format) => {
    // Export logic here
    console.log(`Exporting report in ${format} format`);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">گزارشات اسکن</h2>
          <div className="flex space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="today">امروز</option>
              <option value="week">هفته</option>
              <option value="month">ماه</option>
              <option value="year">سال</option>
            </select>
            <button
              onClick={() => exportReport('pdf')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <i className="bi bi-download mr-1"></i>
              دانلود PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              <i className="bi bi-file-earmark-excel mr-1"></i>
              دانلود Excel
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <i className="bi bi-camera text-blue-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">کل اسکن‌ها</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalScanned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <i className="bi bi-check-circle text-green-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">اسکن‌های موفق</p>
              <p className="text-2xl font-bold text-gray-900">{stats.successfulScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100">
              <i className="bi bi-x-circle text-red-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">اسکن‌های ناموفق</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failedScans}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <i className="bi bi-clock text-yellow-600 text-xl"></i>
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600">میانگین زمان اسکن</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScanTime}s</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">گزارشات اخیر</h3>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">در حال بارگذاری...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    شماره پلیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    تاریخ و زمان
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    کمره
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    وضعیت
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    زمان اسکن
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.plateNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.timestamp.toLocaleString('fa-IR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.camera}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                        {getStatusText(report.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {report.scanTime > 0 ? `${report.scanTime}s` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">
                        مشاهده
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        دانلود
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">نمودار عملکرد</h3>
        <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">نمودار عملکرد در اینجا نمایش داده می‌شود</p>
        </div>
      </div>
    </div>
  );
};

export default ScannerReports; 