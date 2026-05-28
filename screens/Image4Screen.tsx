import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBreadcrumb from './ProgressBar';
import { useNutlySession } from '../src/NutlySessionContext';

const opcoes = ['Sim', 'Não'];

export default function ImagineScreen({ route, navigation }: any) {
  const { saveAnswer, currentGroup } = useNutlySession();
  const { perguntaAtual = 4, groupNumber } = route.params || {};
  const breadcrumbStep = groupNumber ?? currentGroup ?? 1;
  const isSaltGroup = (groupNumber ?? currentGroup ?? 1) === 2 || (groupNumber ?? currentGroup ?? 1) === 3 || (groupNumber ?? currentGroup ?? 1) === 4;

  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [porqueTexto, setPorqueTexto] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSeguinte = async () => {
    if (!opcaoSelecionada || !porqueTexto.trim()) {
      Alert.alert('Aviso', 'Preencha todas as opções.');
      return;
    }

    const answerData = {
      questionId: `g${currentGroup}_q${perguntaAtual}_imagine`,
      groupNumber: currentGroup,
      imagineResponse: { opcaoSelecionada, porqueTexto },
      answeredAt: new Date(),
    };

    try {
      await saveAnswer(currentGroup, answerData);
      
    } catch (error) {
      console.error(error);
    }

    navigation.navigate('ImageQuizzScreen', {
      // Esta fase continua a pertencer ao grupo 1 — manter breadcrumb no passo 1
      perguntaProxima: 1,
      enableInfo: true,
      finalGroupStep: true,
      popupOverride: isSaltGroup
          ? 'Nesta fase desbloqueou o **botão de informação**, no qual tem acesso ao peso dos alimentos e ao sal por 100g. Qual destas porções terá **mais sal** no total? Selecione **apenas uma** das opções.\n\nBotão de informação'
          : 'Nesta fase desbloqueou o **botão de informação**, no qual tem acesso ao peso dos alimentos e à energia por 100g. Qual destas porções terá **mais energia (calorias)** no total? Selecione **apenas uma** das opções.\n\nBotão de informação',
      sessionId: route.params?.sessionId,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.breadcrumbContainer}>
          <ProgressBreadcrumb currentStep={breadcrumbStep} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <View style={styles.questionContainer}>
            <Text style={styles.mainQuestion}>
              Imagine se este <Text style={styles.boldText}>alimento que escolheu</Text> tivesse apenas <Text style={styles.boldText}>metade</Text> da quantidade apresentada. {'\n'}{'\n'}
              Continuaria a ser a opção com <Text style={styles.boldText}>{isSaltGroup ? 'mais sal' : 'mais energia'}</Text> {isSaltGroup ? '(sal)' : '(calorias)'}?
            </Text>
          </View>

          <View style={styles.radioGroup}>
            {opcoes.map((opcao) => (
              <TouchableOpacity key={opcao} style={styles.radioButtonContainer} onPress={() => setOpcaoSelecionada(opcao)} activeOpacity={0.7}>
                <View style={[styles.radioOuterCircle, opcaoSelecionada === opcao && styles.radioOuterCircleActive]}>
                  {opcaoSelecionada === opcao && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioLabel}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Porquê?</Text>
            <TextInput
              style={[styles.textInput, isFocused && styles.textInputFocused]}
              multiline
              numberOfLines={4}
              placeholder="Escreva aqui a sua justificação..."
              placeholderTextColor="#C7B8AA"
              value={porqueTexto}
              onChangeText={setPorqueTexto}
              textAlignVertical="top"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
            />
          </View>

          
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleSeguinte} activeOpacity={0.8}>
            <Text style={styles.nextButtonText}>Seguinte</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F0',
    paddingTop: Platform.OS === 'android' ? 35 : 10,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 24,
    paddingTop: 12,
    alignItems: 'center',
  },
  breadcrumbContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 20,
  },
  questionContainer: {
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  mainQuestion: {
    fontSize: 19,
    color: '#613512',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    width: '100%',
    textAlign: 'left',
    marginTop:-30,
  },
  radioGroup: {
    width: '100%',
    marginBottom: 28,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 6,
  },
  radioOuterCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E28A47',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterCircleActive: {
    borderColor: '#E28A47',
  },
  radioInnerCircle: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#E28A47',
  },
  radioLabel: {
    fontSize: 18,
    color: '#613512',
  },
  inputSection: {
    width: '100%',
    marginBottom: 36,
  },
  inputLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#613512',
    marginBottom: 12,
  },
  textInput: {
    width: '100%',
    minHeight: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E28A47',
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    color: '#613512',
  },
  textInputFocused: {
    borderColor: '#D9903E',
  },
  boldText: {
    fontWeight: '700',
    color: '#9C5325',
  },
  footer: {
    paddingBottom: 36,
    alignItems: 'center',
    backgroundColor: '#FAF5F0',
    paddingTop: 12,
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
