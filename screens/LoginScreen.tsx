import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth } from '../src/firebase';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert('Erro', 'Por favor, preenche todos os campos.');
      return;
    }

    try {
      setIsSubmitting(true);
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      console.log('Logado com:', userCredential.user.email);
      navigation.navigate('Start');
    } catch (error: any) {
      console.error('Login erro code:', error?.code);
      console.error('Login erro message:', error?.message);

      if (error?.code === 'auth/user-not-found') {
        Alert.alert('Erro no Login', 'Utilizador não encontrado. Cria uma conta primeiro.');
        return;
      }

      if (error?.code === 'auth/wrong-password') {
        Alert.alert('Erro no Login', 'Palavra-passe incorreta.');
        return;
      }

      if (error?.code === 'auth/invalid-email') {
        Alert.alert('Erro no Login', 'Email inválido.');
        return;
      }

      Alert.alert('Erro no Login', error?.message ?? 'Email ou palavra-passe incorretos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          nestedScrollEnabled
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Iniciar Sessão</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email"
                placeholderTextColor="#7C8596"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Palavra-passe</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="palavra-passe"
                  placeholderTextColor="#7C8596"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.passwordInput}
                />
                <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.eyeButton}>
                  <Text style={styles.eyeText}>{showPassword ? 'Ocultar' : 'Ver'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleLogin}
              disabled={isSubmitting}
              style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'A entrar...' : 'Inicie Sessão'}</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('Register')} style={styles.registerLinkButton}>
            <Text style={styles.registerLinkText}>Ainda não tem conta? Registe-se</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF8F1',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBlock: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  kicker: {
    color: '#E28A47',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#6B3E1F',
    fontSize: 34,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#8A5A3C',
    fontSize: 15,
    lineHeight: 22,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2D7BF',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: '#A15B2A',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFCF8',
    borderWidth: 1,
    borderColor: '#F0D7BD',
    color: '#6B3E1F',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFCF8',
    borderWidth: 1,
    borderColor: '#F0D7BD',
    borderRadius: 18,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    color: '#6B3E1F',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  eyeText: {
    color: '#784115',
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 6,
    backgroundColor: '#784115',
    borderRadius: 18,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  registerLinkButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  registerLinkText: {
    color: '#784115',
    fontSize: 13,
    fontWeight: '600',
  },
});