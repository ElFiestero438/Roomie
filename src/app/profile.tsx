import { router, useFocusEffect } from 'expo-router';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomNav } from '../components/bottom-nav';
import { colors } from '../constants/colors';
import {
  getFirebaseErrorMessage,
  logoutUser,
  resetPassword,
} from '../firebase/auth';
import { auth, db } from '../firebase/config';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile,
} from '../firebase/firestore';
import { useAuthUser } from '../hooks/useAuthUser';

type Message = {
  type: 'success' | 'error';
  text: string;
};

export default function ProfileScreen() {
  const { user, loading: authLoading } = useAuthUser();
  const uid = user?.uid;
  const email = user?.email ?? '';
  const displayName = user?.displayName ?? '';

  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [message, setMessage] = useState<Message | null>(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const provider: 'email' | 'google' = user?.providerData.some(
    (item) => item.providerId === 'google.com'
  )
    ? 'google'
    : 'email';

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [authLoading, user]);

  useFocusEffect(
    useCallback(() => {
      if (!uid) {
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);
      setMessage(null);

      getUserProfile(uid)
        .then(async (profile) => {
          if (!active) return;

          // Si el usuario entró con Google y aún no tiene perfil, se crea vacío.
          if (!profile) {
            await createUserProfile(
              uid,
              displayName,
              email,
              user?.photoURL ?? null,
              provider
            );
          }

          const currentName = profile?.name || displayName;
          const extra = profile as { notificationsEnabled?: boolean } | null;

          setName(currentName);
          setSavedName(currentName);
          setNotifications(extra?.notificationsEnabled ?? true);
        })
        .catch((error) => {
          if (!active) return;
          setMessage({
            type: 'error',
            text: getFirebaseErrorMessage(error),
          });
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid, displayName])
  );

  const saveProfile = async () => {
    const cleanName = name.trim();
    setMessage(null);

    if (!cleanName) {
      setMessage({ type: 'error', text: 'El nombre no puede estar vacío.' });
      return;
    }

    if (!uid || !auth.currentUser) return;

    try {
      setSaving(true);

      await updateProfile(auth.currentUser, { displayName: cleanName });

      const profile = await getUserProfile(uid);

      if (profile) {
        await updateUserProfile(uid, { name: cleanName });
      } else {
        await createUserProfile(
          uid,
          cleanName,
          email,
          user?.photoURL ?? null,
          provider
        );
      }

      setName(cleanName);
      setSavedName(cleanName);
      setEditing(false);
      setMessage({ type: 'success', text: 'Tu perfil se guardó correctamente.' });
    } catch (error) {
      setMessage({ type: 'error', text: getFirebaseErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setName(savedName);
    setEditing(false);
    setMessage(null);
  };

  const toggleNotifications = async (value: boolean) => {
    if (!uid) return;

    setNotifications(value);

    try {
      await setDoc(
        doc(db, 'users', uid),
        { notificationsEnabled: value },
        { merge: true }
      );
    } catch (error) {
      setNotifications(!value);
      setMessage({ type: 'error', text: getFirebaseErrorMessage(error) });
    }
  };

  const handleResetPassword = async () => {
    setMessage(null);

    if (provider === 'google') {
      setMessage({
        type: 'error',
        text: 'Entraste con Google. Tu contraseña se administra desde tu cuenta de Google.',
      });
      return;
    }

    try {
      await resetPassword(email);
      setMessage({
        type: 'success',
        text: `Te enviamos un correo a ${email} para cambiar tu contraseña.`,
      });
    } catch (error) {
      setMessage({ type: 'error', text: getFirebaseErrorMessage(error) });
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logoutUser();
      setLogoutVisible(false);
      router.replace('/');
    } catch (error) {
      setLogoutVisible(false);
      setMessage({ type: 'error', text: getFirebaseErrorMessage(error) });
    } finally {
      setLoggingOut(false);
    }
  };

  const initial = (savedName || email || '?').charAt(0).toUpperCase();

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tu perfil...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View>
            <Text style={styles.title}>Perfil</Text>
            <Text style={styles.subtitle}>Administra tu cuenta</Text>
          </View>
        </View>

        <View style={styles.avatarCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>

          <Text style={styles.userName}>{savedName || 'Sin nombre'}</Text>
          <Text style={styles.userEmail}>{email}</Text>

          <View style={styles.providerBadge}>
            <Text style={styles.providerText}>
              {provider === 'google' ? 'Cuenta de Google' : 'Cuenta con correo'}
            </Text>
          </View>
        </View>

        {message ? (
          <View
            style={[
              styles.messageBox,
              message.type === 'success'
                ? styles.messageSuccess
                : styles.messageError,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                message.type === 'success'
                  ? styles.messageTextSuccess
                  : styles.messageTextError,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Datos personales</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={[styles.input, !editing && styles.inputDisabled]}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setMessage(null);
            }}
            editable={editing}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={email}
            editable={false}
          />

          {editing ? (
            <View style={styles.row}>
              <Pressable
                style={[styles.outlineButton, styles.flex]}
                onPress={cancelEdit}
                disabled={saving}
              >
                <Text style={styles.outlineButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryButton,
                  styles.flex,
                  saving && styles.disabled,
                ]}
                onPress={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>Guardar</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={styles.primaryButton}
              onPress={() => {
                setEditing(true);
                setMessage(null);
              }}
            >
              <Text style={styles.primaryButtonText}>Editar nombre</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Preferencias</Text>

          <View style={styles.settingRow}>
            <View style={styles.flex}>
              <Text style={styles.settingTitle}>Notificaciones</Text>
              <Text style={styles.settingText}>
                Recibe avisos de gastos, tareas y compras
              </Text>
            </View>

            <Switch
              value={notifications}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notifications ? colors.primary : colors.surface}
            />
          </View>

          <Pressable
            style={styles.settingRow}
            onPress={() => router.push('/notifications')}
          >
            <Text style={styles.settingTitle}>Ver notificaciones</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Seguridad</Text>

          <Pressable style={styles.settingRow} onPress={handleResetPassword}>
            <Text style={styles.settingTitle}>Cambiar contraseña</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={() => setLogoutVisible(true)}
        >
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>

            <BottomNav active="profile" />

      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalText}>
              ¿Seguro que quieres salir? Tu información queda guardada en tu
              cuenta.
            </Text>

            <View style={styles.row}>
              <Pressable
                style={[styles.outlineButton, styles.flex]}
                onPress={() => setLogoutVisible(false)}
                disabled={loggingOut}
              >
                <Text style={styles.outlineButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.primaryButton,
                  styles.flex,
                  loggingOut && styles.disabled,
                ]}
                onPress={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={styles.primaryButtonText}>Salir</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    padding: 20,
    paddingBottom: 100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  backText: {
    fontSize: 28,
    color: colors.primary,
    marginTop: -3,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
  },

  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },

  avatarCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },

  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.surface,
  },

  userName: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.surface,
    marginTop: 14,
  },

  userEmail: {
    fontSize: 14,
    color: '#D0D0D0',
    marginTop: 4,
  },

  providerBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 12,
  },

  providerText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  messageBox: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  messageSuccess: {
    backgroundColor: '#E7F5EC',
  },

  messageError: {
    backgroundColor: colors.primaryLight,
  },

  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },

  messageTextSuccess: {
    color: colors.success,
  },

  messageTextError: {
    color: '#C62828',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 12,
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },

  inputDisabled: {
    backgroundColor: colors.inputBackground,
    color: colors.textSecondary,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },

  flex: {
    flex: 1,
  },

  primaryButton: {
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
  },

  outlineButton: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },

  disabled: {
    opacity: 0.7,
  },

  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },

  settingText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },

  chevron: {
    fontSize: 24,
    color: colors.primary,
  },

  logoutButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingVertical: 15,
  },

  navItem: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },

  navItemActive: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },

  navItemText: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },

  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 22,
    borderTopWidth: 5,
    borderTopColor: colors.primary,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },

  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
    marginTop: 10,
  },
});