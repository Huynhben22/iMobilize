import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Share,
  Alert,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const LawDetailScreen = ({ route, navigation }) => {
  const { law } = route.params;

  const getPenaltyColor = (penalty) => {
    if (!penalty) return '#6B7280';
    const p = penalty.toLowerCase();
    if (p.includes('class c felony')) return '#DC2626';
    if (p.includes('class b felony')) return '#B91C1C';
    if (p.includes('class a felony')) return '#991B1B';
    if (p.includes('gross misdemeanor')) return '#EA580C';
    if (p.includes('misdemeanor')) return '#D97706';
    if (p.includes('infraction')) return '#059669';
    return '#6B7280';
  };

  const getPenaltyGradient = (penalty) => {
    if (!penalty) return ['#6B7280', '#4B5563'];
    const p = penalty.toLowerCase();
    if (p.includes('felony')) return ['#DC2626', '#B91C1C'];
    if (p.includes('gross misdemeanor')) return ['#EA580C', '#C2410C'];
    if (p.includes('misdemeanor')) return ['#D97706', '#B45309'];
    if (p.includes('infraction')) return ['#059669', '#047857'];
    return ['#6B7280', '#4B5563'];
  };

  const getSeverityLevel = (penalty) => {
    if (!penalty) return { level: 'Unknown', score: 0 };
    const p = penalty.toLowerCase();
    if (p.includes('class a felony')) return { level: 'Severe', score: 5 };
    if (p.includes('class b felony')) return { level: 'Very High', score: 4 };
    if (p.includes('class c felony')) return { level: 'High', score: 3 };
    if (p.includes('gross misdemeanor')) return { level: 'Moderate-High', score: 2 };
    if (p.includes('misdemeanor')) return { level: 'Moderate', score: 1 };
    if (p.includes('infraction')) return { level: 'Low', score: 0 };
    return { level: 'Varies', score: 0 };
  };

  const handleShare = async () => {
    try {
      const shareContent = `${law.cite}: ${law.title}\n\n${law.summary}\n\nPenalty: ${law.penalty}\n\nSource: ${law.source_url}`;
      
      await Share.share({
        message: shareContent,
        title: law.cite,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share this law');
    }
  };

  const handleOpenSource = () => {
    if (law.source_url) {
      Linking.openURL(law.source_url);
    } else {
      Alert.alert('No Source', 'No official source URL available for this law');
    }
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    return content
      .replace(/\(\d+\)/g, '\n\n($&)')
      .replace(/\n\n+/g, '\n\n')
      .trim();
  };

  const severity = getSeverityLevel(law.penalty);
  const penaltyColors = getPenaltyGradient(law.penalty);

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerCite}>{law.cite}</Text>
          <Text style={styles.headerTitle} numberOfLines={2}>{law.title}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Penalty Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[styles.penaltyHeader, { backgroundColor: getPenaltyColor(law.penalty) }]}
          >
            <View style={styles.penaltyInfo}>
              <Text style={styles.penaltyLabel}>PENALTY</Text>
              <Text style={styles.penaltyText}>{law.penalty || 'Not Specified'}</Text>
            </View>
            <View style={styles.severityMeter}>
              <Text style={styles.severityLabel}>Severity</Text>
              <View style={styles.severityBar}>
                {[...Array(5)].map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.severityDot,
                      index <= severity.score && styles.severityDotActive
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.severityText}>{severity.level}</Text>
            </View>
          </View>
        </View>

        {/* Protester Summary */}
        {law.summary && (
          <View style={styles.summaryCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name="information-circle" size={20} color="#5B5FEF" />
              </View>
              <Text style={styles.cardTitle}>What This Means for Protesters</Text>
            </View>
            <Text style={styles.summaryText}>{law.summary}</Text>
          </View>
        )}

        {/* Legal Text Card */}
        <View style={styles.legalCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <Ionicons name="document-text" size={20} color="#5B5FEF" />
            </View>
            <Text style={styles.cardTitle}>Full Legal Text</Text>
          </View>
          <View style={styles.legalTextContainer}>
            <Text style={styles.legalText}>{formatContent(law.content)}</Text>
          </View>
        </View>

        {/* Quick Facts Grid */}
        <View style={styles.factsCard}>
          <Text style={styles.cardTitle}>Quick Facts</Text>
          <View style={styles.factsGrid}>
            <View style={styles.factItem}>
              <Ionicons name="location" size={16} color="#5B5FEF" />
              <View style={styles.factContent}>
                <Text style={styles.factLabel}>Jurisdiction</Text>
                <Text style={styles.factValue}>{law.jurisdiction || 'Washington State'}</Text>
              </View>
            </View>
            
            <View style={styles.factItem}>
              <Ionicons name="folder" size={16} color="#5B5FEF" />
              <View style={styles.factContent}>
                <Text style={styles.factLabel}>Category</Text>
                <Text style={styles.factValue}>{law.category || 'Protest-related'}</Text>
              </View>
            </View>
            
            <View style={styles.factItem}>
              <Ionicons name="calendar" size={16} color="#5B5FEF" />
              <View style={styles.factContent}>
                <Text style={styles.factLabel}>Last Updated</Text>
                <Text style={styles.factValue}>
                  {law.last_updated ? new Date(law.last_updated).toLocaleDateString() : 'Unknown'}
                </Text>
              </View>
            </View>
            
            <View style={styles.factItem}>
              <Ionicons name="warning" size={16} color={getPenaltyColor(law.penalty)} />
              <View style={styles.factContent}>
                <Text style={styles.factLabel}>Severity</Text>
                <Text style={[styles.factValue, { color: getPenaltyColor(law.penalty) }]}>
                  {severity.level}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleOpenSource}
          >
            <View style={styles.actionButtonGradient}>
              <Ionicons name="globe" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>View Official Source</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButtonSecondary}
            onPress={handleShare}
          >
            <Ionicons name="share-social" size={20} color="#5B5FEF" />
            <Text style={styles.actionButtonSecondaryText}>Share This Law</Text>
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <View style={styles.disclaimerIcon}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
          </View>
          <Text style={styles.disclaimerText}>
            This information is for educational purposes only and does not constitute legal advice. 
            Laws may change and interpretations may vary. Consult with a qualified attorney for specific legal guidance.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
    backgroundColor: '#5B5FEF',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerCite: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.9,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    lineHeight: 22,
  },
  shareButton: {
    padding: 8,
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  penaltyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  penaltyInfo: {
    flex: 1,
  },
  penaltyLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4,
  },
  penaltyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  severityMeter: {
    alignItems: 'flex-end',
  },
  severityLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 6,
  },
  severityBar: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 1,
  },
  severityDotActive: {
    backgroundColor: '#fff',
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#5B5FEF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  summaryText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    fontWeight: '400',
  },
  legalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  legalTextContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  legalText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  factsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  factsGrid: {
    marginTop: 16,
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  factContent: {
    marginLeft: 12,
    flex: 1,
  },
  factLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 2,
  },
  factValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  actionsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#5B5FEF',
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  actionButtonSecondaryText: {
    color: '#5B5FEF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#FEF3CD',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
    flex: 1,
  },
});

export default LawDetailScreen;