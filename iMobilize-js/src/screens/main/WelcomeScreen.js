import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const WelcomeScreen = ({ navigation }) => {
  const { isAuthenticated, loading } = useAuth();

  // If user is already authenticated, go to main app
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigation.replace('Main');
    }
  }, [isAuthenticated, loading, navigation]);

  // Don't show welcome screen if we're checking auth or user is already logged in
  if (loading || isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>iMobilize</Text>
        <Text style={styles.subtitle}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to iMobilize</Text>
      <Text style={styles.subtitle}>Creating Real Change, Together</Text>
      <Text style={styles.description}>
        Join a community of activists working to create positive change through organized, peaceful action.
      </Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('Auth')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20,
    backgroundColor: '#fff'
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#5B5FEF', 
    marginBottom: 12,
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: 16, 
    color: '#666', 
    marginBottom: 20,
    textAlign: 'center'
  },
  description: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 40,
    maxWidth: 300
  },
  button: { 
    backgroundColor: '#5B5FEF', 
    padding: 14, 
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center'
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
});

export default WelcomeScreen;