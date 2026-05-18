import React, { useLayoutEffect, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { db, auth } from '../src/firebase';
import { doc, updateDoc, setDoc } from "firebase/firestore";

export default function SocioDemographicScreen({ navigation }: any) {
  useLayoutEffect(() => {
    navigation?.setOptions?.({
      headerShown: false,
      header: () => null,
      title: '',
    });
  }, [navigation]);

  // Estados para os inputs de texto
  const [anoNascimento, setAnoNascimento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [municipiosAnteriores, setMunicipiosAnteriores] = useState('');

  // Estados para as escolhas (Radio Buttons)
  const [genero, setGenero] = useState('');
  const [generoOutro, setGeneroOutro] = useState('');
  const [idade, setIdade] = useState('');
  const [escolaridade, setEscolaridade] = useState('');
  const [escolaridadeOutro, setEscolaridadeOutro] = useState('');
  const [residiuSempre, setResidiuSempre] = useState('');
  const [condicaoMedica, setCondicaoMedica] = useState('');
  const [condicaoMedicaOutro, setCondicaoMedicaOutro] = useState('');
  const [padraoAlimentar, setPadraoAlimentar] = useState('');
  const [padraoAlimentarOutro, setPadraoAlimentarOutro] = useState('');

  // Limpa o campo de municípios anteriores se a resposta a 'residiuSempre' não for 'nao'
  useEffect(() => {
    if (residiuSempre !== 'nao') {
      setMunicipiosAnteriores('');
    }
  }, [residiuSempre]);
  const handleGuardar = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Erro", "Precisas de estar com a sessão iniciada!");
      return;
    }

    // Resolve 'outro' values: se selecionado 'outro', usa o texto especificado
    const resolvedGenero = genero === 'outro' ? generoOutro : genero;
    const resolvedEscolaridade = escolaridade === 'outro' ? escolaridadeOutro : escolaridade;
    const resolvedCondicaoMedica = condicaoMedica === 'outro' ? condicaoMedicaOutro : condicaoMedica;
    const resolvedPadraoAlimentar = padraoAlimentar === 'outro' ? padraoAlimentarOutro : padraoAlimentar;

    try {
      // Guarda uma cópia das respostas numa coleção 'demographics' (id = user.uid)
      const demoRef = doc(db, "demographics", user.uid);
      await setDoc(demoRef, {
        userId: user.uid,
        dadosSociodemograficos: {
          genero: resolvedGenero,
          dataNascimento: anoNascimento,
          grupoIdade: idade,
          grauEscolaridade: resolvedEscolaridade,
          municipioResidencia: municipio,
          residiuSempreNesteMunicipio: residiuSempre,
          municipiosAnteriores,
          condicaoMedica: resolvedCondicaoMedica,
          padraoAlimentar: resolvedPadraoAlimentar,
        },
        ultimaAtualizacao: new Date().toISOString()
      }, { merge: true });

      // Atualiza o documento do utilizador que já existe no Firestore
      const userRef = doc(db, "utilizadores", user.uid);
      await updateDoc(userRef, {
        perfilCompleto: true,
        dadosSociodemograficos: {
          genero: resolvedGenero,
          dataNascimento: anoNascimento,
          grupoIdade: idade,
          grauEscolaridade: resolvedEscolaridade,
          municipioResidencia: municipio,
          residiuSempreNesteMunicipio: residiuSempre,
          municipiosAnteriores,
          condicaoMedica: resolvedCondicaoMedica,
          padraoAlimentar: resolvedPadraoAlimentar,
        },
        ultimaAtualizacao: new Date().toISOString()
      });

      Alert.alert("Sucesso", "Dados guardados com sucesso!");
      navigation.navigate('Home'); // Vai para a Home após guardar
    } catch (error: any) {
      Alert.alert("Erro ao guardar", error?.message || String(error));
    }
  };

  // Função auxiliar para criar as opções de rádio com círculo customizado
  const RenderOption = (label: string, value: string, state: string, setState: any) => (
    <Pressable style={styles.radioItem} onPress={() => setState(state === value ? '' : value)}>
      <View style={[styles.radioOuter, state === value && styles.radioOuterActive]}>
        {state === value && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Questões Sociodemográficas</Text>

      {/* GÉNERO */}
      <Text style={styles.sectionTitle}>Género</Text>
      {RenderOption("Feminino", "feminino", genero, setGenero)}
      {RenderOption("Masculino", "masculino", genero, setGenero)}
      {RenderOption("Prefiro Não Responder", "pnr", genero, setGenero)}
      {RenderOption("Outro", "outro", genero, setGenero)}
      {genero === 'outro' && (
        <TextInput style={styles.input} placeholderTextColor="#A15B2A" value={generoOutro} onChangeText={setGeneroOutro} placeholder="Especificar género" />
      )}

      {/* DATA NASCIMENTO */}
      <Text style={styles.sectionTitle}>Ano de Nascimento</Text>
      <TextInput 
        style={styles.input} 
        placeholderTextColor="#A15B2A"
        onChangeText={setAnoNascimento}
        keyboardType="numeric"
      />
      <Text style={styles.subText}>entre 1900 e 2010</Text>

      {/* IDADE (faixas) */}
      <Text style={styles.sectionTitle}>Idade</Text>
      {[
        { id: '18-29', label: '18 - 29' },
        { id: '30-59', label: '30 - 59' },
        { id: '60-120', label: '60 - 120' },
      ].map((opt) => (
        <React.Fragment key={opt.id}>{RenderOption(opt.label, opt.id, idade, setIdade)}</React.Fragment>
      ))}

      {/* GRAU ESCOLARIDADE (Exemplo resumido) */}
      <Text style={styles.sectionTitle}>Grau de Escolaridade</Text>
      {RenderOption("1º Ciclo do Ensino Básico", "1basico", escolaridade, setEscolaridade)}
      {RenderOption("2º Ciclo do Ensino Básico", "2basico", escolaridade, setEscolaridade)}
      {RenderOption("3º Ciclo do Ensino Básico", "3basico", escolaridade, setEscolaridade)}
      {RenderOption("Ensino Secundário", "secundario", escolaridade, setEscolaridade)}
      {RenderOption("Licenciatura/Bacharelato", "licenciatura", escolaridade, setEscolaridade)}
      {RenderOption("Mestrado", "mestrado", escolaridade, setEscolaridade)}
      {RenderOption("Doutoramento", "doutoramento", escolaridade, setEscolaridade)}
      {RenderOption("Não sei", "nsei", escolaridade, setEscolaridade)}
      {RenderOption("Prefiro não responder", "pnr", escolaridade, setEscolaridade)}
      {RenderOption("Outro", "outro", escolaridade, setEscolaridade)}
      {escolaridade === 'outro' && (
        <TextInput style={styles.input} placeholderTextColor="#A15B2A" value={escolaridadeOutro} onChangeText={setEscolaridadeOutro} placeholder="Especificar grau de escolaridade" />
      )}

      {/* MUNICIPIO */}
      <Text style={styles.sectionTitle}>Município de Residência</Text>
      <TextInput style={styles.input} placeholderTextColor="#A15B2A" onChangeText={setMunicipio} />

      {/* RESIDIU SEMPRE */}
      <Text style={styles.sectionTitle}>Residiu sempre neste município?</Text>
      {RenderOption("Sim", "sim", residiuSempre, setResidiuSempre)}
      {RenderOption("Não", "nao", residiuSempre, setResidiuSempre)}
      {RenderOption("Não sei", "nsei", residiuSempre, setResidiuSempre)}
      {RenderOption("Prefiro não responder", "pnr", residiuSempre, setResidiuSempre)}

      {/* MUNICIPIOS ANTERIORES (aparece só se residiuSempre === 'nao') */}
      {residiuSempre === 'nao' && (
        <>
          <Text style={styles.sectionTitle}>Em que municípios residiu anteriormente?</Text>
          <TextInput style={styles.input} placeholderTextColor="#A15B2A" value={municipiosAnteriores} onChangeText={setMunicipiosAnteriores} />
        </>
      )}

      {/* CONDIÇÃO MÉDICA */}
      <Text style={styles.sectionTitle}>Condição Médica</Text>
      {RenderOption("Excesso de peso/obesidade", "excesso", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Diabetes/pré-diabetes", "diabetes", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Níveis altos de colesterol/triglicerídeos", "colesterol", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Hipertensão arterial", "hipertensao", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Outra doença cardiovascular", "outra", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Dificuldade visual", "dificuldadeVisual", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Nenhuma das anteriores", "nenhuma", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Não sei", "nsei", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Prefiro não responder", "pnr", condicaoMedica, setCondicaoMedica)}
      {RenderOption("Outro", "outro", condicaoMedica, setCondicaoMedica)}
      {condicaoMedica === 'outro' && (
        <TextInput style={styles.input} placeholderTextColor="#A15B2A" value={condicaoMedicaOutro} onChangeText={setCondicaoMedicaOutro} placeholder="Especificar condição médica" />
      )}
      

      {/* PADRÃO ALIMENTAR */}
      <Text style={styles.sectionTitle}>Padrão Alimentar</Text>
      {RenderOption("Omnívoro", "omnivoro", padraoAlimentar, setPadraoAlimentar)}
      {RenderOption("Flexitariano", "flexitariano", padraoAlimentar, setPadraoAlimentar)}
      {RenderOption("Vegetariano/Vegano", "vegan", padraoAlimentar, setPadraoAlimentar)}
      {RenderOption("Não sei", "nsei", padraoAlimentar, setPadraoAlimentar)}
      {RenderOption("Prefiro não responder", "pnr", padraoAlimentar, setPadraoAlimentar)}
      {RenderOption("Outro", "outro", padraoAlimentar, setPadraoAlimentar)}
      {padraoAlimentar === 'outro' && (
        <TextInput style={styles.input} placeholderTextColor="#A15B2A" value={padraoAlimentarOutro} onChangeText={setPadraoAlimentarOutro} placeholder="Especificar padrão alimentar" />
      )}

      {/* BOTÃO GUARDAR */}
      <Pressable onPress={handleGuardar} style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}>
        <Text style={styles.submitButtonText}>Guardar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FCF8F5'},
  content: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 60, paddingBottom: 50, alignItems: 'stretch' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#6B3E1F', textAlign: 'center', marginBottom: 30 },
  sectionTitle: { fontSize: 20, color: '#7A4419', marginTop: 20, marginBottom: 10, fontWeight: '600' },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  radioLabel: { fontSize: 16, color: '#A15B2A' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#E28A47', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioOuterActive: { borderColor: '#E28A47' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E28A47' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E28A47', borderRadius: 15, padding: 10, fontSize: 16, color: '#6B3E1F' },
  subText: { fontSize: 12, color: '#7A4419', marginTop: 4, marginLeft: 5 },
  submitButton: { alignSelf: 'center', width: '50%', maxWidth: 360, height: 55, borderRadius: 14, backgroundColor: '#784115', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingHorizontal: 12, paddingVertical: 6 },
  submitButtonPressed: { opacity: 0.85 },
  submitButtonText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' }
});