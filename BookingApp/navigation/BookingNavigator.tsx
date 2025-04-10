import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import booking officer screens
import BookingOfficerDashboard from '../screens/booking/BookingOfficerDashboard';
import BookingOfficerCalendar from '../screens/booking/BookingOfficerCalendar';
import StaffAssignment from '../screens/booking/StaffAssignment';
import AnnouncementDashboard from '../screens/booking/AnnouncementDashboard';
import StaffDirectory from '../screens/booking/StaffDirectory';
import ProductionDetailsScreen from '../screens/common/ProductionDetailsScreen';
import SchedulePrinting from '../screens/booking/SchedulePrinting';
import ProductionHistoryScreen from '../screens/history/ProductionHistoryScreen';
import ProductionAnalyticsScreen from '../screens/history/ProductionAnalyticsScreen';
import PrintPreview from '../screens/booking/PrintPreview';
import IssueReporting from '../screens/common/IssueReporting';
import ProductionListScreen from '../screens/booking/ProductionListScreen';
import NewProductionRequest from '../screens/common/NewProductionRequest';
import ProfileScreen from '../screens/common/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Booking Home Stack - Dashboard and related screens
const HomeStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={BookingOfficerDashboard}
        options={{ title: 'Booking Dashboard' }}
      />
      <Stack.Screen 
        name="StaffAssignment" 
        component={StaffAssignment}
        options={{ title: 'Assign Staff' }}
      />
      <Stack.Screen 
        name="SchedulePrinting" 
        component={SchedulePrinting}
        options={{ title: 'Print Schedule' }}
      />
      <Stack.Screen 
        name="ProductionDetails" 
        component={ProductionDetailsScreen}
        options={{ title: 'Production Details' }}
      />
      <Stack.Screen 
        name="NewProductionRequest" 
        component={NewProductionRequest}
        options={{ title: 'New Production' }}
      />
      <Stack.Screen 
        name="ProductionList" 
        component={ProductionListScreen}
        options={({ route }) => ({ 
          title: route.params?.title || 'Productions'
        })}
      />
      <Stack.Screen 
        name="IssueReporting" 
        component={IssueReporting}
        options={{ title: 'Report Issue' }}
      />
      <Stack.Screen
        name="PrintPreview"
        component={PrintPreview}
        options={({ route }) => ({ 
          title: route.params?.title || 'Print Preview'
        })}
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
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Calendar" 
        component={BookingOfficerCalendar}
        options={{ title: 'Production Calendar' }}
      />
      <Stack.Screen 
        name="ProductionDetails" 
        component={ProductionDetailsScreen}
        options={{ title: 'Production Details' }}
      />
      <Stack.Screen 
        name="NewProductionRequest" 
        component={NewProductionRequest}
        options={{ title: 'New Production' }}
      />
    </Stack.Navigator>
  );
};

// Staff Directory Stack
const StaffStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="StaffDirectory" 
        component={StaffDirectory}
        options={{ title: 'Staff Directory' }}
      />
    </Stack.Navigator>
  );
};

// Announcement Stack
const AnnouncementStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Announcements" 
        component={AnnouncementDashboard}
        options={{ title: 'Announcements' }}
      />
    </Stack.Navigator>
  );
};

// Analytics Stack
const AnalyticsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007bff',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Analytics" 
        component={ProductionAnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
      <Stack.Screen 
        name="ProductionHistory" 
        component={ProductionHistoryScreen}
        options={{ title: 'Production History' }}
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
          backgroundColor: '#007bff',
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

const BookingNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007bff',
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
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-today" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="StaffTab" 
        component={StaffStack}
        options={{
          tabBarLabel: 'Staff',
          tabBarIcon: ({ color, size }) => (
            <Icon name="people" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="AnnouncementsTab" 
        component={AnnouncementStack}
        options={{
          tabBarLabel: 'Announce',
          tabBarIcon: ({ color, size }) => (
            <Icon name="campaign" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen 
        name="AnalyticsTab" 
        component={AnalyticsStack}
        options={{
          tabBarLabel: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Icon name="insights" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BookingNavigator;