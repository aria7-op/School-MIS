import React from 'react';
import { FaUser, FaEnvelope, FaPhone, FaGraduationCap, FaMapMarkerAlt, FaCalendarAlt, FaDollarSign, FaCheckCircle, FaTimesCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { Teacher } from '../types/teacher';

interface TeacherCardProps {
  teacher: Teacher;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  onToggleSelection?: () => void;
  showSelection?: boolean;
  className?: string;
}

const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  isSelected = false,
  onPress,
  onLongPress,
  onToggleSelection,
  showSelection = false,
  className = ''
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'text-green-600 bg-green-100';
      case 'Inactive':
        return 'text-red-600 bg-red-100';
      case 'On Leave':
        return 'text-yellow-600 bg-yellow-100';
      case 'Terminated':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Active':
        return <FaCheckCircle className="w-3 h-3" />;
      case 'Inactive':
        return <FaTimesCircle className="w-3 h-3" />;
      case 'On Leave':
        return <FaClock className="w-3 h-3" />;
      case 'Terminated':
        return <FaExclamationTriangle className="w-3 h-3" />;
      default:
        return <FaClock className="w-3 h-3" />;
    }
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || '??';
  };

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer
        hover:shadow-md transition-all duration-200
        ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        ${className}
      `}
      onClick={onPress}
      onDoubleClick={onLongPress}
    >
      {/* Header with Avatar and Selection */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="relative">
            {teacher.photo ? (
              <img
                src={teacher.photo}
                alt={`${teacher.firstName} ${teacher.lastName}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {getInitials(teacher.firstName, teacher.lastName)}
              </div>
            )}
            {/* Status indicator */}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${getStatusColor(teacher.status)}`}>
              {getStatusIcon(teacher.status)}
            </div>
          </div>

          {/* Name and Title */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {teacher.firstName} {teacher.lastName}
            </h3>
            <p className="text-sm text-gray-600 truncate">
              {teacher.department} • {teacher.subject}
            </p>
          </div>
        </div>

        {/* Selection Checkbox */}
        {showSelection && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelection?.();
            }}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              isSelected
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 hover:border-blue-400'
            }`}
          >
            {isSelected && <FaCheckCircle className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaEnvelope className="w-4 h-4 text-gray-400" />
          <span className="truncate">{teacher.email}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaPhone className="w-4 h-4 text-gray-400" />
          <span>{teacher.mobile}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaMapMarkerAlt className="w-4 h-4 text-gray-400" />
          <span className="truncate">{teacher.city}, {teacher.state}</span>
        </div>
      </div>

      {/* Qualifications and Experience */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaGraduationCap className="w-4 h-4 text-gray-400" />
          <span className="truncate">{teacher.qualification} in {teacher.degree}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <FaCalendarAlt className="w-4 h-4 text-gray-400" />
          <span>{teacher.experience} years experience</span>
        </div>
      </div>

      {/* Salary and Hire Date */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <FaDollarSign className="w-4 h-4 text-gray-400" />
          <span className="font-medium">{formatSalary(teacher.salary)}</span>
        </div>
        <div className="text-gray-500">
          Hired {formatDate(teacher.hireDate)}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mt-3 flex justify-end">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(teacher.status)}`}>
          {getStatusIcon(teacher.status)}
          <span className="ml-1">{teacher.status}</span>
        </span>
      </div>
    </div>
  );
};

export default TeacherCard;
