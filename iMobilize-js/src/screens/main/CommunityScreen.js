// src/screens/main/CommunityScreen.js - Minimal API Integration
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../../services/Api';

const CommunityScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all groups and user's groups
      const [allGroupsResponse, myGroupsResponse] = await Promise.all([
        ApiService.getGroups({ limit: 50 }),
        ApiService.getMyGroups({ limit: 50 })
      ]);

      if (allGroupsResponse.success) {
        setGroups(allGroupsResponse.data.groups || []);
      }

      if (myGroupsResponse.success) {
        setMyGroups(myGroupsResponse.data.groups || []);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId, groupName) => {
    try {
      const response = await ApiService.joinGroup(groupId);
      
      if (response.success) {
        Alert.alert('Success', `Joined "${groupName}"!`);
        loadData(); // Refresh data
      } else {
        Alert.alert('Error', response.message || 'Failed to join group');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to join group');
    }
  };

  // Convert API groups to match original data structure
  const convertedGroups = groups.map(group => ({
    id: group.id,
    name: group.name,
    description: group.description || 'No description available.',
    members: group.member_count || 0,
    category: getCategoryFromGroup(group),
    isFollowing: myGroups.some(myGroup => myGroup.id === group.id)
  }));

  function getCategoryFromGroup(group) {
  if (!group.name && !group.description) return 'other';
  
  const text = (
    (group.name || '') + ' ' + 
    (group.description || '')
  ).toLowerCase();
  
  if (text.includes('climate') || text.includes('environment') || text.includes('green')) {
    return 'environment';
  }
  if (text.includes('housing') || text.includes('rent') || text.includes('affordable')) {
    return 'housing';
  }
  if (text.includes('worker') || text.includes('labor') || text.includes('union')) {
    return 'labor';
  }
  if (text.includes('justice') || text.includes('rights') || text.includes('equality')) {
    return 'justice';
  }
  
  return 'other'; // Default category for unknown
}

  const filteredMovements = convertedGroups.filter((movement) => {
    const matchesSearch =
      movement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === 'all' || movement.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#5B5FEF" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading communities...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>Discover and join new movements</Text>

      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search movements..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.input}
        />
      </View>

      <View style={styles.filterRow}>
        {['all', 'environment', 'housing', 'labor', 'justice'].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterButton,
              selectedFilter === cat && styles.filterSelected,
            ]}
            onPress={() => setSelectedFilter(cat)}
          >
            <Text style={[
              styles.filterText,
              selectedFilter === cat && styles.filterTextSelected
            ]}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredMovements.map((movement) => (
        <View key={movement.id} style={styles.card}>
          <Text style={styles.cardTitle}>{movement.name}</Text>
          <Text style={styles.cardDesc}>{movement.description}</Text>
          <Text style={styles.cardMeta}>
            {movement.members.toLocaleString()} members • {movement.category}
          </Text>
          <View style={styles.cardButtons}>
            <TouchableOpacity 
              style={styles.followButton}
              onPress={() => handleJoinGroup(movement.id, movement.name)}
            >
              <Text style={styles.followText}>
                {movement.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => navigation.navigate('MovementPage', { movement })}
            >
              <Text style={styles.viewText}>View Movement</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {filteredMovements.length === 0 && (
        <View style={styles.noResults}>
          <Text style={styles.noResultsText}>No movements found.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#F5F5F5', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5B5FEF' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    elevation: 1,
  },
  input: { flex: 1, fontSize: 14 },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  filterSelected: { backgroundColor: '#5B5FEF' },
  filterText: { color: '#333', fontSize: 12 },
  filterTextSelected: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#666', marginBottom: 4 },
  cardMeta: { fontSize: 12, color: '#999', marginBottom: 8 },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  followButton: {
    backgroundColor: '#E8EAFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  followText: { color: '#5B5FEF', fontWeight: 'bold' },
  viewButton: {
    backgroundColor: '#5B5FEF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  viewText: { color: '#fff', fontWeight: 'bold' },
  noResults: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  noResultsText: { color: '#999' },
});

export default CommunityScreen;