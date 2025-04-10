import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import operator screens
import OperatorDashboard from '../screens/operator/OperatorDashboard';
import OperatorSchedule from '../screens/operator/OperatorSchedule';
import IssueReporting from '../screens/common/IssueReporting';
import ProductionDetailsScreen from '../screens/common/ProductionDetailsScreen';
import ProductionHistoryScreen from '../screens/history/ProductionHistoryScreen';
import NotificationsScreen from '../screens/operator/NotificationsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Operator Home Stack - Dashboard and related screens
const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#17a2b8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={OperatorDashboard}
        options={{ title: 'Operator Dashboard' }}
      />
      <Stack.Screen 
        name="ProductionDetails" 
        component={ProductionDetailsScreen}
        options={{ title: 'Production Details' }}
      />
      <Stack.Screen 
        name="IssueReporting" 
        component={IssueReporting}
        options={{ title: 'Report Issue' }}
      />
    </Stack.Navigator>
  );
};

// Schedule Stack
const ScheduleStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#17a2b8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Schedule" 
        component={OperatorSchedule}
        options={{ title: 'My Schedule' }}
      />
      <Stack.Screen 
        name="ProductionDetails" 
        component={ProductionDetailsScreen}
        options={{ title: 'Production Details' }}
      />
    </Stack.Navigator>
  );
};

// Issues Stack
const IssuesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#17a2b8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Issue" 
        component={IssueReporting}
        options={{ title: 'Report Issue' }}
      />
    </Stack.Navigator>
  );
};

// History Stack
const HistoryStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#17a2b8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="History" 
        component={ProductionHistoryScreen}
        options={{ title: 'Production History' }}
      />
      <Stack.Screen 
        name="ProductionDetails" 
        component={ProductionDetailsScreen}
        options={{ title: 'Production Details' }}
      />
    </Stack.Navigator>
  );
};

// Notifications Stack
const NotificationsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#17a2b8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen}
        options={{ title: 'Notifications' }}
      />
    </Stack.Navigator>
  );
};

// Profile Stack
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#17a2b8',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
      />
    </Stack.Navigator>
  );
};

const OperatorNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#17a2b8',
        tabBarInactiveTintColor: '#777',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarStyle: {
          paddingBottom: 5,
          height: 60,
        },
        headerShown: false
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Icon name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="ScheduleTab" 
        component={ScheduleStack}
        options={{
          tabBarLabel: 'Schedule',
          tabBarIcon: ({ color, size }) => (
            <Icon name="schedule" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="IssuesTab" 
        component={IssuesStack}
        options={{
          tabBarLabel: 'Report Issue',
          tabBarIcon: ({ color, size }) => (
            <Icon name="report-problem" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="HistoryTab" 
        component={HistoryStack}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, size }) => (
            <Icon name="history" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="NotificationsTab" 
        component={NotificationsStack}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ color, size }) => (
            <Icon name="notifications" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default OperatorNavigator;