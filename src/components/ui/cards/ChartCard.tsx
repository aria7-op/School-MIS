import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity
} from 'react-native';

// Components
import { Icon } from '../Icon';

// Constants
import { COLORS, SPACING, FONTS } from '../../../theme';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onExport?: () => void;
  onRefresh?: () => void;
  onMore?: () => void;
  style?: any;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  subtitle,
  children,
  onExport,
  onRefresh,
  onMore,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {onRefresh && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onRefresh}
            >
              <Icon name="refresh" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          {onExport && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onExport}
            >
              <Icon name="file-download" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}

          {onMore && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onMore}
            >
              <Icon name="more-vert" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chart Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    padding: SPACING.xs,
    borderRadius: 4,
  },
  content: {
    flex: 1,
  },
}); 
