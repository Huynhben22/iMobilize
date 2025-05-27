import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const OrganizerScreen = () => {
  const handleCreateMovement = () => {
    alert('Create movement modal or screen goes here');
  };

  const handleManageMovements = () => {
    alert('Manage movements screen goes here');
  };

  const handleManageEvents = () => {
    alert('Manage existing events screen goes here');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Organizer Tools</Text>
      <Text style={styles.subtitle}>Create and manage your movements and events.</Text>

      {/* Create New Movement */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Create a New Movement</Text>
        <Text style={styles.cardDesc}>
          Start a new movement and begin organizing for progress.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleCreateMovement}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Create Movement</Text>
        </TouchableOpacity>
      </View>

      {/* Manage Existing Movements */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Manage Your Movements</Text>
        <Text style={styles.cardDesc}>
          Interact with members, post updates, and add resources to movements you organize.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleManageMovements}>
          <Ionicons name="settings-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Manage Movements</Text>
        </TouchableOpacity>
      </View>

      {/* Event Manager*/}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Event Manager</Text>
        <Text style={styles.cardDesc}>
          Create, edit, or cancel your upcoming events.
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={handleManageEvents}>
          <Ionicons name="calendar-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Manage Events</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#F5F5F5' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5B5FEF', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
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
});

export default OrganizerScreen;