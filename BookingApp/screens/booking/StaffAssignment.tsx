import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types';
import StaffSelector from '../../components/booking/StaffSelector';
import { updateProductionStaffing } from '../../api/productions';

type StaffAssignmentNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StaffAssignment'
>;

type StaffAssignmentRouteProp = RouteProp<
  RootStackParamList,
  'StaffAssignment'
>;

interface StaffAssignmentProps {
  navigation: StaffAssignmentNavigationProp;
  route: StaffAssignmentRouteProp;
}

const StaffAssignment: React.FC<StaffAssignmentProps> = ({ navigation, route }) => {
  const { production } = route.params;
  const { userProfile } = useContext(AuthContext);
  
  // Assigned staff state
  const [cameraOperators, setCameraOperators] = useState<string[]>(production.assignedStaff.cameraOperators || []);
  const [soundOperators, setSoundOperators] = useState<string[]>(production.assignedStaff.soundOperators || []);
  const [lightingOperators, setLightingOperators] = useState<string[]>(production.assignedStaff.lightingOperators || []);
  const [evsOperator, setEvsOperator] = useState<string>(production.assignedStaff.evsOperator || '');
  const [director, setDirector] = useState<string>(production.assignedStaff.director || '');
  const [streamOperator, setStreamOperator] = useState<string>(production.assignedStaff.streamOperator || '');
  const [technician, setTechnician] = useState<string>(production.assignedStaff.technician || '');
  const [electrician, setElectrician] = useState<string>(production.assignedStaff.electrician || '');
  
  const [loading, setLoading] = useState<boolean>(false);
  
  // Expand/collapse state for each section
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    camera: true,
    sound: true,
    lighting: true,
    others: true
  });
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to assign staff');
      return;
    }
    
    // Confirm submission
    Alert.alert(
      'Confirm Assignment',
      'Are you sure you want to confirm this staff assignment? Notifications will be sent to all assigned staff.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: submitAssignment
        }
      ]
    );
  };
  
  const submitAssignment = async () => {
    if (!userProfile) return;
    
    setLoading(true);
    try {
      const staffData = {
        productionId: production.id,
        assignedStaff: {
          cameraOperators,
          soundOperators,
          lightingOperators,
          evsOperator,
          director,
          streamOperator,
          technician,
          electrician
        },
        processedById: userProfile.id
      };
      
      await updateProductionStaffing(staffData);
      
      Alert.alert(
        'Staff Assigned',
        'Staff have been assigned and notifications sent',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error assigning staff:', error);
      Alert.alert('Error', 'Failed to assign staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{production.name}</Text>
        <Text style={styles.subtitle}>
          {format(production.date, 'EEEE, MMMM d, yyyy')}
        </Text>
        <Text style={styles.timeInfo}>
          {format(production.startTime, 'h:mm a')} - {format(production.endTime, 'h:mm a')}
        </Text>
        <Text style={styles.venueInfo}>
          {production.venue}
          {production.isOutsideBroadcast && ' (Outside Broadcast)'}
        </Text>
      </View>
      
      <View style={styles.staffContainer}>
        {/* Camera Operators Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('camera')}
          >
            <Text style={styles.sectionTitle}>Camera Operators</Text>
            <Icon 
              name={expandedSections.camera ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#333" 
            />
          </TouchableOpacity>
          
          {expandedSections.camera && (
            <StaffSelector
              production={production}
              staffType="cameraOperators"
              roleTitle="Camera Operators"
              onStaffSelected={setCameraOperators}
              isLoading={loading}
              selectedStaff={cameraOperators}
              multiple={true}
            />
          )}
        </View>
        
        {/* Sound Operators Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('sound')}
          >
            <Text style={styles.sectionTitle}>Sound Operators</Text>
            <Icon 
              name={expandedSections.sound ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#333" 
            />
          </TouchableOpacity>
          
          {expandedSections.sound && (
            <StaffSelector
              production={production}
              staffType="soundOperators"
              roleTitle="Sound Operators"
              onStaffSelected={setSoundOperators}
              isLoading={loading}
              selectedStaff={soundOperators}
              multiple={true}
            />
          )}
        </View>
        
        {/* Lighting Operators Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('lighting')}
          >
            <Text style={styles.sectionTitle}>Lighting Operators</Text>
            <Icon 
              name={expandedSections.lighting ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#333" 
            />
          </TouchableOpacity>
          
          {expandedSections.lighting && (
            <StaffSelector
              production={production}
              staffType="lightingOperators"
              roleTitle="Lighting Operators"
              onStaffSelected={setLightingOperators}
              isLoading={loading}
              selectedStaff={lightingOperators}
              multiple={true}
            />
          )}
        </View>
        
        {/* Other Staff Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.sectionHeader} 
            onPress={() => toggleSection('others')}
          >
            <Text style={styles.sectionTitle}>Other Staff</Text>
            <Icon 
              name={expandedSections.others ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#333" 
            />
          </TouchableOpacity>
          
          {expandedSections.others && (
            <>
              <StaffSelector
                production={production}
                staffType="evsOperator"
                roleTitle="EVS Operator"
                onStaffSelected={setEvsOperator}
                isLoading={loading}
                selectedStaff={evsOperator}
              />
              
              <StaffSelector
                production={production}
                staffType="director"
                roleTitle="Director"
                onStaffSelected={setDirector}
                isLoading={loading}
                selectedStaff={director}
              />
              
              <StaffSelector
                production={production}
                staffType="streamOperator"
                roleTitle="Stream Operator"
                onStaffSelected={setStreamOperator}
                isLoading={loading}
                selectedStaff={streamOperator}
              />
              
              <StaffSelector
                production={production}
                staffType="technician"
                roleTitle="Technician"
                onStaffSelected={setTechnician}
                isLoading={loading}
                selectedStaff={technician}
              />
              
              <StaffSelector
                production={production}
                staffType="electrician"
                roleTitle="Electrician"
                onStaffSelected={setElectrician}
                isLoading={loading}
                selectedStaff={electrician}
              />
            </>
          )}
        </View>
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
            <Text style={styles.submitButtonText}>Confirm Assignment</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
    color: '#555',
  },
  timeInfo: {
    fontSize: 14,
    marginBottom: 4,
    color: '#555',
  },
  venueInfo: {
    fontSize: 14,
    color: '#555',
  },
  staffContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#f8f8f8',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default StaffAssignment;