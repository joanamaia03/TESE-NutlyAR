import React, { useMemo } from 'react';
import {
  Linking,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';


const WEB_AR_URL = 'https://joanamaia03.github.io/TESE-NutlyAR/';

export default function ARScreen() {
  const [cameraGranted, setCameraGranted] = React.useState<boolean | null>(null);

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

  const webArSource = useMemo(() => ({ uri: WEB_AR_URL }), []);

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

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>WebAR ativa</Text>
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
});