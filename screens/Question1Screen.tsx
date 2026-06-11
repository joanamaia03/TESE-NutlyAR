import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import ProgressBreadcrumb from './ProgressBar';
import { useNutlySession } from '../src/NutlySessionContext';

export default function ConfidenceScreen({ route, navigation }: any) {
  const { saveAnswer, currentGroup } = useNutlySession();

  const { perguntaAtual = 1, groupNumber } = route.params || {};
  const breadcrumbStep = groupNumber ?? currentGroup ?? 1;
  const [rating, setRating] = useState<number>(0);

  const handleSeguinte = async () => {
    if (rating === 0) {
      Alert.alert('Aviso', 'Por favor, selecione o seu nível de confiança antes de continuar.');
      return;
    }

    const answerData = {
      questionId: `g${currentGroup}_q${perguntaAtual}_confianca`,
      groupNumber: currentGroup,
      confidence: rating,
      answeredAt: new Date(),
    };

    try {
      await saveAnswer(currentGroup, answerData);
      navigation.navigate('Question2Screen', { perguntaAtual, groupNumber: currentGroup });
    } catch (error) {
      console.error("Erro ao guardar confiança:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={breadcrumbStep} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Quão confiante está na sua resposta?</Text>

        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((starNumber) => {
            const isSelected = starNumber <= rating;
            return (
              <TouchableOpacity key={starNumber} onPress={() => setRating(starNumber)} style={styles.starButton}>
                <View style={styles.starIconWrapper}>
                  <Icon name={isSelected ? "star" : "star-outline"} size={55} color={isSelected ? '#81B29A' : '#FFCDA6'} />
                  <Text style={[styles.starNumberText, isSelected && styles.starNumberTextActive]}>
                    {starNumber}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.subtitle}>Preencha as estrelas {'\n'} (1 = nada confiante, 5 = muito confiante)</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleSeguinte}>
          <Text style={styles.nextButtonText}>Seguinte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F1',
    paddingTop: Platform.OS === 'android' ? 35 : 10,
  },
  breadcrumbContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -40, // Sob ligeiramente o bloco para equilibrar com o botão inferior
  },
  title: {
    fontSize: 26,
    color: '#709985',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    marginBottom: 40,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 45,
  },
  starButton: {
    padding: 2,
  },
  starIconWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  starNumberText: {
    position: 'absolute',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#709985', 
    top: Platform.OS === 'ios' ? 18 : 16, 
  },
  starNumberTextActive: {
    color: '#FAF5F0', 
  },
  subtitle: {
    fontSize: 15,
    color: '#4b4b4b',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.85,
    paddingHorizontal: 10,
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#81B29A', // Castanho chocolate escuro oficial dos teus botões principais
    width: '60%',
    maxWidth: 190,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});