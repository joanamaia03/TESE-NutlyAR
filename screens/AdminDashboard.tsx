

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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const hiddenUserMarkers = ['admin', 'inesctec', 'joana maia', 'carlota'];

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

      const usersById = new Map<string, any>();
      usersSnapshot.forEach((doc) => usersById.set(doc.id, doc.data()));

      // pick latest session per user by startedAt
      const sessionsByUser = new Map<string, any>();
      sessionsSnapshot.forEach((doc) => {
        const data = doc.data() as any;
        const uid = data.userId;
        if (!uid) return;
        const existing = sessionsByUser.get(uid);
        const getTime = (t: any) => {
          if (!t) return 0;
          if (typeof t === 'number') return t;
          if (typeof t === 'string') return Date.parse(t) || 0;
          if (typeof t.toDate === 'function') return t.toDate().getTime();
          if (t.seconds) return t.seconds * 1000;
          return 0;
        };
        const started = getTime(data.startedAt) || getTime(data.started_at) || 0;
        const existingStarted = existing ? getTime(existing.startedAt) || getTime(existing.started_at) || 0 : 0;
        if (!existing || started >= existingStarted) sessionsByUser.set(uid, data);
      });

      const allUsers: any[] = [];
      demographicsSnapshot.forEach((doc) => {
        const data = doc.data();
        const socio = getSocioData(data);
        const userData = usersById.get(data.userId) || usersById.get(doc.id) || {};
        const sessionData = sessionsByUser.get(data.userId) || {};
        const groups = sessionData.groups || {};
        const user = {
          id: doc.id,
          username: userData.username || userData.displayName || userData.name || data.username || data.displayName || data.name || '',
          email: userData.email || userData.emailNormalized || data.email || data.emailNormalized || '',
          genero: formatValue(socio.genero),
          dataNascimento: formatValue(socio.dataNascimento),
          idade: formatValue(socio.grupoIdade || socio.idade),
          grauEscolaridade: formatValue(socio.grauEscolaridade),
          municipioResidencia: formatValue(socio.municipioResidencia),
          municipiosAnteriores: formatValue(socio.municipiosAnteriores),
          condicaoMedica: formatValue(socio.condicaoMedica),
          padraoAlimentar: formatValue(socio.padraoAlimentar),
          raw: data,
          sessionRaw: sessionData,
          // per-group per-position fields
          ...[1,2,3,4].reduce((acc, g) => {
            const answers = (groups[g] && groups[g].answers) || [];
            acc[`g${g}_p0`] = formatValue(answers[0]?.selectedImage ?? answers[0]?.selectedImage?.id ?? answers[0]?.selectedImage?.name ?? answers[0]);
            acc[`g${g}_p1`] = formatValue(answers[1]?.confidence ?? answers[1]?.confidence);
            acc[`g${g}_p2`] = formatValue(answers[2]?.reasons ?? answers[2]?.reasons ?? answers[2]);
            acc[`g${g}_p3`] = formatValue(answers[3]?.imagineResponse?.opcaoSelecionada ?? answers[3]?.opcaoSelecionada) + (answers[3]?.imagineResponse?.porqueTexto || answers[3]?.porqueTexto ? ` | ${formatValue(answers[3]?.imagineResponse?.porqueTexto ?? answers[3]?.porqueTexto)}` : '');
            acc[`g${g}_p4`] = formatValue(answers[4]?.selectedImage ?? answers[4]?.selectedImage);
            return acc;
          }, {} as any),
        };

        if (!shouldHideUser(user)) {
          allUsers.push(user);
        }
      });

      setSessions(allUsers);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      const errorCode = (error as any)?.code;
      if (errorCode === 'permission-denied') {
        setLoadError('Sem permissões para ler as sessões. Confirma se as regras do Firestore já foram publicadas.');
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
        <ActivityIndicator size="large" color="#f9e7d9" />
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
            {/* Cabeçalho da Tabela (Dados Sociodemográficos) */}
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
              {/* Grupo 1 */}
              <Text style={[styles.headerCell, { width: 160 }]}>G1-0 (sel)</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>G1-1 (conf)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G1-2 (reasons)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G1-3 (opção|porque)</Text>
              <Text style={[styles.headerCell, { width: 160 }]}>G1-4 (sel)</Text>
              {/* Grupo 2 */}
              <Text style={[styles.headerCell, { width: 160 }]}>G2-0 (sel)</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>G2-1 (conf)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G2-2 (reasons)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G2-3 (opção|porque)</Text>
              <Text style={[styles.headerCell, { width: 160 }]}>G2-4 (sel)</Text>
              {/* Grupo 3 */}
              <Text style={[styles.headerCell, { width: 160 }]}>G3-0 (sel)</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>G3-1 (conf)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G3-2 (reasons)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G3-3 (opção|porque)</Text>
              <Text style={[styles.headerCell, { width: 160 }]}>G3-4 (sel)</Text>
              {/* Grupo 4 */}
              <Text style={[styles.headerCell, { width: 160 }]}>G4-0 (sel)</Text>
              <Text style={[styles.headerCell, { width: 100 }]}>G4-1 (conf)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G4-2 (reasons)</Text>
              <Text style={[styles.headerCell, { width: 200 }]}>G4-3 (opção|porque)</Text>
              <Text style={[styles.headerCell, { width: 160 }]}>G4-4 (sel)</Text>
            </View>

            {/* Linhas da Tabela (Utilizadores) */}
            {sessions.map((user) => (
              <>
                <View key={user.id} style={styles.tableRow}>
                  <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>{user.id.slice(0, 8)}...</Text>
                  <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.username}</Text>
                  <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>{user.email}</Text>
                  <TouchableOpacity style={styles.viewButton} onPress={() => setExpandedRows((s) => ({ ...s, [user.id]: !s[user.id] }))}>
                    <Text style={styles.viewButtonText}>{expandedRows[user.id] ? 'Ocultar' : 'Ver'}</Text>
                  </TouchableOpacity>
                <Text style={[styles.cell, { width: 120 }]} numberOfLines={1}>{user.genero}</Text>
                <Text style={[styles.cell, { width: 140 }]} numberOfLines={1}>{user.dataNascimento}</Text>
                <Text style={[styles.cell, { width: 90 }]} numberOfLines={1}>{user.idade}</Text>
                <Text style={[styles.cell, { width: 180 }]} numberOfLines={1}>{user.grauEscolaridade}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={1}>{user.municipioResidencia}</Text>
                <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>{user.municipiosAnteriores}</Text>
                <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>{user.condicaoMedica}</Text>
                <Text style={[styles.cell, { width: 220 }]} numberOfLines={1}>{user.padraoAlimentar}</Text>
                {/* Grupo 1 */}
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g1_p0}</Text>
                <Text style={[styles.cell, { width: 100 }]} numberOfLines={1}>{user.g1_p1}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g1_p2}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g1_p3}</Text>
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g1_p4}</Text>
                {/* Grupo 2 */}
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g2_p0}</Text>
                <Text style={[styles.cell, { width: 100 }]} numberOfLines={1}>{user.g2_p1}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g2_p2}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g2_p3}</Text>
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g2_p4}</Text>
                {/* Grupo 3 */}
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g3_p0}</Text>
                <Text style={[styles.cell, { width: 100 }]} numberOfLines={1}>{user.g3_p1}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g3_p2}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g3_p3}</Text>
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g3_p4}</Text>
                {/* Grupo 4 */}
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g4_p0}</Text>
                <Text style={[styles.cell, { width: 100 }]} numberOfLines={1}>{user.g4_p1}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g4_p2}</Text>
                <Text style={[styles.cell, { width: 200 }]} numberOfLines={2}>{user.g4_p3}</Text>
                <Text style={[styles.cell, { width: 160 }]} numberOfLines={1}>{user.g4_p4}</Text>
                </View>

                {expandedRows[user.id] && (
                  <View style={styles.detailsBox} key={`${user.id}-details`}>
                    <Text style={styles.detailsText}>{JSON.stringify(user.sessionRaw || user.raw || {}, null, 2)}</Text>
                  </View>
                )}
              </>
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
  subtitle: { fontSize: 16, color: '#4b4b4b', marginTop: 4 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9e7d9',
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: '#FFCDA6',
  },
  headerCell: {
    color: '#4b4b4b',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 4,
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
  },
  cell: {
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#4b4b4b',
  },
  viewButton: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  viewButtonText: { color: '#4b4b4b', fontWeight: '600' },
  detailsBox: {
    backgroundColor: '#FFFDF8',
    marginHorizontal: 8,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFDFAF',
  },
  detailsText: { color: '#333', fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  completed: { color: '#4CAF50', fontWeight: '600' },
  inProgress: { color: '#FF9800', fontWeight: '600' },
  refreshButton: {
    backgroundColor: '#81B29A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    margin: 20,
    borderRadius: 25,
  },
  refreshText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#4b4b4b', fontSize: 16 },
  errorBanner: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FBE1CE',
    borderWidth: 1,
    borderColor: '#FFCDA6',
  },
  errorText: {
    color: '#4b4b4b',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
});