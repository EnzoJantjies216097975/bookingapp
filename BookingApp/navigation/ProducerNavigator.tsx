import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// Import producer screens
import ProducerDashboard from '../screens/producer/ProducerDashboard';
import NewProductionRequest from '../screens/producer/NewProductionRequest';
import ProductionDetailsScreen from '../screens/common/ProductionDetailsScreen';
import ProductionHistoryScreen from '../screens/history/ProductionHistoryScreen';
import ReportOvertime from '../screens/producer/ReportOvertime';
import IssueReporting from '../screens/operator/IssueReporting';

const Stack = createStackNavigator<RootStackParamList>();

const ProducerNavigator: React.FC = () => {
  return (
    <Stack.Navigator 
      initialRouteName="ProducerDashboard"
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
        name="ProducerDashboard" 
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
        name="ProductionHistory" 
        component={ProductionHistoryScreen} 
        options={{ title: 'Production History' }} 
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

export default ProducerNavigator;