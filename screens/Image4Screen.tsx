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
import { db } from '../src/firebase';
import { addDoc, collection, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth } from '../src/firebase';

const opcoes = ['Sim', 'Não'];

export default function Image4Screen({ route, navigation }: any) {
  const { saveAnswer, currentGroup } = useNutlySession();
  const { perguntaAtual = 4, groupNumber } = route.params || {};
  const breadcrumbStep = groupNumber ?? currentGroup ?? 1;
  const isSaltGroup = (groupNumber ?? currentGroup ?? 1) >= 2;

  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [porqueTexto, setPorqueTexto] = useState('');

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
      // 1. Guarda na nova estrutura por grupos (NutlySessionContext)
      await saveAnswer(currentGroup, answerData);

      // 2. Guarda também na coleção quiz_sessions (como nos outros ecrãs)
      const sessionIdParam = route.params?.sessionId;
      
      if (sessionIdParam) {
        const qRef = doc(db, 'quiz_sessions', sessionIdParam);
        await updateDoc(qRef, { 
          answers: arrayUnion(answerData),
          updatedAt: serverTimestamp() 
        });
      } else {
        const newDoc = await addDoc(collection(db, 'quiz_sessions'), { 
          createdAt: serverTimestamp(), 
          answers: [answerData],
          userId: auth.currentUser?.uid  // Adicionado para segurança
        });
        // Se quiseres passar o novo ID para os próximos ecrãs:
        // navigation.navigate('...', { sessionId: newDoc.id });
      }

    } catch (error) {
      console.error("Erro ao guardar resposta Imagine:", error);
      Alert.alert('Erro', 'Não foi possível guardar a resposta.');
    }

    // Navegação
    navigation.navigate('ImageQuizzScreen', {
      perguntaProxima: 1,
      enableInfo: true,
      finalGroupStep: true,
      popupOverride: isSaltGroup
        ? 'Nesta fase desbloqueou o **botão de informação**, no qual tem acesso ao peso dos alimentos e ao sal por 100g. Qual destas porções terá **mais sal** no total? Selecione **apenas uma** das opções.'
        : 'Nesta fase desbloqueou o **botão de informação**, no qual tem acesso ao peso dos alimentos e à energia por 100g. Qual destas porções terá **mais energia (calorias)** no total? Selecione **apenas uma** das opções.',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          <View style={styles.breadcrumbContainer}>
            <ProgressBreadcrumb currentStep={breadcrumbStep} />
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.mainQuestion}>
              Imagine se este <Text style={styles.boldText}>alimento que escolheu</Text> tivesse apenas <Text style={styles.boldText}>metade</Text> da quantidade apresentada. {'\n'}{'\n'}
              Continuaria a ser a opção com <Text style={styles.boldText}>{isSaltGroup ? 'mais sal' : 'mais energia (calorias)'}</Text>?
            </Text>
          </View>

          <View style={styles.radioGroup}>
            {opcoes.map((opcao) => (
              <TouchableOpacity 
                key={opcao} 
                style={styles.radioButtonContainer} 
                onPress={() => setOpcaoSelecionada(opcao)} 
                activeOpacity={0.7}
              >
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
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Escreva aqui a sua justificação..."
              placeholderTextColor="#c0c0c0"
              value={porqueTexto}
              onChangeText={setPorqueTexto}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleSeguinte}>
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
    backgroundColor: '#FFF8F1',
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
    marginBottom: 20,
  },
  questionContainer: {
    width: '100%',
    marginBottom: 20,
  },
  mainQuestion: {
    fontSize: 19,
    color: '#4b4b4b',
    lineHeight: 24,
    textAlign: 'left',
  },
  boldText: {
    fontWeight: '700',
    color: '#709985',
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
    borderColor: '#FFCDA6',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterCircleActive: {
    borderColor: '#81B29A',
  },
  radioInnerCircle: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#81B29A',
  },
  radioLabel: {
    fontSize: 18,
    color: '#4b4b4b',
  },
  inputSection: {
    width: '100%',
    marginBottom: 36,
  },
  inputLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4b4b4b',
    marginBottom: 12,
  },
  textInput: {
    width: '100%',
    minHeight: 140,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FFCDA6',
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    color: '#4b4b4b',
  },
  footer: {
    paddingBottom: 36,
    alignItems: 'center',
    backgroundColor: '#FFF8F1',
    paddingTop: 12,
  },
  nextButton: {
    backgroundColor: '#81B29A',
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