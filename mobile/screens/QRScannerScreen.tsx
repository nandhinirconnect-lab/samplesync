import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function QRScannerScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.text}>QR Scanner Screen</Text>
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
