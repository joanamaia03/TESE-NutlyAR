import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import ProgressBreadcrumb from '../ProgressBar'; // Ajusta o caminho conforme o teu projeto

export default function ImagineScreen({ route, navigation }: any) {
  const { perguntaAtual = 4 } = route.params || {};

  // Estados para capturar a resposta e o texto
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [porqueTexto, setPorqueTexto] = useState('');

  const opcoes = ["Sim", "Não", "Não Sei"];

  const handleSeguinte = () => {
    if (!opcaoSelecionada) {
      Alert.alert("Aviso", "Por favor, selecione uma das opções antes de continuar.");
      return;
    }

    if (!porqueTexto.trim()) {
      Alert.alert("Aviso", "Por favor, escreva uma justificação antes de continuar.");
      return;
    }

    if (perguntaAtual < 6) {
      navigation.navigate('ARScreen', {
        perguntaProxima: perguntaAtual + 1,
        respostaQuestion4: {
          opcaoSelecionada,
          porqueTexto,
        },
      });
    } else {
      navigation.navigate('FinishScreen', {
        respostaQuestion4: {
          opcaoSelecionada,
          porqueTexto,
        },
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Previne que o teclado tape os inputs em ecrãs pequenos */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Breadcrumb Superior */}
          <View style={styles.breadcrumbContainer}>
            <ProgressBreadcrumb currentStep={perguntaAtual} />
          </View>

          {/* Pergunta Principal */}
          <View style={styles.questionContainer}>
            <Text style={styles.mainQuestion}>
              Imagine se este alimento que escolheu tivesse apenas metade da quantidade apresentada. Continuaria a ser a opção com mais energia (calorias)?
            </Text>
          </View>

          {/* Grupo de Radio Buttons */}
          <View style={styles.radioGroup}>
            {opcoes.map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={styles.radioButtonContainer}
                onPress={() => setOpcaoSelecionada(opcao)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.radioOuterCircle,
                  opcaoSelecionada === opcao && styles.radioOuterCircleActive
                ]}>
                  {opcaoSelecionada === opcao && <View style={styles.radioInnerCircle} />}
                </View>
                <Text style={styles.radioLabel}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campo Aberto: Porquê? */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Porquê?</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              placeholder="Escreva aqui a sua justificação..."
              placeholderTextColor="#C7B8AA"
              value={porqueTexto}
              onChangeText={setPorqueTexto}
              textAlignVertical="top"
            />
          </View>

          {/* Botão Seguinte */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.nextButton} onPress={handleSeguinte}>
              <Text style={styles.nextButtonText}>Seguinte</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F0', // Bege claro NutlyAR
  },
  scrollContent: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    alignItems: 'center',
  },
  breadcrumbContainer: {
    marginTop: 20,
    marginBottom: 40,
  },
  questionContainer: {
    width: '100%',
    marginBottom: 30,
  },
  mainQuestion: {
    fontSize: 20,
    color: '#613512',
    lineHeight: 28,
    textAlign: 'left',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
  },
  radioGroup: {
    width: '100%',
    marginBottom: 40,
    gap: 15,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
  radioOuterCircle: {
    height: 28,
    width: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#613512',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  radioOuterCircleActive: {
    borderColor: '#733D14',
  },
  radioInnerCircle: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: '#733D14', // Cor castanho escuro quando ativo
  },
  radioLabel: {
    fontSize: 18,
    color: '#613512',
  },
  inputSection: {
    width: '100%',
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#613512',
    marginBottom: 15,
  },
  textInput: {
    width: '100%',
    minHeight: 120,
    backgroundColor: '#FAF5F0',
    borderWidth: 1.5,
    borderColor: '#613512',
    borderRadius: 20,
    padding: 15,
    fontSize: 16,
    color: '#613512',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#613512',
    width: 180,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
});