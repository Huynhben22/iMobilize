import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CommunityViewScreen = ({ route, navigation }) => {
  const { movement } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed');
  const [isFollowing, setIsFollowing] = useState(movement?.isFollowing || false);
  const [joinedEvents, setJoinedEvents] = useState([]);

  const feedData = {
    announcements: [
      {
        id: 1,
        author: 'Climate Action Organizers',
        content: "Important update: Our next rally has been moved to City Hall Plaza due to increased attendance expectations. We're expecting over 500 participants!",
        timestamp: '2 hours ago',
        type: 'announcement',
        pinned: true,
      },
      {
        id: 2,
        author: 'Sarah Chen - Lead Organizer',
        content: "Thank you to everyone who attended last week's workshop! We had 150+ attendees and raised $2,400 for renewable energy advocacy. Together, we're making a real difference.",
        timestamp: '1 day ago',
        type: 'update',
        likes: 42,
        comments: 8,
      },
      {
        id: 3,
        author: 'Climate Action Team',
        content: "Reminder: Volunteer training session this Saturday at 10 AM. We'll cover protest safety, effective messaging, and community outreach strategies.",
        timestamp: '2 days ago',
        type: 'announcement',
      },
    ],
    events: [
      {
        id: 1,
        title: 'Climate Action Rally',
        location_description: 'City Hall Plaza, Downtown',
        start_time: '2025-06-15T14:00:00Z',
        participant_count: 487,
        category: 'rally',
        organizing_group_name: 'Climate Action Coalition',
        description: 'Join us for a peaceful demonstration calling for immediate climate action legislation.',
      },
      {
        id: 2,
        title: 'Renewable Energy Workshop',
        location_description: 'Community Center, Room 205',
        start_time: '2025-06-20T18:00:00Z',
        participant_count: 23,
        category: 'training',
        organizing_group_name: 'Climate Action Coalition',
        description: 'Learn about solar panel installation and home energy efficiency.',
      },
      {
        id: 3,
        title: 'Green Tech Fundraiser',
        location_description: 'Riverside Park Pavilion',
        start_time: '2025-06-25T16:00:00Z',
        participant_count: 156,
        category: 'fundraiser',
        organizing_group_name: 'Climate Action Coalition',
        description: 'Community gathering to raise funds for local green technology initiatives.',
      },
    ],
    resources: [
      {
        id: 1,
        title: 'Climate Action Toolkit',
        description: 'Comprehensive guide to organizing effective climate advocacy campaigns.',
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
        title: 'Peaceful Protest Safety Guidelines',
        description: 'Essential safety information for all participants in peaceful demonstrations.',
        type: 'safety',
        downloadUrl: '#',
      },
      {
        id: 4,
        title: 'Climate Science Facts & Figures',
        description: 'Latest scientific data and statistics to support your advocacy efforts.',
        type: 'data',
        downloadUrl: '#',
      },
    ],
  };

  const onRefresh = async () => {
    setRefreshing(true);
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

  const handleJoinEvent = (eventId, eventTitle) => {
    if (!joinedEvents.includes(eventId)) {
      setJoinedEvents([...joinedEvents, eventId]);
      Alert.alert('Success! 🎉', `You have successfully joined "${eventTitle}"!`);
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
            <Text style={styles.sectionTitle}>Movement Events</Text>
            {feedData.events.map((event) => (
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
                  <Text style={styles.eventDetailText}>{event.participant_count} attending</Text>
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
            onPress={() => setActiveTab('events')}
          >
            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>
              Events
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