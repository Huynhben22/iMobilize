import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const EventViewScreen = ({ navigation, route }) => {
  // In a real implementation, event data would come from route.params or API
  const [event] = useState({
    id: 1,
    title: "Climate Action Rally - Save Our Planet",
    description: "Join us for a peaceful demonstration calling for immediate climate action. We'll gather to demand stronger environmental policies and raise awareness about the climate crisis affecting our community. Bring signs, friends, and your voice for change!",
    start_time: "2024-07-15T14:00:00Z",
    end_time: "2024-07-15T17:00:00Z",
    location_description: "City Hall Steps, Downtown",
    location_address: "123 Government St, Downtown, City",
    organizer_username: "climate_warriors",
    organizer_name: "Climate Warriors Coalition",
    organizing_group_name: "Environmental Justice Alliance",
    organizing_group_id: 5,
    category: "rally",
    participant_count: 247,
    is_private: false,
    group_members_only: false,
    safety_guidelines: [
      "Peaceful demonstration only - no violence",
      "Stay hydrated and bring water",
      "Follow local authorities' instructions",
      "Emergency contact: (555) 123-4567"
    ],
    resources: [
      "Climate Action Toolkit",
      "How to Make Effective Signs",
      "Know Your Rights Guide"
    ],
    tags: ["climate", "environment", "rally", "peaceful"],
    created_at: "2024-06-20T10:00:00Z"
  });

  const [isFollowing, setIsFollowing] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      other: 'calendar-outline'
    };
    return icons[category] || 'calendar-outline';
  };

  const getCategoryColor = (category) => {
    const colors = {
      rally: '#FF6B6B',
      meeting: '#4ECDC4',
      training: '#45B7D1',
      action: '#FFA07A',
      fundraiser: '#98D8C8',
      social: '#F7DC6F',
      other: '#5B5FEF'
    };
    return colors[category] || '#5B5FEF';
  };

  const handleJoinEvent = () => {
    if (hasJoined) {
      Alert.alert('Already Joined', 'You have already joined this event!');
    } else {
      setHasJoined(true);
      Alert.alert('Success! 🎉', 'You have successfully joined the event!');
    }
  };

  const handleFollowEvent = () => {
    setIsFollowing(!isFollowing);
    Alert.alert(
      isFollowing ? 'Unfollowed' : 'Following!', 
      isFollowing 
        ? 'You will no longer receive updates for this event.' 
        : 'You will receive updates about this event.'
    );
  };

  const handleReportEvent = () => {
    Alert.alert(
      'Report Event',
      'Are you sure you want to report this event? This action will be reviewed by our moderation team.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Report', 
          style: 'destructive',
          onPress: () => Alert.alert('Reported', 'Thank you for your report. We will review this event.')
        }
      ]
    );
  };

  const handleShareEvent = async () => {
  try {
    await Share.share({
      message: `Join me at "${event.title}" on ${formatEventDate(event.start_time)} at ${event.location_description}. Let's make a difference together!`
    });
  } catch (error) {
    console.error('Error sharing event:', error);
  }
};

  const navigateToCommunity = () => {
    if (event.organizing_group_id) {
      navigation.navigate('CommunityViewScreen', { 
        movement: event.organizing_group_id
      });
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
          <Ionicons name="arrow-back" size={24} color="#5B5FEF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleShareEvent}>
          <Ionicons name="share-outline" size={24} color="#5B5FEF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Event Header Card */}
        <View style={styles.eventHeaderCard}>
          <View style={styles.categoryBadge}>
            <Ionicons 
              name={getCategoryIcon(event.category)} 
              size={16} 
              color={getCategoryColor(event.category)} 
            />
            <Text style={[styles.categoryText, { color: getCategoryColor(event.category) }]}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
            </Text>
          </View>
          
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          <View style={styles.participantInfo}>
            <Ionicons name="people-outline" size={16} color="#666" />
            <Text style={styles.participantText}>
              {event.participant_count} people attending
            </Text>
          </View>
        </View>

        {/* Date & Time Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="calendar-outline" size={20} color="#5B5FEF" />
            <Text style={styles.infoTitle}>Date & Time</Text>
          </View>
          <Text style={styles.infoContent}>
            <Text style={styles.infoLabel}>Starts: </Text>
            {formatEventDate(event.start_time)}
          </Text>
          <Text style={styles.infoContent}>
            <Text style={styles.infoLabel}>Ends: </Text>
            {formatEventDate(event.end_time)}
          </Text>
        </View>

        {/* Location Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="location-outline" size={20} color="#5B5FEF" />
            <Text style={styles.infoTitle}>Location</Text>
          </View>
          <Text style={styles.infoContent}>{event.location_description}</Text>
          {event.location_address && (
            <Text style={styles.addressText}>{event.location_address}</Text>
          )}
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons name="map-outline" size={16} color="#5B5FEF" />
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        </View>

        {/* Organizer Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#5B5FEF" />
            <Text style={styles.infoTitle}>Organized By</Text>
          </View>
          
          {event.organizing_group_name && (
            <TouchableOpacity 
              style={styles.organizerRow}
              onPress={navigateToCommunity}
            >
              <View style={styles.organizerInfo}>
                <Text style={styles.organizerName}>{event.organizing_group_name}</Text>
                <Text style={styles.organizerSubtext}>Community Group</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          )}
          
          <View style={styles.organizerRow}>
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerName}>{event.organizer_name}</Text>
              <Text style={styles.organizerSubtext}>@{event.organizer_username}</Text>
            </View>
          </View>
        </View>

        {/* Description Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="document-text-outline" size={20} color="#5B5FEF" />
            <Text style={styles.infoTitle}>About This Event</Text>
          </View>
          <Text style={styles.descriptionText}>{event.description}</Text>
        </View>

        {/* Safety Guidelines Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
            <Text style={[styles.infoTitle, { color: '#4CAF50' }]}>Safety Guidelines</Text>
          </View>
          {event.safety_guidelines.map((guideline, index) => (
            <View key={index} style={styles.guidelineRow}>
              <Text style={styles.guidelineBullet}>•</Text>
              <Text style={styles.guidelineText}>{guideline}</Text>
            </View>
          ))}
        </View>

        {/* Resources Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="library-outline" size={20} color="#5B5FEF" />
            <Text style={styles.infoTitle}>Resources</Text>
          </View>
          {event.resources.map((resource, index) => (
            <TouchableOpacity key={index} style={styles.resourceRow}>
              <Ionicons name="document-outline" size={16} color="#5B5FEF" />
              <Text style={styles.resourceText}>{resource}</Text>
              <Ionicons name="download-outline" size={16} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {event.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>

        {/* Report Button */}
        <TouchableOpacity style={styles.reportButton} onPress={handleReportEvent}>
          <Ionicons name="flag-outline" size={16} color="#FF6B6B" />
          <Text style={styles.reportText}>Report Event</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomActionBar}>
        <TouchableOpacity 
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleFollowEvent}
        >
          <Ionicons 
            name={isFollowing ? "notifications" : "notifications-outline"} 
            size={16} 
            color={isFollowing ? "#fff" : "#5B5FEF"} 
          />
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.joinButton, hasJoined && styles.joinedButton]}
          onPress={handleJoinEvent}
          disabled={hasJoined}
        >
          <Ionicons 
            name={hasJoined ? "checkmark-circle" : "add-circle-outline"} 
            size={16} 
            color="#fff" 
          />
          <Text style={styles.joinButtonText}>
            {hasJoined ? 'Joined ✓' : 'Join Event'}
          </Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  shareButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  eventHeaderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#F8F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    lineHeight: 30,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  infoContent: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  addressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginBottom: 8,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FF',
    borderRadius: 6,
    marginTop: 8,
  },
  mapButtonText: {
    fontSize: 12,
    color: '#5B5FEF',
    marginLeft: 4,
    fontWeight: '500',
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  organizerInfo: {
    flex: 1,
  },
  organizerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  organizerSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  guidelineRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  guidelineBullet: {
    fontSize: 14,
    color: '#4CAF50',
    marginRight: 8,
    fontWeight: 'bold',
  },
  guidelineText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  resourceText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#E8EAFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#5B5FEF',
    fontWeight: '500',
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 80,
  },
  reportText: {
    fontSize: 14,
    color: '#FF6B6B',
    marginLeft: 6,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#5B5FEF',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  followingButton: {
    backgroundColor: '#5B5FEF',
    borderColor: '#5B5FEF',
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5B5FEF',
    marginLeft: 4,
  },
  followingButtonText: {
    color: '#fff',
  },
  joinButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginLeft: 8,
    backgroundColor: '#5B5FEF',
    borderRadius: 8,
  },
  joinedButton: {
    backgroundColor: '#4CAF50',
  },
  joinButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 4,
  },
});

export default EventViewScreen;