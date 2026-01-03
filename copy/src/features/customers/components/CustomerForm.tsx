import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Customer, CustomerFormData } from '../types/customer';
import { customerService } from '../services/customerService';
import { sanitizeTextInput, sanitizeName, sanitizeEmail, sanitizePhone } from '../../../utils/sanitize';
import { validateName, validateEmail, validatePhone, validateNoScriptTags } from '../../../utils/validators';
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

interface CustomerFormProps {
  customer?: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (updatedCustomer: Customer) => void;
  mode: 'create' | 'edit';
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  customer,
  isOpen,
  onClose,
  onSuccess,
  mode
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    gender: 'MALE',
    type: 'STUDENT',
    purpose: '',
    department: '',
    source: '',
    priority: 'MEDIUM',
    referredTo: 'OWNER',
    remarks: '',
    address: '',
    city: '',
    country: '',
    company: '',
    website: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer && mode === 'edit' && isOpen) {
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
    } else if (mode === 'create' && isOpen) {
      // Reset form for create mode
      setFormData({
        name: '',
        phone: '',
        email: '',
        gender: 'MALE',
        type: 'STUDENT',
        purpose: '',
        department: '',
        source: '',
        priority: 'MEDIUM',
        referredTo: 'OWNER',
        remarks: '',
        address: '',
        city: '',
        country: '',
        company: '',
        website: ''
      });
    }
    setErrors({});
  }, [customer, mode, isOpen]);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (field === 'name') {
      sanitizedValue = sanitizeName(value);
    } else if (field === 'email') {
      sanitizedValue = sanitizeEmail(value);
    } else if (field === 'phone') {
      sanitizedValue = sanitizePhone(value);
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
      newErrors.phone = 'Phone is required';
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
      let result: Customer;
      
      if (mode === 'edit' && customer) {
        result = await customerService.updateCustomer(customer.id, formData);
      } else {
        result = await customerService.createCustomer(formData);
      }

      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setErrors({ submit: error.message || 'Failed to save customer' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            {mode === 'edit' ? t('customers.form.editTitle') : t('customers.form.createTitle')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FaUser className="w-5 h-5 mr-2" />
                {t('customers.form.basicInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.fullName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('customers.form.fullNamePlaceholder')}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{t('customers.form.fullNameRequired')}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.phone')} *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={`w-full h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('customers.form.phonePlaceholder') || "مثال: 0700123456 یا 0799123456"}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{t('customers.form.fullNameRequired')}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full h-10 rounded-lg border px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="مثال: ahmad.ahmadi@example.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.gender')}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="MALE">{t('customers.form.male')}</option>
                    <option value="FEMALE">{t('customers.form.female')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.type')}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="STUDENT">{t('customers.form.typeStudent')}</option>
                    <option value="PARENT">{t('customers.form.typeParent')}</option>
                    <option value="TEACHER">{t('customers.form.typeTeacher')}</option>
                    <option value="STAFF">Staff</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.priority')}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LOW">{t('customers.form.priorityLow')}</option>
                    <option value="MEDIUM">{t('customers.form.priorityMedium')}</option>
                    <option value="HIGH">{t('customers.form.priorityHigh')}</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FaBuilding className="w-5 h-5 mr-2" />
                {t('customers.form.basicInfo')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.purpose')}
                  </label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => handleInputChange('purpose', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('customers.form.selectPurpose')}</option>
                    <option value="ENROLLMENT">{t('customers.form.purposeEnrollment')}</option>
                    <option value="INQUIRY">{t('customers.form.purposeInquiry')}</option>
                    <option value="SUPPORT">{t('customers.form.purposeSupport')}</option>
                    <option value="VISIT">Visit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.department')}
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('customers.form.selectDepartment')}</option>
                    <option value="ACADEMIC">{t('customers.form.departmentAcademic')}</option>
                    <option value="ADMINISTRATION">{t('customers.form.departmentAdministration')}</option>
                    <option value="FINANCE">{t('customers.form.departmentFinance')}</option>
                    <option value="SUPPORT">Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.source')}
                  </label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleInputChange('source', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">{t('customers.form.selectSource')}</option>
                    <option value="FACEBOOK">{t('customers.form.sourceFacebook')}</option>
                    <option value="WEBSITE">{t('customers.form.sourceWebsite')}</option>
                    <option value="REFERRAL">{t('customers.form.sourceReferral')}</option>
                    <option value="WALK_IN">{t('customers.form.sourceWalkin')}</option>
                    <option value="GOOGLE">Google</option>
                    <option value="INSTAGRAM">Instagram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.referredTo')}
                  </label>
                  <select
                    value={formData.referredTo}
                    onChange={(e) => handleInputChange('referredTo', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="ADMIN">Admin</option>
                    <option value="FINANCE">{t('customers.form.departmentFinance')}</option>
                    <option value="ACADEMIC">{t('customers.form.departmentAcademic')}</option>
                    <option value="SUPPORT">Support</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                <FaMapMarkerAlt className="w-5 h-5 mr-2" />
                {t('customers.form.metadata')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="مثال: کوچه 5، جاده میوند، کابل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="مثال: کابل، هرات، مزار شریف"
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
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter country"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter company name"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    className="w-full h-10 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('customers.form.remarks')}
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('customers.form.remarksPlaceholder')}
                  />
                </div>
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === 'edit' ? t('customers.form.updating') : t('customers.form.creating')}
                </>
              ) : (
                <>
                  {mode === 'edit' ? <FaEdit className="w-4 h-4 mr-2" /> : <FaSave className="w-4 h-4 mr-2" />}
                  {mode === 'edit' ? t('customers.form.update') : t('customers.form.create')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;