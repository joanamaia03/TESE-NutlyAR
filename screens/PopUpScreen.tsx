import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  Image, 
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function QuestionScreen({ navigation }: any) {
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [1, 2, 3, 4, 5, 6];

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 1. INDICADOR DE PROGRESSO (1-6) */}
      <View style={styles.progressContainer}>
        {steps.map((step) => (
          <React.Fragment key={step}>
            <View style={[
              styles.stepCircle, 
              currentStep === step ? styles.activeStep : styles.inactiveStep
            ]}>
              <Text style={[
                styles.stepText, 
                currentStep === step ? styles.activeStepText : styles.inactiveStepText
              ]}>
                {step}
              </Text>
            </View>
            {step < 6 && <View style={styles.progressLine} />}
          </React.Fragment>
        ))}
      </View>

      {/* 2. ZONA DE VISUALIZAÇÃO (FRAME DE RA/IMAGEM) */}
      <View style={styles.viewZone}>
        {/* Cantos da Moldura (Custom Brackets) */}
        <View style={[styles.bracket, styles.topLeft]} />
        <View style={[styles.bracket, styles.topRight]} />
        <View style={[styles.bracket, styles.bottomLeft]} />
        <View style={[styles.bracket, styles.bottomRight]} />
        
        {/* Aqui ficaria o conteúdo de RA ou a Imagem selecionada */}
        <Text style={styles.placeholderText}>Zona de Visualização</Text>
      </View>

      {/* 3. CAIXA DE INSTRUÇÕES COM CORUJA */}
      <View style={styles.instructionBox}>
        <Image 
          source={{ uri: 'https://i.imgur.com/vH2XwZt.png' }} // Substitui pela tua foto da coruja
          style={styles.owlImage}
          resizeMode="contain"
        />
        
        <ScrollView style={styles.textContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.mainInstruction}>
            Qual destas opções considera ter <Text style={styles.boldText}>mais energia (calorias)</Text>, 
            considerando exatamente a quantidade apresentada. Selecione <Text style={styles.boldText}>apenas uma</Text> das 
            opções clicando na refeição!
          </Text>
          <Text style={styles.subInstruction}>
            Caso não conheça ou não goste da refeição indicada, pode trocar de imagem após clicar na 
            mesma e desbloquear o botão no canto inferior direito
          </Text>
        </ScrollView>
      </View>

      {/* 4. BOTÃO DE CONFIRMAÇÃO (CHECK) */}
      <View style={styles.confirmAction}>
        <TouchableOpacity style={styles.checkButton} onPress={() => Alert.alert("Confirmado", "Resposta enviada!")}>
          <Icon name="check" size={50} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 5. NAVEGAÇÃO INFERIOR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('HomeScreen')}>
          <Icon name="home-outline" size={35} color="#613512" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => Alert.alert("Info", "Informações sobre o estudo")}>
          <Icon name="information-outline" size={35} color="#613512" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('ImagesScreen')}>
          <Icon name="image-multiple-outline" size={35} color="#613512" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F0',
  },
  /* Indicador de Progresso */
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  stepCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStep: {
    backgroundColor: '#C48A5E', // Cor de destaque do passo 1
  },
  inactiveStep: {
    backgroundColor: '#F2E6D9',
    borderWidth: 1,
    borderColor: '#EBD9C6',
  },
  stepText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  activeStepText: { color: '#FFF' },
  inactiveStepText: { color: '#C48A5E' },
  progressLine: {
    width: 15,
    height: 2,
    backgroundColor: '#EBD9C6',
  },

  /* Zona da Moldura */
  viewZone: {
    flex: 1,
    marginHorizontal: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  bracket: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#9C8E82',
    borderWidth: 5,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  placeholderText: { color: '#9C8E82', fontSize: 16 },

  /* Caixa de Instruções */
  instructionBox: {
    backgroundColor: '#F2E6D9',
    margin: 20,
    borderRadius: 20,
    padding: 15,
    flexDirection: 'column',
    alignItems: 'center',
    maxHeight: 250,
  },
  owlImage: {
    width: 80,
    height: 80,
    marginTop: -40, // Faz a coruja "saltar" para fora da caixa
  },
  textContainer: {
    marginTop: 10,
  },
  mainInstruction: {
    fontSize: 16,
    color: '#613512',
    textAlign: 'center',
    lineHeight: 22,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#D47C34', // Laranja do destaque
  },
  subInstruction: {
    fontSize: 13,
    color: '#8A705A',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },

  /* Ação de Confirmação */
  confirmAction: {
    alignItems: 'center',
    marginBottom: 20,
  },
  checkButton: {
    width: 100,
    height: 60,
    backgroundColor: '#4A2C10',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },

  /* Nav Inferior */
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 70,
    backgroundColor: '#F2E6D9',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  }
});