import React, { useState, useEffect, useMemo } from 'react';
import secureApiService from '../services/secureApiService';

const HistoricalDataViewer = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState('');
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  
  useEffect(() => {
    secureApiService.get('/enrollments/academic-year/sessions')
      .then(res => {
        console.log('HistoricalDataViewer response:', res);
        
        // Handle different response structures
        let sessionsData = [];
        if (Array.isArray(res.data)) {
          // Direct array: { success: true, data: [...] }
          sessionsData = res.data;
        } else if ((res.data as any)?.data) {
          // Nested structure: { success: true, data: { data: [...] } }
          sessionsData = Array.isArray((res.data as any).data) 
            ? (res.data as any).data 
            : [];
        } else if ((res as any)?.data) {
          sessionsData = Array.isArray((res as any).data) 
            ? (res as any).data 
            : [];
        }
        
        console.log('HistoricalDataViewer parsed sessions:', sessionsData);
        setSessions(sessionsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching sessions:', err);
        console.error('Error details:', err.response?.data || err.message);
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
    
    // Fetch stats
    secureApiService.get(`/enrollments/stats/${selectedSession}`)
      .then(res => {
        console.log('Stats response:', res);
        const statsData = (res.data as any)?.data || res.data;
        setStats(statsData);
      })
      .catch(err => {
        console.error('Error fetching stats:', err);
        console.error('Stats error details:', err.response?.data || err.message);
        setStats(null);
      });
    
    // Fetch enrollments
    secureApiService.get(`/enrollments/session/${selectedSession}`)
      .then(res => {
        console.log('Enrollments response:', res);
        let enrollmentsData = [];
        if (Array.isArray(res.data)) {
          enrollmentsData = res.data;
        } else if ((res.data as any)?.data) {
          enrollmentsData = Array.isArray((res.data as any).data) 
            ? (res.data as any).data 
            : [];
        }
        console.log('Parsed enrollments:', enrollmentsData);
        setEnrollments(enrollmentsData);
      })
      .catch(err => {
        console.error('Error fetching enrollments:', err);
        console.error('Enrollments error details:', err.response?.data || err.message);
        setEnrollments([]);
      });
  }, [selectedSession]);

  // Extract unique classes from enrollments
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
    
    // Custom sorting function: Prep first, then numeric classes with sections
    const customSort = (a: any, b: any) => {
      const nameA = (a.name || '').toLowerCase().trim();
      const nameB = (b.name || '').toLowerCase().trim();
      
      // Check if either is "prep"
      const isPrepA = nameA.includes('prep');
      const isPrepB = nameB.includes('prep');
      
      if (isPrepA && !isPrepB) return -1;
      if (!isPrepA && isPrepB) return 1;
      if (isPrepA && isPrepB) return nameA.localeCompare(nameB);
      
      // Extract numeric part from class name (e.g., "1", "2", "12" from "1 A" or "12 B")
      const extractNumber = (name: string): number => {
        const match = name.match(/\d+/);
        return match ? parseInt(match[0], 10) : 9999; // Large number if no number found
      };
      
      // Extract section letter (A, B, C, etc.)
      const extractSection = (name: string): string => {
        const match = name.match(/\b([A-Z])\b/i);
        return match ? match[1].toUpperCase() : '';
      };
      
      const numA = extractNumber(nameA);
      const numB = extractNumber(nameB);
      
      // First compare by numeric value
      if (numA !== numB) {
        return numA - numB;
      }
      
      // If same number, compare by section letter
      const sectionA = extractSection(nameA);
      const sectionB = extractSection(nameB);
      
      if (sectionA && sectionB) {
        return sectionA.localeCompare(sectionB);
      }
      
      // Fallback to name comparison
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

  // Reset selected class when session changes
  useEffect(() => {
    setSelectedClassId(null);
  }, [selectedSession]);

  return (
    <div>
      {loading ? (
        <div>Loading academic years...</div>
      ) : (
        <select 
          value={selectedSession} 
          onChange={e => setSelectedSession(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        >
          <option value="">Select Year</option>
          {sessions.map(s => (
            <option key={s.id} value={String(s.id)}>{s.name}</option>
          ))}
        </select>
      )}
      {selectedSession && (
        <div className="mt-6 space-y-6">
          {stats && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600">Total Enrollments: </span>
                  <span className="font-bold">{stats.total || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Enrolled: </span>
                  <span className="font-bold">{stats.byStatus?.enrolled || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">Promoted: </span>
                  <span className="font-bold">{stats.byStatus?.promoted || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {classes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Classes ({classes.length})</h3>
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
                    All Classes ({enrollments.length})
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
          
          {/* Students Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedClassId 
                ? (() => {
                    const selectedClass = classes.find(c => String(c.id) === selectedClassId);
                    return `Students - ${selectedClass?.name || 'Selected Class'}${selectedClass?.code ? ` (${selectedClass.code})` : ''}`;
                  })()
                : 'All Students'}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({filteredEnrollments.length} student{filteredEnrollments.length !== 1 ? 's' : ''})
              </span>
            </h3>
            <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">Student</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Class</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      {selectedClassId 
                        ? 'No students found for the selected class'
                        : 'No enrollments found for this academic year'}
                    </td>
                  </tr>
                ) : (
                  filteredEnrollments.map((e: any) => (
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
          </div>
        </div>
      )}
      
      {!selectedSession && (
        <div className="mt-6 text-gray-500 text-center">
          Please select an academic year to view enrollment data
        </div>
      )}
    </div>
  );
};
export default HistoricalDataViewer;






