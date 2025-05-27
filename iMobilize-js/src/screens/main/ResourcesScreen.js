import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const resources = [
  {
    id: 1,
    title: 'Protest Safety Guide',
    description: 'Learn how to stay safe at protests and large public events.',
    link: 'https://protestsafety.org/',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 2,
    title: 'Know Your Rights',
    description: 'Understand your rights when interacting with police.',
    link: 'https://www.aclu.org/know-your-rights',
    icon: 'document-outline',
  },
  {
    id: 3,
    title: 'How to Start a Movement',
    description: 'Organizing 101: Planning, people, and purpose.',
    link: 'https://beautifultrouble.org/',
    icon: 'megaphone-outline',
  },
];

const ResourcesScreen = () => {
  const handleOpenLink = (url) => {
    Linking.openURL(url);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Educational Resources</Text>
      <Text style={styles.subtitle}>Empower your activism with knowledge.</Text>

      {resources.map((res) => (
        <View key={res.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name={res.icon} size={24} color="#5B5FEF" />
            <Text style={styles.cardTitle}>{res.title}</Text>
          </View>
          <Text style={styles.cardDesc}>{res.description}</Text>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => handleOpenLink(res.link)}
          >
            <Text style={styles.linkText}>Open Resource</Text>
          </TouchableOpacity>
        </View>
      ))}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: { marginLeft: 10, fontSize: 16, fontWeight: 'bold' },
  cardDesc: { fontSize: 14, color: '#666', marginBottom: 10 },
  linkButton: {
    backgroundColor: '#E8EAFF',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  linkText: { color: '#5B5FEF', fontWeight: 'bold' },
});

export default ResourcesScreen;