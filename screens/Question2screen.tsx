import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import ProgressBreadcrumb from './ProgressBar';
import { useNutlySession } from '../src/NutlySessionContext';

export default function ReasonScreen({ route, navigation }: any) {
  const { saveAnswer, currentGroup } = useNutlySession();
  const { perguntaAtual = 1, groupNumber } = route.params || {};
  const breadcrumbStep = groupNumber ?? currentGroup ?? 1;

  const [reason1, setReason1] = useState('');
  const [reason2, setReason2] = useState('');
  const [reason3, setReason3] = useState('');
  const [reason4, setReason4] = useState('');
  const [reason5, setReason5] = useState('');

  const handleSeguinte = async () => {
    const reasons = [reason1, reason2, reason3, reason4, reason5];
    const motivoPrincipal = reasons.find(r => r.trim().length > 0) || '';

    const answerData = {
      questionId: `g${currentGroup}_q${perguntaAtual}_motivos`,
      groupNumber: currentGroup,
      reasons: reasons.filter(r => r.trim().length > 0),
      motivoPrincipal,
      answeredAt: new Date(),
    };

    try {
      await saveAnswer(currentGroup, answerData);
      navigation.navigate('Question3Screen', { perguntaAtual, groupNumber: currentGroup });
    } catch (error) {
      console.error("Erro ao guardar motivos:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={breadcrumbStep} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Qual o motivo principal da sua escolha?</Text>

        <View style={styles.optionsContainer}>
          {[0,1,2,3,4].map((index) => {
            const setters = [setReason1, setReason2, setReason3, setReason4, setReason5];
            const values = [reason1, reason2, reason3, reason4, reason5];

            return (
              <View key={index} style={styles.optionRow}>
                <View style={styles.inputReasonWrapper}>
                  <Text style={styles.inputNumberInside}>{index + 1}</Text>
                  <TextInput
                    value={values[index]}
                    onChangeText={setters[index]}
                    style={styles.inputReason}
                    multiline
                  />
                </View>
              </View>
            );
          })}
        </View>
        <Text style={styles.footerNote}>
          Se identificar mais do que um fator, por favor ordene por ordem de importância {'\n'}(1: nada importante; 5: muito importante) 
        </Text>
      </ScrollView>

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
    backgroundColor: '#FAF5F0', // Fundo bege claro limpo padrão
    paddingTop: Platform.OS === 'android' ? 35 : 10,
  },
  breadcrumbContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 24,
  },
  title: {
    fontSize: 26,
    color: '#613512',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 28,
    marginTop: 0,
  },
  optionsContainer: {
    width: '100%',
    gap: 16, // Espaçamento vertical equilibrado entre os botões ovais
  },
  optionButton: {
    width: '100%',
    minHeight: 54,
    borderRadius: 25, // Cantos arredondados totalmente ovais de acordo com a imagem
    borderWidth: 1.5,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  optionButtonInactive: {
    backgroundColor: '#FAF5F0',
    borderColor: '#613512', // Contorno castanho elegante
  },
  optionButtonActive: {
    backgroundColor: '#733D14', // Preenche com o castanho chocolate ao selecionar
    borderColor: '#733D14',
    // Pequena sombra para destacar a opção ativa
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
  },
  optionTextInactive: {
    color: '#613512',
  },
  optionTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  optionRow: {
    marginBottom: 12,
  },
  inputReasonWrapper: {
    position: 'relative',
    width: '100%',
  },
  inputNumberInside: {
    position: 'absolute',
    left: 14,
    top: 14,
    color: '#E28A47',
    fontSize: 15,
    fontWeight: '700',
    zIndex: 2,
  },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#613512', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#733D14' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#733D14' },
  inputReason: { width: '100%', minHeight: 52, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E28A47', borderRadius: 12, paddingVertical: 12, paddingLeft: 34, paddingRight: 10, color: '#613512' },
  
  footerNote: {
    fontSize: 14,
    color: '#6B3E1F',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
    marginTop: 25,
    paddingHorizontal: 10,
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
    backgroundColor: '#FAF5F0',
  },
  nextButton: {
    backgroundColor: '#784115',
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