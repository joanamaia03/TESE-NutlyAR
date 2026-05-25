import React from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
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
import { auth, db } from '../src/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

const WEB_AR_URL = 'https://joanamaia03.github.io/TESE-NutlyAR/index.html?v=10';

type NutritionItem = {
  key: string;
  assetName: string;
  energia: string;
  porcao: string;
};

const NUTRITION_DATA: NutritionItem[] = [
  {
    key: 'hotdog',
    assetName: 'hotdog.png',
    energia: '270 kcal/100g',
    porcao: '206g',
  },
  {
    key: 'sardine',
    assetName: 'sardine.png',
    energia: '106 kcal/100g',
    porcao: '383g',
  },
  {
    key: 'cozido',
    assetName: 'cozido.png',
    energia: '151 kcal/100g',
    porcao: '265g',
  },
  {
    key: 'pizza',
    assetName: 'pizza.jpg',
    porcao: '300 g',
    energia: '260',
  },
  {
    key: 'pataniscas',
    assetName: 'pataniscas.jpg',
    porcao: '260 g',
    energia: '170',
  },
  {
    key: 'omelete',
    assetName: 'omelete.jpg',
    porcao: '200 g',
    energia: '143',
  },
];

export default function ARScreen({ navigation, route }: any) {
  const [cameraGranted, setCameraGranted] = React.useState<boolean | null>(null);
  const [showPopup, setShowPopup] = React.useState(false);
  const [perguntaAtual, setPerguntaAtual] = React.useState(1);
  const webviewRef = React.useRef<any>(null);
  const [debugMsg, setDebugMsg] = React.useState<string | null>(null);
  const [imagemSelecionada, setImagemSelecionada] = React.useState<any>(null);
  const [historicoRespostas, setHistoricoRespostas] = React.useState<any[]>([]);
  const [popupOverrideMessage, setPopupOverrideMessage] = React.useState<string | null>(null);
  const [popupMode, setPopupMode] = React.useState<'help' | 'selection' | 'override'>('help');
  const [infoEnabled, setInfoEnabled] = React.useState<boolean>(false);
  const [showNutritionModal, setShowNutritionModal] = React.useState(false);
  const [imagemAtiva, setImagemAtiva] = React.useState<{ targetIndex?: number; nomeImagem?: string; fase?: number } | null>(null);
  const processandoCliqueRef = React.useRef<boolean>(false);

  const normalizeAssetName = (value: string) => {
    const fileName = String(value).split('/').pop() || String(value);
    return fileName.toLowerCase();
  };

  const currentNutrition = React.useMemo(() => {
    const nomeImagem = imagemAtiva?.nomeImagem || imagemSelecionada?.nomeImagem;
    if (!nomeImagem) return null;

    const normalized = normalizeAssetName(String(nomeImagem));
    return (
      NUTRITION_DATA.find((item) => item.assetName === normalized) ||
      NUTRITION_DATA.find((item) => normalized.includes(item.key)) ||
      null
    );
  }, [imagemAtiva, imagemSelecionada]);

  const guardarImagemSelecionada = React.useCallback(async (payload: any) => {
    const user = auth.currentUser;
    console.log('guardarImagemSelecionada called, payload=', payload, 'currentUser=', user);
    
    if (!user) {
      console.warn('Não foi possível guardar a imagem selecionada: utilizador sem sessão.');
      setDebugMsg('Erro: utilizador não autenticado');
      setTimeout(() => setDebugMsg(null), 4000);
      return;
    }

    // Procura a imagem no payload enviado explicitamente, ou nos estados locais da app
    const imagem = payload?.imagemSelecionada || payload || imagemSelecionada || imagemAtiva;

    // Se mesmo assim não houver objeto válido (ex: avançar sem imagem na câmara), criamos um registo de contingência
    const dadosImagem = {
      targetIndex: (imagem && imagem.targetIndex !== undefined) ? imagem.targetIndex : 'nenhum_focado',
      fase: (imagem && imagem.fase !== undefined) ? imagem.fase : 1,
      nomeImagem: (imagem && imagem.nomeImagem) ? imagem.nomeImagem : 'nenhuma_imagem_ativa',
      timestamp: new Date().toISOString(),
    };

    try {
      console.log('Gravando no Firestore para user=', user.uid, 'dados=', dadosImagem);
      setDebugMsg('A gravar dados...');
      
      const qRef = doc(db, 'question', user.uid);
      await setDoc(
        qRef,
        {
          userId: user.uid,
          perguntaAtual,
          imagemSelecionada: dadosImagem,
          ultimaAtualizacao: new Date().toISOString(),
        },
        { merge: true }
      );

      const userRef = doc(db, 'utilizadores', user.uid);
      await updateDoc(userRef, {
        ultimaAtualizacao: new Date().toISOString(),
        ultimaImagemSelecionada: dadosImagem,
      });

      setDebugMsg('Dados gravados com sucesso');
      setTimeout(() => setDebugMsg(null), 3000);
    } catch (error: any) {
      console.warn('Erro ao guardar imagem selecionada:', error?.message || error);
      setDebugMsg('Erro ao gravar: ' + (error?.message || String(error)));
      setTimeout(() => setDebugMsg(null), 5000);
    }
  }, [imagemSelecionada, imagemAtiva, perguntaAtual]);

  // Hide Android navigation bar while this screen is focused and apply any incoming params
  useFocusEffect(
    React.useCallback(() => {
      // Apply incoming navigation params when focused (e.g., from Question4)
      setInfoEnabled(false);
      if (route && route.params) {
        const { popupOverride, enableInfo, perguntaProxima } = route.params as any;
        if (typeof popupOverride === 'string' && popupOverride.length > 0) {
          setPopupOverrideMessage(popupOverride);
          setPopupMode('override');
          setShowPopup(true);
        }
        if (enableInfo) setInfoEnabled(true);
        // Keep breadcrumb on step 1 — don't override perguntaAtual from navigation params.
      }

      let active = true;

      const hideNav = async () => {
        if (Platform.OS !== 'android') return;
        try {
          const nav: any = await import('expo-navigation-bar');
          if (!active) return;
          if (nav) {
            if (typeof nav.setVisibilityAsync === 'function') {
              await nav.setVisibilityAsync('hidden');
            }
            if (typeof nav.setBehaviorAsync === 'function') {
              try {
                await nav.setBehaviorAsync('sticky-immersive');
              } catch (e) {
                // ignore if unsupported
              }
            }
          }
        } catch (e) {
          console.warn('expo-navigation-bar not available, cannot hide navigation bar', e);
        }
      };

      hideNav();

      return () => {
        active = false;
        (async () => {
          try {
            const nav: any = await import('expo-navigation-bar');
            if (nav) {
              if (typeof nav.setVisibilityAsync === 'function') {
                await nav.setVisibilityAsync('visible');
              }
              if (typeof nav.setBehaviorAsync === 'function') {
                try {
                  await nav.setBehaviorAsync('overlay-swipe');
                } catch (e) {
                  // ignore if unsupported
                }
              }
            }
          } catch (e) {
            // ignore
          }
        })();
      };
    }, [route])
  );

  // show popup automatically once camera permission is granted
  React.useEffect(() => {
    if (cameraGranted) {
      setPopupMode('help');
      setShowPopup(true);
    }
  }, [cameraGranted]);

  React.useEffect(() => {
    const requestCameraPermission = async () => {
      if (Platform.OS !== 'android') {
        setCameraGranted(true);
        return;
      }

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Permissao da camara',
          message: 'Precisamos da camara para iniciar a experiencia WebAR.',
          buttonPositive: 'Permitir',
          buttonNegative: 'Negar',
        }
      );

      setCameraGranted(result === PermissionsAndroid.RESULTS.GRANTED);
    };

    requestCameraPermission();
  }, []);

  const openSystemSettings = async () => {
    await Linking.openSettings();
  };

  const webArSource = {
    uri: WEB_AR_URL,
  };

  // Função para enviar a ordem de troca de imagem para a WebView
  const enviarOrdemTrocarImagem = () => {
    if (webviewRef.current) {
      const script = `if (typeof trocarModeloAR === 'function') { trocarModeloAR(); } true;`;
      webviewRef.current.injectJavaScript(script);
    }
  };

  const confirmarEscolhaEAvancar = async () => {
    const isSelectionFlow = popupMode === 'selection' && Boolean(imagemSelecionada);

    // Ajuda normal do mocho: apenas fecha o popup.
    if (popupMode === 'help') {
      setShowPopup(false);
      setPopupMode('help');
      setImagemSelecionada(null);
      setPopupOverrideMessage(null);
      return;
    }

    // O popup vindo da Question4 só deve desbloquear o botão de informação e
    // manter a câmara ativa; não deve avançar para outro ecrã.
    if (popupMode === 'override' && !imagemSelecionada) {
      setShowPopup(false);
      setInfoEnabled(true);
      setPopupMode('help');
      setImagemSelecionada(null);
      setPopupOverrideMessage(null);
      return;
    }

    // Segurança extra: se não for um fluxo de seleção, fecha apenas.
    if (!isSelectionFlow) {
      setShowPopup(false);
      setPopupMode('help');
      setImagemSelecionada(null);
      setPopupOverrideMessage(null);
      return;
    }

    // Ativa o bloqueio protetor contra re-renders frenéticos da câmara
    processandoCliqueRef.current = true;

    try {
      setDebugMsg("A enviar para o Firestore...");
      
      // Define com precisão cirúrgica o que vai ser gravado
      const dadosParaGravar = imagemSelecionada || imagemAtiva || { 
        targetIndex: 'override_texto', 
        fase: 1, 
        nomeImagem: 'avanco_por_override' 
      };

      await guardarImagemSelecionada({ imagemSelecionada: dadosParaGravar });
      
    } catch (dbError) {
      console.warn("Erro ao processar gravação, avançando por segurança:", dbError);
    } finally {
      // Liberta o bloqueio protetor após a tentativa de gravação
      processandoCliqueRef.current = false;
    }

    // Limpa os estados locais e fecha as modais antes de mudar de ecrã
    setShowPopup(false);
    setImagemSelecionada(null);
    setPopupOverrideMessage(null);
    setPopupMode('help');

    // Navega em segurança para o cenário hipotético
    try {
      navigation.navigate('ImagineScreen', {
        perguntaAtual: perguntaAtual,
        historicoRespostas: historicoRespostas,
      });
    } catch (navErr) {
      console.warn('A navegação falhou:', navErr);
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

  // Render text that supports **bold** markup inside the popupOverrideMessage
  const renderFormattedText = (text: string | null, instructionStyle?: any, boldStyle?: any) => {
    if (!text) return null;
    // Split by **bold** markers
    const parts: Array<{ text: string; bold: boolean }> = [];
    const regex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), bold: false });
      }
      parts.push({ text: match[1], bold: true });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), bold: false });
    }

    return (
      <Text style={[instructionStyle || styles.instructionText, { width: '100%' }]}>
        {parts.map((p, i) => (
          <Text key={i} style={p.bold ? (boldStyle || styles.boldText) : undefined}>
            {p.text}
          </Text>
        ))}
      </Text>
    );
  };

  const renderFormattedParagraphs = (text: string | null, instructionStyle?: any, boldStyle?: any) => {
    if (!text) return null;
    // Normalize line endings and keep original newlines so that a single Text
    // element handles wrapping consistently across all lines.
    const normalized = text.replace(/\r\n/g, '\n');
    return (
      <View style={{ width: '100%' }}>
        {renderFormattedText(normalized, instructionStyle, boldStyle)}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.breadcrumbContainer}>
        <ProgressBreadcrumb currentStep={perguntaAtual} />
      </View>
      
      <WebView
        ref={webviewRef}
        source={webArSource}
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
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent as any;
          console.warn('WebView error: ', nativeEvent);
        }}
        onMessage={(e) => {
          try {
            const data = JSON.parse(e.nativeEvent.data);
            
            // ESCUTA O EVENTO DE CLIQUE DO TEU HTML (index.html)
            if (data?.type === 'IMAGE_CLICKED') {
              // Normalize the incoming payload: web may send the image inside
              // `imagemSelecionada` or inline as fields. Store only the image object
              // in state so later code can rely on `imagemSelecionada.targetIndex` etc.
              const imgPayload = data?.imagemSelecionada ?? data?.payload ?? (data?.targetIndex !== undefined ? {
                targetIndex: data.targetIndex,
                nomeImagem: data.nomeImagem,
                fase: data.fase,
              } : null);

              if (imgPayload) {
                setImagemSelecionada(imgPayload);
                setPopupMode('selection');
              } else {
                console.warn('IMAGE_CLICKED received without imagem payload', data);
              }
              setShowPopup(true); // Abre dinamicamente o Modal fofo da Coruja
            }

            if (data?.type === 'IMAGE_STATE_CHANGED') {
              if (data?.visible === false) {
                setImagemAtiva((current) => (current?.targetIndex === data?.targetIndex ? null : current));
              } else {
                // Só atualiza se o utilizador não estiver no meio do processo de clique
                if (!processandoCliqueRef.current) {
                  setImagemAtiva({
                    targetIndex: data?.targetIndex,
                    nomeImagem: data?.nomeImagem,
                    fase: data?.fase,
                  });
                }
                  // Só desbloqueia o botão de informação quando a fase indicada já o permite.
                  if (data?.fase === 2) {
                    setInfoEnabled(true);
                  }
              }
            }

            // Quando o popup da página web envia confirmação (botão 'Sim') navegamos para o ecrã de pergunta
            if (data?.type === 'POPUP_CONFIRM' && data?.action === 'continue') {
              void guardarImagemSelecionada(data);
              // Fecha o modal local caso esteja aberto e avança para Question1.
              setShowPopup(false);
              try{
                navigation.navigate('Question1Screen', { perguntaAtual, historicoRespostas });
              }catch(err){
                console.warn('Navigation to Question1Screen failed', err);
              }
            }

            if (data?.type === 'console') {
              console.log('WebView console[' + data.level + ']:', ...data.args);
            }
          } catch (err) {
            console.log('WebView message (raw):', e.nativeEvent.data);
          }
        }}
        onPermissionRequest={(event: { grant: (arg0: any) => any; resources: any; }) => event.grant(event.resources)}
      />

      {/* POP-UP FOFO (MODAL DE CONFIRMAÇÃO) */}
      <Modal visible={showPopup} transparent animationType="none">
        <View style={[styles.modalOverlayBottom, styles.modalOverlayTransparent] }>
          <View style={styles.modalCardBottom}>
            
            <Image 
              source={require('../assets/Owl.png')}
              style={styles.owlMascot}
              resizeMode="contain"
            />

            <View style={styles.speechBubbleTriangle} />

            <View style={styles.speechBubble}>
              {imagemSelecionada ? (
                // Mensagem contextual dinâmina quando o utilizador clica numa imagem
                <Text style={styles.instructionText}>
                  Selecionou a refeição. Tem a certeza de que quer <Text style={styles.boldText}>confirmar esta opção</Text> para a pergunta {perguntaAtual}?
                </Text>
                ) : (
                  popupOverrideMessage ? (
                    renderFormattedParagraphs(popupOverrideMessage, styles.overrideInstructionText, styles.overrideBoldText)
                  ) : (
                // Instrução genérica de abertura da página
                <>
                  <Text style={styles.instructionText}>
                    Qual destas opções considera ter <Text style={styles.boldText}>mais energia (calorias)</Text>, considerando exatamente a quantidade apresentada. Selecione <Text style={styles.boldText}>apenas uma</Text> das opções clicando na refeição!
                  </Text>
                  <Text style={styles.subInstructionText}>
                    Caso não conheça ou não goste da refeição indicada, pode trocar de imagem após clicar na mesma e desbloquear o botão no canto inferior direito.
                  </Text>
                </>
                )
                )}
            </View>

            {/* Se houver uma imagem selecionada, o clique aciona o fluxo de guardar e avançar. Caso contrário, apenas fecha a instrução inicial */}
            <TouchableOpacity 
              style={popupOverrideMessage ? styles.overrideCheckButton : styles.checkButton} 
              onPress={confirmarEscolhaEAvancar}
            >
              <Icon name="check" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showNutritionModal} transparent animationType="slide" onRequestClose={() => setShowNutritionModal(false)}>
        <View style={styles.nutritionOverlay}>
          <View style={styles.nutritionCard}>

            {currentNutrition ? (
              <>
                <Text style={styles.nutritionMeta}>
                  Energia: {currentNutrition.energia ?? currentNutrition.energia ?? (currentNutrition.energia ? `${currentNutrition.energia} kcal/100g` : '—')}
                </Text>
                <Text style={styles.nutritionMeta}>Porção: {currentNutrition.porcao ?? '—'}</Text>
              </>
            ) : (
              <>
                <Text style={styles.nutritionHint}>
                  Aponte a câmara para uma das refeições para ver a informação nutricional aqui!
                </Text>
              </>
            )}

            <TouchableOpacity style={styles.nutritionCloseButton} onPress={() => setShowNutritionModal(false)}>
              <Text style={styles.nutritionCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <TouchableOpacity
        style={styles.owlButton}
        onPress={() => {
          setImagemSelecionada(null); // Garante que abre como texto de instrução limpo
          setPopupMode('help');
          setShowPopup(true);
        }}
        accessibilityLabel="Ajuda"
      >
        <Image source={require('../assets/Owl2.png')} style={styles.owlButtonImage} resizeMode="contain" />
      </TouchableOpacity>
      
      {debugMsg ? (
        <View style={styles.debugToast} pointerEvents="none">
          <Text style={styles.debugText}>{debugMsg}</Text>
        </View>
      ) : null}
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
    backgroundColor: '#FAF5F0',
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
    color: '#613512',
    marginBottom: 6,
    textAlign: 'center',
  },
  nutritionMeal: {
    fontSize: 30,
    fontWeight: '700',
    color: '#613512',
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
    color: '#613512',
    marginTop: 8,
    marginBottom: 6,
  },
  nutritionLine: {
    fontSize: 20,
    color: '#613512',
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