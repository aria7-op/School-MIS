import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import secureApiService from '../services/secureApiService';
import { getShamsiMonths, shamsiMonthRangeToGregorian, SHAMSI_MONTHS } from '../utils/shamsi';
import { usePayments } from '../features/finance/services/financeService';

type ClassDetailTab = 'students' | 'financial' | 'attendance' | 'timetable';

const HistoricalDataViewer = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classDetailTab, setClassDetailTab] = useState<ClassDetailTab>('students');
  
  // Financial tab state
  const [selectedShYear, setSelectedShYear] = useState<number>(() => {
    const today = new Date();
    return today.getFullYear() - 621;
  });
  const [selectedShMonth, setSelectedShMonth] = useState<number>(1);
  
  // Attendance tab state
  const [selectedAttMonth, setSelectedAttMonth] = useState<number>(0); // 0 = All Months, 1-12 = specific month
  const [yearlyAttendanceData, setYearlyAttendanceData] = useState<any>(null);
  const [yearlyAttendanceLoading, setYearlyAttendanceLoading] = useState(false);
  
  // Students pagination and search
  const [studentsLimit, setStudentsLimit] = useState<number>(50);
  const [studentsSearchQuery, setStudentsSearchQuery] = useState<string>('');
  
  // Reset pagination when session or search changes
  useEffect(() => {
    setStudentsLimit(50);
  }, [selectedSession, studentsSearchQuery]);
  
  // Get selected session year for filtering
  const selectedSessionYear = useMemo(() => {
    if (!selectedSession) return null;
    const session = sessions.find((s: any) => String(s.id) === selectedSession);
    if (session?.name) {
      // Extract year from session name (e.g., "2023-2024" -> 2023)
      const yearMatch = session.name.match(/\d{4}/);
      if (yearMatch) {
        return parseInt(yearMatch[0]);
      }
    }
    return null;
  }, [selectedSession, sessions]);

  useEffect(() => {
    secureApiService.get('/enrollments/academic-year/sessions')
      .then(res => {
        let sessionsData = [];
        if (Array.isArray(res.data)) {
          sessionsData = res.data;
        } else if ((res.data as any)?.data) {
          sessionsData = Array.isArray((res.data as any).data) 
            ? (res.data as any).data 
            : [];
        } else if ((res as any)?.data) {
          sessionsData = Array.isArray((res as any).data) 
            ? (res as any).data 
            : [];
        }
        setSessions(sessionsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching sessions:', err);
        setSessions([]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedSession) {
      setStats(null);
      setEnrollments([]);
      setSelectedClassId(null);
      return;
    }
    
    secureApiService.get(`/enrollments/stats/${selectedSession}`)
      .then(res => {
        const statsData = (res.data as any)?.data || res.data;
        setStats(statsData);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        setStats(null);
      });
    
    secureApiService.get(`/enrollments/session/${selectedSession}`)
      .then(res => {
        let enrollmentsData = [];
        if (Array.isArray(res.data)) {
          enrollmentsData = res.data;
        } else if ((res.data as any)?.data) {
          enrollmentsData = Array.isArray((res.data as any).data) 
            ? (res.data as any).data 
            : [];
        }
        setEnrollments(enrollmentsData);
      })
      .catch(err => {
        console.error('Error fetching enrollments:', err);
        setEnrollments([]);
      });
  }, [selectedSession]);

  // Extract unique classes from enrollments with custom sorting
  const classes = useMemo(() => {
    const classMap = new Map();
    enrollments.forEach((e: any) => {
      if (e.class?.id && e.class?.name) {
        if (!classMap.has(e.class.id)) {
          classMap.set(e.class.id, {
            id: e.class.id,
            name: e.class.name,
            code: e.class.code || '',
            studentCount: 0
          });
        }
        classMap.get(e.class.id).studentCount++;
      }
    });
    
    const customSort = (a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase().trim();
      const nameB = (b.name || '').toLowerCase().trim();
      
      const isPrepA = nameA.includes('prep');
      const isPrepB = nameB.includes('prep');
      
      if (isPrepA && !isPrepB) return -1;
      if (!isPrepA && isPrepB) return 1;
      if (isPrepA && isPrepB) return nameA.localeCompare(nameB);
      
      const extractNumber = (name: string): number => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0], 10) : 9999;
      };
      
      const extractSection = (name: string): string => {
        const match = name.match(/\b([A-Z])\b/i);
        return match ? match[1].toUpperCase() : '';
      };
      
      const numA = extractNumber(nameA);
      const numB = extractNumber(nameB);
      
      if (numA !== numB) {
        return numA - numB;
      }
      
      const sectionA = extractSection(nameA);
      const sectionB = extractSection(nameB);
      
      if (sectionA && sectionB) {
        return sectionA.localeCompare(sectionB);
      }
      
      return nameA.localeCompare(nameB);
    };
    
    return Array.from(classMap.values()).sort(customSort);
  }, [enrollments]);

  // Filter enrollments by selected class
  const filteredEnrollments = useMemo(() => {
    if (!selectedClassId) {
      return enrollments;
    }
    return enrollments.filter((e: any) => 
      e.class?.id === selectedClassId || String(e.class?.id) === selectedClassId
    );
  }, [enrollments, selectedClassId]);

  // Search and paginate students
  const searchedAndPaginatedEnrollments = useMemo(() => {
    let filtered = filteredEnrollments;
    
    // Apply search filter
    if (studentsSearchQuery.trim()) {
      const query = studentsSearchQuery.toLowerCase().trim();
      filtered = filtered.filter((e: any) => {
        const firstName = (e.student?.user?.firstName || '').toLowerCase();
        const lastName = (e.student?.user?.lastName || '').toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const className = (e.class?.name || '').toLowerCase();
        const classCode = (e.class?.code || '').toLowerCase();
        const rollNo = (e.student?.rollNo || '').toLowerCase();
        
        return fullName.includes(query) || 
               firstName.includes(query) || 
               lastName.includes(query) ||
               className.includes(query) ||
               classCode.includes(query) ||
               rollNo.includes(query);
      });
    }
    
    // Apply pagination - return only the first `studentsLimit` items
    return filtered.slice(0, studentsLimit);
  }, [filteredEnrollments, studentsSearchQuery, studentsLimit]);

  // Get total count after search (before pagination)
  const totalFilteredCount = useMemo(() => {
    if (!studentsSearchQuery.trim()) {
      return filteredEnrollments.length;
    }
    const query = studentsSearchQuery.toLowerCase().trim();
    return filteredEnrollments.filter((e: any) => {
      const firstName = (e.student?.user?.firstName || '').toLowerCase();
      const lastName = (e.student?.user?.lastName || '').toLowerCase();
      const fullName = `${firstName} ${lastName}`.trim();
      const className = (e.class?.name || '').toLowerCase();
      const classCode = (e.class?.code || '').toLowerCase();
      const rollNo = (e.student?.rollNo || '').toLowerCase();
      
      return fullName.includes(query) || 
             firstName.includes(query) || 
             lastName.includes(query) ||
             className.includes(query) ||
             classCode.includes(query) ||
             rollNo.includes(query);
    }).length;
  }, [filteredEnrollments, studentsSearchQuery]);

  // Reset selected class when session changes
  useEffect(() => {
    setSelectedClassId(null);
    setClassDetailTab('students');
  }, [selectedSession]);

  // Financial: Get date range for selected Shamsi month (or full year when 0)
  const { startISO, endISO } = useMemo(() => {
    if (selectedShMonth === 0) {
      const hamal = shamsiMonthRangeToGregorian(selectedShYear, 1);
      const hoot = shamsiMonthRangeToGregorian(selectedShYear, 12);
      return { startISO: hamal.startISO, endISO: hoot.endISO };
    }
    return shamsiMonthRangeToGregorian(selectedShYear, selectedShMonth as any);
  }, [selectedShYear, selectedShMonth]);

  // Financial: Fetch payments with class filter
  const paymentsFilters = useMemo(() => {
    const filters: any = { 
      dateRange: { startDate: startISO, endDate: endISO } 
    };
    // Add classId filter if a class is selected
    if (selectedClassId) {
      filters.classId = selectedClassId;
    }
    return filters;
  }, [startISO, endISO, selectedClassId]);
  
  const { data: paymentsResp } = usePayments(paymentsFilters as any);
  const classPayments: any[] = useMemo(() => {
    const d: any = (paymentsResp as any)?.data || paymentsResp || [];
    return Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : [];
  }, [paymentsResp]);

  // Attendance: Fetch attendance data for selected month
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  useEffect(() => {
    if (classDetailTab === 'attendance' && selectedClassId && selectedSessionYear) {
      if (selectedAttMonth === 0) {
        fetchYearlyAttendanceData();
      } else {
        fetchAttendanceData();
      }
    }
  }, [classDetailTab, selectedClassId, selectedAttMonth, selectedSessionYear]);

  const fetchAttendanceData = async () => {
    if (!selectedClassId || !selectedSessionYear || selectedAttMonth === 0) return;
    
    setAttendanceLoading(true);
    try {
      // Calculate Gregorian date range for selected Shamsi month
      const { startISO: attStart, endISO: attEnd } = shamsiMonthRangeToGregorian(
        selectedSessionYear - 621, 
        selectedAttMonth as any
      );
      
      console.log('📅 Fetching attendance for:', {
        classId: selectedClassId,
        startDate: attStart,
        endDate: attEnd
      });
      
      // Fetch attendance records for the class and date range
      const res = await secureApiService.get('/attendances', {
        params: {
          classId: selectedClassId,
          startDate: attStart,
          endDate: attEnd,
          limit: 500 // Increase limit to get more records
        }
      });
      
      console.log('📊 Attendance response:', res.data);
      
      // Backend returns { success, data: { attendances: [...], pagination: {...} } }
      const data = (res.data as any)?.data?.attendances || 
                   (res.data as any)?.attendances || 
                   (res.data as any)?.data || 
                   res.data || 
                   [];
      
      console.log('✅ Extracted attendance data:', data.length, 'records');
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching attendance:', error);
      setAttendanceData([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  const fetchYearlyAttendanceData = async () => {
    if (!selectedClassId || !selectedSessionYear) return;
    
    setYearlyAttendanceLoading(true);
    try {
      // Calculate Gregorian date range for full year (Hamal to Hoot)
      const hamalStart = shamsiMonthRangeToGregorian(selectedSessionYear - 621, 1);
      const hootEnd = shamsiMonthRangeToGregorian(selectedSessionYear - 621, 12);
      
      console.log('📅 Fetching yearly attendance for:', {
        classId: selectedClassId,
        startDate: hamalStart.startISO,
        endDate: hootEnd.endISO
      });
      
      // Fetch attendance records for the entire year
      const res = await secureApiService.get('/attendances', {
        params: {
          classId: selectedClassId,
          startDate: hamalStart.startISO,
          endDate: hootEnd.endISO,
          limit: 5000 // Higher limit for full year data
        }
      });
      
      // Backend returns { success, data: { attendances: [...], pagination: {...} } }
      const data = (res.data as any)?.data?.attendances || 
                   (res.data as any)?.attendances || 
                   (res.data as any)?.data || 
                   res.data || 
                   [];
      
      console.log('✅ Extracted yearly attendance data:', data.length, 'records');
      setYearlyAttendanceData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('❌ Error fetching yearly attendance:', error);
      setYearlyAttendanceData([]);
    } finally {
      setYearlyAttendanceLoading(false);
    }
  };

  // Timetable: Fetch timetable data
  const [timetableData, setTimetableData] = useState<any>(null);
  const [timetableLoading, setTimetableLoading] = useState(false);

  useEffect(() => {
    if (classDetailTab === 'timetable' && selectedClassId && selectedSessionYear) {
      fetchTimetableData();
    }
  }, [classDetailTab, selectedClassId, selectedSessionYear]);

  const fetchTimetableData = async () => {
    if (!selectedClassId || !selectedSessionYear) return;
    
    setTimetableLoading(true);
    try {
      // Fetch timetable for the class - using correct backend route
      const res = await secureApiService.get(`/classes/${selectedClassId}/timetables`, {
        params: {
          year: selectedSessionYear
        }
      });
      
      const data = (res.data as any)?.data || res.data;
      setTimetableData(data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
      setTimetableData(null);
    } finally {
      setTimetableLoading(false);
    }
  };

  const selectedClass = classes.find(c => String(c.id) === selectedClassId);
  const selectedMonthName = selectedShMonth === 0
    ? 'All Months (Hamal–Hoot)'
    : (SHAMSI_MONTHS.find(m => m.id === selectedShMonth)?.label || '');
  const selectedAttMonthName = SHAMSI_MONTHS.find(m => m.id === selectedAttMonth)?.label || '';

  // Format date for display
  const formatPaymentDate = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) return 'N/A';
    
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      {loading ? (
        <div className="text-center py-8">{t('historicalData.loading')}</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-black">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('historicalData.selectAcademicYear')}</label>
          <select 
            value={selectedSession} 
            onChange={e => setSelectedSession(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="">{t('historicalData.selectAcademicYear')}</option>
            {sessions.map((s: any) => (
              <option key={s.id} value={String(s.id)}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      {selectedSession && (
        <>
          {/* Statistics */}
          {stats && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-gray-500">
              <h3 className="font-semibold text-lg mb-2">{t('historicalData.statistics')}</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">{t('historicalData.totalEnrollments')}: </span>
                  <span className="font-bold">{stats.total || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('historicalData.enrolled')}: </span>
                  <span className="font-bold">{stats.byStatus?.enrolled || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('historicalData.promoted')}: </span>
                  <span className="font-bold">{stats.byStatus?.promoted || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {classes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 text-black">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 text-black">{t('historicalData.classes')} ({classes.length})</h3>
              <div className="overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  <button
                    onClick={() => setSelectedClassId(null)}
                    className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedClassId === null
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {t('historicalData.allClasses')} ({enrollments.length})
                  </button>
                  {classes.map((cls) => (
                    <button
                      key={cls.id}
                      onClick={() => setSelectedClassId(String(cls.id))}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-colors whitespace-nowrap ${
                        selectedClassId === String(cls.id)
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {cls.name}{cls.code ? ` (${cls.code})` : ''}
                      <span className="ml-2 text-xs opacity-75">({cls.studentCount})</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Class Detail Tabs - Only show when a class is selected */}
          {selectedClassId && selectedClass && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-200">
                {(['students', 'financial', 'attendance', 'timetable'] as ClassDetailTab[]).map((tab) => {
                  const tabLabels: {[key in ClassDetailTab]: string} = {
                    students: t('historicalData.students'),
                    financial: t('historicalData.financial'),
                    attendance: t('historicalData.attendance'),
                    timetable: t('historicalData.timetable')
                  };
                  return (
                    <button
                      key={tab}
                      onClick={() => setClassDetailTab(tab)}
                      className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                        classDetailTab === tab
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tabLabels[tab]}
                    </button>
                  );
                })}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Students Tab */}
                {classDetailTab === 'students' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Students - {selectedClass.name}{selectedClass.code ? ` (${selectedClass.code})` : ''}
                        <span className="text-sm font-normal text-gray-500 ml-2">
                          ({totalFilteredCount} student{totalFilteredCount !== 1 ? 's' : ''})
                          {studentsSearchQuery && ` (${searchedAndPaginatedEnrollments.length} shown)`}
                        </span>
                      </h3>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="mb-4">
                      <input
                        type="text"
                        placeholder={t('historicalData.search')}
                        value={studentsSearchQuery}
                        onChange={(e) => setStudentsSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="border border-gray-300 px-4 py-2 text-left">{t('leaveModal.unnamedStudent')}</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">{t('enrollmentManager.class')}</th>
                            <th className="border border-gray-300 px-4 py-2 text-left">{t('enrollmentManager.admission')}</th>
                          </tr>
                          </thead>
                          <tbody>
                          {searchedAndPaginatedEnrollments.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                {studentsSearchQuery ? t('superadmin.details.noStudents') : 'No students found for this class'}
                              </td>
                            </tr>
                          ) : (
                            searchedAndPaginatedEnrollments.map((e: any) => (
                              <tr key={e.id} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">
                                  {e.student?.user?.firstName || ''} {e.student?.user?.lastName || ''}
                                  {!e.student?.user && <span className="text-gray-400">N/A</span>}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {e.class?.name || 'N/A'}{e.class?.code ? ` (${e.class.code})` : ''}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  <span className={`px-2 py-1 rounded text-sm ${
                                    e.status === 'enrolled' ? 'bg-green-100 text-green-800' :
                                    e.status === 'promoted' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {e.status || 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* See More Button */}
                    {searchedAndPaginatedEnrollments.length < totalFilteredCount && (
                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setStudentsLimit(prev => prev + 50)}
                          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                        >
                          See More ({totalFilteredCount - searchedAndPaginatedEnrollments.length} more)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Financial Tab */}
                {classDetailTab === 'financial' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Financial - {selectedClass.name}{selectedClass.code ? ` (${selectedClass.code})` : ''}
                      </h3>
                      
                      {/* Shamsi Year and Month Selectors */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-semibold text-gray-900">{t('historicalData.selectShamsiMonth')}</h4>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-600">{t('historicalData.year')}:</label>
                            <input
                              type="number"
                              className="w-24 border rounded px-2 py-1 text-sm"
                              value={selectedShYear}
                              onChange={e => setSelectedShYear(Number(e.target.value || selectedShYear))}
                            />
                          </div>
                        </div>
                        <div className="flex overflow-x-auto gap-2 py-1">
                          {/* All Months (Hamal–Hoot) option - shown before Hamal */}
                          <button
                            onClick={() => setSelectedShMonth(0)}
                            className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                              selectedShMonth === 0 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            All Months (Hamal–Hoot)
                          </button>
                          {getShamsiMonths().map(m => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedShMonth(m.id)}
                              className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                                selectedShMonth === m.id 
                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Yearly Summary or Monthly Payments */}
                      {selectedShMonth === 0 ? (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-3">
                            Yearly Finance Summary (Hamal–Hoot) {selectedShYear}
                          </h4>
                          {/* Summary cards */}
                          {(() => {
                            const totals = (classPayments || []).reduce((acc: any, p: any) => {
                              const amount = Number(p?.total ?? p?.amount ?? 0) || 0;
                              const method = String(p?.method || 'Unknown');
                              const status = String(p?.status || 'unknown').toLowerCase();
                              acc.totalAmount += amount;
                              acc.count += 1;
                              acc.byMethod[method] = (acc.byMethod[method] || 0) + amount;
                              if (status === 'completed' || status === 'success' || status === 'paid') acc.completed += 1;
                              else acc.other += 1;
                              return acc;
                            }, { totalAmount: 0, count: 0, completed: 0, other: 0, byMethod: {} as Record<string, number> });

                            const methodEntries = Object.entries(totals.byMethod).sort((a, b) => b[1] - a[1]);

                            return (
                              <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="text-sm text-gray-600">{t('historicalData.totalAmount')}</div>
                                    <div className="text-2xl font-bold text-gray-900">AFN {Number(totals.totalAmount).toLocaleString()}</div>
                                  </div>
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="text-sm text-gray-600">{t('historicalData.totalPayments')}</div>
                                    <div className="text-2xl font-bold text-gray-900">{totals.count.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="text-sm text-gray-600">{t('historicalData.completed')}</div>
                                    <div className="text-2xl font-bold text-green-700">{totals.completed.toLocaleString()}</div>
                                  </div>
                                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <div className="text-sm text-gray-600">{t('historicalData.otherStatus')}</div>
                                    <div className="text-2xl font-bold text-gray-900">{totals.other.toLocaleString()}</div>
                                  </div>
                                </div>

                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                  <div className="text-md font-semibold text-gray-900 mb-3">{t('historicalData.byMethod')}</div>
                                  {methodEntries.length === 0 ? (
                                    <div className="text-gray-500">{t('historicalData.noData')}</div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {methodEntries.map(([method, amount]) => (
                                        <div key={method} className="flex items-center justify-between border rounded-lg px-3 py-2">
                                          <span className="text-sm text-gray-700">{method}</span>
                                          <span className="text-sm font-semibold">AFN {Number(amount).toLocaleString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}

                          {/* Empty note */}
                          {classPayments.length === 0 && (
                            <div className="mt-4 text-center text-gray-500">{t('historicalData.noPaymentsFound')} Hamal–Hoot {selectedShYear}</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-md font-semibold text-gray-900 mb-3">
                            Payments for {selectedMonthName} {selectedShYear}
                          </h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse border border-gray-300">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="border border-gray-300 px-4 py-2 text-left">{t('historicalData.date')}</th>
                                   <th className="border border-gray-300 px-4 py-2 text-left">{t('historicalData.student')}</th>
                                   <th className="border border-gray-300 px-4 py-2 text-left">{t('historicalData.amount')}</th>
                                   <th className="border border-gray-300 px-4 py-2 text-left">{t('historicalData.method')}</th>
                                   <th className="border border-gray-300 px-4 py-2 text-left">{t('historicalData.status')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {classPayments.length === 0 ? (
                                  <tr>
                                    <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                      No payments found for {selectedMonthName} {selectedShYear}
                                    </td>
                                  </tr>
                                ) : (
                                  classPayments.map((payment: any) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                      <td className="border border-gray-300 px-4 py-2">
                                        {formatPaymentDate(payment.paymentDate || payment.date)}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2">
                                        {payment.student?.user?.firstName || ''} {payment.student?.user?.lastName || ''}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2">
                                        AFN {Number(payment.total || payment.amount || 0).toLocaleString()}
                                      </td>
                                      <td className="border border-gray-300 px-4 py-2">{payment.method || 'N/A'}</td>
                                      <td className="border border-gray-300 px-4 py-2">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {payment.status || 'N/A'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Attendance Tab */}
                {classDetailTab === 'attendance' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Attendance - {selectedClass.name}{selectedClass.code ? ` (${selectedClass.code})` : ''}
                      </h3>
                      
                      {/* Shamsi Month Selector */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Select Shamsi Month</h4>
                        <div className="flex overflow-x-auto gap-2 py-1">
                          {/* All Months option - shown first */}
                          <button
                            onClick={() => setSelectedAttMonth(0)}
                            className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                              selectedAttMonth === 0 
                                ? 'bg-indigo-600 text-white border-indigo-600' 
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            All Months
                          </button>
                          {getShamsiMonths().map(m => (
                            <button
                              key={m.id}
                              onClick={() => setSelectedAttMonth(m.id)}
                              className={`px-3 py-1 rounded-full border text-sm whitespace-nowrap ${
                                selectedAttMonth === m.id 
                                  ? 'bg-indigo-600 text-white border-indigo-600' 
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Yearly Attendance Summary - All Months */}
                      {selectedAttMonth === 0 && (
                        <>
                          {yearlyAttendanceLoading ? (
                            <div className="text-center py-8 text-gray-500">{t('historicalData.loadingYearlyAttendance')}</div>
                          ) : (
                            (() => {
                              // Get all students from filtered enrollments
                              const allStudents = filteredEnrollments
                                .filter((e: any) => e.student?.user)
                                .map((e: any) => ({
                                  id: e.student?.id,
                                  enrollmentId: e.id,
                                  name: `${e.student?.user?.firstName || ''} ${e.student?.user?.lastName || ''}`.trim(),
                                  rollNo: e.student?.rollNo || ''
                                }))
                                .sort((a, b) => {
                                  // Sort by roll number if available, otherwise by name
                                  if (a.rollNo && b.rollNo) {
                                    return a.rollNo.localeCompare(b.rollNo);
                                  }
                                  return a.name.localeCompare(b.name);
                                });

                              // Helper function to determine Shamsi month from a date
                              const getShamsiMonthFromDate = (dateStr: string): number => {
                                try {
                                  const date = new Date(dateStr);
                                  const gregorianYear = date.getFullYear();
                                  const gregorianMonth = date.getMonth() + 1; // 1-12
                                  const gregorianDay = date.getDate();

                                  // Rough mapping (simplified - could be improved)
                                  if (gregorianMonth === 3 && gregorianDay >= 21) return 1; // Hamal
                                  else if (gregorianMonth === 4 && gregorianDay <= 20) return 1;
                                  else if (gregorianMonth === 4 && gregorianDay >= 21) return 2; // Saur
                                  else if (gregorianMonth === 5 && gregorianDay <= 21) return 2;
                                  else if (gregorianMonth === 5 && gregorianDay >= 22) return 3; // Jawza
                                  else if (gregorianMonth === 6 && gregorianDay <= 21) return 3;
                                  else if (gregorianMonth === 6 && gregorianDay >= 22) return 4; // Saratan
                                  else if (gregorianMonth === 7 && gregorianDay <= 22) return 4;
                                  else if (gregorianMonth === 7 && gregorianDay >= 23) return 5; // Asad
                                  else if (gregorianMonth === 8 && gregorianDay <= 22) return 5;
                                  else if (gregorianMonth === 8 && gregorianDay >= 23) return 6; // Sunbula
                                  else if (gregorianMonth === 9 && gregorianDay <= 22) return 6;
                                  else if (gregorianMonth === 9 && gregorianDay >= 23) return 7; // Mizan
                                  else if (gregorianMonth === 10 && gregorianDay <= 22) return 7;
                                  else if (gregorianMonth === 10 && gregorianDay >= 23) return 8; // Aqrab
                                  else if (gregorianMonth === 11 && gregorianDay <= 21) return 8;
                                  else if (gregorianMonth === 11 && gregorianDay >= 22) return 9; // Qaws
                                  else if (gregorianMonth === 12 && gregorianDay <= 21) return 9;
                                  else if (gregorianMonth === 12 && gregorianDay >= 22) return 10; // Jadi
                                  else if (gregorianMonth === 1 && gregorianDay <= 20) return 10;
                                  else if (gregorianMonth === 1 && gregorianDay >= 21) return 11; // Dalw
                                  else if (gregorianMonth === 2 && gregorianDay <= 19) return 11;
                                  else if (gregorianMonth === 2 && gregorianDay >= 20) return 12; // Hoot
                                  else if (gregorianMonth === 3 && gregorianDay <= 20) return 12;
                                  return 1; // Default to Hamal
                                } catch (e) {
                                  return 1;
                                }
                              };

                              // Create attendance map: studentId -> month -> status counts
                              const yearlyAttendanceMap: Record<string, Record<number, { present: number; absent: number; late: number; excused: number }>> = {};
                              
                              // Initialize all students with all months
                              allStudents.forEach(student => {
                                yearlyAttendanceMap[student.id] = {};
                                for (let month = 1; month <= 12; month++) {
                                  yearlyAttendanceMap[student.id][month] = { present: 0, absent: 0, late: 0, excused: 0 };
                                }
                              });

                              // Process all attendance records for the year, grouped by month
                              (yearlyAttendanceData || []).forEach((record: any) => {
                                const studentId = record.student?.id || record.studentId;
                                if (!studentId || !yearlyAttendanceMap[studentId]) return;
                                
                                const dateStr = record.date ? new Date(record.date).toISOString().split('T')[0] : null;
                                if (!dateStr) return;
                                
                                const shamsiMonth = getShamsiMonthFromDate(dateStr);
                                const status = record.status || 'ABSENT';
                                
                                if (status === 'PRESENT') yearlyAttendanceMap[studentId][shamsiMonth].present++;
                                else if (status === 'ABSENT') yearlyAttendanceMap[studentId][shamsiMonth].absent++;
                                else if (status === 'LATE') yearlyAttendanceMap[studentId][shamsiMonth].late++;
                                else if (status === 'EXCUSED') yearlyAttendanceMap[studentId][shamsiMonth].excused++;
                              });

                              // Calculate monthly totals for all students
                              const monthlyTotals: Record<number, { present: number; absent: number; late: number; excused: number }> = {};
                              for (let month = 1; month <= 12; month++) {
                                monthlyTotals[month] = { present: 0, absent: 0, late: 0, excused: 0 };
                              }

                              allStudents.forEach(student => {
                                for (let month = 1; month <= 12; month++) {
                                  const stats = yearlyAttendanceMap[student.id]?.[month] || { present: 0, absent: 0, late: 0, excused: 0 };
                                  monthlyTotals[month].present += stats.present;
                                  monthlyTotals[month].absent += stats.absent;
                                  monthlyTotals[month].late += stats.late;
                                  monthlyTotals[month].excused += stats.excused;
                                }
                              });

                              // Calculate grand totals (all months combined)
                              const grandTotals = allStudents.reduce((acc, student) => {
                                let studentTotal = { present: 0, absent: 0, late: 0, excused: 0 };
                                for (let month = 1; month <= 12; month++) {
                                  const stats = yearlyAttendanceMap[student.id]?.[month] || { present: 0, absent: 0, late: 0, excused: 0 };
                                  studentTotal.present += stats.present;
                                  studentTotal.absent += stats.absent;
                                  studentTotal.late += stats.late;
                                  studentTotal.excused += stats.excused;
                                }
                                acc.present += studentTotal.present;
                                acc.absent += studentTotal.absent;
                                acc.late += studentTotal.late;
                                acc.excused += studentTotal.excused;
                                return acc;
                              }, { present: 0, absent: 0, late: 0, excused: 0 });

                              return (
                                <div className="space-y-4">
                                  {/* Student Yearly Totals Table */}
                                  <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
                                    <h4 className="text-md font-semibold text-gray-900 mb-4">
                                      Yearly Attendance Summary - All Months (Hamal to Hoot) {selectedSessionYear - 621}
                                    </h4>
                                    <div className="overflow-x-auto">
                                      <table className="min-w-full border-collapse border border-gray-300">
                                        <thead className="bg-gray-100">
                                          <tr>
                                            <th rowSpan={2} className="border border-gray-300 px-3 py-3 text-left font-semibold sticky left-0 bg-gray-100 z-10">{t('historicalData.rollNo')}</th>
                                             <th rowSpan={2} className="border border-gray-300 px-3 py-3 text-left font-semibold sticky left-[80px] bg-gray-100 z-10 min-w-[160px]">{t('historicalData.studentName')}</th>
                                            <th rowSpan={2} className="border-0 w-12 bg-gray-100 sticky left-[240px] z-10"></th>
                                            {SHAMSI_MONTHS.map((month) => (
                                              <th key={month.id} colSpan={4} className="border border-gray-300 px-2 py-2 text-center font-semibold bg-gray-50">
                                                {month.label}
                                              </th>
                                            ))}
                                            <th colSpan={4} className="border border-gray-300 px-2 py-2 text-center font-semibold bg-blue-100">
                                               {t('historicalData.totalStudents')}
                                             </th>
                                          </tr>
                                          <tr>
                                            {SHAMSI_MONTHS.map((month) => (
                                              <React.Fragment key={month.id}>
                                                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-green-50">P</th>
                                                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-red-50">A</th>
                                                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-yellow-50">L</th>
                                                <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-purple-50">E</th>
                                              </React.Fragment>
                                            ))}
                                            <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-green-50">P</th>
                                            <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-red-50">A</th>
                                            <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-yellow-50">L</th>
                                            <th className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold bg-purple-50">E</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {allStudents.length === 0 ? (
                                            <tr>
                                              <td colSpan={52} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                                No students found for this class
                                              </td>
                                            </tr>
                                          ) : (
                                            <>
                                              {allStudents.map((student) => {
                                                let studentTotal = { present: 0, absent: 0, late: 0, excused: 0 };
                                                for (let month = 1; month <= 12; month++) {
                                                  const stats = yearlyAttendanceMap[student.id]?.[month] || { present: 0, absent: 0, late: 0, excused: 0 };
                                                  studentTotal.present += stats.present;
                                                  studentTotal.absent += stats.absent;
                                                  studentTotal.late += stats.late;
                                                  studentTotal.excused += stats.excused;
                                                }
                                                
                                                return (
                                                  <tr key={student.id} className="hover:bg-gray-50">
                                                    <td className="border border-gray-300 px-3 py-2 sticky left-0 bg-white z-10">
                                                      {student.rollNo || '-'}
                                                    </td>
                                                    <td className="border border-gray-300 px-3 py-2 font-medium sticky left-[80px] bg-white z-10 min-w-[160px]">
                                                      {student.name}
                                                    </td>
                                                    <td className="border-0 w-12 bg-white sticky left-[240px] z-10"></td>
                                                    {SHAMSI_MONTHS.map((month) => {
                                                      const stats = yearlyAttendanceMap[student.id]?.[month.id] || { present: 0, absent: 0, late: 0, excused: 0 };
                                                      return (
                                                        <React.Fragment key={month.id}>
                                                          <td className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-green-600">
                                                            {stats.present}
                                                          </td>
                                                          <td className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-red-600">
                                                            {stats.absent}
                                                          </td>
                                                          <td className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-yellow-600">
                                                            {stats.late}
                                                          </td>
                                                          <td className="border border-gray-300 px-2 py-2 text-center text-xs font-semibold text-purple-600">
                                                            {stats.excused}
                                                          </td>
                                                        </React.Fragment>
                                                      );
                                                    })}
                                                    <td className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-green-600 bg-green-50">
                                                      {studentTotal.present}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-red-600 bg-red-50">
                                                      {studentTotal.absent}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-yellow-600 bg-yellow-50">
                                                      {studentTotal.late}
                                                    </td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center text-xs font-bold text-purple-600 bg-purple-50">
                                                      {studentTotal.excused}
                                                    </td>
                                                  </tr>
                                                );
                                              })}
                                              {/* Monthly Totals Row */}
                                              <tr className="bg-gray-100 font-bold">
                                                <td className="border border-gray-300 px-3 py-2 sticky left-0 bg-gray-100 z-10">{t('historicalData.monthlyTotals')}</td>
                                                <td className="border border-gray-300 px-3 py-2 sticky left-[80px] bg-gray-100 z-10"></td>
                                                <td className="border-0 w-12 bg-gray-100 sticky left-[240px] z-10"></td>
                                                {SHAMSI_MONTHS.map((month) => {
                                                  const totals = monthlyTotals[month.id] || { present: 0, absent: 0, late: 0, excused: 0 };
                                                  return (
                                                    <React.Fragment key={month.id}>
                                                      <td className="border border-gray-300 px-2 py-2 text-center text-xs text-green-600 bg-green-50">
                                                        {totals.present}
                                                      </td>
                                                      <td className="border border-gray-300 px-2 py-2 text-center text-xs text-red-600 bg-red-50">
                                                        {totals.absent}
                                                      </td>
                                                      <td className="border border-gray-300 px-2 py-2 text-center text-xs text-yellow-600 bg-yellow-50">
                                                        {totals.late}
                                                      </td>
                                                      <td className="border border-gray-300 px-2 py-2 text-center text-xs text-purple-600 bg-purple-50">
                                                        {totals.excused}
                                                      </td>
                                                    </React.Fragment>
                                                  );
                                                })}
                                                <td className="border border-gray-300 px-2 py-2 text-center text-xs text-green-600 bg-green-100">
                                                  {grandTotals.present}
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2 text-center text-xs text-red-600 bg-red-100">
                                                  {grandTotals.absent}
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2 text-center text-xs text-yellow-600 bg-yellow-100">
                                                  {grandTotals.late}
                                                </td>
                                                <td className="border border-gray-300 px-2 py-2 text-center text-xs text-purple-600 bg-purple-100">
                                                  {grandTotals.excused}
                                                </td>
                                              </tr>
                                            </>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
                          )}
                        </>
                      )}

                      {/* Attendance Monthly Matrix View */}
                       {selectedAttMonth !== 0 && attendanceLoading ? (
                         <div className="text-center py-8 text-gray-500">{t('historicalData.loadingAttendance')}</div>
                      ) : selectedAttMonth !== 0 && (
                        <div>
                          {(() => {
                            // Get date range for selected month
                            const { startISO, endISO } = shamsiMonthRangeToGregorian(
                              selectedSessionYear - 621, 
                              selectedAttMonth as any
                            );
                            
                            const startDate = new Date(startISO);
                            const endDate = new Date(endISO);
                            const allDates: string[] = [];
                            
                            // Generate array of all dates in the month
                            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                              allDates.push(new Date(d).toISOString().split('T')[0]);
                            }
                            
                            // Get all students from filtered enrollments
                            const students = filteredEnrollments
                              .filter((e: any) => e.student?.user)
                              .map((e: any) => ({
                                id: e.student?.id,
                                enrollmentId: e.id,
                                name: `${e.student?.user?.firstName || ''} ${e.student?.user?.lastName || ''}`.trim(),
                                rollNo: e.student?.rollNo || ''
                              }))
                              .sort((a, b) => {
                                // Sort by roll number if available, otherwise by name
                                if (a.rollNo && b.rollNo) {
                                  return a.rollNo.localeCompare(b.rollNo);
                                }
                                return a.name.localeCompare(b.name);
                              });
                            
                            // Create attendance map: studentId -> date -> status
                            const attendanceMap: Record<string, Record<string, string>> = {};
                            (attendanceData || []).forEach((record: any) => {
                              const studentId = record.student?.id || record.studentId;
                              if (!studentId) return;
                              
                              const dateStr = record.date ? new Date(record.date).toISOString().split('T')[0] : null;
                              if (!dateStr) return;
                              
                              if (!attendanceMap[studentId]) {
                                attendanceMap[studentId] = {};
                              }
                              attendanceMap[studentId][dateStr] = record.status || 'ABSENT';
                            });
                            
                            // Calculate summary for each student
                            const studentSummaries = students.map(student => {
                              const dailyAttendance = attendanceMap[student.id] || {};
                              let present = 0, absent = 0, late = 0, excused = 0;
                              
                              Object.values(dailyAttendance).forEach((status: any) => {
                                if (status === 'PRESENT') present++;
                                else if (status === 'ABSENT') absent++;
                                else if (status === 'LATE') late++;
                                else if (status === 'EXCUSED') excused++;
                              });
                              
                              return {
                                ...student,
                                summary: { present, absent, late, excused, total: allDates.length },
                                dailyAttendance
                              };
                            });
                            
                            // Calculate end day of Shamsi month (number of days)
                            const lastDayOfMonth = allDates.length;

                            // Calculate totals for each day once (present, absent, late, excused)
                            const dailyTotals = allDates.map((dateStr) => {
                              let present = 0, absent = 0, late = 0, excused = 0;
                              studentSummaries.forEach((student) => {
                                const attendance = student.dailyAttendance[dateStr];
                                if (attendance === 'PRESENT') present++;
                                else if (attendance === 'ABSENT') absent++;
                                else if (attendance === 'LATE') late++;
                                else if (attendance === 'EXCUSED') excused++;
                              });
                              return { dateStr, present, absent, late, excused };
                            });
                            
                            return (
                              <div className="space-y-4">
                                {/* Date Range Display */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                  <h4 className="text-md font-semibold text-gray-900 mb-2">
                                    Attendance for {selectedAttMonthName} {selectedSessionYear - 621}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    Date Range: 1 {selectedAttMonthName} - {lastDayOfMonth} {selectedAttMonthName} ({allDates.length} days)
                                  </p>
                                </div>
                                
                                {/* Summary moved to top */}
                                <div className="bg-gray-50 border-2 border-gray-300 rounded-lg px-4 py-4 mb-4">
                                  <div className="flex justify-around flex-wrap gap-4">
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 mb-1">{t('historicalData.totalStudents')}</div>
                                      <div className="text-lg font-bold text-gray-900">{students.length}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 mb-1">{t('historicalData.month')}</div>
                                      <div className="text-lg font-bold text-gray-900">{selectedAttMonthName}</div>
                                    </div>
                                    <div className="text-center">
                                      <div className="text-sm text-gray-600 mb-1">{t('historicalData.days')}</div>
                                      <div className="text-lg font-bold text-gray-900">{allDates.length}</div>
                                    </div>
                                  </div>
                                </div>

                                {students.length === 0 ? (
                                  <div className="text-center py-12 text-gray-500">
                                    No students found for this class
                                  </div>
                                ) : (
                                  <>
                                    {/* Legend */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                                      <div className="flex justify-center gap-8 flex-wrap">
                                        <div className="flex items-center gap-2">
                                           <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                           <span className="text-sm font-medium text-gray-700">{t('historicalData.present')}</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                           <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                           <span className="text-sm font-medium text-gray-700">{t('historicalData.absent')}</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                           <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                                           <span className="text-sm font-medium text-gray-700">{t('historicalData.late')}</span>
                                         </div>
                                         <div className="flex items-center gap-2">
                                           <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                                           <span className="text-sm font-medium text-gray-700">{t('historicalData.excused')}</span>
                                         </div>
                                      </div>
                                    </div>

                                    {/* Horizontal per-day summary tabs */}
                                    <div className="mt-3 overflow-x-auto">
                                      <div className="flex gap-2 min-w-max py-2">
                                        {dailyTotals.map((day, idx) => {
                                          const dateObj = new Date(day.dateStr + 'T12:00:00');
                                          const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                                          const shortDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                          return (
                                            <div key={day.dateStr} className={`px-3 py-2 rounded-lg border border-gray-300 bg-white flex flex-col items-center text-xs shadow-sm ${idx===0 ? 'ml-0' : ''}`}>
                                              <div className="font-semibold text-gray-900">{idx + 1}</div>
                                              <div className="text-[10px] text-gray-600 leading-tight">{weekday}</div>
                                              <div className="text-[10px] text-gray-500 leading-tight mb-1">{shortDate}</div>
                                              <div className="flex gap-2 mt-0.5">
                                              <span className="text-[10px] font-semibold text-green-600">P {day.present}</span>
                                              <span className="text-[10px] font-semibold text-red-600">A {day.absent}</span>
                                              <span className="text-[10px] font-semibold text-yellow-600">L {day.late}</span>
                                              <span className="text-[10px] font-semibold text-purple-600">E {day.excused}</span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {/* Matrix Table */}
                                    <div className="overflow-x-auto border-2 border-gray-300 rounded-lg">
                                      <div className="min-w-full bg-white">
                                        {/* Header Row with Dates */}
                                        <div className="flex bg-gray-200 border-b-2 border-gray-300 sticky top-0 z-10">
                                          {/* Student Info Column */}
                                          <div className="w-48 bg-gray-200 border-r-2 border-gray-300 px-3 py-3 flex-shrink-0">
                                            <div className="text-center">
                                              <span className="text-xs font-bold text-gray-900">{t('historicalData.studentInfoColumn')}</span>
                                            </div>
                                          </div>
                                          
                                          {/* Date Columns - Display Shamsi day numbers */}
                                          {allDates.map((dateStr, idx) => {
                                            const shamsiDay = idx + 1; // Day 1, 2, 3... of the Shamsi month
                                            const date = new Date(dateStr + 'T12:00:00');
                                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                            return (
                                              <div key={dateStr} className={`w-10 border-r border-gray-300 ${idx === 0 ? 'border-l-2 border-l-gray-300' : ''} bg-gray-200 flex-shrink-0`}>
                                                <div className="text-center py-1">
                                                  <div className="text-xs font-bold text-gray-900">{shamsiDay}</div>
                                                  <div className="text-xs text-gray-600">{dayName}</div>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>

                                        {/* Student Rows */}
                                        {studentSummaries.map((student, studentIndex) => (
                                          <div key={student.id} className={`flex border-b border-gray-300 ${studentIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                            {/* Student Info */}
                                            <div className="w-48 border-r-2 border-gray-300 px-3 py-2 bg-white flex-shrink-0">
                                              <div className="mb-2">
                                                <div className="text-xs font-semibold text-gray-900 leading-tight">
                                                  {student.name}
                                                </div>
                                                {student.rollNo && (
                                                  <div className="text-xs text-gray-600 mt-1">
                                                    Roll: {student.rollNo}
                                                  </div>
                                                )}
                                              </div>
                                              
                                              {/* Summary Stats */}
                                              <div className="grid grid-cols-2 gap-1">
                                                <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                                  <div className="text-xs font-bold text-green-600">{student.summary.present}</div>
                                                  <div className="text-xs text-gray-600">P</div>
                                                </div>
                                                <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                                  <div className="text-xs font-bold text-red-600">{student.summary.absent}</div>
                                                  <div className="text-xs text-gray-600">A</div>
                                                </div>
                                                <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                                  <div className="text-xs font-bold text-yellow-600">{student.summary.late}</div>
                                                  <div className="text-xs text-gray-600">L</div>
                                                </div>
                                                <div className="bg-white border border-gray-300 rounded px-1 py-1 text-center">
                                                  <div className="text-xs font-bold text-purple-600">{student.summary.excused}</div>
                                                  <div className="text-xs text-gray-600">E</div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Attendance Cells */}
                                            {allDates.map((dateStr, idx) => {
                                              const attendance = student.dailyAttendance[dateStr];
                                              
                                              return (
                                                <div key={dateStr} className={`w-10 h-12 border-r border-gray-300 ${idx === 0 ? 'border-l-2 border-l-gray-300' : ''} bg-white flex items-center justify-center flex-shrink-0`}>
                                                  {attendance ? (
                                                    attendance === 'EXCUSED' ? (
                                                      <span className="text-sm font-bold text-purple-700">L</span>
                                                    ) : (
                                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                                        attendance === 'PRESENT' ? 'bg-green-500' :
                                                        attendance === 'ABSENT' ? 'bg-red-500' :
                                                        attendance === 'LATE' ? 'bg-yellow-500' : 'bg-gray-400'
                                                      }`}>
                                                        <span className="text-xs font-bold text-white">
                                                          {attendance === 'PRESENT' ? '✓' : 
                                                           attendance === 'ABSENT' ? '✗' : 
                                                           attendance === 'LATE' ? '⏰' : '?'}
                                                        </span>
                                                      </div>
                                                    )
                                                  ) : (
                                                    <div className="w-5 h-5 border border-gray-300 bg-gray-100 rounded-full"></div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ))}
                                        
                                        {/* Daily Totals Row */}
                                        {(() => {
                                          // Calculate totals for each day
                                          const dailyTotals = allDates.map((dateStr) => {
                                            let present = 0, absent = 0, late = 0, excused = 0;
                                            
                                            studentSummaries.forEach((student) => {
                                              const attendance = student.dailyAttendance[dateStr];
                                              if (attendance === 'PRESENT') present++;
                                              else if (attendance === 'ABSENT') absent++;
                                              else if (attendance === 'LATE') late++;
                                              else if (attendance === 'EXCUSED') excused++;
                                            });
                                            
                                            return { dateStr, present, absent, late, excused };
                                          });
                                          
                                          return (
                                            <div className="flex border-t-2 border-gray-400 bg-gray-100 font-semibold">
                                              {/* Total Label */}
                                               <div className="w-48 border-r-2 border-gray-300 px-3 py-2 bg-gray-100 flex-shrink-0">
                                                 <div className="text-xs font-bold text-gray-900 text-center">
                                                   {t('historicalData.dailyTotals')}
                                                 </div>
                                               </div>
                                              
                                              {/* Total for each day (Present, Absent, Late, Leave) */}
                                              {dailyTotals.map((dayTotal, idx) => (
                                                <div key={dayTotal.dateStr} className={`w-10 h-16 border-r border-gray-300 ${idx === 0 ? 'border-l-2 border-l-gray-300' : ''} bg-gray-100 flex flex-col items-center justify-center gap-0.5 flex-shrink-0`}>
                                                  <div className="text-[10px] font-bold text-green-600">{dayTotal.present}</div>
                                                  <div className="text-[10px] font-bold text-red-600">{dayTotal.absent}</div>
                                                  <div className="text-[10px] font-bold text-yellow-600">{dayTotal.late}</div>
                                                  <div className="text-[10px] font-bold text-purple-600">{dayTotal.excused}</div>
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>

                                    {/* Summary Footer removed (moved above) */}
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Timetable Tab */}
                {classDetailTab === 'timetable' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Timetable - {selectedClass.name}{selectedClass.code ? ` (${selectedClass.code})` : ''}
                        {selectedSessionYear && (
                          <span className="text-sm font-normal text-gray-500 ml-2">
                            ({selectedSessionYear})
                          </span>
                        )}
                      </h3>
                      
                      {timetableLoading ? (
                        <div className="text-center py-8 text-gray-500">{t('historicalData.loadingTimetable')}</div>
                      ) : timetableData ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse border border-gray-300">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="border border-gray-300 px-4 py-2 text-left">Day</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Period</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Time</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Subject</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Teacher</th>
                                <th className="border border-gray-300 px-4 py-2 text-left">Room</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.isArray(timetableData) && timetableData.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                                    No timetable data available for this class
                                  </td>
                                </tr>
                              ) : (
                                (Array.isArray(timetableData) ? timetableData : []).map((slot: any, idx: number) => (
                                  <tr key={slot.id || idx} className="hover:bg-gray-50">
                                    <td className="border border-gray-300 px-4 py-2">
                                      {slot.dayName || slot.day || 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">{slot.period || 'N/A'}</td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      {slot.startTime && slot.endTime 
                                        ? `${slot.startTime} - ${slot.endTime}`
                                        : 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      {slot.subject?.name || slot.subjectName || 'N/A'}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      {slot.teacher?.user?.firstName || ''} {slot.teacher?.user?.lastName || ''}
                                    </td>
                                    <td className="border border-gray-300 px-4 py-2">
                                      {slot.roomNumber || slot.room || 'N/A'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No timetable data available for this class
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Show all students when no class is selected */}
          {!selectedClassId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t('historicalData.allStudents')}
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({totalFilteredCount} student{totalFilteredCount !== 1 ? 's' : ''})
                    {studentsSearchQuery && ` (${searchedAndPaginatedEnrollments.length} shown)`}
                  </span>
                </h3>
              </div>
              
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder = {t(`historicalData.search`)}
                  value={studentsSearchQuery}
                  onChange={(e) => setStudentsSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-500"
                />
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-500">{t('historicalData.enrollmentTable.student')}</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-500">{t('historicalData.enrollmentTable.class')}</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-gray-500">{t('historicalData.enrollmentTable.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedAndPaginatedEnrollments.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                          {studentsSearchQuery ? 'No students found matching your search' : 'No enrollments found for this academic year'}
                        </td>
                      </tr>
                    ) : (
                      searchedAndPaginatedEnrollments.map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50 text-gray-500">
                          <td className="border border-gray-300 px-4 py-2">
                            {e.student?.user?.firstName || ''} {e.student?.user?.lastName || ''}
                            {!e.student?.user && <span className="text-gray-400">N/A</span>}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            {e.class?.name || 'N/A'}{e.class?.code ? ` (${e.class.code})` : ''}
                          </td>
                          <td className="border border-gray-300 px-4 py-2">
                            <span className={`px-2 py-1 rounded text-sm ${
                              e.status === 'enrolled' ? 'bg-green-100 text-green-800' :
                              e.status === 'promoted' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {e.status === 'enrolled' ? t('historicalData.statusValues.enrolled') :
                               e.status === 'promoted' ? t('historicalData.statusValues.promoted') :
                               t('historicalData.statusValues.na')}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* See More Button */}
              {searchedAndPaginatedEnrollments.length < totalFilteredCount && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setStudentsLimit(prev => prev + 50)}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    {t('historicalData.seeMoreButton', { count: totalFilteredCount - searchedAndPaginatedEnrollments.length })}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {!selectedSession && (
         <div className="mt-6 text-gray-500 text-center py-8">
           {t('historicalData.pleaseSelectYear')}
         </div>
       )}
    </div>
  );
};

export default HistoricalDataViewer;
