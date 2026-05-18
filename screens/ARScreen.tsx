import React, { useMemo } from 'react';
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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';


const WEB_AR_URL = 'https://joanamaia03.github.io/TESE-NutlyAR/index.html?v=10';

export default function ARScreen() {
  const [cameraGranted, setCameraGranted] = React.useState<boolean | null>(null);
  const [showPopup, setShowPopup] = React.useState(false);

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

const webArSource = useMemo(() => ({ 
  uri: `https://joanamaia03.github.io/TESE-NutlyAR/index.html?v=${Math.random()}` 
}), []);

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
      <WebView
        source={webArSource}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        mixedContentMode="always"
        originWhitelist={['*']}
        setSupportMultipleWindows={false}
        onPermissionRequest={(event: { grant: (arg0: any) => any; resources: any; }) => event.grant(event.resources)}
      />

      {/* floating button to open popup */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setShowPopup(true)}>
        <Text style={styles.floatingButtonText}>i</Text>
      </TouchableOpacity>

      <Modal visible={showPopup} transparent animationType="slide">
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalCardBottom}>
            <Text style={styles.modalTitle}>Informação AR</Text>
            <Text style={styles.modalText}>Qual destas opções considera ter mais energia (calorias), considerando exatamente a quantidade apresentada.</Text>
            <Text style={styles.modalText}> Selecione apenas uma das opções clicando na refeição! Caso não conheça ou não goste da refeição inidicada, pode trocar de imagem após clicar na mesma e desbloquear o botão no canto inferior direito</Text>
            <Pressable style={styles.modalClose} onPress={() => setShowPopup(false)}>
              <Icon name="check" size={20} color="#fff" />
            </Pressable>
          </View>
        </View>
      </Modal>

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Câmara ativa</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  webview: {
    flex: 1,
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
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#784115',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  modalCardBottom: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    color: '#613512',
  },
  modalText: {
    fontSize: 15,
    color: '#6B3E1F',
    textAlign: 'center',
    marginBottom: 14,
  },
  modalClose: {
    backgroundColor: '#784115',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalCloseText: {
    color: '#fff',
    fontWeight: '700',
  },
});