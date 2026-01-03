import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { 
  FaChartLine, 
  FaUsers, 
  FaExclamationTriangle, 
  FaClock,
  FaGlobe,
  FaEdit,
  FaTrash,
  FaPlus,
  FaEye,
  FaServer,
  FaShieldAlt
} from 'react-icons/fa';

interface AnalyticsData {
  period: string;
  summary: {
    totalLogs: number;
    actionTotals: {
      creates: number;
      updates: number;
      deletes: number;
      reads: number;
      other: number;
    };
    totalUsers: number;
    totalIPs: number;
    failedActions: number;
    averageResponseTime: number | null;
    slowestResponseTime: number | null;
    fastestResponseTime: number | null;
    errorRate: number;
  };
  actions: Array<{ action: string; count: number }>;
  entities: Array<{ type: string; count: number }>;
  topUsers: Array<{
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    activityCount: string;
    lastActivity: string;
  }>;
  hourlyDistribution: Array<{ hour: number; count: string }>;
  dailyTrend: Array<{
    date: string;
    count: string;
    uniqueUsers: string;
    uniqueIPs: string;
  }>;
  topIPs: Array<{ ip: string; count: number }>;
  recentCritical: Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      role: string;
    } | null;
  }>;
  statusDistribution: Array<{
    responseStatus: number;
    count: number;
  }>;
  topEndpoints: Array<{
    requestPath: string;
    requestMethod: string;
    count: number;
    avgResponseTime: number;
  }>;
  slowEndpoints: Array<{
    requestPath: string;
    requestMethod: string;
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    count: number;
  }>;
}

const AuditDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7d');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<any>(null);
  const [modalType, setModalType] = useState<'action' | 'entity' | 'user' | 'ip' | 'day' | 'hour' | 'summary' | 'status' | 'endpoint'>('summary');
  const [detailedLogs, setDetailedLogs] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const formatResponseTime = (value?: number | string | null) => {
    if (value === null || value === undefined) return '—';
    const numeric = typeof value === 'string' ? Number(value) : value;
    if (Number.isNaN(numeric)) return '—';
    if (numeric >= 1000) return `${(numeric / 1000).toFixed(2)} s`;
    return `${Math.round(numeric)} ms`;
  };

  const getStatusBadgeClasses = (status?: number | string | null) => {
    if (status === null || status === undefined) return 'bg-gray-100 text-gray-700';
    const numeric = typeof status === 'string' ? Number(status) : status;
    if (numeric >= 500) return 'bg-red-100 text-red-700';
    if (numeric >= 400) return 'bg-orange-100 text-orange-700';
    if (numeric >= 300) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getMethodBadgeClasses = (method?: string | null) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-100 text-blue-700';
      case 'POST':
        return 'bg-green-100 text-green-700';
      case 'PUT':
      case 'PATCH':
        return 'bg-indigo-100 text-indigo-700';
      case 'DELETE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const calculatePercentage = (count: number, total: number) => {
    if (!total) return 0;
    return Math.round(((count / total) * 100 + Number.EPSILON) * 10) / 10;
  };

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  // Load detailed logs based on filter
  const loadDetailedLogs = async (filters: any) => {
    try {
      setLoadingDetails(true);
      console.log('📋 Loading detailed logs with filters:', filters);
      const response = await api.get('/audit-logs', filters);
      
      if (response.success && response.data) {
        const logsData = response.data.logs || [];
        setDetailedLogs(logsData);
      }
    } catch (error) {
      console.error('Error loading detailed logs:', error);
      setDetailedLogs([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Click handlers for different elements
  const handleSummaryCardClick = (type: string) => {
    let action = '';
    let title = '';
    
    switch(type) {
      case 'creates':
        action = 'CREATE';
        title = 'All Create Actions';
        break;
      case 'updates':
        action = 'UPDATE';
        title = 'All Update Actions';
        break;
      case 'deletes':
        action = 'DELETE';
        title = 'All Delete Actions';
        break;
    }
    
    if (action) {
      setModalTitle(title);
      setModalType('action');
      setShowModal(true);
      loadDetailedLogs({ action, limit: 50 });
    }
  };

  const handleActionClick = (action: string, count: number) => {
    setModalTitle(`${action} Actions (${count} total)`);
    setModalType('action');
    setModalData({ action, count });
    setShowModal(true);
    loadDetailedLogs({ action, limit: 50 });
  };

  const handleEntityClick = (entityType: string, count: number) => {
    setModalTitle(`${entityType} Changes (${count} total)`);
    setModalType('entity');
    setModalData({ entityType, count });
    setShowModal(true);
    loadDetailedLogs({ entityType, limit: 50 });
  };

  const handleUserClick = (user: any) => {
    setModalTitle(`${user.firstName} ${user.lastName}'s Activity`);
    setModalType('user');
    setModalData(user);
    setShowModal(true);
    loadDetailedLogs({ userId: user.id, limit: 100 });
  };

  const handleIPClick = (ipData: any) => {
    setModalTitle(`Activity from IP: ${ipData.ip}`);
    setModalType('ip');
    setModalData(ipData);
    setShowModal(true);
    loadDetailedLogs({ limit: 50 }); // Would need backend support for IP filtering
  };

  const handleDayClick = (day: any) => {
    const date = new Date(day.date);
    setModalTitle(`Activity on ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`);
    setModalType('day');
    setModalData(day);
    setShowModal(true);
    
    // Get start and end of day
    const startDate = new Date(day.date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(day.date);
    endDate.setHours(23, 59, 59, 999);
    
    loadDetailedLogs({ 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      limit: 100 
    });
  };

  const handleHourClick = (hour: number, count: number) => {
    setModalTitle(`Activity at ${hour}:00 (${count} actions)`);
    setModalType('hour');
    setModalData({ hour, count });
    setShowModal(true);
    // Note: Would need backend support for hour filtering
    loadDetailedLogs({ limit: 50 });
  };

  const handleStatusClick = (status: number, count: number) => {
    setModalTitle(`HTTP ${status} Responses (${count} records)`);
    setModalType('status');
    setModalData({ status, count });
    setShowModal(true);
    loadDetailedLogs({ responseStatus: status, limit: 100 });
  };

  const handleEndpointClick = (endpoint: any) => {
    setModalTitle(`${endpoint.requestMethod} ${endpoint.requestPath}`);
    setModalType('endpoint');
    setModalData(endpoint);
    setShowModal(true);
    loadDetailedLogs({
      requestMethod: endpoint.requestMethod,
      requestPath: endpoint.requestPath,
      limit: 100
    });
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading audit analytics for period:', period);
      const response = await api.get(`/audit-logs/analytics?period=${period}`);
      console.log('📊 Analytics response:', response);
      
      if (response.success && response.data) {
        setAnalytics(response.data);
      }
    } catch (error) {
      console.error('Error loading audit analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-700">Failed to load analytics data</p>
      </div>
    );
  }

  const { summary, actions, entities, topUsers, hourlyDistribution, dailyTrend, topIPs, recentCritical, statusDistribution, topEndpoints, slowEndpoints } = analytics;
  const totalStatusCount = statusDistribution?.reduce((sum, s) => sum + Number((s as any).count ?? 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FaChartLine className="text-blue-600" />
          Audit Analytics Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Time Period:</span>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => {
            setModalTitle(`All Activities (${summary.totalLogs} total)`);
            setModalType('summary');
            setShowModal(true);
            loadDetailedLogs({ limit: 100 });
          }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 transition-transform"
          title="Click to view all activities"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Total Activities</p>
              <p className="text-4xl font-bold">{summary.totalLogs.toLocaleString()}</p>
            </div>
            <FaServer className="text-5xl text-blue-300 opacity-50" />
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 transition-transform"
          title="Click to view user details"
          onClick={() => {
            setModalTitle(`Active Users (${summary.totalUsers} users)`);
            setModalType('summary');
            setModalData({ type: 'users', count: summary.totalUsers });
            setShowModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Active Users</p>
              <p className="text-4xl font-bold">{summary.totalUsers}</p>
            </div>
            <FaUsers className="text-5xl text-green-300 opacity-50" />
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 transition-transform"
          title="Click to view IP details"
          onClick={() => {
            setModalTitle(`Unique IP Addresses (${summary.totalIPs} IPs)`);
            setModalType('summary');
            setModalData({ type: 'ips', count: summary.totalIPs });
            setShowModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Unique IPs</p>
              <p className="text-4xl font-bold">{summary.totalIPs}</p>
            </div>
            <FaGlobe className="text-5xl text-purple-300 opacity-50" />
          </div>
        </div>

        <div 
          className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl shadow-lg p-6 cursor-pointer hover:scale-105 transition-transform"
          title="Click to view failed actions"
          onClick={() => {
            setModalTitle(`Failed Actions (${summary.failedActions} failures)`);
            setModalType('summary');
            setModalData({ type: 'failed', count: summary.failedActions });
            setShowModal(true);
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm mb-1">Failed Actions</p>
              <p className="text-4xl font-bold">{summary.failedActions}</p>
            </div>
            <FaExclamationTriangle className="text-5xl text-red-300 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Response Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {summary.averageResponseTime !== null ? formatResponseTime(summary.averageResponseTime) : '—'}
              </p>
            </div>
            <FaClock className="text-3xl text-indigo-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Slowest Response</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {summary.slowestResponseTime !== null ? formatResponseTime(summary.slowestResponseTime) : '—'}
              </p>
            </div>
            <FaShieldAlt className="text-3xl text-orange-500" />
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {typeof summary.errorRate === 'number' ? summary.errorRate.toFixed(2) : '0.00'}%
              </p>
            </div>
            <FaExclamationTriangle className="text-3xl text-red-500" />
          </div>
        </div>
      </div>

      {/* Action Type Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-600" />
            Actions Distribution
          </h3>
          <div className="space-y-3">
            <div 
              onClick={() => handleSummaryCardClick('creates')}
              className="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
              title="Click to view all create actions"
            >
              <div className="flex items-center gap-3">
                <FaPlus className="text-green-600 text-xl" />
                <span className="font-medium text-gray-900">Creates</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-green-600">{summary.actionTotals.creates.toLocaleString()}</span>
                <div className="w-32 bg-green-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(summary.actionTotals.creates / summary.totalLogs) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleSummaryCardClick('updates')}
              className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
              title="Click to view all update actions"
            >
              <div className="flex items-center gap-3">
                <FaEdit className="text-blue-600 text-xl" />
                <span className="font-medium text-gray-900">Updates</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-blue-600">{summary.actionTotals.updates.toLocaleString()}</span>
                <div className="w-32 bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(summary.actionTotals.updates / summary.totalLogs) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => handleSummaryCardClick('deletes')}
              className="flex items-center justify-between p-3 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
              title="Click to view all delete actions"
            >
              <div className="flex items-center gap-3">
                <FaTrash className="text-red-600 text-xl" />
                <span className="font-medium text-gray-900">Deletes</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-red-600">{summary.actionTotals.deletes.toLocaleString()}</span>
                <div className="w-32 bg-red-200 rounded-full h-2">
                  <div 
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(summary.actionTotals.deletes / summary.totalLogs) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FaEye className="text-gray-600 text-xl" />
                <span className="font-medium text-gray-900">Reads</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-600">{summary.actionTotals.reads.toLocaleString()}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gray-600 h-2 rounded-full"
                    style={{ width: `${(summary.actionTotals.reads / summary.totalLogs) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Entity Types Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaServer className="text-purple-600" />
            Most Modified Entities
          </h3>
          <div className="space-y-2">
            {entities.slice(0, 6).map((entity, idx) => {
              const total = entities.reduce((sum, e) => sum + e.count, 0);
              const percentage = total > 0 ? (entity.count / total) * 100 : 0;
              return (
                <div 
                  key={idx} 
                  onClick={() => handleEntityClick(entity.type, entity.count)}
                  className="flex items-center justify-between p-2 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                  title={`Click to view all ${entity.type} changes`}
                >
                  <span className="font-medium text-gray-700">{entity.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{entity.count}</span>
                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-600 h-1.5 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* HTTP Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-amber-600" />
            HTTP Status Breakdown
          </h3>
          <div className="space-y-3">
            {statusDistribution.slice().sort((a, b) => Number((b as any).count ?? 0) - Number((a as any).count ?? 0)).map((status, idx) => {
              const numericStatus = Number(status.responseStatus);
              const count = Number((status as any).count ?? 0);
              const percentage = calculatePercentage(count, totalStatusCount || summary.totalLogs);
              return (
                <div
                  key={`${numericStatus}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleStatusClick(numericStatus, count)}
                  title={`Click to view all HTTP ${numericStatus} responses`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(numericStatus)}`}>
                      HTTP {numericStatus}
                    </span>
                    <span className="text-sm text-gray-600">{percentage}%</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Timeline and Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity Trend */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaClock className="text-orange-600" />
            Activity Timeline (Last {period})
          </h3>
          <div className="space-y-3">
            {dailyTrend.slice(0, 7).map((day, idx) => (
              <div 
                key={idx} 
                onClick={() => handleDayClick(day)}
                className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-blue-50 transition-colors rounded-r-lg cursor-pointer"
                title="Click to view activities for this day"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-gray-600">
                      {day.uniqueUsers} users • {day.uniqueIPs} IPs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{Number(day.count).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">activities</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Heatmap */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaClock className="text-indigo-600" />
            Peak Hours
          </h3>
          <div className="grid grid-cols-6 gap-1">
            {Array.from({ length: 24 }, (_, i) => {
              const hourData = hourlyDistribution.find(h => Number(h.hour) === i);
              const count = hourData ? Number(hourData.count) : 0;
              const maxCount = Math.max(...hourlyDistribution.map(h => Number(h.count)));
              const intensity = maxCount > 0 ? (count / maxCount) : 0;
              
              return (
                <div
                  key={i}
                  onClick={() => count > 0 && handleHourClick(i, count)}
                  className="relative group cursor-pointer"
                  title={`${i}:00 - ${count} activities${count > 0 ? ' (Click for details)' : ''}`}
                >
                  <div
                    className={`aspect-square rounded transition-all ${
                      intensity > 0.7 ? 'bg-indigo-600' :
                      intensity > 0.4 ? 'bg-indigo-400' :
                      intensity > 0.2 ? 'bg-indigo-300' :
                      intensity > 0 ? 'bg-indigo-200' : 'bg-gray-100'
                    }`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[8px] font-medium text-gray-700">{i}</span>
                    </div>
                  </div>
                  <div className="hidden group-hover:block absolute z-10 bg-gray-900 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                    {i}:00 - {count}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
            <span>0:00</span>
            <span className="font-medium">Hourly Activity Distribution</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* Top Users and Top IPs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Active Users */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaUsers className="text-green-600" />
            Most Active Users
          </h3>
          <div className="space-y-3">
            {topUsers.map((user, idx) => (
              <div 
                key={idx} 
                onClick={() => handleUserClick(user)}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                title={`Click to view ${user.firstName}'s complete activity`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                        {user.role}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">{Number(user.activityCount).toLocaleString()}</p>
                  <p className="text-xs text-gray-500">actions</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top IP Addresses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaGlobe className="text-teal-600" />
            Top IP Addresses
          </h3>
          <div className="space-y-2">
            {topIPs.map((ipData, idx) => (
              <div 
                key={idx} 
                onClick={() => handleIPClick(ipData)}
                className="flex items-center justify-between p-2 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                title={`Click to view all activity from ${ipData.ip}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <code className="text-sm font-mono text-gray-700">{ipData.ip}</code>
                </div>
                <span className="text-sm font-bold text-teal-600">{ipData.count} requests</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Endpoint Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaChartLine className="text-blue-600" />
            Top Endpoints
          </h3>
          <div className="space-y-3">
            {topEndpoints.slice(0, 10).map((endpoint, idx) => {
              const count = Number((endpoint as any).count ?? 0);
              return (
                <div
                  key={`${endpoint.requestMethod}-${endpoint.requestPath}-${idx}`}
                  onClick={() => handleEndpointClick(endpoint)}
                  className="border border-gray-100 rounded-lg p-3 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
                  title="Click to view detailed logs for this endpoint"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getMethodBadgeClasses(endpoint.requestMethod)}`}>
                          {endpoint.requestMethod}
                        </span>
                        <span className="text-sm font-mono text-gray-900 break-all">
                          {endpoint.requestPath}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg response {formatResponseTime(endpoint.avgResponseTime)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">requests</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FaShieldAlt className="text-red-600" />
            Slowest Endpoints
          </h3>
          <div className="space-y-3">
            {slowEndpoints.slice(0, 10).map((endpoint, idx) => {
              const avg = endpoint.avgResponseTime;
              const max = endpoint.maxResponseTime;
              const count = Number((endpoint as any).count ?? 0);
              return (
                <div
                  key={`${endpoint.requestMethod}-${endpoint.requestPath}-${idx}`}
                  onClick={() => handleEndpointClick(endpoint)}
                  className="border border-red-100 rounded-lg p-3 hover:border-red-200 hover:shadow-sm transition-all cursor-pointer bg-red-50/30"
                  title="Click to inspect this slow endpoint"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getMethodBadgeClasses(endpoint.requestMethod)}`}>
                          {endpoint.requestMethod}
                        </span>
                        <span className="text-sm font-mono text-gray-900 break-all">
                          {endpoint.requestPath}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg {formatResponseTime(avg)} • Slowest {formatResponseTime(max)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600">{count.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">requests</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Critical Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FaShieldAlt className="text-red-600" />
          Recent Critical Actions
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentCritical.map((log) => (
                <tr key={log.id} className="hover:bg-red-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                      log.action === 'BULK_DELETE' ? 'bg-red-200 text-red-900' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      <FaExclamationTriangle className="w-3 h-3" />
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {log.entityType} #{log.entityId}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {log.user ? (
                      <div>
                        <p className="font-medium text-gray-900">{log.user.name}</p>
                        <p className="text-xs text-gray-500">{log.user.role}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Actions Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">All Actions Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {actions.map((action, idx) => (
            <div 
              key={idx} 
              onClick={() => handleActionClick(action.action, action.count)}
              className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:scale-105 transition-all"
              title={`Click to view all ${action.action} actions`}
            >
              <p className="text-xs font-medium text-gray-600 mb-1">{action.action}</p>
              <p className="text-2xl font-bold text-gray-900">{action.count.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold">{modalTitle}</h2>
                <p className="text-indigo-100 text-sm mt-1">
                  {loadingDetails ? 'Loading details...' : `${detailedLogs.length} records`}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-indigo-800 rounded-lg p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading detailed records...</p>
                  </div>
                </div>
              ) : detailedLogs.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trace</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {detailedLogs.map((log: any) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getMethodBadgeClasses(log.requestMethod)}`}>
                              {log.requestMethod || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClasses(log.responseStatus)}`}>
                              {log.responseStatus ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                            {formatResponseTime(log.responseTimeMs)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              log.action.includes('CREATE') ? 'bg-green-100 text-green-800' :
                              log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                              log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div>
                              <p className="font-medium">{log.entityType}</p>
                              <p className="text-xs text-gray-500">ID: {log.entityId}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {log.user ? (
                              <div>
                                <p className="font-medium text-gray-900">
                                  {log.user.firstName} {log.user.lastName}
                                </p>
                                <p className="text-xs text-gray-500">{log.user.role}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">Unknown</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <code className="text-xs font-mono text-gray-700">{log.ipAddress}</code>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] font-mono text-gray-500 break-all">
                              {log.correlationId || '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaExclamationTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-600">No records found</p>
                </div>
              )}

              {/* Additional Context Based on Modal Type */}
              {modalData && modalType === 'user' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">User Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Total Actions</p>
                      <p className="text-2xl font-bold text-blue-600">{modalData.activityCount}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Role</p>
                      <p className="text-sm font-bold text-green-600">{modalData.role}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg col-span-2">
                      <p className="text-xs text-gray-600 mb-1">Last Activity</p>
                      <p className="text-sm font-bold text-purple-600">
                        {new Date(modalData.lastActivity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {modalData && modalType === 'day' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Day Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Total Actions</p>
                      <p className="text-3xl font-bold text-blue-600">{modalData.count}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Unique Users</p>
                      <p className="text-3xl font-bold text-green-600">{modalData.uniqueUsers}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Unique IPs</p>
                      <p className="text-3xl font-bold text-purple-600">{modalData.uniqueIPs}</p>
                    </div>
                  </div>
                </div>
              )}

              {modalData && modalType === 'status' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Status Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">HTTP Status</p>
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeClasses(modalData.status)}`}>
                        {modalData.status}
                      </span>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Occurrences</p>
                      <p className="text-2xl font-bold text-gray-900">{Number(modalData.count || detailedLogs.length).toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-xs text-gray-600 mb-1">Share of Total</p>
                      <p className="text-lg font-bold text-gray-900">
                        {calculatePercentage(Number(modalData.count || detailedLogs.length), summary.totalLogs)}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {modalData && modalType === 'endpoint' && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Endpoint Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Method</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getMethodBadgeClasses(modalData.requestMethod)}`}>
                        {modalData.requestMethod}
                      </span>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg md:col-span-2">
                      <p className="text-xs text-gray-600 mb-1">Path</p>
                      <p className="text-sm font-mono text-gray-900 break-all">{modalData.requestPath}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Requests</p>
                      <p className="text-xl font-bold text-gray-900">{Number(modalData.count ?? detailedLogs.length).toLocaleString()}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Average Response</p>
                      <p className="text-sm font-bold text-indigo-700">{formatResponseTime(modalData.avgResponseTime)}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Fastest</p>
                      <p className="text-sm font-bold text-indigo-700">{formatResponseTime(modalData.minResponseTime)}</p>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Slowest</p>
                      <p className="text-sm font-bold text-indigo-700">{formatResponseTime(modalData.maxResponseTime)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Click any row for more details
              </p>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditDashboard;

