import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';

// Constants
import { COLORS, SPACING, FONTS } from '../../theme';

interface Tab {
  key: string;
  title: string;
  icon?: string;
  badge?: string | number;
}

interface TabViewProps {
  tabs: Tab[];
  activeTab: number;
  onTabChange: (index: number) => void;
  children: React.ReactNode;
  style?: any;
}

export const TabView: React.FC<TabViewProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
  style
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Tab Headers */}
      <View style={styles.tabHeaders}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabHeader,
              activeTab === index && styles.activeTabHeader
            ]}
            onPress={() => onTabChange(index)}
          >
            <Text style={[
              styles.tabTitle,
              activeTab === index && styles.activeTabTitle
            ]}>
              {tab.title}
            </Text>
            {tab.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badge}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {React.Children.toArray(children)[activeTab]}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabHeaders: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabHeader: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeTabHeader: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabTitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  activeTabTitle: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.white,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
}); 
