import React, { useState } from 'react';
import EnrollmentHistory from '../features/students/components/EnrollmentHistory';

const EnrollmentHistoryViewer: React.FC = () => {
  const [studentId, setStudentId] = useState<string>('');
  const [searchStudentId, setSearchStudentId] = useState<string>('');

  const handleSearch = () => {
    if (searchStudentId.trim()) {
      setStudentId(searchStudentId.trim());
    }
  };

  return (
    <div className="space-y-4">
  <div className="flex flex-col sm:flex-row gap-2 text-black">
    <input
      type="text"
      value={searchStudentId}
      onChange={(e) => setSearchStudentId(e.target.value)}
      placeholder="Enter Student ID"
      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
      onKeyPress={(e) => {
        if (e.key === 'Enter') {
          handleSearch();
        }
      }}
    />
    <button
      onClick={handleSearch}
      className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base font-medium"
    >
      Search
    </button>
  </div>
  
  {studentId && (
    <div className="mt-4">
      <EnrollmentHistory studentId={studentId} />
    </div>
  )}
  
  {!studentId && (
    <p className="text-gray-500 text-xs sm:text-sm">Enter a student ID to view their enrollment history.</p>
  )}
</div>
  );
};

export default EnrollmentHistoryViewer;

