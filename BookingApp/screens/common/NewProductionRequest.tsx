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
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { createProductionRequest } from '../../api/productions';
import { Venue } from '../../types';

const NewProductionRequest: React.FC = ({ navigation }) => {
  const { userProfile } = useContext(AuthContext);
  
  // Set default times
  const defaultStartTime = new Date();
  defaultStartTime.setHours(9, 0, 0, 0);
  
  const defaultEndTime = new Date();
  defaultEndTime.setHours(11, 0, 0, 0);
  
  const defaultCallTime = new Date();
  defaultCallTime.setHours(8, 30, 0, 0);
  
  // Form state
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [startTime, setStartTime] = useState(defaultStartTime);
  const [endTime, setEndTime] = useState(defaultEndTime);
  const [callTime, setCallTime] = useState(defaultCallTime);
  const [venue, setVenue] = useState<Venue>('Studio 1');
  const [isOutsideBroadcast, setIsOutsideBroadcast] = useState(false);
  const [locationDetails, setLocationDetails] = useState('');
  const [transportDetails, setTransportDetails] = useState('');
  const [notes, setNotes] = useState('');
  
  // Date/time picker state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | 'call'>('start');
  
  // Loading state
  const [loading, setLoading] = useState(false);
  
  // Input validation state
  const [nameError, setNameError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [timeError, setTimeError] = useState('');
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Production name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate location if outside broadcast
    if (isOutsideBroadcast && !locationDetails.trim()) {
      setLocationError('Location details are required for outside broadcasts');
      isValid = false;
    } else {
      setLocationError('');
    }
    
    // Validate times
    if (startTime >= endTime) {
      setTimeError('End time must be after start time');
      isValid = false;
    } else {
      setTimeError('');
    }
    
    return isValid;
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      
      // Update times to be on the same date
      const updateTimeToNewDate = (time: Date): Date => {
        const newTime = new Date(selectedDate);
        newTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return newTime;
      };
      
      setStartTime(updateTimeToNewDate(startTime));
      setEndTime(updateTimeToNewDate(endTime));
      setCallTime(updateTimeToNewDate(callTime));
    }
  };
  
  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const hours = selectedTime.getHours();
      const minutes = selectedTime.getMinutes();
      
      if (activeTimeField === 'start') {
        const newStartTime = new Date(date);
        newStartTime.setHours(hours, minutes, 0, 0);
        setStartTime(newStartTime);
        
        // If end time is before new start time, update end time
        if (endTime <= newStartTime) {
          const newEndTime = new Date(newStartTime);
          newEndTime.setHours(hours + 2, minutes, 0, 0); // Default to 2 hours later
          setEndTime(newEndTime);
        }
      } else if (activeTimeField === 'end') {
        const newEndTime = new Date(date);
        newEndTime.setHours(hours, minutes, 0, 0);
        
        if (newEndTime <= startTime) {
          Alert.alert('Invalid Time', 'End time must be after start time');
        } else {
          setEndTime(newEndTime);
        }
      } else if (activeTimeField === 'call') {
        const newCallTime = new Date(date);
        newCallTime.setHours(hours, minutes, 0, 0);
        setCallTime(newCallTime);
      }
    }
  };
  
  const openTimePicker = (field: 'start' | 'end' | 'call') => {
    setActiveTimeField(field);
    setShowTimePicker(true);
  };
  
  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to create a production request');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await createProductionRequest({
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
      });
      
      Alert.alert(
        'Request Submitted',
        'Your production request has been submitted successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating production request:', error);
      Alert.alert('Error', 'Failed to submit production request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>New Production Request</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Production Name *</Text>
          <TextInput
            style={[styles.input, nameError ? styles.inputError : null]}
            value={name}
            onChangeText={setName}
            placeholder="Enter production name"
            editable={!loading}
          />
          {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Production Date *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Text>{format(date, 'EEEE, MMMM d, yyyy')}</Text>
            <Icon name="calendar-today" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.timeRow}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Time *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openTimePicker('start')}
              disabled={loading}
            >
              <Text>{format(startTime, 'h:mm a')}</Text>
              <Icon name="access-time" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
          
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => openTimePicker('end')}
              disabled={loading}
            >
              <Text>{format(endTime, 'h:mm a')}</Text>
              <Icon name="access-time" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {timeError ? <Text style={[styles.errorText, { marginBottom: 16 }]}>{timeError}</Text> : null}
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Call Time *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => openTimePicker('call')}
            disabled={loading}
          >
            <Text>{format(callTime, 'h:mm a')}</Text>
            <Icon name="access-time" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Venue *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={venue}
              onValueChange={(itemValue) => setVenue(itemValue as Venue)}
              style={styles.picker}
              enabled={!loading}
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
          <Text style={styles.label}>Outside Broadcast</Text>
          <Switch
            value={isOutsideBroadcast}
            onValueChange={setIsOutsideBroadcast}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isOutsideBroadcast ? '#007bff' : '#f4f3f4'}
            disabled={loading}
          />
        </View>
        
        {isOutsideBroadcast && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Location Details *</Text>
              <TextInput
                style={[styles.input, locationError ? styles.inputError : null]}
                value={locationDetails}
                onChangeText={setLocationDetails}
                placeholder="Enter location details"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
              {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Transport Details</Text>
              <TextInput
                style={styles.input}
                value={transportDetails}
                onChangeText={setTransportDetails}
                placeholder="Enter transport requirements"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </>
        )}
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Notes & Requirements</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Enter any additional notes or requirements"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            editable={!loading}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
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
            activeTimeField === 'start'
              ? startTime
              : activeTimeField === 'end'
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 40,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 14,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 8,
  }
});

export default NewProductionRequest;