import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Alert } from '../components/app-alert';

import {
  getFirebaseErrorMessage,
  resetPassword,
} from '../firebase/auth';

import { colors } from '../constants/colors';
import { sharedStyles } from '../constants/styles';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecovery = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert(
        'Campo incompleto',
        'Ingresa tu correo electrónico.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert(
        'Correo inválido',
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    try {
      setLoading(true);

      await resetPassword(cleanEmail);

      Alert.alert(
        'Revisa tu correo',
        'Si existe una cuenta asociada a ese correo, Firebase enviará instrucciones para restablecer la contraseña. Revisa también la carpeta de spam.',
        [
          {
            text: 'Volver al inicio',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'No se pudo enviar el correo',
        getFirebaseErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[sharedStyles.screen, styles.container]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.content}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/')}
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
          >
            <Text style={styles.backArrow}>‹</Text>

            <Text style={sharedStyles.textButtonText}>
              Volver
            </Text>
          </Pressable>

          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>

          <Text style={[sharedStyles.title, styles.title]}>
            Recuperar contraseña
          </Text>

          <Text style={[sharedStyles.subtitle, styles.description]}>
            Ingresa tu correo electrónico para solicitar la recuperación
            de tu contraseña.
          </Text>

          <View style={styles.form}>
            <Text style={sharedStyles.inputLabel}>
              Correo electrónico
            </Text>

            <TextInput
              style={sharedStyles.input}
              placeholder="ejemplo@correo.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
              returnKeyType="send"
              onSubmitEditing={handleRecovery}
              accessibilityLabel="Correo electrónico"
            />

            <Pressable
              style={[
                sharedStyles.primaryButton,
                styles.submitButton,
                loading && styles.disabledButton,
              ]}
              onPress={handleRecovery}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={sharedStyles.primaryButtonText}>
                  Enviar instrucciones
                </Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.helpText}>
            Si no recibes el correo, revisa la carpeta de spam y verifica
            que hayas escrito correctamente tu dirección.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboard: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 44,
    gap: 8,
    marginBottom: 36,
  },

  backArrow: {
    fontSize: 32,
    lineHeight: 36,
    color: colors.text,
  },

  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },

  logoText: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.surface,
  },

  title: {
    textAlign: 'center',
    marginBottom: 12,
  },

  description: {
    textAlign: 'center',
    marginBottom: 32,
  },

  form: {
    width: '100%',
    gap: 12,
  },

  submitButton: {
    marginTop: 12,
  },

  disabledButton: {
    opacity: 0.65,
  },

  helpText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 24,
  },
});