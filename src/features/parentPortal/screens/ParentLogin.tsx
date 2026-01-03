import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import secureApiService from '../../../services/secureApiService';
import { theme } from '../../../theme';

const { width, height } = Dimensions.get('window');

const ParentLogin: React.FC = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);

  // Check if account is locked out
  const isLockedOut = lockoutTime && new Date() < lockoutTime;

  useEffect(() => {
    // Check for stored lockout time
    const storedLockout = localStorage.getItem('parentLoginLockout');
    if (storedLockout) {
      const lockoutDate = new Date(storedLockout);
      if (new Date() < lockoutDate) {
        setLockoutTime(lockoutDate);
      } else {
        localStorage.removeItem('parentLoginLockout');
      }
    }
  }, []);

  const handleLogin = async () => {
    if (isLockedOut) {
      const remainingTime = Math.ceil((lockoutTime!.getTime() - new Date().getTime()) / 1000 / 60);
      Alert.alert(
        'Account Locked',
        `Too many failed login attempts. Please try again in ${remainingTime} minutes.`
      );
      return;
    }

    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);

    try {
      // First, try to authenticate with the backend
      const response = await secureApiService.login({
        email: username.trim(),
        password: password.trim()
      });

      if (response.success) {
        // Check if the user is actually a parent
        if (response.data?.role === 'PARENT' || response.data?.userRole === 'PARENT') {
          // Successfully authenticated as parent
          await login(response.data);
          setLoginAttempts(0);
          localStorage.removeItem('parentLoginLockout');
        } else {
          // User exists but is not a parent
          Alert.alert(
            'Access Denied',
            'This account does not have parent access. Please contact your school administrator.',
            [{ text: 'OK' }]
          );
          incrementLoginAttempts();
        }
      } else {
        // Login failed
        incrementLoginAttempts();
        Alert.alert('Login Failed', response.message || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      incrementLoginAttempts();
      Alert.alert(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const incrementLoginAttempts = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);

    if (newAttempts >= 5) {
      // Lock account for 15 minutes
      const lockoutDate = new Date(Date.now() + 15 * 60 * 1000);
      setLockoutTime(lockoutDate);
      localStorage.setItem('parentLoginLockout', lockoutDate.toISOString());
      
      Alert.alert(
        'Account Locked',
        'Too many failed login attempts. Your account has been locked for 15 minutes.'
      );
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact your school administrator to reset your password.',
      [{ text: 'OK' }]
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'For technical support, please contact:\n\nEmail: support@school.com\nPhone: (555) 123-4567',
      [{ text: 'OK' }]
    );
  };

  const getLockoutMessage = () => {
    if (!isLockedOut) return null;
    
    const remainingTime = Math.ceil((lockoutTime!.getTime() - new Date().getTime()) / 1000 / 60);
    return `Account locked. Try again in ${remainingTime} minutes.`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🏫</Text>
            </View>
            <Text style={styles.title}>Parent Portal</Text>
            <Text style={styles.subtitle}>Access your child's academic information</Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username or Email</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username or email"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLockedOut}
                autoComplete="username"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textSecondary}
                  secureTextEntry={!showPassword}
                  editable={!isLockedOut}
                  autoComplete="password"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLockedOut}
                >
                  <Text style={styles.eyeButtonText}>
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lockout Message */}
            {getLockoutMessage() && (
              <View style={styles.lockoutContainer}>
                <Text style={styles.lockoutText}>{getLockoutMessage()}</Text>
              </View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (loading || isLockedOut) && styles.loginButtonDisabled
              ]}
              onPress={handleLogin}
              disabled={loading || isLockedOut}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Help Links */}
            <View style={styles.helpContainer}>
              <TouchableOpacity
                style={styles.helpButton}
                onPress={handleForgotPassword}
                disabled={isLockedOut}
              >
                <Text style={styles.helpButtonText}>Forgot Password?</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.helpButton}
                onPress={handleContactSupport}
              >
                <Text style={styles.helpButtonText}>Need Help?</Text>
              </TouchableOpacity>
            </View>

            {/* Security Notice */}
            <View style={styles.securityNotice}>
              <Text style={styles.securityNoticeText}>
                🔒 Your login information is encrypted and secure
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Having trouble? Contact your school's IT department
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: theme.colors.white,
    color: theme.colors.text,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    top: 14,
    padding: 4,
  },
  eyeButtonText: {
    fontSize: 20,
  },
  lockoutContainer: {
    backgroundColor: theme.colors.error,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  lockoutText: {
    color: theme.colors.white,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.textSecondary,
    elevation: 0,
    shadowOpacity: 0,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  helpButton: {
    paddingVertical: 8,
  },
  helpButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  securityNotice: {
    backgroundColor: theme.colors.success,
    padding: 12,
    borderRadius: 8,
    marginBottom: 30,
  },
  securityNoticeText: {
    color: theme.colors.white,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ParentLogin; 