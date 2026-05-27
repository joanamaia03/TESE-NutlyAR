import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { Share, Alert, Modal } from 'react-native';

type CertificadoItem = {
  id: string;
  titulo: string;
  imageSource: any; 
  iconFallback: any;
};

export default function CertificadosScreen({ navigation }: any) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  
  const certificados: CertificadoItem[] = [
    {
      id: '1',
      titulo: 'Participação',
      imageSource: require('../assets/participação.png'),
      iconFallback: 'certificate',
    },
    {
      id: '2',
      titulo: 'Leitor de\nRótulos',
      imageSource: require('../assets/rotulos.png'),
      iconFallback: 'certificate',
    },
    {
      id: '3',
      titulo: 'Mérito no\nconhecimento\nda Composição\nNutricional',
      imageSource: require('../assets/composição.png'),
      iconFallback: 'certificate',
    },
    {
      id: '4',
      titulo: 'Distinção no\nCálculo de\nDensidade\nEnergética',
      imageSource: require('../assets/calculo.png'),
      iconFallback: 'certificate',
    },
    {
      id: '5',
      titulo: 'Excelência para\nEstimativa de\nPorções',
      imageSource: require('../assets/porções.png'),
      iconFallback: 'certificate',
    },
    {
      id: '6',
      titulo: 'Mestre das\nSubstituições',
      imageSource: require('../assets/substituições.png'),
      iconFallback: 'certificate',
    },
  ];

  const handleDownload = async (id: string, titulo: string, imageSource: any) => {
    try {
      // 1. Resolve o módulo interno empacotado para um URI local utilizável
      const asset = Asset.fromModule(imageSource);
      await asset.downloadAsync();
      const localUri = asset.localUri || asset.uri;

      if (!localUri) throw new Error('Não foi possível processar o ficheiro do certificado.');

      // 2. Limpa o nome para evitar espaços vazios ou caracteres que quebrem o sistema de ficheiros
      const cleanName = titulo.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-\.]/g, '');
      const ext = localUri.split('.').pop()?.split('?')[0] || 'png';
      
      // Obtém o diretório de cache base do dispositivo
      let cacheDir: string = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || '';
      
      if (cacheDir && !cacheDir.endsWith('/')) {
        cacheDir = `${cacheDir}/`;
      }
      
      const destUri = `${cacheDir}${cleanName}.${ext}`;

      // 3. Efetua a cópia se a origem local for diferente do destino limpo
      if (localUri !== destUri) {
        const info = await FileSystem.getInfoAsync(destUri);
        if (info.exists) {
          await FileSystem.deleteAsync(destUri, { idempotent: true });
        }
        await FileSystem.copyAsync({ from: localUri, to: destUri });
      }

      // Garante o prefixo 'file://' para que as APIs nativas do Android/iOS aceitem o anexo
      const fileUrlShare = destUri.startsWith('file://') ? destUri : `file://${destUri}`;

      // Guarda dados de preview e abre modal para mostrar o ficheiro ao utilizador
      setPreviewUri(fileUrlShare);
      setPreviewTitle(titulo);
      setPreviewVisible(true);
    } catch (err: any) {
      console.error('Erro ao descarregar certificado:', err);
      Alert.alert('Erro', err?.message || 'Falha ao processar o download do certificado.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.mainTitle}>Certificados</Text>

        <View style={styles.gridContainer}>
          {certificados.map((item) => (
            <View key={item.id} style={styles.certCard}>
              
              <TouchableOpacity 
                onPress={() => handleDownload(item.id, item.titulo, item.imageSource)}
                activeOpacity={0.7}
                style={styles.imageWrapper}
              >
                {item.imageSource ? (
                  <Image source={item.imageSource} style={styles.certImage} resizeMode="contain" />
                ) : (
                  <Icon name={item.iconFallback} size={70} color="#784115" />
                )}
              </TouchableOpacity>

              <Text style={styles.certTitle}>{item.titulo}</Text>

              <TouchableOpacity 
                onPress={() => handleDownload(item.id, item.titulo, item.imageSource)}
                style={styles.downloadButton}
              >
                <Icon name="download-outline" size={24} color="#784115" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.nextButton}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ReflexãoScreen')}
        >
          <Text style={styles.nextButtonText}>Seguinte</Text>
        </TouchableOpacity>

        {/* Modal de pré-visualização do certificado */}
        <Modal visible={previewVisible} animationType="slide" transparent>
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Aqui está o teu certificado</Text>
              {previewUri ? (
                <Image source={{ uri: previewUri }} style={styles.modalImage} resizeMode="contain" />
              ) : (
                <Text>Imagem indisponível</Text>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={async () => {
                    try {
                      const shareContent = Platform.select({
                        ios: { title: previewTitle, url: previewUri },
                        default: { title: previewTitle, message: `Aqui está o teu certificado de ${previewTitle}!`, url: previewUri },
                      });
                      await Share.share(shareContent as any);
                      setPreviewVisible(false);
                    } catch (e) {
                      Alert.alert('Erro', 'Não foi possível enviar o certificado.');
                    }
                  }}
                >
                  <Text style={styles.modalButtonText}>Download</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalButton, styles.modalClose]} onPress={() => setPreviewVisible(false)}>
                  <Text style={[styles.modalButtonText, styles.modalCloseText]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Modal>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF5F0',
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  scrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainTitle: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#613512',
    marginTop: 30,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' },
  modalContent: {
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#613512', marginBottom: 12 },
  modalImage: { width: '100%', height: 300, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalButton: { flex: 1, padding: 12, backgroundColor: '#784115', margin: 8, borderRadius: 8, alignItems: 'center' },
  modalButtonText: { color: '#fff', fontWeight: '700' },
  modalClose: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#784115' },
  modalCloseText: { color: '#784115' },
  gridContainer: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  certCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8CBB6',
    borderRadius: 12,
    padding: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 1.3,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  certImage: {
    width: '100%',
    height: '100%',
  },
  certTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#613512',
    textAlign: 'center',
    lineHeight: 18,
    minHeight: 54,
  },
  downloadButton: {
    marginTop: 2,
    padding: 4,
  },
  nextButton: {
    backgroundColor: '#784115',
    width: '60%',
    maxWidth: 190,
    paddingVertical: 14,
    borderRadius: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
});