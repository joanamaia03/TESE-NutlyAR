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
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNutlySession } from '../src/NutlySessionContext';
import { db } from '../src/firebase';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { nutlySessionService } from '../src/nutlySessionService';

export default function ReflexaoFinalScreen({ navigation }: any) {
  // Retira os ganchos da sessão ativa através do teu Context oficial
  const { sessionDocId, resetSession } = useNutlySession();
  
  const [reflexaoTexto, setReflexaoTexto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConcluir = async () => {
    if (!reflexaoTexto.trim()) {
      Alert.alert('Aviso', 'Por favor, escreva a sua reflexão antes de concluir.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (sessionDocId) {
        const sessionRef = doc(db, 'nutly_sessions', sessionDocId);
        
        // Atualiza a sessão no Firestore com a reflexão e muda o status para finalizado
        await updateDoc(sessionRef, {
          reflexaoFinal: reflexaoTexto.trim(),
          status: 'completed',
          completedAt: Timestamp.fromDate(new Date())
        });
      }

      // Também grava a reflexão como uma resposta estruturada no array de answers (grupo 0)
      try {
        if (sessionDocId) {
          await nutlySessionService.saveAnswer(sessionDocId, 0, {
            questionId: 'g0_q0_reflexao',
            groupNumber: 0,
            imagineResponse: { opcaoSelecionada: 'texto_livre', porqueTexto: reflexaoTexto.trim() },
          } as any);
        }
      } catch (e) {
        console.warn('Não foi possível gravar a reflexão como resposta estruturada:', e);
      }
      console.log('Sessão Nutly fechada e concluída com sucesso!');
      
      // Limpa os estados globais da sessão local para que possa começar outra futuramente
      resetSession();

      // Navega para o ecrã final de Certificados/Prémios que criámos
      navigation.navigate('FinishScreen');

    } catch (error) {
      console.error('Erro ao submeter reflexão final:', error);
      Alert.alert('Erro', 'Não foi possível guardar a sua reflexão final. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título Principal conforme a imagem */}
          <Text style={styles.mainTitle}>Reflexão Final</Text>

          {/* Instruções curtas para orientar o utilizador antes da caixa de texto */}
          <Text style={styles.instructions}>
            1. No geral, o que sentiu ao realizar este exercício? {'\n'}
            2. Compreendeu o que lhe foi sendo pedido ao longo do exercício? {'\n'}
            3. Que dificuldades sentiu?
          </Text>

          {/* Caixa de Texto Centralizada Grande e Ovalada */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={10}
              placeholder="Escreva aqui as suas notas ou comentários sobre o estudo..."
              placeholderTextColor="#C7B8AA"
              value={reflexaoTexto}
              onChangeText={setReflexaoTexto}
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>
        </ScrollView>

        {/* Botão Inferior Concluir */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.concluirButton}
            onPress={handleConcluir}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.concluirButtonText}>Concluir</Text>
            )}
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
    paddingHorizontal: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#613512', 
    marginTop: 50,
    marginBottom: 50,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 18,
    color: '#613512',
    textAlign: 'left',
    alignSelf: 'stretch',
    marginHorizontal: 12,
    marginBottom: 18,
    lineHeight: 24,
  },
  inputSection: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    maxHeight: 380, // Limita o tamanho vertical da caixa para bater com o design quadrado arredondado
  },
  textInput: {
    width: '100%',
    height: '100%',
    minHeight: 280,
    backgroundColor: '#FAF5F0', 
    borderWidth: 1.5,
    borderColor: '#E28A47', 
    borderRadius: 24, 
    padding: 20,
    fontSize: 16,
    color: '#613512',
    lineHeight: 24,
  },
  footer: {
    paddingBottom: 45,
    alignItems: 'center',
    backgroundColor: '#FAF5F0',
    paddingTop: 10,
  },
  concluirButton: {
    backgroundColor: '#784115', // Castanho chocolate escuro dos teus botões de ação
    width: '60%',
    maxWidth: 200,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  concluirButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});