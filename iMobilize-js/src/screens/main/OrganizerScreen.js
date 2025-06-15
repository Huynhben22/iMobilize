// src/screens/main/OrganizerScreen.js - ENHANCED VERSION WITH DEBUGGING
import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, 
  TextInput, Alert, ActivityIndicator, RefreshControl 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../services/Api';
import { useAuth } from '../../context/AuthContext';

const OrganizerScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userGroups, setUserGroups] = useState([]);
  const [userEvents, setUserEvents] = useState([]);
  
  // Modal states
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showManageEvents, setShowManageEvents] = useState(false);
  
  // Form states
  const [groupForm, setGroupForm] = useState({ name: '', description: '', is_private: false });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location_description: '',
    organizing_group_id: '',
    category: 'other',
    is_private: false,
    group_members_only: false
  });

  useEffect(() => {
    loadOrganizerData();
  }, []);

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      
      // Load user's groups and created events
      const [groupsResponse, eventsResponse] = await Promise.all([
        ApiService.getMyGroups({ limit: 50 }),
        ApiService.getEvents({ limit: 50, status: 'upcoming' })
      ]);

      if (groupsResponse.success) {
        // Filter to only groups where user is admin or moderator
        const adminGroups = groupsResponse.data.groups.filter(
          group => ['admin', 'moderator'].includes(group.role)
        );
        setUserGroups(adminGroups);
      }

      if (eventsResponse.success) {
        // Filter events organized by current user
        const userOrganizedEvents = eventsResponse.data.events.filter(
          event => event.organizer_username === user.username
        );
        setUserEvents(userOrganizedEvents);
      }
    } catch (error) {
      console.error('Error loading organizer data:', error);
      Alert.alert('Error', 'Failed to load organizer data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrganizerData();
    setRefreshing(false);
  };

  const handleCreateGroup = async () => {
    if (!groupForm.name.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    try {
      const response = await ApiService.createGroup({
        name: groupForm.name.trim(),
        description: groupForm.description.trim(),
        is_private: groupForm.is_private
      });

      if (response.success) {
        Alert.alert('Success', 'Group created successfully!');
        setShowCreateGroup(false);
        setGroupForm({ name: '', description: '', is_private: false });
        await loadOrganizerData();
      } else {
        Alert.alert('Error', response.message || 'Failed to create group');
      }
    } catch (error) {
      console.error('Create group error:', error);
      Alert.alert('Error', 'Failed to create group');
    }
  };

  // Helper function to generate dates
  const generateDateString = (daysFromNow, hour = 14) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  };

  // Enhanced event creation with validation and clean logging
  const handleCreateEvent = async () => {
    console.log('🎪 Creating new event...');
    
    // Comprehensive validation
    const validationErrors = [];
    
    if (!eventForm.title.trim()) {
      validationErrors.push('Event title is required');
    } else if (eventForm.title.trim().length < 3) {
      validationErrors.push('Event title must be at least 3 characters');
    }

    if (!eventForm.description.trim()) {
      validationErrors.push('Event description is required');
    } else if (eventForm.description.trim().length < 10) {
      validationErrors.push('Event description must be at least 10 characters');
    }

    if (!eventForm.start_time) {
      validationErrors.push('Please set a start time using the quick date buttons');
    }

    if (!eventForm.end_time) {
      validationErrors.push('Please set an end time using the quick date buttons');
    }

    // Check if end time is after start time
    if (eventForm.start_time && eventForm.end_time) {
      const startDate = new Date(eventForm.start_time);
      const endDate = new Date(eventForm.end_time);
      if (endDate <= startDate) {
        validationErrors.push('End time must be after start time');
      }
    }

    if (validationErrors.length > 0) {
      Alert.alert('Validation Error', validationErrors.join('\n'));
      return;
    }

    try {
      // Create event data with proper formatting
      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: eventForm.start_time,
        end_time: eventForm.end_time,
        category: eventForm.category || 'other',
        is_private: Boolean(eventForm.is_private),
        group_members_only: Boolean(eventForm.group_members_only)
      };

      // Only include location_description if it has content
      if (eventForm.location_description.trim()) {
        eventData.location_description = eventForm.location_description.trim();
      }

      // Only include organizing_group_id if it's set and valid
      if (eventForm.organizing_group_id && eventForm.organizing_group_id.trim()) {
        const groupId = parseInt(eventForm.organizing_group_id);
        if (!isNaN(groupId) && groupId > 0) {
          eventData.organizing_group_id = groupId;
        }
      }

      const response = await ApiService.createEvent(eventData);

      if (response && response.success) {
        Alert.alert('Success! 🎉', 'Event created successfully!');
        setShowCreateEvent(false);
        
        // Reset form to initial state
        setEventForm({
          title: '', 
          description: '', 
          start_time: '', 
          end_time: '',
          location_description: '', 
          organizing_group_id: '', 
          category: 'other',
          is_private: false, 
          group_members_only: false
        });
        
        // Reload data to show new event
        await loadOrganizerData();
      } else {
        Alert.alert('Creation Failed', response?.message || 'Failed to create event. Please try again.');
      }
    } catch (error) {
      console.error('Event creation error:', error);
      const errorMessage = error.message || 'Failed to create event. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  // Check if form is valid for submission
  const isFormValid = () => {
    return eventForm.title.trim().length >= 3 && 
           eventForm.description.trim().length >= 10 && 
           eventForm.start_time && 
           eventForm.end_time;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5B5FEF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading organizer tools...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Organizer Tools</Text>
      <Text style={styles.subtitle}>Create and manage your movements and events.</Text>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userGroups.length}</Text>
          <Text style={styles.statLabel}>Groups Led</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{userEvents.length}</Text>
          <Text style={styles.statLabel}>Events Created</Text>
        </View>
      </View>

      {/* Create New Group Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create a New Group</Text>
        <Text style={styles.cardDesc}>
          Start a new group and begin organizing for progress.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowCreateGroup(true)}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Create Group</Text>
        </TouchableOpacity>
      </View>

      {/* Create New Event Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create New Event</Text>
        <Text style={styles.cardDesc}>
          Organize a rally, meeting, training, or other activism event.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowCreateEvent(true)}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Create Event</Text>
        </TouchableOpacity>
      </View>

      {/* Manage Events Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Events ({userEvents.length})</Text>
        <Text style={styles.cardDesc}>
          Manage your upcoming events and view attendance.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => setShowManageEvents(true)}>
          <Ionicons name="settings-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Manage Events</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Modal */}
      <Modal visible={showCreateGroup} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Group Name"
              value={groupForm.name}
              onChangeText={(text) => setGroupForm({...groupForm, name: text})}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Group Description"
              multiline
              value={groupForm.description}
              onChangeText={(text) => setGroupForm({...groupForm, description: text})}
            />

            <View style={styles.checkboxRow}>
              <TouchableOpacity 
                style={styles.checkbox}
                onPress={() => setGroupForm({...groupForm, is_private: !groupForm.is_private})}
              >
                <Ionicons 
                  name={groupForm.is_private ? "checkbox-outline" : "square-outline"} 
                  size={20} 
                  color="#5B5FEF" 
                />
                <Text style={styles.checkboxLabel}>Private Group</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowCreateGroup(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
                <Text style={styles.createText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Enhanced Create Event Modal with Validation */}
      <Modal visible={showCreateEvent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              
              {/* Event Title with validation */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Event Title *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    eventForm.title.length > 0 && eventForm.title.length < 3 && styles.inputError,
                    eventForm.title.length >= 3 && styles.inputSuccess
                  ]}
                  placeholder="Event Title (minimum 3 characters)"
                  value={eventForm.title}
                  onChangeText={(text) => setEventForm({...eventForm, title: text})}
                  maxLength={100}
                />
                <Text style={[
                  styles.characterCount,
                  eventForm.title.length < 3 && eventForm.title.length > 0 && styles.characterCountError,
                  eventForm.title.length >= 3 && styles.characterCountSuccess
                ]}>
                  {eventForm.title.length}/100 characters (minimum 3)
                </Text>
              </View>
              
              {/* Event Description with validation */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Event Description *</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea,
                    eventForm.description.length > 0 && eventForm.description.length < 10 && styles.inputError,
                    eventForm.description.length >= 10 && styles.inputSuccess
                  ]}
                  placeholder="Describe your event (minimum 10 characters)"
                  multiline
                  value={eventForm.description}
                  onChangeText={(text) => setEventForm({...eventForm, description: text})}
                  maxLength={5000}
                />
                <Text style={[
                  styles.characterCount,
                  eventForm.description.length < 10 && eventForm.description.length > 0 && styles.characterCountError,
                  eventForm.description.length >= 10 && styles.characterCountSuccess
                ]}>
                  {eventForm.description.length}/5000 characters (minimum 10)
                </Text>
              </View>

              {/* Location field */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Location (Optional)</Text>
                <TextInput
                  style={[
                    styles.input,
                    eventForm.location_description.length > 500 && styles.inputError
                  ]}
                  placeholder="Location (e.g., City Hall Steps)"
                  value={eventForm.location_description}
                  onChangeText={(text) => setEventForm({...eventForm, location_description: text})}
                  maxLength={500}
                />
                <Text style={[
                  styles.characterCount,
                  eventForm.location_description.length > 500 && styles.characterCountError
                ]}>
                  {eventForm.location_description.length}/500 characters
                </Text>
              </View>

              {/* Validation Summary */}
              <View style={styles.validationSummary}>
                <Text style={styles.validationTitle}>Form Requirements:</Text>
                
                <View style={styles.validationItem}>
                  <Ionicons 
                    name={eventForm.title.length >= 3 ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={eventForm.title.length >= 3 ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[
                    styles.validationText,
                    eventForm.title.length >= 3 ? styles.validationSuccess : styles.validationError
                  ]}>
                    Title: {eventForm.title.length >= 3 ? 'Valid' : 'Too short (min 3 chars)'}
                  </Text>
                </View>
                
                <View style={styles.validationItem}>
                  <Ionicons 
                    name={eventForm.description.length >= 10 ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={eventForm.description.length >= 10 ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[
                    styles.validationText,
                    eventForm.description.length >= 10 ? styles.validationSuccess : styles.validationError
                  ]}>
                    Description: {eventForm.description.length >= 10 ? 'Valid' : 'Too short (min 10 chars)'}
                  </Text>
                </View>
                
                <View style={styles.validationItem}>
                  <Ionicons 
                    name={eventForm.start_time ? "checkmark-circle" : "close-circle"} 
                    size={16} 
                    color={eventForm.start_time ? "#4CAF50" : "#F44336"} 
                  />
                  <Text style={[
                    styles.validationText,
                    eventForm.start_time ? styles.validationSuccess : styles.validationError
                  ]}>
                    Dates: {eventForm.start_time ? 'Set' : 'Use quick date buttons below'}
                  </Text>
                </View>
              </View>



              {/* Quick Date Selection */}
              <Text style={styles.inputLabel}>Quick Date Options:</Text>
              <View style={styles.quickDateRow}>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => {
                    const startTime = generateDateString(7, 14);  // 7 days, 2 PM
                    const endTime = generateDateString(7, 18);    // 7 days, 6 PM
                    setEventForm({
                      ...eventForm,
                      start_time: startTime,
                      end_time: endTime
                    });
                  }}
                >
                  <Text style={styles.quickDateText}>Next Week</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => {
                    const startTime = generateDateString(14, 14);  // 14 days, 2 PM
                    const endTime = generateDateString(14, 18);    // 14 days, 6 PM
                    setEventForm({
                      ...eventForm,
                      start_time: startTime,
                      end_time: endTime
                    });
                  }}
                >
                  <Text style={styles.quickDateText}>2 Weeks</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => {
                    const startTime = generateDateString(30, 14);  // 30 days, 2 PM
                    const endTime = generateDateString(30, 18);    // 30 days, 6 PM
                    setEventForm({
                      ...eventForm,
                      start_time: startTime,
                      end_time: endTime
                    });
                  }}
                >
                  <Text style={styles.quickDateText}>Next Month</Text>
                </TouchableOpacity>
              </View>

              {/* Category Selection */}
              <Text style={styles.inputLabel}>Event Category:</Text>
              <View style={styles.categoryRow}>
                {['rally', 'meeting', 'training', 'action', 'fundraiser', 'social'].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryButton,
                      eventForm.category === cat && styles.categorySelected
                    ]}
                    onPress={() => setEventForm({...eventForm, category: cat})}
                  >
                    <Text style={[
                      styles.categoryText,
                      eventForm.category === cat && styles.categoryTextSelected
                    ]}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Group Selection - Always Show */}
              <Text style={styles.inputLabel}>Organizing Group (Optional):</Text>
              <View style={styles.groupSelection}>
                <TouchableOpacity
                  style={[
                    styles.groupOption,
                    !eventForm.organizing_group_id && styles.groupSelected
                  ]}
                  onPress={() => setEventForm({...eventForm, organizing_group_id: ''})}
                >
                  <Ionicons name="person-outline" size={16} color="#5B5FEF" />
                  <Text style={styles.groupOptionText}>Personal Event</Text>
                </TouchableOpacity>
                
                {userGroups.length > 0 ? (
                  userGroups.map((group) => (
                    <TouchableOpacity
                      key={group.id}
                      style={[
                        styles.groupOption,
                        eventForm.organizing_group_id === group.id.toString() && styles.groupSelected
                      ]}
                      onPress={() => setEventForm({...eventForm, organizing_group_id: group.id.toString()})}
                    >
                      <Ionicons name="people-outline" size={16} color="#5B5FEF" />
                      <Text style={styles.groupOptionText}>{group.name}</Text>
                      <Text style={styles.groupRoleText}>({group.role})</Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.noGroupsContainer}>
                    <Ionicons name="information-circle-outline" size={16} color="#999" />
                    <Text style={styles.noGroupsText}>
                      You don't lead any groups yet. Create a group first to organize group events.
                    </Text>
                  </View>
                )}
                
                {/* Quick Create Group Button */}
                <TouchableOpacity
                  style={styles.quickCreateGroupButton}
                  onPress={() => {
                    setShowCreateEvent(false);
                    setTimeout(() => setShowCreateGroup(true), 300);
                  }}
                >
                  <Ionicons name="add-circle-outline" size={16} color="#5B5FEF" />
                  <Text style={styles.quickCreateGroupText}>Create New Group</Text>
                </TouchableOpacity>
              </View>

              {/* Group Members Only Option - Only show if group is selected */}
              {eventForm.organizing_group_id && (
                <View style={styles.checkboxRow}>
                  <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setEventForm({...eventForm, group_members_only: !eventForm.group_members_only})}
                  >
                    <Ionicons 
                      name={eventForm.group_members_only ? "checkbox-outline" : "square-outline"} 
                      size={20} 
                      color="#5B5FEF" 
                    />
                    <Text style={styles.checkboxLabel}>Restrict to Group Members Only</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Modal Action Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => {
                    setShowCreateEvent(false);
                    // Reset form when canceling
                    setEventForm({
                      title: '', 
                      description: '', 
                      start_time: '', 
                      end_time: '',
                      location_description: '', 
                      organizing_group_id: '', 
                      category: 'other',
                      is_private: false, 
                      group_members_only: false
                    });
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.createButton,
                    !isFormValid() && styles.createButtonDisabled
                  ]} 
                  onPress={handleCreateEvent}
                  disabled={!isFormValid()}
                >
                  <Text style={[
                    styles.createText,
                    !isFormValid() && styles.createTextDisabled
                  ]}>
                    Create Event
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Manage Events Modal */}
      <Modal visible={showManageEvents} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Your Events</Text>
            
            <ScrollView style={styles.eventsList}>
              {userEvents.length > 0 ? (
                userEvents.map((event) => (
                  <View key={event.id} style={styles.eventItem}>
                    <Text style={styles.eventItemTitle}>{event.title}</Text>
                    <Text style={styles.eventItemDate}>{formatEventDate(event.start_time)}</Text>
                    <Text style={styles.eventItemAttendees}>
                      {event.participant_count || 0} attending
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noEventsText}>No events created yet</Text>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowManageEvents(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Base styles
  container: { padding: 16, backgroundColor: '#F5F5F5', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5B5FEF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  
  // Stats section
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    justifyContent: 'space-around',
  },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#5B5FEF' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  
  // Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#666', marginBottom: 10 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B5FEF',
    paddingVertical: 10,
    justifyContent: 'center',
    borderRadius: 6,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScrollContent: {
    maxHeight: '90%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  // Enhanced input styles
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 4,
    fontSize: 14,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  
  // Character count and validation styles
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  characterCountError: {
    color: '#F44336',
  },
  characterCountSuccess: {
    color: '#4CAF50',
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  inputSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  
  // Validation summary styles
  validationSummary: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginVertical: 10,
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  validationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  validationText: {
    fontSize: 12,
    marginLeft: 8,
  },
  validationSuccess: {
    color: '#4CAF50',
  },
  validationError: {
    color: '#F44336',
  },

  
  // Checkbox styles
  checkboxRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
  },
  
  // Quick date button styles
  quickDateRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickDateButton: {
    backgroundColor: '#E8EAFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  quickDateText: {
    color: '#5B5FEF',
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Category selection styles
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  categorySelected: {
    backgroundColor: '#5B5FEF',
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  
  // Group selection styles
  groupSelection: {
    marginBottom: 16,
  },
  groupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginBottom: 8,
  },
  groupSelected: {
    borderColor: '#5B5FEF',
    backgroundColor: '#E8EAFF',
  },
  groupOptionText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  groupRoleText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noGroupsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginBottom: 8,
  },
  noGroupsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  quickCreateGroupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#5B5FEF',
    borderStyle: 'dashed',
    borderRadius: 6,
    backgroundColor: '#F8F9FF',
  },
  quickCreateGroupText: {
    fontSize: 12,
    color: '#5B5FEF',
    marginLeft: 6,
    fontWeight: '500',
  },
  
  // Modal button styles
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  createButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#5B5FEF',
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#CCC',
  },
  cancelText: {
    color: '#666',
  },
  createText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  createTextDisabled: {
    color: '#999',
  },
  
  // Close button styles
  closeButton: {
    backgroundColor: '#5B5FEF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  closeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  // Events list styles
  eventsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  eventItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: '#F9F9F9',
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  eventItemDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  eventItemAttendees: {
    fontSize: 12,
    color: '#5B5FEF',
    marginTop: 2,
  },
  noEventsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
    padding: 20,
  },
});

export default OrganizerScreen;