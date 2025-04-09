import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AuthContext } from '../../contexts/AuthContext';
import { getProductionById, reportProductionOvertime, cancelProduction } from '../../api/productions';
import { getUserNamesByIds } from '../../api/users';
import { getIssuesByProduction } from '../../api/issues';
import { Production, RootStackParamList, Issue } from '../../types';

type ProductionDetailsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ProductionDetails'
>;

type ProductionDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProductionDetails'
>;

interface ProductionDetailsScreenProps {
  navigation: ProductionDetailsScreenNavigationProp;
  route: ProductionDetailsScreenRouteProp;
}

const ProductionDetailsScreen: React.FC<ProductionDetailsScreenProps> = ({ navigation, route }) => {
  const { productionId } = route.params;
  const { userProfile, userRole } = useContext(AuthContext);
  
  const [production, setProduction] = useState<Production | null>(null);
  const [staffNames, setStaffNames] = useState<Record<string, string>>({});
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    details: true,
    staff: true,
    issues: true,
    notes: true
  });
  
  useEffect(() => {
    fetchProductionDetails();
  }, [productionId]);
  
  const fetchProductionDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch production details
      const productionData = await getProductionById(productionId);
      if (!productionData) {
        Alert.alert('Error', 'Production not found');
        navigation.goBack();
        return;
      }
      
      setProduction(productionData);
      
      // Fetch staff names
      const staffIds: string[] = [];
      
      if (productionData.requestedById) {
        staffIds.push(productionData.requestedById);
      }
      
      if (productionData.processedById) {
        staffIds.push(productionData.processedById);
      }
      
      // Add all assigned staff IDs
      Object.entries(productionData.assignedStaff).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          staffIds.push(...value);
        } else if (value) {
          staffIds.push(value);
        }
      });
      
      // Get unique IDs
      const uniqueStaffIds = [...new Set(staffIds)].filter(Boolean);
      
      if (uniqueStaffIds.length > 0) {
        const names = await getUserNamesByIds(uniqueStaffIds);
        setStaffNames(names);
      }
      
      // Fetch issues for this production
      const productionIssues = await getIssuesByProduction(productionId);
      setIssues(productionIssues);
    } catch (error) {
      console.error('Error fetching production details:', error);
      Alert.alert('Error', 'Failed to load production details');
    } finally {
      setLoading(false);
    }
  };
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handleShareProduction = async () => {
    if (!production) return;
    
    try {
      const staffSections = [];
      
      if (production.assignedStaff.cameraOperators?.length) {
        const names = production.assignedStaff.cameraOperators.map(id => staffNames[id] || 'Unknown').join(', ');
        staffSections.push(`Camera Operators: ${names}`);
      }
      
      if (production.assignedStaff.soundOperators?.length) {
        const names = production.assignedStaff.soundOperators.map(id => staffNames[id] || 'Unknown').join(', ');
        staffSections.push(`Sound Operators: ${names}`);
      }
      
      if (production.assignedStaff.lightingOperators?.length) {
        const names = production.assignedStaff.lightingOperators.map(id => staffNames[id] || 'Unknown').join(', ');
        staffSections.push(`Lighting Operators: ${names}`);
      }
      
      if (production.assignedStaff.evsOperator) {
        staffSections.push(`EVS Operator: ${staffNames[production.assignedStaff.evsOperator] || 'Unknown'}`);
      }
      
      if (production.assignedStaff.director) {
        staffSections.push(`Director: ${staffNames[production.assignedStaff.director] || 'Unknown'}`);
      }
      
      if (production.assignedStaff.streamOperator) {
        staffSections.push(`Stream Operator: ${staffNames[production.assignedStaff.streamOperator] || 'Unknown'}`);
      }
      
      if (production.assignedStaff.technician) {
        staffSections.push(`Technician: ${staffNames[production.assignedStaff.technician] || 'Unknown'}`);
      }
      
      if (production.assignedStaff.electrician) {
        staffSections.push(`Electrician: ${staffNames[production.assignedStaff.electrician] || 'Unknown'}`);
      }
      
      const staffInfo = staffSections.length ? `\n\nAssigned Staff:\n${staffSections.join('\n')}` : '';
      
      const shareMessage = `
Production: ${production.name}
Date: ${format(production.date, 'EEE, MMM d, yyyy')}
Venue: ${production.venue}${production.isOutsideBroadcast ? ' (Outside Broadcast)' : ''}
Production Time: ${format(production.startTime, 'h:mm a')} - ${format(production.endTime, 'h:mm a')}
Call Time: ${format(production.callTime, 'h:mm a')}
Status: ${production.status.charAt(0).toUpperCase() + production.status.slice(1)}
${staffInfo}
${production.notes ? `\nNotes: ${production.notes}` : ''}
      `.trim();
      
      await Share.share({
        message: shareMessage,
        title: `Production Details: ${production.name}`
      });
    } catch (error) {
      console.error('Error sharing production details:', error);
      Alert.alert('Error', 'Failed to share production details');
    }
  };
  
  const handleReportIssue = () => {
    navigation.navigate('IssueReporting', { productionId });
  };
  
  const handleReportOvertime = () => {
    if (!production) return;
    
    // Check if production is on the current day
    const now = new Date();
    const productionDate = new Date(production.date);
    const isSameDay = now.toDateString() === productionDate.toDateString();
    
    if (!isSameDay) {
      Alert.alert('Cannot Report Overtime', 'Overtime can only be reported on the day of the production.');
      return;
    }
    
    // Show overtime reason input
    Alert.prompt(
      'Report Overtime',
      'Please provide a reason for the overtime:',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Submit',
          onPress: (reason) => {
            if (reason && production) {
              submitOvertimeReport(reason);
            }
          }
        }
      ],
      'plain-text'
    );
  };
  
  const submitOvertimeReport = async (reason: string) => {
    if (!production || !userProfile) return;
    
    try {
      setLoading(true);
      
      const now = new Date();
      await reportProductionOvertime({
        productionId,
        overtimeReason: reason,
        actualEndTime: now
      });
      
      Alert.alert(
        'Overtime Reported',
        'The overtime has been reported to the booking officer.',
        [{ text: 'OK', onPress: fetchProductionDetails }]
      );
    } catch (error) {
      console.error('Error reporting overtime:', error);
      Alert.alert('Error', 'Failed to report overtime');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelProduction = () => {
    if (!production) return;
    
    // Check if user is a booking officer
    if (userRole !== 'booking_officer') {
      Alert.alert('Permission Denied', 'Only booking officers can cancel productions');
      return;
    }
    
    // Show cancellation reason input
    Alert.prompt(
      'Cancel Production',
      'Please provide a reason for cancellation:',
      [
        {
          text: 'Back',
          style: 'cancel'
        },
        {
          text: 'Cancel Production',
          style: 'destructive',
          onPress: (reason) => {
            if (reason) {
              submitCancellation(reason);
            }
          }
        }
      ],
      'plain-text'
    );
  };
  
  const submitCancellation = async (reason: string) => {
    if (!production) return;
    
    try {
      setLoading(true);
      
      await cancelProduction(productionId, reason);
      
      Alert.alert(
        'Production Cancelled',
        'The production has been cancelled and all staff have been notified.',
        [{ text: 'OK', onPress: fetchProductionDetails }]
      );
    } catch (error) {
      console.error('Error cancelling production:', error);
      Alert.alert('Error', 'Failed to cancel production');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading production details...</Text>
      </View>
    );
  }
  
  if (!production) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={48} color="#dc3545" />
        <Text style={styles.errorText}>Production not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'requested': return '#FFC107';
      case 'confirmed': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'cancelled': return '#F44336';
      case 'overtime': return '#FF9800';
      default: return '#9E9E9E';
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{production.name}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(production.status) }]}>
          <Text style={styles.statusText}>
            {production.status.charAt(0).toUpperCase() + production.status.slice(1)}
          </Text>
        </View>
      </View>
      
      {/* Basic Details Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('details')}
        >
          <View style={styles.sectionTitleContainer}>
            <Icon name="event" size={20} color="#007bff" />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>
          <Icon 
            name={expandedSections.details ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#555" 
          />
        </TouchableOpacity>
        
        {expandedSections.details && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Date:</Text>
              <Text style={styles.infoValue}>{format(production.date, 'EEEE, MMMM d, yyyy')}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Venue:</Text>
              <Text style={styles.infoValue}>{production.venue}</Text>
            </View>
            
            {production.isOutsideBroadcast && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Type:</Text>
                <Text style={styles.infoValue}>Outside Broadcast</Text>
              </View>
            )}
            
            {production.isOutsideBroadcast && production.locationDetails && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Location:</Text>
                <Text style={styles.infoValue}>{production.locationDetails}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Call Time:</Text>
              <Text style={styles.infoValue}>{format(production.callTime, 'h:mm a')}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Production Time:</Text>
              <Text style={styles.infoValue}>
                {format(production.startTime, 'h:mm a')} - {format(production.endTime, 'h:mm a')}
              </Text>
            </View>
            
            {production.actualEndTime && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Actual End Time:</Text>
                <Text style={styles.infoValue}>{format(production.actualEndTime, 'h:mm a')}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Producer:</Text>
              <Text style={styles.infoValue}>
                {production.requestedById ? staffNames[production.requestedById] || 'Unknown' : 'Not assigned'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Booking Officer:</Text>
              <Text style={styles.infoValue}>
                {production.processedById ? staffNames[production.processedById] || 'Unknown' : 'Not assigned'}
              </Text>
            </View>
            
            {production.overtimeReported && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Overtime Reason:</Text>
                <Text style={styles.infoValue}>{production.overtimeReason || 'Not specified'}</Text>
              </View>
            )}
          </View>
        )}
      </View>
      
      {/* Assigned Staff Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('staff')}
        >
          <View style={styles.sectionTitleContainer}>
            <Icon name="people" size={20} color="#007bff" />
            <Text style={styles.sectionTitle}>Assigned Staff</Text>
          </View>
          <Icon 
            name={expandedSections.staff ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#555" 
          />
        </TouchableOpacity>
        
        {expandedSections.staff && (
          <View style={styles.sectionContent}>
            {production.assignedStaff.cameraOperators?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Camera Operators:</Text>
                <Text style={styles.infoValue}>
                  {production.assignedStaff.cameraOperators.map(id => staffNames[id] || 'Unknown').join(', ')}
                </Text>
              </View>
            )}
            
            {production.assignedStaff.soundOperators?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sound Operators:</Text>
                <Text style={styles.infoValue}>
                  {production.assignedStaff.soundOperators.map(id => staffNames[id] || 'Unknown').join(', ')}
                </Text>
              </View>
            )}
            
            {production.assignedStaff.lightingOperators?.length > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Lighting Operators:</Text>
                <Text style={styles.infoValue}>
                  {production.assignedStaff.lightingOperators.map(id => staffNames[id] || 'Unknown').join(', ')}
                </Text>
              </View>
            )}
            
            {production.assignedStaff.evsOperator && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>EVS Operator:</Text>
                <Text style={styles.infoValue}>
                  {staffNames[production.assignedStaff.evsOperator] || 'Unknown'}
                </Text>
              </View>
            )}
            
            {production.assignedStaff.director && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Director:</Text>
                <Text style={styles.infoValue}>
                  {staffNames[production.assignedStaff.director] || 'Unknown'}
                </Text>
              </View>
            )}
            
            {production.assignedStaff.streamOperator && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Stream Operator:</Text>
                <Text style={styles.infoValue}>
                  {staffNames[production.assignedStaff.streamOperator] || 'Unknown'}
                </Text>
              </View>
            )}
            
            {production.assignedStaff.technician && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Technician:</Text>
                <Text style={styles.infoValue}>
                  {staffNames[production.assignedStaff.technician] || 'Unknown'}
                </Text>
              </View>
            )}
            
            {production.assignedStaff.electrician && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Electrician:</Text>
                <Text style={styles.infoValue}>
                  {staffNames[production.assignedStaff.electrician] || 'Unknown'}
                </Text>
              </View>
            )}
            
            {Object.values(production.assignedStaff).every(value => 
              !value || (Array.isArray(value) && value.length === 0)
            ) && (
              <Text style={styles.noStaffText}>No staff assigned yet</Text>
            )}
          </View>
        )}
      </View>
      
      {/* Issues Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('issues')}
        >
          <View style={styles.sectionTitleContainer}>
            <Icon name="report-problem" size={20} color="#007bff" />
            <Text style={styles.sectionTitle}>Issues ({issues.length})</Text>
          </View>
          <Icon 
            name={expandedSections.issues ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#555" 
          />
        </TouchableOpacity>
        
        {expandedSections.issues && (
          <View style={styles.sectionContent}>
            {issues.length === 0 ? (
              <Text style={styles.noIssuesText}>No issues reported</Text>
            ) : (
              issues.map(issue => (
                <View key={issue.id} style={styles.issueCard}>
                  <View style={styles.issueHeader}>
                    <View style={[styles.priorityBadge, { 
                      backgroundColor: 
                        issue.priority === 'high' ? '#dc3545' : 
                        issue.priority === 'medium' ? '#ffc107' : '#28a745' 
                    }]}>
                      <Text style={styles.priorityText}>
                        {issue.priority.charAt(0).toUpperCase() + issue.priority.slice(1)}
                      </Text>
                    </View>
                    <Text style={styles.issueStatus}>
                      {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
                    </Text>
                  </View>
                  
                  <Text style={styles.issueDescription}>{issue.description}</Text>
                  
                  <View style={styles.issueFooter}>
                    <Text style={styles.issueReporter}>
                      By: {staffNames[issue.reportedById] || 'Unknown'}
                    </Text>
                    <Text style={styles.issueDate}>
                      {format(issue.createdAt, 'MMM d, yyyy h:mm a')}
                    </Text>
                  </View>
                </View>
              ))
            )}
            
            <TouchableOpacity
              style={styles.reportIssueButton}
              onPress={handleReportIssue}
            >
              <Icon name="add-circle-outline" size={20} color="#007bff" />
              <Text style={styles.reportIssueText}>Report New Issue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Notes Section */}
      {(production.notes || production.transportDetails || production.completionNotes) && (
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('notes')}
          >
            <View style={styles.sectionTitleContainer}>
              <Icon name="description" size={20} color="#007bff" />
              <Text style={styles.sectionTitle}>Notes & Additional Info</Text>
            </View>
            <Icon 
              name={expandedSections.notes ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#555" 
            />
          </TouchableOpacity>
          
          {expandedSections.notes && (
            <View style={styles.sectionContent}>
              {production.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Production Notes:</Text>
                  <Text style={styles.notesText}>{production.notes}</Text>
                </View>
              )}
              
              {production.transportDetails && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Transport Details:</Text>
                  <Text style={styles.notesText}>{production.transportDetails}</Text>
                </View>
              )}
              
              {production.completionNotes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Completion Notes:</Text>
                  <Text style={styles.notesText}>{production.completionNotes}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleShareProduction}
        >
          <Icon name="share" size={20} color="white" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
        
        {userRole !== 'booking_officer' && production.status === 'confirmed' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            onPress={handleReportOvertime}
          >
            <Icon name="schedule" size={20} color="white" />
            <Text style={styles.actionButtonText}>Report OT</Text>
          </TouchableOpacity>
        )}
        
        {userRole === 'booking_officer' && production.status !== 'cancelled' && production.status !== 'completed' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
            onPress={handleCancelProduction}
          >
            <Icon name="cancel" size={20} color="white" />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
        
        {userRole === 'booking_officer' && production.status === 'requested' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#28a745' }]}
            onPress={() => navigation.navigate('StaffAssignment', { production })}
          >
            <Icon name="group-add" size={20} color="white" />
            <Text style={styles.actionButtonText}>Assign Staff</Text>
          </TouchableOpacity>
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
  header: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 12,
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
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  sectionContent: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#555',
  },
  infoValue: {
    flex: 1,
    color: '#333',
  },
  noStaffText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginVertical: 8,
  },
  noIssuesText: {
    fontStyle: 'italic',
    color: '#777',
    textAlign: 'center',
    marginVertical: 8,
  },
  issueCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  issueStatus: {
    fontSize: 12,
    color: '#555',
  },
  issueDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  issueReporter: {
    fontSize: 12,
    color: '#777',
  },
  issueDate: {
    fontSize: 12,
    color: '#777',
  },
  reportIssueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  reportIssueText: {
    color: '#007bff',
    marginLeft: 8,
    fontWeight: '500',
  },
  notesSection: {
    marginBottom: 16,
  },
  notesTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#555',
  },
  notesText: {
    color: '#333',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#555',
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default ProductionDetailsScreen;