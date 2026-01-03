import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { COLORS, FONTS } from '../../../theme';

interface UnreadBadgeProps {
  count: number;
  animated?: boolean;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count, animated = true }) => {
  if (!count || count <= 0) return null;
  // Optionally, you could use Animated.View for more advanced animation
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    position: 'absolute',
    top: -6,
    right: -10,
    zIndex: 10,
    elevation: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.bold,
  },
});

export default UnreadBadge; 
