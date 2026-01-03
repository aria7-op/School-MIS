import React from 'react';
import { useTranslation } from 'react-i18next';
import { Customer } from '../types/customer';
import { 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaBuilding, 
  FaTag, 
  FaCalendarAlt, 
  FaClock,
  FaEdit,
  FaTrash,
  FaEye,
  FaUserTie,
  FaGraduationCap,
  FaChalkboardTeacher,
  FaUserFriends,
  FaUserCheck,
  FaUserClock
} from 'react-icons/fa';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit?: (customer: Customer) => void;
}

const CustomerDetailsModal: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit
}) => {
  const { t, i18n } = useTranslation();
  const iconGap = { marginInlineEnd: '0.5rem' } as React.CSSProperties;
  // console.log('🔍 CustomerDetailsModal props:', { isOpen, customer: customer?.id, customerName: customer?.name });
  
  if (!isOpen || !customer) {
    // console.log('🔍 CustomerDetailsModal: Not rendering - isOpen:', isOpen, 'customer:', !!customer);
    return null;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(i18n.language || 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'student':
        return 'bg-blue-100 text-blue-800';
      case 'parent':
        return 'bg-purple-100 text-purple-800';
      case 'teacher':
        return 'bg-green-100 text-green-800';
      case 'staff':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender.toLowerCase()) {
      case 'male':
        return <FaUser className="w-4 h-4 text-blue-600" />;
      case 'female':
        return <FaUser className="w-4 h-4 text-pink-600" />;
      default:
        return <FaUser className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-500 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
                {customer.name?.charAt(0)?.toUpperCase() || 'C'}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {customer.name}
                </h2>
                <p className="text-indigo-100 text-sm">{t('customers.details.subtitle')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaUser className="w-5 h-5 text-indigo-600" style={iconGap} />
                    {t('customers.details.basicInfo')}
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('customers.details.fullName')}:</span>
                      <span className="font-medium text-gray-900">{customer.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <FaPhone className="w-4 h-4 text-green-600" style={iconGap} />
                        {t('customers.details.phone')}:
                      </span>
                      <span className="font-medium text-gray-900">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center">
                          <FaEnvelope className="w-4 h-4 text-blue-600" style={iconGap} />
                          {t('customers.details.email')}:
                        </span>
                        <span className="font-medium text-gray-900">{customer.email}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('customers.details.gender')}:</span>
                      <span className="font-medium text-gray-900 flex items-center">
                        <span style={{ marginInlineStart: '0.25rem' }}>{getGenderIcon(customer.gender)}</span>
                        {customer.gender}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('customers.details.type')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(customer.type)}`}>
                        {customer.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                {(customer.address || customer.city || customer.country) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaMapMarkerAlt className="w-5 h-5 text-green-600" style={iconGap} />
                      {t('customers.details.contactInfo')}
                    </h3>
                    <div className="space-y-3">
                      {customer.address && (
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 flex items-center">
                            <FaMapMarkerAlt className="w-4 h-4 text-red-600" style={iconGap} />
                            {t('customers.details.address')}:
                          </span>
                          <span className="font-medium text-gray-900 text-right max-w-xs">{customer.address}</span>
                        </div>
                      )}
                      {customer.city && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('customers.details.city')}:</span>
                          <span className="font-medium text-gray-900">{customer.city}</span>
                        </div>
                      )}
                      {customer.country && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{t('customers.details.country')}:</span>
                          <span className="font-medium text-gray-900">{customer.country}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Business Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaBuilding className="w-5 h-5 text-blue-600" style={iconGap} />
                    {t('customers.details.businessInfo')}
                  </h3>
                  <div className="space-y-3">
                    {customer.purpose && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customers.details.purpose')}:</span>
                        <span className="font-medium text-gray-900">{customer.purpose}</span>
                      </div>
                    )}
                    {customer.department && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customers.details.department')}:</span>
                        <span className="font-medium text-gray-900">{customer.department}</span>
                      </div>
                    )}
                    {customer.source && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customers.details.source')}:</span>
                        <span className="font-medium text-gray-900">{customer.source}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('customers.details.priority')}:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(customer.priority)}`}>
                        {customer.priority}
                      </span>
                    </div>
                    {customer.referredTo && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customers.details.referredTo')}:</span>
                        <span className="font-medium text-gray-900">{customer.referredTo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaEye className="w-5 h-5 text-cyan-600" style={iconGap} />
                    {t('customers.details.additionalInfo')}
                  </h3>
                  <div className="space-y-3">
                    {customer.company && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customers.details.company')}:</span>
                        <span className="font-medium text-gray-900">{customer.company}</span>
                      </div>
                    )}
                    {customer.website && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customers.details.website')}:</span>
                        <a 
                          href={customer.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {customer.website}
                        </a>
                      </div>
                    )}
                    {customer.occupation && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">{t('customers.details.occupation')}:</span>
                        <span className="font-medium text-gray-900">{customer.occupation}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Remarks and Notes */}
            {(customer.remark || customer.remarks) && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaEdit className="w-5 h-5 text-orange-600" style={iconGap} />
                  {t('customers.details.remarksTitle')}
                </h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed">
                    {customer.remark || customer.remarks}
                  </p>
                </div>
              </div>
            )}

            {/* Metadata */}
            {customer.metadata && Object.keys(customer.metadata).length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <FaTag className="w-5 h-5 text-purple-600" style={iconGap} />
                  {t('customers.details.metadataTitle')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(customer.metadata).map(([key, value]) => (
                    <div key={key} className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-sm font-medium text-gray-600 mb-1">{key}</div>
                      <div className="text-gray-900">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FaClock className="w-5 h-5 text-indigo-600" style={iconGap} />
                {t('customers.details.timeline')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">{t('customers.details.created')}</div>
                  <div className="text-gray-900">{formatDate(customer.createdAt)}</div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200">
                  <div className="text-sm font-medium text-gray-600 mb-1">{t('customers.details.updated')}</div>
                  <div className="text-gray-900">{formatDate(customer.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => {
                if (onEdit) {
                  onEdit(customer);
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {t('customers.form.editTitle')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDetailsModal;
