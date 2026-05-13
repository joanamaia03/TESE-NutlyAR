import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, Pressable } from 'react-native';
import { auth, db } from '../src/firebase'; 
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterScreen({ navigation }: any) {
  const [nome, setNome] = useState(''); // Novo campo para o nome
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    // 1. Validações básicas
    if (!nome || !email || !password) {
      Alert.alert("Erro", "Preenche todos os campos!");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Erro", "A palavra-passe tem de ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Erro", "As palavras-passe não coincidem!");
      return;
    }

    try {
      // 2. Criar utilizador no Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 3. Criar documento no Firestore AUTOMATICAMENTE
      // Usamos o UID do utilizador para que o perfil fique ligado ao login
      await setDoc(doc(db, "usuarios", user.uid), {
        nome: nome,
        email: email,
        dataCriacao: new Date().toISOString()
      });

      Alert.alert("Sucesso!", "Conta criada com sucesso.");
      navigation.navigate('Login');
      
    } catch (error: any) {
      if (error?.code === 'auth/weak-password') {
        Alert.alert("Erro no Registo", "A palavra-passe tem de ter pelo menos 6 caracteres.");
        return;
      }

      if (error?.code === 'auth/email-already-in-use') {
        Alert.alert("Erro no Registo", "Esse email já está a ser usado.");
        return;
      }

      Alert.alert("Erro no Registo", error?.message ?? "Não foi possível criar a conta.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>

      {/* Adicionei o campo de Nome para a tua base de dados */}
      <TextInput
        style={styles.input}
        placeholder="Nome Completo"
        value={nome}
        onChangeText={setNome}
        placeholderTextColor="#999"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#999"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Palavra-passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        placeholderTextColor="#999"
      />
      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>{showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}</Text>
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder="Confirmar Palavra-passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!showConfirmPassword}
        placeholderTextColor="#999"
      />
      <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>{showConfirmPassword ? 'Ocultar confirmação' : 'Mostrar confirmação'}</Text>
      </Pressable>

      <View style={styles.buttonContainer}>
        <Button title="Registar" color="#10B981" onPress={handleRegister} />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Voltar" color="#666" onPress={() => navigation.goBack()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#050608',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#fff',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#222838',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#10131a',
    color: '#fff',
  },
  buttonContainer: {
    marginBottom: 10,
  },
  toggleButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    paddingVertical: 4,
  },
  toggleButtonText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  }
});