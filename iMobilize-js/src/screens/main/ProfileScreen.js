import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Switch,
  TextInput
} from 'react-native';
import { User, MapPin, Edit, ArrowLeft } from 'lucide-react';

const ProfileScreen = ({ navigation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    username: '@jd_activist',
    bio: 'Passionate about environmental justice and mutual aid!',
    location: 'Bellingham, WA',
    joinedDate: 'March 2024',
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.card}>
          <View style={styles.profileTop}>
            <View style={styles.avatarBox}>
              <User size={32} color="#5B5FEF" />
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.username}>{profile.username}</Text>
              <Text style={styles.location}>
                <MapPin size={14} color="#777" /> {profile.location}
              </Text>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(!isEditing)}>
              <Edit size={16} color="#5B5FEF" />
              <Text style={styles.editText}>Edit</Text>
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
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Events Joined</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Movements</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>24</Text>
              <Text style={styles.statLabel}>Resources Saved</Text>
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Privacy & Safety</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Profile visibility</Text>
            <TextInput style={styles.settingInput} placeholder="Followed Community Members Only" />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Location sharing</Text>
            <Switch value={true} />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Event notifications</Text>
            <Switch value={true} />
          </View>
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
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
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
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 6,
    paddingHorizontal: 8,
    width: 140,
    height: 36,
    fontSize: 14,
  },
});

export default ProfileScreen;