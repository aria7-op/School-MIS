import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import AuditDashboard from '../components/AuditDashboard';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  oldData: string | null;
  newData: string | null;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  requestMethod?: string;
  requestPath?: string;
  requestUrl?: string;
  requestHeaders?: Record<string, any> | null;
  requestQuery?: Record<string, any> | null;
  requestBody?: Record<string, any> | null;
  responseStatus?: number | null;
  responseTimeMs?: number | null;
  isSuccess?: boolean;
  correlationId?: string | null;
  traceId?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  } | null;
}

interface Filters {
  action: string;
  entityType: string;
  userId: string;
  startDate: string;
  endDate: string;
  requestMethod: string;
  responseStatus: string;
  success: string;
  correlationId: string;
  ipAddress: string;
  requestPath: string;
}

const AuditLogsScreen = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs'>('dashboard');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    action: '',
    entityType: '',
    userId: '',
    startDate: '',
    endDate: '',
    requestMethod: '',
    responseStatus: '',
    success: '',
    correlationId: '',
    ipAddress: '',
    requestPath: '',
  });

  const actionTypes = ['CREATE', 'UPDATE', 'DELETE', 'MARK_IN', 'MARK_OUT', 'LOGIN', 'LOGOUT'];
  const entityTypes = ['Attendance', 'Grade', 'Payment', 'Student', 'User', 'Class', 'Teacher', 'Parent'];
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: 20,
      };

      if (filters.action) params.action = filters.action;
      if (filters.entityType) params.entityType = filters.entityType;
      if (filters.userId) params.userId = filters.userId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.requestMethod) params.requestMethod = filters.requestMethod;
      if (filters.responseStatus) params.responseStatus = filters.responseStatus;
      if (filters.success === 'success') params.isSuccess = 'true';
      if (filters.success === 'error') params.isSuccess = 'false';
      if (filters.correlationId) params.correlationId = filters.correlationId.trim();
      if (filters.ipAddress) params.ipAddress = filters.ipAddress.trim();
      if (filters.requestPath) params.requestPath = filters.requestPath.trim();

      console.log('📋 Fetching audit logs with params:', params);
      const response = await api.get('/audit-logs', params);
      console.log('📋 Audit logs response:', response);
      
      // Handle the response structure - response.data might already be the data object
      if (response.success || response.data?.success) {
        const data = response.data || response;
        const logsData = data.data?.logs || data.logs || [];
        const paginationData = data.data?.pagination || data.pagination || { totalPages: 1, total: 0 };
        
        console.log('📋 Setting logs:', logsData.length, 'records');
        console.log('📋 Pagination:', paginationData);
        setLogs(logsData);
        setTotalPages(paginationData.totalPages || 1);
        setTotalRecords(paginationData.total || logsData.length);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const resetFilters = () => {
    setFilters({
      action: '',
      entityType: '',
      userId: '',
      startDate: '',
      endDate: '',
      requestMethod: '',
      responseStatus: '',
      success: '',
      correlationId: '',
      ipAddress: '',
      requestPath: '',
    });
    setPage(1);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return '#10B981';
      case 'UPDATE':
        return '#3B82F6';
      case 'DELETE':
        return '#EF4444';
      case 'MARK_IN':
      case 'MARK_OUT':
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'add_circle';
      case 'UPDATE':
        return 'edit';
      case 'DELETE':
        return 'delete';
      case 'MARK_IN':
        return 'login';
      case 'MARK_OUT':
        return 'logout';
      default:
        return 'info';
    }
  };

  const getStatusClasses = (status?: number | null) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    if (status >= 500) return 'bg-red-100 text-red-700';
    if (status >= 400) return 'bg-orange-100 text-orange-700';
    if (status >= 300) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getMethodClasses = (method?: string) => {
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

  const formatResponseTime = (ms?: number | null) => {
    if (ms === null || ms === undefined) return '—';
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
    return `${ms} ms`;
  };

  // Generate a simple narrative summary
  const generateNarrative = (oldData: string | null, newData: string | null) => {
    if (!oldData || !newData) return null;

    try {
      const oldObj = JSON.parse(oldData);
      const newObj = JSON.parse(newData);

      // Helper to flatten and get top-level meaningful fields
      const getMainFields = (obj: any, prefix = ''): Record<string, any> => {
        const fields: Record<string, any> = {};
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            
            // Only go one level deep for nested objects (avoid deep nesting)
            if (value && typeof value === 'object' && !Array.isArray(value) && !prefix) {
              Object.assign(fields, getMainFields(value, key));
            } else if (key !== 'id' && key !== 'uuid' && key !== 'createdAt' && key !== 'updatedAt' && !key.includes('password') && !key.includes('salt')) {
              fields[newKey] = value;
            }
          }
        }
        
        return fields;
      };

      const oldFields = getMainFields(oldObj);
      const newFields = getMainFields(newObj);

      const changed: string[] = [];
      const added: string[] = [];
      const removed: string[] = [];

      const allKeys = new Set([...Object.keys(oldFields), ...Object.keys(newFields)]);

      allKeys.forEach(key => {
        const oldValue = oldFields[key];
        const newValue = newFields[key];

        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

        if (oldValue !== undefined && newValue !== undefined) {
          changed.push(key);
        } else if (newValue !== undefined) {
          added.push(key);
        } else {
          removed.push(key);
        }
      });

      return { changed, added, removed };
    } catch (error) {
      console.error('Error generating narrative:', error);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-600 mt-1">
              {totalRecords > 0 ? `${totalRecords.toLocaleString()} total records` : `${logs.length} records`}
            </p>
          </div>
          {activeTab === 'logs' && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <span className="material-icons text-sm">filter_list</span>
              Filters
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'dashboard'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === 'logs'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📋 Logs List
          </button>
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="p-6">
          <AuditDashboard />
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <>
          {/* Filters Panel */}
          {showFilters && (
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                {actionTypes.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
              </select>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
              <select
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Entities</option>
                {entityTypes.map((entity) => (
                  <option key={entity} value={entity}>
                    {entity}
                  </option>
                ))}
              </select>
            </div>

            {/* Request Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Method</label>
              <select
                value={filters.requestMethod}
                onChange={(e) => setFilters({ ...filters, requestMethod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Methods</option>
                {httpMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Response Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Code</label>
              <input
                type="number"
                value={filters.responseStatus}
                onChange={(e) => setFilters({ ...filters, responseStatus: e.target.value })}
                placeholder="e.g. 200"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Result */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Result</label>
              <select
                value={filters.success}
                onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Results</option>
                <option value="success">Success Only</option>
                <option value="error">Errors Only</option>
              </select>
            </div>

            {/* Request Path */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Request Path</label>
              <input
                type="text"
                value={filters.requestPath}
                onChange={(e) => setFilters({ ...filters, requestPath: e.target.value })}
                placeholder="/api/students"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                placeholder="Search by user"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* IP Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
              <input
                type="text"
                value={filters.ipAddress}
                onChange={(e) => setFilters({ ...filters, ipAddress: e.target.value })}
                placeholder="e.g. 192.168.0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Correlation ID */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Correlation ID</label>
              <input
                type="text"
                value={filters.correlationId}
                onChange={(e) => setFilters({ ...filters, correlationId: e.target.value })}
                placeholder="Trace requests across services"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* End Date */}
            {/* Reset Button */}
            <div className="flex items-end lg:col-span-2">
              <button
                onClick={resetFilters}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">refresh</span>
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters */}
      {(filters.action || filters.entityType || filters.startDate || filters.endDate || filters.requestMethod || filters.responseStatus || filters.success || filters.correlationId || filters.ipAddress || filters.requestPath || filters.userId) && (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex flex-wrap gap-2">
            {filters.action && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {filters.action}
                <button onClick={() => setFilters({ ...filters, action: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.entityType && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {filters.entityType}
                <button onClick={() => setFilters({ ...filters, entityType: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.requestMethod && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                Method: {filters.requestMethod}
                <button onClick={() => setFilters({ ...filters, requestMethod: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.responseStatus && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                Status: {filters.responseStatus}
                <button onClick={() => setFilters({ ...filters, responseStatus: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.startDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                From: {filters.startDate}
                <button onClick={() => setFilters({ ...filters, startDate: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.endDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                To: {filters.endDate}
                <button onClick={() => setFilters({ ...filters, endDate: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.success && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                {filters.success === 'success' ? 'Success only' : 'Errors only'}
                <button onClick={() => setFilters({ ...filters, success: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.requestPath && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                Path: {filters.requestPath}
                <button onClick={() => setFilters({ ...filters, requestPath: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.userId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                User: {filters.userId}
                <button onClick={() => setFilters({ ...filters, userId: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.ipAddress && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                IP: {filters.ipAddress}
                <button onClick={() => setFilters({ ...filters, ipAddress: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
            {filters.correlationId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                Trace: {filters.correlationId}
                <button onClick={() => setFilters({ ...filters, correlationId: '' })}>
                  <span className="material-icons text-sm">close</span>
                </button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Logs List */}
      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-gray-600">Loading audit logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-icons text-6xl text-gray-400">assignment</span>
            <p className="mt-4 text-xl text-gray-600">No audit logs found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => {
                  setSelectedLog(log);
                  setShowDetails(true);
                }}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="material-icons text-sm"
                      style={{ color: getActionColor(log.action) }}
                    >
                      {getActionIcon(log.action)}
                    </span>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${getActionColor(log.action)}20`,
                        color: getActionColor(log.action),
                      }}
                    >
                      {log.action}
                    </span>
                    {log.requestMethod && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getMethodClasses(log.requestMethod)}`}
                      >
                        {log.requestMethod}
                      </span>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(log.responseStatus)}`}
                    >
                      {log.responseStatus ?? '—'}
                    </span>
                    {log.responseTimeMs !== undefined && log.responseTimeMs !== null && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {formatResponseTime(log.responseTimeMs)}
                      </span>
                    )}
                    {log.isSuccess === false && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        Failed
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                    {log.correlationId && (
                      <p className="text-xs text-gray-400 font-mono truncate max-w-[220px]">
                        Trace: {log.correlationId}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-icons text-sm text-gray-400">folder</span>
                    <span className="text-gray-600">Entity:</span>
                    <span className="font-medium text-gray-900">{log.entityType}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-icons text-sm text-gray-400">route</span>
                    <span className="text-gray-600">Path:</span>
                    <span className="font-medium text-gray-900 break-all">
                      {log.requestPath || log.requestUrl || '—'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-icons text-sm text-gray-400">person</span>
                    <span className="text-gray-600">User ID:</span>
                    <span className="font-medium text-gray-900">
                      {log.user ? `${log.user.firstName} ${log.user.lastName}` : `User #${log.userId || 'Unknown'}`}
                    </span>
                    {log.user && (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs">
                        {log.user.role}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-icons text-sm text-gray-400">computer</span>
                    <span className="text-gray-600">IP:</span>
                    <span className="font-medium text-gray-900">{log.ipAddress}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-icons text-sm text-gray-400">analytics</span>
                    <span className="text-gray-600">Response:</span>
                    <span className="font-medium text-gray-900">
                      {log.responseStatus ?? '—'} • {formatResponseTime(log.responseTimeMs)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 font-mono">Entity ID: {log.entityId}</span>
                    {log.correlationId && (
                      <span className="text-xs text-gray-400 font-mono">Trace: {log.correlationId}</span>
                    )}
                  </div>
                  <span className="material-icons text-gray-400">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && logs.length > 0 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span className="material-icons">chevron_left</span>
            </button>
            <span className="text-sm font-medium text-gray-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Audit Log Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-6">
              {/* Action Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Action Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Action</p>
                    <span
                      className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${getActionColor(selectedLog.action)}20`,
                        color: getActionColor(selectedLog.action),
                      }}
                    >
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entity Type</p>
                    <p className="font-medium text-gray-900 mt-1">{selectedLog.entityType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Entity ID</p>
                    <p className="font-medium text-gray-900 mt-1 font-mono text-sm">
                      {selectedLog.entityId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Timestamp</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {new Date(selectedLog.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">HTTP Method</p>
                    <span className={`inline-flex items-center px-3 py-1 mt-1 rounded-full text-xs font-semibold ${getMethodClasses(selectedLog.requestMethod)}`}>
                      {selectedLog.requestMethod || '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status Code</p>
                    <span className={`inline-flex items-center px-3 py-1 mt-1 rounded-full text-xs font-semibold ${getStatusClasses(selectedLog.responseStatus)}`}>
                      {selectedLog.responseStatus ?? '—'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="font-medium text-gray-900 mt-1">{formatResponseTime(selectedLog.responseTimeMs)}</p>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm text-gray-600">Correlation ID</p>
                    <p className="font-medium text-gray-900 mt-1 font-mono text-xs break-all">
                      {selectedLog.correlationId || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.user ? (
                    <>
                      <div>
                        <p className="text-sm text-gray-600">Name</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedLog.user.firstName} {selectedLog.user.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Role</p>
                        <p className="font-medium text-gray-900 mt-1">{selectedLog.user.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">User ID</p>
                        <p className="font-medium text-gray-900 mt-1 font-mono text-sm">
                          {selectedLog.user.id}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-medium text-gray-900 mt-1 font-mono text-sm">
                        {selectedLog.userId || 'Unknown'}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ User information not available (user may have been deleted)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* System Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">IP Address</p>
                    <p className="font-medium text-gray-900 mt-1 font-mono text-sm">
                      {selectedLog.ipAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User Agent</p>
                    <p className="font-medium text-gray-900 mt-1 text-sm break-all">
                      {selectedLog.userAgent}
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Metadata */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Metadata</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Path</p>
                    <p className="font-medium text-gray-900 mt-1 break-all">
                      {selectedLog.requestUrl || selectedLog.requestPath || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Query Params</p>
                    <pre className="mt-1 bg-gray-900 text-green-300 rounded-lg p-3 text-xs overflow-x-auto">
                      {selectedLog.requestQuery ? JSON.stringify(selectedLog.requestQuery, null, 2) : '—'}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Request Body</p>
                    <pre className="mt-1 bg-gray-900 text-blue-300 rounded-lg p-3 text-xs overflow-x-auto">
                      {selectedLog.requestBody ? JSON.stringify(selectedLog.requestBody, null, 2) : '—'}
                    </pre>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Headers</p>
                    <pre className="mt-1 bg-gray-900 text-purple-300 rounded-lg p-3 text-xs overflow-x-auto">
                      {selectedLog.requestHeaders ? JSON.stringify(selectedLog.requestHeaders, null, 2) : '—'}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Event Information - If exists in newData */}
              {selectedLog.newData && (() => {
                try {
                  const newDataObj = JSON.parse(selectedLog.newData);
                  const event = newDataObj.event;
                  
                  if (!event) return null;

                  return (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-300 shadow-md">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="bg-purple-600 rounded-full p-2">
                          <span className="material-icons text-white text-xl">event_note</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{event.title || 'Event Triggered'}</h3>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        </div>
                        {event.severity && (
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            event.severity === 'INFO' ? 'bg-blue-100 text-blue-700' :
                            event.severity === 'WARNING' ? 'bg-yellow-100 text-yellow-700' :
                            event.severity === 'ERROR' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {event.severity}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        {event.eventType && (
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-purple-600 font-semibold mb-1">EVENT TYPE</p>
                            <p className="text-sm font-medium text-gray-900">{event.eventType}</p>
                          </div>
                        )}
                        {event.studentId && (
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-purple-600 font-semibold mb-1">STUDENT ID</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">{event.studentId}</p>
                          </div>
                        )}
                        {event.createdAt && (
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-purple-600 font-semibold mb-1">EVENT TIME</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(event.createdAt).toLocaleString()}
                            </p>
                          </div>
                        )}
                        {event.createdBy && (
                          <div className="bg-white rounded-lg p-3 border border-purple-100">
                            <p className="text-xs text-purple-600 font-semibold mb-1">CREATED BY</p>
                            <p className="text-sm font-medium text-gray-900 font-mono">User #{event.createdBy}</p>
                          </div>
                        )}
                      </div>

                      {/* Event Metadata */}
                      {event.metadata && (() => {
                        try {
                          const metadata = typeof event.metadata === 'string' ? JSON.parse(event.metadata) : event.metadata;
                          if (metadata.updatedFields && Array.isArray(metadata.updatedFields)) {
                            return (
                              <div className="mt-4 bg-white rounded-lg p-4 border border-purple-100">
                                <p className="text-xs text-purple-600 font-semibold mb-2">UPDATED FIELDS</p>
                                <div className="flex flex-wrap gap-2">
                                  {metadata.updatedFields.map((field: string, idx: number) => (
                                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        } catch (e) {
                          return null;
                        }
                      })()}
                    </div>
                  );
                } catch (error) {
                  return null;
                }
              })()}

              {/* Old Data */}
              {selectedLog.oldData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Old Data (Before)</h3>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(JSON.parse(selectedLog.oldData), null, 2)}
                  </pre>
                </div>
              )}

              {/* New Data */}
              {selectedLog.newData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">New Data (After)</h3>
                  <pre className="bg-gray-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(JSON.parse(selectedLog.newData), null, 2)}
                  </pre>
                </div>
              )}

              {/* Change Summary - Simple Narrative */}
              {selectedLog.oldData && selectedLog.newData && (() => {
                const summary = generateNarrative(selectedLog.oldData, selectedLog.newData);
                if (!summary) return null;

                const { changed, added, removed } = summary;

                // Build narrative parts
                const narrativeParts = [];
                if (changed.length > 0) {
                  narrativeParts.push(`modified ${changed.length} field${changed.length > 1 ? 's' : ''}`);
                }
                if (added.length > 0) {
                  narrativeParts.push(`added ${added.length} new field${added.length > 1 ? 's' : ''}`);
                }
                if (removed.length > 0) {
                  narrativeParts.push(`removed ${removed.length} field${removed.length > 1 ? 's' : ''}`);
                }

                if (narrativeParts.length === 0) return null;

                // Create readable sentence
                let narrative = 'This change ';
                if (narrativeParts.length === 1) {
                  narrative += narrativeParts[0];
                } else if (narrativeParts.length === 2) {
                  narrative += narrativeParts.join(' and ');
                } else {
                  narrative += narrativeParts.slice(0, -1).join(', ') + ', and ' + narrativeParts[narrativeParts.length - 1];
                }
                narrative += '.';

                return (
                  <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-300 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-600 rounded-full p-2 mt-1">
                        <span className="material-icons text-white text-xl">summarize</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Change Summary</h3>
                        <p className="text-base text-gray-700 leading-relaxed mb-4">
                          {narrative}
                        </p>
                        
                        {/* Details breakdown */}
                        <div className="flex flex-wrap gap-3 mt-3">
                          {changed.length > 0 && (
                            <div className="bg-white rounded-lg px-4 py-2 border border-blue-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="material-icons text-blue-600 text-sm">edit</span>
                                <span className="font-semibold text-blue-700">{changed.length}</span>
                                <span className="text-sm text-gray-600">Modified</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {changed.slice(0, 3).join(', ')}{changed.length > 3 ? `, +${changed.length - 3} more` : ''}
                              </p>
                            </div>
                          )}
                          
                          {added.length > 0 && (
                            <div className="bg-white rounded-lg px-4 py-2 border border-green-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="material-icons text-green-600 text-sm">add_circle</span>
                                <span className="font-semibold text-green-700">{added.length}</span>
                                <span className="text-sm text-gray-600">Added</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {added.slice(0, 3).join(', ')}{added.length > 3 ? `, +${added.length - 3} more` : ''}
                              </p>
                            </div>
                          )}
                          
                          {removed.length > 0 && (
                            <div className="bg-white rounded-lg px-4 py-2 border border-red-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                <span className="material-icons text-red-600 text-sm">remove_circle</span>
                                <span className="font-semibold text-red-700">{removed.length}</span>
                                <span className="text-sm text-gray-600">Removed</span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {removed.slice(0, 3).join(', ')}{removed.length > 3 ? `, +${removed.length - 3} more` : ''}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AuditLogsScreen;

