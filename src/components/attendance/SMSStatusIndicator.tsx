import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import axios from 'axios';

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
  const { colors } = useTheme();
  const [isResending, setIsResending] = useState(false);
  const [showError, setShowError] = useState(false);

  const getStatusColor = () => {
    switch (status) {
      case 'SENT':
        return '#4CAF50'; // Green
      case 'FAILED':
        return '#F44336'; // Red
      case 'PENDING':
        return '#FF9800'; // Orange
      case 'NO_PHONE':
        return '#9E9E9E'; // Gray
      default:
        return '#757575'; // Default gray
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'SENT':
        return 'check-circle';
      case 'FAILED':
        return 'error';
      case 'PENDING':
        return 'schedule';
      case 'NO_PHONE':
        return 'phone-disabled';
      default:
        return 'help';
    }
  };

  const getStatusText = () => {
    switch (status) {
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
      
      const response = await axios.post('/api/attendances/resend-sms', {
        attendanceId,
        smsType
      });

      if (response.data.success) {
        Alert.alert('Success', 'SMS resent successfully!', [
          { text: 'OK', onPress: () => onResendSuccess && onResendSuccess() }
        ]);
      } else {
        Alert.alert(
          'Failed',
          response.data.message || 'Failed to resend SMS. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      console.error('Error resending SMS:', err);
      Alert.alert(
        'Error',
        err.response?.data?.message || 'An error occurred while resending SMS.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsResending(false);
    }
  };

  const handlePressIndicator = () => {
    if (status === 'FAILED' && error) {
      setShowError(!showError);
    } else if (status === 'SENT' && sentAt) {
      const date = new Date(sentAt);
      Alert.alert(
        'SMS Sent',
        `Sent at: ${date.toLocaleString()}\nAttempts: ${attempts}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handlePressIndicator}
        style={styles.statusContainer}
        activeOpacity={0.7}
      >
        <MaterialIcons
          name={getStatusIcon()}
          size={20}
          color={getStatusColor()}
          style={styles.icon}
        />
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {smsType === 'in' ? 'In' : 'Out'}: {getStatusText()}
        </Text>
      </TouchableOpacity>

      {/* Show error message if failed and user tapped */}
      {showError && error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
        </View>
      )}

      {/* Show resend button for failed SMS */}
      {(status === 'FAILED' || status === 'NO_PHONE') && status !== 'NO_PHONE' && (
        <TouchableOpacity
          onPress={handleResendSMS}
          disabled={isResending}
          style={[
            styles.resendButton,
            isResending && styles.resendButtonDisabled
          ]}
        >
          {isResending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <MaterialIcons name="refresh" size={16} color="#fff" style={styles.resendIcon} />
              <Text style={styles.resendText}>Resend</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Show attempts count if > 1 */}
      {attempts > 1 && (
        <Text style={styles.attemptsText}>
          {attempts} attempt{attempts > 1 ? 's' : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  resendButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  resendButtonDisabled: {
    backgroundColor: '#B0BEC5',
  },
  resendIcon: {
    marginRight: 4,
  },
  resendText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  attemptsText: {
    fontSize: 11,
    color: '#757575',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default SMSStatusIndicator;

