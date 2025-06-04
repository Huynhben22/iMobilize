// src/navigation/MainNavigator.js - Updated with Stack Navigation
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

// Import main tab screens
import HomeScreen from '../screens/main/HomeScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import OrganizerScreen from '../screens/main/OrganizerScreen';
import ResourcesScreen from '../screens/main/ResourcesScreen';

// Import detail screens
import EventViewScreen from '../screens/main/EventViewScreen';
import CommunityViewScreen from '../screens/main/CommunityViewScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Create stack navigators for tabs that need detail screens
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="EventViewScreen" component={EventViewScreen} />
    </Stack.Navigator>
  );
};

const CommunityStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CommunityMain" component={CommunityScreen} />
      <Stack.Screen name="CommunityViewScreen" component={CommunityViewScreen} />
    </Stack.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Organizer') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5B5FEF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
        }}
      />
      
      <Tab.Screen 
        name="Community" 
        component={CommunityStackNavigator}
        options={{
          tabBarLabel: 'Community',
        }}
      />
      
      <Tab.Screen 
        name="Organizer" 
        component={OrganizerScreen}
        options={{
          tabBarLabel: 'Organize',
        }}
      />
      
      <Tab.Screen 
        name="Resources" 
        component={ResourcesScreen}
        options={{
          tabBarLabel: 'Resources',
        }}
      />
     
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator;