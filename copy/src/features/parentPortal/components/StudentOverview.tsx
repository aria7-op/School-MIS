import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParentChildren } from '../services/parentPortalService';

interface StudentOverviewProps {
  studentId: string;
}

const StudentOverview: React.FC<StudentOverviewProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const { data: children = [], isLoading } = useParentChildren();
  
  const student = children.find(child => child.id === studentId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">👤</div>
          <p>{t('parentPortal.students.noStudents')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-6">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {student.firstName[0]}{student.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {student.firstName} {student.lastName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">{t('parentPortal.students.studentInfo.grade')}:</span> {student.grade} - {student.section}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.students.studentInfo.rollNumber')}:</span> {student.rollNumber}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.profile.parentInfo.email')}:</span> {student.email}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.profile.parentInfo.phone')}:</span> {student.phoneNumber}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.students.studentInfo.dateOfBirth')}:</span> {new Date(student.dateOfBirth).toLocaleDateString()}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.students.studentInfo.gender')}:</span> {student.gender}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.students.studentInfo.bloodGroup')}:</span> {student.bloodGroup}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.students.studentInfo.enrollmentDate')}:</span> {new Date(student.enrollmentDate).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              student.status === 'ACTIVE' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {student.status}
            </div>
          </div>
        </div>
      </div>

      {/* Academic Performance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('parentPortal.grades.overall')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('parentPortal.grades.stats.overallAverage')}</span>
              <span className="text-xl font-bold text-blue-600">{student.averageGrade}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('parentPortal.tabs.attendance')}</span>
              <span className="text-xl font-bold text-green-600">{student.attendance}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">{t('parentPortal.students.recentActivity')}</span>
              <span className="text-sm text-gray-500">{student.recentActivity}</span>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Subjects</h4>
            <div className="space-y-2">
              {student.subjects.map((subject, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700">{subject}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('parentPortal.students.contactInfo')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{t('parentPortal.students.studentContact')}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">{t('parentPortal.students.address')}:</span> {student.address}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.profile.parentInfo.phone')}:</span> {student.phoneNumber}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.profile.parentInfo.email')}:</span> {student.email}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">{t('parentPortal.students.classTeacher')}</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="font-medium">{t('parentPortal.students.teacherName')}:</span> {student.teacherName}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.profile.parentInfo.email')}:</span> {student.teacherEmail}
              </div>
              <div>
                <span className="font-medium">{t('parentPortal.profile.parentInfo.phone')}:</span> {student.teacherPhone}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🚨</div>
            <div>
              <h4 className="font-medium text-gray-900">{student.emergencyContact.name}</h4>
              <p className="text-sm text-gray-600">
                {student.emergencyContact.relationship} - {student.emergencyContact.phone}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentOverview;