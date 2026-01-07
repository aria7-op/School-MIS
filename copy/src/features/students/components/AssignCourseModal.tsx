import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FaTimes, FaSearch } from "react-icons/fa";

interface Course {
  id: number;
  name: string;
  code: string;
  type: string;
  description?: string;
}

interface AssignCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  onAssign: (studentId: number, courseId: number) => Promise<{ success: boolean; error?: string }>;
}

const AssignCourseModal: React.FC<AssignCourseModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  onAssign,
}) => {
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Fetch courses when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  // Fetch courses from your managed scope
  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      // This should fetch courses that the current user can manage
      const response = await fetch('/api/students/courses/managed', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      } else {
        console.error('Failed to fetch courses:', response.statusText);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  // Filter courses based on search
  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle course assignment
  const handleAssign = async () => {
    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    setLoading(true);
    try {
      const result = await onAssign(studentId, selectedCourse);
      if (result.success) {
        onClose();
        // Reset form
        setSelectedCourse("");
        setSearchQuery("");
      } else {
        alert(result.error || 'Failed to assign course');
      }
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Error assigning course');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Assign Course to {studentName}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Course Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Course
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Type course name or code..."
                />
                {loadingCourses && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Course List */}
            <div className="mb-4 max-h-60 overflow-y-auto border border border-gray-200 rounded-lg">
              {loadingCourses ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="text-center p-8 text-gray-500">
                  {searchQuery ? 'No courses found matching your search' : 'No courses available'}
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredCourses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <input
                        type="radio"
                        name="course"
                        value={course.id}
                        checked={selectedCourse === course.id}
                        onChange={(e) => setSelectedCourse(Number(e.target.value))}
                        className="mr-3 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{course.name}</div>
                        <div className="text-sm text-gray-500">{course.code}</div>
                        {course.description && (
                          <div className="text-xs text-gray-400 mt-1">{course.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedCourse || loading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Assigning...' : 'Assign Course'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignCourseModal;
