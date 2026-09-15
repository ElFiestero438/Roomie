import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.');
      return;
    }

    if (!cleanEmail.includes('@')) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener mínimo 6 caracteres.'
      );
      return;
    }

    // Por ahora no usamos Firebase.
    // Cualquier correo válido y contraseña de 6+ caracteres permite entrar.
    router.replace('/home');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>

          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>R</Text>
            </View>

            <Text style={styles.title}>Roomie</Text>

            <Text style={styles.subtitle}>
              Vivir juntos, organizarse mejor.
            </Text>
          </View>

          <View style={styles.form}>

            <Text style={styles.label}>Correo electrónico</Text>

            <TextInput
              style={styles.input}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Contraseña</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Ingresa tu contraseña"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.showButton}
              >
                <Text style={styles.showText}>
                  {showPassword ? 'Ocultar' : 'Ver'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              onPress={handleLogin}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>
                Iniciar sesión
              </Text>
            </Pressable>

          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 45,
  },

  logo: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 38,
    fontWeight: '800',
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111111',
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 6,
  },

  form: {
    width: '100%',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
  },

  showButton: {
    paddingHorizontal: 14,
  },

  showText: {
    color: '#E21B2D',
    fontWeight: '600',
  },

  loginButton: {
    height: 52,
    backgroundColor: '#E21B2D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});