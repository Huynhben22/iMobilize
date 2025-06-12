// src/screens/main/HomeScreen.js - Enhanced with API Integration
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/Api';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const HomeScreen = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [joinedEvents, setJoinedEvents] = useState(new Set());
  const [mapMarkers, setMapMarkers] = useState([]);

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load multiple data sources in parallel
      const [eventsResponse, groupsResponse, notificationsResponse, mapResponse] = await Promise.all([
        ApiService.getEvents({ limit: 10, status: 'upcoming' }),
        ApiService.getMyGroups({ limit: 10 }),
        ApiService.getNotifications({ limit: 5, unread_only: true }),
        ApiService.getEvents({status: 'upcoming'})
      ]);

      if (eventsResponse.success) {
        setEvents(eventsResponse.data.events || []);
      }

      if (groupsResponse.success) {
        setUserGroups(groupsResponse.data.groups || []);
      }

      if (notificationsResponse.success) {
        setNotifications(notificationsResponse.data.notifications || []);
      }

      if (mapResponse.success)
      {
        setMapMarkers(mapResponse.data.events || []);
      }

    } catch (error) {
      console.error('Dashboard data loading error:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleJoinEvent = async (eventId) => {
    try {
      console.log('🎫 Attempting to join event:', eventId);
      
      const response = await ApiService.joinEvent(eventId);
      
      if (response && response.success) {
        // Add to joined events
        setJoinedEvents(prev => new Set([...prev, eventId]));
        Alert.alert('Success! 🎉', 'You have successfully joined the event!');
        await loadDashboardData();
      } else {
        Alert.alert('Error', response?.message || 'Failed to join event');
      }
    } catch (error) {
      console.error('❌ Join event error:', error);
      
      const errorMessage = error.message || '';
      
      // If already participating, mark as joined (no error message)
      if (errorMessage.includes('already participating')) {
        setJoinedEvents(prev => new Set([...prev, eventId]));
        console.log('✅ Event marked as already joined');
      } else {
        Alert.alert('Error', errorMessage || 'Unable to join event. Please try again.');
      }
    }
  };

  const icon = L.icon({
    iconSize: [25, 41],
    iconAnchor: [10, 41],
    popupAnchor: [2, -40],
    iconUrl: "https://unpkg.com/leaflet@1.6/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.6/dist/images/marker-shadow.png"
  });

  function PopulateMarkers() {
    return mapMarkers.map((mapMarkers) => {
      return <Marker key={mapMarkers.id} position={[mapMarkers.latitude, mapMarkers.longitude]} icon={icon}>
        <Popup>
          <Text>{mapMarkers.title}<br/>{mapMarkers.description}<br/>{mapMarkers.start_time} - {mapMarkers.end_time}</Text>
        </Popup>
      </Marker>;
    });
  }

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventFeature = (event) => {
    // Determine special features based on event data
    if (event.organizing_group_id) {
      return {
        text: 'Group Organized',
        icon: 'people-outline',
        color: '#2196F3'
      };
    }
    
    if (event.is_private) {
      return {
        text: 'Private Event',
        icon: 'lock-closed-outline',
        color: '#FF9800'
      };
    }

    if (event.category === 'rally') {
      return {
        text: 'Public Rally',
        icon: 'megaphone-outline',
        color: '#4CAF50'
      };
    }

    if (event.category === 'training') {
      return {
        text: 'Educational Workshop',
        icon: 'school-outline',
        color: '#9C27B0'
      };
    }

    return {
      text: 'Open Event',
      icon: 'calendar-outline',
      color: '#5B5FEF'
    };
  };

  const getCategoryIcon = (category) => {
    const icons = {
      rally: 'megaphone-outline',
      meeting: 'people-outline',
      training: 'school-outline',
      action: 'flash-outline',
      fundraiser: 'card-outline',
      social: 'heart-outline',
      other: 'calendar-outline'
    };
    return icons[category] || 'calendar-outline';
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerText}>iMobilize</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B5FEF" />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>iMobilize</Text>
        {notifications.length > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{notifications.length}</Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>
            Welcome back, {user?.display_name || user?.username}!
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={loadDashboardData} style={styles.retryButton}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dashboard Section */}
        <View style={styles.dashboardContainer}>
          <View style={styles.dashboardHeader}>
            <Text style={styles.dashboardTitle}>YOUR DASHBOARD</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={24} color="#5B5FEF" />
              <Text style={styles.statNumber}>{events.length} Events</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={24} color="#5B5FEF" />
              <Text style={styles.statNumber}>{userGroups.length} Groups</Text>
            </View>
            {notifications.length > 0 && (
              <View style={styles.statItem}>
                <Ionicons name="notifications-outline" size={24} color="#FF9800" />
                <Text style={styles.statNumber}>{notifications.length} Alerts</Text>
              </View>
            )}
          </View>
        </View>


        {/* Upcoming Events Section */}
        <View style={styles.feedContainer}>
          <Text style={styles.feedTitle}>Upcoming Events</Text>
          <Text style={styles.feedSubtitle}>
            {events.length > 0 
              ? "Discover and join activism events in your area." 
              : "No upcoming events found. Check back later!"}
          </Text>

          {/* Event Cards */}
          {events.length > 0 ? (
            events.map((event) => {
              const feature = getEventFeature(event);
              
              return (
                <View key={event.id} style={styles.eventCard}>
                  <View style={styles.eventHeader}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Ionicons 
                      name={getCategoryIcon(event.category)} 
                      size={20} 
                      color="#5B5FEF" 
                    />
                  </View>

                  {event.organizing_group_name && (
                    <Text style={styles.eventMovement}>
                      Organized by: {event.organizing_group_name}
                    </Text>
                  )}

                  {event.location_description && (
                    <View style={styles.eventDetail}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.eventDetailText}>{event.location_description}</Text>
                    </View>
                  )}

                  <View style={styles.eventDetail}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.eventDetailText}>
                      {formatEventDate(event.start_time)}
                    </Text>
                  </View>

                  <View style={styles.eventDetail}>
                    <Ionicons name="people-outline" size={16} color="#666" />
                    <Text style={styles.eventDetailText}>
                      {event.participant_count || 0} attending
                    </Text>
                  </View>

                  <View style={styles.eventDetail}>
                    <Ionicons 
                      name={feature.icon} 
                      size={16} 
                      color={feature.color} 
                    />
                    <Text 
                      style={[
                        styles.eventFeatureText, 
                        { color: feature.color }
                      ]}
                    >
                      {feature.text}
                    </Text>
                  </View>

                  <View style={styles.eventActions}>
                    <TouchableOpacity style={styles.moreInfoButton}>
                      <Text style={styles.moreInfoText}>More Info</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[
                        styles.joinButton,
                        joinedEvents.has(event.id) && styles.joinedButton
                      ]}
                      onPress={() => handleJoinEvent(event.id)}
                      disabled={joinedEvents.has(event.id)}
                    >
                      <Text style={[
                        styles.joinText,
                        joinedEvents.has(event.id) && styles.joinedText
                      ]}>
                        {joinedEvents.has(event.id) ? 'Joined ✓' : 'Join'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No events available</Text>
              <Text style={styles.emptyStateSubtext}>
                Check back later or create your own event!
              </Text>
            </View>
          )}

          {/* Safety Alert Banner */}
          <View style={styles.safetyAlert}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
            <Text style={styles.safetyAlertText}>
              Safety protocols and resources available for all events
            </Text>
          </View>

          <MapContainer style={{ height: '500px', width: '100%' }} center={[48.7343, -122.4866]} zoom={13} scrollWheelZoom={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <PopulateMarkers/>
          </MapContainer>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    height: 60,
    backgroundColor: '#5B5FEF',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  notificationBadge: {
    position: 'absolute',
    right: 15,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  welcomeContainer: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  welcomeText: {
    fontSize: 16,
    color: '#5B5FEF',
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    marginLeft: 10,
    color: '#F44336',
    fontSize: 14,
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  dashboardContainer: {
    backgroundColor: 'white',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dashboardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5B5FEF',
  },
  viewAllText: {
    fontSize: 12,
    color: '#5B5FEF',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    padding: 10,
  },
  statNumber: {
    marginTop: 5,
    fontSize: 14,
    color: '#333',
  },
  feedContainer: {
    padding: 15,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B5FEF',
    marginBottom: 5,
  },
  feedSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 5,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B5FEF',
    flex: 1,
    marginRight: 10,
  },
  eventMovement: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  eventDetailText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  eventFeatureText: {
    fontSize: 14,
    marginLeft: 5,
    fontWeight: '500',
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  moreInfoButton: {
    backgroundColor: '#E8EAFF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  moreInfoText: {
    color: '#5B5FEF',
    fontSize: 14,
  },
  joinButton: {
    backgroundColor: '#5B5FEF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  joinText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinedButton: {
  backgroundColor: '#4CAF50',
  paddingVertical: 8,
  paddingHorizontal: 20,
  borderRadius: 5,
  },
  joinedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 5,
    textAlign: 'center',
  },
  safetyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    marginBottom: 80,
  },
  safetyAlertText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 5,
  },
});

export default HomeScreen;