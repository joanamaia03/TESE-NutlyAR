const descriptionParagraphs = [
  "Este projeto pretende desenvolver uma ferramenta de avaliação dos conhecimentos da população sobre alimentação e nutrição.",
  "Neste sentido, gostaríamos de convidá-lo a participar neste projeto em que está previsto um conjunto de questionários com e sem realidade aumentada no qual se pretende saber se reconhecem alguns alimentos e se os costumam consumir frequentemente.",
];

import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  StatusBar,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db, auth } from '../src/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const StartPage = ({ navigation }: any) => {
  const handleStart = async () => {
    try {
      // quick feedback for debugging
      // eslint-disable-next-line no-console
      console.log('Start button pressed');

      const user = auth.currentUser;
      if (!user) {
        // eslint-disable-next-line no-console
        console.log('No user, navigating to Login');
        navigation && navigation.navigate ? navigation.navigate('Login') : null;
        return;
      }

      const userRef = doc(db, 'utilizadores', user.uid);
      const snap = await getDoc(userRef);
      const perfilCompleto = snap.exists() && (snap.data() as any).perfilCompleto === true;

      // eslint-disable-next-line no-console
      console.log('Perfil completo:', perfilCompleto);

      if (perfilCompleto) {
        navigation && navigation.navigate ? navigation.navigate('Home') : null;
      } else {
        navigation && navigation.navigate ? navigation.navigate('DemographicsScreen') : null;
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.warn('Error in handleStart:', e?.message || e);
      navigation && navigation.navigate ? navigation.navigate('DemographicsScreen') : null;
    }
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

        <View style={styles.badge} pointerEvents="none">
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
  title: {
    marginTop: 18,
    color: '#709985',
    fontSize: 34,
    fontWeight: '800',
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: 28,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFCDA6',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 24,
    minHeight: 280,
    justifyContent: 'center',
  },
  description: {
    color: '#4b4b4b',
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
    borderTopColor: '#FFCDA6',
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
    marginVertical: 13,
    zIndex: 6,
    elevation: 3,
  },
  badgeImage: {
    width: 150,
    height: 150,
  },
  button: {
    alignSelf: 'center',
    width: 200,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: '#81B29A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -30,
    zIndex: 5,
    elevation: 10,
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
