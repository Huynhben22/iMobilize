import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LegalApiService from '../../services/LegalApiService';

const ResourcesScreen = ({ navigation }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [legalData, setLegalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Static educational resources
  const educationalResources = [
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

  useEffect(() => {
    loadLegalData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, legalData, selectedCategory]);

  const loadLegalData = async () => {
    try {
      setLoading(true);
      const response = await LegalApiService.getLegalData();
      
      if (response.success) {
        setLegalData(response.data.laws);
        console.log(`Loaded ${response.data.laws.length} legal documents`);
      } else {
        throw new Error(response.message || 'Failed to load legal data');
      }
    } catch (error) {
      console.error('Error loading legal data:', error);
      Alert.alert(
        'Connection Error',
        'Failed to load legal data. Make sure your API server is running on localhost:3000 and try again.',
        [
          { text: 'Cancel' },
          { text: 'Retry', onPress: loadLegalData }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLegalData();
    setRefreshing(false);
  };

  const filterData = () => {
    let filtered = legalData;

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title?.toLowerCase().includes(term) ||
        item.content?.toLowerCase().includes(term) ||
        item.summary?.toLowerCase().includes(term) ||
        item.cite?.toLowerCase().includes(term)
      );
    }

    // Filter by penalty category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => {
        const penalty = item.penalty?.toLowerCase() || '';
        switch (selectedCategory) {
          case 'felony':
            return penalty.includes('felony');
          case 'misdemeanor':
            return penalty.includes('misdemeanor') && !penalty.includes('gross');
          case 'gross-misdemeanor':
            return penalty.includes('gross misdemeanor');
          case 'infraction':
            return penalty.includes('infraction');
          default:
            return true;
        }
      });
    }

    setFilteredData(filtered);
  };

  const handleOpenLink = (url) => {
    Linking.openURL(url);
  };

  const handleLawPress = (law) => {
    navigation.navigate('LawDetail', { law });
  };

  const getPenaltyColor = (penalty) => {
    if (!penalty) return '#999';
    const p = penalty.toLowerCase();
    if (p.includes('felony')) return '#DC2626'; // Red for felonies
    if (p.includes('gross misdemeanor')) return '#EA580C'; // Orange for gross misdemeanors
    if (p.includes('misdemeanor')) return '#D97706'; // Amber for misdemeanors
    if (p.includes('infraction')) return '#059669'; // Green for infractions
    return '#6B7280'; // Gray for others
  };

  const getPenaltyIcon = (penalty) => {
    if (!penalty) return 'help-circle-outline';
    const p = penalty.toLowerCase();
    if (p.includes('felony')) return 'warning-outline';
    if (p.includes('misdemeanor')) return 'alert-circle-outline';
    if (p.includes('infraction')) return 'information-circle-outline';
    return 'help-circle-outline';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5B5FEF" />
        <Text style={styles.loadingText}>Loading legal resources...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Legal Resources</Text>
      <Text style={styles.subtitle}>Know your rights and stay informed.</Text>

      {/* Educational Resources Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Educational Resources</Text>
        {educationalResources.map((res) => (
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
              <Ionicons name="open-outline" size={16} color="#5B5FEF" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Legal Data Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Washington State Laws</Text>
        <Text style={styles.sectionSubtitle}>
          Protest-related laws and regulations you should know
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search laws by title, content, or RCW number..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle-outline" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'all', label: 'All Laws' },
              { key: 'felony', label: 'Felonies' },
              { key: 'gross-misdemeanor', label: 'Gross Misdemeanors' },
              { key: 'misdemeanor', label: 'Misdemeanors' },
              { key: 'infraction', label: 'Infractions' }
            ].map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.filterButton,
                  selectedCategory === category.key && styles.filterButtonActive
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedCategory === category.key && styles.filterButtonTextActive
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Results Count */}
        <Text style={styles.resultsCount}>
          {filteredData.length} law{filteredData.length !== 1 ? 's' : ''} found
          {searchTerm ? ` for "${searchTerm}"` : ''}
        </Text>

        {/* Legal Laws List */}
        {filteredData.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="document-outline" size={48} color="#ccc" />
            <Text style={styles.noResultsText}>
              {searchTerm ? 'No laws found matching your search.' : 'No legal data available.'}
            </Text>
            {!searchTerm && (
              <TouchableOpacity style={styles.retryButton} onPress={loadLegalData}>
                <Text style={styles.retryButtonText}>Retry Loading</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredData.map((law, index) => (
            <TouchableOpacity
              key={law.id || index}
              style={styles.lawCard}
              onPress={() => handleLawPress(law)}
              activeOpacity={0.7}
            >
              <View style={styles.lawHeader}>
                <View style={styles.lawTitleContainer}>
                  <Text style={styles.lawCite}>{law.cite}</Text>
                  <Text style={styles.lawTitle}>{law.title}</Text>
                </View>
                <View style={[styles.penaltyBadge, { backgroundColor: getPenaltyColor(law.penalty) }]}>
                  <Ionicons 
                    name={getPenaltyIcon(law.penalty)} 
                    size={12} 
                    color="white" 
                    style={styles.penaltyIcon}
                  />
                  <Text style={styles.penaltyText}>{law.penalty || 'N/A'}</Text>
                </View>
              </View>

              {law.summary && (
                <Text style={styles.lawSummary} numberOfLines={3}>
                  {law.summary}
                </Text>
              )}

              <View style={styles.lawFooter}>
                <Text style={styles.lawMeta}>
                  Tap to view full details
                </Text>
                <Ionicons name="chevron-forward-outline" size={16} color="#666" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5B5FEF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8EAFF',
    paddingVertical: 8,
    borderRadius: 6,
  },
  linkText: {
    color: '#5B5FEF',
    fontWeight: 'bold',
    marginRight: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  filterButtonActive: {
    backgroundColor: '#5B5FEF',
    borderColor: '#5B5FEF',
  },
  filterButtonText: {
    color: '#666',
    fontSize: 12,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  resultsCount: {
    fontSize: 12,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  lawCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lawTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  lawCite: {
    fontSize: 12,
    color: '#5B5FEF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lawTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 22,
  },
  penaltyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
  },
  penaltyIcon: {
    marginRight: 4,
  },
  penaltyText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  lawSummary: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  lawFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lawMeta: {
    fontSize: 12,
    color: '#999',
  },
  noResults: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 16,
  },
  noResultsText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#5B5FEF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ResourcesScreen;