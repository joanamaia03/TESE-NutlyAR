import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProgressBreadcrumb from './ProgressBar';
import { useNutlySession } from '../src/NutlySessionContext';

type FactorItem = {
  id: number;
  title: string;
  text: string;
  order: number | null;
};

const INITIAL_FACTORS: Omit<FactorItem, 'text' | 'order'>[] = [
  { id: 1, title: 'Tamanho / Quantidade da Porção' },
  { id: 2, title: 'Tipo de alimentos / Ingredientes' },
  { id: 3, title: 'Forma de confeção (molho, frito,...)' },
  { id: 4, title: 'Foi um palpite / Não sei explicar' },
  { id: 5, title: 'Outro' },
];

export default function DecisionFactorsScreen({ route, navigation }: any) {
  const { saveAnswer, currentGroup } = useNutlySession();
  const { perguntaAtual = 1, groupNumber } = route.params || {};
  const breadcrumbStep = groupNumber ?? currentGroup ?? 1;

  const [items, setItems] = useState<FactorItem[]>(
    INITIAL_FACTORS.map((factor) => ({ ...factor, text: '', order: null }))
  );

  const selectedItems = useMemo(
    () => items.filter((item) => item.text.trim().length > 0),
    [items]
  );

  const toggleOrderById = (id: number) => {
    const currentItem = items.find((item) => item.id === id);
    if (!currentItem || currentItem.text.trim().length === 0) {
      Alert.alert('Aviso', 'Escreva um comentário antes de ordenar este fator.');
      return;
    }

    setItems((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;

      const hasOrder = typeof current.order === 'number';
      if (hasOrder) {
        const removedOrder = current.order as number;
        return prev.map((item) => {
          if (item.id === id) return { ...item, order: null };
          if (typeof item.order === 'number' && item.order > removedOrder) {
            return { ...item, order: item.order - 1 };
          }
          return item;
        });
      }

      const nextOrder = prev.filter((item) => typeof item.order === 'number').length + 1;
      return prev.map((item) =>
        item.id === id ? { ...item, order: nextOrder } : item
      );
    });
  };

  const handleSeguinte = async () => {
    const filledItems = items.filter((item) => item.text.trim().length > 0);

    if (filledItems.length === 0) {
      Alert.alert('Aviso', 'Por favor, preencha pelo menos um fator antes de continuar.');
      return;
    }

    if (
      selectedItems.length > 1 && 
      selectedItems.some((item) => typeof item.order !== 'number')
    ) {
      Alert.alert(
        'Aviso', 
        'Se escreveu mais do que 1 fator, por favor ordene-os clicando no botão de ordenação ao lado de cada comentário antes de continuar.'
      );
      return;
    }

    const orderedItems = [...items]
      .filter((item) => item.text.trim().length > 0)
      .sort((a, b) => (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER))
      .map((item) => ({
        title: item.title,
        text: item.text.trim(),
        order: item.order,
      }));

    const answerData = {
      questionId: `g${currentGroup}_q${perguntaAtual}_fatores`,
      groupNumber: currentGroup,
      factors: orderedItems,
      answeredAt: new Date(),
    };

    try {
      await saveAnswer(currentGroup, answerData);

      navigation.navigate('Image4Screen', {
        perguntaAtual,
        groupNumber: currentGroup,
      });
    } catch (error) {
      console.error('Erro ao guardar fatores:', error);
      Alert.alert('Erro', 'Não foi possível guardar as respostas.');
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={breadcrumbStep} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>O que pesou mais na sua decisão?</Text>

        <Text style={styles.instructions}>
          Por favor, selecione todas as que se aplicam e forneça um comentário:
        </Text>

        <View style={styles.optionsContainer}>
          {items.map((item) => (
            <View key={item.id} style={styles.buttonWrapper}>
              <Text style={styles.factorLabel}>{item.title}</Text>

              <View style={styles.optionRowInner}>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={item.text}
                    onChangeText={(text) => {
                      setItems((prev) => prev.map((current) => (current.id === item.id ? { ...current, text } : current)));
                    }}
                    style={[
                      styles.inputReason,
                      styles.optionInput,
                      !item.text && styles.inputPlaceholderText,
                    ]}
                    placeholder="Forneça um comentário"
                    placeholderTextColor="#C7B8AA"
                    multiline
                  />

                  <TouchableOpacity style={styles.orderButtonInside} onPress={() => toggleOrderById(item.id)}>
                    <Text style={styles.orderButtonText}>
                      {typeof item.order === 'number' ? String(item.order) : 'Ordenar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.footerNote}>
          Se selecionar mais do que um fator, por favor ordene por grau de importância!
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleSeguinte}>
          <Text style={styles.nextButtonText}>Seguinte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F1',
    paddingTop: Platform.OS === 'android' ? 24 : 8,
  },
  breadcrumbContainer: {
    alignItems: 'center',
    marginTop: 7,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    color: '#709985',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 33,
    marginBottom: 18,
    marginTop: 14,
  },
  instructions: {
    fontSize: 14,
    color: '#4b4b4b',
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 22,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  buttonWrapper: {
    width: '100%',
  },
  factorLabel: {
    fontSize: 15,
    color: '#4b4b4b',
    fontWeight: '600',
    marginBottom: 6,
    paddingLeft: 10,
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
    minHeight: 46,
    justifyContent: 'center',
  },
  inputReason: {
    flex: 1,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FFCDA6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    color: '#4b4b4b',
  },
  optionInput: {
    color: '#4b4b4b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    paddingRight: 76,
  },

  inputPlaceholderText: {
    fontWeight: '400',
  },
  footerNote: {
    fontSize: 13,
    color: '#4b4b4b',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.85,
    marginTop: 22,
    paddingHorizontal: 8,
  },
  orderButtonInside: {
    position: 'absolute',
    right: 9,
    top: 6,
    paddingVertical: 6,
    paddingHorizontal: 9,
    backgroundColor: '#81B29A',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 6,
  },
  orderButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingBottom: 24,
    alignItems: 'center',
    backgroundColor: '#FFF8F1',
    paddingTop: 10,
  },
  nextButton: {
    backgroundColor: '#81B29A',
    width: '60%',
    maxWidth: 185,
    paddingVertical: 13,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
