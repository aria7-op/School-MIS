import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { FaSchool, FaTrophy, FaChartLine } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import superadminService from '../services/superadminService';

interface Props {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const SchoolComparisonDashboard: React.FC<Props> = ({ dateRange }) => {
  const { t } = useTranslation();
  const { data: schoolsOverview, isLoading } = useQuery({
    queryKey: ['schools-overview'],
    queryFn: superadminService.getSchoolsOverview
  });

  const { data: schoolComparison } = useQuery({
    queryKey: ['school-performance-comparison', dateRange],
    queryFn: () => superadminService.getSchoolFinancialComparison(dateRange)
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Handle both response formats
  const rawSchoolsOverview = schoolsOverview?.data || schoolsOverview;
  const schools = rawSchoolsOverview?.schools || [];
  
  const rawComparison = schoolComparison?.data || schoolComparison;
  const comparison = rawComparison?.schools || [];
  const rankings = rawComparison?.rankings;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-2 sm:space-y-6">
      {/* Summary */}
     <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm border border-blue-200 p-4 sm:p-6">
  <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-0">
    <div className="flex-1 min-w-0">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('superadmin.schools.title', 'School Performance Comparison')}</h2>
      <p className="text-sm sm:text-base text-gray-600 mt-1">{t('superadmin.schools.subtitle', 'Comprehensive analysis across all schools')}</p>
    </div>
    <FaSchool className="w-8 h-8 sm:w-12 sm:h-12 text-blue-600 flex-shrink-0" />
  </div>
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
    <div className="bg-white rounded-lg p-3 sm:p-4">
      <p className="text-xs sm:text-sm font-medium text-gray-600">{t('superadmin.schools.totalSchools', 'Total Schools')}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{schools.length}</p>
    </div>
    <div className="bg-white rounded-lg p-3 sm:p-4">
      <p className="text-xs sm:text-sm font-medium text-gray-600">{t('superadmin.schools.totalStudents', 'Total Students')}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{schools.reduce((sum, s) => sum + s.students, 0).toLocaleString()}</p>
    </div>
    <div className="bg-white rounded-lg p-3 sm:p-4">
      <p className="text-xs sm:text-sm font-medium text-gray-600">{t('superadmin.schools.totalTeachers', 'Total Teachers')}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900">{schools.reduce((sum, s) => sum + s.teachers, 0).toLocaleString()}</p>
    </div>
  </div>
</div>

      {/* School Comparison Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('superadmin.schools.detailedComparison', 'Detailed School Comparison')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('superadmin.schools.table.school', 'School')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('superadmin.schools.table.students', 'Students')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('superadmin.schools.table.teachers', 'Teachers')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('superadmin.schools.table.classes', 'Classes')}</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">{t('superadmin.schools.table.staff', 'Staff')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schools.map((school, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{school.name}</div>
                      <div className="text-xs text-gray-500">{school.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{school.students.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{school.teachers.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{school.classes.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">{school.staff.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue Comparison */}
      {comparison.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hidden sm:block">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('superadmin.schools.revenueComparison', 'Revenue Comparison')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="schoolCode" />
              <YAxis />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#10B981" name={t('superadmin.schools.revenue', 'Revenue')} />
              <Bar dataKey="expenses" fill="#EF4444" name={t('superadmin.schools.expenses', 'Expenses')} />
              <Bar dataKey="netProfit" fill="#3B82F6" name={t('superadmin.schools.netProfit', 'Net Profit')} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Performers */}
      {rankings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-1 sm:gap-6">
          {/* By Revenue */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4 gap-2">
              <FaTrophy className="w-5 h-5 text-yellow-500" />
              <h3 className="text-lg font-semibold text-gray-900">{t('superadmin.schools.topByRevenue', 'Top by Revenue')}</h3>
            </div>
            <div className="space-y-3">
              {rankings.byRevenue?.slice(0, 5).map((school: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{school.schoolName}</p>
                    <p className="text-xs text-gray-500">{school.schoolCode}</p>
                  </div>
                  <p className="text-sm font-bold text-green-600">{formatCurrency(school.revenue)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By Profit */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4 gap-2">
              <FaTrophy className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-900">{t('superadmin.schools.topByProfit', 'Top by Profit')}</h3>
            </div>
            <div className="space-y-3">
              {rankings.byProfit?.slice(0, 5).map((school: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{school.schoolName}</p>
                    <p className="text-xs text-gray-500">{school.schoolCode}</p>
                  </div>
                  <p className="text-sm font-bold text-blue-600">{formatCurrency(school.netProfit)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* By Efficiency */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4 gap-2">
              <FaChartLine className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-900">{t('superadmin.schools.topByEfficiency', 'Top by Efficiency')}</h3>
            </div>
            <div className="space-y-3">
              {rankings.byEfficiency?.slice(0, 5).map((school: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{school.schoolName}</p>
                    <p className="text-xs text-gray-500">{school.schoolCode}</p>
                  </div>
                  <p className="text-sm font-bold text-purple-600">{school.profitMargin}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolComparisonDashboard;

