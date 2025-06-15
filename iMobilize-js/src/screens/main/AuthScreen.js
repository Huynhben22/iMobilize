import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showUsernameRequirements, setShowUsernameRequirements] = useState(false);
  
  const { login, register, error, clearError } = useAuth();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
    
    // Show username requirements when user starts typing username during registration
    if (field === 'username' && !isLogin && value.length > 0) {
      setShowUsernameRequirements(true);
    } else if (field === 'username' && !isLogin && value.length === 0) {
      setShowUsernameRequirements(false);
    }
    
    // Show password requirements when user starts typing password during registration
    if (field === 'password' && !isLogin && value.length > 0) {
      setShowPasswordRequirements(true);
    } else if (field === 'password' && !isLogin && value.length === 0) {
      setShowPasswordRequirements(false);
    setShowUsernameRequirements(false);
    }
  };

  // Username validation functions
  const getUsernameRequirements = () => {
    const username = formData.username;
    return [
      {
        text: '3-50 characters long',
        met: username.length >= 3 && username.length <= 50,
        icon: (username.length >= 3 && username.length <= 50) ? 'checkmark-circle' : 'close-circle'
      },
      {
        text: 'Only letters, numbers, underscores, and hyphens',
        met: /^[a-zA-Z0-9_-]*$/.test(username), // Allow empty for partial typing
        icon: /^[a-zA-Z0-9_-]*$/.test(username) ? 'checkmark-circle' : 'close-circle'
      },
      {
        text: 'No spaces allowed',
        met: !/\s/.test(username),
        icon: !/\s/.test(username) ? 'checkmark-circle' : 'close-circle'
      }
    ];
  };
  const getPasswordRequirements = () => {
    const password = formData.password;
    return [
      {
        text: 'At least 6 characters',
        met: password.length >= 6,
        icon: password.length >= 6 ? 'checkmark-circle' : 'close-circle'
      },
      {
        text: 'Contains uppercase letter',
        met: /[A-Z]/.test(password),
        icon: /[A-Z]/.test(password) ? 'checkmark-circle' : 'close-circle'
      },
      {
        text: 'Contains lowercase letter',
        met: /[a-z]/.test(password),
        icon: /[a-z]/.test(password) ? 'checkmark-circle' : 'close-circle'
      },
      {
        text: 'Contains number',
        met: /\d/.test(password),
        icon: /\d/.test(password) ? 'checkmark-circle' : 'close-circle'
      },
      {
        text: 'Contains special character (!@#$%^&*)',
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        icon: /[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'checkmark-circle' : 'close-circle'
      }
    ];
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
      
      // Username validation
      if (formData.username.length < 3 || formData.username.length > 50) {
        Alert.alert('Error', 'Username must be between 3 and 50 characters');
        return false;
      }
      
      if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        Alert.alert('Error', 'Username can only contain letters, numbers, underscores, and hyphens');
        return false;
      }

      // Password validation
      if (formData.password.length < 6) {
        Alert.alert('Error', 'Password must be at least 6 characters long');
        return false;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleContinue = async () => {
    console.log('🚀 Button clicked! Current mode:', isLogin ? 'Login' : 'Register');
    console.log('📝 Form data:', {
      email: formData.email,
      username: formData.username,
      display_name: formData.display_name,
      passwordLength: formData.password?.length || 0
    });

    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    console.log('✅ Form validation passed, proceeding...');
    setLoading(true);
    
    try {
      let result;
      
      if (isLogin) {
        console.log('🔐 Attempting login...');
        result = await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        console.log('📝 Attempting registration...');
        result = await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          display_name: formData.display_name,
          terms_accepted: "true"
        });
      }

      console.log('📡 API Response:', result);

      if (result && result.success) {
        console.log('✅ Success! Showing terms modal...');
        setShowTerms(true);
      } else {
        console.log('❌ API call failed:', result);
        Alert.alert('Error', result?.error || `${isLogin ? 'Login' : 'Registration'} failed`);
      }
    } catch (error) {
      console.error('💥 Exception caught:', error);
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
    setShowPasswordRequirements(false);
    if (error) clearError();
  };

  const passwordRequirements = getPasswordRequirements();
  const usernameRequirements = getUsernameRequirements();
  const passwordsMatch = formData.password === formData.confirmPassword;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isLogin ? 'Log In' : 'Sign Up'}
      </Text>
      
      {!isLogin && (
        <>
          <View style={styles.inputContainer}>
            <TextInput 
              placeholder="Username" 
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              autoCapitalize="none"
            />
            
            {/* Username Requirements - Only show during registration */}
            {!isLogin && showUsernameRequirements && (
              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Username Requirements:</Text>
                {usernameRequirements.map((req, index) => (
                  <View key={index} style={styles.requirementRow}>
                    <Ionicons 
                      name={req.icon} 
                      size={16} 
                      color={req.met ? '#4CAF50' : '#F44336'} 
                    />
                    <Text style={[
                      styles.requirementText,
                      { color: req.met ? '#4CAF50' : '#F44336' }
                    ]}>
                      {req.text}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <TextInput 
            placeholder="Display Name" 
            style={styles.input}
            value={formData.display_name}
            onChangeText={(value) => handleInputChange('display_name', value)}
          />
        </>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Email" 
          style={styles.input}
          value={formData.email}
          onChangeText={(value) => handleInputChange('email', value)}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      
      <View style={styles.inputContainer}>
        <TextInput 
          placeholder="Password" 
          secureTextEntry 
          style={styles.input}
          value={formData.password}
          onChangeText={(value) => handleInputChange('password', value)}
        />
        
        {/* Password Requirements - Only show during registration */}
        {!isLogin && showPasswordRequirements && (
          <View style={styles.requirementsContainer}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            {passwordRequirements.map((req, index) => (
              <View key={index} style={styles.requirementRow}>
                <Ionicons 
                  name={req.icon} 
                  size={16} 
                  color={req.met ? '#4CAF50' : '#F44336'} 
                />
                <Text style={[
                  styles.requirementText,
                  { color: req.met ? '#4CAF50' : '#F44336' }
                ]}>
                  {req.text}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {!isLogin && (
        <View style={styles.inputContainer}>
          <TextInput 
            placeholder="Confirm Password" 
            secureTextEntry 
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(value) => handleInputChange('confirmPassword', value)}
          />
          
          {/* Password match indicator */}
          {formData.confirmPassword.length > 0 && (
            <View style={styles.passwordMatchContainer}>
              <Ionicons 
                name={passwordsMatch ? 'checkmark-circle' : 'close-circle'} 
                size={16} 
                color={passwordsMatch ? '#4CAF50' : '#F44336'} 
              />
              <Text style={[
                styles.passwordMatchText,
                { color: passwordsMatch ? '#4CAF50' : '#F44336' }
              ]}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </Text>
            </View>
          )}
        </View>
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
  inputContainer: {
    marginBottom: 16,
  },
  input: { 
    borderWidth: 1, 
    borderColor: '#ccc', 
    borderRadius: 6, 
    padding: 10,
    fontSize: 16
  },
  inputHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 4
  },
  requirementsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF'
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  requirementText: {
    fontSize: 12,
    marginLeft: 8,
    flex: 1
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4
  },
  passwordMatchText: {
    fontSize: 12,
    marginLeft: 6
  },
  button: { 
    backgroundColor: '#5B5FEF', 
    padding: 12, 
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8
  },
  buttonDisabled: {
    backgroundColor: '#A0A4FF',
  },
  buttonText: { 
    textAlign: 'center', 
    color: '#fff', 
    fontWeight: 'bold',
    fontSize: 16
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