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
} from 'react-native';
import ProgressBreadcrumb from '../ProgressBar'; // Ajusta o caminho conforme o teu projeto

export default function DecisionFactorsScreen({ route, navigation }: any) {
  // Recupera o estado atual e o histórico completo acumulado até aqui
  const { perguntaAtual = 1, historicoRespostas = [] } = route.params || {};

  // Estado para armazenar os fatores selecionados e a sua ordem de clique
  // Exemplo de estrutura: [2, 0] significa que o fator de índice 2 foi o 1º e o índice 0 foi o 2º
  const [selectedFactorsOrder, setSelectedFactorsOrder] = useState<number[]>([]);

  // LISTA DE FATORES EXTRAÍDA EXATAMENTE DO TEU DESIGN
  const fatoresLista = [
    "Tamanho/Quantidade da Porção",
    "Tipo de alimentos / Ingredientes",
    "Forma de confeção (molho, frito, ...)",
    "Foi um palpite / Não sei explicar",
    "Outro"
  ];

  const handleToggleFactor = (index: number) => {
    if (selectedFactorsOrder.includes(index)) {
      // Se já estava selecionado, remove da lista (retira a seleção)
      setSelectedFactorsOrder(selectedFactorsOrder.filter(i => i !== index));
    } else {
      // Se não estava selecionado, adiciona ao final da ordem de importância
      setSelectedFactorsOrder([...selectedFactorsOrder, index]);
    }
  };

  const handleSeguinte = () => {
    if (selectedFactorsOrder.length === 0) {
      Alert.alert("Aviso", "Por favor, selecione pelo menos um fator que influenciou a sua decisão.");
      return;
    }

    // Mapeia a ordem numérica para os textos correspondentes dos fatores
    const fatoresOrdenadosComTexto = selectedFactorsOrder.map((factorIndex, orderIndex) => ({
      grauImportancia: orderIndex + 1,
      fator: fatoresLista[factorIndex]
    }));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Indicador de Progresso Superior */}
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={perguntaAtual} />
      </View>

      {/* Conteúdo com Scroll preventivo para ecrãs mais pequenos */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>O que pesou mais na sua{"\n"}decisão?</Text>
        
        <Text style={styles.instructions}>
          Por favor, selecione todas as que se aplicam e forneça um comentário:
        </Text>

        {/* Renderização dos Botões Ovais de Fatores */}
        <View style={styles.optionsContainer}>
          {fatoresLista.map((fator, index) => {
            // Verifica se o fator atual está na lista de selecionados
            const orderPosition = selectedFactorsOrder.indexOf(index);
            const isSelected = orderPosition !== -1;

            return (
              <View key={index} style={styles.buttonWrapper}>
                <Text style={styles.factorLabel}>{fator}</Text>
                
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleToggleFactor(index)}
                  style={[
                    styles.optionButton,
                    isSelected ? styles.optionButtonActive : styles.optionButtonInactive
                  ]}
                >
                  {isSelected && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{orderPosition + 1}º</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <Text style={styles.footerNote}>
          Se selecionar mais do que um fator, por favor ordene por grau de importância!
        </Text>
      </ScrollView>

      {/* Botão de Transição Inferior */}
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
    marginTop: 15,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    color: '#613512',
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 15,
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
  optionButton: {
    width: '100%',
    height: 48,
    borderRadius: 24, // Totalmente oval mantendo o teu padrão visual
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
  },
  optionButtonInactive: {
    backgroundColor: '#FAF5F0',
    borderColor: '#613512',
  },
  optionButtonActive: {
    backgroundColor: '#FFDECE', // Tom pastel suave para destacar sem quebrar as cores da app
    borderColor: '#733D14',
  },
  badge: {
    backgroundColor: '#733D14',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  footer: {
    paddingBottom: 45,
    alignItems: 'center',
    backgroundColor: '#FAF5F0',
  },
  nextButton: {
    backgroundColor: '#613512',
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