import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';

// Components
import { Icon } from './Icon';

// Constants
import { COLORS, SPACING, FONTS } from '../../theme';

interface BadgeProps {
  icon?: string;
  iconColor?: string;
  text: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  backgroundColor?: string;
  style?: any;
}

export const Badge: React.FC<BadgeProps> = ({
  icon,
  iconColor = COLORS.textSecondary,
  text,
  size = 'medium',
  color = COLORS.textSecondary,
  backgroundColor = COLORS.background,
  style
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: SPACING.xs,
          paddingVertical: 2,
          borderRadius: 8,
          iconSize: 12,
          fontSize: FONTS.sizes.xs,
        };
      case 'large':
        return {
          paddingHorizontal: SPACING.md,
          paddingVertical: SPACING.xs,
          borderRadius: 12,
          iconSize: 16,
          fontSize: FONTS.sizes.sm,
        };
      default: // medium
        return {
          paddingHorizontal: SPACING.sm,
          paddingVertical: 4,
          borderRadius: 10,
          iconSize: 14,
          fontSize: FONTS.sizes.xs,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[
      styles.container,
      {
        paddingHorizontal: sizeStyles.paddingHorizontal,
        paddingVertical: sizeStyles.paddingVertical,
        borderRadius: sizeStyles.borderRadius,
        backgroundColor,
      },
      style
    ]}>
      {icon && (
        <Icon
          name={icon}
          size={sizeStyles.iconSize}
          color={iconColor}
          style={styles.icon}
        />
      )}
      <Text style={[
        styles.text,
        {
          fontSize: sizeStyles.fontSize,
          color,
        }
      ]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: SPACING.xs,
  },
  text: {
    fontWeight: '500',
  },
}); 
