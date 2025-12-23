import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function JoinEventScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>Join Event Screen</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
  },
});
