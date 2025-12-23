import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import useMobileTorch from '../hooks/useMobileTorch';

export default function HostScreen({ route, navigation }: any) {
  const { eventId, hostId } = route.params;
  const { hasPermission, toggle, requestPermission } = useMobileTorch();
  const [isLoading, setIsLoading] = useState(false);
  const [participants, setParticipants] = useState(0);

  useEffect(() => {
    requestPermission();
  }, []);

  const handleFlash = async (effect: 'TORCH_ON' | 'TORCH_OFF' | 'STROBE' | 'PULSE') => {
    setIsLoading(true);
    try {
      if (effect === 'TORCH_ON') {
        await toggle(true);
      } else if (effect === 'TORCH_OFF') {
        await toggle(false);
      } else if (effect === 'STROBE') {
        // Strobe pattern
        for (let i = 0; i < 10; i++) {
          await toggle(i % 2 === 0);
          await new Promise(r => setTimeout(r, 100));
        }
        await toggle(false);
      } else if (effect === 'PULSE') {
        await toggle(true);
        await new Promise(r => setTimeout(r, 200));
        await toggle(false);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Host Dashboard</Text>
        <Text style={styles.subtitle}>Event ID: {eventId}</Text>
        <Text style={styles.subtitle}>Participants: {participants}</Text>
      </View>

      {!hasPermission ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={requestPermission}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.controlsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.buttonLarge, styles.buttonOn]}
            onPress={() => handleFlash('TORCH_ON')}
            disabled={isLoading}
          >
            <Text style={styles.buttonLargeText}>FLASH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonLarge, styles.buttonOff]}
            onPress={() => handleFlash('TORCH_OFF')}
            disabled={isLoading}
          >
            <Text style={styles.buttonLargeText}>STOP</Text>
          </TouchableOpacity>

          <View style={styles.grid}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSmall]}
              onPress={() => handleFlash('PULSE')}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Pulse</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSmall]}
              onPress={() => handleFlash('STROBE')}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>Strobe</Text>
            </TouchableOpacity>
          </View>

          {isLoading && <ActivityIndicator color="#00ff88" size="large" />}
        </View>
      )}

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backText}>Exit</Text>
      </TouchableOpacity>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00ff88',
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginTop: 8,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  controlsContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 16,
  },
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#00ff88',
  },
  buttonLarge: {
    paddingVertical: 40,
  },
  buttonLargeText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1a1a1a',
    letterSpacing: 2,
  },
  buttonSmall: {
    flex: 1,
    paddingVertical: 20,
    backgroundColor: '#2a2a2a',
    borderColor: '#00ff88',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00ff88',
  },
  buttonOn: {
    backgroundColor: '#00ff88',
  },
  buttonOff: {
    backgroundColor: '#ff4444',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    paddingVertical: 12,
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
    marginTop: 20,
  },
  backText: {
    color: '#00ff88',
    textAlign: 'center',
    fontSize: 14,
  },
});
