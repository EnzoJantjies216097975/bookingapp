import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../contexts/AuthContext';
import { createProductionRequest, getProductionById, updateProductionDetails } from '../api/productions';
import { Production, Venue } from '../types';

interface ProductionFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  productionId?: string;
  isEditing?: boolean;
}

const ProductionForm: React.FC<ProductionFormProps> = ({
  onSubmit,
  onCancel,
  productionId,
  isEditing = false
}) => {
  const { userProfile } = useContext(AuthContext);
  
  // Form state
  const [name, setName] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState<Date>(new Date());
  const [endTime, setEndTime] = useState<Date>(new Date());
  const [callTime, setCallTime] = useState<Date>(new Date());
  const [venue, setVenue] = useState<Venue>('Studio 1');
  const [locationDetails, setLocationDetails] = useState<string>('');
  const [isOutsideBroadcast, setIsOutsideBroadcast] = useState<boolean>(false);
  const [transportDetails, setTransportDetails] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Date/time picker states
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [activeTimeField, setActiveTimeField] = useState<'start' | 'end' | 'call'>('start');
  
  // Loading states
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(isEditing);
  
  // Validation states
  const [nameError, setNameError] = useState<string>('');
  const [locationError, setLocationError] = useState<string>('');
  
  useEffect(() => {
    if (isEditing && productionId) {
      fetchProductionDetails();
    } else {
      // Set default times for new productions
      const defaultStartTime = new Date();
      defaultStartTime.setHours(9, 0, 0, 0);
      
      const defaultEndTime = new Date();
      defaultEndTime.setHours(11, 0, 0, 0);
      
      const defaultCallTime = new Date();
      defaultCallTime.setHours(8, 30, 0, 0);
      
      setStartTime(defaultStartTime);
      setEndTime(defaultEndTime);
      setCallTime(defaultCallTime);
      setInitialLoading(false);
    }
  }, [isEditing, productionId]);
  
  const fetchProductionDetails = async () => {
    if (!productionId) return;
    
    try {
      const production = await getProductionById(productionId);
      if (production) {
        setName(production.name);
        setDate(production.date);
        setStartTime(production.startTime);
        setEndTime(production.endTime);
        setCallTime(production.callTime);
        setVenue(production.venue);
        setLocationDetails(production.locationDetails || '');
        setIsOutsideBroadcast(production.isOutsideBroadcast);
        setTransportDetails(production.transportDetails || '');
        setNotes(production.notes || '');
      }
    } catch (error) {
      console.error('Error fetching production details:', error);
      Alert.alert('Error', 'Failed to load production details');
    } finally {
      setInitialLoading(false);
    }
  };
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Validate name
    if (!name.trim()) {
      setNameError('Production name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    // Validate location details for outside broadcasts
    if (isOutsideBroadcast && !locationDetails.trim()) {
      setLocationError('Location details are required for outside broadcasts');
      isValid = false;
    } else {
      setLocationError('');
    }
    
    // Validate times
    if (startTime >= endTime) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      isValid = false;
    }
    
    return isValid;
  };
  
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      
      // Update times to keep the same time but on the new date
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
        
        // If end time is before new start time, update it automatically
        if (endTime <= newStartTime) {
          const newEndTime = new Date(newStartTime);
          newEndTime.setHours(hours + 2, minutes, 0, 0); // Default 2 hours later
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
  
  const showTimePickerFor = (field: 'start' | 'end' | 'call') => {
    setActiveTimeField(field);
    setShowTimePicker(true);
  };
  
  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to submit a production request');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
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
      
      if (isEditing && productionId) {
        await updateProductionDetails(productionId, productionData);
        Alert.alert(
          'Production Updated',
          'The production has been updated successfully',
          [{ text: 'OK', onPress: onSubmit }]
        );
      } else {
        await createProductionRequest(productionData);
        Alert.alert(
          'Request Submitted',
          'Your production request has been submitted successfully',
          [{ text: 'OK', onPress: onSubmit }]
        );
      }
    } catch (error) {
      console.error('Error submitting production request:', error);
      Alert.alert('Error', 'Failed to submit production request. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading production details...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
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
              onPress={() => showTimePickerFor('start')}
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
              onPress={() => showTimePickerFor('end')}
              disabled={loading}
            >
              <Text>{format(endTime, 'h:mm a')}</Text>
              <Icon name="access-time" size={20} color="#007bff" />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Call Time *</Text>
          <TouchableOpacity
            style={styles.dateInput}
            onPress={() => showTimePickerFor('call')}
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
            onPress={onCancel}
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
                <Text style={styles.submitButtonText}>
                  {isEditing ? 'Update Production' : 'Submit Request'}
                </Text>
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
          minimumDate={isEditing ? undefined : new Date()}
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
  formContainer: {
    padding: 20,
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
  }
});

export default ProductionForm;