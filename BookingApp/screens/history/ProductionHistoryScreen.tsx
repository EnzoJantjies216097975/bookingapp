import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput, 
  Platform, 
  Alert,
  RefreshControl
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { firestore } from '../../config/firebase';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons'
import { AuthContext } from '../../contexts/AuthContext';
import { Production, RootStackParamList, UserRole } from '../../types';

type ProductionHistoryScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductionHistory'
>;

interface ProductionHistoryScreenProps {
  navigation: ProductionHistoryScreenNavigationProp;
}

const ProductionHistoryScreen: React.FC<ProductionHistoryScreenProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Filter states
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 3))); // Default to 3 months back
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [datePickerMode, setDatePickerMode] = useState<'start' | 'end'>('start');
  
  useEffect(() => {
    if (userProfile) {
      fetchProductionHistory();
    }
  }, [userProfile, startDate, endDate, statusFilter]);
  
  const fetchProductionHistory = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      let fetchedProductions: Production[] = [];
      
      // Different queries based on user role
      if (userProfile.role === 'producer') {
        const snapshot = await getDocs(query(
          collection(firestore, 'productions'),
          where('requestedById', '==', userProfile.id),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc')
        ));
          
        fetchedProductions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
          callTime: doc.data().callTime.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Production));
      } 
      else if (userProfile.role === 'booking_officer') {
        const snapshot = await getDocs(query(
          collection(firestore, 'productions'),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc')
        ));
          
        fetchedProductions = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
          callTime: doc.data().callTime.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Production));
      } 
      else {
        // For operators, we need to fetch from different fields based on role
        fetchedProductions = await getOperatorHistory(userProfile.id, userProfile.role);
      }
      
      // Apply status filter if not "all"
      if (statusFilter !== 'all') {
        fetchedProductions = fetchedProductions.filter(prod => prod.status === statusFilter);
      }
      
      // Apply search query if present
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        fetchedProductions = fetchedProductions.filter(prod => 
          prod.name.toLowerCase().includes(query) || 
          prod.venue.toLowerCase().includes(query)
        );
      }
      
      setProductions(fetchedProductions);
    } catch (error) {
      console.error('Error fetching production history:', error);
      Alert.alert('Error', 'Failed to load production history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const getOperatorHistory = async (operatorId: string, role: UserRole): Promise<Production[]> => {
    const results: Production[] = [];
    const staffFieldMap: Partial<Record<UserRole, string>> = {
      'camera_operator': 'assignedStaff.cameraOperators',
      'sound_operator': 'assignedStaff.soundOperators',
      'lighting_operator': 'assignedStaff.lightingOperators',
      'evs_operator': 'assignedStaff.evsOperator',
      'director': 'assignedStaff.director',
      'stream_operator': 'assignedStaff.streamOperator',
      'technician': 'assignedStaff.technician',
      'electrician': 'assignedStaff.electrician'
    };
    
    const field = staffFieldMap[role];
    if (!field) return results;
    
    try {
      let snapshot;
      
      if (field.endsWith('s')) {
        // For array fields (operators with multiple staff)
        snapshot = await getDocs(query(
          collection(firestore, 'productions'),
          where(field, 'array-contains', operatorId),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc')
        ));
      } else {
        // For single value fields
        snapshot = await getDocs(query(
          collection(firestore, 'productions'),
          where(field, '==', operatorId),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          orderBy('date', 'desc')
        ));
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
    } catch (error) {
      console.error('Error fetching operator history:', error);
      return [];
    }
  };
  
  const handleShowDatePicker = (mode: 'start' | 'end') => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      if (datePickerMode === 'start') {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };
  
  const handleSearch = () => {
    fetchProductionHistory();
  };
  
  const handleProductionPress = (production: Production) => {
    navigation.navigate('ProductionHistoryDetail', { production });
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchProductionHistory();
  };
  
  const getRoleInProduction = (production: Production): string => {
    if (!userProfile) return 'Unknown';
    
    if (userProfile.role === 'producer' && production.requestedById === userProfile.id) {
      return 'Producer';
    } 
    
    if (userProfile.role === 'booking_officer' && production.processedById === userProfile.id) {
      return 'Booking Officer';
    }
    
    // For operators, determine their specific role
    const staffTypes = [
      { key: 'cameraOperators', role: 'camera_operator', name: 'Camera Operator' },
      { key: 'soundOperators', role: 'sound_operator', name: 'Sound Operator' },
      { key: 'lightingOperators', role: 'lighting_operator', name: 'Lighting Operator' },
      { key: 'evsOperator', role: 'evs_operator', name: 'EVS Operator' },
      { key: 'director', role: 'director', name: 'Director' },
      { key: 'streamOperator', role: 'stream_operator', name: 'Stream Operator' },
      { key: 'technician', role: 'technician', name: 'Technician' },
      { key: 'electrician', role: 'electrician', name: 'Electrician' }
    ];
    
    for (const type of staffTypes) {
      if (userProfile.role === type.role) {
        if (type.key.endsWith('s')) {
          // Array field
          if (production.assignedStaff[type.key]?.includes(userProfile.id)) {
            return type.name;
          }
        } else {
          // Single field
          if (production.assignedStaff[type.key] === userProfile.id) {
            return type.name;
          }
        }
      }
    }
    
    return 'Staff Member';
  };
  
  // Get status color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'requested': return '#FFC107'; // Yellow
      case 'confirmed': return '#2196F3'; // Blue
      case 'completed': return '#4CAF50'; // Green
      case 'cancelled': return '#F44336'; // Red
      case 'overtime': return '#FF9800'; // Orange
      default: return '#9E9E9E'; // Grey
    }
  };
  
  const renderProductionItem = ({ item: production }: { item: Production }) => {
    const roleInProduction = getRoleInProduction(production);
    
    return (
      <TouchableOpacity
        style={styles.productionItem}
        onPress={() => handleProductionPress(production)}
      >
        <View style={styles.productionHeader}>
          <Text style={styles.productionName}>{production.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(production.status) }]}>
            <Text style={styles.statusText}>
              {production.status.charAt(0).toUpperCase() + production.status.slice(1)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.productionDate}>
          {format(production.date, 'EEE, MMM d, yyyy')}
        </Text>
        
        <View style={styles.detailsRow}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.detailText}>{production.venue}</Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.detailText}>
            {format(production.startTime, 'h:mm a')} - {format(production.endTime, 'h:mm a')}
          </Text>
        </View>
        
        <View style={styles.detailsRow}>
          <Icon name="person" size={16} color="#666" />
          <Text style={styles.detailText}>Your Role: {roleInProduction}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.filtersContainer}>
        <View style={styles.dateFilters}>
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => handleShowDatePicker('start')}
          >
            <Text style={styles.dateButtonLabel}>From:</Text>
            <Text>{format(startDate, 'MMM d, yyyy')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateButton} 
            onPress={() => handleShowDatePicker('end')}
          >
            <Text style={styles.dateButtonLabel}>To:</Text>
            <Text>{format(endDate, 'MMM d, yyyy')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statusFilter}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={statusFilter}
              onValueChange={value => setStatusFilter(value)}
              style={styles.picker}
            >
              <Picker.Item label="All" value="all" />
              <Picker.Item label="Requested" value="requested" />
              <Picker.Item label="Confirmed" value="confirmed" />
              <Picker.Item label="Completed" value="completed" />
              <Picker.Item label="Cancelled" value="cancelled" />
              <Picker.Item label="Overtime" value="overtime" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search productions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Icon name="search" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={datePickerMode === 'start' ? startDate : endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : productions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="event-busy" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No production history found</Text>
          <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
        </View>
      ) : (
        <FlatList
          data={productions}
          renderItem={renderProductionItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {userProfile?.role === 'booking_officer' && (
        <TouchableOpacity
          style={styles.analyticsButton}
          onPress={() => navigation.navigate('ProductionAnalytics')}
        >
          <Icon name="insights" size={24} color="#fff" />
          <Text style={styles.analyticsButtonText}>Analytics</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filtersContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    flex: 0.48,
  },
  dateButtonLabel: {
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 60,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    height: 40,
    justifyContent: 'center',
  },
  picker: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007bff',
    padding: 8,
    borderRadius: 4,
  },
  list: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productionItem: {
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
  productionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productionName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  productionDate: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    color: '#333',
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
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  analyticsButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#673AB7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  analyticsButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default ProductionHistoryScreen;