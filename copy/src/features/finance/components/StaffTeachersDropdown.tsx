import React, { useState, useRef, useEffect } from 'react';

interface Staff {
  id: string;
  uuid: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  salary?: {
    basicSalary?: number;
    allowances?: number;
  };
}

interface Teacher {
  id: string;
  uuid: string;
  employeeId?: string;
  department?: string;
  subject?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  salary?: {
    basicSalary?: number;
    allowances?: number;
  };
}

interface StaffTeachersDropdownProps {
  staff: Staff[];
  teachers: Teacher[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (employee: Staff | Teacher, type: 'staff' | 'teacher') => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  className?: string;
  maxHeight?: string;
  showSearchCount?: boolean;
}

const StaffTeachersDropdown: React.FC<StaffTeachersDropdownProps> = ({
  staff,
  teachers,
  value,
  onChange,
  onSelect,
  placeholder = "Search and select employee...",
  label,
  required = false,
  disabled = false,
  loading = false,
  error,
  className = "",
  maxHeight = "max-h-80",
  showSearchCount = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep internal search term in sync with controlled value from parent
  useEffect(() => {
    // Only update when parent value changes externally
    if (value !== searchTerm) {
      setSearchTerm(value || '');
    }
  }, [value]);

  // Filter staff and teachers based on search term
  const filteredStaff = staff.filter(employee =>
    `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.user?.phone?.includes(searchTerm) ||
    employee.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeachers = teachers.filter(employee =>
    `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.user?.phone?.includes(searchTerm) ||
    employee.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalFiltered = filteredStaff.length + filteredTeachers.length;

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    // Open dropdown when typing
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Handle employee selection
  const handleEmployeeSelect = (employee: Staff | Teacher, type: 'staff' | 'teacher') => {
    const displayName = `${employee.user?.firstName || ''} ${employee.user?.lastName || ''}`.trim();
    setSearchTerm(displayName);
    onChange(displayName);
    onSelect(employee, type);
    setIsOpen(false);
  };

  // Handle input focus
  const handleInputFocus = () => {
    // Open dropdown and clear to allow immediate re-selection
    setIsOpen(true);
    if (searchTerm) {
      setSearchTerm('');
      onChange('');
      // Ensure caret focus stays for quick typing
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  // Handle input blur with delay to allow option selection
  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && totalFiltered === 1) {
      e.preventDefault();
      if (filteredStaff.length === 1) {
        handleEmployeeSelect(filteredStaff[0], 'staff');
      } else if (filteredTeachers.length === 1) {
        handleEmployeeSelect(filteredTeachers[0], 'teacher');
      }
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
            error ? 'border-red-300' : 'border-gray-300'
          } ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}`}
        />
        {/* Clear selection button */}
        {!loading && !!searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              onChange('');
              setIsOpen(true);
              // Focus back to input for immediate new search
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
            className="absolute right-7 top-2.5 text-gray-400 hover:text-gray-600"
            aria-label="Clear selection"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
          </div>
        )}
        
        {/* Dropdown arrow */}
        {!loading && (
          <div className="absolute right-3 top-2.5">
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {isOpen && (
        <div className={`absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg ${maxHeight} overflow-y-auto`}>
          {/* Search count */}
          {showSearchCount && searchTerm && (
            <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
              {totalFiltered} result{totalFiltered !== 1 ? 's' : ''} found
            </div>
          )}
          
          {/* Staff Section */}
          {filteredStaff.length > 0 && (
            <>
              <div className="px-3 py-2 bg-blue-50 border-b border-blue-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-medium text-blue-800">Staff ({filteredStaff.length})</span>
                </div>
              </div>
              {filteredStaff.map((employee) => (
                <div
                  key={`staff-${employee.id}`}
                  onClick={() => handleEmployeeSelect(employee, 'staff')}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    {employee.user?.firstName} {employee.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {[
                      employee.employeeId && `ID: ${employee.employeeId}`,
                      employee.designation && `Designation: ${employee.designation}`,
                      employee.department && `Dept: ${employee.department}`,
                      employee.user?.phone && `Phone: ${employee.user.phone}`
                    ].filter(Boolean).join(' • ')}
                  </div>
                  {employee.salary?.basicSalary && (
                    <div className="text-xs text-green-600 mt-1">
                      Basic Salary: ${employee.salary.basicSalary.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Teachers Section */}
          {filteredTeachers.length > 0 && (
            <>
              <div className="px-3 py-2 bg-green-50 border-b border-green-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-sm font-medium text-green-800">Teachers ({filteredTeachers.length})</span>
                </div>
              </div>
              {filteredTeachers.map((employee) => (
                <div
                  key={`teacher-${employee.id}`}
                  onClick={() => handleEmployeeSelect(employee, 'teacher')}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-gray-900">
                    {employee.user?.firstName} {employee.user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">
                    {[
                      employee.employeeId && `ID: ${employee.employeeId}`,
                      employee.subject && `Subject: ${employee.subject}`,
                      employee.department && `Dept: ${employee.department}`,
                      employee.user?.phone && `Phone: ${employee.user.phone}`
                    ].filter(Boolean).join(' • ')}
                  </div>
                  {employee.salary?.basicSalary && (
                    <div className="text-xs text-green-600 mt-1">
                      Basic Salary: ${employee.salary.basicSalary.toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* No results */}
          {totalFiltered === 0 && (
            <div className="px-3 py-4 text-center text-gray-500">
              {searchTerm ? 'No employees found' : 'No employees available'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StaffTeachersDropdown;