import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle
} from 'react-native';

// Constants
import { COLORS, SPACING } from '../../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  border?: boolean;
}

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  padding = 'medium',
  shadow = true,
  border = false
}) => {
  const getPadding = () => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return SPACING.sm;
      case 'large':
        return SPACING.lg;
      default: // medium
        return SPACING.md;
    }
  };

  return (
    <View style={[
      styles.container,
      {
        padding: getPadding(),
        shadowOpacity: shadow ? 0.1 : 0,
        borderWidth: border ? 1 : 0,
      },
      style
    ]}>
      {children}
    </View>
  );
};

export const CardContent: React.FC<CardContentProps> = ({
  children,
  style
}) => {
  return (
    <View style={[styles.cardContent, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowRadius: 4,
    elevation: 3,
    borderColor: COLORS.border,
  },
  cardContent: {
    flex: 1,
  },
}); 
