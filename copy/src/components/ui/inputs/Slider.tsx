import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PanGestureHandler,
  State
} from 'react-native';
import { PanGestureHandler as RNGHPanGestureHandler } from 'react-native-gesture-handler';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  showValue?: boolean;
  label?: string;
  style?: any;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  showValue = true,
  label,
  style
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);

  const range = maximumValue - minimumValue;
  const percentage = ((value - minimumValue) / range) * 100;

  const handleGestureEvent = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      const newPercentage = Math.max(0, Math.min(100, (translationX / sliderWidth) * 100));
      const newValue = minimumValue + (newPercentage / 100) * range;
      const steppedValue = Math.round(newValue / step) * step;
      onValueChange(steppedValue);
    }
  };

  const formatValue = (val: number) => {
    if (step < 1) {
      return val.toFixed(1);
    }
    return Math.round(val).toString();
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <View style={styles.sliderContainer}>
        {/* Track */}
        <View 
          style={styles.track}
          onLayout={(event) => setSliderWidth(event.nativeEvent.layout.width)}
        >
          {/* Filled Track */}
          <View 
            style={[
              styles.filledTrack,
              { width: `${percentage}%` }
            ]} 
          />
          
          {/* Thumb */}
          <RNGHPanGestureHandler onGestureEvent={handleGestureEvent}>
            <View 
              style={[
                styles.thumb,
                { left: `${percentage}%` }
              ]}
            />
          </RNGHPanGestureHandler>
        </View>

        {/* Value Display */}
        {showValue && (
          <Text style={styles.valueText}>
            {formatValue(value)}
          </Text>
        )}
      </View>

      {/* Min/Max Labels */}
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{formatValue(minimumValue)}</Text>
        <Text style={styles.rangeLabel}>{formatValue(maximumValue)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  label: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  track: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    position: 'relative',
  },
  filledTrack: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  valueText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  rangeLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textTertiary,
  },
}); 
