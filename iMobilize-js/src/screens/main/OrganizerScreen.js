// src/screens/main/OrganizerScreen.js - Enhanced with API Integration
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
        ApiService.getEvents({ limit: 50, status: 'upcoming' }) // We'll filter organizer events client-side for now
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

  const handleCreateEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.description.trim()) {
      Alert.alert('Error', 'Title and description are required');
      return;
    }

    if (!eventForm.start_time || !eventForm.end_time) {
      Alert.alert('Error', 'Please set start and end times');
      return;
    }

    try {
      // Create event data
      const eventData = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        start_time: eventForm.start_time,
        end_time: eventForm.end_time,
        location_description: eventForm.location_description.trim(),
        category: eventForm.category,
        is_private: eventForm.is_private,
        organizing_group_id: eventForm.organizing_group_id || null,
        group_members_only: eventForm.group_members_only
      };

      const response = await ApiService.createEvent(eventData);

      if (response.success) {
        Alert.alert('Success', 'Event created successfully!');
        setShowCreateEvent(false);
        setEventForm({
          title: '', description: '', start_time: '', end_time: '',
          location_description: '', organizing_group_id: '', category: 'other',
          is_private: false, group_members_only: false
        });
        await loadOrganizerData();
      } else {
        Alert.alert('Error', response.message || 'Failed to create event');
      }
    } catch (error) {
      console.error('Create event error:', error);
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return 'No date set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  const generateDateString = (daysFromNow, hour = 14) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
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

      {/* Create New Group */}
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

      {/* Create New Event */}
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

      {/* Manage Events */}
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

      {/* Create Event Modal */}
      <Modal visible={showCreateEvent} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create New Event</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Event Title"
                value={eventForm.title}
                onChangeText={(text) => setEventForm({...eventForm, title: text})}
              />
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Event Description"
                multiline
                value={eventForm.description}
                onChangeText={(text) => setEventForm({...eventForm, description: text})}
              />

              <TextInput
                style={styles.input}
                placeholder="Location (e.g., City Hall Steps)"
                value={eventForm.location_description}
                onChangeText={(text) => setEventForm({...eventForm, location_description: text})}
              />

              {/* Quick date buttons */}
              <Text style={styles.inputLabel}>Quick Date Options:</Text>
              <View style={styles.quickDateRow}>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => setEventForm({
                    ...eventForm,
                    start_time: generateDateString(7),
                    end_time: generateDateString(7, 18)
                  })}
                >
                  <Text style={styles.quickDateText}>Next Week</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => setEventForm({
                    ...eventForm,
                    start_time: generateDateString(14),
                    end_time: generateDateString(14, 18)
                  })}
                >
                  <Text style={styles.quickDateText}>2 Weeks</Text>
                </TouchableOpacity>
              </View>

              {/* Category Selection */}
              <Text style={styles.inputLabel}>Event Category:</Text>
              <View style={styles.categoryRow}>
                {['rally', 'meeting', 'training', 'action'].map((cat) => (
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

              {/* Group Selection */}
              {userGroups.length > 0 && (
                <>
                  <Text style={styles.inputLabel}>Organizing Group (Optional):</Text>
                  <View style={styles.groupSelection}>
                    <TouchableOpacity
                      style={[
                        styles.groupOption,
                        !eventForm.organizing_group_id && styles.groupSelected
                      ]}
                      onPress={() => setEventForm({...eventForm, organizing_group_id: ''})}
                    >
                      <Text style={styles.groupOptionText}>Personal Event</Text>
                    </TouchableOpacity>
                    {userGroups.map((group) => (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.groupOption,
                          eventForm.organizing_group_id === group.id.toString() && styles.groupSelected
                        ]}
                        onPress={() => setEventForm({...eventForm, organizing_group_id: group.id.toString()})}
                      >
                        <Text style={styles.groupOptionText}>{group.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setShowCreateEvent(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createButton} onPress={handleCreateEvent}>
                  <Text style={styles.createText}>Create Event</Text>
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
  container: { padding: 16, backgroundColor: '#F5F5F5', flex: 1 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5B5FEF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  
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
  
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
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
  },
  quickDateText: {
    color: '#5B5FEF',
    fontSize: 12,
  },
  
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
  
  groupSelection: {
    marginBottom: 16,
  },
  groupOption: {
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
  },
  
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
  cancelText: {
    color: '#666',
  },
  createText: {
    color: '#fff',
    fontWeight: 'bold',
  },
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
  },
  eventItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
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