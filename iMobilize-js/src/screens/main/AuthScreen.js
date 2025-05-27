import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet
} from 'react-native';

const AuthScreen = ({ navigation }) => {
  const [showTerms, setShowTerms] = useState(false);

  const handleContinue = () => {
    setShowTerms(true);
  };

  const handleAccept = () => {
    setShowTerms(false);
    navigation.replace('Main'); // Send user to bottom tab navigator
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up / Log In</Text>
      <TextInput placeholder="Email" style={styles.input} />
      <TextInput placeholder="Password" secureTextEntry style={styles.input} />

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>

      <Modal visible={showTerms} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <Text style={styles.modalText}>
              By continuing, you agree to participate non-violently and respectfully within the iMobilize platform.
            </Text>
            <TouchableOpacity onPress={handleAccept}>
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTerms(false)}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: '#5B5FEF' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 16 },
  button: { backgroundColor: '#5B5FEF', padding: 12, borderRadius: 6 },
  buttonText: { textAlign: 'center', color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', margin: 20, padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  modalText: { fontSize: 14, marginBottom: 20 },
  acceptText: { color: '#5B5FEF', fontWeight: 'bold', marginBottom: 10 },
  declineText: { color: '#888' },
});

export default AuthScreen;