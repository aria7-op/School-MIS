import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AttendanceFilters, Class, Student, AttendanceFiltersProps } from '../types/attendance';
import { FaFilter, FaSearch, FaCalendarAlt, FaTimes, FaCheck } from 'react-icons/fa';
import secureApiService from '../../../services/secureApiService';

const AttendanceFiltersComponent: React.FC<AttendanceFiltersProps> = ({
  filters,
  onFiltersChange,
  classes,
  students,
  onApply,
  onReset
}) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AttendanceFilters>(filters);
  const [academicSessions, setAcademicSessions] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch academic sessions
  useEffect(() => {
    secureApiService.get('/enrollments/academic-year/sessions')
      .then(res => {
        const sessionsData = (res.data as any)?.data || [];
        setAcademicSessions(sessionsData);
      })
      .catch(err => console.error('Failed to load academic sessions:', err));
  }, []);

  const handleFilterChange = (key: keyof AttendanceFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApply();
    setIsOpen(false);
  };

  const handleReset = () => {
    const resetFilters: AttendanceFilters = {
      dateRange: 'week',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      classId: '',
      studentId: '',
      academicSessionId: undefined,
      status: undefined,
      searchQuery: '',
      schoolId: '',
      teacherId: ''
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onReset();
    setIsOpen(false);
  };

  const getDateRangeOptions = () => [
    { value: 'today', label: t('attendance.filters.dateOptions.today') },
    { value: 'yesterday', label: t('attendance.filters.dateOptions.yesterday') },
    { value: 'week', label: t('attendance.filters.dateOptions.week') },
    { value: 'month', label: t('attendance.filters.dateOptions.month') },
    { value: 'quarter', label: t('attendance.filters.dateOptions.quarter') },
    { value: 'year', label: t('attendance.filters.dateOptions.year') },
    { value: 'custom', label: t('attendance.filters.dateOptions.custom') }
  ];

  const getStatusOptions = () => [
    { value: '', label: t('attendance.filters.statusOptions.all') },
    { value: 'PRESENT', label: t('attendance.filters.statusOptions.present') },
    { value: 'ABSENT', label: t('attendance.filters.statusOptions.absent') },
    { value: 'LATE', label: t('attendance.filters.statusOptions.late') },
    { value: 'EXCUSED', label: t('attendance.filters.statusOptions.excused') },
    { value: 'HALF_DAY', label: t('attendance.filters.statusOptions.halfDay') }
  ];

  const getClassOptions = () => [
    { value: '', label: t('attendance.filters.classOptions.all') },
    ...classes.map(cls => ({ value: cls.id, label: cls.name }))
  ];

  const getStudentOptions = () => {
    const isDariOrPashto = i18n.language === "fa-AF" || i18n.language === "ps-AF";
    return [
      { value: '', label: t('attendance.filters.studentOptions.all') },
      ...students.map(student => {
        let studentName = student.fullName || `${student.firstName} ${student.lastName}`;
        if (isDariOrPashto && student.user?.dariName) {
          studentName = student.user.dariName.trim();
        }
        return {
          value: student.id, 
          label: `${studentName} (${student.rollNo})`
        };
      })
    ];
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleDateChange = (type: 'startDate' | 'endDate', value: string) => {
    setLocalFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => {
          console.log('Filter button clicked, current state:', isOpen);
          setIsOpen(!isOpen);
        }}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <FaFilter className="w-4 h-4 mr-2" />
        {t('attendance.filters.title')}
        <svg className={`w-4 h-4 ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Dropdown - Below the container */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaFilter className="w-5 h-5 mr-2 text-blue-600" />
                {t('attendance.filters.title')}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaCalendarAlt className="w-3 h-3 inline mr-1" />
                    {t('attendance.filters.dateRange')}
                  </label>
                  <select
                    value={localFilters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getDateRangeOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Date Range */}
                {localFilters.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('attendance.filters.startDate')}
                      </label>
                      <input
                        type="date"
                        value={localFilters.startDate || ''}
                        onChange={(e) => handleDateChange('startDate', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {t('attendance.filters.endDate')}
                      </label>
                      <input
                        type="date"
                        value={localFilters.endDate || ''}
                        onChange={(e) => handleDateChange('endDate', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Class Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('attendance.filters.class')}
                  </label>
                  <select
                    value={localFilters.classId || ''}
                    onChange={(e) => handleFilterChange('classId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getClassOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Student Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('attendance.filters.student')}
                  </label>
                  <select
                    value={localFilters.studentId || ''}
                    onChange={(e) => handleFilterChange('studentId', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getStudentOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Academic Year Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Academic Year
                  </label>
                  <select
                    value={localFilters.academicSessionId || ''}
                    onChange={(e) => handleFilterChange('academicSessionId', e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Academic Years</option>
                    {academicSessions.map(session => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('attendance.filters.status')}
                  </label>
                  <select
                    value={localFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {getStatusOptions().map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Query */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FaSearch className="w-3 h-3 inline mr-1" />
                    {t('attendance.filters.search')}
                  </label>
                  <input
                    type="text"
                    placeholder={t('attendance.filters.searchPlaceholder')}
                    value={localFilters.searchQuery || ''}
                    onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={handleReset}
                className="px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('attendance.filters.reset')}
              </button>
              <button
                onClick={handleApply}
                className="inline-flex items-center px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaCheck className="w-3 h-3 mr-1" />
                {t('attendance.filters.apply')}
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default AttendanceFiltersComponent;
