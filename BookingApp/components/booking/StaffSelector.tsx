import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore, functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Production, User, UserRole } from '../../types';

interface StaffSelectorProps {
  production: Production;
  staffType: keyof Production['assignedStaff'];
  roleTitle: string;
  onStaffSelected: (staffIds: string[] | string) => void;
  isLoading?: boolean;
  selectedStaff?: string[] | string;
  multiple?: boolean;
}

const StaffSelector: React.FC<StaffSelectorProps> = ({
  production,
  staffType,
  roleTitle,
  onStaffSelected,
  isLoading = false,
  selectedStaff = [],
  multiple = false
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Determine which user role to filter by
  const getRoleFromStaffType = (type: string): UserRole => {
    switch (type) {
      case 'cameraOperators': return 'camera_operator';
      case 'soundOperators': return 'sound_operator';
      case 'lightingOperators': return 'lighting_operator';
      case 'evsOperator': return 'evs_operator';
      case 'director': return 'director';
      case 'streamOperator': return 'stream_operator';
      case 'technician': return 'technician';
      case 'electrician': return 'electrician';
      default: return 'camera_operator';
    }
  };
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    try {
      const role = getRoleFromStaffType(staffType);
      
      const snapshot = await getDocs(
        query(collection(firestore, 'users'), where('role', '==', role))
      );
      
      const userData: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      setUsers(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load staff members');
      setLoading(false);
    }
  };
  
  const checkAvailability = async (userId: string): Promise<boolean> => {
    try {
      const checkStaffAvailability = httpsCallable(functions, 'checkStaffAvailability');
      const result = await checkStaffAvailability({
        staffId: userId,
        productionDate: production.date.toISOString(),
        startTime: production.startTime.toISOString(),
        endTime: production.endTime.toISOString(),
        currentProductionId: production.id
      });
      
      return (result.data as any).available;
    } catch (error) {
      console.error('Error checking staff availability:', error);
      return false;
    }
  };
  
  const handleSelectStaff = async (user: User) => {
    if (isLoading) return;
    
    // For single selection
    if (!multiple) {
      if (selectedStaff === user.id) {
        // Deselect
        onStaffSelected('');
        return;
      }
      
      // Check availability before selecting
      const isAvailable = await checkAvailability(user.id);
      
      if (!isAvailable) {
        Alert.alert(
          'Scheduling Conflict',
          `${user.name} is already assigned to another production during this time. Are you sure you want to assign them?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Assign Anyway',
              onPress: () => onStaffSelected(user.id)
            }
          ]
        );
      } else {
        onStaffSelected(user.id);
      }
    } 
    // For multiple selection
    else {
      const currentSelections = [...(selectedStaff as string[])];
      const index = currentSelections.indexOf(user.id);
      
      if (index !== -1) {
        // Deselect
        currentSelections.splice(index, 1);
        onStaffSelected(currentSelections);
        return;
      }
      
      // Check availability before selecting
      const isAvailable = await checkAvailability(user.id);
      
      if (!isAvailable) {
        Alert.alert(
          'Scheduling Conflict',
          `${user.name} is already assigned to another production during this time. Are you sure you want to assign them?`,
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Assign Anyway',
              onPress: () => {
                currentSelections.push(user.id);
                onStaffSelected(currentSelections);
              }
            }
          ]
        );
      } else {
        currentSelections.push(user.id);
        onStaffSelected(currentSelections);
      }
    }
  };
  
  const isSelected = (userId: string): boolean => {
    if (multiple) {
      return (selectedStaff as string[]).includes(userId);
    } else {
      return selectedStaff === userId;
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{roleTitle}</Text>
      
      {loading ? (
        <ActivityIndicator size="small" color="#007bff" style={styles.loader} />
      ) : users.length === 0 ? (
        <Text style={styles.emptyText}>No {roleTitle.toLowerCase()} found</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.userItem,
                isSelected(item.id) && styles.selectedUserItem,
                isLoading && styles.disabledUserItem
              ]}
              onPress={() => handleSelectStaff(item)}
              disabled={isLoading}
            >
              <View style={styles.userIconContainer}>
                {item.profilePicture ? (
                  <Image source={{ uri: item.profilePicture }} style={styles.userIcon} />
                ) : (
                  <Icon name="person" size={24} color="#fff" />
                )}
              </View>
              <Text style={styles.userName}>{item.name}</Text>
              {isSelected(item.id) && (
                <Icon name="check-circle" size={24} color="#28a745" style={styles.checkIcon} />
              )}
            </TouchableOpacity>
          )}
          style={styles.userList}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  userList: {
    maxHeight: 200,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginBottom: 8,
  },
  selectedUserItem: {
    backgroundColor: '#e8f4ff',
  },
  disabledUserItem: {
    opacity: 0.5,
  },
  userIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6c757d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userName: {
    flex: 1,
    fontSize: 16,
  },
  checkIcon: {
    marginLeft: 8,
  },
  loader: {
    marginVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
    color: '#666',
  },
});

export default StaffSelector;