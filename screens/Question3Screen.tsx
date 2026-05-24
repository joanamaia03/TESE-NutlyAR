import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import ProgressBreadcrumb from './ProgressBar';
import { MaterialIcons } from '@expo/vector-icons';
import { db, auth } from '../src/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

// Try to load draggable list component if installed
// @ts-ignore
let DraggableFlatList: any = null;
try {
  // @ts-ignore
  DraggableFlatList = require('react-native-draggable-flatlist').default;
} catch (e) {
  DraggableFlatList = null;
}

export default function DecisionFactorsScreen({ route, navigation }: any) {
  const { perguntaAtual = 1 } = route.params || {};

  const fatoresLista = [
    'Tamanho/Quantidade da Porção',
    'Tipo de alimentos / Ingredientes',
    'Forma de confeção (molho, frito, ...)',
    'Foi um palpite / Não sei explicar',
    'Outro',
  ];

  // items state: maintain current order, text and selection
  const [items, setItems] = useState(() =>
    fatoresLista.map((title, i) => ({ id: String(i), title, text: '', selected: false, order: 0 }))
  );

  // Selection is now inferred from non-empty text values; no toggle button needed.

  const handleSeguinte = () => {
    const withText = items.filter((it) => it.text && it.text.trim().length > 0);
    const ordered = withText.filter((it) => it.order && it.order > 0).sort((a, b) => a.order - b.order);
    const unordered = withText.filter((it) => !it.order || it.order === 0);
    const fatoresOrdenadosComTexto = [...ordered, ...unordered].map((it, orderIndex) => ({
      grauImportancia: orderIndex + 1,
      fator: it.text && it.text.trim().length > 0 ? it.text : it.title,
    }));

    (async () => {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Sessão necessária', 'Precisas de estar com a sessão iniciada para guardar as respostas.');
        return;
      }

      try {
        const fatores = items.map((it) => (it.text && it.text.trim().length > 0 ? it.text : it.title));
        const qRef = doc(db, 'question', user.uid);
        await setDoc(
          qRef,
          {
            userId: user.uid,
            perguntaAtual,
            fatoresOrdenadosComTexto,
            fatores,
            ultimaAtualizacao: new Date().toISOString(),
          },
          { merge: true }
        );

        const userRef = doc(db, 'utilizadores', user.uid);
        await updateDoc(userRef, {
          ultimaAtualizacao: new Date().toISOString(),
          ultimaRespostaFatores: fatores,
          ultimaRespostaFatoresOrdenados: fatoresOrdenadosComTexto,
        });
      } catch (error: any) {
        Alert.alert('Erro', 'Erro ao guardar no servidor: ' + (error?.message || String(error)));
        return;
      }
    })();

    navigation.navigate('Question4Screen', {
      perguntaAtual,
      fatoresOrdenadosComTexto,
    });
  };

  const toggleOrder = (index: number) => {
    setItems((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const curr = next[index];
      if (!curr) return prev;

      if (!curr.order || curr.order === 0) {
        const max = next.reduce((m, it) => Math.max(m, it.order || 0), 0);
        curr.order = max + 1;
      } else {
        const removed = curr.order;
        curr.order = 0;
        for (const it of next) {
          if (it.order && it.order > removed) it.order = it.order - 1;
        }
      }

      return next;
    });
  };

  const toggleOrderById = (id: string) => {
    setItems((prev) => {
      const next = prev.map((p) => ({ ...p }));
      const idx = next.findIndex((n) => n.id === id);
      if (idx === -1) return prev;
      const curr = next[idx];

      if (!curr.order || curr.order === 0) {
        const max = next.reduce((m, it) => Math.max(m, it.order || 0), 0);
        curr.order = max + 1;
      } else {
        const removed = curr.order;
        curr.order = 0;
        for (const it of next) {
          if (it.order && it.order > removed) it.order = it.order - 1;
        }
      }

      return next;
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={perguntaAtual} />
      </View>

      {DraggableFlatList ? (
        <View style={styles.content}>
          <Text style={styles.title}>O que pesou mais na sua decisão?</Text>

          <Text style={styles.instructions}>Por favor, selecione todas as que se aplicam e forneça um comentário:</Text>

          <View style={styles.optionsContainer}>
            <DraggableFlatList
              data={items}
              keyboardShouldPersistTaps="handled"
              keyExtractor={(item: any) => item.id}
              onDragEnd={({ data }: any) => setItems(data)}
              renderItem={({ item, index, drag }: any) => {
                const selectedIds = items.filter((it) => it.text && it.text.trim().length > 0).map((it) => it.id);
                const orderPosition = selectedIds.indexOf(item.id);

                return (
                  <View key={item.id} style={styles.buttonWrapper}>
                    <Text style={styles.factorLabel}>{item.title}</Text>

                    <View style={styles.optionRowInner}>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          value={item.text}
                          editable={true}
                          onChangeText={(text) => {
                            setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, text } : p)));
                          }}
                          placeholderTextColor="#a18e80"
                          style={[styles.inputReason, styles.optionInput, { paddingRight: 80 }]}
                          multiline
                        />

                        <TouchableOpacity
                          style={styles.orderButtonInside}
                          onPress={() => toggleOrderById(item.id)}
                        >
                          <MaterialIcons name="sort" size={18} color="#FFF" />
                          {items.find((it) => it.id === item.id && it.order && it.order > 0) ? (
                            <View style={styles.orderBadge}><Text style={styles.orderBadgeText}>{String(items.find((it) => it.id === item.id)!.order)}</Text></View>
                          ) : null}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          </View>

          <Text style={styles.footerNote}>Se selecionar mais do que um fator, por favor ordene por grau de importância!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>O que pesou mais na sua decisão?</Text>

          <Text style={styles.instructions}>Por favor, selecione todas as que se aplicam e forneça um comentário:</Text>

          <View style={styles.optionsContainer}>
            {items.map((it, index) => {
              const selectedIndices = items.reduce<number[]>((acc, item, i) => (item.text && item.text.trim().length > 0 ? acc.concat(i) : acc), []);
              const orderPosition = selectedIndices.indexOf(index);

              return (
                <View key={it.id} style={styles.buttonWrapper}>
                  <Text style={styles.factorLabel}>{it.title}</Text>
                  <View style={styles.optionRowInner}>
                    <View style={styles.inputWrapper}>
                      <TextInput
                        value={it.text}
                        editable={true}
                        onChangeText={(text) => {
                          setItems((prev) => prev.map((p) => (p.id === it.id ? { ...p, text } : p)));
                        }}
                        placeholder="Comentário"
                        placeholderTextColor="#a18e80"
                        style={[styles.inputReason, styles.optionInput, { paddingRight: 80 }]}
                        multiline
                      />

                      <TouchableOpacity
                        style={styles.orderButtonInside}
                        onPress={() => toggleOrderById(it.id)}
                      >
                        <MaterialIcons name="sort" size={18} color="#FFF" />
                        {items.find((x) => x.id === it.id && x.order && x.order > 0) ? (
                          <View style={styles.orderBadge}><Text style={styles.orderBadgeText}>{String(items.find((x) => x.id === it.id)!.order)}</Text></View>
                        ) : null}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={styles.footerNote}>Se selecionar mais do que um fator, por favor ordene por grau de importância!</Text>
        </ScrollView>
      )}

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
    backgroundColor: '#FAF5F0',
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
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    color: '#613512',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 20,
    marginTop: 20,
  },
  instructions: {
    fontSize: 15,
    color: '#613512',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
    marginBottom: 25,
  },
  optionsContainer: {
    width: '100%',
    gap: 14,
  },
  buttonWrapper: {
    width: '100%',
  },
  factorLabel: {
    fontSize: 16,
    color: '#613512',
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 12,
  },
  optionRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
    minHeight: 44,
    justifyContent: 'center',
  },
  inputReason: { flex: 1, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E28A47', borderRadius: 12, padding: 10, color: '#613512' },
  optionInput: {
    color: '#613512',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  dragHandle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dragIcon: {
    color: '#613512',
    fontSize: 20,
    fontWeight: '700',
  },
  
  footerNote: {
    fontSize: 14,
    color: '#613512',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.85,
    marginTop: 25,
    paddingHorizontal: 10,
  },
  orderButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#A15B2A',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonInside: {
    position: 'absolute',
    right: 10,
    top: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#A15B2A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,
  },
  orderBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#613512',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
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
