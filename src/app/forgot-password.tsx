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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecovery = () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      Alert.alert(
        'Campo incompleto',
        'Ingresa tu correo electrónico.'
      );
      return;
    }

    if (!cleanEmail.includes('@')) {
      Alert.alert(
        'Correo inválido',
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      Alert.alert(
        'Solicitud enviada',
        'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.',
        [
          {
            text: 'Volver al inicio',
            onPress: () => router.replace('/'),
          },
        ]
      );
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.backText}>‹</Text>
            <Text style={styles.backLabel}>Volver</Text>
          </Pressable>

          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>

          <Text style={styles.title}>
            Recuperar contraseña
          </Text>

          <Text style={styles.description}>
            Ingresa tu correo electrónico y podrás
            solicitar la recuperación de tu contraseña.
          </Text>

          <Text style={styles.label}>
            Correo electrónico
          </Text>

          <TextInput
            style={styles.input}
            placeholder="ejemplo@correo.com"
            placeholderTextColor="#999999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Pressable
            style={[
              styles.button,
              loading && styles.disabledButton,
            ]}
            onPress={handleRecovery}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading
                ? 'Enviando...'
                : 'Enviar solicitud'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.loginButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.loginText}>
              Volver al inicio de sesión
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 70,
  },

  backText: {
    fontSize: 32,
    color: '#111111',
    marginRight: 6,
  },

  backLabel: {
    fontSize: 15,
    color: '#555555',
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 17,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },

  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#666666',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111111',
    backgroundColor: '#FAFAFA',
  },

  button: {
    height: 52,
    backgroundColor: '#E21B2D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  loginButton: {
    alignItems: 'center',
    marginTop: 20,
  },

  loginText: {
    color: '#E21B2D',
    fontSize: 14,
    fontWeight: '700',
  },
});