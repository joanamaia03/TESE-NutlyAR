import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { db } from '../src/firebase';
import { collection, getDocs, getDocsFromServer } from 'firebase/firestore';

export default function AdminDashboard({ navigation }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hiddenUserMarkers = ['admin', 'inesctec', 'joana maia', 'anonimo'];

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(', ') : '—';
    }
    if (typeof value === 'object') {
      if (typeof value.toDate === 'function') {
        return value.toDate().toLocaleDateString('pt-PT');
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getSocioData = (data: any) => data?.dadosSociodemograficos || data || {};

  const shouldHideUser = (user: any) => {
    const fieldsToCheck = [
      user.username,
      user.email,
      user.raw?.displayName,
      user.raw?.name,
      user.raw?.username,
    ]
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase());

    return hiddenUserMarkers.some((marker) => fieldsToCheck.includes(marker));
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async (forceServer = false) => {
    try {
      setLoadError(null);
      setLoading(true);
      setSessions([]);
      
      const usersQuery = collection(db, 'utilizadores');
      const demographicsQuery = collection(db, 'demographics');
      const sessionsQuery = collection(db, 'nutly_sessions');

      const [usersSnapshot, demographicsSnapshot, sessionsSnapshot] = await Promise.all([
        forceServer ? getDocsFromServer(usersQuery) : getDocs(usersQuery),
        forceServer ? getDocsFromServer(demographicsQuery) : getDocs(demographicsQuery),
        forceServer ? getDocsFromServer(sessionsQuery) : getDocs(sessionsQuery),
      ]);

      // 1. Mapeia utilizadores por ID
      const usersById = new Map<string, any>();
      usersSnapshot.forEach((doc) => usersById.set(doc.id, doc.data()));

      // 2. Mapeia dados sociodemográficos por ID de utilizador
      const demographicsByUser = new Map<string, any>();
      demographicsSnapshot.forEach((doc) => {
        const dData = doc.data();
        const uId = dData.userId || dData.uid || doc.id;
        if (uId) demographicsByUser.set(String(uId).trim(), dData);
      });

      // 3. FILTRO AVANÇADO: Apenas sessões 'completed' E com todos os grupos respondidos
      const latestSessionsByUser = new Map<string, any>();

      sessionsSnapshot.forEach((doc) => {
        const sessionData = doc.data() as any;
        const uId = String(sessionData.userId || sessionData.uid || sessionData.user_id || '').trim();
        if (!uId) return;

        // Filtro A: Tem de estar marcada como concluída
        if (sessionData.status !== 'completed') {
          return;
        }

        // Filtro B: Validação de consistência interna (Garante que preencheu as opções dos grupos)
        const groups = sessionData.groups || {};
        let todosOsGruposValidos = true;

        for (let g = 1; g <= 4; g++) {
          const groupData = groups[String(g)] || groups[g];
          const answers = groupData?.answers || [];
          
          // Se o grupo não existir ou o array de respostas estiver totalmente vazio,
          // significa que o utilizador saltou ou não preencheu este grupo devido a navegação para trás
          if (!groupData || answers.length === 0) {
            todosOsGruposValidos = false;
            break;
          }
        }

        // Se detetar que falta preenchimento em algum grupo, ignora esta sessão corrupta
        if (!todosOsGruposValidos) {
          return;
        }

        // Função auxiliar para converter qualquer formato de data num número comparável
        const getTime = (t: any) => {
          if (!t) return 0;
          if (typeof t === 'number') return t;
          if (typeof t === 'string') return Date.parse(t) || 0;
          if (typeof t.toDate === 'function') return t.toDate().getTime();
          if (t.seconds) return t.seconds * 1000;
          return 0;
        };

        const currentSessionTime = getTime(sessionData.startedAt) || getTime(sessionData.started_at) || 0;
        const existingSession = latestSessionsByUser.get(uId);
        
        if (existingSession) {
          const existingSessionTime = getTime(existingSession.data.startedAt) || getTime(existingSession.data.started_at) || 0;
          // Retém sempre a sessão preenchida mais recente
          if (currentSessionTime > existingSessionTime) {
            latestSessionsByUser.set(uId, { id: doc.id, data: sessionData });
          }
        } else {
          latestSessionsByUser.set(uId, { id: doc.id, data: sessionData });
        }
      });

      const allUsers: any[] = [];

      // 4. Construção da tabela usando apenas as sessões legítimas e completas
      latestSessionsByUser.forEach((sessionInfo, uId) => {
        const sessionData = sessionInfo.data;
        const groups = sessionData.groups || {};
        
        const demoData = demographicsByUser.get(uId) || {};
        const socio = getSocioData(demoData);
        const userData = usersById.get(uId) || {};

        const user = {
          id: sessionInfo.id,
          username: userData.username || userData.displayName || userData.name || demoData.username || sessionData.username || 'Anónimo',
          email: userData.email || demoData.email || '—',
          genero: formatValue(socio.genero),
          dataNascimento: formatValue(socio.dataNascimento),
          idade: formatValue(socio.grupoIdade || socio.idade),
          grauEscolaridade: formatValue(socio.grauEscolaridade),
          municipioResidencia: formatValue(socio.municipioResidencia),
          municipiosAnteriores: formatValue(socio.municipiosAnteriores),
          condicaoMedica: formatValue(socio.condicaoMedica),
          padraoAlimentar: formatValue(socio.padraoAlimentar),
          raw: demoData,
          sessionRaw: sessionData,
          
          ...[1, 2, 3, 4].reduce((acc, g) => {
            const groupData = groups[String(g)] || groups[g] || {};
            const answers = groupData.answers || [];
            
            const extractMealName = (ansObj: any) => {
              if (!ansObj) return '—';
              let val = ansObj.selectedImage ?? ansObj.nomeImagem ?? ansObj;
              if (typeof val === 'object' && val !== null) {
                val = val.name ?? val.id ?? JSON.stringify(val);
              }
              const textDump = String(val).toLowerCase();
              if (textDump.includes('hotdog') || textDump.includes('cachorro')) return 'hotdog';
              if (textDump.includes('rissois') || textDump.includes('risso') || textDump.includes('croquete')) return 'rissois';
              if (textDump.includes('azeitona')) return 'azeitonas';
              if (textDump.includes('presunto')) return 'presunto';
              if (!textDump || textDump.trim() === '' || textDump.includes('[object object]')) return '—';
              return textDump.split('/').pop()?.replace(/\.(png|jpg|jpeg)$/, '').trim() || '—';
            };

            if (answers.length > 0) {
              const ans0 = answers.find((a: any) => a && a.questionId === `g${g}_q1_ar` && (a.fase === 1 || !a.fase)) || answers[0];
              acc[`g${g}_p0`] = extractMealName(ans0);

              const ans1 = answers.find((a: any) => a && String(a.questionId).includes('_confianca')) || answers[1];
              acc[`g${g}_p1`] = ans1?.confidence !== undefined ? String(ans1.confidence) : '—';

              const ans2 = answers.find((a: any) => a && (a.questionId === `g${g}_q1_motivos` || a.orderedFactors || a.reasons)) || answers[2];
              if (ans2?.orderedFactors && Array.isArray(ans2.orderedFactors)) {
                acc[`g${g}_p2`] = ans2.orderedFactors.map((f: any) => `${f.order}º:${f.title}`).join(', ');
              } else if (ans2?.reasons) {
                acc[`g${g}_p2`] = Array.isArray(ans2.reasons) ? ans2.reasons.join(', ') : String(ans2.reasons);
              } else {
                acc[`g${g}_p2`] = '—';
              }

              const ans3 = answers.find((a: any) => a && (String(a.questionId).includes('_imagine') || a.imagineResponse)) || answers[3];
              const opcao = ans3?.imagineResponse?.opcaoSelecionada ?? ans3?.opcaoSelecionada ?? '';
              const porque = ans3?.imagineResponse?.porqueTexto ?? ans3?.porqueTexto ?? '';
              acc[`g${g}_p3`] = opcao && porque ? `${opcao} | ${porque}` : (opcao || '—');

              const ans4 = answers.find((a: any) => a && a.questionId === `g${g}_q1_ar` && a.fase === 2) || answers[answers.length - 1];
              acc[`g${g}_p4`] = extractMealName(ans4);
            } else {
              acc[`g${g}_p0`] = '—';
              acc[`g${g}_p1`] = '—';
              acc[`g${g}_p2`] = '—';
              acc[`g${g}_p3`] = '—';
              acc[`g${g}_p4`] = '—';
            }
            return acc;
          }, {} as any),
        };

        const usernameLower = String(user.username || '').toLowerCase();
        if (!shouldHideUser(user) && usernameLower !== 'anónimo' && usernameLower !== 'anonimo') {
          allUsers.push(user);
        }
      });

      setSessions(allUsers);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      const errorCode = (error as any)?.code;
      if (errorCode === 'permission-denied') {
        setLoadError('Sem permissões para ler as sessões.');
      } else {
        setLoadError('Não foi possível carregar os dados.');
      }
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#81B29A" />
        <Text style={styles.loadingText}>A carregar dados...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator>
        <View style={styles.header}>
          <Text style={styles.title}>Página Admin</Text>
        </View>

        {loadError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{loadError}</Text>
          </View>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Cabeçalho da Tabela com chaves estritas em cada Text */}
            <View style={styles.tableHeader}>
              <Text key="h-id" style={[styles.headerCell, { width: 120 }]}>ID</Text>
              <Text key="h-user" style={[styles.headerCell, { width: 160 }]}>Username</Text>
              <Text key="h-mail" style={[styles.headerCell, { width: 220 }]}>Email</Text>
              <Text key="h-gen" style={[styles.headerCell, { width: 120 }]}>Género</Text>
              <Text key="h-dat" style={[styles.headerCell, { width: 140 }]}>Data Nascimento</Text>
              <Text key="h-ida" style={[styles.headerCell, { width: 90 }]}>Idade</Text>
              <Text key="h-esc" style={[styles.headerCell, { width: 180 }]}>Grau Escolaridade</Text>
              <Text key="h-mun" style={[styles.headerCell, { width: 200 }]}>Município Residência</Text>
              <Text key="h-muna" style={[styles.headerCell, { width: 220 }]}>Municípios Anteriores</Text>
              <Text key="h-cond" style={[styles.headerCell, { width: 220 }]}>Condição Médica</Text>
              <Text key="h-pad" style={[styles.headerCell, { width: 220 }]}>Padrão Alimentar</Text>
              
              {/* Loop corrigido: Usamos React.Fragment com chave numérica para acalmar o RCTView */}
              {[1, 2, 3, 4].map((g) => (
                <React.Fragment key={`h-group-${g}`}>
                  <Text style={[styles.headerCell, { width: 160 }]}>G{g}-0 </Text>
                  <Text style={[styles.headerCell, { width: 100 }]}>G{g}-1 </Text>
                  <Text style={[styles.headerCell, { width: 200 }]}>G{g}-2 </Text>
                  <Text style={[styles.headerCell, { width: 200 }]}>G{g}-3 </Text>
                  <Text style={[styles.headerCell, { width: 160 }]}>G{g}-4 </Text>
                </React.Fragment>
              ))}
            </View>

            {/* Linhas da Tabela (Utilizadores) */}
            {sessions.map((user) => (
              <View key={`row-${user.id}`} style={styles.tableRow}>
                {/* ID do Utilizador */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 120 }]} 
                  onPress={() => Alert.alert("ID Completo", user.id)}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.id.slice(0, 8)}...</Text>
                </TouchableOpacity>

                {/* Username */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 160 }]} 
                  onPress={() => Alert.alert("Username", String(user.username))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.username}</Text>
                </TouchableOpacity>

                {/* Email */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 220 }]} 
                  onPress={() => Alert.alert("Email", String(user.email))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.email}</Text>
                </TouchableOpacity>

                {/* Género */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 120 }]} 
                  onPress={() => Alert.alert("Género", String(user.genero))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.genero}</Text>
                </TouchableOpacity>

                {/* Data Nascimento */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 140 }]} 
                  onPress={() => Alert.alert("Data de Nascimento", String(user.dataNascimento))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.dataNascimento}</Text>
                </TouchableOpacity>

                {/* Idade */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 90 }]} 
                  onPress={() => Alert.alert("Idade", String(user.idade))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.idade}</Text>
                </TouchableOpacity>

                {/* Grau Escolaridade */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 180 }]} 
                  onPress={() => Alert.alert("Grau de Escolaridade", String(user.grauEscolaridade))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.grauEscolaridade}</Text>
                </TouchableOpacity>

                {/* Município Residência */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 200 }]} 
                  onPress={() => Alert.alert("Município de Residência", String(user.municipioResidencia))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.municipioResidencia}</Text>
                </TouchableOpacity>

                {/* Municípios Anteriores */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 220 }]} 
                  onPress={() => Alert.alert("Municípios Anteriores", String(user.municipiosAnteriores))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.municipiosAnteriores}</Text>
                </TouchableOpacity>

                {/* Condição Médica */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 220 }]} 
                  onPress={() => Alert.alert("Condição Médica", String(user.condicaoMedica))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.condicaoMedica}</Text>
                </TouchableOpacity>

                {/* Padrão Alimentar */}
                <TouchableOpacity 
                  style={[styles.cellWrapper, { width: 220 }]} 
                  onPress={() => Alert.alert("Padrão Alimentar", String(user.padraoAlimentar))}
                >
                  <Text style={styles.cell} numberOfLines={1}>{user.padraoAlimentar}</Text>
                </TouchableOpacity>
                
                {/* Células Dinâmicas das Respostas dos Grupos 1 a 4 */}
                {[1, 2, 3, 4].map((g) => {
                  const titulos = [
                    `Grupo ${g} - Primeira Escolha`,
                    `Grupo ${g} - Nível de Confiança`,
                    `Grupo ${g} - Motivos`,
                    `Grupo ${g} - Metade da Quantidade`,
                    `Grupo ${g} - Escolha Final`
                  ];
                  const larguras = [160, 100, 200, 200, 160];
                  const quebrasLinha = [1, 1, 2, 2, 1];

                  return [0, 1, 2, 3, 4].map((pIndex) => {
                    const valorCelula = String(user[`g${g}_p${pIndex}`] || '—');
                    
                    return (
                      <TouchableOpacity 
                        key={`cell-g${g}-p${pIndex}-${user.id}`}
                        style={[styles.cellWrapper, { width: larguras[pIndex] }]} 
                        onPress={() => Alert.alert(titulos[pIndex], valorCelula)}
                        activeOpacity={0.6}
                      >
                        <Text style={styles.cell} numberOfLines={quebrasLinha[pIndex]}>
                          {valorCelula}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <TouchableOpacity style={styles.refreshButton} onPress={() => fetchAllUsers(true)}>
          <Icon name="refresh" size={24} color="#fff" />
          <Text style={styles.refreshText}>Atualizar Dados</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F1' },
  pageScroll: { flex: 1 },
  pageContent: { paddingBottom: 20 },
  header: { padding: 20, backgroundColor: '#81B29A', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', paddingTop: 20 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9e7d9',
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#FFCDA6',
  },
  headerCell: {
    color: '#4b4b4b',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    paddingHorizontal: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDA6',
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#4b4b4b',
  },
  refreshButton: {
    backgroundColor: '#81B29A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    margin: 20,
    borderRadius: 25,
  },
  cellWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
  },
  refreshText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F1' },
  loadingText: { marginTop: 12, color: '#4b4b4b', fontSize: 16, fontWeight: '600' },
  errorBanner: { margin: 16, padding: 12, borderRadius: 12, backgroundColor: '#FBE1CE', borderWidth: 1, borderColor: '#FFCDA6' },
  errorText: { color: '#4b4b4b', textAlign: 'center', fontSize: 14, fontWeight: '600' },
});