import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    featureColor: '#4CAF50',
  },
  {
    id: '2',
    title: 'Housing for All - Protest & Teach-In',
    movement: "People's Housing Coalition",
    location: 'Downtown Library',
    date: 'May 3',
    feature: 'Encrypted Group Chat Available',
    featureIcon: 'lock-closed-outline',
    featureColor: '#2196F3',
  },
  {
    id: '3',
    title: 'Workers Rights Fair',
    movement: 'Western Academic Workers United',
    location: 'Red Square',
    date: 'May 10',
    feature: 'Accessible Protest Options',
    featureIcon: 'heart-outline',
    featureColor: '#9C27B0',
  },
];

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>iMobilize</Text>
      </View>

      <ScrollView style={styles.scrollView}>
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
              <Text style={styles.statNumber}>5 Events</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={24} color="#5B5FEF" />
              <Text style={styles.statNumber}>8 Movements</Text>
            </View>
          </View>
        </View>

        {/* Activist Feed Section */}
        <View style={styles.feedContainer}>
          <Text style={styles.feedTitle}>Your Activist Feed</Text>
          <Text style={styles.feedSubtitle}>
            Stay updated with events from movements you follow.
          </Text>

          {/* Event Cards */}
          {mockEvents.map((event) => (
            <View key={event.id} style={styles.eventCard}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMovement}>
                Movement: {event.movement}
              </Text>

              <View style={styles.eventDetail}>
                <Ionicons name="location-outline" size={16} color="#666" />
                <Text style={styles.eventDetailText}>{event.location}</Text>
              </View>

              <View style={styles.eventDetail}>
                <Ionicons name="calendar-outline" size={16} color="#666" />
                <Text style={styles.eventDetailText}>{event.date}</Text>
              </View>

              <View style={styles.eventDetail}>
                <Ionicons 
                  name={event.featureIcon} 
                  size={16} 
                  color={event.featureColor} 
                />
                <Text 
                  style={[
                    styles.eventFeatureText, 
                    { color: event.featureColor }
                  ]}
                >
                  {event.feature}
                </Text>
              </View>

              <View style={styles.eventActions}>
                <TouchableOpacity style={styles.moreInfoButton}>
                  <Text style={styles.moreInfoText}>More Info</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinText}>Join</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Safety Alert Banner */}
          <View style={styles.safetyAlert}>
            <Ionicons name="alert-circle-outline" size={20} color="#4CAF50" />
            <Text style={styles.safetyAlertText}>Safety alerts and resources available for all events</Text>
          </View>
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
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
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
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5B5FEF',
    marginBottom: 5,
  },
  eventMovement: {
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
  eventFeatureText: {
    fontSize: 14,
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