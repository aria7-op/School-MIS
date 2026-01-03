import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudentExams, useUpcomingExams } from '../services/parentPortalService';

interface ExamScheduleProps {
  studentId: string;
}

const ExamSchedule: React.FC<ExamScheduleProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'all'>('upcoming');

  const { data: allExams = [], isLoading: loadingAll } = useStudentExams(studentId);
  const { data: upcomingExams = [], isLoading: loadingUpcoming } = useUpcomingExams(studentId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return '📅';
      case 'COMPLETED': return '✅';
      case 'CANCELLED': return '❌';
      default: return '❓';
    }
  };

  const getGradeColor = (grade?: number, maxGrade?: number) => {
    if (!grade || !maxGrade) return 'text-gray-600';
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const examsToShow = activeTab === 'upcoming' ? upcomingExams : allExams;
  const isLoading = activeTab === 'upcoming' ? loadingUpcoming : loadingAll;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Exam Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('parentPortal.exams.upcoming')}</p>
                <p className="text-2xl font-bold text-blue-900">{upcomingExams.length}</p>
              </div>
              <div className="text-3xl">📅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">{t('parentPortal.exams.completed')}</p>
                <p className="text-2xl font-bold text-green-900">
                  {allExams.filter(exam => exam.status === 'COMPLETED').length}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">{t('parentPortal.exams.total')}</p>
                <p className="text-2xl font-bold text-purple-900">{allExams.length}</p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>
        </div>
      </div>

      {/* Exam List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('parentPortal.exams.upcoming')}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('parentPortal.exams.all')}
            </button>
          </div>
        </div>

        <div className="p-6">
          {examsToShow.length > 0 ? (
            <div className="space-y-4">
              {examsToShow.map((exam) => (
                <div key={exam.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getStatusColor(exam.status)}`}>
                        {getStatusIcon(exam.status)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-lg">{exam.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{exam.subject}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>📅 {new Date(exam.date).toLocaleDateString()}</span>
                          <span>🕐 {exam.startTime} - {exam.endTime}</span>
                          <span>🏫 {exam.room}</span>
                        </div>
                        {exam.grade && exam.maxGrade && (
                          <div className="mt-2">
                            <span className={`text-sm font-medium ${getGradeColor(exam.grade, exam.maxGrade)}`}>
                              {t('parentPortal.exams.grade')}: {exam.grade}/{exam.maxGrade} ({Math.round((exam.grade / exam.maxGrade) * 100)}%)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                        {exam.status}
                      </div>
                      {exam.status === 'SCHEDULED' && (
                        <div className="mt-2 text-xs text-gray-500">
                          {t('parentPortal.exams.daysLeft', { count: Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">
                {activeTab === 'upcoming' ? '📅' : '📝'}
              </div>
              <p>
                {activeTab === 'upcoming' ? t('parentPortal.exams.noUpcoming') : t('parentPortal.exams.noExams')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamSchedule;