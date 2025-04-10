import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';
import { RoleContext } from '../contexts/RoleContext';
import LoadingScreen from '../screens/common/LoadingScreen';

// Import navigators
import AuthNavigator from './AuthNavigator';
import BookingNavigator from './BookingNavigator';
import ProducerNavigator from './ProducerNavigator';
import OperatorNavigator from './OperatorNavigator';

// Import profile setup screens
import ProfileSetupScreen from '../screens/auth/ProfileSetupScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { currentUser, userProfile, loading: authLoading } = useContext(AuthContext);
  const { activeRole, loading: roleLoading } = useContext(RoleContext);
  
  const loading = authLoading || roleLoading;

  if (loading) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <AuthNavigator />;
  }
  
  // If profile is not complete, show profile setup
  if (userProfile && !userProfile.profileComplete) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  // If user has multiple roles and hasn't selected one yet
  if (userProfile && userProfile.roles.length > 1 && !activeRole) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }
  
  // Determine which role to use - either the selected active role or the only available role
  const currentRole = activeRole || (userProfile ? userProfile.roles[0] : null);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {currentRole === 'booking_officer' && (
          <Stack.Screen name="BookingFlow" component={BookingNavigator} />
        )}
        {currentRole === 'producer' && (
          <Stack.Screen name="ProducerFlow" component={ProducerNavigator} />
        )}
        {currentRole && currentRole !== 'booking_officer' && currentRole !== 'producer' && (
          <Stack.Screen name="OperatorFlow" component={OperatorNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;