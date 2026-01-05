import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FaUserGraduate, FaChartBar, FaCalendarCheck, FaMedal } from 'react-icons/fa';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import superadminService from '../services/superadminService';

interface Props {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  selectedSchoolId?: string | null;
  selectedBranchId?: string | null;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

const AcademicAnalyticsDashboard: React.FC<Props> = ({ dateRange, selectedSchoolId, selectedBranchId }) => {
  const { t } = useTranslation();
  // Build a stable params object using useMemo (avoid re-creating functions per render)
  const params = React.useMemo(() => {
    const p: any = {};
    // Validate dateRange values
    if (dateRange?.startDate) p.startDate = dateRange.startDate;
    if (dateRange?.endDate) p.endDate = dateRange.endDate;
    if (selectedSchoolId) p.schoolId = selectedSchoolId;
    if (selectedBranchId) p.branchId = selectedBranchId;
    return p;
  }, [dateRange?.startDate, dateRange?.endDate, selectedSchoolId, selectedBranchId]);

  const { data: academicOverview, isLoading, refetch: refetchAcademic } = useQuery({
    queryKey: ['academic-overview', params],
    queryFn: () => superadminService.getAcademicOverview(params),
    enabled: true
  });

  const { data: studentPerformance, refetch: refetchPerformance } = useQuery({
    queryKey: ['student-performance', params],
    queryFn: () => superadminService.getStudentPerformanceAnalytics(params),
    enabled: true
  });

  const { data: attendanceAnalytics, refetch: refetchAttendance } = useQuery({
    queryKey: ['attendance-analytics', params],
    queryFn: () => superadminService.getAttendanceAnalytics(params),
    enabled: true
  });

  // Refetch when params change (date range, school, branch)
  React.useEffect(() => {
    refetchAcademic();
    refetchPerformance();
    refetchAttendance();
  }, [params, refetchAcademic, refetchPerformance, refetchAttendance]);

  // Normalize response safely (api wrapper may already return data)
  const rawAcademic: any = (academicOverview as any) ?? {};
  const overview: any = rawAcademic?.overview ?? rawAcademic?.data?.overview ?? {};
  const performance: any = rawAcademic?.performance ?? rawAcademic?.data?.performance ?? {};
  
  const rawStudent: any = (studentPerformance as any) ?? {};
  const statistics: any = rawStudent?.statistics ?? rawStudent?.data?.statistics ?? {};
  
  const rawAttendance: any = (attendanceAnalytics as any) ?? {};
  const attendanceSummary: any = rawAttendance?.summary ?? rawAttendance?.data?.summary ?? {};
  const attendanceTrends: any[] = Array.isArray(rawAttendance?.trends ?? rawAttendance?.data?.trends)
    ? (rawAttendance?.trends ?? rawAttendance?.data?.trends)
    : [];

  // Log if we're receiving dummy/zero data with branch filter
  React.useEffect(() => {
    const p = params as any;
    console.log('📊 Academic Overview Request:', {
      url: '/superadmin/analytics/academic/overview',
      params: p,
      fullUrl: `https://khwanzay.school/api/superadmin/analytics/academic/overview?${new URLSearchParams(p).toString()}`,
      response: overview
    });
    
    if (selectedBranchId && overview?.totalStudents === 0) {
      console.warn('⚠️ Backend returned EMPTY data for branch:', selectedBranchId, {
        totalStudents: overview?.totalStudents,
        totalClasses: overview?.totalClasses,
        totalSubjects: overview?.totalSubjects,
        averageGrade: overview?.averageGrade
      });
    }
  }, [selectedBranchId, overview, params]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Safely parse average grade which may come as string/null
  const avgGrade: number = (() => {
    const value: any = overview?.averageGrade;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
  })();

  const performanceData = [
    { name: t('superadmin.academic.excellent', 'Excellent'), value: performance?.excellentStudents || 0, color: '#10B981' },
    { name: t('superadmin.academic.good', 'Good'), value: performance?.goodStudents || 0, color: '#3B82F6' },
    { name: t('superadmin.academic.average', 'Average'), value: performance?.averageStudents || 0, color: '#F59E0B' },
    { name: t('superadmin.academic.needsAttention', 'Needs Attention'), value: performance?.needsAttention || 0, color: '#EF4444' }
  ];

  console.log('Performance Distribution Data:', performanceData);

  return (
    <div className="space-y-2 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{t('superadmin.academic.totalStudents', 'Total Students')}</span>
            <FaUserGraduate className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview?.totalStudents?.toLocaleString() || 0}</p>
          <p className="text-xs text-gray-500 mt-2">{t('superadmin.academic.acrossSchools', 'Across all schools')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{t('superadmin.academic.classesSubjects', 'Classes & Subjects')}</span>
            <FaChartBar className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{overview?.totalClasses || 0}</p>
          <p className="text-xs text-gray-500 mt-2">{overview?.totalSubjects || 0} {t('superadmin.academic.subjects', 'subjects')}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{t('superadmin.academic.avgAttendance', 'Avg Attendance')}</span>
            <FaCalendarCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{attendanceSummary?.attendanceRate || 0}%</p>
          <p className="text-xs text-gray-500 mt-2">{t('superadmin.academic.presentToday', { count: attendanceSummary?.presentCount?.toLocaleString() || 0 }) || `${attendanceSummary?.presentCount?.toLocaleString() || 0} present today`}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">{t('superadmin.academic.avgGrade', 'Avg Grade')}</span>
            <FaMedal className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{avgGrade.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-2">{t('superadmin.academic.outOf', 'Out of 100')}</p>
        </div>
      </div>

      {/* Student Performance Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('superadmin.academic.performanceDistribution', 'Student Performance Distribution')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={performanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('superadmin.academic.performanceStats', 'Performance Statistics')}</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('superadmin.academic.excellentPerformers', 'Excellent Performers')}</p>
                <p className="text-2xl font-bold text-green-600">{performance?.excellentStudents || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('superadmin.academic.avg85', '85%+ Average')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('superadmin.academic.goodPerformers', 'Good Performers')}</p>
                <p className="text-2xl font-bold text-blue-600">{performance?.goodStudents || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('superadmin.academic.avg70to84', '70-84% Average')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('superadmin.academic.averagePerformers', 'Average Performers')}</p>
                <p className="text-2xl font-bold text-yellow-600">{performance?.averageStudents || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('superadmin.academic.avg50to69', '50-69% Average')}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">{t('superadmin.academic.needsAttention', 'Needs Attention')}</p>
                <p className="text-2xl font-bold text-red-600">{performance?.needsAttention || 0}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('superadmin.academic.avgBelow50', '<50% Average')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('superadmin.academic.attendanceTrends', 'Attendance Trends')}</h3>
        {attendanceTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="present" stroke="#10B981" name={t('superadmin.academic.present', 'Present')} strokeWidth={2} />
              <Line type="monotone" dataKey="absent" stroke="#EF4444" name={t('superadmin.academic.absent', 'Absent')} strokeWidth={2} />
              <Line type="monotone" dataKey="late" stroke="#F59E0B" name={t('superadmin.academic.late', 'Late')} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-gray-500 py-8">{t('superadmin.academic.noAttendanceData', 'No attendance data available')}</p>
        )}
      </div>

    </div>
  );
};

export default AcademicAnalyticsDashboard;

