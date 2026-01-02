import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Zap } from 'lucide-react-native';

export default function HomeScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [hostId, setHostId] = useState('');
  const [mode, setMode] = useState<'home' | 'join' | 'host'>('home');

  const handleCreateEvent = async () => {
    try {
      const response = await fetch('http://your-backend-url/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `Mobile Event ${Date.now()}`,
          hostId: Math.random().toString(36).substring(7),
        }),
      });
      
      if (response.ok) {
        const event = await response.json();
        setHostId(event.hostId);
        Alert.alert('Event Created!', `Host ID: ${event.hostId}\n\nEvent PIN: ${event.pin}`);
        navigation.navigate('Host', { eventId: event.id, hostId: event.hostId });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create event');
    }
  };

  const handleJoinEvent = () => {
    if (pin.length !== 9) {
      Alert.alert('Invalid PIN', 'PIN must be 8 digits + 1 letter');
      return;
    }
    navigation.navigate('Attendee', { pin });
  };

  const handleRejoinHost = () => {
    if (!hostId) {
      Alert.alert('No Host ID', 'Enter your Host ID');
      return;
    }
    navigation.navigate('Host', { hostId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>FLASH</Text>
        <Text style={[styles.title, styles.titleAccent]}>MAN</Text>
      </View>

      {mode === 'home' && (
        <View style={styles.content}>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={() => handleCreateEvent()}
          >
            <Text style={styles.buttonText}>Create Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setMode('join')}
          >
            <Text style={styles.buttonText}>Join Event</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => setMode('host')}
          >
            <Text style={styles.buttonText}>Rejoin as Host</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={() => navigation.navigate('QRScanner')}
          >
            <Text style={styles.buttonText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'join' && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Enter Event PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="12345678A"
            value={pin}
            onChangeText={(text) => setPin(text.replace(/[^0-9A-Za-z]/g, '').slice(0, 9).toUpperCase())}
            maxLength={9}
            placeholderTextColor="#666"
          />
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleJoinEvent}
          >
            <Text style={styles.buttonText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('home')}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {mode === 'host' && (
        <View style={styles.formContainer}>
          <Text style={styles.label}>Enter Host ID</Text>
          <TextInput
            style={styles.input}
            placeholder="your-host-id"
            value={hostId}
            onChangeText={setHostId}
            placeholderTextColor="#666"
          />
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={handleRejoinHost}
          >
            <Text style={styles.buttonText}>Rejoin</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('home')}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    marginVertical: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 2,
  },
  titleAccent: {
    color: '#00ff88',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderColor: '#00ff88',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#00ff88',
  },
  buttonSecondary: {
    backgroundColor: '#2a2a2a',
    borderColor: '#00ff88',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  backText: {
    color: '#00ff88',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
