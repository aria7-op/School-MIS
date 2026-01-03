import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface NetworkStatusBannerProps {
  visible: boolean;
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const NetworkStatusBanner: React.FC<NetworkStatusBannerProps> = ({
  visible,
  error,
  onRetry,
  onDismiss
}) => {
  const { colors } = useTheme();

  if (!visible || !error) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.content}>
        <Icon 
          name="wifi-off" 
          size={20} 
          color="#f59e0b" 
          style={styles.icon}
        />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Network Connection Issue
          </Text>
          <Text style={[styles.message, { color: colors.text }]}>
            {error}. Please check your connection and try again.
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.primary }]} 
            onPress={onRetry}
          >
            <Icon name="refresh" size={16} color="#fff" />
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        )}
        
        {onDismiss && (
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: colors.border }]} 
            onPress={onDismiss}
          >
            <Icon name="close" size={16} color={colors.text} />
            <Text style={[styles.buttonText, { color: colors.text }]}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
});

export default NetworkStatusBanner; 
