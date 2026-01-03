import React, { useState, useEffect } from 'react';
import { Customer, CustomerFormData } from '../types/customer';
import { customerService } from '../services/customerService';
import { sanitizeTextInput, sanitizeName, sanitizeEmail, sanitizePhone, sanitizeURL } from '../../../utils/sanitize';
import { validateName, validateEmail, validatePhone, validateURL, validateNoScriptTags } from '../../../utils/validators';
import { 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaBuilding, 
  FaTag, 
  FaEdit,
  FaSave,
  FaTimes,
  FaUserTie,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserFriends,
  FaUserCheck,
  FaUserClock
} from 'react-icons/fa';

interface CustomerEditFormProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedCustomer: Customer) => void;
}

const CustomerEditForm: React.FC<CustomerEditFormProps> = ({
  customer,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    gender: customer.gender || 'MALE',
    type: customer.type || 'STUDENT',
    purpose: customer.purpose || '',
    department: customer.department || '',
    source: customer.source || '',
    priority: customer.priority || 'MEDIUM',
    referredTo: customer.referredTo || 'OWNER',
    remarks: customer.remarks || customer.remark || '',
    address: customer.address || '',
    city: customer.city || '',
    country: customer.country || '',
    company: customer.company || '',
    website: customer.website || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer && isOpen) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        email: customer.email || '',
        gender: customer.gender || 'MALE',
        type: customer.type || 'STUDENT',
        purpose: customer.purpose || '',
        department: customer.department || '',
        source: customer.source || '',
        priority: customer.priority || 'MEDIUM',
        referredTo: customer.referredTo || 'OWNER',
        remarks: customer.remarks || customer.remark || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
        company: customer.company || '',
        website: customer.website || ''
      });
      setErrors({});
    }
  }, [customer, isOpen]);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (field === 'name') {
      sanitizedValue = sanitizeName(value);
    } else if (field === 'email') {
      sanitizedValue = sanitizeEmail(value);
    } else if (field === 'phone') {
      sanitizedValue = sanitizePhone(value);
    } else if (field === 'website') {
      sanitizedValue = sanitizeURL(value);
    } else {
      sanitizedValue = sanitizeTextInput(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (!validateName(formData.name)) {
      newErrors.name = 'Name contains invalid characters';
    } else if (!validateNoScriptTags(formData.name)) {
      newErrors.name = 'Name contains invalid content';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.email) {
      if (!validateEmail(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else if (!validateNoScriptTags(formData.email)) {
        newErrors.email = 'Email contains invalid content';
      }
    }

    if (formData.website) {
      if (!validateURL(formData.website)) {
        newErrors.website = 'Please enter a valid website URL (starting with http:// or https://)';
      } else if (!validateNoScriptTags(formData.website)) {
        newErrors.website = 'Website URL contains invalid content';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        ...formData,
        // Preserve existing fields that aren't in the form
        id: customer.id,
        createdAt: customer.createdAt,
        updatedAt: new Date().toISOString(),
        ownerId: customer.ownerId,
        schoolId: customer.schoolId,
        createdBy: customer.createdBy,
        updatedBy: customer.updatedBy,
        userId: customer.userId,
        serialNumber: customer.serialNumber,
        mobile: customer.mobile,
        street: customer.street,
        postal_code: customer.postal_code,
        occupation: customer.occupation,
        tags: customer.tags,
        stage: customer.stage,
        value: customer.value,
        lead_score: customer.lead_score,
        refered_to: customer.refered_to,
        referredById: customer.referredById,
        metadata: customer.metadata,
        deletedAt: customer.deletedAt,
        totalSpent: customer.totalSpent,
        orderCount: customer.orderCount,
        pipelineStageId: customer.pipelineStageId,
        firstName: customer.firstName,
        lastName: customer.lastName,
        status: customer.status,
        lastContact: customer.lastContact,
        assignedTo: customer.assignedTo,
        notes: customer.notes,
        lastActivity: customer.lastActivity
      };

      const response = await customerService.updateCustomer(customer.id, updateData);
      
      if (response.success) {
        onSuccess?.(response.data as Customer);
        onClose();
      } else {
        setErrors({ submit: response.message || 'Failed to update customer' });
      }
    } catch (error: any) {
      console.error('Error updating customer:', error);
      setErrors({ submit: error.message || 'An unexpected error occurred' });
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'student':
        return <FaGraduationCap className="w-4 h-4 text-blue-600" />;
      case 'parent':
        return <FaUserFriends className="w-4 h-4 text-purple-600" />;
      case 'teacher':
        return <FaChalkboardTeacher className="w-4 h-4 text-green-600" />;
      case 'staff':
        return <FaUserTie className="w-4 h-4 text-orange-600" />;
      default:
        return <FaUser className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <FaEdit className="w-5 h-5 mr-2" />
                  Edit Customer
                </h2>
                <p className="text-indigo-100 text-sm">
                  Update customer information
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaUser className="w-5 h-5 mr-2 text-indigo-600" />
                    Basic Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Enter full name"
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <FaPhone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter phone number"
                        />
                      </div>
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter email address"
                        />
                      </div>
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <div className="relative">
                          <div className="absolute left-3 top-3">
                            {getTypeIcon(formData.type)}
                          </div>
                          <select
                            value={formData.type}
                            onChange={(e) => handleInputChange('type', e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="PARENT">Parent</option>
                            <option value="TEACHER">Teacher</option>
                            <option value="STAFF">Staff</option>
                            <option value="PROSPECT">Prospect</option>
                            <option value="ALUMNI">Alumni</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaMapMarkerAlt className="w-5 h-5 mr-2 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter city"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <input
                          type="text"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Enter country"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Business Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaBuilding className="w-5 h-5 mr-2 text-blue-600" />
                    Business Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose
                      </label>
                      <input
                        type="text"
                        value={formData.purpose}
                        onChange={(e) => handleInputChange('purpose', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter purpose"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter department"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Source
                      </label>
                      <input
                        type="text"
                        value={formData.source}
                        onChange={(e) => handleInputChange('source', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter source"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Priority
                        </label>
                        <select
                          value={formData.priority}
                          onChange={(e) => handleInputChange('priority', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Referred To
                        </label>
                        <select
                          value={formData.referredTo}
                          onChange={(e) => handleInputChange('referredTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="OWNER">Owner</option>
                          <option value="ADMIN">Admin</option>
                          <option value="FINANCE">Finance</option>
                          <option value="ACADEMIC">Academic</option>
                          <option value="SUPPORT">Support</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaTag className="w-5 h-5 mr-2 text-cyan-600" />
                    Additional Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          errors.website ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="https://example.com"
                      />
                      {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Remarks
                      </label>
                      <textarea
                        value={formData.remarks}
                        onChange={(e) => handleInputChange('remarks', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Enter any additional remarks or notes"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Messages */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerEditForm;
