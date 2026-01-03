import React from 'react';
import {
  View,
  StyleSheet
} from 'react-native';

// Constants
import { COLORS, SPACING } from '../../theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = COLORS.primary,
  backgroundColor = COLORS.background,
  height = 8,
  borderRadius = 4,
  style
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));

  return (
    <View style={[
      styles.container,
      {
        height,
        borderRadius,
        backgroundColor,
      },
      style
    ]}>
      <View
        style={[
          styles.progress,
          {
            width: `${clampedProgress * 100}%`,
            backgroundColor: color,
            borderRadius,
          }
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
  },
}); 
