import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert } from 'react-native';
import { auth } from '../src/firebase'; 
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === '' || password === '') {
      Alert.alert("Erro", "Por favor, preenche todos os campos.");
      return;
    }

    // Lógica real de Login do Firebase
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Login com sucesso!
        console.log("Logado com:", userCredential.user.email);
        navigation.navigate('AR'); // Nome da rota para a câmara
      })
      .catch((error) => {
        // Erro (Ex: senha errada ou utilizador não existe)
        Alert.alert("Erro no Login", "Email ou palavra-passe incorretos.");
        console.error(error.code);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      
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
        secureTextEntry
        placeholderTextColor="#999"
      />

      {/* Botão de Entrar agora chama a função handleLogin */}
      <View style={styles.buttonContainer}>
        <Button title="Entrar" color="#2563eb" onPress={handleLogin} />
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          title="Criar Conta" 
          color="#10B981" 
          onPress={() => navigation.navigate('Register')} 
        />
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
    borderRadius: 8,
    overflow: 'hidden', 
  }
});