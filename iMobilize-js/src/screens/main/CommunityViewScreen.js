// src/screens/main/CommunityViewScreen.js - FIXED with Safe Parameter Handling
import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../../services/Api';

const CommunityViewScreen = ({ route, navigation }) => {
  // 🔥 FIXED: Safe parameter extraction with fallback
  const movement = route?.params?.movement || {
    id: null,
    name: 'Unknown Group',
    description: 'No description available.',
    members: 0,
    category: 'other',
    isFollowing: false
  };

  console.log('🏠 CommunityViewScreen loaded with movement:', movement);

  // Early return if no valid movement ID
  if (!movement.id) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Group Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#F44336" />
          <Text style={styles.errorText}>Group not found</Text>
          <Text style={styles.errorSubtext}>Unable to load group information.</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [isFollowing, setIsFollowing] = useState(movement?.isFollowing || false);
  const [joinedEvents, setJoinedEvents] = useState([]);
  
  // State for real API data
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  // Mock data for announcements and resources
  const feedData = {
    announcements: [
      {
        id: 1,
        author: `${movement.name} Organizers`,
        content: `Important update: Our group has been growing rapidly! We now have ${movement.members} members working together for positive change.`,
        timestamp: '2 hours ago',
        type: 'announcement',
        pinned: true,
      },
      {
        id: 2,
        author: 'Lead Organizer',
        content: "Thank you to everyone who has joined our movement! Together, we're making a real difference in our community.",
        timestamp: '1 day ago',
        type: 'update',
        likes: 42,
        comments: 8,
      },
      {
        id: 3,
        author: `${movement.name} Team`,
        content: "Check out our latest events and join us in making positive change happen!",
        timestamp: '2 days ago',
        type: 'announcement',
      },
    ],
    resources: [
      {
        id: 1,
        title: 'Community Action Toolkit',
        description: 'Comprehensive guide to organizing effective community advocacy campaigns.',
        type: 'guide',
        downloadUrl: '#',
      },
      {
        id: 2,
        title: 'Local Representatives Contact List',
        description: 'Contact information for city council members and state representatives.',
        type: 'contact',
        downloadUrl: '#',
      },
      {
        id: 3,
        title: 'Peaceful Action Safety Guidelines',
        description: 'Essential safety information for all participants in peaceful demonstrations.',
        type: 'safety',
        downloadUrl: '#',
      },
      {
        id: 4,
        title: 'Latest Research & Data',
        description: 'Current statistics and research to support your advocacy efforts.',
        type: 'data',
        downloadUrl: '#',
      },
    ],
  };

  // Load events when component mounts or movement changes
  useEffect(() => {
    if (movement && movement.id) {
      loadGroupEvents();
    }
  }, [movement]);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 CommunityViewScreen focused - refreshing events...');
      if (movement && movement.id) {
        loadGroupEvents();
      }
    }, [movement])
  );

  // Load real events from API
  const loadGroupEvents = async () => {
    try {
      setLoadingEvents(true);
      setEventsError(null);
      
      console.log('📅 Loading events for group:', movement.id, movement.name);
      
      // Use the group events API endpoint
      const response = await ApiService.getGroupEvents(movement.id, {
        limit: 20,
        status: 'upcoming'
      });
      
      if (response && response.success) {
        console.log('✅ Loaded', response.data.events?.length || 0, 'group events');
        setEvents(response.data.events || []);
      } else {
        console.log('⚠️ Failed to load group events:', response?.message);
        setEventsError(response?.message || 'Failed to load events');
        setEvents([]);
      }
      
    } catch (error) {
      console.error('❌ Error loading group events:', error);
      setEventsError('Unable to load events. Please try again.');
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    
    // Refresh events when user pulls to refresh
    if (activeTab === 'events' && movement && movement.id) {
      await loadGroupEvents();
    }
    
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      isFollowing ? 'Unfollowed' : 'Following!',
      isFollowing
        ? `You have unfollowed ${movement.name}`
        : `You are now following ${movement.name}`
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${movement.name} on iMobilize! ${movement.description}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleReport = () => {
    Alert.alert(
      'Report Movement',
      'Are you sure you want to report this movement? This action will be reviewed by our moderation team.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          style: 'destructive',
          onPress: () => Alert.alert('Reported', 'Thank you for your report. We will review this movement.'),
        },
      ]
    );
  };

  // Handle joining events with API
  const handleJoinEvent = async (eventId, eventTitle) => {
    try {
      console.log('🎫 Joining event:', eventTitle, '(ID:', eventId, ')');
      
      const response = await ApiService.joinEvent(eventId);
      
      if (response && response.success) {
        setJoinedEvents([...joinedEvents, eventId]);
        Alert.alert('Success! 🎉', `You have successfully joined "${eventTitle}"!`);
        
        // Refresh events to get updated participant count
        await loadGroupEvents();
      } else {
        // Handle "already participating" silently
        if (response?.message?.includes('already participating')) {
          setJoinedEvents([...joinedEvents, eventId]);
          console.log('✅ Event marked as already joined');
        } else {
          Alert.alert('Error', response?.message || 'Failed to join event');
        }
      }
    } catch (error) {
      console.error('❌ Join event error:', error);
      Alert.alert('Error', 'Failed to join event. Please try again.');
    }
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCategoryIcon = (category) => {
    const icons = {
      rally: 'megaphone-outline',
      meeting: 'people-outline',
      training: 'school-outline',
      action: 'flash-outline',
      fundraiser: 'card-outline',
      social: 'heart-outline',
      other: 'calendar-outline',
    };
    return icons[category] || 'calendar-outline';
  };

  const getResourceIcon = (type) => {
    const icons = {
      guide: 'book-outline',
      contact: 'call-outline',
      safety: 'shield-checkmark-outline',
      data: 'bar-chart-outline',
      other: 'document-outline',
    };
    return icons[type] || 'document-outline';
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <View>
            <Text style={styles.sectionTitle}>Recent Updates</Text>
            {feedData.announcements.map((announcement) => (
              <View
                key={announcement.id}
                style={[
                  styles.announcementCard,
                  ...(announcement.pinned ? [styles.pinnedCard] : []),
                ]}
              >
                {announcement.pinned && (
                  <View style={styles.pinnedBanner}>
                    <Ionicons name="push-outline" size={16} color="#FF9800" />
                    <Text style={styles.pinnedText}>Pinned</Text>
                  </View>
                )}
                <View style={styles.announcementHeader}>
                  <Text style={styles.announcementAuthor}>{announcement.author}</Text>
                  <Text style={styles.announcementTime}>{announcement.timestamp}</Text>
                </View>
                <Text style={styles.announcementContent}>{announcement.content}</Text>
                {announcement.likes && (
                  <View style={styles.announcementStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="heart-outline" size={16} color="#666" />
                      <Text style={styles.statText}>{announcement.likes}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={16} color="#666" />
                      <Text style={styles.statText}>{announcement.comments}</Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        );
      case 'events':
        return (
          <View>
            <View style={styles.eventsHeader}>
              <Text style={styles.sectionTitle}>Group Events</Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={loadGroupEvents}
                disabled={loadingEvents}
              >
                {loadingEvents ? (
                  <ActivityIndicator size="small" color="#5B5FEF" />
                ) : (
                  <Ionicons name="refresh-outline" size={20} color="#5B5FEF" />
                )}
              </TouchableOpacity>
            </View>
            
            {/* Loading State */}
            {loadingEvents && events.length === 0 && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5B5FEF" />
                <Text style={styles.loadingText}>Loading events...</Text>
              </View>
            )}
            
            {/* Error State */}
            {eventsError && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={24} color="#F44336" />
                <Text style={styles.errorText}>{eventsError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={loadGroupEvents}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Events List */}
            {!loadingEvents && !eventsError && events.length > 0 && (
              <>
                {events.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      <Ionicons name={getCategoryIcon(event.category)} size={20} color="#5B5FEF" />
                    </View>
                    <Text style={styles.eventDescription}>{event.description}</Text>
                    <View style={styles.eventDetail}>
                      <Ionicons name="location-outline" size={16} color="#666" />
                      <Text style={styles.eventDetailText}>{event.location_description}</Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.eventDetailText}>{formatEventDate(event.start_time)}</Text>
                    </View>
                    <View style={styles.eventDetail}>
                      <Ionicons name="people-outline" size={16} color="#666" />
                      <Text style={styles.eventDetailText}>{event.participant_count || 0} attending</Text>
                    </View>
                    <View style={styles.eventActions}>
                      <TouchableOpacity
                        style={styles.moreInfoButton}
                        onPress={() => navigation.navigate('EventViewScreen', { event })}
                      >
                        <Text style={styles.moreInfoText}>More Info</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.joinButton,
                          joinedEvents.includes(event.id) && styles.joinedButton,
                        ]}
                        onPress={() => handleJoinEvent(event.id, event.title)}
                        disabled={joinedEvents.includes(event.id)}
                      >
                        <Text
                          style={[
                            styles.joinText,
                            joinedEvents.includes(event.id) && styles.joinedText,
                          ]}
                        >
                          {joinedEvents.includes(event.id) ? 'Joined ✓' : 'Join'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </>
            )}
            
            {/* Empty State */}
            {!loadingEvents && !eventsError && events.length === 0 && (
              <View style={styles.emptyEventsContainer}>
                <Ionicons name="calendar-outline" size={48} color="#CCC" />
                <Text style={styles.emptyEventsText}>No Events Yet</Text>
                <Text style={styles.emptyEventsSubtext}>
                  This group hasn't organized any events yet. Check back later!
                </Text>
              </View>
            )}
          </View>
        );
      case 'resources':
        return (
          <View>
            <Text style={styles.sectionTitle}>Movement Resources</Text>
            {feedData.resources.map((resource) => (
              <View key={resource.id} style={styles.resourceCard}>
                <View style={styles.resourceHeader}>
                  <Ionicons name={getResourceIcon(resource.type)} size={24} color="#5B5FEF" />
                  <View style={styles.resourceInfo}>
                    <Text style={styles.resourceTitle}>{resource.title}</Text>
                    <Text style={styles.resourceDescription}>{resource.description}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons name="download-outline" size={16} color="#5B5FEF" />
                  <Text style={styles.downloadText}>Access</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {movement.name}
        </Text>
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Movement Info */}
        <View style={styles.movementInfoContainer}>
          <View style={styles.movementHeader}>
            <Text style={styles.movementTitle}>{movement.name}</Text>
            <View style={styles.movementMeta}>
              <Ionicons name="people-outline" size={16} color="#666" />
              <Text style={styles.movementMetaText}>
                {movement.members?.toLocaleString() || '0'} members
              </Text>
              <Text style={styles.categoryTag}>
                {movement.category || 'general'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.movementDescription}>{movement.description}</Text>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.followButton,
                isFollowing && styles.followingButton
              ]}
              onPress={handleFollow}
            >
              <Ionicons 
                name={isFollowing ? "checkmark" : "add"} 
                size={16} 
                color={isFollowing ? "#4CAF50" : "white"} 
              />
              <Text style={[
                styles.followButtonText,
                isFollowing && styles.followingButtonText
              ]}>
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.reportButton}
              onPress={handleReport}
            >
              <Ionicons name="flag-outline" size={16} color="#F44336" />
              <Text style={styles.reportButtonText}>Report</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'feed' && styles.activeTab]}
            onPress={() => setActiveTab('feed')}
          >
            <Text style={[styles.tabText, activeTab === 'feed' && styles.activeTabText]}>
              Feed
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'events' && styles.activeTab]}
            onPress={() => {
              setActiveTab('events');
              // Load events when switching to events tab
              if (movement && movement.id) {
                loadGroupEvents();
              }
            }}
          >
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Events {events.length > 0 && `(${events.length})`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'resources' && styles.activeTab]}
            onPress={() => setActiveTab('resources')}
          >
            <Text style={[styles.tabText, activeTab === 'resources' && styles.activeTabText]}>
              Resources
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {renderTabContent()}
        </View>

        {/* Safety Banner */}
        <View style={styles.safetyAlert}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
          <Text style={styles.safetyAlertText}>
            This movement follows iMobilize community guidelines for peaceful action
          </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  shareButton: {
    marginLeft: 15,
  },
  scrollView: {
    flex: 1,
  },
  
  // 🔥 NEW: Error container styles
  errorContainer: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FFEBEE',
    borderRadius: 10,
    margin: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  movementInfoContainer: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 10,
  },
  movementHeader: {
    marginBottom: 10,
  },
  movementTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5B5FEF',
    marginBottom: 5,
  },
  movementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  movementMetaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
    marginRight: 10,
  },
  categoryTag: {
    backgroundColor: '#E8EAFF',
    color: '#5B5FEF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 12,
    fontWeight: '500',
  },
  movementDescription: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  followButton: {
    flex: 1,
    backgroundColor: '#5B5FEF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 10,
  },
  followingButton: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  followButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  followingButtonText: {
    color: '#4CAF50',
  },
  reportButton: {
    backgroundColor: '#FFEBEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  reportButtonText: {
    color: '#F44336',
    fontSize: 14,
    marginLeft: 5,
  },
  tabContainer: {
    backgroundColor: 'white',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#5B5FEF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#5B5FEF',
    fontWeight: 'bold',
  },
  tabContent: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#5B5FEF',
    marginBottom: 15,
  },
  
  // Events-specific styles
  eventsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  emptyEventsContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyEventsText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
    marginTop: 12,
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Existing styles (announcements, events, resources)
  announcementCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#5B5FEF',
  },
  pinnedCard: {
    backgroundColor: '#FFF8E1',
    borderLeftColor: '#FF9800',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  pinnedText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  announcementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  announcementAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5B5FEF',
  },
  announcementTime: {
    fontSize: 12,
    color: '#999',
  },
  announcementContent: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  announcementStats: {
    flexDirection: 'row',
    marginTop: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  eventCard: {
    backgroundColor: '#F9F9F9',
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
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B5FEF',
    flex: 1,
    marginRight: 10,
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
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
  },
  joinedText: {
    color: 'white',
  },
  resourceCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resourceInfo: {
    marginLeft: 15,
    flex: 1,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  resourceDescription: {
    fontSize: 14,
    color: '#666',
  },
  downloadButton: {
    backgroundColor: '#E8EAFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  downloadText: {
    color: '#5B5FEF',
    fontSize: 14,
    marginLeft: 5,
  },
  safetyAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 10,
    margin: 15,
    marginBottom: 80,
  },
  safetyAlertText: {
    color: '#4CAF50',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

export default CommunityViewScreen;