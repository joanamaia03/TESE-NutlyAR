import React from 'react';
import {
  Alert,
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
import { doc, getDoc, setDoc, collection, addDoc, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { useNutlySession } from '../src/NutlySessionContext';

const IMAGES_BY_GROUP: Record<number, Array<{ id: number; source: any; name: string }>> = {
  1: [
    { id: 0, source: require('../assets/hotdog.jpg'), name: 'hotdog.jpg' },
    { id: 1, source: require('../assets/sardine.jpg'), name: 'sardine.jpg' },
    { id: 2, source: require('../assets/cozido.jpg'), name: 'cozido.jpg' },
  ],

  2: [
    { id: 6, source: require('../assets/queijo.jpg'), name: 'queijo.jpg' },
    { id: 7, source: require('../assets/azeitonas.jpg'), name: 'azeitonas.jpg' },
    { id: 8, source: require('../assets/broa.jpg'), name: 'broa.jpg' },
  ],
};

const VEGETARIAN_IMAGES_BY_GROUP: Record<number, Array<{ id: number; source: any; name: string }>> = {
  1: [
    { id: 0, source: require('../assets/jardineira.png'), name: 'jardineira.png' },
    { id: 1, source: require('../assets/almondegas.png'), name: 'almondegas.png' },
    { id: 2, source: require('../assets/peixinhos.png'), name: 'peixinhos.png' },
  ],
  2: [
    { id: 6, source: require('../assets/queijo.jpg'), name: 'queijo.jpg' },
    { id: 7, source: require('../assets/azeitonas.jpg'), name: 'azeitonas.jpg' },
    { id: 8, source: require('../assets/broa.jpg'), name: 'broa.jpg' },
  ],
};

const SWAP_REPLACEMENTS: Record<number, { id: number; source: any; name: string }> = {
  0: { id: 100, source: require('../assets/lombo.jpg'), name: 'lombo.jpg' },
  1: { id: 101, source: require('../assets/panado.jpg'), name: 'panado.jpg' },
  2: { id: 102, source: require('../assets/arrozdepolvo.jpg'), name: 'arrozdepolvo.jpg' },
  6: { id: 106, source: require('../assets/torrada.jpg'), name: 'torrada.jpg' },
  7: { id: 107, source: require('../assets/chourico.jpg'), name: 'chourico.jpg' },
  8: { id: 108, source: require('../assets/batatafrita.jpg'), name: 'batatafrita.jpg' },
};

const VEGETARIAN_SWAP_REPLACEMENTS: Record<number, { id: number; source: any; name: string }> = {
  0: { id: 200, source: require('../assets/azeitonas.jpg'), name: 'azeitonas.jpg' },
  1: { id: 201, source: require('../assets/broa.jpg'), name: 'broa.jpg' },
  2: { id: 202, source: require('../assets/torrada.jpg'), name: 'torrada.jpg' },
  6: { id: 206, source: require('../assets/torrada.jpg'), name: 'torrada.jpg' },
  7: { id: 207, source: require('../assets/sopa.jpg'), name: 'sopa.jpg' },
  8: { id: 208, source: require('../assets/caldoverde.jpg'), name: 'caldoverde.jpg' },
};

const DISH_INFO: Record<string, { energia: string; sal?: string; porcao: string; }> = {
  'hotdog.jpg': { energia: '270 kcal/100g', porcao: '206g' },
  'sardine.jpg': { energia: '106 kcal/100g', porcao: '383g' },
  'cozido.jpg': { energia: '151 kcal/100g', porcao: '265g' },
  'lombo.jpg': { energia: '174 kcal/100g', porcao: '317g' },
  'panado.jpg': { energia: '174 kcal/100g', porcao: '263g' },
  'arrozdepolvo.jpg': { energia: '127 kcal/100g', porcao: '293g' },
  'queijo.jpg': { energia: '2.1g/100g', sal: '2.1g/100g', porcao: '40g' },
  'azeitonas.jpg': { energia: '5.3g/100g', sal: '5.3g/100g', porcao: '44g'},
  'broa.jpg': { energia: '0.7g/100g', sal: '0.7g/100g', porcao: '90g' },
  'torrada.jpg': { energia: '1.1g/100g', sal: '1.1g/100g', porcao: '65g' },
  'chourico.jpg': { energia: '6.6g/100g', sal: '6.6g/100g', porcao: '42g'},
  'batatafrita.jpg': { energia: '1.2g/100g', sal: '1.2g/100g', porcao: '45g' },
  'jardineira.png': { energia: '111 kcal/100g', porcao: '260g' },
  'almondegas.png': { energia: '131 kcal/100g', porcao: '295g' },
  'peixinhos.png': { energia: '151 kcal/100g', porcao: '265g' },
};

export default function ImageQuizzScreen({ navigation, route }: any) {
  // Recupera as variáveis do fluxo vindas do ARScreen
  const { saveAnswer, currentGroup} = useNutlySession();
  const params = route.params || {};
  const perguntaAtual = params.perguntaAtual || 1; 
  
  const currentGroupToShow = params.groupNumber ?? currentGroup ?? 1;
  const [screenRefreshing, setScreenRefreshing] = React.useState(false);
  const [isVegetarianDiet, setIsVegetarianDiet] = React.useState(false);

  const [showNutritionModal, setShowNutritionModal] = React.useState(false);
  const [infoUnlocked, setInfoUnlocked] = React.useState(false);
  const [showSwapControls, setShowSwapControls] = React.useState(false);
  const [showSwapPrompt, setShowSwapPrompt] = React.useState(false);

  const [displayImages, setDisplayImages] = React.useState(() => {
    return IMAGES_BY_GROUP[params.groupNumber ?? currentGroup ?? 1] || IMAGES_BY_GROUP[1];
  });

  const activeImagesByGroup = React.useMemo(
    () => (isVegetarianDiet ? VEGETARIAN_IMAGES_BY_GROUP : IMAGES_BY_GROUP),
    [isVegetarianDiet]
  );

  const activeSwapReplacements = React.useMemo(
    () => (isVegetarianDiet ? VEGETARIAN_SWAP_REPLACEMENTS : SWAP_REPLACEMENTS),
    [isVegetarianDiet]
  );

  // Popup da coruja (inicial + seleção)
  const [showPopup, setShowPopup] = React.useState(false);
  const [popupMode, setPopupMode] = React.useState<'help' | 'selection' | 'override'>('help');
  const [imagemSelecionada, setImagemSelecionada] = React.useState<any>(null);
  const [popupOverrideMessage, setPopupOverrideMessage] = React.useState<string | null>(null);
  const [pratoSelecionado, setPratoSelecionado] = React.useState<{ id: number; source: any; name: string } | null>(null);
  const shouldAutoOpenInitialPopupRef = React.useRef(true);
  const isSaltGroup = Number(currentGroupToShow ?? 1) === 2 || Number(currentGroupToShow ?? 1) === 3 || Number(currentGroupToShow ?? 1) === 4;
  const owlInitialMessage = isSaltGroup
    ? 'Qual destas opções considera ter **mais sal**, considerando exatamente a quantidade apresentada. Selecione **apenas uma** das opções clicando na refeição!'
    : 'Qual destas opções considera ter **mais energia (calorias)**, considerando exatamente a quantidade apresentada. Selecione **apenas uma** das opções clicando na refeição!';
  const owlOverrideMessage = isSaltGroup
    ? 'Nesta fase desbloqueou o **botão de informação**, no qual tem acesso ao peso dos alimentos e ao sal por 100g. Qual destas porções terá **mais sal** no total? Selecione **apenas uma** das opções.\n\nBotão de informação'
    : popupOverrideMessage;
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;

      const refreshScreen = async () => {
        const groupToLoad = route?.params?.groupNumber ?? currentGroup ?? 1;
        let vegetarian = false;

        try {
          const user = auth.currentUser;
          if (user) {
            const userSnap = await getDoc(doc(db, 'utilizadores', user.uid));
            const padrao = String(userSnap.data()?.dadosSociodemograficos?.padraoAlimentar || '').toLowerCase();
            vegetarian = padrao === 'vegan' || padrao.includes('veget');
          }
        } catch (error) {
          console.warn('Falha ao ler o padrão alimentar; a usar imagens padrão.', error);
        }

        if (!isActive) return;

        setIsVegetarianDiet(vegetarian);
        setScreenRefreshing(true);

        const imageSet = vegetarian ? VEGETARIAN_IMAGES_BY_GROUP : IMAGES_BY_GROUP;
        console.log(`Foco Ativo: Grupo ${groupToLoad} | vegetariano=${vegetarian}`);

        setDisplayImages(imageSet[groupToLoad] || imageSet[1]);
        setPratoSelecionado(null);
        setImagemSelecionada(null);
        setShowSwapControls(false);
        setShowSwapPrompt(false);
        setPopupOverrideMessage(null);
        setPopupMode('help');
        setShowPopup(false);
        shouldAutoOpenInitialPopupRef.current = true;
        setInfoUnlocked(route?.params?.enableInfo === true);

        const isFinalGroupStep = route?.params?.finalGroupStep === true;
        if (isFinalGroupStep) {
          setInfoUnlocked(true);
          const { popupOverride } = route?.params || {};
          if (typeof popupOverride === 'string' && popupOverride.length > 0) {
            shouldAutoOpenInitialPopupRef.current = false;
            setPopupOverrideMessage(popupOverride);
            setPopupMode('override');
            setShowPopup(true);
          }

          setScreenRefreshing(false);
          return;
        }

        const { popupOverride } = route?.params || {};

        if (typeof popupOverride === 'string' && popupOverride.length > 0) {
          shouldAutoOpenInitialPopupRef.current = false;
          setPopupOverrideMessage(popupOverride);
          setPopupMode('override');
          setShowPopup(true);
        } else if (shouldAutoOpenInitialPopupRef.current) {
          shouldAutoOpenInitialPopupRef.current = false;
          setPopupMode('help');
          setShowPopup(true);
        }

        setScreenRefreshing(false);
      };

      refreshScreen();

      return () => {
        isActive = false;
      };
    }, [route?.params?.enableInfo, route?.params?.popupOverride, route?.params?.perguntaProxima, route?.params?.finalGroupStep, route?.params?.groupNumber, currentGroup, perguntaAtual])
  );

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

      const nextItem = activeSwapReplacements[currentItem.id];
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

      const originalGroupList = activeImagesByGroup[currentGroupToShow] || activeImagesByGroup[1];
      const originalItem = originalGroupList[index];
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
    } catch (error) {
      console.error('Erro ao guardar a seleção da refeição:', error);
    }

    if (currentGroup < 2) {
        navigation.navigate('Transition1Screen', {
          groupNumber: currentGroup,
        });
      } else {
        navigation.navigate('FinishScreen');
      }
      return;
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
    if (popupMode === 'help' || (popupMode === 'override' && !imagemSelecionada)) {
      setShowPopup(false);
      setPopupMode('help');
      return;
    }

    await seleccionarAndClose();
  };

  const owlPopupMessage = popupMode === 'override'
    ? (owlOverrideMessage || owlInitialMessage)
    : owlInitialMessage;

  // Detect optional footer marker and split main text + footer
  const FOOTER_KEY = '\n\nBotão de informação';
  const popupTextStr = typeof owlPopupMessage === 'string' ? owlPopupMessage : String(owlPopupMessage || '');
  const footerIndex = popupTextStr.indexOf(FOOTER_KEY);
  const hasFooter = footerIndex >= 0;
  const popupMainText = hasFooter ? popupTextStr.slice(0, footerIndex) : popupTextStr;

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
    setPopupMode(popupOverrideMessage ? 'override' : 'help');
    setShowPopup(true);
  };

  const abrirInformacaoDoPrato = () => {
    if (!pratoSelecionado) {
      Alert.alert('Aviso', 'Por favor selecione uma imagem');
      return;
    }

    setShowNutritionModal(true);
  };

  const selectedDishInfo = DISH_INFO[pratoSelecionado?.name ?? displayImages[0]?.name] ?? null;
  const showSalt = Number(currentGroupToShow ?? 1) === 2 || Number(currentGroupToShow ?? 1) === 3 || Number(currentGroupToShow ?? 1) === 4;

  const confirmarImagemSelecionada = () => {
    if (!pratoSelecionado) return;

    setImagemSelecionada(pratoSelecionado);
    setPopupMode('selection');
    setShowPopup(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} key={`refresh-group-${currentGroupToShow}`}>
      {/* Container Superior para o Breadcrumb idêntico ao da imagem */}
      <View style={styles.breadcrumbWrapper}>
        <ProgressBreadcrumb currentStep={route?.params?.groupNumber ?? currentGroup} />
      </View>

      <View style={styles.scrollContainer}>

        {/* Lista interativa das 3 refeições em formato de cartão */}
        {displayImages.map((item, index) => (
          <View key={`${item.id}-${index}`} style={styles.imageCardRow}>
            {showSwapControls && (
              <TouchableOpacity style={styles.swapArrowButton} onPress={() => restoreOriginalImageAtIndex(index)} activeOpacity={0.75}>
                <Icon name="chevron-left" size={34} color="#81B29A" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.imageCardButton,
                pratoSelecionado && pratoSelecionado.id === item.id ? styles.selectedImageCard : null,
              ]}
              activeOpacity={0.85}
              onPress={() => {
                if (showSwapControls) return;
                setPratoSelecionado(item);
              }}
            >
              <Image source={item.source} style={styles.mealImage} resizeMode="cover" />
            </TouchableOpacity>

            {showSwapControls && (
              <TouchableOpacity style={styles.swapArrowButton} onPress={() => changeImageAtIndex(index)} activeOpacity={0.75}>
                <Icon name="chevron-right" size={34} color="#81B29A" />
              </TouchableOpacity>
            )}
          </View>
        ))}
        
      </View>

      {pratoSelecionado && !showSwapPrompt && (
        <TouchableOpacity
          onPress={confirmarImagemSelecionada}
          activeOpacity={0.9}
          style={{
            position: 'absolute',
            alignSelf: 'center',
            bottom: 80,
            width: 88,
            height: 42,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#81B29A',
            borderRadius: 14,
            zIndex: 1000,
          }}
        >
          <Icon name="check" size={28} color="#FFF" />
        </TouchableOpacity>
      )}

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

                      const answerData = {
                        questionId: `g${currentGroup}_q${perguntaAtual}_imagem`,
                        groupNumber: currentGroup,
                        selectedImage: { id: imagemSelecionada?.id ?? null, name: imagemSelecionada?.name ?? null },
                        targetIndex: imagemSelecionada?.id ?? null,
                        answeredAt: new Date(),
                      };

                      const sessionIdParam = route?.params?.sessionId;
                      let sessionDocId = sessionIdParam;
                      if (sessionIdParam) {
                        await updateDoc(doc(db, 'quiz_sessions', sessionIdParam), {
                          userId: user.uid,
                          selectedImage: answerData.selectedImage,
                          perguntaInicial: perguntaAtual,
                          answers: arrayUnion(answerData),
                          updatedAt: serverTimestamp(),
                        });
                      } else {
                        const sessionDocRef = await addDoc(collection(db, 'quiz_sessions'), {
                          userId: user.uid,
                          selectedImage: answerData.selectedImage,
                          perguntaInicial: perguntaAtual,
                          answers: [answerData],
                          createdAt: serverTimestamp(),
                        });
                        sessionDocId = sessionDocRef.id;
                      }

                      const wasFinalGroupStep = route?.params?.finalGroupStep === true;

                      setImagemSelecionada(null);
                      setShowPopup(false);

                      if (wasFinalGroupStep) {
                        // If this was the final step for the group and we've reached
                        // the configured last group (group 2), go straight to FinishScreen.
                        if (Number(currentGroup ?? 1) >= 2) {
                          navigation.navigate('FinishScreen');
                        } else {
                          // Otherwise show the transition screen for the group that
                          // just finished. The transition screen will call nextGroup()
                          // when the user advances.
                          navigation.navigate('Transition2Screen', { groupNumber: currentGroup });
                        }
                      } else {
                        navigation.navigate('Image1Screen', { sessionId: sessionDocId });
                      }
                    } catch (e) {
                      console.error('Erro ao criar sessão de quiz:', e);
                      setImagemSelecionada(null);
                      setShowPopup(false);
                      navigation.navigate('Image1Screen');
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
                <Text style={styles.instructionText}>{renderBoldText(popupMainText)}</Text>
                {hasFooter && (
                  <View style={styles.overrideFooterRow}>
                    <Icon name="information" size={26} color="#81B29A" style={styles.overrideFooterIcon} />
                    <Text style={styles.overrideFooterText}>Botão de informação.</Text>
                  </View>
                )}

                {/* Only show the swap hint on the initial/help popup, not on override popups */}
                {popupMode !== 'override' && (
                  <View style={styles.subInstructionRow}>
                    <Text style={styles.subInstructionText}>
                      Pode trocar de refeição neste botão
                    </Text>
                    <Image
                      source={require('../assets/troca_imagem.png')}
                      style={styles.subInstructionIcon}
                      resizeMode="contain"
                    />
                  </View>
                )}
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
        <View style={styles.nutritionOverlay}>
          <View style={styles.nutritionCard}>
            {selectedDishInfo ? (
              <>
                {showSalt ? (
                  <Text style={styles.nutritionLine}>Sal: {selectedDishInfo.sal ?? '-'}</Text>
                ) : (
                  <Text style={styles.nutritionLine}>Energia: {selectedDishInfo.energia}</Text>
                )}
                <Text style={styles.nutritionLine}>Porção: {selectedDishInfo.porcao}</Text>
              </>
            ) : (
              <Text style={{ color: '#4b4b4b', fontSize: 16, textAlign: 'center' }}>Seleciona uma imagem primeiro para ver a informação desse prato.</Text>
            )}
            <TouchableOpacity style={styles.nutritionCloseButton} onPress={() => setShowNutritionModal(false)}>
              <Text style={styles.nutritionCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navInner}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.navButton}>
            <Icon name="home-outline" size={32} color="#81B29A" />
          </TouchableOpacity>

          <TouchableOpacity onPress={abrirInformacaoDoPrato} disabled={!infoUnlocked} style={styles.navButton}>
            <View style={styles.infoButtonWrap}>
              <Icon name="information" size={32} color={infoUnlocked ? '#81B29A' : '#d9dddb'} />
              {!infoUnlocked && (
                <Icon name="lock" size={22} color="#81B29A" style={styles.infoLockIcon} />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={enviarOrdemTrocarImagem} style={styles.navButton}>
            <View style={styles.iconStack}>
              <Image
                source={require('../assets/troca_imagem.png')}
                style={styles.swapIconImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F1',
    paddingTop: Platform.OS === 'android' ? 35 : 10,
  },
  breadcrumbWrapper: {
    alignSelf: 'center',
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#FFF8F1',
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
    color: '#709985',
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
    backgroundColor: '#f9e7d9', 
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  selectedImageCard: {
    borderWidth: 4,
    borderColor: '#709985',
    shadowColor: '#84a58c',
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
    backgroundColor: '#f9e7d9',
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
    backgroundColor: '#f9e7d9',
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
    bottom: 55,
    backgroundColor: '#f9e7d9',
    paddingHorizontal: 28,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 95,
  },
  swapPromptText: {
    fontSize: 18,
    color: '#4b4b4b',
    textAlign: 'center',
    width: '100%',
  },
  owlContainer: {
    position: 'absolute',
    left: 290,
    bottom: 40,
    zIndex: 99,
  },
  owlMascot: {
    width: 138,
    height: 138,
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
    color: '#709985',
  },
  instructionText: {
    fontSize: 16,
    color: '#4b4b4b',
    textAlign: 'center',
    lineHeight: 22,
    alignSelf: 'stretch',
  },
  overrideBoldText: {
    fontWeight: 'bold',
    color: '#709985',
    fontSize: 16,
  },
  checkButton: {
    backgroundColor: '#81B29A',
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
    borderColor: '#FFCDA6',
    width: 120,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4b4b4b',
    fontWeight: '700',
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#81B29A',
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
    backgroundColor: '#f9e7d9',
    borderRadius: 12,
    paddingVertical: 25,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 8,
  },
  confirmText: {
    color: '#4b4b4b',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 14,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  modalActionButton: {
    backgroundColor: '#81B29A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalActionText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  nutritionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4b4b4b',
    textAlign: 'center',
    marginBottom: 14,
  },
  nutritionLine: {
    fontSize: 20,
    color: '#4b4b4b',
    textAlign: 'center',
    marginBottom: 6,
  },
  nutritionOverlay: {
    flex: 1,
    //backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',            
    alignItems: 'center',
  },
  nutritionCard: {
    backgroundColor: '#FBE1CE',
    width: '100%',                         
    borderTopLeftRadius: 24,               
    borderTopRightRadius: 24,             
    paddingHorizontal: 30,
    paddingVertical: 36,
    minHeight: 160,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 50 : 36,
  },
  nutritionCloseButton: {
    marginTop: 18,
    backgroundColor: '#81B29A',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 14,
    minWidth: 120,
    alignItems: 'center',
  },
  nutritionCloseText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 55,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#ffffff',
    paddingVertical: 10,
  },
  navInner: {
    width: 370,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    width: 72,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonWrap: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconStack: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swapIconImage: {
    width: 32,
    height: 32,
  },
  infoLockIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
  },
  subInstructionText: {
    fontSize: 15,
    color: '#709985',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subInstructionRow: {
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  subInstructionIcon: {
    width: 30,
    height: 30,
    marginLeft: 10,
  },
  overrideFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  overrideFooterIcon: {
    marginRight: 8,
  },
  overrideFooterText: {
    color: '#709985',
    fontSize: 15,
    fontWeight: '700',
  },
  disabledNavIcon: {
    opacity: 0.3,
  },
});