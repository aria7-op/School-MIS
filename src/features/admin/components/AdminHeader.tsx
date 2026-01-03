import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Text,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

interface AdminHeaderProps {
  title: string;
  onMenuPress?: () => void;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  notifications?: number;
  alerts?: number;
  userAvatar?: string;
  userName?: string;
  userRole?: string;
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

const Chip = ({ children, mode = 'outlined', textStyle, style, ...props }: any) => (
  <View style={[
    styles.chip,
    mode === 'outlined' && styles.chipOutlined,
    style,
  ]} {...props}>
    <Text style={[styles.chipText, textStyle]}>{children}</Text>
  </View>
);

const Menu = ({ visible, onDismiss, anchor, children, ...props }: any) => (
  <>
    {anchor}
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.menuOverlay} onPress={onDismiss}>
        <View style={styles.menuContainer}>
          {children}
        </View>
      </Pressable>
    </Modal>
  </>
);

const MenuItem = ({ onPress, title, leadingIcon, ...props }: any) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} {...props}>
    {leadingIcon && (
      <MaterialIcons name={leadingIcon} size={20} color="#666" style={styles.menuIcon} />
    )}
    <Text style={styles.menuItemText}>{title}</Text>
  </TouchableOpacity>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  onMenuPress,
  onSearchPress,
  onFilterPress,
  notifications = 0,
  alerts = 0,
  userAvatar,
  userName = 'Admin User',
  userRole = 'Super Admin',
}) => {
  const [userMenuVisible, setUserMenuVisible] = useState(false);

  const handleQuickAction = (action: string) => {
    setUserMenuVisible(false);
    switch (action) {
      case 'profile':
        Alert.alert('Profile', 'Opening user profile...');
        break;
      case 'settings':
        Alert.alert('Settings', 'Opening system settings...');
        break;
      case 'logout':
        Alert.alert('Logout', 'Logging out...');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.leftSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Chip mode="outlined" textStyle={{ fontSize: 12 }} style={styles.statusChip}>
              Live
            </Chip>
          </View>
        </View>

        <View style={styles.rightSection}>
          {/* Menu Button */}
          {onMenuPress && (
            <TouchableOpacity 
              style={styles.iconContainer}
              onPress={onMenuPress}
            >
              <MaterialIcons name="menu" size={24} color="#666" />
            </TouchableOpacity>
          )}

          {/* Notifications */}
          <TouchableOpacity 
            style={styles.iconContainer}
            onPress={() => Alert.alert('Notifications', 'Opening notifications...')}
          >
            <Badge visible={notifications > 0} size={16}>
              {notifications}
            </Badge>
            <MaterialIcons name="notifications" size={24} color="#666" />
          </TouchableOpacity>

          {/* Alerts */}
          <TouchableOpacity 
            style={styles.iconContainer}
            onPress={() => Alert.alert('Alerts', 'Opening alerts...')}
          >
            <Badge visible={alerts > 0} size={16} style={{ backgroundColor: '#FF3B30' }}>
              {alerts}
            </Badge>
            <MaterialIcons name="warning" size={24} color="#FF3B30" />
          </TouchableOpacity>

          {/* User Menu */}
          <Menu
            visible={userMenuVisible}
            onDismiss={() => setUserMenuVisible(false)}
            anchor={
              <TouchableOpacity 
                style={styles.userContainer}
                onPress={() => setUserMenuVisible(true)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {userName.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{userName}</Text>
                  <Text style={styles.userRole}>{userRole}</Text>
                </View>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#666" />
              </TouchableOpacity>
            }
          >
            <MenuItem 
              onPress={() => handleQuickAction('profile')} 
              title="Profile" 
              leadingIcon="account"
            />
            <MenuItem 
              onPress={() => handleQuickAction('settings')} 
              title="Settings" 
              leadingIcon="cog"
            />
            <Divider />
            <MenuItem 
              onPress={() => handleQuickAction('logout')} 
              title="Logout" 
              leadingIcon="logout"
            />
          </Menu>
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionLeft}>
          {/* Search */}
          {onSearchPress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onSearchPress}
            >
              <MaterialIcons name="search" size={20} color="#666" />
            </TouchableOpacity>
          )}

          {/* Filter */}
          {onFilterPress && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onFilterPress}
            >
              <MaterialIcons name="filter-list" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  leftSection: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  statusChip: {
    height: 24,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    position: 'relative',
    padding: 8,
    marginLeft: 8,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  userInfo: {
    marginRight: 4,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  userRole: {
    fontSize: 12,
    color: '#666',
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginRight: 8,
  },
  // Badge styles
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  // Chip styles
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '500',
  },
  // Menu styles
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 60,
    marginRight: 16,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
});

export default AdminHeader; 
