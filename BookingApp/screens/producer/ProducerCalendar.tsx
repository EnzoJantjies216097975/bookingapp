import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { getProductionsByDateRange } from '../../api/productions';
import { Production } from '../../types';
import CalendarView from '../../components/booking/CalendarView';

type ProducerCalendarNavigationProp = StackNavigationProp<any>;

interface ProducerCalendarProps {
  navigation: ProducerCalendarNavigationProp;
}

const ProducerCalendar: React.FC<ProducerCalendarProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    if (userProfile) {
      fetchMonthProductions(currentMonth);
    }
  }, [userProfile, currentMonth]);
  
  const fetchMonthProductions = async (date: Date) => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      
      const productionsData = await getProductionsByDateRange(monthStart, monthEnd);
      
      // Filter productions by producer if needed
      const filteredProductions = productionsData.filter(prod => 
        prod.requestedById === userProfile.id
      );
      
      setProductions(filteredProductions);
    } catch (error) {
      console.error('Error fetching productions:', error);
      Alert.alert('Error', 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMonthChange = (date: Date) => {
    if (!isSameMonth(date, currentMonth)) {
      setCurrentMonth(date);
    }
  };
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    handleMonthChange(date);
  };
  
  const handleProductionPress = (production: Production) => {
    navigation.navigate('ProductionDetails', { productionId: production.id });
  };
  
  const getSelectedDateProductions = (): Production[] => {
    return productions.filter(prod => isSameDay(prod.date, selectedDate));
  };
  
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="event-busy" size={64} color="#ccc" />
      <Text style={styles.emptyText}>No productions scheduled</Text>
      <Text style={styles.emptySubtext}>
        You don't have any productions scheduled for this date
      </Text>
      <TouchableOpacity
        style={styles.newRequestButton}
        onPress={() => navigation.navigate('NewProductionRequest')}
      >
        <Text style={styles.newRequestButtonText}>Create New Request</Text>
      </TouchableOpacity>
    </View>
  );
  
  if (loading && productions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading productions...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <CalendarView
        productions={productions}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onProductionPress={handleProductionPress}
      />
      
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('NewProductionRequest')}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    marginBottom: 24,
    textAlign: 'center',
  },
  newRequestButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  newRequestButtonText: {
    color: 'white',
    fontWeight: 'bold',
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
  }
});

export default ProducerCalendar;