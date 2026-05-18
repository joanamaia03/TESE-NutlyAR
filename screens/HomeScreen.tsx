import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { db, auth } from '../src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Pressable } from 'react-native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // sample states for drawer fields (non-destructive)
  const [genero, setGenero] = useState('');
  const [anoNascimento, setAnoNascimento] = useState('');
  const [idade, setIdade] = useState('');
  const [escolaridade, setEscolaridade] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [condicaoMedica, setCondicaoMedica] = useState('');
  const [padraoAlimentar, setPadraoAlimentar] = useState('');
  // custom "Outro" text states
  const [generoOutro, setGeneroOutro] = useState('');
  const [escolaridadeOutro, setEscolaridadeOutro] = useState('');
  const [condicaoMedicaOutro, setCondicaoMedicaOutro] = useState('');
  const [padraoAlimentarOutro, setPadraoAlimentarOutro] = useState('');

  // carrega dados do utilizador do Firestore
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, 'utilizadores', user.uid);
        const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
          const userData = userSnap.data() as any;
          const demograficos = userData.dadosSociodemograficos || {};

          setGenero(demograficos.genero || '');
          // try to use explicit idade if available; otherwise keep dataNascimento raw
          const rawIdade = demograficos.idade || '';
          if (rawIdade) {
            setIdade(rawIdade);
          } else if (demograficos.dataNascimento) {
            setAnoNascimento(demograficos.dataNascimento || '');
          }
          setEscolaridade(demograficos.grauEscolaridade || '');
          setMunicipio(demograficos.municipioResidencia || '');
          setCondicaoMedica(demograficos.condicaoMedica || '');
          setPadraoAlimentar(demograficos.padraoAlimentar || '');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do utilizador:', error);
      }
    };

    loadUserData();
  }, []);

  // listeners para o teclado
  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));

    return () => {
      keyboardDidShow.remove();
      keyboardDidHide.remove();
    };
  }, []);

  // Mapeamento de valores para labels legíveis
  const generoLabels: { [key: string]: string } = {
    'feminino': 'Feminino',
    'masculino': 'Masculino',
    'pnr': 'Prefiro Não Responder',
    'outro': 'Outro',
  };

  const escolaridadeLabels: { [key: string]: string } = {
    '1basico': '1º Ciclo do Ensino Básico',
    '2basico': '2º Ciclo do Ensino Básico',
    '3basico': '3º Ciclo do Ensino Básico',
    'secundario': 'Ensino Secundário',
    'licenciatura': 'Licenciatura/Bacharelato',
    'mestrado': 'Mestrado',
    'doutoramento': 'Doutoramento',
    'nsei': 'Não sei',
    'pnr': 'Prefiro não responder',
    'outro': 'Outro',
  };

  const condicaoMedicaLabels: { [key: string]: string } = {
    'excesso': 'Excesso de peso/obesidade',
    'diabetes': 'Diabetes/pré-diabetes',
    'colesterol': 'Níveis altos de colesterol/triglicerídeos',
    'hipertensao': 'Hipertensão arterial',
    'outra': 'Outra doença cardiovascular',
    'dificuldadeVisual': 'Dificuldade visual',
    'nenhuma': 'Nenhuma das anteriores',
    'nsei': 'Não sei',
    'pnr': 'Prefiro não responder',
    'outro': 'Outro',
  };

  const padraoAlimentarLabels: { [key: string]: string } = {
    'omnivoro': 'Omnívoro',
    'flexitariano': 'Flexitariano',
    'vegan': 'Vegetariano/Vegano',
    'nsei': 'Não sei',
    'pnr': 'Prefiro não responder',
    'outro': 'Outro',
  };

  const idadeLabels: { [key: string]: string } = {
    '18-29': '18 - 29',
    '30-59': '30 - 59',
    '60-120': '60 - 120',
  };

  // Função auxiliar para renderizar opções de rádio quando em edição
  const RenderOption = (label: string, value: string, state: string, setState: any) => (
    <Pressable style={styles.radioItem} onPress={() => setState(state === value ? '' : value)}>
      <View style={[styles.radioOuter, state === value && styles.radioOuterActive]}>
        {state === value && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );

  

  // Função para obter o label a exibir
  const getDisplayLabel = (fieldKey: string, value: string): string => {
    if (!value) return '';
    switch (fieldKey) {
      case 'genero':
        return value === 'outro' ? (generoOutro || 'Outro') : (generoLabels[value] || value);
      case 'escolaridade':
        return value === 'outro' ? (escolaridadeOutro || 'Outro') : (escolaridadeLabels[value] || value);
      case 'condicaoMedica':
        return value === 'outro' ? (condicaoMedicaOutro || 'Outro') : (condicaoMedicaLabels[value] || value);
      case 'padraoAlimentar':
        return value === 'outro' ? (padraoAlimentarOutro || 'Outro') : (padraoAlimentarLabels[value] || value);
      case 'idade':
        return idadeLabels[value] || value;
      default:
        return value;
    }
  };
  const generoRef = useRef<TextInput>(null);
  const anoNascimentoRef = useRef<TextInput>(null);
  const escolaridadeRef = useRef<TextInput>(null);
  const municipioRef = useRef<TextInput>(null);
  const condicaoMedicaRef = useRef<TextInput>(null);
  const padraoAlimentarRef = useRef<TextInput>(null);

  // renderiza campo com lápis interativo (edição ao clicar)
  const renderEditableField = (
    label: string,
    value: string,
    setValue: (val: string) => void,
    fieldKey: string,
    inputRef: React.RefObject<TextInput | null>,
    keyboardType?: any
  ) => {
    // Determina se este campo tem opções predefinidas
    const hasOptions = ['genero', 'escolaridade', 'condicaoMedica', 'padraoAlimentar', 'idade'].includes(fieldKey);
    const isEditing = editingField === fieldKey;

    return (
      <>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
          {!isEditing ? (
            <>
              <Text style={styles.displayText}>{getDisplayLabel(fieldKey, value) || '—'}</Text>
              <TouchableOpacity onPress={() => {
                setEditingField(fieldKey);
                if (!hasOptions) {
                  setTimeout(() => inputRef.current?.focus(), 50);
                }
              }}>
                <Icon name="pencil" size={20} color="#613512" style={styles.pencilIcon} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {hasOptions ? (
                <>
                <Text style={styles.displayText}>{getDisplayLabel(fieldKey, value) || '—'}</Text>
                <View style={styles.optionsOverlay} pointerEvents="box-none">
                  <ScrollView style={styles.optionsContainerOverlay} nestedScrollEnabled={true}>
                    {fieldKey === 'genero' && (
                      <>
                        {RenderOption('Feminino', 'feminino', value, setValue)}
                        {RenderOption('Masculino', 'masculino', value, setValue)}
                        {RenderOption('Prefiro Não Responder', 'pnr', value, setValue)}
                        {RenderOption('Outro', 'outro', value, setValue)}
                        {value === 'outro' && (
                          <TextInput
                            style={styles.otherInput}
                            placeholder="Escreva outra opção"
                            value={generoOutro}
                            onChangeText={setGeneroOutro}
                            autoFocus={true}
                          />
                        )}
                      </>
                    )}
                    {fieldKey === 'idade' && (
                      <>
                        {RenderOption('18 - 29', '18-29', value, setValue)}
                        {RenderOption('30 - 59', '30-59', value, setValue)}
                        {RenderOption('60 - 120', '60-120', value, setValue)}
                      </>
                    )}
                    {fieldKey === 'escolaridade' && (
                      <>
                        {RenderOption('1º Ciclo do Ensino Básico', '1basico', value, setValue)}
                        {RenderOption('2º Ciclo do Ensino Básico', '2basico', value, setValue)}
                        {RenderOption('3º Ciclo do Ensino Básico', '3basico', value, setValue)}
                        {RenderOption('Ensino Secundário', 'secundario', value, setValue)}
                        {RenderOption('Licenciatura/Bacharelato', 'licenciatura', value, setValue)}
                        {RenderOption('Mestrado', 'mestrado', value, setValue)}
                        {RenderOption('Doutoramento', 'doutoramento', value, setValue)}
                        {RenderOption('Não sei', 'nsei', value, setValue)}
                        {RenderOption('Prefiro não responder', 'pnr', value, setValue)}
                        {RenderOption('Outro', 'outro', value, setValue)}
                        {value === 'outro' && (
                          <TextInput
                            style={styles.otherInput}
                            placeholder="Escreva outra opção"
                            value={escolaridadeOutro}
                            onChangeText={setEscolaridadeOutro}
                            autoFocus={true}
                          />
                        )}
                      </>
                    )}
                    {fieldKey === 'condicaoMedica' && (
                      <>
                        {RenderOption('Excesso de peso/obesidade', 'excesso', value, setValue)}
                        {RenderOption('Diabetes/pré-diabetes', 'diabetes', value, setValue)}
                        {RenderOption('Níveis altos de colesterol/triglicerídeos', 'colesterol', value, setValue)}
                        {RenderOption('Hipertensão arterial', 'hipertensao', value, setValue)}
                        {RenderOption('Outra doença cardiovascular', 'outra', value, setValue)}
                        {RenderOption('Dificuldade visual', 'dificuldadeVisual', value, setValue)}
                        {RenderOption('Nenhuma das anteriores', 'nenhuma', value, setValue)}
                        {RenderOption('Não sei', 'nsei', value, setValue)}
                        {RenderOption('Prefiro não responder', 'pnr', value, setValue)}
                        {RenderOption('Outro', 'outro', value, setValue)}
                        {value === 'outro' && (
                          <TextInput
                            style={styles.otherInput}
                            placeholder="Escreva outra opção"
                            value={condicaoMedicaOutro}
                            onChangeText={setCondicaoMedicaOutro}
                            autoFocus={true}
                          />
                        )}
                      </>
                    )}
                    {fieldKey === 'padraoAlimentar' && (
                      <>
                        {RenderOption('Omnívoro', 'omnivoro', value, setValue)}
                        {RenderOption('Flexitariano', 'flexitariano', value, setValue)}
                        {RenderOption('Vegetariano/Vegano', 'vegan', value, setValue)}
                        {RenderOption('Não sei', 'nsei', value, setValue)}
                        {RenderOption('Prefiro não responder', 'pnr', value, setValue)}
                        {RenderOption('Outro', 'outro', value, setValue)}
                        {value === 'outro' && (
                          <TextInput
                            style={styles.otherInput}
                            placeholder="Escreva outra opção"
                            value={padraoAlimentarOutro}
                            onChangeText={setPadraoAlimentarOutro}
                            autoFocus={true}
                          />
                        )}
                      </>
                    )}
                  </ScrollView>
                </View>
                <TouchableOpacity onPress={() => setEditingField(null)} style={styles.confirmIcon}>
                  <Icon name="check" size={20} color="#784115" />
                </TouchableOpacity>
                </>
              ) : (
                <TextInput
                  ref={inputRef}
                  style={styles.drawerInput}
                  value={value}
                  onChangeText={setValue}
                  editable={true}
                  keyboardType={keyboardType}
                  onBlur={() => setEditingField(null)}
                  autoFocus={true}
                />
              )}
              {!hasOptions && (
                <TouchableOpacity onPress={() => setEditingField(null)} style={styles.confirmIcon}>
                  <Icon name="check" size={20} color="#784115" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </>
    );
  };

  const handleGuardarPreferencias = async () => {
    Keyboard.dismiss();
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert('Erro', 'Utilizador não autenticado');
        return;
      }

      const userRef = doc(db, 'utilizadores', user.uid);
      const finalGenero = genero === 'outro' ? (generoOutro || '') : genero;
      const finalEscolaridade = escolaridade === 'outro' ? (escolaridadeOutro || '') : escolaridade;
      const finalCondicao = condicaoMedica === 'outro' ? (condicaoMedicaOutro || '') : condicaoMedica;
      const finalPadrao = padraoAlimentar === 'outro' ? (padraoAlimentarOutro || '') : padraoAlimentar;

      const dadosSociodemograficos = {
        genero: finalGenero || '',
        idade: idade || '',
        dataNascimento: anoNascimento || '',
        grauEscolaridade: finalEscolaridade || '',
        municipioResidencia: municipio || '',
        condicaoMedica: finalCondicao || '',
        padraoAlimentar: finalPadrao || '',
      };

      await setDoc(userRef, {
        dadosSociodemograficos,
        ultimaAtualizacao: new Date().toISOString(),
      }, { merge: true });

      Alert.alert('Sucesso', 'Preferências atualizadas com sucesso!');
      setIsMenuOpen(false);
    } catch (error) {
      console.error('Erro ao gravar preferências:', error);
      Alert.alert('Erro', 'Não foi possível gravar as preferências.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* main content (kept your layout/changes) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setIsMenuOpen(true)}>
          <Icon name="cog" size={35} color="#6B3E1F" />
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Text style={styles.logoTextMain}>
          Nutly<Text style={styles.logoTextSub}>AR</Text>
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('ARScreen')}>
          <View style={styles.iconBox}>
            <Icon name="scan-helper" size={80} color="#FFF" />
            <Text style={styles.iconBoxText}>AR</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => navigation.navigate('ImagesScreen')}>
          <View style={styles.iconBox}>
            <Icon name="image-outline" size={100} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Prefere utilizar Realidade{"\n"}Aumentada ou Imagens?</Text>
      </View>

      {/* drawer overlay and panel - added without changing your existing layout */}
      {isMenuOpen && (
        <>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => {
            Keyboard.dismiss();
            setIsMenuOpen(false);
          }} />
          <View style={styles.drawerContainer}>
            <View style={styles.drawerContent}>
              <Text style={styles.drawerTitle}>Alterar preferências</Text>

              {renderEditableField('Género', genero, setGenero, 'genero', generoRef)}
              {renderEditableField('Idade', idade, setIdade, 'idade', anoNascimentoRef)}
              {renderEditableField('Grau de Escolaridade', escolaridade, setEscolaridade, 'escolaridade', escolaridadeRef)}
              {renderEditableField('Município de Residência', municipio, setMunicipio, 'municipio', municipioRef)}
              {renderEditableField('Condições Médicas', condicaoMedica, setCondicaoMedica, 'condicaoMedica', condicaoMedicaRef)}
              {renderEditableField('Padrão Alimentar', padraoAlimentar, setPadraoAlimentar, 'padraoAlimentar', padraoAlimentarRef)}

              <TouchableOpacity style={styles.saveButton} onPress={handleGuardarPreferencias}>
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F0',
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: 25,
    paddingTop: 40,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  logoTextMain: {
    fontSize: 55,
    fontFamily: 'serif',
    color: '#E28A47',
    fontWeight: '500',
  },
  logoTextSub: {
    color: '#784115',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: 30,
    marginBottom: 30,
  },
  menuButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    marginVertical: 12,
  },
  iconBox: {
    width: 140,
    height: 140,
    backgroundColor: '#784115',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconBoxText: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 140,
    lineHeight: 140,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 36,
    fontWeight: '900',
  },
  footer: {
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 22,
    color: '#A15B2A',
    textAlign: 'center',
    lineHeight: 30,
  },

  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 10,
  },
  drawerContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: width * 0.75,
    backgroundColor: '#fbe1ce',
    zIndex: 20,
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: -5, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  drawerContent: {
    padding: 25,
    paddingTop: 50,
    paddingBottom: 300,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#613512',
    marginBottom: 25,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 18,
    color: '#613512',
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingRight: 10,
    height: 50,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
    position: 'relative',
  },
  drawerInput: {
    flex: 1,
    fontSize: 18,
    color: '#6B3E1F',
  },
  drawerInputDisabled: {
    color: '#999',
  },
  pencilIcon: {
    marginLeft: 10,
    alignSelf: 'center',
  },
  confirmIcon: {
    position: 'absolute',
    right: 12,
    alignSelf: 'center',
    zIndex: 100,
  },
  saveButton: {
    backgroundColor: '#784115',
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 35,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 10,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E28A47',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioOuterActive: {
    borderColor: '#E28A47',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E28A47',
  },
  radioLabel: {
    fontSize: 16,
    color: '#613512',
    flex: 1,
  },
  displayText: {
    fontSize: 18,
    color: '#6B3E1F',
    flex: 1,
    marginRight: 8,
  },
  otherInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#6B3E1F',
    marginTop: 10,
  },
  optionsContainer: {
    backgroundColor: '#F5E6D3',
    borderRadius: 15,
    padding: 12,
    marginBottom: 10,
    maxHeight: 150,
    flex: 1,
    marginRight: 8,
  },
  optionsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 56,
    backgroundColor: '#F5E6D3',
    borderRadius: 12,
    padding: 12,
    zIndex: 50,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  optionsContainerOverlay: {
    maxHeight: 260,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  
});
