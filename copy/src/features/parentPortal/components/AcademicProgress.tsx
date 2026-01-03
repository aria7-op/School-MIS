import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudentGrades, useStudentSubjectProgress } from '../services/parentPortalService';

interface AcademicProgressProps {
  studentId: string;
}

const AcademicProgress: React.FC<AcademicProgressProps> = ({ studentId }) => {
  const { t } = useTranslation();
  const [selectedTerm, setSelectedTerm] = useState('current');

  const { data: grades = [], isLoading: loadingGrades } = useStudentGrades(studentId);
  const { data: subjectProgress = [], isLoading: loadingProgress } = useStudentSubjectProgress(studentId);

  const overallStats = useMemo(() => {
    if (grades.length === 0) return { average: 0, totalAssignments: 0, completedAssignments: 0 };
    
    const totalAssignments = grades.length;
    const completedAssignments = grades.filter(g => g.grade > 0).length;
    const average = Math.round(grades.reduce((sum, grade) => sum + grade.percentage, 0) / grades.length);
    
    return { average, totalAssignments, completedAssignments };
  }, [grades]);

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  if (loadingGrades || loadingProgress) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
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
      {/* Overall Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('parentPortal.grades.overview')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">{t('parentPortal.grades.overallAverage')}</p>
                <p className="text-2xl font-bold text-blue-900">{overallStats.average}%</p>
              </div>
              <div className="text-3xl">🎓</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {overallStats.completedAssignments}/{overallStats.totalAssignments}
                </p>
              </div>
              <div className="text-3xl">✅</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Completion Rate</p>
                <p className="text-2xl font-bold text-purple-900">
                  {overallStats.totalAssignments > 0 
                    ? Math.round((overallStats.completedAssignments / overallStats.totalAssignments) * 100)
                    : 0}%
                </p>
              </div>
              <div className="text-3xl">📊</div>
            </div>
          </div>
        </div>
      </div>

      {/* Subject Progress */}
      {subjectProgress.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('parentPortal.grades.subjectProgress')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjectProgress.map((subject) => (
              <div key={subject.subject} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{subject.subject}</h4>
                  <span className="text-lg">{getTrendIcon(subject.trend)}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{t('parentPortal.grades.averageGrade')}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(subject.averageGrade)}`}>
                      {subject.averageGrade}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Assignments</span>
                    <span className="text-gray-900">
                      {subject.completedAssignments}/{subject.totalAssignments}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(subject.completedAssignments / subject.totalAssignments) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Grades */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('parentPortal.grades.recent')}</h3>
        {grades.length > 0 ? (
          <div className="space-y-3">
            {grades.slice(0, 10).map((grade) => (
              <div key={grade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {grade.percentage}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{grade.assignment}</h4>
                    <p className="text-sm text-gray-600">{grade.subject}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(grade.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.percentage)}`}>
                    {grade.grade}/{grade.maxGrade}
                  </div>
                  {grade.remarks && (
                    <p className="text-xs text-gray-500 mt-1">{grade.remarks}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📚</div>
            <p>No grades available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademicProgress;