import React from 'react';
import {
  View,
  Text,
  StyleSheet
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { COLORS, SPACING, FONTS } from '../../../theme';

interface DateSeparatorProps {
  date: Date;
  isToday?: boolean;
  isYesterday?: boolean;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ 
  date, 
  isToday = false, 
  isYesterday = false 
}) => {
  const { colors } = useTheme();

  const formatDate = () => {
    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';
    
    const now = new Date();
    const messageDate = new Date(date);
    const diffInDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 7) {
      return messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (diffInDays < 365) {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
      <View style={[styles.dateContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.dateText, { color: colors.textSecondary }]}>
          {formatDate()}
        </Text>
      </View>
      <View style={[styles.separator, { backgroundColor: colors.border }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  separator: {
    flex: 1,
    height: 1,
  },
  dateContainer: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
    marginHorizontal: SPACING.sm,
  },
  dateText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.medium,
    textAlign: 'center',
  },
});

export default DateSeparator; 
