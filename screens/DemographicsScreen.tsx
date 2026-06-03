import React, { useLayoutEffect, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TextInput, Pressable, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
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

  // Estados para as escolhas simples (Radio Buttons)
  const [genero, setGenero] = useState('');
  const [generoOutro, setGeneroOutro] = useState('');
  const [idade, setIdade] = useState('');
  const [escolaridade, setEscolaridade] = useState('');
  const [escolaridadeOutro, setEscolaridadeOutro] = useState('');
  const [residiuSempre, setResidiuSempre] = useState('');
  const [padraoAlimentar, setPadraoAlimentar] = useState('');
  const [padraoAlimentarOutro, setPadraoAlimentarOutro] = useState('');

  // Multi-seleção para Condição Médica
  const [condicoesMedicas, setCondicoesMedicas] = useState<string[]>([]);
  const [condicaoMedicaOutro, setCondicaoMedicaOutro] = useState('');

  const medicalOptions = [
    'Excesso de peso/obesidade',
    'Diabetes/pré-diabetes',
    'Níveis altos de colesterol/triglicerídeos',
    'Hipertensão arterial',
    'Outra doença cardiovascular',
    'Dificuldade visual',
    'Nenhuma das anteriores',
    'Não sei',
    'Prefiro não responder',
    'Outro',
  ];

  const toggleCondicaoMedica = (option: string) => {
    if (option === 'Nenhuma das anteriores') {
      setCondicoesMedicas(['Nenhuma das anteriores']);
      setCondicaoMedicaOutro('');
      return;
    }

    if (condicoesMedicas.includes('Nenhuma das anteriores')) {
      setCondicoesMedicas([]);
    }

    setCondicoesMedicas(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  // Validação
  const validarCamposObrigatorios = () => {
    const faltam: string[] = [];

    if (!genero) faltam.push('Género');
    if (genero === 'outro' && !generoOutro) faltam.push('Especificar género');

    if (!anoNascimento) faltam.push('Ano de Nascimento');
    if (!idade) faltam.push('Idade');

    if (!escolaridade) faltam.push('Grau de Escolaridade');
    if (escolaridade === 'outro' && !escolaridadeOutro) faltam.push('Especificar grau de escolaridade');

    if (!municipio) faltam.push('Município de Residência');

    if (!residiuSempre) faltam.push('Residiu sempre neste município?');
    if (residiuSempre === 'nao' && !municipiosAnteriores) faltam.push('Municípios anteriores');

    if (condicoesMedicas.length === 0) faltam.push('Condição Médica');
    if (condicoesMedicas.includes('Outro') && !condicaoMedicaOutro) faltam.push('Especificar condição médica');

    if (!padraoAlimentar) faltam.push('Padrão Alimentar');
    if (padraoAlimentar === 'outro' && !padraoAlimentarOutro) faltam.push('Especificar padrão alimentar');

    return faltam;
  };

  const handleGuardar = async () => {
  const user = auth.currentUser;
  if (!user) {
    Alert.alert("Erro", "Precisas de estar com a sessão iniciada!");
    return;
  }

  const faltam = validarCamposObrigatorios();
  if (faltam.length > 0) {
    Alert.alert('Preenchimento incompleto', 'Por favor responde às seguintes perguntas:\n' + faltam.join('\n'));
    return;
  }

  // Tratamento do array de condições médicas
  let resolvedCondicaoMedica: string[] = [...condicoesMedicas];

  if (condicoesMedicas.includes('Outro') && condicaoMedicaOutro.trim()) {
    resolvedCondicaoMedica = [
      ...condicoesMedicas.filter(c => c !== 'Outro'),
      `Outro: ${condicaoMedicaOutro.trim()}`
    ];
  }

  const resolvedGenero = genero === 'outro' ? generoOutro : genero;
  const resolvedEscolaridade = escolaridade === 'outro' ? escolaridadeOutro : escolaridade;
  const resolvedPadraoAlimentar = padraoAlimentar === 'outro' ? padraoAlimentarOutro : padraoAlimentar;

  const dadosSociodemograficos = {
    genero: resolvedGenero,
    dataNascimento: anoNascimento,
    grupoIdade: idade,
    grauEscolaridade: resolvedEscolaridade,
    municipioResidencia: municipio,
    residiuSempreNesteMunicipio: residiuSempre,
    municipiosAnteriores,
    condicaoMedica: resolvedCondicaoMedica,        // ← Array
    padraoAlimentar: resolvedPadraoAlimentar,
  };

  try {
    // 1. Guarda na coleção "demographics"
    const demoRef = doc(db, "demographics", user.uid);
    await setDoc(demoRef, {
      userId: user.uid,
      dadosSociodemograficos,
      ultimaAtualizacao: new Date().toISOString()
    }, { merge: true });

    console.log("✅ Guardado em 'demographics'");

    // 2. Guarda na coleção "utilizadores"
    const userRef = doc(db, "utilizadores", user.uid);
    await setDoc(userRef, {
      perfilCompleto: true,
      dadosSociodemograficos,
      ultimaAtualizacao: new Date().toISOString()
    }, { merge: true });

    console.log("✅ Guardado em 'utilizadores'");

    Alert.alert("Sucesso", "Dados guardados com sucesso em ambas as coleções!");
    navigation.navigate('Home');
  } catch (error: any) {
    console.error("Erro ao guardar:", error);
    Alert.alert("Erro ao guardar", error?.message || String(error));
  }
};

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
        <TextInput style={styles.input} placeholderTextColor="#c0c0c0" value={generoOutro} onChangeText={setGeneroOutro} placeholder="Especificar género" />
      )}

      {/* ANO DE NASCIMENTO */}
      <Text style={styles.sectionTitle}>Ano de Nascimento</Text>
      <TextInput
        style={styles.input}
        placeholder="Escreva aqui o ano de nascimento"
        placeholderTextColor="#c0c0c0"
        onChangeText={setAnoNascimento}
        keyboardType="numeric"
      />

      {/* IDADE */}
      <Text style={styles.sectionTitle}>Idade</Text>
      {[
        { id: '18-29', label: '18 - 29' },
        { id: '30-59', label: '30 - 59' },
        { id: '60-120', label: '60 - 120' },
      ].map((opt) => (
        <React.Fragment key={opt.id}>
          {RenderOption(opt.label, opt.id, idade, setIdade)}
        </React.Fragment>
      ))}

      {/* GRAU DE ESCOLARIDADE */}
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
        <TextInput style={styles.input} placeholderTextColor="#c0c0c0" value={escolaridadeOutro} onChangeText={setEscolaridadeOutro} placeholder="Especificar grau de escolaridade" />
      )}

      {/* MUNICÍPIO */}
      <Text style={styles.sectionTitle}>Município de Residência</Text>
      <TextInput style={styles.input} placeholder="Escreva aqui o município de residência" placeholderTextColor="#c0c0c0" onChangeText={setMunicipio} />

      {/* RESIDIU SEMPRE */}
      <Text style={styles.sectionTitle}>Residiu sempre neste município?</Text>
      {RenderOption("Sim", "sim", residiuSempre, setResidiuSempre)}
      {RenderOption("Não", "nao", residiuSempre, setResidiuSempre)}
      {RenderOption("Não sei", "nsei", residiuSempre, setResidiuSempre)}
      {RenderOption("Prefiro não responder", "pnr", residiuSempre, setResidiuSempre)}

      {residiuSempre === 'nao' && (
        <>
          <Text style={styles.sectionTitle}>Em que municípios residiu anteriormente?</Text>
          <TextInput style={styles.input} placeholder="Escreva aqui..." placeholderTextColor="#c0c0c0" value={municipiosAnteriores} onChangeText={setMunicipiosAnteriores} />
        </>
      )}

      {/* CONDIÇÃO MÉDICA - MULTIPLA ESCOLHA */}
      <Text style={styles.sectionTitle}>Condição Médica</Text>

      {medicalOptions.map((option) => (
        <Pressable
          key={option}
          style={styles.checkboxItem}
          onPress={() => toggleCondicaoMedica(option)}
        >
          <Icon
            name={condicoesMedicas.includes(option) ? "checkbox-marked" : "checkbox-blank-outline"}
            size={26}
            color={condicoesMedicas.includes(option) ? "#81B29A" : "#FFCDA6"}
          />
          <Text style={styles.checkboxLabel}>{option}</Text>
        </Pressable>
      ))}

      {condicoesMedicas.includes('Outro') && (
        <TextInput
          style={styles.input}
          placeholderTextColor="#c0c0c0"
          value={condicaoMedicaOutro}
          onChangeText={setCondicaoMedicaOutro}
          placeholder="Especificar condição médica"
        />
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
        <TextInput style={styles.input} placeholderTextColor="#c0c0c0" value={padraoAlimentarOutro} onChangeText={setPadraoAlimentarOutro} placeholder="Especificar padrão alimentar" />
      )}

      <Pressable onPress={handleGuardar} style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}>
        <Text style={styles.submitButtonText}>Guardar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F1'},
  content: { flexGrow: 1, paddingHorizontal: 25, paddingTop: 60, paddingBottom: 50, alignItems: 'stretch' },
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#709985', textAlign: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, color: '#4b4b4b', marginTop: 20, marginBottom: 10, fontWeight: '600' },
  radioItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  radioLabel: { fontSize: 16, color: '#4b4b4b' },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#FFCDA6', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  radioOuterActive: { borderColor: '#81B29A' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#81B29A' },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFCDA6', borderRadius: 15, padding: 10, fontSize: 16, color: '#4b4b4b' },
  subText: { fontSize: 12, color: '#4b4b4b', marginTop: 4, marginLeft: 5 },
  submitButton: { alignSelf: 'center', width: '50%', maxWidth: 360, height: 55, borderRadius: 14, backgroundColor: '#81B29A', alignItems: 'center', justifyContent: 'center', marginTop: 24, paddingHorizontal: 12, paddingVertical: 6 },
  submitButtonPressed: { opacity: 0.85 },
  submitButtonText: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  checkboxItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, paddingVertical: 4}, 
  checkboxLabel: { fontSize: 16, color: '#4b4b4b', marginLeft: 10 },
});