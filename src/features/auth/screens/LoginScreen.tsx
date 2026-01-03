import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  NativeSyntheticEvent,
  TextInputChangeEventData,
  Image,
  Platform
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';

const LoginScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleUsernameChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setUsername(e.nativeEvent.text);
  };

  const handlePasswordChange = (e: NativeSyntheticEvent<TextInputChangeEventData>) => {
    setPassword(e.nativeEvent.text);
  };

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isLoggingInRef = useRef(false);

  const handleLogin = async () => {
    // Prevent multiple simultaneous login attempts
    if (isLoggingInRef.current) {
      return;
    }
    
    isLoggingInRef.current = true;
    setError('');
    
    if (!username || !password) {
      isLoggingInRef.current = false;
      setError('Please enter both username and password');
      return;
    }

    try {
      setIsLoggingIn(true);
      
      const result = await login(username, password);
      
      if (!result.success) {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Connection timeout. Please check your internet connection and try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoggingIn(false);
      isLoggingInRef.current = false;
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.imagebox}>
          <Image 
            source={require('../../../../src/assets/loginpng.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.leftTitle}>School Management System</Text>
      </View>
      
      <View style={styles.rightSection}>
        <View style={styles.bodySection}>
          <View style={styles.fromBox}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
            
            {error ? <Text style={styles.error}>{error}</Text> : null}
            
            <Text style={styles.lable}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChange={handleUsernameChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus={true}
            />
            
            <Text style={styles.lable}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChange={handlePasswordChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter your password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            
            <TouchableOpacity 
              style={[styles.loginButton, isLoggingIn && styles.loginButtonDisabled]} 
              onPress={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>
            
            {isLoggingIn && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#007AFF" size="large" />
                <Text style={styles.loadingText}>Logging in...</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#b7bafc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#f0f1ff'
  },
  lable: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#007AFF',
    fontSize: 14,
  },
  rightSection: {
    width: '75%',
  },
  leftSection: {
    flex: 1,
    width: '25%',
    backgroundColor: '#6366f1',
    padding: 20
  },
  bodySection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fromBox: {
    width: '100%',
    maxWidth: 350
  },
  leftTitle: {
    textAlign: 'center',
    fontSize: 26,
    color: '#fff',
    fontWeight: '600',
    marginTop: 15
  },
  imagebox: {
    width: '80%',
    height: 400,
    alignSelf: 'flex-start',
    margin: 'auto'
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
});

export default LoginScreen;
