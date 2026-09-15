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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const handleRegister = () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    if (
      !cleanName ||
      !cleanEmail ||
      !cleanPassword ||
      !cleanConfirmPassword
    ) {
      Alert.alert(
        'Campos incompletos',
        'Completa todos los campos.'
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

    if (cleanPassword.length < 6) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener mínimo 6 caracteres.'
      );
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      Alert.alert(
        'Contraseñas diferentes',
        'Las contraseñas no coinciden.'
      );
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      Alert.alert(
        'Cuenta creada',
        'Tu cuenta se ha creado correctamente.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              router.replace('/');
            },
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
            Crear cuenta
          </Text>

          <Text style={styles.subtitle}>
            Regístrate para comenzar a utilizar Roomie.
          </Text>

          <View style={styles.form}>
            <Text style={styles.label}>
              Nombre completo
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#999999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

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

            <Text style={styles.label}>
              Contraseña
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#999999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />

              <Pressable
                style={styles.showButton}
                onPress={() =>
                  setShowPassword(!showPassword)
                }
              >
                <Text style={styles.showText}>
                  {showPassword ? 'Ocultar' : 'Ver'}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.label}>
              Confirmar contraseña
            </Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#999999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />

              <Pressable
                style={styles.showButton}
                onPress={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
              >
                <Text style={styles.showText}>
                  {showConfirmPassword
                    ? 'Ocultar'
                    : 'Ver'}
                </Text>
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.registerButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading
                  ? 'Creando cuenta...'
                  : 'Registrarse'}
              </Text>
            </Pressable>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>
                ¿Ya tienes una cuenta?
              </Text>

              <Pressable
                onPress={() => router.replace('/')}
              >
                <Text style={styles.loginLink}>
                  Iniciar sesión
                </Text>
              </Pressable>
            </View>
          </View>
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
    marginBottom: 20,
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
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 12,
  },

  logoText: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111111',
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 25,
  },

  form: {
    width: '100%',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#222222',
    marginBottom: 7,
    marginTop: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#111111',
    backgroundColor: '#FAFAFA',
  },

  passwordContainer: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },

  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#111111',
  },

  showButton: {
    paddingHorizontal: 14,
  },

  showText: {
    color: '#E21B2D',
    fontWeight: '700',
  },

  registerButton: {
    height: 50,
    backgroundColor: '#E21B2D',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },

  disabledButton: {
    opacity: 0.6,
  },

  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 5,
  },

  loginText: {
    color: '#666666',
    fontSize: 14,
  },

  loginLink: {
    color: '#E21B2D',
    fontSize: 14,
    fontWeight: '700',
  },
});