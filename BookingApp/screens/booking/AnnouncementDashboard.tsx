import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  Timestamp, 
  serverTimestamp 
} from 'firebase/firestore';
import { firestore } from '../../config/firebase';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import { AuthContext } from '../../contexts/AuthContext';
import { Announcement } from '../../types';
import Card from '../../components/common/Card';

// Add Announcement type to types/index.ts
// export interface Announcement {
//   id: string;
//   title: string;
//   message: string;
//   targetGroup: 'all' | 'producers' | 'operators';
//   createdById: string;
//   createdAt: Date;
//   isPinned: boolean;
// }

const AnnouncementDashboard: React.FC = () => {
  const navigation = useNavigation();
  const { userProfile } = useContext(AuthContext);
  
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [targetGroup, setTargetGroup] = useState<'all' | 'producers' | 'operators'>('all');
  const [pinAnnouncement, setPinAnnouncement] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  useEffect(() => {
    fetchAnnouncements();
  }, []);
  
  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const announcementsRef = collection(firestore, 'announcements');
      const q = query(
        announcementsRef,
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(q);
      
      const announcementsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      } as Announcement));
      
      setAnnouncements(announcementsList);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      Alert.alert('Error', 'Failed to load announcements');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnnouncements();
  };
  
  const handleCreateAnnouncement = async () => {
    // Validate inputs
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }
    
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message');
      return;
    }
    
    if (!userProfile) {
      Alert.alert('Error', 'You must be logged in to create an announcement');
      return;
    }
    
    setSubmitting(true);
    try {
      const announcementData = {
        title: title.trim(),
        message: message.trim(),
        targetGroup,
        createdById: userProfile.id,
        createdAt: serverTimestamp(),
        isPinned: pinAnnouncement
      };
      
      await addDoc(collection(firestore, 'announcements'), announcementData);
      
      // Reset form
      setTitle('');
      setMessage('');
      setTargetGroup('all');
      setPinAnnouncement(false);
      setModalVisible(false);
      
      // Refresh announcements
      fetchAnnouncements();
      
      Alert.alert('Success', 'Announcement created successfully');
    } catch (error) {
      console.error('Error creating announcement:', error);
      Alert.alert('Error', 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };
  
  const getTargetGroupLabel = (group: 'all' | 'producers' | 'operators'): string => {
    switch (group) {
      case 'producers':
        return 'Producers Only';
      case 'operators':
        return 'Operators Only';
      default:
        return 'All Staff';
    }
  };
  
  const renderAnnouncementItem = ({ item }: { item: Announcement }) => (
    <Card style={[styles.announcementCard, item.isPinned && styles.pinnedCard]}>
      {item.isPinned && (
        <View style={styles.pinnedBadge}>
          <Icon name="push-pin" size={14} color="#fff" />
        </View>
      )}
      
      <View style={styles.announcementHeader}>
        <Text style={styles.announcementTitle}>{item.title}</Text>
        <View style={styles.targetBadge}>
          <Text style={styles.targetText}>{getTargetGroupLabel(item.targetGroup)}</Text>
        </View>
      </View>
      
      <Text style={styles.announcementMessage}>{item.message}</Text>
      
      <View style={styles.announcementFooter}>
        <Text style={styles.dateText}>
          {format(item.createdAt, 'MMM d, yyyy h:mm a')}
        </Text>
      </View>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerSubtitle}>
            Create and manage announcements for staff
          </Text>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : (
        <FlatList
          data={announcements}
          renderItem={renderAnnouncementItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="campaign" size={60} color="#ddd" />
              <Text style={styles.emptyText}>No announcements yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first announcement using the button below
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
      
      {/* Create Announcement FAB */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Create Announcement Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Announcement</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Icon name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter announcement title"
                  maxLength={100}
                  editable={!submitting}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Enter announcement message"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!submitting}
                />
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
                    disabled={submitting}
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
                    disabled={submitting}
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
                    disabled={submitting}
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
              
              <TouchableOpacity
                style={styles.pinOption}
                onPress={() => setPinAnnouncement(!pinAnnouncement)}
                disabled={submitting}
              >
                <Icon
                  name={pinAnnouncement ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color={pinAnnouncement ? '#007bff' : '#aaa'}
                />
                <Text style={styles.pinText}>Pin this announcement</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleCreateAnnouncement}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Create Announcement</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  announcementCard: {
    marginBottom: 16,
    position: 'relative',
  },
  pinnedCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107',
  },
  pinnedBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ffc107',
    borderBottomLeftRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  targetBadge: {
    backgroundColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  targetText: {
    fontSize: 12,
    color: '#495057',
  },
  announcementMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 24,
  },
  announcementFooter: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
    marginTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#777',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#777',
    textAlign: 'center',
    marginTop: 8,
  },
  fabButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
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
  pinOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pinText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#555',
  },
  submitButton: {
    backgroundColor: '#007bff',
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
});

export default AnnouncementDashboard;