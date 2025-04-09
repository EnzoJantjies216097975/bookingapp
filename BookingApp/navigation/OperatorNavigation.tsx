import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

// Import operator screens
import OperatorDashboard from '../screens/operator/OperatorDashboard';
import OperatorSchedule from '../screens/operator/OPeratorSchedule';
import IssueReporting from '../screens/operator/IssueReporting';
import ProductionDetailsScreen from '../screens/common/ProductionDetailsScreen';
import ProductionHistoryScreen from '../screens/history/ProductionHistoryScreen';

const Stack = createStackNavigator<RootStackParamList>();

const OperatorNavigator: React.FC = () => {
  return (
    <Stack.Navigator 
      initialRouteName="OperatorDashboard"
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
        name="OperatorDashboard" 
        component={OperatorDashboard} 
        options={{ title: 'Operator Dashboard' }} 
      />
      <Stack.Screen 
        name="OperatorSchedule" 
        component={OperatorSchedule} 
        options={{ title: 'My Schedule' }} 
      />
      <Stack.Screen 
        name="IssueReporting" 
        component={IssueReporting} 
        options={{ title: 'Report Issue' }} 
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
    </Stack.Navigator>
  );
};

export default OperatorNavigator;