// src/screens/main/CommunityScreen.js - FIXED Navigation to CommunityViewScreen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Alert, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../../services/Api';

const CommunityScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load data on component mount and when screen comes into focus
  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🏠 CommunityScreen focused - refreshing data...');
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('📊 Loading community data...');
      
      // Load all groups and user's groups in parallel
      const [allGroupsResponse, myGroupsResponse] = await Promise.all([
        ApiService.getGroups({ limit: 50 }),
        ApiService.getMyGroups({ limit: 50 })
      ]);

      if (allGroupsResponse && allGroupsResponse.success) {
        console.log('✅ Loaded', allGroupsResponse.data.groups?.length || 0, 'total groups');
        setGroups(allGroupsResponse.data.groups || []);
      } else {
        console.log('⚠️ Failed to load all groups:', allGroupsResponse?.message);
      }

      if (myGroupsResponse && myGroupsResponse.success) {
        console.log('✅ Loaded', myGroupsResponse.data.groups?.length || 0, 'user groups');
        setMyGroups(myGroupsResponse.data.groups || []);
      } else {
        console.log('⚠️ Failed to load user groups:', myGroupsResponse?.message);
      }
      
    } catch (error) {
      console.error('❌ Error loading community data:', error);
      Alert.alert('Error', 'Failed to load community data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleJoinGroup = async (groupId, groupName) => {
    try {
      console.log('🤝 Joining group:', groupName, '(ID:', groupId, ')');
      
      const response = await ApiService.joinGroup(groupId);
      
      if (response && response.success) {
        Alert.alert('Success! 🎉', `Joined "${groupName}"!`);
        console.log('✅ Successfully joined group');
        
        // Immediately refresh data to show updated membership
        await loadData();
      } else {
        console.log('❌ Failed to join group:', response?.message);
        Alert.alert('Error', response?.message || 'Failed to join group');
      }
    } catch (error) {
      console.error('❌ Join group error:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    }
  };

  // 🔥 FIXED: Navigate to CommunityViewScreen with proper movement data
  const handleViewGroup = (group) => {
    console.log('🔍 Navigating to group view:', group.name, 'ID:', group.id);
    
    // Ensure we pass all the required movement data
    const movementData = {
      id: group.id,
      name: group.name,
      description: group.description || 'No description available.',
      members: group.member_count || 0,
      category: getCategoryFromGroup(group),
      isFollowing: myGroups.some(myGroup => myGroup.id === group.id),
      isPrivate: group.is_private || false,
      createdAt: group.created_at,
      userRole: myGroups.find(myGroup => myGroup.id === group.id)?.role || null
    };
    
    console.log('📤 Passing movement data:', movementData);
    
    navigation.navigate('CommunityViewScreen', { 
      movement: movementData 
    });
  };

  // Enhanced group categorization
  function getCategoryFromGroup(group) {
    if (!group.name && !group.description) return 'other';
    
    const text = (
      (group.name || '') + ' ' + 
      (group.description || '')
    ).toLowerCase();
    
    // More comprehensive category detection
    if (text.includes('climate') || text.includes('environment') || text.includes('green') || 
        text.includes('sustainability') || text.includes('renewable') || text.includes('carbon')) {
      return 'environment';
    }
    if (text.includes('housing') || text.includes('rent') || text.includes('affordable') || 
        text.includes('homeless') || text.includes('tenant')) {
      return 'housing';
    }
    if (text.includes('worker') || text.includes('labor') || text.includes('union') || 
        text.includes('wage') || text.includes('employment')) {
      return 'labor';
    }
    if (text.includes('justice') || text.includes('rights') || text.includes('equality') || 
        text.includes('civil') || text.includes('discrimination') || text.includes('racial')) {
      return 'justice';
    }
    if (text.includes('education') || text.includes('school') || text.includes('student') || 
        text.includes('university') || text.includes('learning')) {
      return 'education';
    }
    
    return 'other';
  }

  // Convert API groups to display format with enhanced data
  const convertedGroups = groups.map(group => {
    const isUserMember = myGroups.some(myGroup => myGroup.id === group.id);
    const userGroup = myGroups.find(myGroup => myGroup.id === group.id);
    
    return {
      id: group.id,
      name: group.name,
      description: group.description || 'No description available.',
      members: group.member_count || 0,
      category: getCategoryFromGroup(group),
      isFollowing: isUserMember,
      userRole: userGroup?.role || null,
      isPrivate: group.is_private || false,
      createdAt: group.created_at,
      // Add more metadata for better display
      hasRecentActivity: group.updated_at && new Date(group.updated_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      // Include original group data for navigation
      originalGroup: group
    };
  });

  // Enhanced filtering with search
  const filteredMovements = convertedGroups.filter((movement) => {
    const matchesSearch = !searchTerm || 
      movement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.description.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesFilter = selectedFilter === 'all' || movement.category === selectedFilter;
    
    return matchesSearch && matchesFilter;
  });

  // Sort groups: user's groups first, then by member count
  const sortedMovements = filteredMovements.sort((a, b) => {
    if (a.isFollowing && !b.isFollowing) return -1;
    if (!a.isFollowing && b.isFollowing) return 1;
    return b.members - a.members; // Then by member count
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#5B5FEF']}
          tintColor="#5B5FEF"
        />
      }
    >
      <Text style={styles.title}>Community</Text>
      <Text style={styles.subtitle}>
        Discover and join new movements • {myGroups.length} groups joined
      </Text>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search movements..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          style={styles.input}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All', icon: 'apps-outline' },
          { key: 'environment', label: 'Environment', icon: 'leaf-outline' },
          { key: 'housing', label: 'Housing', icon: 'home-outline' },
          { key: 'labor', label: 'Labor', icon: 'people-outline' },
          { key: 'justice', label: 'Justice', icon: 'scale-outline' },
          { key: 'education', label: 'Education', icon: 'school-outline' }
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterButton,
              selectedFilter === filter.key && styles.filterSelected,
            ]}
            onPress={() => setSelectedFilter(filter.key)}
          >
            <Ionicons 
              name={filter.icon} 
              size={14} 
              color={selectedFilter === filter.key ? '#fff' : '#666'} 
            />
            <Text style={[
              styles.filterText,
              selectedFilter === filter.key && styles.filterTextSelected
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results Summary */}
      {searchTerm && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {sortedMovements.length} result{sortedMovements.length !== 1 ? 's' : ''} 
            {searchTerm ? ` for "${searchTerm}"` : ''}
          </Text>
        </View>
      )}

      {/* Group Cards */}
      {sortedMovements.map((movement) => (
        <View key={movement.id} style={[
          styles.card,
          movement.isFollowing && styles.cardFollowing
        ]}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>{movement.name}</Text>
              {movement.isPrivate && (
                <Ionicons name="lock-closed-outline" size={16} color="#666" />
              )}
              {movement.hasRecentActivity && (
                <View style={styles.activityBadge}>
                  <Text style={styles.activityText}>Active</Text>
                </View>
              )}
            </View>
            
            {movement.isFollowing && (
              <View style={styles.memberBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
                <Text style={styles.memberText}>
                  {movement.userRole ? movement.userRole : 'Member'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.cardDesc}>{movement.description}</Text>
          
          {/* Card Meta */}
          <View style={styles.cardMetaRow}>
            <View style={styles.cardMeta}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.cardMetaText}>
                {movement.members.toLocaleString()} members
              </Text>
            </View>
            
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>
                {movement.category}
              </Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.cardButtons}>
            <TouchableOpacity 
              style={[
                styles.followButton,
                movement.isFollowing && styles.followingButton
              ]}
              onPress={() => handleJoinGroup(movement.id, movement.name)}
              disabled={movement.isFollowing}
            >
              <Ionicons 
                name={movement.isFollowing ? "checkmark" : "add"} 
                size={14} 
                color={movement.isFollowing ? "#4CAF50" : "#5B5FEF"} 
              />
              <Text style={[
                styles.followText,
                movement.isFollowing && styles.followingText
              ]}>
                {movement.isFollowing ? 'Joined' : 'Join'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleViewGroup(movement.originalGroup || movement)}
            >
              <Text style={styles.viewText}>View Details</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Empty State */}
      {sortedMovements.length === 0 && (
        <View style={styles.noResults}>
          <Ionicons name="search-outline" size={48} color="#CCC" />
          <Text style={styles.noResultsText}>
            {searchTerm ? 'No movements found' : 'No movements available'}
          </Text>
          <Text style={styles.noResultsSubtext}>
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : 'Check back later for new communities'}
          </Text>
        </View>
      )}

      {/* Bottom Padding */}
      <View style={{ height: 20 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: '#F5F5F5', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#5B5FEF' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  
  // Search bar
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
  
  // Filter buttons
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: '#eee',
    gap: 4,
  },
  filterSelected: { backgroundColor: '#5B5FEF' },
  filterText: { color: '#666', fontSize: 12 },
  filterTextSelected: { color: '#fff' },
  
  // Results header
  resultsHeader: {
    marginBottom: 12,
  },
  resultsText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  
  // Enhanced card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#E0E0E0',
  },
  cardFollowing: {
    borderLeftColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  
  cardHeader: {
    marginBottom: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    flex: 1,
    color: '#333'
  },
  
  memberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  memberText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  
  activityBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activityText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  
  cardDesc: { 
    fontSize: 14, 
    color: '#666', 
    marginBottom: 12,
    lineHeight: 20,
  },
  
  cardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: { 
    fontSize: 12, 
    color: '#666' 
  },
  
  categoryTag: {
    backgroundColor: '#E8EAFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 11,
    color: '#5B5FEF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  
  // Button styles
  cardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8EAFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  followingButton: {
    backgroundColor: '#E8F5E9',
  },
  followText: { 
    color: '#5B5FEF', 
    fontWeight: 'bold',
    fontSize: 13,
  },
  followingText: {
    color: '#4CAF50',
  },
  
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#5B5FEF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
    flex: 1,
    justifyContent: 'center',
  },
  viewText: { 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 13,
  },
  
  // Empty state
  noResults: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginTop: 20,
  },
  noResultsText: { 
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
    marginTop: 12,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 4,
    textAlign: 'center',
  },
});

export default CommunityScreen;