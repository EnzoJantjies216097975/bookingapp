import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { firestore, functions } from '../../config/firebase';
import { httpsCallable } from 'firebase/functions';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Production, RootStackParamList } from '../../types';

type SchedulePrintingNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SchedulePrinting'
>;

interface SchedulePrintingProps {
  navigation: SchedulePrintingNavigationProp;
  route: {
    params?: {
      productionId?: string;
    }
  }
}

const SchedulePrinting: React.FC<SchedulePrintingProps> = ({ navigation, route }) => {
  const [printType, setPrintType] = useState<'single' | 'daily' | 'weekly'>('daily');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(null);
  const [productions, setProductions] = useState<Production[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  
  useEffect(() => {
    const productionId = route.params?.productionId;
    if (productionId) {
      setPrintType('single');
      fetchProductionById(productionId);
    } else {
      fetchProductionsByDate();
    }
  }, [route.params?.productionId]);
  
  useEffect(() => {
    if (printType !== 'single') {
      setSelectedProduction(null);
      if (printType === 'daily') {
        fetchProductionsByDate();
      }
    }
  }, [printType, selectedDate]);
  
  const fetchProductionById = async (productionId: string) => {
    setLoading(true);
    try {
      const docRef = doc(firestore, 'productions', productionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const productionData = {
          id: docSnap.id,
          ...docSnap.data(),
          date: docSnap.data().date.toDate(),
          startTime: docSnap.data().startTime.toDate(),
          endTime: docSnap.data().endTime.toDate(),
          callTime: docSnap.data().callTime.toDate(),
          createdAt: docSnap.data().createdAt?.toDate() || new Date()
        } as Production;
        
        setSelectedProduction(productionData);
        setSelectedDate(productionData.date);
      }
    } catch (error) {
      console.error('Error fetching production:', error);
      Alert.alert('Error', 'Failed to load production details');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProductionsByDate = async () => {
    setLoading(true);
    try {
      let startDate: Date, endDate: Date;
      
      if (printType === 'daily') {
        startDate = new Date(selectedDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(selectedDate);
        endDate.setHours(23, 59, 59, 999);
      } else { // weekly
        startDate = startOfWeek(selectedDate);
        endDate = endOfWeek(selectedDate);
      }
      
      const productionsRef = collection(firestore, 'productions');
      const q = query(
        productionsRef,
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        where('status', '!=', 'cancelled'),
        orderBy('date'),
        orderBy('startTime')
      );
      
      const snapshot = await getDocs(q);
      const productionsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        callTime: doc.data().callTime.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Production));
      
      setProductions(productionsList);
    } catch (error) {
      console.error('Error fetching productions:', error);
      Alert.alert('Error', 'Failed to load productions');
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
  
  const handlePrint = async () => {
    try {
      setLoading(true);
      const generateSchedulePDF = httpsCallable(functions, 'generateSchedulePDF');
      
      let result;
      if (printType === 'single') {
        if (!selectedProduction) {
          Alert.alert('Error', 'Please select a production');
          setLoading(false);
          return;
        }
        result = await generateSchedulePDF({
          type: 'single',
          productionId: selectedProduction.id
        });
      } else if (printType === 'daily') {
        result = await generateSchedulePDF({
          type: 'daily',
          date: selectedDate.toISOString()
        });
      } else { // weekly
        const weekStart = startOfWeek(selectedDate);
        result = await generateSchedulePDF({
          type: 'weekly',
          startOfWeek: weekStart.toISOString()
        });
      }
      
      if (result.data.format === 'html') {
        let title = '';
        if (printType === 'single') {
          title = `${selectedProduction?.name} - Schedule`;
        } else if (printType === 'daily') {
          title = `Daily Schedule - ${format(selectedDate, 'MMM d, yyyy')}`;
        } else {
          const weekStart = startOfWeek(selectedDate);
          const weekEnd = endOfWeek(selectedDate);
          title = `Weekly Schedule - ${format(weekStart, 'MMM d')} to ${format(weekEnd, 'MMM d, yyyy')}`;
        }
        
        navigation.navigate('PrintPreview', { 
          html: result.data.content,
          title
        });
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate schedule');
    } finally {
      setLoading(false);
    }
  };
  
  const renderProductionItem = ({ item }: { item: Production }) => (
    <TouchableOpacity
      style={[
        styles.productionItem,
        selectedProduction?.id === item.id && styles.selectedProductionItem
      ]}
      onPress={() => setSelectedProduction(item)}
    >
      <View style={styles.productionItemHeader}>
        <Text style={styles.productionName}>{item.name}</Text>
        <Text style={styles.productionVenue}>{item.venue}</Text>
      </View>
      <Text style={styles.productionTime}>
        {format(item.date, 'MMM d')} • {format(item.startTime, 'h:mm a')} - {format(item.endTime, 'h:mm a')}
      </Text>
      
      {selectedProduction?.id === item.id && (
        <View style={styles.selectedIndicator}>
          <Icon name="check-circle" size={20} color="#28a745" />
        </View>
      )}
    </TouchableOpacity>
  );
  
  const getDateDisplay = () => {
    if (printType === 'daily') {
      return format(selectedDate, 'EEEE, MMMM d, yyyy');
    } else if (printType === 'weekly') {
      const weekStart = startOfWeek(selectedDate);
      const weekEnd = endOfWeek(selectedDate);
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return '';
  };
  
  const renderDateSelector = () => {
    if (printType === 'single') {
      return (
        <View style={styles.singleProductionContainer}>
          <Text style={styles.sectionTitle}>Select a Production</Text>
          {selectedProduction ? (
            <View style={styles.selectedProductionSummary}>
              <Text style={styles.selectedProductionName}>{selectedProduction.name}</Text>
              <Text style={styles.selectedProductionDetails}>
                {format(selectedProduction.date, 'EEEE, MMMM d, yyyy')}
              </Text>
              <Text style={styles.selectedProductionDetails}>
                {selectedProduction.venue} • {format(selectedProduction.startTime, 'h:mm a')} - {format(selectedProduction.endTime, 'h:mm a')}
              </Text>
              
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setSelectedProduction(null)}
              >
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={productions}
              renderItem={renderProductionItem}
              keyExtractor={item => item.id}
              style={styles.productionsList}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyList}>
                  <Text style={styles.emptyListText}>No productions found</Text>
                  <TouchableOpacity
                    style={styles.fetchButton}
                    onPress={fetchProductionsByDate}
                  >
                    <Text style={styles.fetchButtonText}>Fetch Recent Productions</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.dateContainer}>
          <Text style={styles.sectionTitle}>
            {printType === 'daily' ? 'Select a Date' : 'Select a Week'}
          </Text>
          <TouchableOpacity
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateText}>{getDateDisplay()}</Text>
            <Icon name="calendar-today" size={20} color="#007bff" />
          </TouchableOpacity>
          
          {printType === 'daily' && productions.length > 0 && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Productions on this date:</Text>
              {productions.map(prod => (
                <Text key={prod.id} style={styles.summaryItem}>
                  {prod.name} ({format(prod.startTime, 'h:mm a')} - {format(prod.endTime, 'h:mm a')})
                </Text>
              ))}
            </View>
          )}
          
          {printType === 'weekly' && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchProductionsByDate}
            >
              <Icon name="refresh" size={20} color="#007bff" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Print Schedule</Text>
        
        <View style={styles.printTypeContainer}>
          <Text style={styles.sectionTitle}>What do you want to print?</Text>
          <View style={styles.printTypeButtons}>
            <TouchableOpacity
              style={[styles.printTypeButton, printType === 'single' && styles.selectedPrintType]}
              onPress={() => setPrintType('single')}
            >
              <Icon 
                name="description" 
                size={24} 
                color={printType === 'single' ? 'white' : '#007bff'} 
              />
              <Text 
                style={[
                  styles.printTypeText, 
                  printType === 'single' && styles.selectedPrintTypeText
                ]}
              >
                Single Production
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.printTypeButton, printType === 'daily' && styles.selectedPrintType]}
              onPress={() => setPrintType('daily')}
            >
              <Icon 
                name="today" 
                size={24} 
                color={printType === 'daily' ? 'white' : '#007bff'} 
              />
              <Text 
                style={[
                  styles.printTypeText, 
                  printType === 'daily' && styles.selectedPrintTypeText
                ]}
              >
                Daily Schedule
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.printTypeButton, printType === 'weekly' && styles.selectedPrintType]}
              onPress={() => setPrintType('weekly')}
            >
              <Icon 
                name="date-range" 
                size={24} 
                color={printType === 'weekly' ? 'white' : '#007bff'} 
              />
              <Text 
                style={[
                  styles.printTypeText, 
                  printType === 'weekly' && styles.selectedPrintTypeText
                ]}
              >
                Weekly Schedule
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {renderDateSelector()}
        
        <TouchableOpacity
          style={styles.printButton}
          onPress={handlePrint}
          disabled={loading || (printType === 'single' && !selectedProduction)}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Icon name="print" size={24} color="white" />
              <Text style={styles.printButtonText}>Generate Schedule</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  printTypeContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  printTypeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  printTypeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007bff',
    marginHorizontal: 4,
  },
  selectedPrintType: {
    backgroundColor: '#007bff',
  },
  printTypeText: {
    marginTop: 4,
    color: '#007bff',
    fontWeight: '500',
  },
  selectedPrintTypeText: {
    color: 'white',
  },
  dateContainer: {
    marginBottom: 24,
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    fontSize: 16,
  },
  singleProductionContainer: {
    marginBottom: 24,
  },
  productionsList: {
    maxHeight: 300,
  },
  productionItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedProductionItem: {
    borderColor: '#28a745',
    borderWidth: 2,
  },
  productionItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productionName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  productionVenue: {
    fontSize: 14,
    color: '#555',
  },
  productionTime: {
    fontSize: 14,
    color: '#555',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectedProductionSummary: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#28a745',
  },
  selectedProductionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  selectedProductionDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  changeButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  changeButtonText: {
    color: '#007bff',
    fontWeight: '500',
  },
  emptyList: {
    padding: 16,
    alignItems: 'center',
  },
  emptyListText: {
    marginBottom: 16,
    color: '#666',
    fontSize: 16,
  },
  fetchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  fetchButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  summaryContainer: {
    marginTop: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryItem: {
    marginBottom: 4,
    color: '#555',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    alignSelf: 'center',
  },
  refreshButtonText: {
    color: '#007bff',
    marginLeft: 4,
  },
  printButton: {
    backgroundColor: '#28a745',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  printButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default SchedulePrinting;