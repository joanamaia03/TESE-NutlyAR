import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Button, Pressable, StyleSheet, Text, View } from 'react-native';
import ARScreen from './ARScreen';

export default function App() {
  const [showArScreen, setShowArScreen] = useState(false);

  if (showArScreen) {
    return (
      <>
        <ARScreen />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* <Text style={styles.title}>NUTLY AR</Text> */}
        <Text style={styles.subtitle}>Abre a câmara RA</Text>
        <Button title="Realidade Aumentada" onPress={() => setShowArScreen(true)} />
      </View>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050608',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    backgroundColor: '#10131a',
    borderWidth: 1,
    borderColor: '#222838',
    gap: 12,
  },
  title: {
    color: '#f5f7fb',
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#a9b1c7',
    fontSize: 15,
    lineHeight: 21,
  },
});