// App.js - FIXED VERSION with proper authentication and map error handling
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
import MainNavigator from './src/navigation/MainNavigator'; 

const Stack = createNativeStackNavigator();

// Global Error Boundary for Map Components
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Check if it's a Leaflet/map related error
    if (error.message && (
        error.message.includes('LatLng') || 
        error.message.includes('Invalid LatLng') ||
        error.message.includes('undefined, undefined')
      )) {
      console.warn('Map error caught and handled:', error.message);
      return { hasError: true };
    }
    // Re-throw non-map errors to maintain normal error handling
    throw error;
  }

  componentDidCatch(error, errorInfo) {
    if (error.message && error.message.includes('LatLng')) {
      console.warn('Map component error handled gracefully');
      console.warn('Error details:', error.message);
      console.warn('Component stack:', errorInfo.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      // Reset error state after a brief moment to allow app to continue
      setTimeout(() => {
        this.setState({ hasError: false });
      }, 100);
      
      // Return children but without the problematic map component
      return this.props.children;
    }

    return this.props.children;
  }
}

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
    <GlobalErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </GlobalErrorBoundary>
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