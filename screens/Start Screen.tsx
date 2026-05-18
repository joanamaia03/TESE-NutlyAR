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
  StatusBar,
  View,
} from 'react-native';
import { db, auth } from '../src/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const StartPage = ({ navigation }: any) => {
  const handleStart = () => {
    (async () => {
      const user = auth.currentUser;
      if (!user) {
        navigation?.navigate?.('Login');
        return;
      }

      try {
        const userRef = doc(db, 'utilizadores', user.uid);
        const snap = await getDoc(userRef);
        const perfilCompleto = snap.exists() && (snap.data() as any).perfilCompleto === true;
        if (perfilCompleto) {
          navigation?.navigate?.('Home');
        } else {
          navigation?.navigate?.('DemographicsScreen');
        }
      } catch (e) {
        navigation?.navigate?.('DemographicsScreen');
      }
    })();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#FFF8F1" barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Bem Vindo!</Text>

        <View style={styles.card}>
          {descriptionParagraphs.map((paragraph) => (
            <Text key={paragraph} style={styles.description}>
              {paragraph}
            </Text>
          ))}
          <View style={styles.speechTailCover} />
          <View style={styles.speechTailOuter}>
            <View style={styles.speechTailInner} />
          </View>
        </View>

        <View style={styles.badge}>
          <Image
            source={require('../assets/Owl.png')}
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
    backgroundColor: '#FFFFFF',
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
  speechTailOuter: {
    position: 'absolute',
    bottom: -16,
    left: '50%',
    width: 0,
    height: 0,
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#F2D7BF',
  },
  speechTailInner: {
    position: 'absolute',
    top: -14,
    left: -12,
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  speechTailCover: {
    position: 'absolute',
    bottom: -3,
    left: '51%',
    width: 26,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    zIndex: 2,
  },
  badge: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 15,
    zIndex: 3,
    elevation: 3,
  },
  badgeImage: {
    width: 140,
    height: 140,
  },
  button: {
    alignSelf: 'center',
    width: 200,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: '#784115',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    zIndex: 1,
    elevation: 1,
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
