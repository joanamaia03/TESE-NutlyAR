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
  Clipboard,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { db } from '../src/firebase';
import { collection, getDocs, getDocsFromServer } from 'firebase/firestore';

export default function AdminDashboard({ navigation }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hiddenUserMarkers = ['admin', 'inesctec', 'joana maia', 'anonimo', 'maria'];

  const formatValue = (value: any) => {
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join('; ') : '—';
    }
    if (typeof value === 'object') {
      if (typeof value.toDate === 'function') {
        return value.toDate().toLocaleDateString('pt-PT');
      }
      return JSON.stringify(value);
    }
    return String(value).replace(/,/g, ';'); 
  };

  const getSocioData = (data: any) => data?.dadosSociodemograficos || {};

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

    // Esconde a barra de navegação do Android dinamicamente (Immersive Mode)
    const hideNav = async () => {
      if (Platform.OS !== 'android') return;
      try {
        const nav: any = await import('expo-navigation-bar');
        await nav.setVisibilityAsync('hidden');
        await nav.setBehaviorAsync('sticky-immersive');
      } catch (e) {
        console.warn('expo-navigation-bar error', e);
      }
    };
    hideNav();
  }, []);

  

  const fetchAllUsers = async (forceServer = false) => {
    try {
      setLoadError(null);
      setLoading(true);
      setSessions([]);
      
      const usersQuery = collection(db, 'utilizadores');
      const sessionsQuery = collection(db, 'nutly_sessions');

      const [usersSnapshot, sessionsSnapshot] = await Promise.all([
        forceServer ? getDocsFromServer(usersQuery) : getDocs(usersQuery),
        forceServer ? getDocsFromServer(sessionsQuery) : getDocs(sessionsQuery),
      ]);

      const usersById = new Map<string, any>();
      usersSnapshot.forEach((doc) => usersById.set(doc.id, doc.data()));

      const latestSessionsByUser = new Map<string, any>();

      sessionsSnapshot.forEach((doc) => {
        const sessionData = doc.data() as any;
        const uId = String(sessionData.userId || sessionData.uid || sessionData.user_id || '').trim();
        if (!uId) return;

        if (sessionData.status !== 'completed') return;

        const groups = sessionData.groups || {};
        let todosOsGruposValidos = true;

        for (let g = 1; g <= 4; g++) {
          const groupData = groups[String(g)] || groups[g];
          const answers = groupData?.answers || [];
          if (!groupData || answers.length === 0) {
            todosOsGruposValidos = false;
            break;
          }
        }

        if (!todosOsGruposValidos) return;

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
          if (currentSessionTime > existingSessionTime) {
            latestSessionsByUser.set(uId, { id: doc.id, data: sessionData });
          }
        } else {
          latestSessionsByUser.set(uId, { id: doc.id, data: sessionData });
        }
      });

      const allUsers: any[] = [];

      latestSessionsByUser.forEach((sessionInfo, uId) => {
        const sessionData = sessionInfo.data;
        const groups = sessionData.groups || {};
        const userData = usersById.get(uId) || {};
        const socio = getSocioData(userData);

        const user = {
          id: sessionInfo.id,
          username: userData.username || userData.displayName || userData.name || sessionData.username || 'Anónimo',
          email: userData.email || '—',
          genero: formatValue(socio.genero),
          dataNascimento: formatValue(socio.dataNascimento),
          idade: formatValue(socio.grupoIdade || socio.idade),
          grauEscolaridade: formatValue(socio.grauEscolaridade),
          municipioResidencia: formatValue(socio.municipioResidencia),
          municipiosAnteriores: formatValue(socio.municipiosAnteriores),
          condicaoMedica: formatValue(socio.condicaoMedica),
          padraoAlimentar: formatValue(socio.padraoAlimentar),
          raw: userData,
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
                acc[`g${g}_p2`] = ans2.orderedFactors.map((f: any) => `${f.order}º:${f.title}`).join('; ');
              } else if (ans2?.reasons) {
                acc[`g${g}_p2`] = Array.isArray(ans2.reasons) ? ans2.reasons.join('; ') : String(ans2.reasons);
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
              acc[`g${g}_p0`] = '—'; acc[`g${g}_p1`] = '—'; acc[`g${g}_p2`] = '—'; acc[`g${g}_p3`] = '—'; acc[`g${g}_p4`] = '—';
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
      setLoadError('Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    if (sessions.length === 0) {
      Alert.alert('Aviso', 'Não existem dados para exportar de momento.');
      return;
    }

    const headers = [
      'ID_Sessao', 'Username', 'Email', 'Genero', 'Data_Nascimento', 'Idade_Grupo', 
      'Escolaridade', 'Municipio_Residencia', 'Municipios_Anteriores', 'Condicao_Medica', 'Padrao_Alimentar',
      'G1_P0_EscolhaInicial', 'G1_P1_Confianca', 'G1_P2_Motivos', 'G1_P3_MetadeQuantidade', 'G1_P4_EscolhaFinal',
      'G2_P0_EscolhaInicial', 'G2_P1_Confianca', 'G2_P2_Motivos', 'G2_P3_MetadeQuantidade', 'G2_P4_EscolhaFinal',
      'G3_P0_EscolhaInicial', 'G3_P1_Confianca', 'G3_P2_Motivos', 'G3_P3_MetadeQuantidade', 'G3_P4_EscolhaFinal',
      'G4_P0_EscolhaInicial', 'G4_P1_Confianca', 'G4_P2_Motivos', 'G4_P3_MetadeQuantidade', 'G4_P4_EscolhaFinal'
    ];

    const rows = sessions.map(user => [
      user.id, user.username, user.email, user.genero, user.dataNascimento, user.idade,
      user.grauEscolaridade, user.municipioResidencia, user.municipiosAnteriores, user.condicaoMedica, user.padraoAlimentar,
      user.g1_p0, user.g1_p1, user.g1_p2, user.g1_p3, user.g1_p4,
      user.g2_p0, user.g2_p1, user.g2_p2, user.g2_p3, user.g2_p4,
      user.g3_p0, user.g3_p1, user.g3_p2, user.g3_p3, user.g3_p4,
      user.g4_p0, user.g4_p1, user.g4_p2, user.g4_p3, user.g4_p4
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    try {
      Clipboard.setString(csvContent);
      Alert.alert(
        'Sucesso!', 
        'A matriz de dados foi copiada para a área de transferência.\n\nBasta abrir um bloco de notas, e-mail ou mensagem e escolher "Colar".',
        [{ text: 'Ok' }]
      );
    } catch (error) {
      console.error('Erro ao copiar dados:', error);
      Alert.alert('Erro', 'Não foi possível copiar os dados.');
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
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { width: 120 }]}>ID</Text>
              <Text style={[styles.headerCell, { width: 160 }]}>Username</Text>
              <Text style={[styles.headerCell, { width: 220 }]}>Email</Text>
              <Text style={[styles.headerCell, { width: 120 }]}>Género</Text>
              <Text style={[styles.headerCell, { width: 140 }]}>Data Nascimento</Text>
              <Text style={[styles.headerCell, { width: 90 }]}>Idade</Text>
              <Text style={[styles.headerCell, { width: 180 }]}>Grau Escolaridade</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>Município Residência</Text>
              <Text style={[styles.headerCell, { width: 220 }]}>Municípios Anteriores</Text>
              <Text style={[styles.headerCell, { width: 220 }]}>Condição Médica</Text>
              <Text style={[styles.headerCell, { width: 220 }]}>Padrão Alimentar</Text>
              
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

            {sessions.map((user) => (
              <View key={`row-${user.id}`} style={styles.tableRow}>
                <TouchableOpacity style={[styles.cellWrapper, { width: 120 }]} onPress={() => Alert.alert("ID Completo", user.id)}>
                  <Text style={styles.cell} numberOfLines={1}>{user.id.slice(0, 8)}...</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 160 }]} onPress={() => Alert.alert("Username", String(user.username))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.username}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 220 }]} onPress={() => Alert.alert("Email", String(user.email))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.email}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 120 }]} onPress={() => Alert.alert("Género", String(user.genero))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.genero}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 140 }]} onPress={() => Alert.alert("Data de Nascimento", String(user.dataNascimento))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.dataNascimento}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 90 }]} onPress={() => Alert.alert("Idade", String(user.idade))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.idade}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 180 }]} onPress={() => Alert.alert("Grau de Escolaridade", String(user.grauEscolaridade))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.grauEscolaridade}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 200 }]} onPress={() => Alert.alert("Município de Residência", String(user.municipioResidencia))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.municipioResidencia}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 220 }]} onPress={() => Alert.alert("Municípios Anteriores", String(user.municipiosAnteriores))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.municipiosAnteriores}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 220 }]} onPress={() => Alert.alert("Condição Médica", String(user.condicaoMedica))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.condicaoMedica}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.cellWrapper, { width: 220 }]} onPress={() => Alert.alert("Padrão Alimentar", String(user.padraoAlimentar))}>
                  <Text style={styles.cell} numberOfLines={1}>{user.padraoAlimentar}</Text>
                </TouchableOpacity>
                
                {[1, 2, 3, 4].map((g) => {
                  const titulos = [
                    `Grupo ${g} - Primeira Escolha`, `Grupo ${g} - Nível de Confiança`,
                    `Grupo ${g} - Motivos`, `Grupo ${g} - Metade da Quantidade`, `Grupo ${g} - Escolha Final`
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
                        <Text style={styles.cell} numberOfLines={quebrasLinha[pIndex]}>{valorCelula}</Text>
                      </TouchableOpacity>
                    );
                  });
                })}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#81B29A' }]} onPress={() => fetchAllUsers(true)}>
            <Icon name="refresh" size={24} color="#fff" />
            <Text style={styles.actionText}>Atualizar dados</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e0a475' }]} onPress={exportToCSV}>
            <Icon name="download" size={24} color="#fff" />
            <Text style={styles.actionText}>Exportar dados</Text>
          </TouchableOpacity>
        </View>

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
    color: '#4b4b4b', fontWeight: 'bold', textAlign: 'center', textAlignVertical: 'center',
    paddingHorizontal: 8, fontSize: 13, lineHeight: 18,
  },
  tableRow: {
    flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#FFCDA6', alignItems: 'center',
  },
  cell: { paddingHorizontal: 8, textAlign: 'center', fontSize: 14, color: '#4b4b4b', width: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF8F1' },
  loadingText: { marginTop: 12, color: '#4b4b4b', fontSize: 16, fontWeight: '600' },
  errorBanner: { margin: 16, padding: 12, borderRadius: 12, backgroundColor: '#FBE1CE', borderWidth: 1, borderColor: '#FFCDA6' },
  errorText: { color: '#4b4b4b', textAlign: 'center', fontSize: 14, fontWeight: '600' },
  cellWrapper: { justifyContent: 'center', alignItems: 'center', paddingVertical: 4 },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 15,
    marginTop: 25,
    gap: 10
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  actionText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },
});