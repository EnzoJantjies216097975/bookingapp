import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { createAnnouncement } from '../../api/announcements';

interface AnnouncementFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  onCancel,
  onSuccess
}) => {
  const { userProfile } = useContext(AuthContext);
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetGroup, setTargetGroup] = useState<'all' | 'producers' | 'operators'>('all');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Validation states
  const [titleError, setTitleError] = useState('');
  const [messageError, setMessageError] = useState('');
  
  const validateForm = (): boolean => {
    let isValid = true;
    
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    if (!message.trim()) {
      setMessageError('Message is required');
      isValid = false;
    } else {
      setMessageError('');
    }
    
    return isValid;
  };
  
  const handleCreateAnnouncement = async () => {
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to create an announcement');
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await createAnnouncement({
        title: title.trim(),
        message: message.trim(),
        targetGroup,
        createdById: userProfile.id,
        isPinned
      });
      
      Alert.alert(
        'Announcement Created',
        'Your announcement has been created successfully',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Announcement</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={onCancel}
          disabled={loading}
        >
          <Icon name="close" size={24} color="#555" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter announcement title"
            maxLength={100}
            editable={!loading}
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Message *</Text>
          <TextInput
            style={[styles.textarea, messageError ? styles.inputError : null]}
            value={message}
            onChangeText={setMessage}
            placeholder="Enter announcement message"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!loading}
          />
          {messageError ? <Text style={styles.errorText}>{messageError}</Text> : null}
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Audience</Text>
          <View style={styles.targetButtons}>
            <TouchableOpacity
              style={[
                styles.targetButton,
                targetGroup === 'all' && styles.activeTargetButton
              ]}
              onPress={() => setTargetGroup('all')}
              disabled={loading}
            >
              <Text style={[
                styles.targetButtonText,
                targetGroup === 'all' && styles.activeTargetButtonText
              ]}>
                All Staff
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.targetButton,
                targetGroup === 'producers' && styles.activeTargetButton
              ]}
              onPress={() => setTargetGroup('producers')}
              disabled={loading}
            >
              <Text style={[
                styles.targetButtonText,
                targetGroup === 'producers' && styles.activeTargetButtonText
              ]}>
                Producers
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.targetButton,
                targetGroup === 'operators' && styles.activeTargetButton
              ]}
              onPress={() => setTargetGroup('operators')}
              disabled={loading}
            >
              <Text style={[
                styles.targetButtonText,
                targetGroup === 'operators' && styles.activeTargetButtonText
              ]}>
                Operators
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.switchRow}>
          <Text style={styles.label}>Pin this announcement</Text>
          <Switch
            value={isPinned}
            onValueChange={setIsPinned}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={isPinned ? '#007bff' : '#f4f3f4'}
            disabled={loading}
          />
        </View>
        
        <View style={styles.infoBox}>
          <Icon name="info" size={20} color="#007bff" />
          <Text style={styles.infoText}>
            Pinned announcements will appear at the top of the announcements list for all users.
          </Text>
        </View>
        
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCreateAnnouncement}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.submitButtonText}>Create Announcement</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textarea: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  targetButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  targetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeTargetButton: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  targetButtonText: {
    color: '#555',
  },
  activeTargetButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e6f7ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#91d5ff',
  },
  infoText: {
    marginLeft: 8,
    color: '#333',
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

export default AnnouncementForm;