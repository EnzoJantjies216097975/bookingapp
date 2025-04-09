import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { createIssue } from '../api/issues';
import { Production, IssuePriority } from '../types';
import Button from '../components/common/Button';

interface IssueReporterProps {
  production: Production;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

const IssueReporter: React.FC<IssueReporterProps> = ({
  production,
  userId,
  onSuccess,
  onCancel,
  compact = false
}) => {
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<IssuePriority>('medium');
  const [loading, setLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(!compact);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Error', 'Please describe the issue');
      return;
    }
    
    if (!userId) {
      Alert.alert('Error', 'User ID is required');
      return;
    }
    
    setLoading(true);
    try {
      await createIssue({
        reportedById: userId,
        productionId: production.id,
        description: description.trim(),
        priority
      });
      
      Alert.alert(
        'Issue Reported',
        'Your issue has been reported successfully',
        [{ text: 'OK' }]
      );
      
      setDescription('');
      setPriority('medium');
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (compact) {
        setExpanded(false);
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      Alert.alert('Error', 'Failed to report issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (compact && !expanded) {
    return (
      <TouchableOpacity
        style={styles.compactContainer}
        onPress={() => setExpanded(true)}
        activeOpacity={0.7}
      >
        <Icon name="report-problem" size={20} color="#007bff" />
        <Text style={styles.compactText}>Report an issue</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, compact && styles.compactFormContainer]}>
      {compact && (
        <View style={styles.compactHeader}>
          <Text style={styles.compactTitle}>Report an Issue</Text>
          <TouchableOpacity
            onPress={() => setExpanded(false)}
            style={styles.closeButton}
          >
            <Icon name="close" size={20} color="#777" />
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={priority}
            onValueChange={(value) => setPriority(value as IssuePriority)}
            style={styles.picker}
            enabled={!loading}
          >
            <Picker.Item label="Low" value="low" />
            <Picker.Item label="Medium" value="medium" />
            <Picker.Item label="High" value="high" />
          </Picker>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail..."
          multiline
          numberOfLines={compact ? 3 : 6}
          textAlignVertical="top"
          editable={!loading}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        {onCancel && (
          <Button
            title="Cancel"
            type="secondary"
            onPress={onCancel}
            style={styles.cancelButton}
            disabled={loading}
          />
        )}
        
        <Button
          title="Submit Issue"
          type="primary"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
          icon={<Icon name="send" size={20} color="#fff" style={styles.buttonIcon} />}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  compactFormContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    fontWeight: '500',
  },
  pickerContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
  },
  textArea: {
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 8,
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  buttonIcon: {
    marginRight: 8,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  compactText: {
    marginLeft: 8,
    color: '#007bff',
    fontWeight: '500',
  }
});

export default IssueReporter;