// src/screens/main/ProfileScreen.js - Original Working Version
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import ApiService from '../../services/Api';

const ProfileScreen = ({ navigation }) => {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    eventsJoined: 0,
    groupsJoined: 0,
    resourcesSaved: 0,
  });
  
  // Profile data (combines user data with editable fields)
  const [profile, setProfile] = useState({
    name: '',
    username: '',
    bio: '',
    location: '',
    joinedDate: '',
    privacy_level: 'standard',
    notifications: true,
    locationSharing: true,
  });

  // Load user data and stats on component mount
  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
  try {
    setLoading(true);
    
    // Load user's groups with proper error handling
    const groupsResponse = await ApiService.getMyGroups({ limit: 50 });
    
    let groupsCount = 0;
    if (groupsResponse && groupsResponse.success && groupsResponse.data && groupsResponse.data.groups) {
      groupsCount = groupsResponse.data.groups.length;
      console.log('✅ Groups loaded:', groupsCount);
    } else {
      console.log('⚠️ No groups found or API error');
    }
    
    setStats({
      eventsJoined: 0, // TODO: Implement when event participants are tracked
      groupsJoined: groupsCount,
      resourcesSaved: 0, // TODO: Implement saved resources
    });

    // Set profile data safely
    if (user) {
      setProfile({
        name: user.display_name || user.username || '',
        username: `@${user.username}` || '',
        bio: user.bio || 'Passionate about making a difference!',
        location: user.location || 'Location not set',
        joinedDate: user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { 
          month: 'long', 
          year: 'numeric' 
        }) : 'Recently',
        privacy_level: user.privacy_level || 'standard',
        notifications: true,
        locationSharing: true,
      });
    }
  } catch (error) {
    console.error('❌ Error loading profile data:', error);
    // Set default values on error
    setStats({
      eventsJoined: 0,
      groupsJoined: 0,
      resourcesSaved: 0,
    });
  } finally {
    setLoading(false);
  }
};
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      
      // Prepare update data (only fields that can be updated via API)
      const updateData = {
        display_name: profile.name,
        bio: profile.bio,
        privacy_level: profile.privacy_level,
      };

      console.log('Saving profile data:', updateData); // Debug log

      const response = await updateProfile(updateData);
      
      console.log('Profile update response:', response); // Debug log
      
      if (response.success) {
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
        // Reload profile data to ensure fresh data
        await loadProfileData();
      } else {
        console.error('Profile update failed:', response);
        Alert.alert('Error', response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Navigation will be handled automatically by AuthContext
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const getPrivacyDisplayText = (level) => {
    switch (level) {
      case 'public': return 'Public - Visible to everyone';
      case 'standard': return 'Standard - Visible to group members';
      case 'private': return 'Private - Hidden profile';
      default: return 'Standard - Visible to group members';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5B5FEF" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="arrow-back-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileTop}>
            <View style={styles.avatarBox}>
              <Ionicons name="person" size={32} color="#5B5FEF" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.username}>{profile.username}</Text>
              <Text style={styles.location}>
                <Ionicons name="location-outline" size={14} color="#777" /> {profile.location}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.editButton} 
              onPress={() => {
                console.log('Edit/Save button pressed, isEditing:', isEditing); // Debug log
                return isEditing ? handleSaveProfile() : setIsEditing(true);
              }}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#5B5FEF" />
              ) : (
                <>
                  <Ionicons 
                    name={isEditing ? "checkmark-outline" : "create-outline"} 
                    size={16} 
                    color="#5B5FEF" 
                  />
                  <Text style={styles.editText}>{isEditing ? 'Save' : 'Edit'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ marginTop: 12 }}>
            <Text style={styles.sectionTitle}>Bio</Text>
            {isEditing ? (
              <TextInput
                style={styles.bioInput}
                multiline
                value={profile.bio}
                onChangeText={(text) => setProfile({ ...profile, bio: text })}
                placeholder="Tell others about your activism interests..."
              />
            ) : (
              <Text style={styles.bioText}>{profile.bio}</Text>
            )}
          </View>

          <Text style={styles.joined}>Member since {profile.joinedDate}</Text>
        </View>

        {/* Activity Stats */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Your Activity</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.eventsJoined}</Text>
              <Text style={styles.statLabel}>Events Joined</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.groupsJoined}</Text>
              <Text style={styles.statLabel}>Groups</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.resourcesSaved}</Text>
              <Text style={styles.statLabel}>Resources Saved</Text>
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy & Safety</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Profile visibility</Text>
            <TouchableOpacity 
              style={styles.settingInput}
              onPress={() => {
                if (isEditing) {
                  Alert.alert(
                    'Profile Visibility',
                    'Choose who can see your profile',
                    [
                      { text: 'Public', onPress: () => setProfile({...profile, privacy_level: 'public'}) },
                      { text: 'Standard', onPress: () => setProfile({...profile, privacy_level: 'standard'}) },
                      { text: 'Private', onPress: () => setProfile({...profile, privacy_level: 'private'}) },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }
              }}
            >
              <Text style={styles.settingInputText}>
                {getPrivacyDisplayText(profile.privacy_level)}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location sharing</Text>
            <Switch 
              value={profile.locationSharing} 
              onValueChange={(value) => setProfile({...profile, locationSharing: value})}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Event notifications</Text>
            <Switch 
              value={profile.notifications} 
              onValueChange={(value) => setProfile({...profile, notifications: value})}
            />
          </View>
        </View>

        {/* Logout Button */}
        <View style={styles.card}>
          <TouchableOpacity style={styles.logoutButtonFull} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#F44336" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    backgroundColor: '#5B5FEF',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 12,
  },
  logoutButton: {
    padding: 4,
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
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    elevation: 2,
  },
  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarBox: {
    backgroundColor: '#E0E7FF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  username: {
    color: '#5B5FEF',
  },
  location: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#5B5FEF',
    borderWidth: 1,
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 60,
    justifyContent: 'center',
  },
  editText: {
    color: '#5B5FEF',
    marginLeft: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  bioText: {
    color: '#444',
  },
  bioInput: {
    borderColor: '#CCC',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    textAlignVertical: 'top',
    height: 80,
    color: '#333',
  },
  joined: {
    marginTop: 12,
    fontSize: 12,
    color: '#888',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B5FEF',
  },
  statLabel: {
    fontSize: 12,
    color: '#555',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  settingLabel: {
    color: '#333',
    fontSize: 14,
    flex: 1,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: 200,
    height: 36,
    justifyContent: 'center',
  },
  settingInputText: {
    fontSize: 12,
    color: '#333',
  },
  logoutButtonFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
  },
  logoutButtonText: {
    color: '#F44336',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ProfileScreen;