import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { createProductionRequest } from '../../api/productions';
import { RootStackParamList, Venue } from '../../types';

type NewProductionRequestNavigationProp = StackNavigationProp<
  RootStackParamList,
  'NewProductionRequest'
>;

interface NewProductionRequestProps {
  navigation: NewProductionRequestNavigationProp;
}

const NewProductionRequest: React.FC<NewProductionRequestProps> = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  
  // Form state
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date(Date.now() + 60 * 60 * 1000)); // Default 1 hour later
  const [callTime, setCallTime] = useState<Date>(new Date(Date.now() - 30 * 60 * 1000)); // Default 30 min earlier
  const [venue, setVenue] = useState<Venue>('Studio 1');
  const [locationDetails, setLocationDetails] = useState<string>('');
  const [isOutsideBroadcast, setIsOutsideBroadcast] = useState<boolean>(false);
  const [transportDetails, setTransportDetails] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [currentTimePickerMode, setCurrentTimePickerMode] = useState<'start' | 'end' | 'call'>('start');
  
  // Loading state
  const [loading, setLoading] = useState<boolean>(false);
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      
      // Adjust times to the new date
      const newStartTime = new Date(selectedDate);
      newStartTime.setHours(startTime.getHours(), startTime.getMinutes());
      setStartTime(newStartTime);
      
      const newEndTime = new Date(selectedDate);
      newEndTime.setHours(endTime.getHours(), endTime.getMinutes());
      setEndTime(newEndTime);
      
      const newCallTime = new Date(selectedDate);
      newCallTime.setHours(callTime.getHours(), callTime.getMinutes());
      setCallTime(newCallTime);
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      if (currentTimePickerMode === 'start') {
        // If start time changes, ensure end time is after it
        setStartTime(selectedTime);
        if (selectedTime >= endTime) {
          const newEndTime = new Date(selectedTime.getTime() + 60 * 60 * 1000); // 1 hour later
          setEndTime(newEndTime);
        }
      } else if (currentTimePickerMode === 'end') {
        // Ensure end time is after start time
        if (selectedTime <= startTime) {
          Alert.alert('Invalid Time', 'End time must be after start time');
        } else {
          setEndTime(selectedTime);
        }
      } else if (currentTimePickerMode === 'call') {
        setCallTime(selectedTime);
      }
    }
  };
  
  const showTimePickerFor = (mode: 'start' | 'end' | 'call') => {
    setCurrentTimePickerMode(mode);
    setShowTimePicker(true);
  };
  
  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to create a production request');
      return;
    }
    
    // Validate form
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a production name');
      return;
    }
    
    if (isOutsideBroadcast && !locationDetails.trim()) {
      Alert.alert('Missing Information', 'Please provide location details for outside broadcast');
      return;
    }
    
    // Ensure times are logical
    if (startTime >= endTime) {
      Alert.alert('Invalid Times', 'End time must be after start time');
      return;
    }
    
    // Submit the request
    setLoading(true);
    try {
      const productionData = {
        name: name.trim(),
        date,
        startTime,
        endTime,
        callTime,
        venue,
        locationDetails: locationDetails.trim(),
        isOutsideBroadcast,
        transportDetails: transportDetails.trim(),
        notes: notes.trim(),
        requestedById: userProfile.id
      };
      
      await createProductionRequest(productionData);
      
      Alert.alert(
        'Request Submitted',
        'Your production request has been submitted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error submitting production request:', error);
      Alert.alert('Error', 'Failed to submit production request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>New Production Request</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Production Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter production name"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Production Date *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{format(date, 'EEEE, MMMM d, yyyy')}</Text>
            <Icon name="calendar-today" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Time *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => showTimePickerFor('start')}
            >
              <Text>{format(startTime, 'h:mm a')}</Text>
              <Icon name="access-time" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => showTimePickerFor('end')}
            >
              <Text>{format(endTime, 'h:mm a')}</Text>
              <Icon name="access-time" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Call Time *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showTimePickerFor('call')}
          >
            <Text>{format(callTime, 'h:mm a')}</Text>
            <Icon name="access-time" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={venue}
              onValueChange={(itemValue) => setVenue(itemValue as Venue)}
              style={styles.picker}
            >
              <Picker.Item label="Studio 1" value="Studio 1" />
              <Picker.Item label="Studio 2" value="Studio 2" />
              <Picker.Item label="Studio 3" value="Studio 3" />
              <Picker.Item label="Studio 4" value="Studio 4" />
              <Picker.Item label="Location" value="Location" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Outside Broadcast?</Text>
          <Switch
            value={isOutsideBroadcast}
            onValueChange={setIsOutsideBroadcast}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isOutsideBroadcast ? '#007bff' : '#f4f3f4'}
          />
        </View>
        
        {isOutsideBroadcast && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Details *</Text>
              <TextInput
                style={styles.input}
                value={locationDetails}
                onChangeText={setLocationDetails}
                placeholder="Enter location details"
                multiline
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transport Details</Text>
              <TextInput
                style={styles.input}
                value={transportDetails}
                onChangeText={setTransportDetails}
                placeholder="Enter transport requirements"
                multiline
              />
            </View>
          </>
        )}
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes & Requirements</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter any additional notes or requirements"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
        
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>Submit Request</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {showTimePicker && (
        <DateTimePicker
          value={
            currentTimePickerMode === 'start'
              ? startTime
              : currentTimePickerMode === 'end'
              ? endTime
              : callTime
          }
          mode="time"
          display="default"
          onChange={handleTimeChange}
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
  formContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  }
});

export default NewProductionRequest;