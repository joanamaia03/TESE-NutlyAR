import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Modal,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import ProgressBreadcrumb from './ProgressBar';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { auth, db } from '../src/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useNutlySession } from '../src/NutlySessionContext';

const PLACEHOLDER = require('../assets/NutlyAR.png');
const IMAGES_BY_GROUP: Record<number, Array<{ id: number; source: any; name: string }>> = {
  1: [
    { id: 0, source: require('../assets/hotdog.jpg'), name: 'hotdog.jpg' },
    { id: 1, source: require('../assets/sardine.jpg'), name: 'sardine.jpg' },
    { id: 2, source: require('../assets/cozido.jpg'), name: 'cozido.jpg' },
  ],
  2: [
    { id: 3, source: require('../assets/presunto.jpg'), name: 'presunto.jpg' },
    { id: 4, source: require('../assets/lanche.jpg'), name: 'lanche.jpg' },
    { id: 5, source: require('../assets/rissois.jpg'), name: 'rissois.jpg' },
  ],
  3: [
    { id: 6, source: require('../assets/queijo.jpg'), name: 'queijo.jpg' },
    { id: 7, source: require('../assets/azeitonas.jpg'), name: 'azeitonas.jpg' },
    { id: 8, source: require('../assets/broa.jpg'), name: 'broa.jpg' },
  ],
  4: [
    { id: 9, source: require('../assets/hamburger.jpg'), name: 'hamburger.jpg' },
    { id: 10, source: require('../assets/presunto.jpg'), name: 'presunto.jpg' },
    { id: 11, source: require('../assets/caldoverde.jpg'), name: 'caldoverde.jpg' },
  ],
};

const SWAP_REPLACEMENTS: Record<number, { id: number; source: any; name: string }> = {
  0: { id: 100, source: require('../assets/lombo.jpg'), name: 'lombo.jpg' },
  1: { id: 101, source: require('../assets/panado.jpg'), name: 'panado.jpg' },
  2: { id: 102, source: require('../assets/arrozdepolvo.jpg'), name: 'arrozdepolvo.jpg' },
};

export default function ImageQuizzScreen({ navigation, route }: any) {
  // Recupera as variáveis do fluxo vindas do ARScreen
  const { saveAnswer, currentGroup } = useNutlySession();
  const params = route.params || {};
  const perguntaAtual = params.perguntaAtual || 1; 
  const historicoRespostas = params.historicoRespostas || [];

  // Filtra as 3 refeições que devem aparecer no ecrã com base no Grupo atual
  const initialRefeicoes = IMAGES_BY_GROUP[perguntaAtual] || IMAGES_BY_GROUP[1];
  const [displayImages, setDisplayImages] = React.useState(initialRefeicoes);
  const [showNutritionModal, setShowNutritionModal] = React.useState(false);
  const [infoEnabled, setInfoEnabled] = React.useState(false);
  const [showSwapControls, setShowSwapControls] = React.useState(false);
  const [showSwapPrompt, setShowSwapPrompt] = React.useState(false);

  React.useEffect(() => {
    setDisplayImages(IMAGES_BY_GROUP[perguntaAtual] || IMAGES_BY_GROUP[1]);
  }, [perguntaAtual]);

  // Popup da coruja (inicial + seleção)
  const [showPopup, setShowPopup] = React.useState(false);
  const [popupMode, setPopupMode] = React.useState<'help' | 'selection' | 'override'>('help');
  const [imagemSelecionada, setImagemSelecionada] = React.useState<any>(null);
  const shouldAutoOpenInitialPopupRef = React.useRef(true);
  const owlInitialMessage = 'Qual destas opções considera ter mais energia (calorias), considerando exatamente a quantidade apresentada. Selecione apenas uma das opções clicando na refeição!';

  useFocusEffect(
    React.useCallback(() => {
      // abre o popup inicial uma única vez quando o ecrã ganha foco
      if (shouldAutoOpenInitialPopupRef.current) {
        shouldAutoOpenInitialPopupRef.current = false;
        setPopupMode('help');
        setShowPopup(true);
      }
      return () => {};
    }, [perguntaAtual])
  );

  React.useEffect(() => {
    if (route?.params?.enableInfo === true) setInfoEnabled(true);
  }, [route]);

  const enviarOrdemTrocarImagem = () => {
    if (showSwapControls) {
      setShowSwapControls(false);
      setShowSwapPrompt(false);
      return;
    }

    setShowSwapControls(true);
    setShowSwapPrompt(true);
  };

  const confirmarTrocaDeImagem = () => {
    setShowSwapPrompt(false);
    setShowSwapControls(true);
  };

  const cancelarTrocaDeImagem = () => {
    setShowSwapPrompt(false);
  };

  const changeImageAtIndex = (index: number) => {
    setShowSwapPrompt(false);
    setDisplayImages((prev) => {
      if (!prev || prev.length === 0) return prev;

      const currentItem = prev[index];
      if (!currentItem) return prev;

      const nextItem = SWAP_REPLACEMENTS[currentItem.id];
      if (!nextItem) return prev;

      const next = [...prev];
      next[index] = nextItem;
      return next;
    });
  };

  const restoreOriginalImageAtIndex = (index: number) => {
    setShowSwapPrompt(false);
    setDisplayImages((prev) => {
      if (!prev || prev.length === 0) return prev;

      const originalItem = initialRefeicoes[index];
      if (!originalItem) return prev;

      const next = [...prev];
      next[index] = originalItem;
      return next;
    });
  };

  // Esconde a navigation bar no Android quando o ecrã ganha foco (usa require para evitar import dinâmico falhado)
  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'android') return;
      let mounted = true;

      (async () => {
        try {
          // require é resolvido apenas em runtime; capturamos erros caso o módulo não esteja disponível
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const nav: any = require('expo-navigation-bar');
          if (!mounted || !nav) return;
          if (nav.setVisibilityAsync) await nav.setVisibilityAsync('hidden');
          if (nav.setBehaviorAsync) await nav.setBehaviorAsync('sticky-immersive');
        } catch (e) {
          console.warn('expo-navigation-bar error', e);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [])
  );

  const selecionarRefeicaoEAvancar = async (idRefeicao: number, nomeImagem: string) => {
    const user = auth.currentUser;
    if (!user) return;

    // === NOVA LÓGICA DE GUARDA POR GRUPOS ===
    const answerData = {
      questionId: `g${currentGroup}_q${perguntaAtual}_imagem`,
      groupNumber: currentGroup,
      selectedImage: nomeImagem,
      targetIndex: idRefeicao,
      answeredAt: new Date(),
    };

    try {
      // Guarda usando a nova estrutura por grupos
      await saveAnswer(currentGroup, answerData);

      // Atualiza o histórico local (mantido como tinhas)
      const novoHistorico = [
        ...historicoRespostas,
        { pergunta: perguntaAtual, ecrã: 'ImageQuizzScreen', escolha: nomeImagem }
      ];

      navigation.navigate('ImagineScreen', {
        perguntaAtual: perguntaAtual,
        historicoRespostas: novoHistorico,
      });

    } catch (error) {
      console.error('Erro ao guardar a seleção da refeição:', error);
    }
  };
  
  const seleccionarAndClose = async () => {
    if (!imagemSelecionada) return;
    try {
      await selecionarRefeicaoEAvancar(imagemSelecionada.id, imagemSelecionada.name);
    } catch (e) {
      console.warn('Erro ao confirmar seleção via popup', e);
    } finally {
      setImagemSelecionada(null);
      setPopupMode('help');
      setShowPopup(false);
    }
  };

  const confirmarEscolhaEAvancar = async () => {
    if (popupMode === 'help') {
      setShowPopup(false);
      setPopupMode('help');
      return;
    }

    await seleccionarAndClose();
  };

  const renderBoldText = (text: string) => {
    if (!text) return null;
    const parts = String(text).split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <Text key={i} style={styles.overrideBoldText}>{inner}</Text>
        );
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  const abrirPopupDoMocho = () => {
    setShowSwapControls(false);
    setImagemSelecionada(null);
    setPopupMode('help');
    setShowPopup(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Container Superior para o Breadcrumb idêntico ao da imagem */}
      <View style={styles.breadcrumbWrapper}>
        <ProgressBreadcrumb currentStep={perguntaAtual} />
      </View>

      <View style={styles.scrollContainer}>

        {/* Lista interativa das 3 refeições em formato de cartão */}
        {displayImages.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.imageCardRow}>
            {showSwapControls && (
              <TouchableOpacity style={styles.swapArrowButton} onPress={() => restoreOriginalImageAtIndex(index)} activeOpacity={0.75}>
                <Icon name="chevron-left" size={34} color="#613512" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.imageCardButton,
                imagemSelecionada && imagemSelecionada.id === item.id ? styles.selectedImageCard : null,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                if (showSwapControls) return;
                setImagemSelecionada(item);
                setPopupMode('selection');
                setShowPopup(true);
              }}
            >
              <Image source={item.source} style={styles.mealImage} resizeMode="cover" />
            </TouchableOpacity>

            {showSwapControls && (
              <TouchableOpacity style={styles.swapArrowButton} onPress={() => changeImageAtIndex(index)} activeOpacity={0.75}>
                <Icon name="chevron-right" size={34} color="#613512" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
      </View>

      {/* Faixa inferior para escolher a imagem a alterar */}
      {showSwapPrompt && (
        <View style={styles.swapPromptBar} pointerEvents="none">
          <Text style={styles.swapPromptText}>Clique na seta para trocar de imagem</Text>
        </View>
      )}

      {/* Mascote fofa da Coruja fixa no canto inferior direito; esconde-se quando o popup de troca aparece */}
      {!showSwapPrompt && (
        <TouchableOpacity style={styles.owlContainer} onPress={abrirPopupDoMocho} activeOpacity={0.9}>
          <Image
            source={require('../assets/Owl2.png')}
            style={styles.owlMascot}
            resizeMode="contain"
          />
        </TouchableOpacity>
      )}

      {/* Popup do Mocho (owl) */}
      <Modal visible={showPopup} transparent animationType="none">
        {imagemSelecionada ? (
          <View style={styles.modalOverlayCenter}>
            <View style={styles.confirmCard}>
              <Text style={styles.confirmText}>Tem a certeza que quer continuar?</Text>
              <View style={styles.confirmBtnRow}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={async () => {
                    try {
                      const user = auth.currentUser;
                      if (!user) {
                        console.warn('Usuário não autenticado, não foi possível criar sessão');
                        setImagemSelecionada(null);
                        setShowPopup(false);
                        navigation.navigate('Image1Screen');
                        return;
                      }

                      const sessionDocRef = await addDoc(collection(db, 'quiz_sessions'), {
                        userId: user.uid,
                        selectedImage: { id: imagemSelecionada?.id ?? null, name: imagemSelecionada?.name ?? null },
                        perguntaInicial: perguntaAtual,
                        answers: [],
                        createdAt: serverTimestamp(),
                      });

                      setImagemSelecionada(null);
                      setShowPopup(false);
                      navigation.navigate('Question1Screen', { sessionId: sessionDocRef.id });
                    } catch (e) {
                      console.error('Erro ao criar sessão de quiz:', e);
                      setImagemSelecionada(null);
                      setShowPopup(false);
                      navigation.navigate('Question1Screen');
                    }
                  }}
                >
                  <Text style={styles.modalActionText}>Sim</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => {
                    setImagemSelecionada(null);
                    setPopupMode('help');
                    setShowPopup(false);
                  }}
                >
                  <Text style={styles.modalActionText}>Não</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.modalOverlayBottom, styles.modalOverlayTransparent]}>
            <View style={styles.modalCardBottom}>
              <Image source={require('../assets/Owl.png')} style={styles.owlMascot} resizeMode="contain" />
              <View style={styles.speechBubbleTriangle} />

              <View style={styles.speechBubble}>
                <Text style={styles.instructionText}>{renderBoldText(owlInitialMessage)}</Text>
                <Text style={styles.subInstructionText}>
                  Caso não conheça ou não goste da refeição inidicada, pode trocar de imagem após clicar na mesma e desbloquear o botão no canto inferior direito
                </Text>
              </View>

              <TouchableOpacity
                style={styles.checkButton}
                onPress={confirmarEscolhaEAvancar}
              >
                <Icon name="check" size={40} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      {/* Nutrition Modal */}
      <Modal visible={showNutritionModal} transparent animationType="slide" onRequestClose={() => setShowNutritionModal(false)}>
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalCardBottom}>
            <Text style={{ color: '#613512', fontSize: 16, textAlign: 'center' }}>Seleciona uma imagem para ver informação nutricional.</Text>
            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setShowNutritionModal(false)}>
              <Text style={{ color: '#784115', fontWeight: '700' }}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Menubar Inferior unificada da tua App */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Icon name="home" size={32} color="#613512" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowNutritionModal(true)} disabled={!infoEnabled}>
            <Icon name="information" size={32} color={infoEnabled ? '#613512' : '#C7B8AA'} />
        </TouchableOpacity>
            <TouchableOpacity onPress={enviarOrdemTrocarImagem}>
                <View style={styles.iconStack}>
                  <Icon name="image" size={36} color="#e2ac77" style={styles.underIcon} />
                  <Icon name="swap-horizontal" size={32} color="#613512" style={styles.topIcon} />
                </View>
            </TouchableOpacity>
        </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF5F0',
    paddingTop: Platform.OS === 'android' ? 35 : 10,
  },
  breadcrumbWrapper: {
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#FAF5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 120, 
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    color: '#613512',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
    lineHeight: 22,
  },
  imageCardButton: {
    width: '80%',
    maxWidth: 340,
    aspectRatio: 1.4, 
    backgroundColor: '#FCDCB7', 
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#613512',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  selectedImageCard: {
    borderWidth: 4,
    borderColor: '#784115',
    shadowColor: '#784115',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 6,
  },
  imageCardRow: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  swapArrowButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(251, 225, 206, 0.95)',
    marginHorizontal: 8,
  },
  mealImage: {
    width: '92%',
    height: '92%',
    borderRadius: 8,
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalOverlayTransparent: {
    backgroundColor: 'transparent',
  },
  modalCardBottom: {
    width: '100%',
    backgroundColor: '#fbe1ce',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingBottom: 38,
    paddingTop: 18,
    alignItems: 'center',
    minHeight: 420,
  },
  swapPromptBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 75,
    backgroundColor: '#FBE1CE',
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 95,
  },
  swapPromptText: {
    fontSize: 18,
    color: '#6B3E1F',
    textAlign: 'left',
    width: '100%',
  },
  owlContainer: {
    position: 'absolute',
    right: 10,
    bottom: 65, 
    zIndex: 99,
  },
  owlMascot: {
    width: 100,
    height: 110,
  },
  speechBubbleTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFF',
    zIndex: 2,
  },
  speechBubble: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#9C5325',
  },
  subInstructionText: {
    fontSize: 14,
    color: '#8A705A',
    textAlign: 'center',
    marginTop: 12,
    alignSelf: 'stretch',
  },
  instructionText: {
    fontSize: 16,
    color: '#613512',
    textAlign: 'center',
    lineHeight: 22,
    alignSelf: 'stretch',
  },
  overrideBoldText: {
    fontWeight: 'bold',
    color: '#9C5325',
    fontSize: 16,
  },
  checkButton: {
    backgroundColor: '#784115',
    width: 110,
    height: 50,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  selectionButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    maxWidth: 300,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#C7B8AA',
    width: 120,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#613512',
    fontWeight: '700',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#784115',
    width: 120,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  modalOverlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#FBE1CE',
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmText: {
    color: '#613512',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 18,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  modalActionButton: {
    backgroundColor: '#784115',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    minWidth: 90,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  modalActionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 75,
    backgroundColor: '#ffffff',
    paddingBottom: Platform.OS === 'ios' ? 15 : 10,
  },
  iconStack: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  underIcon: {
    position: 'absolute',
    zIndex: 1,
    elevation: 1,
    opacity: 0.85,
  },
  topIcon: {
    position: 'absolute',
    zIndex: 2,
    elevation: 2,
  },
  disabledNavIcon: {
    opacity: 0.3,
  },
});