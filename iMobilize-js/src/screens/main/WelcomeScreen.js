import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to iMobilize</Text>
      <Text style={styles.subtitle}>Creating Real Change, Together</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Auth')}>
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#5B5FEF', marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 40 },
  button: { backgroundColor: '#5B5FEF', padding: 14, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default WelcomeScreen;