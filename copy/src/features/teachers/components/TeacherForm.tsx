import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt, FaGraduationCap, 
  FaDollarSign, FaSave, FaTimes, FaBuilding, FaInfoCircle 
} from 'react-icons/fa';
import { Teacher, TeacherFormData, TeacherValidationErrors } from '../types/teacher';

interface TeacherFormProps {
  teacher?: Teacher;
  onSubmit: (data: TeacherFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  errors?: TeacherValidationErrors;
  className?: string;
}

const TeacherForm: React.FC<TeacherFormProps> = ({
  teacher,
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
  className = ''
}) => {
  const isEditMode = !!teacher;
  const [formData, setFormData] = useState<TeacherFormData>({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    dateOfBirth: '',
    gender: 'Male',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    qualification: '',
    degree: '',
    experience: 0,
    department: '',
    subject: '',
    salary: 0,
    status: 'Active',
    hireDate: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  const [validationErrors, setValidationErrors] = useState<TeacherValidationErrors>({});

  useEffect(() => {
    if (teacher) {
      setFormData({
        firstName: teacher.firstName || '',
        lastName: teacher.lastName || '',
        email: teacher.email || '',
        mobile: teacher.mobile || '',
        dateOfBirth: teacher.dateOfBirth || '',
        gender: teacher.gender || 'Male',
        address: teacher.address || '',
        city: teacher.city || '',
        state: teacher.state || '',
        zipCode: teacher.zipCode || '',
        country: teacher.country || '',
        qualification: teacher.qualification || '',
        degree: teacher.degree || '',
        experience: teacher.experience || 0,
        department: teacher.department || '',
        subject: teacher.subject || '',
        salary: teacher.salary || 0,
        status: teacher.status || 'Active',
        hireDate: teacher.hireDate || '',
        emergencyContact: teacher.emergencyContact || {
          name: '',
          relationship: '',
          phone: ''
        }
      });
    }
  }, [teacher]);

  useEffect(() => {
    setValidationErrors(errors);
  }, [errors]);

  const handleInputChange = (field: keyof TeacherFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleEmergencyContactChange = (field: keyof TeacherFormData['emergencyContact'], value: string) => {
    setFormData(prev => ({
      ...prev,
      emergencyContact: {
        ...prev.emergencyContact,
        [field]: value
      }
    }));
    
    // Clear validation error for this field
    if (validationErrors.emergencyContact?.[field]) {
      setValidationErrors(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: undefined
        }
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const getFieldError = (field: keyof TeacherFormData) => {
    return validationErrors[field] || '';
  };

  const getEmergencyContactError = (field: keyof TeacherFormData['emergencyContact']) => {
    return validationErrors.emergencyContact?.[field] || '';
  };

  return (
    <div className={`bg-white rounded-xl shadow-md border border-gray-100 ${className}`}>
      {/* Gradient Header */}
      <div className="relative overflow-hidden rounded-t-xl">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <FaUser className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">
                  {isEditMode ? 'Edit Teacher' : 'Add New Teacher'}
                </h2>
                <p className="text-xs text-white/80">
                  {isEditMode ? 'Update teacher information' : 'Create a new teacher profile'}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/15">
              {isEditMode ? 'Edit Mode' : 'Create Mode'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 p-6 max-h-[80vh] overflow-y-auto">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-2">
            <FaUser className="h-5 w-5 mr-2 text-blue-600" />
            Personal Information
          </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('firstName') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter first name"
                />
              </div>
              {getFieldError('firstName') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('firstName')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('lastName') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter last name"
                />
              </div>
              {getFieldError('lastName') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('lastName')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('email') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter email address"
                />
              </div>
              {getFieldError('email') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mobile Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange('mobile', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('mobile') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter mobile number"
                />
              </div>
              {getFieldError('mobile') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('mobile')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('dateOfBirth') ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {getFieldError('dateOfBirth') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('dateOfBirth')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('gender') ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {getFieldError('gender') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('gender')}</p>
              )}
            </div>
                      </div>
          </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-2">
            <FaMapMarkerAlt className="h-5 w-5 mr-2 text-blue-600" />
            Contact Information
          </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address *
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('address') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full address"
              />
              {getFieldError('address') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('address')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaBuilding className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      getFieldError('city') ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter city"
                  />
                </div>
                {getFieldError('city') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('city')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('state') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter state"
                />
                {getFieldError('state') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('state')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('zipCode') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter ZIP code"
                />
                {getFieldError('zipCode') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('zipCode')}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('country') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter country"
              />
              {getFieldError('country') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('country')}</p>
              )}
            </div>
          </div>

        {/* Professional Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-2">
            <FaGraduationCap className="h-5 w-5 mr-2 text-blue-600" />
            Professional Information
          </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Qualification *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaGraduationCap className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange('qualification', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('qualification') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Bachelor's, Master's, PhD"
                />
              </div>
              {getFieldError('qualification') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('qualification')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Degree *
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) => handleInputChange('degree', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('degree') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Computer Science, Mathematics"
              />
              {getFieldError('degree') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('degree')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience (Years) *
              </label>
              <input
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('experience') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter years of experience"
              />
              {getFieldError('experience') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('experience')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('department') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter department"
              />
              {getFieldError('department') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('department')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('subject') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter subject"
              />
              {getFieldError('subject') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('subject')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaDollarSign className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => handleInputChange('salary', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('salary') ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter salary"
                />
              </div>
              {getFieldError('salary') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('salary')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getFieldError('status') ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
              {getFieldError('status') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('status')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    getFieldError('hireDate') ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {getFieldError('hireDate') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('hireDate')}</p>
              )}
            </div>
            </div>
          </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center border-b border-gray-200 pb-2">
            <FaInfoCircle className="h-5 w-5 mr-2 text-blue-600" />
            Emergency Contact
          </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleEmergencyContactChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getEmergencyContactError('name') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter contact name"
              />
              {getEmergencyContactError('name') && (
                <p className="mt-1 text-sm text-red-600">{getEmergencyContactError('name')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Relationship *
              </label>
              <input
                type="text"
                value={formData.emergencyContact.relationship}
                onChange={(e) => handleEmergencyContactChange('relationship', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getEmergencyContactError('relationship') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Spouse, Parent, Sibling"
              />
              {getEmergencyContactError('relationship') && (
                <p className="mt-1 text-sm text-red-600">{getEmergencyContactError('relationship')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact.phone}
                onChange={(e) => handleEmergencyContactChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                  getEmergencyContactError('phone') ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {getEmergencyContactError('phone') && (
                <p className="mt-1 text-sm text-red-600">{getEmergencyContactError('phone')}</p>
              )}
            </div>
            </div>
          </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEditMode ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                <FaSave className="h-4 w-4 mr-2" />
                {isEditMode ? 'Update Teacher' : 'Add Teacher'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TeacherForm;
