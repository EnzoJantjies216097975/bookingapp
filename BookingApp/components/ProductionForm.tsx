import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Platform
} from 'react-native';
import { format } from 'date-fns';
import { AuthContext } from '../contexts/AuthContext';
import { createProductionRequest } from '../api/productions';
import { Venue } from '../types';
import Button from '../components/common/Button';
import DateTimePicker from '../components/common/DateTimePicker';
import Card from '../components/common/Card';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

interface ProductionFormProps {
  onSubmit: () => void;
  onCancel: () => void;
  initialValues?: Partial<FormData>;
}

interface FormData {
  name: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  callTime: Date;
  venue: Venue;
  locationDetails: string;
  isOutsideBroadcast: boolean;
  transportDetails: string;
  notes: string;
}

const ProductionForm: React.FC<ProductionFormProps> = ({
  onSubmit,
  onCancel,
  initialValues
}) => {
  const { userProfile } = useContext(AuthContext);
  
  // Initialize time defaults
  const defaultStartTime = new Date();
  defaultStartTime.setHours(9, 0, 0, 0);
  
  const defaultEndTime = new Date();
  defaultEndTime.setHours(11, 0, 0, 0);
  
  const defaultCallTime = new Date();
  defaultCallTime.setHours(8, 30, 0, 0);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: initialValues?.name || '',
    date: initialValues?.date || new Date(),
    startTime: initialValues?.startTime || defaultStartTime,
    endTime: initialValues?.endTime || defaultEndTime,
    callTime: initialValues?.callTime || defaultCallTime,
    venue: initialValues?.venue || 'Studio 1',
    locationDetails: initialValues?.locationDetails || '',
    isOutsideBroadcast: initialValues?.isOutsideBroadcast || false,
    transportDetails: initialValues?.transportDetails || '',
    notes: initialValues?.notes || ''
  });
  
  // Form validation state
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState<boolean>(false);
  
  // Handle form field changes
  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Special handling for date updates
    if (field === 'date') {
      const newDate = value as Date;
      
      // Update times to maintain hours but use the new date
      const updateTimeWithNewDate = (time: Date): Date => {
        const newTime = new Date(newDate);
        newTime.setHours(time.getHours(), time.getMinutes(), 0, 0);
        return newTime;
      };
      
      setFormData(prev => ({
        ...prev,
        date: newDate,
        startTime: updateTimeWithNewDate(prev.startTime),
        endTime: updateTimeWithNewDate(prev.endTime),
        callTime: updateTimeWithNewDate(prev.callTime)
      }));
    }
    
    // Ensure end time is after start time
    if (field === 'startTime') {
      const startTime = value as Date;
      if (startTime >= formData.endTime) {
        // Automatically adjust end time to be 2 hours after new start time
        const newEndTime = new Date(startTime);
        newEndTime.setHours(startTime.getHours() + 2);
        setFormData(prev => ({ ...prev, endTime: newEndTime }));
      }
    }
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Production name is required';
    }
    
    if (formData.isOutsideBroadcast && !formData.locationDetails.trim()) {
      newErrors.locationDetails = 'Location details are required for outside broadcasts';
    }
    
    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Submit the form
  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to create a production request');
      return;
    }
    
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    try {
      const productionData = {
        name: formData.name.trim(),
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        callTime: formData.callTime,
        venue: formData.venue,
        locationDetails: formData.locationDetails.trim(),
        isOutsideBroadcast: formData.isOutsideBroadcast,
        transportDetails: formData.transportDetails.trim(),
        notes: formData.notes.trim(),
        requestedById: userProfile.id
      };
      
      await createProductionRequest(productionData);
      
      Alert.alert(
        'Request Submitted',
        'Your production request has been submitted successfully',
        [{ text: 'OK', onPress: onSubmit }]
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
      <Card title="Production Details" style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Production Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            placeholder="Enter production name"
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Production Date *</Text>
          <DateTimePicker
            value={formData.date}
            onChange={(date) => handleChange('date', date)}
            mode="date"
            minDate={new Date()}
            error={errors.date}
          />
        </View>
        
        <View style={styles.timeRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Start Time *</Text>
            <DateTimePicker
              value={formData.startTime}
              onChange={(time) => handleChange('startTime', time)}
              mode="time"
              error={errors.startTime}
            />
          </View>
          
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>End Time *</Text>
            <DateTimePicker
              value={formData.endTime}
              onChange={(time) => handleChange('endTime', time)}
              mode="time"
              error={errors.endTime}
            />
          </View>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Call Time *</Text>
          <DateTimePicker
            value={formData.callTime}
            onChange={(time) => handleChange('callTime', time)}
            mode="time"
            error={errors.callTime}
          />
        </View>
      </Card>
      
      <Card title="Venue Information" style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.venue}
              onValueChange={(value) => handleChange('venue', value)}
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
            value={formData.isOutsideBroadcast}
            onValueChange={(value) => handleChange('isOutsideBroadcast', value)}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={formData.isOutsideBroadcast ? '#007bff' : '#f4f3f4'}
          />
        </View>
        
        {formData.isOutsideBroadcast && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location Details *</Text>
              <TextInput
                style={[styles.input, errors.locationDetails && styles.inputError]}
                value={formData.locationDetails}
                onChangeText={(value) => handleChange('locationDetails', value)}
                placeholder="Enter location details"
                multiline
              />
              {errors.locationDetails && (
                <Text style={styles.errorText}>{errors.locationDetails}</Text>
              )}
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Transport Details</Text>
              <TextInput
                style={styles.input}
                value={formData.transportDetails}
                onChangeText={(value) => handleChange('transportDetails', value)}
                placeholder="Enter transport requirements"
                multiline
              />
            </View>
          </>
        )}
      </Card>
      
      <Card title="Additional Information" style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Notes & Requirements</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            placeholder="Enter any additional notes or requirements"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </Card>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          type="secondary"
          onPress={onCancel}
          style={styles.cancelButton}
          disabled={loading}
        />
        
        <Button
          title="Submit Request"
          type="primary"
          onPress={handleSubmit}
          style={styles.submitButton}
          loading={loading}
          icon={<Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  }
});

export default ProductionForm;