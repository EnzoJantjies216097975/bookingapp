import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { updateUserProfile } from '../../api/auth';
import { storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Department } from '../../types';

const ProfileSetupScreen: React.FC = () => {
  const { userProfile } = useContext(AuthContext);
  
  const [name, setName] = useState(userProfile?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [department, setDepartment] = useState<Department>('TV Operations');
  const [profilePicture, setProfilePicture] = useState<string | null>(userProfile?.profilePicture || null);
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  useEffect(() => {
    // Request permission for image library
    (async () => {
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    })();
  }, []);
  
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfilePicture(result.assets[0].uri);
    }
  };
  
  const uploadProfilePicture = async (uri: string): Promise<string> => {
    if (!userProfile) throw new Error('User not logged in');
    
    const response = await fetch(uri);
    const blob = await response.blob();
    
    const storageRef = ref(storage, `profilePictures/${userProfile.id}`);
    await uploadBytes(storageRef, blob);
    
    return getDownloadURL(storageRef);
  };
  
  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        Alert.alert('Error', 'Please enter your name');
        return;
      }
      setStep(2);
    }
  };
  
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };
  
  const handleComplete = async () => {
    if (!userProfile) return;
    
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }
    
    setLoading(true);
    try {
      let pictureUrl = userProfile.profilePicture;
      
      // If profile picture has changed, upload it
      if (profilePicture && profilePicture !== userProfile.profilePicture) {
        pictureUrl = await uploadProfilePicture(profilePicture);
      }
      
      await updateUserProfile({
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        profilePicture: pictureUrl,
        profileComplete: true,
        department
      });
      
      Alert.alert(
        'Profile Setup Complete',
        'Your profile has been set up successfully',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to complete profile setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (!userProfile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not logged in</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Complete Your Profile</Text>
        <Text style={styles.subtitle}>
          {step === 1 ? 'Personal Information' : 'Profile Picture & Preferences'}
        </Text>
      </View>
      
      <View style={styles.stepIndicator}>
        <View style={[styles.stepDot, step >= 1 && styles.activeStepDot]}>
          <Text style={[styles.stepNumber, step >= 1 && styles.activeStepNumber]}>1</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step >= 2 && styles.activeStepDot]}>
          <Text style={[styles.stepNumber, step >= 2 && styles.activeStepNumber]}>2</Text>
        </View>
      </View>
      
      {step === 1 ? (
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your full name"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="Enter your phone number"
              keyboardType="phone-pad"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Department</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={department}
                onValueChange={(itemValue) => setDepartment(itemValue as Department)}
                style={styles.picker}
              >
                <Picker.Item label="TV Operations" value="TV Operations" />
                <Picker.Item label="News Desk" value="News Desk" />
                <Picker.Item label="Current Affairs" value="Current Affairs" />
                <Picker.Item label="Content Hub" value="Content Hub" />
              </Picker>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Icon name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.formContainer}>
          <View style={styles.profilePictureContainer}>
            <Text style={styles.label}>Profile Picture</Text>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handlePickImage}
            >
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.profileImage} />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Icon name="person" size={80} color="#ccc" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoSection}>
            <View style={styles.infoItem}>
              <Icon name="info" size={20} color="#007bff" />
              <Text style={styles.infoText}>
                Adding a profile picture helps colleagues identify you on productions.
              </Text>
            </View>
          </View>
          
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              disabled={loading}
            >
              <Icon name="arrow-back" size={20} color="#555" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.completeButtonText}>Complete Setup</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: '#007bff',
  },
  stepNumber: {
    color: '#555',
    fontWeight: 'bold',
  },
  activeStepNumber: {
    color: 'white',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
    maxWidth: 100,
  },
  formContainer: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    width: '100%',
  },
  nextButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  profilePictureContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoText: {
    marginTop: 8,
    color: '#007bff',
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    marginLeft: 10,
    color: '#333',
    flex: 1,
    lineHeight: 20,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  backButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  completeButton: {
    flex: 2,
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 18,
    color: '#dc3545',
  }
});

export default ProfileSetupScreen;