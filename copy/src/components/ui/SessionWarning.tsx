import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import sessionManager from '../../services/sessionManager';

interface SessionWarningProps {
  visible: boolean;
  remainingMinutes: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

const SessionWarning: React.FC<SessionWarningProps> = ({
  visible,
  remainingMinutes,
  onExtendSession,
  onLogout,
}) => {
  const [isVisible, setIsVisible] = useState(visible);
  const [timeLeft, setTimeLeft] = useState(remainingMinutes);

  useEffect(() => {
    setIsVisible(visible);
    setTimeLeft(remainingMinutes);
  }, [visible, remainingMinutes]);

  useEffect(() => {
    if (isVisible && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 60000); // Update every minute

      return () => clearInterval(timer);
    }
  }, [isVisible, timeLeft]);

  const handleExtendSession = () => {
    sessionManager.extendSession();
    onExtendSession();
    setIsVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Session Expiring',
      'Your session is about to expire. Would you like to logout now?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            onLogout();
            setIsVisible(false);
          }
        },
      ]
    );
  };

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>⚠️ Session Expiring</Text>
        <Text style={styles.warningMessage}>
          Your session will expire in {timeLeft} minute{timeLeft !== 1 ? 's' : ''}.
          Please save your work.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.extendButton} onPress={handleExtendSession}>
            <Text style={styles.extendButtonText}>Extend Session</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  warningBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxWidth: 400,
    width: '100%',
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  warningMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  extendButton: {
    flex: 1,
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  extendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SessionWarning; 
