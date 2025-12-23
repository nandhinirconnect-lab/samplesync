import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import HomeScreen from './screens/HomeScreen';
import HostScreen from './screens/HostScreen';
import AttendeeScreen from './screens/AttendeeScreen';
import JoinEventScreen from './screens/JoinEventScreen';
import QRScannerScreen from './screens/QRScannerScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize app
    setIsReady(true);
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' }}>
        <ActivityIndicator size="large" color="#00ff88" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a1a1a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
          headerTitleAlign: 'center',
          contentStyle: { backgroundColor: '#1a1a1a' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'FlashMan', headerShown: false }}
        />
        <Stack.Screen
          name="Host"
          component={HostScreen}
          options={{ title: 'Host Dashboard' }}
        />
        <Stack.Screen
          name="Attendee"
          component={AttendeeScreen}
          options={{ title: 'Light Show' }}
        />
        <Stack.Screen
          name="JoinEvent"
          component={JoinEventScreen}
          options={{ title: 'Join Event' }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScannerScreen}
          options={{ title: 'Scan QR Code' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
