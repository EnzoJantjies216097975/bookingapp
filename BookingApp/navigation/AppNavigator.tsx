import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import LoadingScreen from '../screens/common/LoadingScreen';
import { RootStackParamList } from '../types';

// Import navigators
import AuthNavigator from './AuthNavigator';
import BookingNavigator from './BookingNavigator';
import ProducerNavigator from './ProducerNavigator';
import OperatorNavigator from './OperatorNavigator';

const Stack = createStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { currentUser, userRole, loading } = useContext(AuthContext);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {!currentUser ? (
        <AuthNavigator />
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userRole === 'booking_officer' && (
            <Stack.Screen name="BookingFlow" component={BookingNavigator} />
          )}
          {userRole === 'producer' && (
            <Stack.Screen name="ProducerFlow" component={ProducerNavigator} />
          )}
          {userRole !== 'booking_officer' && userRole !== 'producer' && (
            <Stack.Screen name="OperatorFlow" component={OperatorNavigator} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;