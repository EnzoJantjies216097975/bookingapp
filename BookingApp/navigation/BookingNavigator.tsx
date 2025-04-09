import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// Import booking officer screens
import BookingDashboard from '../screens/booking/BookingDashboard';
import StaffAssignment from '../screens/booking/StaffAssignment';
import SchedulePrinting from '../screens/booking/SchedulePrinting';
import ProductionDetailsScreen from '../screens/common/ProductionDetailsScreen';
import ProductionHistoryScreen from '../screens/history/ProductionHistoryScreen';
import ProductionAnalyticsScreen from '../screens/history/ProductionAnalyticsScreen';
import PrintPreview from '../screens/booking/PrintPreview';
import IssueReporting from '../screens/operator/IssueReporting';

const Stack = createStackNavigator<RootStackParamList>();

const BookingNavigator: React.FC = () => {
  return (
    <Stack.Navigator 
      initialRouteName="BookingDashboard"
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
        name="BookingDashboard" 
        component={BookingDashboard} 
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
        name="ProductionHistory" 
        component={ProductionHistoryScreen} 
        options={{ title: 'Production History' }} 
      />
      <Stack.Screen 
        name="ProductionAnalytics" 
        component={ProductionAnalyticsScreen} 
        options={{ title: 'Analytics' }} 
      />
      <Stack.Screen 
        name="PrintPreview" 
        component={PrintPreview} 
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen 
        name="IssueReporting" 
        component={IssueReporting} 
        options={{ title: 'Report Issue' }} 
      />
    </Stack.Navigator>
  );
};

export default BookingNavigator;