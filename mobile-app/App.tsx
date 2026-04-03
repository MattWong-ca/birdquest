import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Sniglet_400Regular } from '@expo-google-fonts/sniglet';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useReactiveClient } from '@dynamic-labs/react-hooks';

import { dynamicClient } from './src/client';
import MapScreen from './src/screens/MapScreen';
import AchievementsScreen from './src/screens/AchievementsScreen';
import NewTripScreen from './src/screens/NewTripScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LoginScreen from './src/screens/LoginScreen';
import TopBar from './src/components/TopBar';
import { COLORS } from './src/constants/theme';

const Tab = createBottomTabNavigator();

function Main() {
  const { auth } = useReactiveClient(dynamicClient);
  const isLoggedIn = !!auth?.token;

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <TopBar />
      <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.GREEN,
        tabBarInactiveTintColor: COLORS.GRAY,
        tabBarStyle: {
          backgroundColor: COLORS.WHITE,
          borderTopColor: COLORS.LIGHT_GRAY,
          paddingTop: 10,
          paddingBottom: 25,
          height: 80,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_600SemiBold',
          fontSize: 10,
        },
      }}
    >
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarLabel: 'Map', tabBarIcon: ({ color, size }) => <Ionicons name="map-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Achievements"
        component={AchievementsScreen}
        options={{ tabBarLabel: 'Badges', tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="NewTrip"
        component={NewTripScreen}
        options={{ tabBarLabel: 'New Trip', tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ tabBarLabel: 'Quests', tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="podium" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
    </View>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Sniglet_400Regular,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={COLORS.GREEN} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <dynamicClient.reactNative.WebView />
      <NavigationContainer>
        <StatusBar style="dark" />
        <Main />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
