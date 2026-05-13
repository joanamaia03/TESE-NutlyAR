import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, Pressable } from 'react-native';
import { auth } from '../src/firebase'; 
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
        navigation.navigate('ARScreen'); // Nome da rota para a câmara
      })
      .catch((error) => {
        // Erro detalhado
        console.error("Login erro code:", error.code);
        console.error("Login erro message:", error.message);

        if (error.code === 'auth/user-not-found') {
          Alert.alert("Erro no Login", "Utilizador não encontrado. Cria uma conta primeiro.");
        } else if (error.code === 'auth/wrong-password') {
          Alert.alert("Erro no Login", "Palavra-passe incorreta.");
        } else if (error.code === 'auth/invalid-email') {
          Alert.alert("Erro no Login", "Email inválido.");
        } else {
          Alert.alert("Erro no Login", error.message || "Email ou palavra-passe incorretos.");
        }
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
        secureTextEntry={!showPassword}
        placeholderTextColor="#999"
      />

      <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.toggleButton}>
        <Text style={styles.toggleButtonText}>
          {showPassword ? 'Ocultar palavra-passe' : 'Mostrar palavra-passe'}
        </Text>
      </Pressable>

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
  toggleButton: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    paddingVertical: 4,
  },
  toggleButtonText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '600',
  },
  buttonContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden', 
  }
});