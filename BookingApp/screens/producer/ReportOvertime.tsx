import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { AuthContext } from '../../contexts/AuthContext';
import { getProductionById, reportProductionOvertime } from '../../api/productions';
import { RootStackParamList, Production } from '../../types';

type ReportOvertimeNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ReportOvertime'
>;

type ReportOvertimeRouteProp = RouteProp<
  RootStackParamList,
  'ReportOvertime'
>;

interface ReportOvertimeProps {
  navigation: ReportOvertimeNavigationProp;
  route: ReportOvertimeRouteProp;
}

const ReportOvertime: React.FC<ReportOvertimeProps> = ({ navigation, route }) => {
  const { productionId } = route.params;
  const { userProfile } = useContext(AuthContext);
  
  const [production, setProduction] = useState<Production | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  const [actualEndTime, setActualEndTime] = useState<Date>(new Date());
  const [overtimeReason, setOvertimeReason] = useState<string>('');
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  
  useEffect(() => {
    fetchProductionDetails();
  }, []);
  
  const fetchProductionDetails = async () => {
    try {
      const productionData = await getProductionById(productionId);
      if (!productionData) {
        Alert.alert('Error', 'Production not found');
        navigation.goBack();
        return;
      }
      
      setProduction(productionData);
      
      // Initialize actual end time to current time if it's after the scheduled end time,
      // otherwise use the scheduled end time
      const now = new Date();
      if (now > productionData.endTime) {
        setActualEndTime(now);
      } else {
        setActualEndTime(new Date(productionData.endTime));
      }
    } catch (error) {
      console.error('Error fetching production details:', error);
      Alert.alert('Error', 'Failed to load production details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setActualEndTime(selectedTime);
    }
  };
  
  const handleSubmit = async () => {
    if (!production || !userProfile) {
      Alert.alert('Error', 'Missing production or user data');
      return;
    }
    
    if (!overtimeReason.trim()) {
      Alert.alert('Missing Information', 'Please provide a reason for the overtime');
      return;
    }
    
    // Validate the actual end time is after the scheduled end time
    if (actualEndTime <= production.endTime) {
      Alert.alert('Invalid Time', 'Actual end time must be after the scheduled end time');
      return;
    }
    
    setSubmitting(true);
    try {
      await reportProductionOvertime({
        productionId,
        overtimeReason: overtimeReason.trim(),
        actualEndTime
      });
      
      Alert.alert(
        'Overtime Reported',
        'The overtime has been reported successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error reporting overtime:', error);
      Alert.alert('Error', 'Failed to report overtime. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loaderText}>Loading production details...</Text>
      </View>
    );
  }
  
  if (!production) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Production not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Report Overtime</Text>
        
        <View style={styles.productionInfo}>
          <Text style={styles.productionName}>{production.name}</Text>
          <Text style={styles.productionDate}>
            {format(production.date, 'EEEE, MMMM d, yyyy')}
          </Text>
          <View style={styles.timeRow}>
            <Text style={styles.scheduledTimeLabel}>Scheduled:</Text>
            <Text style={styles.scheduledTime}>
              {format(production.startTime, 'h:mm a')} - {format(production.endTime, 'h:mm a')}
            </Text>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Actual End Time *</Text>
          <TouchableOpacity
            style={styles.timeInput}
            onPress={() => setShowTimePicker(true)}
          >
            <Text>{format(actualEndTime, 'h:mm a')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason for Overtime *</Text>
          <TextInput
            style={styles.reasonInput}
            value={overtimeReason}
            onChangeText={setOvertimeReason}
            placeholder="Please explain why the production went overtime..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Overtime Report</Text>
          )}
        </TouchableOpacity>
      </View>
      
      {showTimePicker && (
        <DateTimePicker
          value={actualEndTime}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={handleTimeChange}
          minimumDate={production.endTime}
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
    marginBottom: 20,
    textAlign: 'center',
  },
  productionInfo: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  productionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productionDate: {
    fontSize: 16,
    color: '#555',
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduledTimeLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    color: '#555',
  },
  scheduledTime: {
    color: '#555',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  timeInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reasonInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#ff9800',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 16,
    color: '#555',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ReportOvertime;