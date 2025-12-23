import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import useMobileTorch from '../hooks/useMobileTorch';

export default function AttendeeScreen({ route, navigation }: any) {
  const { pin } = route.params;
  const { hasPermission, toggle, requestPermission } = useMobileTorch();
  const [lastEffect, setLastEffect] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);

  useEffect(() => {
    requestPermission();
    
    // Simulate receiving effects (in real app, this would be from socket.io)
    const interval = setInterval(() => {
      // Effects would come from server
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (lastEffect === 'TORCH_ON' && hasPermission) {
      toggle(true);
      setIsFlashing(true);
    } else if (lastEffect === 'TORCH_OFF' && hasPermission) {
      toggle(false);
      setIsFlashing(false);
    } else if (lastEffect === 'PULSE' && hasPermission) {
      setIsFlashing(true);
      toggle(true);
      setTimeout(() => {
        toggle(false);
        setIsFlashing(false);
      }, 200);
    }
  }, [lastEffect, hasPermission]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Light Show</Text>
        <Text style={styles.subtitle}>Event PIN: {pin}</Text>
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
        <View style={styles.contentContainer}>
          <View
            style={[
              styles.flashIndicator,
              isFlashing && styles.flashActive,
            ]}
          >
            <Text style={styles.flashText}>
              {isFlashing ? 'FLASHING!' : 'Ready'}
            </Text>
          </View>

          {lastEffect && (
            <Text style={styles.effectText}>Last Effect: {lastEffect}</Text>
          )}

          <Text style={styles.instructionText}>
            Wait for the host to start the light show!
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.exitButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.exitText}>Exit</Text>
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
  button: {
    backgroundColor: '#00ff88',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonPrimary: {
    backgroundColor: '#00ff88',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
  },
  flashIndicator: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#2a2a2a',
    borderColor: '#00ff88',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flashActive: {
    backgroundColor: '#00ff88',
  },
  flashText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  effectText: {
    color: '#00ff88',
    fontSize: 16,
    fontWeight: '600',
  },
  instructionText: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  exitButton: {
    paddingVertical: 12,
    borderTopColor: '#2a2a2a',
    borderTopWidth: 1,
    marginTop: 20,
  },
  exitText: {
    color: '#00ff88',
    textAlign: 'center',
    fontSize: 14,
  },
});
