import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Header, Card, Button } from '../../common';
import { CommonStyles, Colors } from '../../styles';
import { resourcesStyles } from '../../styles/screens';


// Services
import { WashingtonLegalService } from '../../services/WashingtonLegalService';

const categories = [
  { id: 'protest-laws', name: 'Protest Laws', icon: 'megaphone-outline' },
  { id: 'permits', name: 'Permits', icon: 'document-text-outline' },
  { id: 'safety', name: 'Safety Guide', icon: 'shield-checkmark-outline' },
  { id: 'rights', name: 'Know Your Rights', icon: 'information-circle-outline' },
];

const ResourcesScreen = () => {
  const [selectedCategory, setSelectedCategory] = useState('protest-laws');
  const [legalData, setLegalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  useEffect(() => {
    if (selectedCategory === 'protest-laws') {
      loadProtestLaws();
    }
  }, [selectedCategory]);

  const loadProtestLaws = async () => {
    setLoading(true);
    try {
      const keySections = ['RCW 9A.84.010', 'RCW 9A.84.020', 'RCW 46.61.250'];
      const legalContent = await Promise.all(
        keySections.map(async (cite) => {
          const content = await WashingtonLegalService.fetchRCWContent(cite);
          return { cite, ...content };
        })
      );
      
      setLegalData(legalContent.filter(item => item !== null));
    } catch (error) {
      Alert.alert('Error', 'Failed to load legal information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (cite) => {
    setExpandedSections(prev => ({
      ...prev,
      [cite]: !prev[cite]
    }));
  };

  const openExternalLink = (url) => {
    Linking.openURL(url);
  };

  const renderCategoryTabs = () => (
    <View style={resourcesStyles.categoryTabs}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              resourcesStyles.categoryTab,
              selectedCategory === category.id && resourcesStyles.activeCategoryTab
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons 
              name={category.icon} 
              size={20} 
              color={selectedCategory === category.id ? Colors.primary : Colors.textSecondary} 
            />
            <Text style={[
              resourcesStyles.categoryTabText,
              selectedCategory === category.id && resourcesStyles.activeCategoryTabText
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderDisclaimer = () => (
    <View style={CommonStyles.disclaimer}>
      <Ionicons name="warning-outline" size={20} color={Colors.warning} />
      <Text style={CommonStyles.disclaimerText}>
        This is general information, not legal advice. Consult an attorney for specific cases.
      </Text>
    </View>
  );

  const renderLawCard = (law) => (
    <Card key={law.cite} style={resourcesStyles.lawCard}>
      <TouchableOpacity 
        style={resourcesStyles.lawHeader}
        onPress={() => toggleSection(law.cite)}
      >
        <View style={resourcesStyles.lawTitleContainer}>
          <Text style={resourcesStyles.lawCite}>{law.cite}</Text>
          <Text style={resourcesStyles.lawTitle}>{law.title}</Text>
          <Text style={resourcesStyles.lawPenalty}>Penalty: {law.penalty}</Text>
        </View>
        <Ionicons 
          name={expandedSections[law.cite] ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color={Colors.primary} 
        />
      </TouchableOpacity>

      <View style={resourcesStyles.lawSummary}>
        <Text style={resourcesStyles.summaryText}>{law.summary}</Text>
      </View>

      {expandedSections[law.cite] && (
        <View style={resourcesStyles.expandedContent}>
          <Text style={resourcesStyles.fullTextLabel}>Full Legal Text:</Text>
          <Text style={resourcesStyles.fullText}>{law.content}</Text>
          
          <TouchableOpacity 
            style={resourcesStyles.sourceButton}
            onPress={() => openExternalLink(`https://app.leg.wa.gov/RCW/dispo.aspx?cite=${law.cite.replace('RCW ', '')}`)}
          >
            <Ionicons name="link-outline" size={16} color={Colors.primary} />
            <Text style={resourcesStyles.sourceButtonText}>View Official Source</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

  const renderResourcesCard = () => (
    <Card style={resourcesStyles.resourcesCard}>
      <Text style={resourcesStyles.resourcesTitle}>Additional Resources</Text>
      
      <TouchableOpacity 
        style={resourcesStyles.resourceItem}
        onPress={() => openExternalLink('https://www.aclu-wa.org/know-your-rights/free-speech-protests-and-police')}
      >
        <Ionicons name="book-outline" size={20} color={Colors.success} />
        <View style={resourcesStyles.resourceTextContainer}>
          <Text style={resourcesStyles.resourceItemTitle}>ACLU-WA Know Your Rights</Text>
          <Text style={resourcesStyles.resourceItemDesc}>Comprehensive protest rights guide</Text>
        </View>
        <Ionicons name="open-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={resourcesStyles.resourceItem}
        onPress={() => openExternalLink('https://www.nlg.org/mass-defense/')}
      >
        <Ionicons name="call-outline" size={20} color={Colors.info} />
        <View style={resourcesStyles.resourceTextContainer}>
          <Text style={resourcesStyles.resourceItemTitle}>National Lawyers Guild</Text>
          <Text style={resourcesStyles.resourceItemDesc}>Legal observer hotline and support</Text>
        </View>
        <Ionicons name="open-outline" size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
    </Card>
  );

  const renderProtestLaws = () => (
    <View style={resourcesStyles.contentContainer}>
      {renderDisclaimer()}

      <Text style={resourcesStyles.sectionTitle}>Washington State Protest Laws</Text>
      <Text style={resourcesStyles.sectionSubtitle}>
        Key legal information for protesters in Washington State
      </Text>

      {loading ? (
        <View style={resourcesStyles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={resourcesStyles.loadingText}>Loading legal information...</Text>
        </View>
      ) : (
        <>
          {legalData.map(renderLawCard)}
          {renderResourcesCard()}
        </>
      )}
    </View>
  );

  const renderPlaceholderContent = (categoryName) => (
    <View style={resourcesStyles.placeholderContainer}>
      <Ionicons name="construct-outline" size={64} color={Colors.textLight} />
      <Text style={resourcesStyles.placeholderTitle}>Coming Soon</Text>
      <Text style={resourcesStyles.placeholderText}>
        {categoryName} information will be available in a future update.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <Header title="Resources" />
      {renderCategoryTabs()}
      
      <ScrollView style={resourcesStyles.scrollView}>
        {selectedCategory === 'protest-laws' ? 
          renderProtestLaws() : 
          renderPlaceholderContent(categories.find(c => c.id === selectedCategory)?.name)
        }
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResourcesScreen;