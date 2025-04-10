import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  useWindowDimensions
} from 'react-native';
import { CalendarList, Calendar as RNCalendar, DateData } from 'react-native-calendars';
import { format, parseISO, addDays, startOfDay, endOfDay, isSameDay } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { firestore } from '../../config/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { Production } from '../../types';
import ProductionCard from '../../components/common/ProductionCard';

type MarkedDates = {
  [date: string]: {
    marked: boolean;
    dotColor?: string;
    selected?: boolean;
    selectedColor?: string;
  };
};

interface CalendarData {
  [date: string]: Production[];
}

const BookingOfficerCalendar: React.FC = () => {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  
  useEffect(() => {
    fetchProductionData();
  }, []);
  
  const fetchProductionData = async () => {
    setLoading(true);
    try {
      // Fetch productions for the next 6 months
      const startDate = new Date();
      const endDate = addDays(startDate, 180); // 6 months ahead
      
      const productionsRef = collection(firestore, 'productions');
      const q = query(
        productionsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate))
      );
      
      const snapshot = await getDocs(q);
      
      const newCalendarData: CalendarData = {};
      const newMarkedDates: MarkedDates = {};
      
      snapshot.docs.forEach(doc => {
        const production = {
          id: doc.id,
          ...doc.data(),
          date: doc.data().date.toDate(),
          startTime: doc.data().startTime.toDate(),
          endTime: doc.data().endTime.toDate(),
          callTime: doc.data().callTime.toDate(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        } as Production;
        
        const dateStr = format(production.date, 'yyyy-MM-dd');
        
        // Group productions by date
        if (!newCalendarData[dateStr]) {
          newCalendarData[dateStr] = [];
        }
        newCalendarData[dateStr].push(production);
        
        // Mark dates with productions
        const statusColor = getStatusColor(production.status);
        newMarkedDates[dateStr] = {
          marked: true,
          dotColor: statusColor
        };
      });
      
      // Add current date selection
      const todayStr = format(selectedDate, 'yyyy-MM-dd');
      newMarkedDates[todayStr] = {
        ...newMarkedDates[todayStr],
        selected: true,
        selectedColor: '#007bff'
      };
      
      setCalendarData(newCalendarData);
      setMarkedDates(newMarkedDates);
    } catch (error) {
      console.error('Error fetching production data:', error);
      Alert.alert('Error', 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };
  
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
  
  const handleDateSelect = (day: DateData) => {
    const selectedDateObj = parseISO(day.dateString);
    setSelectedDate(selectedDateObj);
    
    // Update marked dates
    const newMarkedDates = { ...markedDates };
    
    // Remove selection from previous date
    Object.keys(newMarkedDates).forEach(dateKey => {
      if (newMarkedDates[dateKey].selected) {
        newMarkedDates[dateKey] = {
          ...newMarkedDates[dateKey],
          selected: false
        };
      }
    });
    
    // Add selection to new date
    newMarkedDates[day.dateString] = {
      ...newMarkedDates[day.dateString],
      marked: newMarkedDates[day.dateString]?.marked || false,
      dotColor: newMarkedDates[day.dateString]?.dotColor,
      selected: true,
      selectedColor: '#007bff'
    };
    
    setMarkedDates(newMarkedDates);
  };
  
  const getSelectedDateProductions = (): Production[] => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return calendarData[dateStr] || [];
  };
  
  const renderProduction = ({ item }: { item: Production }) => (
    <ProductionCard
      production={item}
      onPress={() => navigation.navigate('ProductionDetails' as never, { productionId: item.id } as never)}
    />
  );
  
  const renderEmptyDate = () => (
    <View style={styles.emptyDate}>
      <Icon name="event-busy" size={48} color="#ddd" />
      <Text style={styles.emptyDateText}>No productions scheduled</Text>
    </View>
  );
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'month' ? 'agenda' : 'month');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Production Calendar</Text>
        <TouchableOpacity onPress={toggleViewMode} style={styles.viewModeButton}>
          <Icon 
            name={viewMode === 'month' ? 'view-agenda' : 'calendar-month'} 
            size={24} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading production data...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {viewMode === 'month' ? (
            <RNCalendar
              markingType="dot"
              markedDates={markedDates}
              onDayPress={handleDateSelect}
              enableSwipeMonths
              theme={{
                todayTextColor: '#007bff',
                selectedDayBackgroundColor: '#007bff',
                selectedDayTextColor: '#fff',
                arrowColor: '#007bff',
                monthTextColor: '#333',
                textMonthFontWeight: 'bold',
                textDayFontSize: 14,
                textMonthFontSize: 16,
              }}
            />
          ) : (
            <CalendarList
              horizontal
              pagingEnabled
              calendarWidth={width}
              markingType="dot"
              markedDates={markedDates}
              onDayPress={handleDateSelect}
              theme={{
                todayTextColor: '#007bff',
                selectedDayBackgroundColor: '#007bff',
                selectedDayTextColor: '#fff',
                arrowColor: '#007bff',
                monthTextColor: '#333',
                textMonthFontWeight: 'bold',
                textDayFontSize: 14,
                textMonthFontSize: 16,
              }}
            />
          )}
          
          <View style={styles.selectedDateContainer}>
            <Text style={styles.selectedDateTitle}>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Text>
            <View style={styles.productionsContainer}>
              {getSelectedDateProductions().length > 0 ? (
                <FlatList
                  data={getSelectedDateProductions()}
                  renderItem={renderProduction}
                  keyExtractor={item => item.id}
                  contentContainerStyle={styles.productionsList}
                />
              ) : (
                renderEmptyDate()
              )}
            </View>
          </View>
        </View>
      )}
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => navigation.navigate('NewProductionRequest' as never)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.refreshButton}
        onPress={fetchProductionData}
      >
        <Icon name="refresh" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewModeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  selectedDateContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  productionsContainer: {
    flex: 1,
  },
  productionsList: {
    paddingBottom: 80,
  },
  emptyDate: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyDateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshButton: {
    position: 'absolute',
    right: 20,
    bottom: 84,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default BookingOfficerCalendar;