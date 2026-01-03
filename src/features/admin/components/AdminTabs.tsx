import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Text,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AdminSection } from '../types';

interface TabSection {
  id: AdminSection;
  label: string;
  icon: string;
  badge?: number;
  color?: string;
}

interface AdminTabsProps {
  sections: TabSection[];
  selectedSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

// Custom styled components
const Badge = ({ children, visible, size = 16, style, ...props }: any) => {
  if (!visible) return null;
  return (
    <View style={[styles.badge, { width: size, height: size }, style]} {...props}>
      <Text style={styles.badgeText}>{children}</Text>
    </View>
  );
};

const Surface = ({ children, style, elevation = 1, ...props }: any) => (
  <View 
    style={[
      styles.surface,
      { 
        shadowOpacity: elevation * 0.1,
        shadowRadius: elevation * 2,
        elevation: elevation,
      },
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

const AdminTabs: React.FC<AdminTabsProps> = ({
  sections,
  selectedSection,
  onSectionChange,
}) => {
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      dashboard: MaterialIcons,
      people: MaterialIcons,
      school: MaterialIcons,
      'attach-money': MaterialIcons,
      inventory: MaterialIcons,
      message: MaterialIcons,
      settings: MaterialIcons,
      'account-group': MaterialCommunityIcons,
      'school-outline': MaterialCommunityIcons,
      'cash-multiple': MaterialCommunityIcons,
      'warehouse': MaterialCommunityIcons,
      'message-text': MaterialCommunityIcons,
      'cog': MaterialCommunityIcons,
    };

    return iconMap[iconName] || MaterialIcons;
  };

  const renderTab = (section: TabSection) => {
    const isSelected = selectedSection === section.id;
    const IconComponent = getIconComponent(section.icon);
    const badgeColor = section.color || '#007AFF';

    return (
      <TouchableOpacity
        key={section.id}
        style={[
          styles.tab,
          isSelected && [
            styles.selectedTab,
            { backgroundColor: '#E3F2FD' }
          ]
        ]}
        onPress={() => onSectionChange(section.id)}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          <View style={styles.iconContainer}>
            <IconComponent
              name={section.icon}
              size={24}
              color={
                isSelected
                  ? '#007AFF'
                  : '#666'
              }
            />
            {section.badge && section.badge > 0 && (
              <Badge
                visible={true}
                size={16}
                style={[
                  styles.badge,
                  { backgroundColor: badgeColor }
                ]}
              >
                {section.badge > 99 ? '99+' : section.badge}
              </Badge>
            )}
          </View>
          <Text
            style={[
              styles.tabLabel,
              {
                color: isSelected
                  ? '#007AFF'
                  : '#666',
                fontWeight: isSelected ? 'bold' : 'normal',
              }
            ]}
          >
            {section.label}
          </Text>
        </View>
        {isSelected && (
          <View
            style={[
              styles.selectedIndicator,
              { backgroundColor: '#007AFF' }
            ]}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Surface style={styles.container} elevation={1}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {sections.map(renderTab)}
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    minWidth: 80,
    alignItems: 'center',
    position: 'relative',
  },
  selectedTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabContent: {
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  tabLabel: {
    textAlign: 'center',
    fontSize: 12,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    borderRadius: 2,
  },
  // Surface styles
  surface: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
  },
});

export default AdminTabs; 
