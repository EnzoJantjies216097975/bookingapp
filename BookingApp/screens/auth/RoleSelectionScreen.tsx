import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../contexts/AuthContext';
import { RoleContext } from '../contexts/RoleContext';
import { UserRole } from '../types';

// Get icon for each role
const getRoleIcon = (role: UserRole): string => {
  switch (role) {
    case 'camera_operator':
      return 'videocam';
    case 'sound_operator':
      return 'mic';
    case 'lighting_operator':
      return 'wb-sunny';
    case 'evs_operator':
      return 'tv';
    case 'director':
      return 'directions';
    case 'stream_operator':
      return 'stream';
    case 'technician':
      return 'build';
    case 'electrician':
      return 'electric-bolt';
    case 'producer':
      return 'live-tv';
    case 'booking_officer':
      return 'event-available';
    default:
      return 'person';
  }
};

// Format role name for display
const formatRoleName = (role: UserRole): string => {
  return role
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get role description
const getRoleDescription = (role: UserRole): string => {
  switch (role) {
    case 'camera_operator':
      return 'Operate cameras and record footage for productions';
    case 'sound_operator':
      return 'Manage audio setup and recording for productions';
    case 'lighting_operator':
      return 'Control lighting setup and effects for productions';
    case 'evs_operator':
      return 'Handle slow-motion replays and video editing';
    case 'director':
      return 'Direct the production and coordinate the crew';
    case 'stream_operator':
      return 'Manage live streaming setup and broadcast';
    case 'technician':
      return 'Provide technical support for productions';
    case 'electrician':
      return 'Handle electrical setup and power management';
    case 'producer':
      return 'Plan and manage production logistics';
    case 'booking_officer':
      return 'Schedule productions and manage resources';
    default:
      return 'Staff member for TV productions';
  }
};

// Get background color for role
const getRoleColor = (role: UserRole): string => {
  // Producers
  if (role === 'producer') return '#28a745';
  if (role === 'booking_officer') return '#007bff';
  
  // Operators
  if (['camera_operator', 'sound_operator', 'lighting_operator'].includes(role)) return '#17a2b8';
  
  // Others
  return '#6c757d';
};

const RoleSelectionScreen: React.FC = () => {
  const { userProfile } = useContext(AuthContext);
  const { setActiveRole } = useContext(RoleContext);
  const navigation = useNavigation();
  
  const handleRoleSelect = (role: UserRole) => {
    // Set active role in context
    setActiveRole(role);
    
    // Navigate to the appropriate flow
    switch(role) {
      case 'booking_officer':
        navigation.navigate('BookingFlow' as never);
        break;
      case 'producer':
        navigation.navigate('ProducerFlow' as never);
        break;
      default:
        navigation.navigate('OperatorFlow' as never);
        break;
    }
  };
  
  // Group roles by type for better organization
  const getRoleGroups = () => {
    if (!userProfile) return [];
    
    const bookingRoles = userProfile.roles.filter(r => r === 'booking_officer');
    const producerRoles = userProfile.roles.filter(r => r === 'producer');
    const operatorRoles = userProfile.roles.filter(r => 
      r !== 'booking_officer' && r !== 'producer'
    );
    
    const groups = [];
    
    if (bookingRoles.length > 0) {
      groups.push({
        title: 'Booking Officer',
        roles: bookingRoles
      });
    }
    
    if (producerRoles.length > 0) {
      groups.push({
        title: 'Producer',
        roles: producerRoles
      });
    }
    
    if (operatorRoles.length > 0) {
      groups.push({
        title: 'Operator',
        roles: operatorRoles
      });
    }
    
    return groups;
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {userProfile?.profilePicture ? (
            <Image 
              source={{ uri: userProfile.profilePicture }} 
              style={styles.profilePicture} 
            />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Icon name="person" size={40} color="#fff" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userProfile?.name || 'User'}</Text>
            <Text style={styles.profileEmail}>{userProfile?.email || ''}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>
          Choose how you want to use the app based on your role
        </Text>
        
        {getRoleGroups().map((group, index) => (
          <View key={index} style={styles.roleGroup}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            
            {group.roles.map(role => (
              <TouchableOpacity
                key={role}
                style={styles.roleCard}
                onPress={() => handleRoleSelect(role)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: getRoleColor(role) }]}>
                  <Icon name={getRoleIcon(role)} size={28} color="#fff" />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={styles.roleName}>{formatRoleName(role)}</Text>
                  <Text style={styles.roleDescription}>{getRoleDescription(role)}</Text>
                </View>
                <Icon name="chevron-right" size={24} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  roleGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  roleCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default RoleSelectionScreen;