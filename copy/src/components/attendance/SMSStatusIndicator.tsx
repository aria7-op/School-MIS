import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaPhoneSlash, FaQuestionCircle, FaRedo, FaSpinner } from 'react-icons/fa';
import secureApiService from '../../services/secureApiService';

interface SMSStatusIndicatorProps {
  attendanceId: number;
  smsType: 'in' | 'out';
  status?: string;
  error?: string;
  sentAt?: string;
  attempts?: number;
  onResendSuccess?: () => void;
}

const SMSStatusIndicator: React.FC<SMSStatusIndicatorProps> = ({
  attendanceId,
  smsType,
  status = 'PENDING',
  error,
  sentAt,
  attempts = 0,
  onResendSuccess
}) => {
  const [isResending, setIsResending] = useState(false);
  const [showError, setShowError] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [currentError, setCurrentError] = useState(error);
  const [currentSentAt, setCurrentSentAt] = useState(sentAt);
  const [currentAttempts, setCurrentAttempts] = useState(attempts);

  // Update local state when props change
  React.useEffect(() => {
    setCurrentStatus(status);
    setCurrentError(error);
    setCurrentSentAt(sentAt);
    setCurrentAttempts(attempts);
  }, [status, error, sentAt, attempts]);

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'SENT':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'FAILED':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'NO_PHONE':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (currentStatus) {
      case 'SENT':
        return <FaCheckCircle className="w-3.5 h-3.5" />;
      case 'FAILED':
        return <FaTimesCircle className="w-3.5 h-3.5" />;
      case 'PENDING':
        return <FaClock className="w-3.5 h-3.5" />;
      case 'NO_PHONE':
        return <FaPhoneSlash className="w-3.5 h-3.5" />;
      default:
        return <FaQuestionCircle className="w-3.5 h-3.5" />;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'SENT':
        return 'Sent';
      case 'FAILED':
        return 'Failed';
      case 'PENDING':
        return 'Pending';
      case 'NO_PHONE':
        return 'No Phone';
      default:
        return 'Unknown';
    }
  };

  const handleResendSMS = async () => {
    try {
      setIsResending(true);
      
      const response = await secureApiService.api.post('/attendances/resend-sms', {
        attendanceId,
        smsType
      });

      if (response.data.success) {
        // Update local state immediately
        setCurrentStatus(response.data.data.smsStatus || 'SENT');
        setCurrentError(response.data.data.smsError || null);
        setCurrentSentAt(response.data.data.smsSentAt || null);
        setCurrentAttempts(response.data.data.attempts || currentAttempts + 1);
        
        alert('SMS sent successfully!');
        
        // Call parent callback for full refresh
        onResendSuccess && onResendSuccess();
      } else {
        // Update to failed status
        setCurrentStatus('FAILED');
        setCurrentError(response.data.message || 'Failed to send SMS');
        alert(response.data.message || 'Failed to resend SMS. Please try again.');
      }
    } catch (err: any) {
      console.error('Error resending SMS:', err);
      setCurrentStatus('FAILED');
      setCurrentError(err.response?.data?.message || 'An error occurred while resending SMS');
      alert(err.response?.data?.message || 'An error occurred while resending SMS.');
    } finally {
      setIsResending(false);
    }
  };

  const handlePressIndicator = () => {
    if (currentStatus === 'FAILED' && currentError) {
      setShowError(!showError);
    } else if (currentStatus === 'SENT' && currentSentAt) {
      const date = new Date(currentSentAt);
      alert(`SMS Sent\n\nSent at: ${date.toLocaleString()}\nAttempts: ${currentAttempts}`);
    } else if (currentStatus === 'PENDING') {
      // For pending, trigger resend
      handleResendSMS();
    }
  };

  return (
    <div className="inline-block">
      <button
        onClick={handlePressIndicator}
        disabled={isResending}
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${getStatusColor()} ${
          currentStatus === 'PENDING' ? 'hover:scale-105 cursor-pointer shadow-sm' : 'hover:opacity-80'
        } transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
        title={`SMS ${smsType === 'in' ? 'Mark-In' : 'Mark-Out'}: ${getStatusText()}${currentStatus === 'PENDING' ? ' - Click to send' : ''}`}
      >
        {isResending ? (
          <FaSpinner className="w-3.5 h-3.5 animate-spin" />
        ) : (
          getStatusIcon()
        )}
        <span>{smsType === 'in' ? 'In' : 'Out'}: {isResending ? 'Sending...' : getStatusText()}</span>
      </button>

      {/* Show error message if failed and user tapped */}
      {showError && currentError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {currentError}
        </div>
      )}

      {/* Show resend button for failed or pending SMS */}
      {(currentStatus === 'FAILED' || currentStatus === 'PENDING') && (
        <button
          onClick={handleResendSMS}
          disabled={isResending}
          className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded-md text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
            currentStatus === 'FAILED' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={currentStatus === 'PENDING' ? 'Send SMS Now' : 'Resend SMS'}
        >
          {isResending ? (
            <FaSpinner className="w-3 h-3 animate-spin" />
          ) : (
            <FaRedo className="w-3 h-3" />
          )}
          <span>{currentStatus === 'PENDING' ? 'Send' : 'Resend'}</span>
        </button>
      )}

      {/* Show attempts count if > 1 */}
      {currentAttempts > 1 && (
        <span className="ml-2 text-xs text-gray-500 italic">
          ({currentAttempts} attempts)
        </span>
      )}
    </div>
  );
};

export default SMSStatusIndicator;

