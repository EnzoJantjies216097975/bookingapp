import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { Production, RootStackParamList, UserRole } from '../../types';
import ProductionCard from '../../components/common/ProductionCard';

type OperatorScheduleNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OperatorSchedule'
>;

interface OperatorScheduleProps {
  navigation: OperatorScheduleNavigationProp;
}

const OperatorSchedule: React.FC<OperatorScheduleProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<'day' | 'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  useEffect(() => {
    if (userProfile) {
      fetchSchedule();
    }
  }, [userProfile, dateFilter, selectedDate]);
  
  const fetchSchedule = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      // Calculate date range based on filter
      let startDate: Date, endDate: Date;
      
      if (dateFilter === 'day') {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      } else if (dateFilter === 'week') {
        startDate = startOfWeek(selectedDate);
        endDate = endOfWeek(selectedDate);
      } else { // month
        startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
      }
      
      // Determine which field to query based on user role
      const fieldMap: Record<UserRole, string> = {
        'camera_operator': 'assignedStaff.cameraOperators',
        'sound_operator': 'assignedStaff.soundOperators',
        'lighting_operator': 'assignedStaff.lightingOperators',
        'evs_operator': 'assignedStaff.evsOperator',
        'director': 'assignedStaff.director',
        'stream_operator': 'assignedStaff.streamOperator',
        'technician': 'assignedStaff.technician',
        'electrician': 'assignedStaff.electrician',
        'producer': 'requestedById',
        'booking_officer': 'processedById'
      };

      const field = fieldMap[userProfile.role];
      
      // Execute the appropriate query
      let snapshot;
      if (field.endsWith('s')) {
        // Array fields (for operators with multiple assignments)
        snapshot = await getDocs(query(
          collection(firestore, 'productions'),
          where(field, 'array-contains', userProfile.id),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          where('status', '==', 'confirmed'),
          orderBy('date'),
          orderBy('startTime')
        ));
      } else {
        // Single value fields
        snapshot = await getDocs(query(
          collection(firestore, 'productions'),
          where(field, '==', userProfile.id),
          where('date', '>=', Timestamp.fromDate(startDate)),
          where('date', '<=', Timestamp.fromDate(endDate)),
          where('status', '==', 'confirmed'),
          orderBy('date'),
          orderBy('startTime')
        ));
      }
      
      const fetchedProductions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      setProductions(fetchedProductions);
    } catch (error) {
      console.error('Error fetching schedule:', error);
      Alert.alert('Error', 'Failed to load your schedule');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const changeDate = (days: number) => {
    const newDate = days > 0 ? addDays(selectedDate, days) : subDays(selectedDate, Math.abs(days));
    setSelectedDate(newDate);
  };
  
  const getDateRangeText = () => {
    if (dateFilter === 'day') {
      return format(selectedDate, 'EEEE, MMMM d, yyyy');
    } else if (dateFilter === 'week') {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    } else {
      return format(selectedDate, 'MMMM yyyy');
    }
  };
  
  const handleReportIssue = (production: Production) => {
    navigation.navigate('IssueReporting', { productionId: production.id });
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.dateFilterContainer}>
        <View style={styles.filterButtons}>
          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'day' && styles.activeFilter]}
            onPress={() => setDateFilter('day')}
          >
            <Text style={[styles.filterButtonText, dateFilter === 'day' && styles.activeFilterText]}>
              Day
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'week' && styles.activeFilter]}
            onPress={() => setDateFilter('week')}
          >
            <Text style={[styles.filterButtonText, dateFilter === 'week' && styles.activeFilterText]}>
              Week
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, dateFilter === 'month' && styles.activeFilter]}
            onPress={() => setDateFilter('month')}
          >
            <Text style={[styles.filterButtonText, dateFilter === 'month' && styles.activeFilterText]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.dateNavigator}>
          <TouchableOpacity 
            style={styles.dateNavButton}
            onPress={() => changeDate(-1)}
          >
            <Icon name="chevron-left" size={24} color="#007bff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.dateDisplay}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{getDateRangeText()}</Text>
            <Icon name="calendar-today" size={18} color="#007bff" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dateNavButton}
            onPress={() => changeDate(1)}
          >
            <Icon name="chevron-right" size={24} color="#007bff" />
          </TouchableOpacity>
        </View>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : productions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="event-busy" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No productions scheduled</Text>
          <Text style={styles.emptySubtext}>During the selected time period</Text>
        </View>
      ) : (
        <FlatList
          data={productions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ProductionCard
              production={item}
              onPress={() => navigation.navigate('ProductionDetails', { productionId: item.id })}
              rightComponent={
                <TouchableOpacity
                  style={styles.issueButton}
                  onPress={() => handleReportIssue(item)}
                >
                  <Icon name="report-problem" size={20} color="#fff" />
                </TouchableOpacity>
              }
            />
          )}
          contentContainerStyle={styles.productionsList}
        />
      )}
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
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
  dateFilterContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#007bff',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  activeFilter: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    color: '#007bff',
    fontWeight: '500',
  },
  activeFilterText: {
    color: 'white',
  },
  dateNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateNavButton: {
    padding: 8,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    marginRight: 8,
  },
  productionsList: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  issueButton: {
    backgroundColor: '#dc3545',
    padding: 8,
    borderRadius: 4,
  },
});

export default OperatorSchedule;