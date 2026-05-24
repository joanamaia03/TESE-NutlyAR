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

const WEB_AR_URL = 'https://joanamaia03.github.io/TESE-NutlyAR/index.html?v=10';

type NutritionItem = {
  key: string;
  assetName: string;
  label: string;
  porcao: string;
  energiaTotalKcal: number;
  energia100gKcal: number;
  proteinaG: number;
  hidratosG: number;
  gorduraG: number;
};

const NUTRITION_DATA: NutritionItem[] = [
  {
    key: 'hotdog',
    assetName: 'hotdog.png',
    label: 'Hot dog',
    porcao: '190 g',
    energiaTotalKcal: 494,
    energia100gKcal: 260,
    proteinaG: 16,
    hidratosG: 34,
    gorduraG: 29,
  },
  {
    key: 'sardine',
    assetName: 'sardine.png',
    label: 'Sardinhas',
    porcao: '220 g',
    energiaTotalKcal: 396,
    energia100gKcal: 180,
    proteinaG: 35,
    hidratosG: 2,
    gorduraG: 25,
  },
  {
    key: 'cozido',
    assetName: 'cozido.png',
    label: 'Cozido',
    porcao: '350 g',
    energiaTotalKcal: 560,
    energia100gKcal: 160,
    proteinaG: 32,
    hidratosG: 46,
    gorduraG: 24,
  },
  {
    key: 'pizza',
    assetName: 'pizza.jpg',
    label: 'Pizza',
    porcao: '300 g',
    energiaTotalKcal: 780,
    energia100gKcal: 260,
    proteinaG: 29,
    hidratosG: 86,
    gorduraG: 35,
  },
  {
    key: 'pataniscas',
    assetName: 'pataniscas.jpg',
    label: 'Pataniscas',
    porcao: '260 g',
    energiaTotalKcal: 442,
    energia100gKcal: 170,
    proteinaG: 23,
    hidratosG: 30,
    gorduraG: 22,
  },
  {
    key: 'omelete',
    assetName: 'omelete.jpg',
    label: 'Omelete',
    porcao: '200 g',
    energiaTotalKcal: 286,
    energia100gKcal: 143,
    proteinaG: 19,
    hidratosG: 4,
    gorduraG: 21,
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
  const [infoEnabled, setInfoEnabled] = React.useState<boolean>(false);
  const [showNutritionModal, setShowNutritionModal] = React.useState(false);
  const [imagemAtiva, setImagemAtiva] = React.useState<{ targetIndex?: number; nomeImagem?: string; fase?: number } | null>(null);

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

  // Hide Android navigation bar while this screen is focused and apply any incoming params
  useFocusEffect(
    React.useCallback(() => {
      // Apply incoming navigation params when focused (e.g., from Question4)
      if (route && route.params) {
        const { popupOverride, enableInfo, perguntaProxima } = route.params as any;
        if (typeof popupOverride === 'string' && popupOverride.length > 0) {
          setPopupOverrideMessage(popupOverride);
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

  // Lógica executada quando o utilizador confirma a escolha no Pop-up 
  const confirmarEscolhaEAvancar = () => {
    // Se não houver imagem selecionada, apenas fecha o pop-up (comportamento antigo)
    if (!imagemSelecionada) {
      setShowPopup(false);
      return;
    }

    // 1. Cria o objeto com a resposta da pergunta atual
    const dadosPergunta = {
      pergunta: perguntaAtual,
      targetIndex: imagemSelecionada.targetIndex,
      fase: imagemSelecionada.fase,
      imagem: imagemSelecionada.nomeImagem,
      timestamp: new Date().toISOString(),
    };

    // Fecha o pop-up e limpa seleção
    setShowPopup(false);
    setImagemSelecionada(null);

    // Navega para o cenário/historico como antes
    navigation.navigate('ImagineScreen', {
      perguntaAtual: perguntaAtual,
    });
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
              setImagemSelecionada(data); // Armazena temporariamente os dados da foto clicada
              setShowPopup(true);         // Abre dinamicamente o Modal fofo da Coruja
            }

            if (data?.type === 'IMAGE_STATE_CHANGED') {
              if (data?.visible === false) {
                setImagemAtiva((current) => (current?.targetIndex === data?.targetIndex ? null : current));
              } else {
                setImagemAtiva({
                  targetIndex: data?.targetIndex,
                  nomeImagem: data?.nomeImagem,
                  fase: data?.fase,
                });
              }
            }

            // Quando o popup da página web envia confirmação (botão 'Sim') navegamos para o ecrã de pergunta
            if (data?.type === 'POPUP_CONFIRM' && data?.action === 'continue') {
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
            <Text style={styles.nutritionTitle}>Dados Nutricionais</Text>

            {currentNutrition ? (
              <>
                <Text style={styles.nutritionMeal}>{currentNutrition.label}</Text>
                <Text style={styles.nutritionMeta}>Imagem ativa: {currentNutrition.assetName}</Text>
                <Text style={styles.nutritionMeta}>Porção: {currentNutrition.porcao}</Text>
                <Text style={styles.nutritionLine}>Energia total da porção: {currentNutrition.energiaTotalKcal} kcal</Text>
                <Text style={styles.nutritionLine}>Energia por 100g: {currentNutrition.energia100gKcal} kcal</Text>
                <Text style={styles.nutritionLine}>Proteína: {currentNutrition.proteinaG} g</Text>
                <Text style={styles.nutritionLine}>Hidratos de carbono: {currentNutrition.hidratosG} g</Text>
                <Text style={styles.nutritionLine}>Gordura: {currentNutrition.gorduraG} g</Text>
              </>
            ) : (
              <>
                <Text style={styles.nutritionHint}>
                  Ainda não foi identificada a imagem ativa da RA. Toque numa refeição flutuante ou mude a imagem para ver os dados nutricionais correspondentes.
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
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  nutritionCard: {
    backgroundColor: '#FFF8F1',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 18,
    minHeight: 320,
  },
  nutritionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#613512',
    marginBottom: 8,
    textAlign: 'center',
  },
  nutritionMeal: {
    fontSize: 18,
    fontWeight: '700',
    color: '#7B451B',
    marginBottom: 4,
  },
  nutritionMeta: {
    fontSize: 14,
    color: '#7B5A43',
    marginBottom: 8,
  },
  nutritionSubTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#613512',
    marginTop: 8,
    marginBottom: 6,
  },
  nutritionLine: {
    fontSize: 15,
    color: '#613512',
    lineHeight: 22,
  },
  nutritionHint: {
    fontSize: 15,
    color: '#7B5A43',
    lineHeight: 22,
    marginBottom: 6,
  },
  nutritionCloseButton: {
    marginTop: 16,
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