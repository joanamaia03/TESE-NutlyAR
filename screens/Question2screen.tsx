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
import ProgressBreadcrumb from './ProgressBar'; // Ajusta o caminho conforme o teu projeto
import { db, auth } from '../src/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export default function ReasonScreen({ route, navigation }: any) {
  // Recupera o estado atual, histórico e a classificação de confiança vinda do ecrã anterior
  const { perguntaAtual = 1 } = route.params || {};

  // Não usamos radio buttons — o motivo principal será o primeiro motivo não vazio

  // Cinco campos editáveis separados (remoção de `motivosLista` a pedido)
  const [reason1, setReason1] = useState<string>('');
  const [reason2, setReason2] = useState<string>('');
  const [reason3, setReason3] = useState<string>('');
  const [reason4, setReason4] = useState<string>('');
  const [reason5, setReason5] = useState<string>('');

  const handleSeguinte = () => {
    // Prepara motivoPrincipal
    const reasons = [reason1, reason2, reason3, reason4, reason5];
    const selected = reasons.find((r) => r && r.trim().length > 0) || reasons[0] || '';
    const motivoPrincipal = selected;

    // Guarda no Firestore seguindo o mesmo padrão do Question1
    (async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Sessão necessária', 'Precisas de estar com a sessão iniciada para guardar as respostas.');
        return;
      }

      try {
        const motivos = [reason1, reason2, reason3, reason4, reason5];
        const qRef = doc(db, 'question', user.uid);
        await setDoc(qRef, {
          userId: user.uid,
          perguntaAtual,
          motivoPrincipal,
          motivos,
          ultimaAtualizacao: new Date().toISOString(),
        }, { merge: true });

        const userRef = doc(db, 'utilizadores', user.uid);
        await updateDoc(userRef, {
          ultimaAtualizacao: new Date().toISOString(),
          ultimaRespostaMotivo: motivoPrincipal,
          ultimaRespostaMotivos: motivos,
        });
      } catch (error: any) {
        Alert.alert('Erro', 'Erro ao guardar no servidor: ' + (error?.message || String(error)));
        return;
      }
    })();

    // CONTROLADOR DE FLUXO DA TESE (6 Perguntas no Total)
    if (perguntaAtual < 6) {
      navigation.navigate('Question3Screen', {
        perguntaAtual,
      });
    } else {
      navigation.navigate('FinishScreen');
    }
  };

  

  return (
    <SafeAreaView style={styles.container}>
      {/* Indicador de Progresso (Breadcrumb) */}
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={perguntaAtual} />
      </View>

      {/* Conteúdo Principal com Scroll para ecrãs mais pequenos */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Qual o motivo principal da sua escolha?</Text>

        {/* Mapeamento dos botões ovais idênticos ao design */}
        <View style={styles.optionsContainer}>
          {[0,1,2,3,4].map((index) => {
            const reasons = [reason1, reason2, reason3, reason4, reason5];
            const setters: Array<(t: string) => void> = [setReason1, setReason2, setReason3, setReason4, setReason5];
            const motivo = reasons[index];

            return (
              <View key={index} style={styles.optionRow}>
                <TextInput
                  value={motivo}
                  onChangeText={(text) => setters[index](text)}
                  placeholder={`${index + 1}`}
                  placeholderTextColor="#E28A47"
                  style={[styles.inputReason, styles.optionTextInactive]}
                  multiline
                />
              </View>
            );
          })}
        </View>
        <Text style={styles.footerNote}>
            Se identificar mais do que um fator, por favor ordene por ordem de importância {"\n"} (1: nada importante; 5: muito importante) 
        </Text>
        
      </ScrollView>

      {/* Botão Fixo Inferior - Seguinte */}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#613512', alignItems: 'center', justifyContent: 'center' },
  radioOuterActive: { borderColor: '#733D14' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#733D14' },
  inputReason: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E28A47', borderRadius: 12, padding: 10, color: '#613512' },
  
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