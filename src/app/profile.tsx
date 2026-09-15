import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function ProfileScreen() {
  const [name, setName] = useState('Sebastián');
  const [email, setEmail] = useState('sebastian@correo.com');
  const [editing, setEditing] = useState(false);
  const [notifications, setNotifications] = useState(true);

  const saveProfile = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Error', 'Ingresa un correo válido.');
      return;
    }

    setEditing(false);

    Alert.alert(
      'Perfil actualizado',
      'Tus datos se actualizaron correctamente.'
    );
  };

  const logout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: () => router.replace('/'),
        },
      ]
    );
  };

  const showComingSoon = (section: string) => {
    Alert.alert(
      section,
      'Esta función estará disponible en la siguiente etapa de Roomie.'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>‹</Text>
        </Pressable>

        <Text style={styles.headerTitle}>Mi perfil</Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.profileName}>{name}</Text>

          <Text style={styles.profileEmail}>{email}</Text>

          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>Administrador</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Información personal
          </Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Nombre</Text>

            <TextInput
              style={[
                styles.input,
                !editing && styles.inputDisabled,
              ]}
              value={name}
              onChangeText={setName}
              editable={editing}
              placeholder="Tu nombre"
              placeholderTextColor="#999999"
            />

            <Text style={styles.label}>Correo electrónico</Text>

            <TextInput
              style={[
                styles.input,
                !editing && styles.inputDisabled,
              ]}
              value={email}
              onChangeText={setEmail}
              editable={editing}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#999999"
            />

            {editing ? (
              <View style={styles.editButtons}>
                <Pressable
                  style={styles.cancelButton}
                  onPress={() => {
                    setEditing(false);
                    setName('Sebastián');
                    setEmail('sebastian@correo.com');
                  }}
                >
                  <Text style={styles.cancelButtonText}>
                    Cancelar
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.saveButton}
                  onPress={saveProfile}
                >
                  <Text style={styles.saveButtonText}>
                    Guardar
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                style={styles.editButton}
                onPress={() => setEditing(true)}
              >
                <Text style={styles.editButtonText}>
                  Editar información
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferencias</Text>

          <View style={styles.optionCard}>
            <View style={styles.optionInfo}>
              <Text style={styles.optionTitle}>
                Notificaciones
              </Text>

              <Text style={styles.optionDescription}>
                Recibir avisos sobre gastos, tareas y actividad.
              </Text>
            </View>

            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{
                false: '#D5D5D5',
                true: '#F3A2A9',
              }}
              thumbColor={
                notifications ? '#E21B2D' : '#FFFFFF'
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>

          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuItem}
              onPress={() =>
                showComingSoon('Cambiar contraseña')
              }
            >
              <View>
                <Text style={styles.menuTitle}>
                  Cambiar contraseña
                </Text>

                <Text style={styles.menuDescription}>
                  Actualiza la contraseña de tu cuenta.
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </Pressable>

            <View style={styles.separator} />

            <Pressable
              style={styles.menuItem}
              onPress={() =>
                showComingSoon('Privacidad')
              }
            >
              <View>
                <Text style={styles.menuTitle}>
                  Privacidad
                </Text>

                <Text style={styles.menuDescription}>
                  Configura tus opciones de privacidad.
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </Pressable>

            <View style={styles.separator} />

            <Pressable
              style={styles.menuItem}
              onPress={() =>
                showComingSoon('Ayuda y soporte')
              }
            >
              <View>
                <Text style={styles.menuTitle}>
                  Ayuda y soporte
                </Text>

                <Text style={styles.menuDescription}>
                  Consulta información y soporte de Roomie.
                </Text>
              </View>

              <Text style={styles.arrow}>›</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={styles.logoutButton}
          onPress={logout}
        >
          <Text style={styles.logoutText}>
            Cerrar sesión
          </Text>
        </Pressable>

        <Text style={styles.version}>
          Roomie · Versión 1.0
        </Text>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/home')}
        >
          <Text style={styles.navIcon}>⌂</Text>
          <Text style={styles.navText}>Inicio</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/expenses')}
        >
          <Text style={styles.navIcon}>$</Text>
          <Text style={styles.navText}>Gastos</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/tasks')}
        >
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navText}>Tareas</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Text style={[styles.navIcon, styles.activeIcon]}>
            ●
          </Text>
          <Text style={[styles.navText, styles.activeText]}>
            Perfil
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  header: {
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA',
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },

  backText: {
    fontSize: 34,
    color: '#222222',
    lineHeight: 38,
  },

  headerTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111111',
  },

  headerSpace: {
    width: 42,
  },

  content: {
    padding: 18,
    paddingBottom: 100,
  },

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 25,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 31,
    fontWeight: '800',
  },

  profileName: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111111',
    marginTop: 12,
  },

  profileEmail: {
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
  },

  roleBadge: {
    backgroundColor: '#FFF0F2',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },

  roleText: {
    color: '#E21B2D',
    fontSize: 11,
    fontWeight: '700',
  },

  section: {
    marginTop: 24,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 10,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#444444',
    marginBottom: 6,
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 13,
    color: '#111111',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },

  inputDisabled: {
    backgroundColor: '#F5F5F5',
    color: '#666666',
  },

  editButton: {
    height: 45,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  editButtonText: {
    color: '#E21B2D',
    fontWeight: '700',
  },

  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cancelButtonText: {
    color: '#555555',
    fontWeight: '700',
  },

  saveButton: {
    flex: 1,
    height: 45,
    borderRadius: 10,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  optionInfo: {
    flex: 1,
    paddingRight: 10,
  },

  optionTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },

  optionDescription: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    overflow: 'hidden',
  },

  menuItem: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  menuDescription: {
    color: '#888888',
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    fontSize: 27,
    color: '#999999',
    marginLeft: 'auto',
  },

  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginLeft: 16,
  },

  logoutButton: {
    height: 50,
    borderRadius: 11,
    backgroundColor: '#FFE8EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  logoutText: {
    color: '#E21B2D',
    fontSize: 15,
    fontWeight: '800',
  },

  version: {
    textAlign: 'center',
    color: '#AAAAAA',
    fontSize: 11,
    marginTop: 15,
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 65,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '25%',
  },

  navIcon: {
    fontSize: 18,
    color: '#555555',
  },

  navText: {
    fontSize: 11,
    color: '#666666',
    marginTop: 3,
  },

  activeIcon: {
    color: '#E21B2D',
  },

  activeText: {
    color: '#E21B2D',
    fontWeight: '700',
  },
});