// src/navigation/MainNavigator.js
import React, { useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Import screens
import HomeScreen from '../screens/main/HomeScreen';
import CommunityScreen from '../screens/main/CommunityScreen';
import ResourcesScreen from '../screens/main/ResourcesScreen';
import OrganizerScreen from '../screens/main/OrganizerScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Import API service for notifications badge
import ApiService from '../services/Api';

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Get unread notifications count for badge
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await ApiService.getNotifications({ unread_only: true, limit: 1 });
        if (response.success) {
          setUnreadCount(response.data.unread_count || 0);
        }
      } catch (error) {
        console.log('Error fetching notifications:', error);
        // Don't show error to user, just fail silently for badge
      }
    };

    fetchNotifications();

    // Refresh notifications count every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Badge component for notifications
  const NotificationBadge = ({ count }) => {
    if (count === 0) return null;
    
    return (
      <View style={{
        position: 'absolute',
        right: -6,
        top: -3,
        backgroundColor: '#FF3B30',
        borderRadius: 6,
        width: 12,
        height: 12,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{
          color: 'white',
          fontSize: 8,
          fontWeight: 'bold',
        }}>
          {count > 9 ? '9+' : count}
        </Text>
      </View>
    );
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Resources') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Community') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Organizer') {
            iconName = focused ? 'megaphone' : 'megaphone-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          // Add notification badge to Home tab (where notifications are typically shown)
          if (route.name === 'Home') {
            return (
              <View>
                <Ionicons name={iconName} size={size} color={color} />
                <NotificationBadge count={unreadCount} />
              </View>
            );
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#5B5FEF',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
        // Add subtle animation
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E1E5E9',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
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
        name="Community" 
        component={CommunityScreen}
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