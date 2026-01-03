import React from 'react';
import { useTranslation } from 'react-i18next';
import WeeklyAttendanceTrend from './WeeklyAttendanceTrend';
import { 
  FaUsers, 
  FaGraduationCap, 
  FaChalkboardTeacher, 
  FaCalendarCheck,
  FaChartLine,
  FaSchool
} from 'react-icons/fa';
import EnrollmentManager from '../EnrollmentManager';
import HistoricalDataViewer from '../HistoricalDataViewer';
import EnrollmentHistoryViewer from '../EnrollmentHistoryViewer';

const AdminDashboard: React.FC = () => {
  const { t } = useTranslation();

  // Mock stats data - replace with actual API calls
  const stats = {
    totalStudents: 1247,
    totalTeachers: 45,
    totalClasses: 32,
    attendanceRate: 94.2
  };

  return (
    <div className="space-y-1 sm:space-y-6 p-1 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">School Management Overview</p>
        </div>
        <div className="flex items-center space-x-2">
          <FaSchool className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaUsers className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaChalkboardTeacher className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teachers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTeachers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaGraduationCap className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalClasses}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaCalendarCheck className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.attendanceRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className=" grid-cols-1 lg:grid-cols-2 gap-6 hidden sm:grid">
        {/* Weekly Attendance Trend */}
        <div className="lg:col-span-2">
          <WeeklyAttendanceTrend />
        </div>

        {/* Additional charts can be added here */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FaChartLine className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Student Performance</h3>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Performance chart will be implemented here</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <FaUsers className="w-5 h-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Class Distribution</h3>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Class distribution chart will be implemented here</p>
          </div>
        </div>
      </div>

      {/* Historical Data & Bulk Promotions */}
      <div className='grid grid-cols-1 gap-1 sm:gap-6'>
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-bold mb-4'>Bulk Promotions & Yearly Upgrades</h2>
          <EnrollmentManager />
        </div>
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-bold mb-4'>Student Enrollment History</h2>
          <EnrollmentHistoryViewer />
        </div>
        <div className='bg-white border border-gray-200 rounded-lg shadow-sm p-6'>
          <h2 className='text-lg font-bold mb-4'>Historical Data Viewer</h2>
          <HistoricalDataViewer />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;




