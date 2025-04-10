import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import producer screens
import ProducerDashboard from '../screens/producer/ProducerDashboard';
import ProducerCalendar from '../screens/producer/ProducerCalendar';
import NewProductionRequest from '../screens/common/NewProductionRequest';
import ProductionDetailsScreen from '../screens/common/ProductionDetailsScreen';
import ProductionHistoryScreen from '../screens/history/ProductionHistoryScreen';
import ReportOvertime from '../screens/producer/ReportOvertime';
import IssueReporting from '../screens/common/IssueReporting';
import NotificationsScreen from '../screens/producer/NotificationsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Producer Home Stack - Dashboard and related screens
const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#28a745',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={ProducerDashboard}
        options={{ title: 'Producer Dashboard' }}
      />
      <Stack.Screen 
        name="NewProductionRequest" 
        component={NewProductionRequest}
        options={{ title: 'New Production Request' }}
      />
      <Stack.Screen 
        name="ProductionDetails" 
        component={ProductionDetailsScreen}
        options={{ title: 'Production Details' }}
      />
      <Stack.Screen 
        name="ReportOvertime" 
        component={ReportOvertime}
        options={{ title: 'Report Overtime' }}
      />
      <Stack.Screen 
        name="IssueReporting" 
        component={IssueReporting}
        options={{ title: 'Report Issue' }}
      />
    </Stack.Navigator>
  );
};

// Calendar Stack
const CalendarStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#28a745',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Calendar" 
        component={ProducerCalendar}
        options={{ title: 'My Productions' }}
      />
      <Stack.Screen 
        name="ProductionDetails" 
        component={ProductionDetailsScreen}
        options={{ title: 'Production Details' }}
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
          backgroundColor: '#28a745',
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
          backgroundColor: '#28a745',
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
          backgroundColor: '#28a745',
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

const ProducerNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#28a745',
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
        name="CalendarTab" 
        component={CalendarStack}
        options={{
          tabBarLabel: 'Productions',
          tabBarIcon: ({ color, size }) => (
            <Icon name="event" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="NewRequestTab" 
        component={NewProductionRequest}
        options={{
          tabBarLabel: 'New Request',
          tabBarIcon: ({ color, size }) => (
            <Icon name="add-circle" size={size} color={color} />
          ),
          headerStyle: {
            backgroundColor: '#28a745',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShown: true,
          title: 'New Production Request'
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

export default ProducerNavigator;