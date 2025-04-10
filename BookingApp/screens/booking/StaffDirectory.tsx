import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import { User, UserRole } from '../../types';
import { formatRoleName } from '../../utils/formatUtils';

const StaffDirectory: React.FC = () => {
  const [staff, setStaff] = useState<User[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  useEffect(() => {
    fetchStaff();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [staff, searchQuery, roleFilter]);
  
  const fetchStaff = async () => {
    try {
      setLoading(true);
      
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);
      
      const staffData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      
      setStaff(staffData);
      setFilteredStaff(staffData);
    } catch (error) {
      console.error('Error fetching staff:', error);
      Alert.alert('Error', 'Failed to load staff directory');
    } finally {
      setLoading(false);
    }
  };
  
  const applyFilters = () => {
    let filtered = [...staff];
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.phoneNumber && user.phoneNumber.includes(query))
      );
    }
    
    setFilteredStaff(filtered);
  };
  
  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'producer':
        return '#28a745';
      case 'booking_officer':
        return '#007bff';
      case 'camera_operator':
        return '#fd7e14';
      case 'sound_operator':
        return '#6610f2';
      case 'lighting_operator':
        return '#ffc107';
      case 'evs_operator':
        return '#17a2b8';
      case 'director':
        return '#dc3545';
      case 'stream_operator':
        return '#20c997';
      case 'technician':
        return '#6c757d';
      case 'electrician':
        return '#343a40';
      default:
        return '#6c757d';
    }
  };
  
  const renderStaffItem = ({ item }: { item: User }) => {
    const roleColor = getRoleColor(item.role);
    
    return (
      <TouchableOpacity style={styles.staffCard}>
        <View style={styles.avatarContainer}>
          {item.profilePicture ? (
            <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: roleColor }]}>
              <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.staffInfo}>
          <Text style={styles.staffName}>{item.name}</Text>
          <Text style={styles.staffEmail}>{item.email}</Text>
          
          <View style={styles.roleContainer}>
            <View style={[styles.roleBadge, { backgroundColor: roleColor }]}>
              <Text style={styles.roleText}>{formatRoleName(item.role)}</Text>
            </View>
          </View>
          
          {item.phoneNumber && (
            <View style={styles.phoneContainer}>
              <Icon name="phone" size={14} color="#666" />
              <Text style={styles.phoneText}>{item.phoneNumber}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Staff Directory</Text>
      </View>
      
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
        
        <View style={styles.roleFilterContainer}>
          <Text style={styles.filterLabel}>Filter by Role:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={roleFilter}
              onValueChange={(value) => setRoleFilter(value)}
              style={styles.picker}
            >
              <Picker.Item label="All Roles" value="all" />
              <Picker.Item label="Producers" value="producer" />
              <Picker.Item label="Booking Officers" value="booking_officer" />
              <Picker.Item label="Camera Operators" value="camera_operator" />
              <Picker.Item label="Sound Operators" value="sound_operator" />
              <Picker.Item label="Lighting Operators" value="lighting_operator" />
              <Picker.Item label="EVS Operators" value="evs_operator" />
              <Picker.Item label="Directors" value="director" />
              <Picker.Item label="Stream Operators" value="stream_operator" />
              <Picker.Item label="Technicians" value="technician" />
              <Picker.Item label="Electricians" value="electrician" />
            </Picker>
          </View>
        </View>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading staff directory...</Text>
        </View>
      ) : filteredStaff.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No staff found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={filteredStaff}
          renderItem={renderStaffItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  roleFilterContainer: {
    marginTop: 8,
  },
  filterLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  pickerContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  staffCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  staffEmail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  }
});

export default StaffDirectory;