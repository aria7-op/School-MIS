import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

// Components
import { Icon } from './Icon';

// Constants
import { COLORS, SPACING, FONTS } from '../../theme';

interface ErrorViewProps {
  error: string | null;
  onRetry?: () => void;
  style?: any;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  error,
  onRetry,
  style
}) => {
  if (!error) return null;

  return (
    <View style={[styles.container, style]}>
      <Icon 
        name="error" 
        size={48} 
        color={COLORS.error} 
        style={styles.errorIcon}
      />
      
      <Text style={styles.errorTitle}>Something went wrong</Text>
      
      <Text style={styles.errorMessage}>
        {error}
      </Text>
      
      {onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={onRetry}
        >
          <Icon name="refresh" size={16} color={COLORS.white} />
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorIcon: {
    marginBottom: SPACING.md,
  },
  errorTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  retryText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.white,
    fontWeight: '500',
  },
}); 
