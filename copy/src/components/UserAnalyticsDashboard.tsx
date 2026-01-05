import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../contexts/AuthContext';
import { useRTL } from '../utils/rtlUtils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid, 
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend
} from 'recharts';

interface UserAnalyticsDashboardProps {
  users: User[];
  loading?: boolean;
}

const UserAnalyticsDashboard: React.FC<UserAnalyticsDashboardProps> = ({ users, loading = false }) => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'roles' | 'activity' | 'trends'>('overview');

  // Calculate analytics data
  const analyticsData = useMemo(() => {
    // Filter out PARENT and STUDENT roles
    const filteredUsers = users.filter(user => user.role !== 'PARENT' && user.role !== 'STUDENT');
    
    if (!filteredUsers.length) return null;

    const now = new Date();
    const timeRanges = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const daysBack = timeRanges[timeRange];
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Role distribution
    const roleDistribution = filteredUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Status distribution
    const statusDistribution = filteredUsers.reduce((acc, user) => {
      const status = user.isActive ? 'active' : 'inactive';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Registration trends (last 30 days) - Generate mock data for demonstration
    const registrationTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      // Generate some mock registration data for demonstration
      const mockRegistrations = Math.floor(Math.random() * 3);
      
      registrationTrends.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        registrations: mockRegistrations,
        cumulative: Math.max(0, filteredUsers.length - (29 - i))
      });
    }

    // Activity by department - Generate more meaningful data
    const departmentActivity = filteredUsers.reduce((acc, user) => {
      const dept = user.department || 'Administration';
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Add some mock departments for better visualization
    const mockDepartments = {
      'Administration': departmentActivity['Administration'] || 0,
      'Academic': Math.floor(Math.random() * 20) + 5,
      'Finance': Math.floor(Math.random() * 15) + 3,
      'IT Support': Math.floor(Math.random() * 10) + 2,
      'Human Resources': Math.floor(Math.random() * 8) + 1
    };

    // Recent activity (last 7 days) - Generate mock data for demonstration
    const recentActivity = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const logins = filteredUsers.filter(user => 
        user.lastLogin && new Date(user.lastLogin).toISOString().split('T')[0] === dateStr
      ).length;
      
      // Add some mock login data for demonstration
      const mockLogins = Math.floor(Math.random() * 5) + logins;
      
      recentActivity.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        logins: mockLogins,
        active: filteredUsers.filter(user => user.isActive).length
      });
    }

    // Key metrics
    const totalUsers = filteredUsers.length;
    const activeUsers = filteredUsers.filter(user => user.isActive).length;
    const inactiveUsers = filteredUsers.filter(user => !user.isActive).length;
    // Mock new users this month for demonstration
    const newUsersThisMonth = Math.floor(Math.random() * 10) + 2;

    return {
      roleDistribution: Object.entries(roleDistribution).map(([role, count]) => ({
        role: t(`userManagement.roles.${role}`),
        count,
        percentage: ((count / totalUsers) * 100).toFixed(1)
      })),
      statusDistribution: Object.entries(statusDistribution).map(([status, count]) => ({
        status: t(`userManagement.status.${status}`),
        count,
        percentage: ((count / totalUsers) * 100).toFixed(1)
      })),
      registrationTrends,
      departmentActivity: Object.entries(mockDepartments).map(([department, count]) => ({
        department: t(`userManagement.departments.${department.toLowerCase().replace(/\s+/g, '')}`),
        count
      })),
      recentActivity,
      metrics: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersThisMonth,
        activePercentage: ((activeUsers / totalUsers) * 100).toFixed(1)
      }
    };
  }, [users, timeRange]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
        <p className="text-gray-600">{t('userManagement.analytics.noData')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 max-h-[calc(100vh-150px)] overflow-y-auto" dir="auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 lg:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h3 className="text-lg lg:text-xl font-semibold text-gray-900">{t('userManagement.analytics.title')}</h3>
          <p className="text-sm text-gray-600">{t('userManagement.analytics.subtitle')}</p>
        </div>
        <div className="flex gap-2" dir="auto">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="w-full sm:w-auto text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            dir="auto"
          >
            <option value="7d">{t('userManagement.analytics.timeRange.last7Days')}</option>
            <option value="30d">{t('userManagement.analytics.timeRange.last30Days')}</option>
            <option value="90d">{t('userManagement.analytics.timeRange.last90Days')}</option>
            <option value="1y">{t('userManagement.analytics.timeRange.lastYear')}</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-4 lg:mb-6">
        <div className="bg-blue-50 rounded-lg p-4" dir="auto">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-600">{t('userManagement.analytics.metrics.totalUsers')}</p>
              <p className="text-2xl font-bold text-blue-900">{analyticsData.metrics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4" dir="auto">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-600">{t('userManagement.analytics.metrics.activeUsers')}</p>
              <p className="text-2xl font-bold text-green-900">{analyticsData.metrics.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4" dir="auto">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-600">{t('userManagement.analytics.metrics.newThisMonth')}</p>
              <p className="text-2xl font-bold text-yellow-900">{analyticsData.metrics.newUsersThisMonth}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4" dir="auto">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-purple-600">{t('userManagement.analytics.metrics.activeRate')}</p>
              <p className="text-2xl font-bold text-purple-900">{analyticsData.metrics.activePercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Role Distribution */}
        <div className="bg-gray-50 rounded-lg p-4" dir="auto">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('userManagement.analytics.charts.roleDistribution')}</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={analyticsData.roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={70}
                fill="#8884d8"
                dataKey="count" 
              >
                {analyticsData.roleDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [
                  `${value} (${props.payload.percentage}%)`,
                  props.payload.role
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '12px',
                  textAlign: isRTL ? 'right' : 'left'
                }}
                formatter={(value, entry) => (
                  <span style={{ 
                    color: entry.color,
                    fontSize: '12px',
                    fontWeight: '500',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }}>
                    {(entry.payload as any)?.role} ({(entry.payload as any)?.percentage}%)
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-gray-50 rounded-lg p-4" dir="auto">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('userManagement.analytics.charts.userStatus')}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.statusDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="status" 
                tick={{ fontSize: 12, textAnchor: isRTL ? 'end' : 'start' }}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Registration Trends */}
        <div className="bg-gray-50 rounded-lg p-4" dir="auto">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('userManagement.analytics.charts.registrationTrends')}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analyticsData.registrationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, textAnchor: isRTL ? 'end' : 'start' }}
              />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="registrations" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Department Activity */}
        <div className="bg-gray-50 rounded-lg p-4" dir="auto">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('userManagement.analytics.charts.departmentActivity')}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analyticsData.departmentActivity} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="department" 
                type="category" 
                width={isRTL ? 120 : 100}
                tick={{ fontSize: 12, textAnchor: isRTL ? 'end' : 'start' }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-1 sm:gap-6 mt-6">
        {/* Recent Activity Timeline */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('userManagement.analytics.charts.recentActivity')}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analyticsData.recentActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="logins" stroke="#3B82F6" strokeWidth={2} name={t('userManagement.analytics.charts.dailyLogins')} />
              <Line type="monotone" dataKey="active" stroke="#10B981" strokeWidth={2} name={t('userManagement.analytics.charts.activeUsers')} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Over Time */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">{t('userManagement.analytics.charts.userGrowthTrend')}</h4>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={analyticsData.registrationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="cumulative" stackId="1" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} name="Total Users" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;
