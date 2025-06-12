import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

const AuthScreen = ({ navigation }) => {
  const [showTerms, setShowTerms] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    display_name: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  
  const { login, register, error, clearError } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (!isLogin) {
      if (!formData.username || !formData.display_name) {
        Alert.alert('Error', 'Please fill in all required fields');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
      if (formData.password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters long');
        return false;
      }
    }

    return true;
  };

  const handleContinue = async () => {
  if (!validateForm()) return;

  setLoading(true);
  
  try {
    let result;
    
    if (isLogin) {
      result = await login({
        email: formData.email,
        password: formData.password
      });
    } else {
      result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        display_name: formData.display_name,
        terms_accepted: "true"  // CHANGED: from true to "true" (boolean to string)
      });
    }

    if (result.success) {
      setShowTerms(true);
    } else {
      Alert.alert('Error', result.error || `${isLogin ? 'Login' : 'Registration'} failed`);
    }
  } catch (error) {
    Alert.alert('Error', error.message || 'An unexpected error occurred');
  } finally {
    setLoading(false);
  }
};

  const handleAccept = () => {
    setShowTerms(false);
    navigation.replace('Main');
  };

  const handleDecline = () => {
    setShowTerms(false);
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      username: '',
      display_name: '',
      confirmPassword: ''
    });
    if (error) clearError();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isLogin ? 'Log In' : 'Sign Up'}
      </Text>
      
      {!isLogin && (
        <>
          <TextInput 
            placeholder="Username" 
            style={styles.input}
            value={formData.username}
            onChangeText={(value) => handleInputChange('username', value)}
            autoCapitalize="none"
          />
          <TextInput 
            placeholder="Display Name" 
            style={styles.input}
            value={formData.display_name}
            onChangeText={(value) => handleInputChange('display_name', value)}
          />
        </>
      )}
      
      <TextInput 
        placeholder="Email" 
        style={styles.input}
        value={formData.email}
        onChangeText={(value) => handleInputChange('email', value)}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput 
        placeholder="Password" 
        secureTextEntry 
        style={styles.input}
        value={formData.password}
        onChangeText={(value) => handleInputChange('password', value)}
      />
      
      {!isLogin && (
        <TextInput 
          placeholder="Confirm Password" 
          secureTextEntry 
          style={styles.input}
          value={formData.confirmPassword}
          onChangeText={(value) => handleInputChange('confirmPassword', value)}
        />
      )}

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {isLogin ? 'Log In' : 'Sign Up'}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleButton}>
        <Text style={styles.toggleText}>
          {isLogin 
            ? "Don't have an account? Sign Up" 
            : "Already have an account? Log In"
          }
        </Text>
      </TouchableOpacity>

      <Modal visible={showTerms} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Terms of Service</Text>
            <Text style={styles.modalText}>
              By continuing, you agree to participate non-violently and respectfully within the iMobilize platform.
              {'\n\n'}You also agree to our privacy policy and community guidelines for safe and effective activism coordination.
            </Text>
            <TouchableOpacity onPress={handleAccept} style={styles.acceptButton}>
              <Text style={styles.acceptText}>Accept & Continue</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDecline}>
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    padding: 20, 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: '#fff' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 24, 
    color: '#5B5FEF',
    textAlign: 'center'
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 6, 
    padding: 10, 
    marginBottom: 16 
  },
  button: { 
    backgroundColor: '#5B5FEF', 
    padding: 12, 
    borderRadius: 6,
    alignItems: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#A0A4FF',
  },
  buttonText: { 
    textAlign: 'center', 
    color: '#fff', 
    fontWeight: 'bold' 
  },
  toggleButton: {
    marginTop: 16,
    alignItems: 'center'
  },
  toggleText: {
    color: '#5B5FEF',
    fontSize: 14
  },
  modalOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: { 
    backgroundColor: '#fff', 
    margin: 20, 
    padding: 20, 
    borderRadius: 10 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 10 
  },
  modalText: { 
    fontSize: 14, 
    marginBottom: 20,
    lineHeight: 20
  },
  acceptButton: {
    backgroundColor: '#5B5FEF',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    alignItems: 'center'
  },
  acceptText: { 
    color: '#fff', 
    fontWeight: 'bold'
  },
  declineText: { 
    color: '#888',
    textAlign: 'center'
  },
});

export default AuthScreen;