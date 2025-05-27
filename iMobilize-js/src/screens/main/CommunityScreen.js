import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const movementsData = [
  {
    id: 1,
    name: 'Bellingham Climate Activists',
    description: 'Building a sustainable future through environmental justice.',
    members: 1247,
    category: 'environment',
    isFollowing: true
  },
  {
    id: 2,
    name: "Bellingham Housing Coalition",
    description: 'Fighting for affordable housing and tenant rights.',
    members: 892,
    category: 'housing',
    isFollowing: false
  },
  {
    id: 3,
    name: 'Western Academic Workers United',
    description: 'Fair wages and working conditions for ALL academic workers at WWU',
    members: 543,
    category: 'labor',
    isFollowing: true
  },
  {
    id: 4,
    name: 'WA Racial Justice Coalition',
    description: 'We Work towards racial equity by educating each other and uniting to take action!',
    members: 1856,
    category: 'justice',
    isFollowing: false
  }
];

const CommunityScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const filteredMovements = movementsData.filter((movement) => {
    const matchesSearch =
      movement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      selectedFilter === 'all' || movement.category === selectedFilter;
    return matchesSearch && matchesFilter;
  });

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
            <TouchableOpacity style={styles.followButton}>
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