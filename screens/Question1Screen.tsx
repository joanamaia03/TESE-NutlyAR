import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import ProgressBreadcrumb from './ProgressBar'; // Ajusta o caminho conforme o teu projeto
import { db, auth } from '../src/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

export default function ConfidenceScreen({ route, navigation }: any) {
  // Recupera o passo/pergunta atual e o histórico vindo do ecrã AR
  const { perguntaAtual = 1 } = route.params || {};
  
  // Estado para armazenar a classificação de confiança selecionada (1 a 5)
  const [rating, setRating] = useState<number>(0);

  const handleSeguinte = () => {
    if (rating === 0) {
      alert("Por favor, selecione o seu nível de confiança antes de continuar.");
      return;
    }

    // Guarda no Firestore usando o mesmo princípio da página Demographics
    (async () => {
      const user = auth.currentUser;
      if (!user) {
        alert('Precisas de estar com a sessão iniciada para guardar as respostas.');
        return;
      }

      try {
        const qRef = doc(db, 'question', user.uid);
        await setDoc(qRef, {
          userId: user.uid,
          perguntaAtual,
          confianca: rating,
          ultimaAtualizacao: new Date().toISOString(),
        }, { merge: true });

        const userRef = doc(db, 'utilizadores', user.uid);
        await updateDoc(userRef, {
          ultimaAtualizacao: new Date().toISOString(),
          ultimaRespostaConf: rating,
        });
      } catch (error: any) {
        alert('Erro ao guardar no servidor: ' + (error?.message || String(error)));
        return;
      }
    })();

    // Lógica de navegação: após confiança vamos para o ecrã de motivo (Question2)
    if (perguntaAtual < 6) {
      navigation.navigate('Question2Screen', {
        perguntaAtual: perguntaAtual,
      });
    }

  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Indicador de Progresso no Topo */}
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={perguntaAtual} />
      </View>

      {/* Bloco Central de Conteúdo */}
      <View style={styles.content}>
        <Text style={styles.title}>Quão confiante está na sua resposta?</Text>

        {/* Zona das 5 Estrelas Interativas */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((starNumber) => {
            // Fica preenchida se o número da estrela for menor ou igual ao rating escolhido
            const isSelected = starNumber <= rating;
            
            return (
              <TouchableOpacity
                key={starNumber}
                activeOpacity={0.7}
                onPress={() => setRating(starNumber)}
                style={styles.starButton}
              >
                <View style={styles.starIconWrapper}>
                  <Icon
                    name={isSelected ? "star" : "star-outline"}
                    size={55}
                    color="#6B3E1F" // Tom castanho escuro idêntico ao teu design
                  />
                  {/* Número impresso no centro da estrela */}
                  <Text style={[styles.starNumberText, isSelected && styles.starNumberTextActive]}>
                    {starNumber}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Texto de Apoio / Legenda */}
        <Text style={styles.subtitle}>
          Preencha as estrelas sabendo que 1 é nada confiante e 5 é muito confiante
        </Text>
      </View>

      {/* Botão Seguinte */}
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
    backgroundColor: '#FAF5F0', // Fundo bege claro limpo de toda a aplicação
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
    color: '#6B3E1F',
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
    color: '#6B3E1F', // Número castanho quando a estrela está vazia
    top: Platform.OS === 'ios' ? 18 : 16, // Ajuste milimétrico para centralização vertical
  },
  starNumberTextActive: {
    color: '#FAF5F0', // O número passa a bege claro/branco quando a estrela se preenche
  },
  subtitle: {
    fontSize: 15,
    color: '#6B3E1F',
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
    backgroundColor: '#784115', // Castanho chocolate escuro oficial dos teus botões principais
    width: Math.min(190, Dimensions.get('window').width * 0.6),
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