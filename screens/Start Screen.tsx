const descriptionParagraphs = [
  "Este projeto pretende desenvolver uma ferramenta de avaliação dos conhecimentos da população sobre alimentação e nutrição.",
  "Neste sentido, gostaríamos de convidá-lo a participar neste projeto em que está previsto um conjunto de questionários com e sem realidade aumentada no qual se pretendo saber se reconhecem alguns alimentos e se os costumam consumir frequentemente.",
];

import React from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export const StartPage = ({ navigation }: any) => {
  const handleStart = () => {
    navigation?.navigate?.('ARScreen');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Bem Vindo!</Text>

        <View style={styles.card}>
          {descriptionParagraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.description}>
              {paragraph}
            </Text>
          ))}
        </View>

        <View style={styles.badge}>
          <Image
            source={require('../assets/icon.png')}
            style={styles.badgeImage}
            resizeMode="contain"
          />
        </View>

        <Pressable onPress={handleStart} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
          <Text style={styles.buttonText}>Começar</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F1',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 72,
    paddingBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kicker: {
    color: '#E28A47',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 18,
    color: '#6B3E1F',
    fontSize: 34,
    fontWeight: '800',
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#F2D7BF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 280,
    justifyContent: 'center',
  },
  description: {
    color: '#8A5A3C',
    fontSize: 17,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 18,
  },
  badge: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  badgeImage: {
    width: 84,
    height: 84,
  },
  button: {
    alignSelf: 'center',
    width: 200,
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#F2A86B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
});
