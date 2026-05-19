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
// removed asset/file-system handling for image swap
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import ProgressBreadcrumb from '../ProgressBar';


const WEB_AR_URL = 'https://joanamaia03.github.io/TESE-NutlyAR/index.html?v=10';

export default function ARScreen({ navigation }: any) {
  const [cameraGranted, setCameraGranted] = React.useState<boolean | null>(null);
  const [showPopup, setShowPopup] = React.useState(false);
  const [perguntaAtual, setPerguntaAtual] = React.useState(1);
  const webviewRef = React.useRef<any>(null);
  const [debugMsg, setDebugMsg] = React.useState<string | null>(null);

  // image swap logic removed per request

  // Hide Android navigation bar when this screen is active (if expo-navigation-bar is installed)
  React.useEffect(() => {
    let mounted = true;
    const tryHide = async () => {
      if (Platform.OS !== 'android') return;
      try {
        const nav: any = await import('expo-navigation-bar');
        if (!mounted) return;
        if (nav && typeof nav.setVisibilityAsync === 'function') {
          await nav.setVisibilityAsync('hidden');
        }
      } catch (e) {
        console.warn('expo-navigation-bar not available, cannot hide navigation bar', e);
      }
    };

    tryHide();

    return () => {
      mounted = false;
      (async () => {
        try {
          const nav: any = await import('expo-navigation-bar');
          if (nav && typeof nav.setVisibilityAsync === 'function') {
            await nav.setVisibilityAsync('visible');
          }
        } catch (e) {
          // ignore
        }
      })();
    };
  }, []);

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
      setDebugMsg("A solicitar troca de imagem...");
      
      // Injeta a chamada da função que tens (ou vais criar) no teu index.html
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

  if (cameraGranted === null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>A verificar permissao da camara...</Text>
      </View>
    );
  }

  if (!cameraGranted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.infoText}>Sem permissao da camara nao e possivel usar WebAR.</Text>
        <Pressable onPress={openSystemSettings} style={styles.button}>
          <Text style={styles.buttonText}>Abrir Definicoes</Text>
        </Pressable>
      </View>
    );
  }

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
            console.log('From WebView:', data);
            if (data?.type === 'console') {
              console.log('WebView console[' + data.level + ']:', ...data.args);
            }
          } catch (err) {
            console.log('WebView message (raw):', e.nativeEvent.data);
          }
        }}
        onPermissionRequest={(event: { grant: (arg0: any) => any; resources: any; }) => event.grant(event.resources)}
      />

      {/* POP-UP FOFO (MODAL) */}
      <Modal visible={showPopup} transparent animationType="none">
        <View style={[styles.modalOverlayBottom, styles.modalOverlayTransparent] }>
          
          {/* Contentor do Pop-up (Fundo Salmão/Laranja Claro) */}
          <View style={styles.modalCardBottom}>
            
            {/* Imagem da Mascote Coruja (Saltando para fora da caixa) */}
            <Image 
              source={require('../assets/Owl.png')}
              style={styles.owlMascot}
              resizeMode="contain"
            />

            {/* Seta do Balão de Fala */}
            <View style={styles.speechBubbleTriangle} />

            {/* Balão de Texto (Off-White) */}
            <View style={styles.speechBubble}>
              <Text style={styles.instructionText}>
                Qual destas opções considera ter <Text style={styles.boldText}>mais energia (calorias)</Text>, considerando exatamente a quantidade apresentada. Selecione <Text style={styles.boldText}>apenas uma</Text> das opções clicando na refeição!
              </Text>

              <Text style={styles.subInstructionText}>
                Caso não conheça ou não goste da refeição indicada, pode trocar de imagem após clicar na mesma e desbloquear o botão no canto inferior direito.
              </Text>
            </View>

            {/* Botão de Checkmark para Fechar/Confirmar */}
            <TouchableOpacity style={styles.checkButton} onPress={() => setShowPopup(false)}>
              <Icon name="check" size={40} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
        <View style={styles.bottomNav}>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Icon name="home" size={32} color="#613512" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} disabled={true}>
            <Icon name="information" size={32} color="#C7B8AA" />
          </TouchableOpacity>
          <TouchableOpacity onPress={enviarOrdemTrocarImagem}>
          <View style={styles.iconStack}>
            <Icon name="image" size={36} color="#e2ac77" style={styles.underIcon} />
            <Icon name="swap-horizontal" size={32} color="#613512" style={styles.topIcon} />
          </View>
        </TouchableOpacity>
        </View>
        {/* Owl helper button (bottom-right) */}
        <TouchableOpacity
          style={styles.owlButton}
          onPress={() => setShowPopup(true)}
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
    backgroundColor: 'rgba(0,0,0,0.0)', 
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
  instructionText: {
    fontSize: 16,
    color: '#613512',
    textAlign: 'center',
    lineHeight: 22,
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
  },
  checkButton: {
    backgroundColor: '#613512', 
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

  /* Barra de Navegação Inferior */
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
  }
  ,
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
    transform: [{ scale: 1 }],
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
});