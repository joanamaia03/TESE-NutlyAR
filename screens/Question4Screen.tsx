import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBreadcrumb from './ProgressBar';
import { db, auth } from '../src/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export default function ImagineScreen({ route, navigation }: any) {
  const { perguntaAtual = 4 } = route.params || {};

  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [porqueTexto, setPorqueTexto] = useState('');

  const opcoes = ['Sim', 'Não', 'Não Sei'];

  const handleSeguinte = () => {
    if (!opcaoSelecionada) {
      Alert.alert('Aviso', 'Por favor, selecione uma das opções antes de continuar.');
      return;
    }
    if (!porqueTexto.trim()) {
      Alert.alert('Aviso', 'Por favor, escreva uma justificação antes de continuar.');
      return;
    }

    (async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Sessão necessária', 'Precisas de estar com a sessão iniciada para guardar as respostas.');
        return;
      }

      try {
        const resposta = { opcaoSelecionada, porqueTexto };
        const qRef = doc(db, 'question', user.uid);
        await setDoc(
          qRef,
          {
            userId: user.uid,
            perguntaAtual,
            respostaQuestion4: resposta,
            ultimaAtualizacao: new Date().toISOString(),
          },
          { merge: true }
        );

        const userRef = doc(db, 'utilizadores', user.uid);
        await updateDoc(userRef, {
          ultimaAtualizacao: new Date().toISOString(),
          ultimaRespostaQuestion4: resposta,
        });
      } catch (error: any) {
        Alert.alert('Erro', 'Erro ao guardar no servidor: ' + (error?.message || String(error)));
        return;
      }

        if (perguntaAtual < 6) {
        navigation.navigate('ARScreen', {
          perguntaProxima: perguntaAtual + 1,
          faseDaPergunta: 2,
          respostaQuestion4: { opcaoSelecionada, porqueTexto },
          popupOverride: 'Nesta fase desbloqueou o **botão de informação**, no qual tem acesso ao peso dos alimentos e à energia por 100g. Qual destas porções terá **mais energia (calorias)** no total? Pode fazer uma estimativa, **sem usar calculadora**. Selecione **apenas uma** das opções.',
          enableInfo: true,
        });
      } else {
        navigation.navigate('FinishScreen', {
          respostaQuestion4: { opcaoSelecionada, porqueTexto },
        });
      }
    })();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.breadcrumbContainer}>
            <ProgressBreadcrumb currentStep={perguntaAtual} />
          </View>

          <View style={styles.questionContainer}>
            <Text style={styles.mainQuestion}>
              Imagine se este alimento que escolheu tivesse apenas metade da quantidade apresentada. Continuaria a ser a opção com mais energia (calorias)?
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
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Escreva aqui a sua justificação..."
              placeholderTextColor="#C7B8AA"
              value={porqueTexto}
              onChangeText={setPorqueTexto}
              textAlignVertical="top"
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
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 8,
    alignItems: 'center',
  },
  breadcrumbContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  questionContainer: {
    width: '100%',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  mainQuestion: {
    fontSize: 20,
    color: '#613512',
    lineHeight: 28,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    width: '100%',
    textAlign: 'left',
  },
  radioGroup: {
    width: '100%',
    marginBottom: 20,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioOuterCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#613512',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterCircleActive: {
    borderColor: '#733D14',
  },
  radioInnerCircle: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#733D14',
  },
  radioLabel: {
    fontSize: 18,
    color: '#613512',
  },
  inputSection: {
    width: '100%',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#613512',
    marginBottom: 12,
  },
  textInput: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#FAF5F0',
    borderWidth: 1.5,
    borderColor: '#613512',
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    color: '#613512',
  },
  footer: {
    paddingBottom: 32,
    alignItems: 'center',
    backgroundColor: '#FAF5F0',
    paddingTop: 10,
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
