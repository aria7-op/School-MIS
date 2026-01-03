import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle
} from 'react-native';

// Components
import { Icon } from '../Icon';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: COLORS.background,
          borderColor: COLORS.border,
          borderWidth: 1,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: COLORS.primary,
          borderWidth: 1,
        };
      case 'danger':
        return {
          backgroundColor: COLORS.error,
        };
      case 'success':
        return {
          backgroundColor: COLORS.success,
        };
      default: // primary
        return {
          backgroundColor: COLORS.primary,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: SPACING.sm,
          paddingVertical: SPACING.xs,
          borderRadius: 6,
          iconSize: 14,
          fontSize: FONTS.sizes.sm,
        };
      case 'large':
        return {
          paddingHorizontal: SPACING.lg,
          paddingVertical: SPACING.md,
          borderRadius: 8,
          iconSize: 18,
          fontSize: FONTS.sizes.md,
        };
      default: // medium
        return {
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.sm,
          borderRadius: 6,
          iconSize: 16,
          fontSize: FONTS.sizes.sm,
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return COLORS.textTertiary;
    
    switch (variant) {
      case 'outline':
        return COLORS.primary;
      case 'secondary':
        return COLORS.textSecondary;
      default:
        return COLORS.white;
    }
  };

  const getIconColor = () => {
    if (disabled) return COLORS.textTertiary;
    
    switch (variant) {
      case 'outline':
        return COLORS.primary;
      case 'secondary':
        return COLORS.textSecondary;
      default:
        return COLORS.white;
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();
  const textColor = getTextColor();
  const iconColor = getIconColor();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        variantStyles,
        {
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          borderRadius: sizeStyles.borderRadius,
          opacity: disabled ? 0.6 : 1,
        },
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <Text style={[styles.loadingText, { color: textColor }]}>
          Loading...
        </Text>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Icon
              name={icon}
              size={sizeStyles.iconSize}
              color={iconColor}
              style={styles.leftIcon}
            />
          )}
          
          <Text style={[
            styles.text,
            {
              fontSize: sizeStyles.fontSize,
              color: textColor,
            },
            textStyle
          ]}>
            {title}
          </Text>
          
          {icon && iconPosition === 'right' && (
            <Icon
              name={icon}
              size={sizeStyles.iconSize}
              color={iconColor}
              style={styles.rightIcon}
            />
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  loadingText: {
    fontWeight: '500',
  },
  leftIcon: {
    marginRight: SPACING.xs,
  },
  rightIcon: {
    marginLeft: SPACING.xs,
  },
}); 
