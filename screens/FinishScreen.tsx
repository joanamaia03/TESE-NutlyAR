import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FinishScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Muito obrigada{"\n"}pela sua{"\n"}participação!</Text>
        <Image source={require('../assets/Owl.png')} style={styles.owl} resizeMode="contain" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F1',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    color: '#709985',
    textAlign: 'center',
    lineHeight: 48,
  },
  owl: {
    width: 160,
    height: 160,
    marginBottom: 10,
    marginTop: 20,
  },
  
});
