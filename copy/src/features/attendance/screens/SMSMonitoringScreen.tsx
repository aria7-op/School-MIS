import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// import { useNavigate } from 'react-router-dom';
import { 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock, 
  FaPhoneSlash, 
  FaRedo,
  FaFilter,
  FaChartBar,
  FaDownload,
  FaRobot,
  FaUser,
  FaSignInAlt,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaPaperPlane,
  FaSpinner,
  FaArrowLeft
} from 'react-icons/fa';
import { IoIosArrowBack, IoIosArrowForward, IoIosArrowRoundBack } from "react-icons/io";
import * as ExcelJS from 'exceljs';
import secureApiService from '../../../services/secureApiService';

interface SMSRecord {
  id: string;
  attendanceId: number;
  type: 'MARK_IN' | 'MARK_OUT';
  studentId: number;
  studentName: string;
  rollNo: string;
  className: string;
  date: string;
  time: string;
  status: string;
  error: string | null;
  sentAt: string | null;
  attempts: number;
  source: 'AUTO' | 'MANUAL';
  sentBy: number | null;
  recipientPhone: string | null;
  requestId?: string;
}

interface SMSStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  noPhone: number;
  auto: number;
  manual: number;
  markIn: number;
  markOut: number;
  successRate: number;
}

const SMSMonitoringScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  // const navigate = useNavigate();
  
  // State
  const [records, setRecords] = useState<SMSRecord[]>([]);
  const [stats, setStats] = useState<SMSStats | null>(null);
  const [commonErrors, setCommonErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingRecord, setSendingRecord] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    type: 'all',
    startDate: new Date().toISOString().split('T')[0],   // Default to today
    endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split('T')[0], // Default to tomorrow
    // endDate: new Date().toISOString().split('T')[0],   // Default to today
    classId: '',
    page: 1,
    limit: 50
  });
  
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch SMS monitoring data
  const fetchSMSData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value.toString());
        }
      });

      const response = await secureApiService.api.get(`/sms-monitoring/dashboard?${params.toString()}`);
      
      if (response.data.success) {
        setRecords(response.data.data.records);
        setStats(response.data.data.stats);
        setCommonErrors(response.data.data.commonErrors || []);
        setPagination(response.data.data.pagination);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching SMS data:', error);
      alert(t('sms.monitoring.failedToLoadData'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSMSData();
  }, [filters]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSMSData();
  };

  // Send/Retry SMS for a specific record
  const sendSMSRequest = async (attendanceId: number, smsType: 'in' | 'out') => {
    return secureApiService.api.post('/attendances/resend-sms', {
      attendanceId,
      smsType
    });
  };

  const handleSendSMS = async (record: SMSRecord) => {
    try {
      setSendingRecord(record.id);
      
      const smsType = record.type === 'MARK_IN' ? 'in' : 'out';
      const response = await sendSMSRequest(record.attendanceId, smsType);

      if (response.data.success) {
      alert(t('sms.monitoring.smsSentSuccessfully'));
        await fetchSMSData(); // Refresh data
      } else {
        alert(response.data.error || response.data.message || 'Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      alert(error.response?.data?.error || error.response?.data?.message || t('sms.monitoring.failedToSendSMS'));
    } finally {
      setSendingRecord(null);
    }
  };

  const handleSendAllFailed = async () => {
    if (!records.length) {
      alert(t('sms.monitoring.noRecordsAvailable'));
      return;
    }

    const failedRecords = records.filter((record) => record.status === 'FAILED');
    if (!failedRecords.length) {
      alert(t('sms.monitoring.noFailedSMSFound'));
      return;
    }

    const confirmSend = window.confirm(t('sms.monitoring.confirmSendAllFailed', { count: failedRecords.length }));
    if (!confirmSend) {
      return;
    }

    setBulkSending(true);
    let successCount = 0;
    let failureCount = 0;

    for (const record of failedRecords) {
      try {
        const smsType = record.type === 'MARK_IN' ? 'in' : 'out';
        const response = await sendSMSRequest(record.attendanceId, smsType);
        if (response.data.success) {
          successCount += 1;
        } else {
          failureCount += 1;
        }
      } catch (error) {
        console.error('Bulk SMS send failed for record:', record, error);
        failureCount += 1;
      }
    }

    await fetchSMSData();
    setBulkSending(false);
    alert(t('sms.monitoring.bulkResendComplete', { successCount, failureCount }));
  };

  // Download Excel file with multi-language support
  const handleDownloadCSV = async () => {
    if (!records.length) {
      alert(t('sms.monitoring.noRecordsAvailableToDownload'));
      return;
    }

    try {
      const currentLanguage = i18n.language;

      // Get translated headers based on language
      const headers = {
        studentName: t('sms.monitoring.student'),
        rollNo: 'Roll No',
        className: t('sms.monitoring.class'),
        type: t('sms.monitoring.type'),
        status: t('sms.monitoring.status'),
        source: t('sms.monitoring.source'),
        date: currentLanguage.includes('en') ? 'Date' : t('sms.monitoring.dateTime'),
        time: currentLanguage.includes('en') ? 'Time' : t('sms.monitoring.dateTime'),
        sentAt: currentLanguage.includes('en') ? 'Sent At' : 'ارسال شده',
        attempts: t('sms.monitoring.attempts'),
        recipientPhone: t('sms.monitoring.phone'),
        error: currentLanguage.includes('en') ? 'Error' : 'خطا',
        requestId: currentLanguage.includes('en') ? 'Request ID' : 'ID درخواست'
      };

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(
        currentLanguage.includes('en') ? 'SMS Monitoring Report' : 
        currentLanguage.includes('fa') ? 'گزارش نظارت پیامک' : 'د SMS نظارت رپورت'
      );

      // Define columns with translated headers
      const columns = [
        { header: headers.studentName, key: 'studentName', width: 18 },
        { header: headers.rollNo, key: 'rollNo', width: 12 },
        { header: headers.className, key: 'className', width: 12 },
        { header: headers.type, key: 'type', width: 12 },
        { header: headers.status, key: 'status', width: 12 },
        { header: headers.source, key: 'source', width: 10 },
        { header: headers.date, key: 'date', width: 14 },
        { header: headers.time, key: 'time', width: 14 },
        { header: headers.sentAt, key: 'sentAt', width: 14 },
        { header: headers.attempts, key: 'attempts', width: 10 },
        { header: headers.recipientPhone, key: 'recipientPhone', width: 16 },
        { header: headers.error, key: 'error', width: 20 },
        { header: headers.requestId, key: 'requestId', width: 16 }
      ];

      worksheet.columns = columns;

      // Style header row
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' }
      };
      worksheet.getRow(1).font = {
        color: { argb: 'FFFFFFFF' },
        bold: true,
        size: 11
      };
      worksheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Add data rows
      records.forEach((record, index) => {
        const row = worksheet.addRow({
          studentName: record.studentName,
          rollNo: record.rollNo,
          className: record.className,
          type: record.type,
          status: record.status,
          source: record.source,
          date: record.date,
          time: record.time,
          sentAt: record.sentAt || '-',
          attempts: record.attempts,
          recipientPhone: record.recipientPhone || 'N/A',
          error: record.error || '-',
          requestId: (record as any).requestId || '-'
        });

        // Color code status cells
        const statusCell = row.getCell('status');
        switch (record.status) {
          case 'SENT':
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFDBEAFE' }
            };
            statusCell.font = { color: { argb: 'FF059669' }, bold: true };
            break;
          case 'FAILED':
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFECACA' }
            };
            statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
            break;
          case 'PENDING':
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFEF3C7' }
            };
            statusCell.font = { color: { argb: 'FFF59E0B' }, bold: true };
            break;
          case 'NO_PHONE':
            statusCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF3F4F6' }
            };
            statusCell.font = { color: { argb: 'FF6B7280' }, bold: true };
            break;
        }

        // Color code type cells
        const typeCell = row.getCell('type');
        if (record.type === 'MARK_IN') {
          typeCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDCEDC1' }
          };
          typeCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
        } else {
          typeCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFCDD2' }
          };
          typeCell.font = { color: { argb: 'FFC62828' }, bold: true };
        }

        // Color code source cells
        const sourceCell = row.getCell('source');
        if (record.source === 'AUTO') {
          sourceCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDBEAFE' }
          };
          sourceCell.font = { color: { argb: 'FF1E40AF' }, bold: true };
        } else {
          sourceCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEDE9FE' }
          };
          sourceCell.font = { color: { argb: 'FF6B21A8' }, bold: true };
        }

        // Alternate row background
        if (index % 2 !== 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' }
          };
        }

        // Center align status, type, source
        ['status', 'type', 'source', 'attempts'].forEach(key => {
          row.getCell(key).alignment = { horizontal: 'center', vertical: 'middle' };
        });
      });

      // Freeze header row
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];

      // Add summary sheet if stats available
      if (stats) {
        const summarySheet = workbook.addWorksheet(
          currentLanguage.includes('en') ? 'Summary' : 
          currentLanguage.includes('fa') ? 'خلاصه' : 'خلاصه'
        );
        
        const metricLabel = currentLanguage.includes('en') ? 'Metric' : 
                           currentLanguage.includes('fa') ? 'شاخص' : 'متریک';
        const countLabel = currentLanguage.includes('en') ? 'Count' : 
                          currentLanguage.includes('fa') ? 'تعداد' : 'شمیر';

        summarySheet.columns = [
          { header: metricLabel, key: 'metric', width: 20 },
          { header: countLabel, key: 'count', width: 15 }
        ];

        // Style summary header
        summarySheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1F2937' }
        };
        summarySheet.getRow(1).font = {
          color: { argb: 'FFFFFFFF' },
          bold: true,
          size: 11
        };

        const summaryData = [
          { metric: t('sms.monitoring.totalSMS'), count: stats.total, color: 'FF6B7280' },
          { metric: t('sms.monitoring.sentSuccessfully'), count: stats.sent, color: 'FF059669' },
          { metric: t('sms.monitoring.failed'), count: stats.failed, color: 'FFDC2626' },
          { metric: t('sms.monitoring.pending'), count: stats.pending, color: 'FFF59E0B' },
          { metric: t('sms.monitoring.noPhone'), count: stats.noPhone, color: 'FF6B7280' },
          { metric: t('sms.monitoring.automatic'), count: stats.auto, color: 'FF1E40AF' },
          { metric: t('sms.monitoring.manual'), count: stats.manual, color: 'FF6B21A8' },
          { metric: t('sms.monitoring.markIn'), count: stats.markIn, color: 'FF2E7D32' },
          { metric: currentLanguage.includes('en') ? 'Mark Out' : currentLanguage.includes('fa') ? 'خروج' : 'وتل', count: stats.markOut, color: 'FFC62828' },
          { metric: t('sms.monitoring.successRate'), count: stats.successRate, color: 'FF059669' }
        ];

        summaryData.forEach((item, index) => {
          const row = summarySheet.addRow({
            metric: item.metric,
            count: item.count
          });

          const countCell = row.getCell('count');
          countCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: item.color }
          };
          countCell.font = {
            color: { argb: 'FFFFFFFF' },
            bold: true,
            size: 11
          };
          countCell.alignment = { horizontal: 'center', vertical: 'middle' };

          if (index % 2 !== 0) {
            row.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF9FAFB' }
            };
          }
        });
      }

      // Generate Excel file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const langCode = currentLanguage.includes('en') ? 'en' : 
                      currentLanguage.includes('fa') ? 'dari' : 'pashto';
      link.download = `sms-monitoring-${langCode}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating Excel file:', error);
      alert(t('sms.monitoring.failedToDownload') || 'Failed to generate Excel report');
    }
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing SMS monitoring data...');
      fetchSMSData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [filters]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      SENT: 'bg-green-100 text-green-700 border-green-200',
      FAILED: 'bg-red-100 text-red-700 border-red-200',
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      NO_PHONE: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    
    const icons = {
      SENT: <FaCheckCircle className="w-3 h-3" />,
      FAILED: <FaTimesCircle className="w-3 h-3" />,
      PENDING: <FaClock className="w-3 h-3" />,
      NO_PHONE: <FaPhoneSlash className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${styles[status] || styles.PENDING}`}>
        {icons[status] || icons.PENDING}
        {status}
      </span>
    );
  };

  const getSourceBadge = (source: string) => {
    if (source === 'AUTO') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
          <FaRobot className="w-3 h-3" />
          Auto
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
          <FaUser className="w-3 h-3" />
          Manual
        </span>
      );
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'MARK_IN') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-600 border border-green-200">
          <FaSignInAlt className="w-3 h-3" />
          Mark In
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-red-50 text-red-600 border border-red-200">
          <FaSignOutAlt className="w-3 h-3" />
          Mark Out
        </span>
      );
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-col sm:flex-row gap-4">
          <div className='flex-1 w-full'>
            <h1 className="sm:text-3xl text-xl font-bold text-gray-900 mb-2 ">{t('sms.monitoring.dashboard')}</h1>
            <p className="text-gray-600 text-sm sm:text-[15px]">{t('sms.monitoring.description')}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:justify-end w-full sm:w-auto">
            {stats?.failed ? (
              <button
                onClick={handleSendAllFailed}
                disabled={bulkSending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                {bulkSending ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    {t('sms.monitoring.sendingFailedSMS')}
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="w-4 h-4" />
                    {t('sms.monitoring.sendAllFailed', { count: stats.failed })}
                  </>
                )}
              </button>
            ) : null}
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium w-full sm:w-auto justify-center"
            >
              <FaDownload className="w-4 h-4" />
              Download Excel
            </button>
            {lastUpdated && (
              <div className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-right">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      {stats && stats.pending > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-lg">
          <div className="flex items-start gap-3">
            <FaExclamationTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900">
                {t('sms.monitoring.pendingSMSFound', { count: stats.pending })}
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                {t('sms.monitoring.pendingSMSDescription')}
              </p>
              <button
                onClick={handleRefresh}
                className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                <FaRedo className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                {t('sms.monitoring.refreshToSeeUpdates')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('sms.monitoring.totalSMS')}</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaChartBar className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">{t('sms.monitoring.sentSuccessfully')}</p>
                <p className="text-2xl font-bold text-green-700">{stats.sent}</p>
                <p className="text-xs text-gray-500 mt-1">{t('sms.monitoring.successRate', { rate: stats.successRate })}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">{t('sms.monitoring.failed')}</p>
                <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
                <p className="text-xs text-gray-500 mt-1">{t('sms.monitoring.needsAttention')}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FaTimesCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-yellow-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">{t('sms.monitoring.pending')}</p>
                <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                <p className="text-xs text-gray-500 mt-1">{t('sms.monitoring.awaitingSend')}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FaClock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('sms.monitoring.noPhone')}</p>
                <p className="text-2xl font-bold text-gray-700">{stats.noPhone}</p>
                <p className="text-xs text-gray-500 mt-1">{t('sms.monitoring.missingContacts')}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <FaPhoneSlash className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Secondary Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-blue-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaRobot className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('sms.monitoring.automatic')}</p>
                <p className="text-xl font-bold text-gray-900">{stats.auto}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-purple-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FaUser className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('sms.monitoring.manual')}</p>
                <p className="text-xl font-bold text-gray-900">{stats.manual}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-green-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FaSignInAlt className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('sms.monitoring.markIn')}</p>
                <p className="text-xl font-bold text-gray-900">{stats.markIn}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FaSignOutAlt className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Mark Out</p>
                <p className="text-xl font-bold text-gray-900">{stats.markOut}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Common Errors */}
      {commonErrors.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            {t('sms.monitoring.commonErrorMessages')}
          </h2>
          <div className="space-y-3">
            {commonErrors.map((errorGroup, index) => (
              <div key={index} className="border-l-4 border-red-400 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{errorGroup.error}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {errorGroup.count} occurrence{errorGroup.count > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                    {errorGroup.count}
                  </span>
                </div>
                {errorGroup.examples && errorGroup.examples.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-medium">{t('sms.monitoring.examples')}:</span>{' '}
                    {errorGroup.examples.map((ex: any, i: number) => (
                      <span key={i}>
                        {ex.studentName} ({new Date(ex.date).toLocaleDateString()})
                        {i < errorGroup.examples.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaFilter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">{t('sms.monitoring.filters')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('sms.monitoring.status')}</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('sms.monitoring.allStatus')}</option>
              <option value="SENT">{t('sms.monitoring.send')}</option>
              <option value="FAILED">{t('sms.monitoring.faild')}</option>
              <option value="PENDING">{t('sms.monitoring.pending')}</option>
              <option value="NO_PHONE">{t('sms.monitoring.noPhone')}</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('sms.monitoring.source')}</label>
            <select
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('sms.monitoring.allSources')}</option>
              <option value="AUTO">{t('sms.monitoring.automatic')}</option>
              <option value="MANUAL">{t('sms.monitoring.manual')}</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('sms.monitoring.type')}</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{t('sms.monitoring.allType')}</option>
              <option value="in">{t('sms.monitoring.markInOnly')}</option>
              <option value="out">{t('sms.monitoring.markOutOnly')}</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('sms.monitoring.dateRange')}</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <FaRedo className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {t('sms.monitoring.refresh')}
          </button>

          <button
            onClick={() => {
              setFilters({
                status: 'all',
                source: 'all',
                type: 'all',
                startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                endDate: new Date().toISOString().split('T')[0],
                classId: '',
                page: 1,
                limit: 50
              });
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {t('sms.monitoring.resetFilters')}
          </button>
        </div>
      </div>

      {/* SMS Records Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.student')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.class')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.type')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.source')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.dateTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.attempts')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.phone')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.details')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sms.monitoring.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">{t('sms.monitoring.loadingSmsRecords')}</span>
                    </div>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                    {t('sms.monitoring.noSms')}
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{record.studentName}</div>
                        <div className="text-xs text-gray-500">Roll: {record.rollNo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(record.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getSourceBadge(record.source)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDateTime(record.time)}</div>
                      {record.sentAt && (
                      <div className="text-xs text-gray-500">{t('sms.monitoring.sent')}: {formatDateTime(record.sentAt)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                        record.attempts > 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {record.attempts}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.recipientPhone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.error && (
                        <button
                          onClick={() => alert(`Error: ${record.error}`)}
                          className="text-red-600 hover:text-red-800 text-xs underline"
                        >
                          {t('sms.monitoring.viewError')}
                        </button>
                      )}
                      {record.requestId && (
                        <div className="text-xs text-gray-500">ID: {record.requestId}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {(record.status === 'FAILED' || record.status === 'PENDING') && (
                        <button
                          onClick={() => handleSendSMS(record)}
                          disabled={sendingRecord === record.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            record.status === 'FAILED' 
                              ? 'bg-red-600 hover:bg-red-700' 
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          title={record.status === 'PENDING' ? 'Send SMS Now' : 'Retry Failed SMS'}
                        >
                          {sendingRecord === record.id ? (
                            <>
                              <FaSpinner className="w-3 h-3 animate-spin" />
                              <span>{t('sms.monitoring.sending')}</span>
                            </>
                          ) : (
                            <>
                              <FaPaperPlane className="w-3 h-3" />
                              <span>{record.status === t('sms.monitoring.pending') ? t('sms.monitoring.send') : t('sms.monitoring.retry')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-col sm:flex-row gap-4 overflow-x-auto">
            <div className="text-sm text-gray-700">
                {t("sms.monitoring.showing")}
              
               {((pagination.page - 1) * pagination.limit) + 1} {t('sms.monitoring.to')} {Math.min(pagination.page * pagination.limit, pagination.total)} {t('sms.monitoring.of')} {pagination.total} {t('sms.monitoring.result')}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <IoIosArrowBack />
                {t("sms.monitoring.prev")}
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded-lg ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                                {t("sms.monitoring.next")}

              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SMSMonitoringScreen;

