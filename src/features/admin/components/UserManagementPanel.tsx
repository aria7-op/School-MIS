import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { UserData } from '../types';

interface UserManagementPanelProps {
  data?: UserData;
  loading?: boolean;
  error?: string | null;
  searchQuery?: string;
  filters?: any;
  viewMode?: 'grid' | 'list';
  onRefresh?: () => void;
}

// Custom styled components
const Card = ({ children, style, ...props }: any) => (
  <View style={[styles.card, style]} {...props}>
    {children}
  </View>
);

const CardContent = ({ children, style, ...props }: any) => (
  <View style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
);

const Button = ({ children, mode = 'contained', size = 'medium', onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[
      styles.button,
      mode === 'contained' && styles.buttonContained,
      mode === 'outlined' && styles.buttonOutlined,
      size === 'small' && styles.buttonSmall,
      style,
    ]}
    onPress={onPress}
    {...props}
  >
    <Text style={[
      styles.buttonText,
      mode === 'contained' && styles.buttonTextContained,
      mode === 'outlined' && styles.buttonTextOutlined,
      size === 'small' && styles.buttonTextSmall,
    ]}>
      {children}
    </Text>
  </TouchableOpacity>
);

const IconButton = ({ icon, size = 24, onPress, style, ...props }: any) => (
  <TouchableOpacity
    style={[styles.iconButton, style]}
    onPress={onPress}
    {...props}
  >
    <MaterialIcons name={icon} size={size} color="#666" />
  </TouchableOpacity>
);

const Chip = ({ children, mode = 'outlined', textStyle, style, ...props }: any) => (
  <View
    style={[
      styles.chip,
      mode === 'outlined' && styles.chipOutlined,
      mode === 'flat' && styles.chipFlat,
      style,
    ]}
    {...props}
  >
    <Text style={[
      styles.chipText,
      textStyle,
      mode === 'flat' && styles.chipTextFlat,
    ]}>
      {children}
    </Text>
  </View>
);

const Avatar = ({ size = 40, label, style, ...props }: any) => (
  <View style={[
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
    style,
  ]} {...props}>
    <Text style={[
      styles.avatarText,
      { fontSize: size * 0.4 },
    ]}>
      {label}
    </Text>
  </View>
);

const Searchbar = ({ placeholder, value, onChangeText, style, ...props }: any) => (
  <View style={[styles.searchbarContainer, style]}>
    <MaterialIcons name="search" size={20} color="#666" style={styles.searchIcon} />
    <TextInput
      style={styles.searchbarInput}
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      placeholderTextColor="#999"
      {...props}
    />
  </View>
);

const Divider = ({ style, ...props }: any) => (
  <View style={[styles.divider, style]} {...props} />
);

const Badge = ({ children, style, ...props }: any) => (
  <View style={[styles.badge, style]} {...props}>
    <Text style={styles.badgeText}>{children}</Text>
  </View>
);

const UserManagementPanel: React.FC<UserManagementPanelProps> = ({
  data,
  loading = false,
  error = null,
  searchQuery = '',
  filters = {},
  viewMode = 'grid',
  onRefresh,
}) => {
  const [searchVisible, setSearchVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const getRoleColor = (role: string) => {
    const colorMap: Record<string, string> = {
      admin: '#F44336',
      teacher: '#007AFF',
      staff: '#9C27B0',
      student: '#4CAF50',
      parent: '#FF9800',
    };
    return colorMap[role] || '#666';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#007AFF';
      case 'inactive':
        return '#F44336';
      case 'suspended':
        return '#FF9800';
      case 'pending':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const renderUserCard = (user: any) => {
    const isSelected = selectedUser === user.id;
    const roleColor = getRoleColor(user.role);
    const statusColor = getStatusColor(user.status);

    return (
      <TouchableOpacity
        key={user.id}
        style={[
          styles.userCard,
          isSelected && styles.selectedUserCard,
        ]}
        onPress={() => setSelectedUser(isSelected ? null : user.id)}
        activeOpacity={0.7}
      >
        <Card style={styles.card}>
          <CardContent>
            <View style={styles.userHeader}>
              <Avatar
                size={40}
                label={user.name.split(' ').map((n: string) => n[0]).join('')}
                style={{ backgroundColor: roleColor }}
              />
              <View style={styles.userInfo}>
                <Text style={styles.userName}>
                  {user.name}
                </Text>
                <Text style={styles.userEmail}>
                  {user.email}
                </Text>
                <View style={styles.userMeta}>
                  <Chip
                    mode="outlined"
                    textStyle={{ fontSize: 10 }}
                    style={[styles.roleChip, { borderColor: roleColor }]}
                  >
                    {user.role}
                  </Chip>
                  <Chip
                    mode="flat"
                    textStyle={{ fontSize: 10 }}
                    style={[styles.statusChip, { backgroundColor: statusColor }]}
                  >
                    {user.status}
                  </Chip>
                </View>
              </View>
              <IconButton
                icon="more-vert"
                size={20}
                onPress={() => {
                  // TODO: Implement user options menu
                  console.log('User options for:', user.id);
                }}
              />
            </View>
            {isSelected && (
              <View style={styles.userDetails}>
                <Divider style={styles.divider} />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>School:</Text>
                  <Text style={styles.detailValue}>{user.school}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Login:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.actionButtons}>
                  <Button mode="outlined" size="small" onPress={() => {
                    // TODO: Implement edit user functionality
                    console.log('Edit user:', user.id);
                  }}>
                    Edit
                  </Button>
                  <Button mode="outlined" size="small" onPress={() => {
                    // TODO: Implement view user details functionality
                    console.log('View details for user:', user.id);
                  }}>
                    Details
                  </Button>
                </View>
              </View>
            )}
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderUserList = (user: any) => {
    const roleColor = getRoleColor(user.role);
    const statusColor = getStatusColor(user.status);

    return (
      <TouchableOpacity
        key={user.id}
        style={styles.listItem}
        onPress={() => {
          // TODO: Implement user selection functionality
          console.log('Selected user:', user.id);
        }}
      >
        <View style={styles.listItemContent}>
          <Avatar
            size={40}
            label={user.name.split(' ').map((n: string) => n[0]).join('')}
            style={{ backgroundColor: roleColor }}
          />
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>{user.name}</Text>
            <Text style={styles.listItemDescription}>{user.email}</Text>
          </View>
          <View style={styles.listItemActions}>
            <Chip
              mode="outlined"
              textStyle={{ fontSize: 10 }}
              style={[styles.roleChip, { borderColor: roleColor }]}
            >
              {user.role}
            </Chip>
            <Chip
              mode="flat"
              textStyle={{ fontSize: 10 }}
              style={[styles.statusChip, { backgroundColor: statusColor }]}
            >
              {user.status}
            </Chip>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text>Loading user data...</Text>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card style={styles.container}>
        <CardContent>
          <Text style={styles.errorText}>Error: {error}</Text>
          {onRefresh && (
            <Button mode="contained" onPress={onRefresh}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Mock data for demonstration
  const mockUsers = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@school.com',
      role: 'teacher',
      status: 'active',
      school: 'Main Campus',
      lastLogin: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@school.com',
      role: 'admin',
      status: 'active',
      school: 'Main Campus',
      lastLogin: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob.johnson@school.com',
      role: 'student',
      status: 'pending',
      school: 'Main Campus',
      lastLogin: new Date(Date.now() - 172800000).toISOString(),
    },
  ];

  const users = data?.users || mockUsers;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <View style={styles.headerActions}>
          <IconButton
            icon="search"
            onPress={() => setSearchVisible(!searchVisible)}
          />
          <IconButton
            icon="filter-list"
            onPress={() => {
              // TODO: Implement filter functionality
              console.log('Filter button pressed');
            }}
          />
          <IconButton
            icon="refresh"
            onPress={onRefresh}
          />
        </View>
      </View>

      {searchVisible && (
        <Searchbar
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={() => {}}
          style={styles.searchbar}
        />
      )}

      <ScrollView style={styles.content}>
        <View style={styles.userGrid}>
          {viewMode === 'grid' 
            ? users.map(renderUserCard)
            : users.map(renderUserList)
          }
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
  },
  searchbar: {
    margin: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  userCard: {
    width: '48%',
    marginBottom: 16,
  },
  selectedUserCard: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  roleChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  statusChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  userDetails: {
    marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  // List view styles
  listItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listItemDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  listItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 16,
  },
  // Custom component styles
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minHeight: 36,
  },
  buttonContained: {
    backgroundColor: '#007AFF',
  },
  buttonOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    minHeight: 28,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextContained: {
    color: '#fff',
  },
  buttonTextOutlined: {
    color: '#007AFF',
  },
  buttonTextSmall: {
    fontSize: 12,
  },
  iconButton: {
    padding: 4,
    marginLeft: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  chipOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  chipFlat: {
    backgroundColor: '#007AFF',
  },
  chipText: {
    fontSize: 12,
    color: '#333',
  },
  chipTextFlat: {
    color: '#fff',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchbarInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default UserManagementPanel; 
