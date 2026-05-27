import React from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import ProgressBreadcrumb from './ProgressBar';
import { useNutlySession } from '../src/NutlySessionContext';  

const WEB_AR_URL = 'https://joanamaia03.github.io/TESE-NutlyAR/index.html?v=10&group=';

type NutritionItem = {
  key: string;
  assetName: string;
  energia: string;
  porcao: string;
};

const NUTRITION_DATA: NutritionItem[] = [
  { key: 'hotdog', assetName: 'hotdog.png', energia: '270 kcal/100g', porcao: '206g' },
  { key: 'sardine', assetName: 'sardine.png', energia: '106 kcal/100g', porcao: '383g' },
  { key: 'cozido', assetName: 'cozido.png', energia: '151 kcal/100g', porcao: '265g' },
  { key: 'lombo', assetName: 'lombo.png', energia: '174 kcal/100g', porcao: '317g' },
  { key: 'panado', assetName: 'panado.png', energia: '174 kcal/100g', porcao: '263g' },
  { key: 'arrozdepolvo', assetName: 'arrozdepolvo.png', energia: '127 kcal/100g', porcao: '293g' },
  { key: 'presunto', assetName: 'presunto.png', energia: '262 kcal/100g', porcao: '123g' },
  { key: 'lanche', assetName: 'lanche.png', energia: '287 kcal/100g', porcao: '108g' },
  { key: 'rissois', assetName: 'rissois.png', energia: '280 kcal/100g', porcao: '162g' },
  { key: 'hamburger', assetName: 'hamburger.png', energia: '228 kcal/100g', porcao: '144g' },
  { key: 'vaca', assetName: 'vaca.png', energia: '130 kcal/100g', porcao: '198g' },
  { key: 'croquete', assetName: 'croquete.png', energia: '316 kcal/100g', porcao: '135g' },
  { key: 'queijo', assetName: 'queijo.png', energia: '2.1g/100g', porcao: '40g' },
  { key: 'azeitonas', assetName: 'azeitonas.png', energia: '5.3g/100g', porcao: '44g' },
  { key: 'broa', assetName: 'broa.png', energia: '0.7g/100g', porcao: '90g' },
  { key: 'torrada', assetName: 'torrada.png', energia: '1.1g/100g', porcao: '65g' },
  { key: 'chourico', assetName: 'chourico.png', energia: '6.6g/100g', porcao: '42g' },
  { key: 'batatafrita', assetName: 'batatafrita.png', energia: '1.2g/100g', porcao: '45g' },
  { key: 'hamburger', assetName: 'hamburger.png', energia: '1.0g/100g', porcao: '217g' },
  { key: 'presunto', assetName: 'presunto.png', energia: '3.4g/100g', porcao: '123g' },
  { key: 'caldoverde', assetName: 'caldoverde.png', energia: '0.7g/100g', porcao: '237g' },
  { key: 'sandespanado', assetName: 'sandespanado.png', energia: '1.0g/100g', porcao: '203g' },
  { key: 'hotdog', assetName: 'hotdog.png', energia: '2.0g/100g', porcao: '206g' },
  { key: 'sopa', assetName: 'sopa.png', energia: '0.6g/100g', porcao: '253g' },

];

export default function ARScreen({ navigation, route }: any) {
  const { saveAnswer, currentGroup, nextGroup } = useNutlySession();
  const isFinalGroupStep = route?.params?.finalGroupStep === true;
  const breadcrumbStep = route?.params?.groupNumber ?? currentGroup ?? 1;
  const activeGroup = route?.params?.groupNumber ?? currentGroup ?? 1;

  const [cameraGranted, setCameraGranted] = React.useState<boolean | null>(null);
  const [showPopup, setShowPopup] = React.useState(false);
  const [perguntaAtual, setPerguntaAtual] = React.useState(1);
  const webviewRef = React.useRef<any>(null);
  const [debugMsg, setDebugMsg] = React.useState<string | null>(null);
  const [imagemSelecionada, setImagemSelecionada] = React.useState<any>(null);
  const [popupOverrideMessage, setPopupOverrideMessage] = React.useState<string | null>(null);
  const [popupMode, setPopupMode] = React.useState<'help' | 'selection' | 'override'>('help');
  const [infoEnabled, setInfoEnabled] = React.useState<boolean>(false);
  const [showNutritionModal, setShowNutritionModal] = React.useState(false);
  //const [showWebView, setShowWebView] = React.useState(true);
  const [imagemAtiva, setImagemAtiva] = React.useState<{ targetIndex?: number; nomeImagem?: string; fase?: number } | null>(null);

  const processandoCliqueRef = React.useRef<boolean>(false);
  const overridePopupMessageRef = React.useRef<string | null>(null);
  const shouldAutoOpenInitialPopupRef = React.useRef(true);
  const isSaltGroup = activeGroup >= 3;
  const owlInitialMessage = isSaltGroup
    ? 'Qual destas opções considera ter **mais sal**, considerando exatamente a quantidade apresentada. Selecione **apenas uma** das opções clicando na refeição!'
    : 'Qual destas opções considera ter **mais energia (calorias)**, considerando exatamente a quantidade apresentada. Selecione **apenas uma** das opções clicando na refeição!';
  const owlOverrideMessage = isSaltGroup
    ? 'Nesta fase desbloqueou o **botão de informação**, no qual tem acesso ao peso dos alimentos e ao sal por 100g. Qual destas porções terá **mais sal** no total? Pode fazer uma estimativa, **sem usar calculadora**. Selecione **apenas uma** das opções.'
    : popupOverrideMessage;
  

  // ==================== NORMALIZE & NUTRITION ====================
  const normalizeAssetName = (value: string) => String(value).split('/').pop()?.toLowerCase() || '';

  const currentNutrition = React.useMemo(() => {
    const nomeImagem = imagemAtiva?.nomeImagem || imagemSelecionada?.nomeImagem;
    if (!nomeImagem) return null;

    const normalized = normalizeAssetName(nomeImagem);
   return NUTRITION_DATA.find(item => 
      item.assetName === normalized || normalized.includes(item.key)
    ) || null;
  }, [imagemAtiva, imagemSelecionada]);

  const nutritionLabel = activeGroup >= 3 ? 'Sal' : 'Energia';

  // ==================== GUARDAR RESPOSTA (Nova estrutura) ====================
  const guardarRespostaAR = React.useCallback(async (payload: any) => {
    if (!currentGroup) return;

    const imagem = payload?.imagemSelecionada || payload || imagemSelecionada || imagemAtiva;

    const answerData = {
      questionId: `g${currentGroup}_q${perguntaAtual}_ar`,
      groupNumber: currentGroup,
      targetIndex: imagem?.targetIndex ?? null,
      selectedImage: imagem?.nomeImagem ? imagem.nomeImagem.split('/').pop() : null,
      fase: imagem?.fase ?? 1,
      answeredAt: new Date(),
    };

    try {
      await saveAnswer(currentGroup, answerData);
      setTimeout(() => setDebugMsg(null), 1800);
    } catch (error) {
      console.error(error);
      setDebugMsg('Erro ao guardar');
    }
  }, [saveAnswer, currentGroup, perguntaAtual, imagemSelecionada, imagemAtiva]);

  const avançarDepoisDaConfirmacao = React.useCallback(() => {
    if (isFinalGroupStep) {
      if (currentGroup < 4) {
        nextGroup();
        navigation.navigate('Transition1Screen', {
          groupNumber: currentGroup,
        });
      } else {
        navigation.navigate('ScoreScreen');
      }
      return;
    }

    const isLastQuestionOfGroup = perguntaAtual >= 4;

    if (isLastQuestionOfGroup && currentGroup < 4) {
      nextGroup();
      navigation.navigate('Transition1Screen', {
        groupNumber: currentGroup,
      });
    } else if (isLastQuestionOfGroup) {
      navigation.navigate('ScoreScreen');
    } else {
      navigation.navigate('Question1Screen', {
        perguntaAtual: perguntaAtual,
        groupNumber: currentGroup,
      });
    }
  }, [currentGroup, isFinalGroupStep, navigation, nextGroup, perguntaAtual]);

  // ==================== USEFOCUS EFFECT ====================
  useFocusEffect(
    React.useCallback(() => {
      setInfoEnabled(false);
      setImagemAtiva(null);
      setImagemSelecionada(null);
      setPopupOverrideMessage(null);
      overridePopupMessageRef.current = null;
      setPopupMode('help');
      shouldAutoOpenInitialPopupRef.current = true;

      if (route?.params) {
        const { popupOverride, enableInfo, perguntaProxima } = route.params;

       if (perguntaProxima) setPerguntaAtual(perguntaProxima);
        
        if (typeof popupOverride === 'string' && popupOverride.length > 0) {
          shouldAutoOpenInitialPopupRef.current = false;
          overridePopupMessageRef.current = popupOverride;
          setPopupOverrideMessage(popupOverride);
          setPopupMode('override');
          setShowPopup(true);
        }
        
        // Só ativa infoEnabled se vier explicitamente do navigation params
        if (enableInfo === true) setInfoEnabled(true);
      }

      // Hide navigation bar (Android)
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

      // Solicita permissão de câmara (Android) ao focar na tela.
      const checkCameraPermission = async () => {
        if (Platform.OS === 'android') {
          try {
            const result = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.CAMERA,
              {
                title: 'Permissão de Câmara',
                message:
                  'A app precisa de acesso à câmara para funcionalidades de realidade aumentada.',
                buttonPositive: 'OK',
              }
            );
            setCameraGranted(result === PermissionsAndroid.RESULTS.GRANTED);
          } catch (e) {
            console.warn('Camera permission error', e);
            setCameraGranted(false);
          }
        } else {
          // iOS / web - assumimos disponível via configurações
          setCameraGranted(true);
        }
      };

      checkCameraPermission();

      return () => {
        // Cleanup
        overridePopupMessageRef.current = null;
      };
    }, [route])
  );

  React.useEffect(() => {
    if (cameraGranted && shouldAutoOpenInitialPopupRef.current) {
      setPopupMode('help');
      setShowPopup(true);
    }
  }, [cameraGranted]);

  // ==================== WEBVIEW ONMESSAGE ====================
  const onMessage = async (e: any) => {
    try {
      const data = JSON.parse(e.nativeEvent.data);

      if (data?.type === 'IMAGE_CLICKED') {
        setImagemSelecionada(data);
        setPopupMode('selection');
        setShowPopup(true);
      }
      if (data?.type === 'IMAGE_STATE_CHANGED') {
        if (data.visible === false) {
          setImagemAtiva(null);
        } else {
          const newImagemAtiva = {
            targetIndex: data.targetIndex,
            nomeImagem: data.nomeImagem,
            fase: data.fase,
          };
          setImagemAtiva(newImagemAtiva);

          if (data.fase === 2 && route?.params?.enableInfo === true) {
            setInfoEnabled(true);
          }
        }
      }

      if (data?.type === 'POPUP_CONFIRM') {
        await guardarRespostaAR(data);
        setShowPopup(false);
        avançarDepoisDaConfirmacao();
      }
    } catch (error) {
      console.error('Erro ao processar mensagem do WebView:', error);
    }
  };

  // ==================== CONFIRMAR ESCOLHA ====================
  const confirmarEscolhaEAvancar = async () => {
    if (popupMode === 'help') {
      setShowPopup(false);
      setPopupMode('help');
      return;
    }

    const imagemParaGuardar = imagemSelecionada || imagemAtiva;
    if (!imagemParaGuardar) {
      setShowPopup(false);
      setPopupMode('help');
      return;
    }

    if (popupMode === 'override' && !imagemSelecionada) {
      setShowPopup(false);
      setInfoEnabled(true);
      setPopupMode('help');
      return;
    }

    processandoCliqueRef.current = true;
    await guardarRespostaAR(imagemParaGuardar);
    processandoCliqueRef.current = false;

    setShowPopup(false);
    setImagemSelecionada(null);
    setPopupOverrideMessage(null);
    setPopupMode('help');

    avançarDepoisDaConfirmacao();
};

  // ==================== OUTRAS FUNÇÕES ====================
  const enviarOrdemTrocarImagem = () => {
    if (webviewRef.current) {
      const script = `if (typeof trocarModeloAR === 'function') { trocarModeloAR(); } true;`;
      webviewRef.current.injectJavaScript(script);
    }
  };

  const consoleBridge = `(function(){
    try{
      function send(obj){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(obj)); }catch(e){} }
      var methods=['log','warn','error','info'];
      methods.forEach(function(m){
        var orig = console[m] || function(){};
        console[m] = function(){
          try{
            var args = Array.prototype.slice.call(arguments).map(function(a){ try{ return typeof a === 'object' ? JSON.stringify(a) : String(a); }catch(e){ return String(a); }});
            send({ type: 'console', level: m, args: args });
          }catch(e){}
          try{ orig.apply(console, arguments); }catch(e){}
        };
      });
      window.addEventListener('error', function(ev){ send({ type: 'error', message: ev && ev.message, filename: ev && ev.filename, lineno: ev && ev.lineno }); });
    }catch(e){ try{ window.ReactNativeWebView.postMessage(JSON.stringify({ type:'bridgeError', error: String(e) })); }catch(_){} }
  })(); true;`;

  // ==================== RENDER ====================
  const renderBoldText = (text: string) => {
    if (!text) return null;
    // Split by groups like **bold** and keep delimiters
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
    if (popupMode === 'selection') {
      setShowPopup(true);
      return;
    }

    if (popupOverrideMessage) {
      setPopupMode('override');
    } else {
      setPopupMode('help');
    }

    setShowPopup(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={breadcrumbStep} />
      </View>

      <WebView
        ref={webviewRef}
        source={{ uri: WEB_AR_URL }}
        injectedJavaScript={consoleBridge}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        onMessage={onMessage}
        onPermissionRequest={(event: { grant: (arg0: any) => any; resources: any; }) => event.grant(event.resources)}
      />

      {/* Modal Principal */}
      {/* === POPUP DO MOCHO (Inicial + Seleção) === */}
      <Modal visible={showPopup} transparent animationType="none">
        <View style={[styles.modalOverlayBottom, styles.modalOverlayTransparent]}>
          <View style={styles.modalCardBottom}>
            <Image source={require('../assets/Owl.png')} style={styles.owlMascot} resizeMode="contain" />
            <View style={styles.speechBubbleTriangle} />
            
            <View style={styles.speechBubble}>
              {imagemSelecionada ? (
                <Text style={styles.instructionText}>
                  Selecionou a refeição. Tem a certeza de que quer <Text style={styles.boldText}>confirmar esta opção</Text> para a pergunta {perguntaAtual}?
                </Text>
              ) : popupMode === 'override' && owlOverrideMessage ? (
                <Text style={styles.overrideInstructionText}>{renderBoldText(owlOverrideMessage)}</Text>
              ) : (
                // === POPUP INICIAL DO MOCHO ===
                <>
                  <Text style={styles.instructionText}>{renderBoldText(owlInitialMessage)}</Text>
                  <Text style={styles.subInstructionText}>
                    Caso não conheça ou não goste da refeição inidicada, pode trocar de imagem após clicar na mesma e desbloquear o botão no canto inferior direito
                  </Text>
                </>
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
      </Modal>

      {/* Nutrition Modal */}
      <Modal visible={showNutritionModal} transparent animationType="slide" onRequestClose={() => setShowNutritionModal(false)}>
        <View style={styles.nutritionOverlay}>
          <View style={styles.nutritionCard}>
            {currentNutrition ? (
              <>
                <Text style={styles.nutritionMeta}>{nutritionLabel}: {currentNutrition.energia}</Text>
                <Text style={styles.nutritionMeta}>Porção: {currentNutrition.porcao}</Text>
              </>
            ) : (
              <Text style={styles.nutritionHint}>Aponte a câmara para ver informação nutricional</Text>
            )}
            <TouchableOpacity style={styles.nutritionCloseButton} onPress={() => setShowNutritionModal(false)}>
              <Text style={styles.nutritionCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
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

      {/* Owl Help Button */}
      <TouchableOpacity style={styles.owlButton} onPress={abrirPopupDoMocho}>
        <Image source={require('../assets/Owl2.png')} style={styles.owlButtonImage} resizeMode="contain" />
      </TouchableOpacity>

      {debugMsg && (
        <View style={styles.debugToast}>
          <Text style={styles.debugText}>{debugMsg}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? 28 : 44,
  },
  webview: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 180,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  overlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  owlMascot: {
    width: 118,
    height: 118,
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
  overrideInstructionText: {
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
  overrideCheckButton: {
    backgroundColor: '#784115',
    width: 110,
    height: 50,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
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
    borderTopWidth: 1,
    borderColor: '#EBD9C6',
    paddingBottom: 10,
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
  breadcrumbContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 50 : 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 248, 241, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 60,
    elevation: 10,
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  breadcrumbText: {
    color: '#613512',
    fontWeight: '700',
    fontSize: 14,
  },
  owlButton: {
    position: 'absolute',
    right: 5,
    bottom: 65,
    width: 110,
    height: 110,
    zIndex: 80,
    elevation: 12,
  },
  owlButtonImage: {
    width: '100%',
    height: '100%',
  },
  debugToast: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 200,
  },
  debugText: {
    color: '#fff',
    fontSize: 14,
  },
  nutritionOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  nutritionCard: {
    backgroundColor: '#FBE1CE',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 36,
    minHeight: 160,
    width: '100%',
    alignItems: 'center', 
  },
  nutritionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#6B3E1F',
    marginBottom: 6,
    textAlign: 'center',
  },
  nutritionMeal: {
    fontSize: 30,
    fontWeight: '700',
    color: '#6B3E1F',
    marginVertical: 10,
  },
  nutritionMeta: {
    fontSize: 20,
    color: '#7B5A43',
    marginBottom: 6,
    textAlign: 'center',
  },
  nutritionSubTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B3E1F',
    marginTop: 8,
    marginBottom: 6,
  },
  nutritionLine: {
    fontSize: 20,
    color: '#6B3E1F',
    lineHeight: 28,
    textAlign: 'center',
  },
  nutritionHint: {
    fontSize: 16,
    color: '#7B5A43',
    lineHeight: 22,
    marginBottom: 6,
    textAlign: 'center',
  },
  nutritionCloseButton: {
    marginTop: 18,
    backgroundColor: '#784115',
    alignSelf: 'center',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  nutritionCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});