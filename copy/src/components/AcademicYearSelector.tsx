import React, { useEffect, useState } from 'react';
import secureApiService from '../services/secureApiService';

const AcademicYearSelector = ({ value, onChange }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    secureApiService.get('/enrollments/academic-year/sessions')
      .then(res => {
        console.log('AcademicYearSelector response:', res);
        
        // Handle different response structures
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
        
        console.log('AcademicYearSelector parsed sessions:', sessionsData);
        setSessions(sessionsData);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching academic sessions:', err);
        console.error('Error details:', err.response?.data || err.message);
        setSessions([]);
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return (
      <select disabled className="border px-2 py-1 rounded bg-gray-100">
        <option>Loading...</option>
      </select>
    );
  }
  return (
    <select 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="">Select Academic Year</option>
      {sessions.map(s => (
        <option key={s.id} value={String(s.id)}>
          {s.name}
        </option>
      ))}
    </select>
  );
};
export default AcademicYearSelector;





