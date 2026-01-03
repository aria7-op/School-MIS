import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

interface AcademicYearSelectorProps {
  value: string;
  onChange: (sessionId: string) => void;
  className?: string;
  label?: string;
  showCurrentBadge?: boolean;
}

const AcademicYearSelector: React.FC<AcademicYearSelectorProps> = ({
  value,
  onChange,
  className = '',
  label = 'Academic Year',
  showCurrentBadge = true,
}) => {
  const { data, isLoading } = useQuery({
    queryKey: ['academic-sessions'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/enrollments/academic-year/sessions`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.data;
    },
  });

  const sessions: AcademicSession[] = data || [];

  // Set default to current session if value is empty
  React.useEffect(() => {
    if (!value && sessions.length > 0) {
      const currentSession = sessions.find(s => s.isCurrent);
      if (currentSession) {
        onChange(currentSession.id);
      }
    }
  }, [sessions, value, onChange]);

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
          <span className="text-gray-500">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="">Select Academic Year</option>
        {sessions.map((session) => (
          <option key={session.id} value={session.id}>
            {session.name}
            {showCurrentBadge && session.isCurrent && ' (Current)'}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AcademicYearSelector;










