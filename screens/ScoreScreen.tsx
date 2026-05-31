import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNutlySession } from '../src/NutlySessionContext';
import { db } from '../src/firebase';
import { doc, getDoc } from 'firebase/firestore';

const MAX_POINTS = 1;

export default function ScoreScreen({ navigation }: any) {
  // Usa o Context oficial da tua App para ir buscar o ID da sessão ativa
  const { sessionDocId } = useNutlySession();
  
  const [loading, setLoading] = useState(true);
  const [totalScore, setTotalScore] = useState(0);
  const [computedGroups, setComputedGroups] = useState<Record<number, any>>({});

  // Respostas corretas: inclui alternativa base + substituição.
  const correctAnswers: Record<number, { image1: string[]; imagine: string; image2: string[] }> = {
    1: { image1: ['hotdog.png', 'lombo.jpg'], imagine: 'Não', image2: ['hotdog.png', 'lombo.jpg'] },
    2: { image1: ['rissois.png', 'croquete.jpg'], imagine: 'Não', image2: ['rissois.png', 'croquete.jpg'] },
    3: { image1: ['azeitonas.png', 'chourico.jpg'], imagine: 'Sim', image2: ['azeitonas.png', 'chourico.jpg'] },
    4: { image1: ['presunto.png', 'hotdog.jpg'], imagine: 'Não', image2: ['presunto.png', 'hotdog.jpg'] },
  };

  // Normaliza o nome do ficheiro (remove caminhos e extensões para comparar apenas o prato)
  const cleanMealName = (value: string | null | undefined) => {
    if (!value) return '';
    const clean = String(value).split('/').pop() || String(value);
    return clean.trim().toLowerCase().replace(/\.(png|jpg|jpeg)$/, '');
  };

  const normalizeImagineOption = (value: string | null | undefined) => {
    if (!value) return '';
    return String(value).trim().toLowerCase();
  };

  const isCorrectMeal = (selected: string, accepted: string[]) => {
    if (!selected) return false;
    const selectedNorm = cleanMealName(selected);
    return accepted.some((item) => cleanMealName(item) === selectedNorm);
  };

  useEffect(() => {
    const calcularPontuacoes = async () => {
      if (!sessionDocId) {
        setLoading(false);
        return;
      }

      try {
        // Liga diretamente à tua coleção oficial 'nutly_sessions'
        const sessionRef = doc(db, 'nutly_sessions', sessionDocId);
        const sessionSnap = await getDoc(sessionRef);

        if (sessionSnap.exists()) {
          const sessionData = sessionSnap.data();
          const groupsData = sessionData.groups || {};
          
          let totalGeral = 0;
          const resultadosFinais: Record<number, any> = {};

          // Passa por cada um dos 4 grupos estruturados no Firebase
          [1, 2, 3, 4].forEach((groupNum) => {
            const groupKey = groupNum.toString();
            const groupObj = groupsData[groupKey] || {};
            const answersArray: any[] = groupObj.answers || [];
            const gabarito = correctAnswers[groupNum];

            // Mapeamento fixo por posição no array de respostas do grupo
            const answerP1 = answersArray[0];
            const answerP2 = answersArray[3];
            const answerP3 = answersArray[4];

            // 1. Extrai a Escolha AR Inicial
            const escolhaP1 = cleanMealName(answerP1?.selectedImage);
            const p1Correct = isCorrectMeal(escolhaP1, gabarito.image1);
            const p1Points = p1Correct ? MAX_POINTS : 0;

            // 2. Extrai a Resposta "Imagine" (Pergunta 2)
            const escolhaP2 = normalizeImagineOption(answerP2?.imagineResponse?.opcaoSelecionada || answerP2?.opcaoSelecionada);
            const p2Correct = escolhaP2 !== '' && escolhaP2 === normalizeImagineOption(gabarito.imagine);
            const p2Points = p2Correct ? MAX_POINTS : 0;

            // 3. Extrai a Escolha AR Final
            const escolhaP3 = cleanMealName(answerP3?.selectedImage);
            const p3Correct = isCorrectMeal(escolhaP3, gabarito.image2);
            const p3Points = p3Correct ? MAX_POINTS : 0;

            const totalDoGrupo = p1Points + p2Points + p3Points;
            totalGeral += totalDoGrupo;

            resultadosFinais[groupNum] = {
              score: totalDoGrupo,
              perguntas: [
                { id: '1', label: 'Pergunta 1 (Mais energia)', isCorrect: p1Correct, points: p1Points },
                { id: '2', label: 'Pergunta 2 (Metade da porção)', isCorrect: p2Correct, points: p2Points },
                { id: '3', label: 'Pergunta 3 (Mais energia c/info)', isCorrect: p3Correct, points: p3Points },
              ]
            };
          });

          setComputedGroups(resultadosFinais);
          setTotalScore(totalGeral);
        }
      } catch (error) {
        console.error('Erro ao processar e calcular score:', error);
      } finally {
        setLoading(false);
      }
    };

    calcularPontuacoes();
  }, [sessionDocId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>A calcular os teus resultados...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Resultados</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {[1, 2, 3, 4].map((groupNum) => {
          const groupResult = computedGroups[groupNum];
          // Se o grupo ainda não foi respondido, mostra-o zerado por segurança
          const perguntas = groupResult?.perguntas || [
            { id: '1', label: 'Pergunta 1 (AR Inicial)', isCorrect: false, points: 0 },
            { id: '2', label: 'Pergunta 2 (Cenário)', isCorrect: false, points: 0 },
            { id: '3', label: 'Pergunta 3 (AR Informada)', isCorrect: false, points: 0 },
          ];
          const scoreGrupo = groupResult?.score || 0;

          return (
            <View key={groupNum} style={styles.groupCard}>
              <Text style={styles.groupTitle}>Grupo {groupNum}</Text>

              {perguntas.map((item: any) => (
                <View key={item.id} style={styles.questionRow}>
                  <Text style={styles.questionText}>{item.label}</Text>
                  <Text style={item.isCorrect ? styles.correct : styles.incorrect}>
                    {item.isCorrect ? '✓' : '✗'} {item.points} pts
                  </Text>
                </View>
              ))}

              <View style={styles.groupTotal}>
                <Text style={styles.groupTotalText}>
                  Total do Grupo: {scoreGrupo} / 3 pts
                </Text>
              </View>
            </View>
          );
        })}

        {/* Bloco de Pontuação Final Unificado */}
        <View style={styles.finalScore}>
          <Text style={styles.finalScoreText}>Pontuação Final</Text>
          <Text style={styles.finalScoreNumber}>{totalScore} / 12</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.finishButton} onPress={() => navigation.navigate('CertificadosScreen')}>
        <Text style={styles.finishButtonText}>Certificados</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F1' },
  header: { alignItems: 'center', paddingTop: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#709985', marginTop: 30 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  groupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  groupTitle: { fontSize: 20, fontWeight: 'bold', color: '#4b4b4b', marginBottom: 12 },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EFE6',
  },
  questionText: { fontSize: 15, color: '#4b4b4b' },
  correct: { color: '#4CAF50', fontWeight: 'bold' },
  incorrect: { color: '#F44336', fontWeight: 'bold' },
  groupTotal: { marginTop: 12, paddingTop: 12, borderTopWidth: 2, borderTopColor: '#81B29A' },
  groupTotalText: { fontSize: 17, fontWeight: 'bold', color: '#4b4b4b', textAlign: 'center' },
  finalScore: {
    backgroundColor: '#709985',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  finalScoreText: { color: '#fff', fontSize: 18, marginBottom: 8 },
  finalScoreNumber: { color: '#fff', fontSize: 38, fontWeight: 'bold' },
  finishButton: {
    backgroundColor: '#81B29A',
    marginHorizontal: 20,
    marginBottom: 35,
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
  },
  finishButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingText: { marginTop: 20, color: '#4b4b4b', fontSize: 16, textAlign: 'center' },
});