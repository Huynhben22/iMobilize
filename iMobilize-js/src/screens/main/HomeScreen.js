import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header, Card, Button } from '../../common';
import { CommonStyles, Colors } from '../../styles';
import { homeStyles } from '../../styles/screens';

// Mock data
const mockEvents = [
  {
    id: '1',
    title: 'Local Climate March',
    movement: 'Bellingham Climate Activists',
    location: 'Waypoint Park',
    date: 'April 27',
    feature: 'Safety Buddies Available',
    featureIcon: 'shield-checkmark-outline',
    featureColor: Colors.success,
  },
  {
    id: '2',
    title: 'Housing for All - Protest & Teach-In',
    movement: "People's Housing Coalition",
    location: 'Downtown Library',
    date: 'May 3',
    feature: 'Encrypted Group Chat Available',
    featureIcon: 'lock-closed-outline',
    featureColor: Colors.info,
  },
  {
    id: '3',
    title: 'Workers Rights Fair',
    movement: 'Western Academic Workers United',
    location: 'Red Square',
    date: 'May 10',
    feature: 'Accessible Protest Options',
    featureIcon: 'heart-outline',
    featureColor: Colors.purple,
  },
];

const HomeScreen = () => {
  const renderDashboard = () => (
    <View style={homeStyles.dashboardContainer}>
      <View style={homeStyles.dashboardHeader}>
        <Text style={homeStyles.dashboardTitle}>YOUR DASHBOARD</Text>
        <TouchableOpacity>
          <Text style={homeStyles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={homeStyles.statsContainer}>
        <View style={homeStyles.statItem}>
          <Ionicons name="calendar-outline" size={24} color={Colors.primary} />
          <Text style={homeStyles.statNumber}>5 Events</Text>
        </View>
        <View style={homeStyles.statItem}>
          <Ionicons name="people-outline" size={24} color={Colors.primary} />
          <Text style={homeStyles.statNumber}>8 Movements</Text>
        </View>
      </View>
    </View>
  );

  const renderEventCard = (event) => (
    <Card key={event.id} style={homeStyles.eventCard}>
      <Text style={homeStyles.eventTitle}>{event.title}</Text>
      <Text style={homeStyles.eventMovement}>
        Movement: {event.movement}
      </Text>

      <View style={homeStyles.eventDetail}>
        <Ionicons name="location-outline" size={16} color={Colors.textSecondary} />
        <Text style={homeStyles.eventDetailText}>{event.location}</Text>
      </View>

      <View style={homeStyles.eventDetail}>
        <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
        <Text style={homeStyles.eventDetailText}>{event.date}</Text>
      </View>

      <View style={homeStyles.eventDetail}>
        <Ionicons 
          name={event.featureIcon} 
          size={16} 
          color={event.featureColor} 
        />
        <Text 
          style={[
            homeStyles.eventFeatureText, 
            { color: event.featureColor }
          ]}
        >
          {event.feature}
        </Text>
      </View>

      <View style={homeStyles.eventActions}>
        <TouchableOpacity style={homeStyles.moreInfoButton}>
          <Text style={homeStyles.moreInfoText}>More Info</Text>
        </TouchableOpacity>
        <TouchableOpacity style={homeStyles.joinButton}>
          <Text style={homeStyles.joinText}>Join</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderActivistFeed = () => (
    <View style={homeStyles.feedContainer}>
      <Text style={homeStyles.feedTitle}>Your Activist Feed</Text>
      <Text style={homeStyles.feedSubtitle}>
        Stay updated with events from movements you follow.
      </Text>

      {mockEvents.map(renderEventCard)}

      {/* Safety Alert Banner */}
      <View style={homeStyles.safetyAlert}>
        <Ionicons name="alert-circle-outline" size={20} color={Colors.success} />
        <Text style={homeStyles.safetyAlertText}>
          Safety alerts and resources available for all events
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <Header title="iMobilize" />
      
      <ScrollView style={homeStyles.scrollView}>
        {renderDashboard()}
        {renderActivistFeed()}
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;