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
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { auth, db } from '../src/firebase';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    if (!cleanUsername || !cleanEmail || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A palavra-passe tem de ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As palavras-passe não coincidem.');
      return;
    }

    try {
      setIsSubmitting(true);

      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: cleanUsername,
      });

      await setDoc(doc(db, 'utilizadores', user.uid), {
        username: cleanUsername,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Sucesso', 'Conta criada com sucesso.');
      navigation.navigate('Login');
    } catch (error: any) {
      if (error?.code === 'auth/weak-password') {
        Alert.alert('Erro no Registo', 'A palavra-passe tem de ter pelo menos 6 caracteres.');
        return;
      }

      if (error?.code === 'auth/email-already-in-use') {
        Alert.alert('Erro no Registo', 'O endereço de email já está a ser utilizado.');
        return;
      }

      Alert.alert('Erro no Registo', error?.message ?? 'Não foi possível criar a conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          nestedScrollEnabled
        >
          <View style={styles.headerBlock}>
            <Text style={styles.title}>Criar Conta</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.field}>
              <Text style={styles.label}>Nome de utilizador</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="nome de utilizador"
                placeholderTextColor="#8c8e91"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email"
                placeholderTextColor="#8c8e91"
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
                  placeholderTextColor="#8c8e91"
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

            <View style={styles.field}>
              <Text style={styles.label}>Confirmar palavra-passe</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="confirmar palavra-passe"
                  placeholderTextColor="#8c8e91"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.passwordInput}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((current) => !current)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? 'Ocultar' : 'Ver'}</Text>
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleRegister}
              disabled={isSubmitting}
              style={({ pressed }) => [styles.submitButton, pressed && styles.submitButtonPressed]}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? 'A criar...' : 'Registe-se'}</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => navigation.navigate('Login')} style={styles.loginLinkButton}>
            <Text style={styles.loginLinkText}>Já tem conta? Inicie sessão</Text>
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
    paddingBottom: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
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
  loginLinkButton: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  loginLinkText: {
    color: '#784115',
    fontSize: 13,
    fontWeight: '600',
  },
});