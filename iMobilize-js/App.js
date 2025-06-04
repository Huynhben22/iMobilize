// App.js - REVERTED to working version (undo teammate's auth bypass)
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Import AuthContext
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Import screens
import WelcomeScreen from './src/screens/main/WelcomeScreen';
import AuthScreen from './src/screens/main/AuthScreen';
import MainNavigator from './src/navigation/MainNavigator'; // ← Import MainNavigator

const Stack = createNativeStackNavigator();

// Loading screen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#5B5FEF" />
  </View>
);

// Navigation component that uses auth state
const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading screen while checking auth status
  if (loading) {
    return (
      <NavigationContainer>
        <LoadingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        initialRouteName={isAuthenticated ? "Main" : "Welcome"}
      >
        {isAuthenticated ? (
          // User is authenticated - show main app with tabs
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          // User is not authenticated - show auth flow
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});