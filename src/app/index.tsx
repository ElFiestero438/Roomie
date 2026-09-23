
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  getSession,
  saveSession,
} from '../constants/storage';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await getSession();

      if (session?.isLoggedIn) {
        router.replace('/home');
      }
    } catch (error) {
      console.log('Error al comprobar sesión:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setErrorMessage('');

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setErrorMessage('Introduce tu correo electrónico.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      setErrorMessage('Introduce un correo electrónico válido.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Introduce tu contraseña.');
      return;
    }

    if (password.length < 4) {
      setErrorMessage(
        'La contraseña debe tener al menos 4 caracteres.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      await saveSession(cleanEmail);

      router.replace('/home');
    } catch (error) {
      setErrorMessage(
        'No se pudo iniciar sesión. Inténtalo nuevamente.'
      );
      console.log('Error al iniciar sesión:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E21B2D" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>ROOMIE</Text>
          <Text style={styles.subtitle}>
            Organiza tu hogar de forma sencilla
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Iniciar sesión</Text>

          <Text style={styles.label}>Correo electrónico</Text>

          <TextInput
            style={[
              styles.input,
              errorMessage && !email.trim()
                ? styles.inputError
                : null,
            ]}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#999999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrorMessage('');
            }}
          />

          <Text style={styles.label}>Contraseña</Text>

          <TextInput
            style={[
              styles.input,
              errorMessage && !password.trim()
                ? styles.inputError
                : null,
            ]}
            placeholder="Introduce tu contraseña"
            placeholderTextColor="#999999"
            secureTextEntry
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrorMessage('');
            }}
          />

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[
              styles.loginButton,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>
                Iniciar sesión
              </Text>
            )}
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.secondaryButtonText}>
              Crear cuenta
            </Text>
          </Pressable>

          <Pressable
            style={styles.forgotButton}
            onPress={() => router.push('/forgot-password')}
          >
            <Text style={styles.forgotText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </Pressable>

          <Text style={styles.localModeText}>
            Modo local de prueba
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E21B2D',
    letterSpacing: 2,
  },

  subtitle: {
    fontSize: 14,
    color: '#777777',
    marginTop: 8,
    textAlign: 'center',
  },

  formContainer: {
    width: '100%',
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E1E1E',
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 14,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E1E1E',
    backgroundColor: '#FFFFFF',
  },

  inputError: {
    borderColor: '#E21B2D',
  },

  errorContainer: {
    backgroundColor: '#FCE8EA',
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },

  errorText: {
    color: '#C62828',
    fontSize: 13,
    lineHeight: 19,
  },

  loginButton: {
    height: 52,
    backgroundColor: '#E21B2D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    height: 52,
    borderWidth: 1,
    borderColor: '#E21B2D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  secondaryButtonText: {
    color: '#E21B2D',
    fontSize: 16,
    fontWeight: '600',
  },

  forgotButton: {
    alignItems: 'center',
    marginTop: 20,
  },

  forgotText: {
    color: '#E21B2D',
    fontSize: 14,
    fontWeight: '500',
  },

  localModeText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 12,
    marginTop: 28,
  },
});