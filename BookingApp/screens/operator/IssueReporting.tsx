import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { getProductionById } from '../../api/productions';
import { createIssue } from '../../api/issues';
import { IssuePriority, Production, RootStackParamList } from '../../types';
import { format } from 'date-fns';

type IssueReportingNavigationProp = StackNavigationProp<
  RootStackParamList,
  'IssueReporting'
>;

type IssueReportingRouteProp = RouteProp<
  RootStackParamList,
  'IssueReporting'
>;

interface IssueReportingProps {
  navigation: IssueReportingNavigationProp;
  route: IssueReportingRouteProp;
}

const IssueReporting: React.FC<IssueReportingProps> = ({ navigation, route }) => {
  const { productionId } = route.params || {};
  const { userProfile } = useContext(AuthContext);
  
  const [production, setProduction] = useState<Production | null>(null);
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(!!productionId);
  
  useEffect(() => {
    if (productionId) {
      fetchProductionDetails();
    }
  }, [productionId]);
  
  const fetchProductionDetails = async () => {
    try {
      const fetchedProduction = await getProductionById(productionId!);
      if (fetchedProduction) {
        setProduction(fetchedProduction);
      }
    } catch (error) {
      console.error('Error fetching production details:', error);
      Alert.alert('Error', 'Failed to load production details');
    } finally {
      setInitialLoading(false);
    }
  };
  
  const handleSubmit = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to report an issue');
      return;
    }
    
    if (!production) {
      Alert.alert('Error', 'No production selected');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Missing Information', 'Please describe the issue');
      return;
    }
    
    setLoading(true);
    try {
      await createIssue({
        reportedById: userProfile.id,
        productionId: production.id,
        description: description.trim(),
        priority
      });
      
      Alert.alert(
        'Issue Reported',
        'Your issue has been reported to the booking officer',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error reporting issue:', error);
      Alert.alert('Error', 'Failed to report issue. Please try again.');
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
      <View style={styles.content}>
        <Text style={styles.title}>Report an Issue</Text>
        
        {production ? (
          <View style={styles.productionInfo}>
            <Text style={styles.productionName}>{production.name}</Text>
            <Text style={styles.productionDate}>
              {format(production.date, 'EEEE, MMMM d, yyyy')}
            </Text>
            <Text style={styles.productionDetails}>
              {production.venue} • {format(production.startTime, 'h:mm a')} - {format(production.endTime, 'h:mm a')}
            </Text>
          </View>
        ) : (
          <View style={styles.noProductionContainer}>
            <Icon name="warning" size={40} color="#FFC107" />
            <Text style={styles.noProductionText}>
              You need to select a production from your schedule before reporting an issue.
            </Text>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.navigate('OperatorSchedule')}
            >
              <Text style={styles.browseButtonText}>Browse Your Schedule</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {production && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={priority}
                  onValueChange={(value) => setPriority(value as IssuePriority)}
                  style={styles.picker}
                >
                  <Picker.Item label="Low" value="low" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="High" value="high" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={styles.textArea}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe the issue in detail..."
                multiline
                numberOfLines={6}
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
                  <Text style={styles.submitButtonText}>Submit Issue</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
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
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  productionName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productionDate: {
    fontSize: 16,
    color: '#555',
    marginBottom: 4,
  },
  productionDetails: {
    fontSize: 14,
    color: '#777',
  },
  noProductionContainer: {
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  noProductionText: {
    textAlign: 'center',
    marginVertical: 12,
    color: '#5D4037',
  },
  browseButton: {
    backgroundColor: '#FFC107',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  browseButtonText: {
    color: '#5D4037',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
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
  textArea: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    height: 120,
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

export default IssueReporting;