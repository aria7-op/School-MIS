import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../../../contexts/AuthContext';
import { theme } from '../../../theme';

// Import parent screens
import ParentDashboard from '../screens/ParentDashboard';
import ParentStudentsScreen from '../screens/ParentStudentsScreen';
import ParentAttendanceScreen from '../screens/ParentAttendanceScreen';
import ParentGradesScreen from '../screens/ParentGradesScreen';
import ParentExamsScreen from '../screens/ParentExamsScreen';
import ParentFeesScreen from '../screens/ParentFeesScreen';
import ParentMessagingScreen from '../screens/ParentMessagingScreen';
import ParentProfileScreen from '../screens/ParentProfileScreen';
import ParentNotificationsScreen from '../screens/ParentNotificationsScreen';
import ParentCalendarScreen from '../screens/ParentCalendarScreen';
import ParentReportsScreen from '../screens/ParentReportsScreen';

// Import icons
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Parent Dashboard Stack
const ParentDashboardStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentDashboardMain" 
      component={ParentDashboard}
      options={{ title: 'Dashboard' }}
    />
    <Stack.Screen 
      name="ParentProfile" 
      component={ParentProfileScreen}
      options={{ title: 'My Profile' }}
    />
    <Stack.Screen 
      name="ParentNotifications" 
      component={ParentNotificationsScreen}
      options={{ title: 'Notifications' }}
    />
  </Stack.Navigator>
);

// Students Stack
const ParentStudentsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentStudentsMain" 
      component={ParentStudentsScreen}
      options={{ title: 'My Children' }}
    />
  </Stack.Navigator>
);

// Attendance Stack
const ParentAttendanceStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentAttendanceMain" 
      component={ParentAttendanceScreen}
      options={{ title: 'Attendance' }}
    />
  </Stack.Navigator>
);

// Grades Stack
const ParentGradesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentGradesMain" 
      component={ParentGradesScreen}
      options={{ title: 'Grades & Progress' }}
    />
  </Stack.Navigator>
);

// Exams Stack
const ParentExamsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentExamsMain" 
      component={ParentExamsScreen}
      options={{ title: 'Exams & Tests' }}
    />
  </Stack.Navigator>
);

// Fees Stack
const ParentFeesStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentFeesMain" 
      component={ParentFeesScreen}
      options={{ title: 'Fees & Payments' }}
    />
  </Stack.Navigator>
);

// Messaging Stack
const ParentMessagingStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentMessagingMain" 
      component={ParentMessagingScreen}
      options={{ title: 'Messages' }}
    />
  </Stack.Navigator>
);

// Calendar Stack
const ParentCalendarStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentCalendarMain" 
      component={ParentCalendarScreen}
      options={{ title: 'School Calendar' }}
    />
  </Stack.Navigator>
);

// Reports Stack
const ParentReportsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: theme.colors.primary,
      },
      headerTintColor: theme.colors.white,
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="ParentReportsMain" 
      component={ParentReportsScreen}
      options={{ title: 'Reports' }}
    />
  </Stack.Navigator>
);

// Main Parent Tab Navigator
const ParentNavigator: React.FC = () => {
  const { user } = useAuth();

  // Verify user is a parent
  if (!user || user.role !== 'PARENT') {
    return null; // This should not happen as this navigator is only for parents
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Dashboard':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'My Children':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Attendance':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Grades':
              iconName = focused ? 'school' : 'school-outline';
              break;
            case 'Exams':
              iconName = focused ? 'document-text' : 'document-text-outline';
              break;
            case 'Fees':
              iconName = focused ? 'card' : 'card-outline';
              break;
            case 'Messages':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Reports':
              iconName = focused ? 'analytics' : 'analytics-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false, // Hide headers as they're handled by stack navigators
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={ParentDashboardStack}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen 
        name="My Children" 
        component={ParentStudentsStack}
        options={{ title: 'My Children' }}
      />
      <Tab.Screen 
        name="Attendance" 
        component={ParentAttendanceStack}
        options={{ title: 'Attendance' }}
      />
      <Tab.Screen 
        name="Grades" 
        component={ParentGradesStack}
        options={{ title: 'Grades' }}
      />
      <Tab.Screen 
        name="Exams" 
        component={ParentExamsStack}
        options={{ title: 'Exams' }}
      />
      <Tab.Screen 
        name="Fees" 
        component={ParentFeesStack}
        options={{ title: 'Fees' }}
      />
      <Tab.Screen 
        name="Messages" 
        component={ParentMessagingStack}
        options={{ title: 'Messages' }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={ParentCalendarStack}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen 
        name="Reports" 
        component={ParentReportsStack}
        options={{ title: 'Reports' }}
      />
    </Tab.Navigator>
  );
};

export default ParentNavigator; 