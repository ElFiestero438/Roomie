import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Alert } from '../components/app-alert';
import type { Roomie, Vivienda } from '../firebase/firestore';
import {
  deleteRoomie,
  getRoomies,
  getViviendas,
  saveRoomie,
  saveVivienda,
} from '../firebase/firestore';
import { useAuthUser } from '../hooks/useAuthUser';

const VIVIENDA_ID = 'principal';

type ModalMode = 'roomie' | 'vivienda' | null;

export default function RoommatesScreen() {
  const { user, loading: authLoading } = useAuthUser();
  const uid = user?.uid;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const [vivienda, setVivienda] = useState<Vivienda | null>(null);
  const [roommates, setRoommates] = useState<Roomie[]>([]);

  // Campos del formulario de roomie
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Campos del formulario de vivienda
  const [homeName, setHomeName] = useState('');
  const [homeAddress, setHomeAddress] = useState('');

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

      Promise.all([getViviendas(uid), getRoomies(uid)])
        .then(([viviendas, roomies]) => {
          if (!active) return;

          setVivienda(viviendas[0] ?? null);

          // El administrador (tú) siempre aparece primero.
          setRoommates(
            [...roomies].sort((a, b) => {
              if (a.id === uid) return -1;
              if (b.id === uid) return 1;
              return a.nombre.localeCompare(b.nombre);
            })
          );
        })
        .catch((error: any) => {
          if (!active) return;
          Alert.alert(
            'No se pudo cargar la vivienda',
            error?.message ?? 'Intenta de nuevo.'
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [uid])
  );

  const closeModal = () => {
    if (saving) return;
    setModalMode(null);
    setName('');
    setEmail('');
  };

  const openViviendaModal = () => {
    setHomeName(vivienda?.nombre ?? '');
    setHomeAddress(vivienda?.direccion ?? '');
    setModalMode('vivienda');
  };

  const openRoomieModal = () => {
    if (!vivienda) {
      Alert.alert(
        'Primero crea tu vivienda',
        'Antes de invitar roomies, ponle un nombre a tu vivienda.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear vivienda', onPress: openViviendaModal },
        ]
      );
      return;
    }

    setModalMode('roomie');
  };

  const saveHome = async () => {
    if (!uid || !user) return;

    const cleanName = homeName.trim();

    if (!cleanName) {
      Alert.alert(
        'Campo incompleto',
        'Escribe el nombre de tu vivienda.'
      );
      return;
    }

    const isNew = !vivienda;

    const newVivienda: Vivienda = {
      id: vivienda?.id ?? VIVIENDA_ID,
      nombre: cleanName,
      direccion: homeAddress.trim(),
      createdAt: vivienda?.createdAt ?? Date.now(),
    };

    try {
      setSaving(true);
      await saveVivienda(uid, newVivienda);

      // Al crear la vivienda, tú quedas como administrador.
      if (!roommates.some((item) => item.id === uid)) {
        const admin: Roomie = {
          id: uid,
          nombre: user.displayName || user.email || 'Yo',
          email: user.email ?? '',
          createdAt: Date.now(),
        };

        await saveRoomie(uid, admin);
        setRoommates((current) => [admin, ...current]);
      }

      setVivienda(newVivienda);
      setSaving(false);
      setModalMode(null);

      Alert.alert(
        isNew ? 'Vivienda creada' : 'Vivienda actualizada',
        isNew
          ? `${cleanName} está lista. Ahora puedes invitar a tus roomies.`
          : 'Los datos de tu vivienda se guardaron.'
      );
    } catch (error: any) {
      setSaving(false);
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  const addRoommate = async () => {
    if (!uid) return;

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa el nombre y correo del nuevo roomie.'
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

    if (
      roommates.some(
        (item) => (item.email ?? '').toLowerCase() === cleanEmail
      )
    ) {
      Alert.alert(
        'Roomie repetido',
        'Ya hay un integrante con ese correo.'
      );
      return;
    }

    const newRoommate: Roomie = {
      id: Date.now().toString(),
      nombre: cleanName,
      email: cleanEmail,
      createdAt: Date.now(),
    };

    try {
      setSaving(true);
      await saveRoomie(uid, newRoommate);

      setRoommates((current) => [...current, newRoommate]);
      setSaving(false);
      setName('');
      setEmail('');
      setModalMode(null);

      Alert.alert(
        'Roomie agregado',
        `${newRoommate.nombre} fue agregado a la vivienda. ¿Quieres enviarle la invitación por correo?`,
        [
          { text: 'Ahora no', style: 'cancel' },
          {
            text: 'Enviar invitación',
            onPress: () => sendInvitation(newRoommate),
          },
        ]
      );
    } catch (error: any) {
      setSaving(false);
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  // Abre la app de correo del celular con la invitación ya escrita.
  const sendInvitation = async (roommate: Roomie) => {
    if (!roommate.email) {
      Alert.alert(
        'Sin correo',
        'Este roomie no tiene un correo electrónico registrado.'
      );
      return;
    }

    const inviter = user?.displayName || user?.email || 'Tu roomie';
    const homeName = vivienda?.nombre ?? 'nuestra vivienda';

    const subject = `${inviter} te invitó a Roomie`;
    const body =
      `Hola ${roommate.nombre},\n\n` +
      `${inviter} te invitó a unirte a "${homeName}" en Roomie, ` +
      'la app para organizar los gastos, las tareas y las compras de la casa.\n\n' +
      `Cuando tengas Roomie instalada, crea tu cuenta con este correo: ${roommate.email}\n\n` +
      '¡Nos vemos en Roomie!';

    const url = `mailto:${roommate.email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'No se pudo abrir el correo',
        'Revisa que tengas una app de correo (como Gmail) instalada en tu celular.'
      );
    }
  };

  // Opciones del botón ••• de cada roomie.
  const showRoommateOptions = (roommate: Roomie) => {
    Alert.alert(roommate.nombre, roommate.email || '¿Qué deseas hacer?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Reenviar invitación',
        onPress: () => sendInvitation(roommate),
      },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => removeRoommate(roommate),
      },
    ]);
  };

  const removeRoommate = (roommate: Roomie) => {
    if (!uid) return;

    if (roommate.id === uid) {
      Alert.alert(
        'Acción no disponible',
        'El administrador no puede ser eliminado de la vivienda.'
      );
      return;
    }

    Alert.alert(
      'Eliminar roomie',
      `¿Quieres eliminar a ${roommate.nombre} de la vivienda?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const previous = roommates;

            // Desaparece de la lista al instante y luego se borra de Firebase.
            setRoommates((current) =>
              current.filter((item) => item.id !== roommate.id)
            );

            try {
              await deleteRoomie(uid, roommate.id);
            } catch (error: any) {
              setRoommates(previous);
              Alert.alert(
                'No se pudo eliminar',
                error?.message ?? 'Intenta de nuevo.'
              );
            }
          },
        },
      ]
    );
  };

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E21B2D" />
        <Text style={styles.loadingText}>Cargando tu vivienda...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerInfo}>
            <Text style={styles.title}>Roomies</Text>
            <Text style={styles.subtitle}>
              {vivienda
                ? `Personas de ${vivienda.nombre}`
                : 'Configura tu vivienda'}
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={openRoomieModal}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <Pressable style={styles.homeCard} onPress={openViviendaModal}>
          <View style={styles.homeTextContainer}>
            <Text style={styles.homeLabel}>VIVIENDA</Text>
            <Text style={styles.homeName}>
              {vivienda ? vivienda.nombre : 'Sin vivienda'}
            </Text>
            <Text style={styles.homeMembers}>
              {vivienda
                ? `${roommates.length} ${
                    roommates.length === 1 ? 'integrante' : 'integrantes'
                  } · Toca para editar`
                : 'Toca aquí para crear tu vivienda'}
            </Text>
          </View>

          <View style={styles.homeIcon}>
            <Text style={styles.houseIcon}>⌂</Text>
          </View>
        </Pressable>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>i</Text>
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              {vivienda ? 'Invita a tus roomies' : 'Empieza por tu vivienda'}
            </Text>

            <Text style={styles.infoText}>
              {vivienda
                ? 'Agrega a las personas con las que compartes vivienda para organizar gastos y tareas.'
                : 'Ponle un nombre a tu vivienda y luego agrega a las personas con las que vives.'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Integrantes</Text>
          <Text style={styles.count}>{roommates.length}</Text>
        </View>

        {roommates.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Todavía no hay integrantes</Text>
            <Text style={styles.emptyText}>
              Cuando crees tu vivienda aparecerás aquí como administrador.
            </Text>
          </View>
        ) : (
          roommates.map((roommate) => {
            const isAdmin = roommate.id === uid;

            return (
              <View key={roommate.id} style={styles.roommateCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(roommate.nombre || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.roommateInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.roommateName}>
                      {roommate.nombre}
                      {isAdmin ? ' (tú)' : ''}
                    </Text>

                    {isAdmin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminText}>Admin</Text>
                      </View>
                    )}
                  </View>

                  {roommate.email ? (
                    <Text style={styles.email}>{roommate.email}</Text>
                  ) : null}
                </View>

                {!isAdmin && (
                  <Pressable
                    style={styles.moreButton}
                    onPress={() => showRoommateOptions(roommate)}
                  >
                    <Text style={styles.moreText}>•••</Text>
                  </Pressable>
                )}
              </View>
            );
          })
        )}

        <Pressable
          style={styles.inviteButton}
          onPress={vivienda ? openRoomieModal : openViviendaModal}
        >
          <Text style={styles.inviteButtonText}>
            {vivienda ? '+ Invitar roomie' : '+ Crear vivienda'}
          </Text>
        </Pressable>
      </ScrollView>

      <View style={styles.bottomNavigation}>
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

        <Pressable style={styles.navItem}>
          <Text style={styles.navIconActive}>●</Text>
          <Text style={styles.navTextActive}>Roomies</Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={modalMode !== null}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === 'vivienda'
                  ? vivienda
                    ? 'Editar vivienda'
                    : 'Crear vivienda'
                  : 'Invitar roomie'}
              </Text>

              <Pressable onPress={closeModal}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            {modalMode === 'vivienda' ? (
              <>
                <Text style={styles.modalDescription}>
                  Así se llamará el hogar que compartes con tus roomies.
                </Text>

                <Text style={styles.label}>Nombre de la vivienda</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Apartamento Laureles"
                  placeholderTextColor="#999"
                  value={homeName}
                  onChangeText={setHomeName}
                  autoCapitalize="sentences"
                />

                <Text style={styles.label}>Dirección (opcional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Calle 10 # 20-30"
                  placeholderTextColor="#999"
                  value={homeAddress}
                  onChangeText={setHomeAddress}
                />

                <Pressable
                  style={[styles.saveButton, saving && styles.disabled]}
                  onPress={saveHome}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {vivienda ? 'Guardar cambios' : 'Crear vivienda'}
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalDescription}>
                  Ingresa los datos de la persona que quieres agregar a tu
                  vivienda.
                </Text>

                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nombre del roomie"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />

                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="roomie@correo.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Pressable
                  style={[styles.saveButton, saving && styles.disabled]}
                  onPress={addRoommate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.saveButtonText}>Agregar roomie</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#777777',
  },

  homeTextContainer: {
    flex: 1,
    paddingRight: 12,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
  },

  emptyTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyText: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },

  disabled: {
    opacity: 0.7,
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: '#111111',
    fontSize: 30,
    lineHeight: 30,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    color: '#111111',
    fontSize: 25,
    fontWeight: '800',
  },

  subtitle: {
    color: '#777777',
    fontSize: 12,
    marginTop: 2,
  },

  addButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#E21B2D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 27,
  },

  homeCard: {
    backgroundColor: '#E21B2D',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  homeLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },

  homeName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 4,
  },

  homeMembers: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.85,
    marginTop: 3,
  },

  homeIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  houseIcon: {
    color: '#E21B2D',
    fontSize: 30,
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 25,
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FCE8EA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoIconText: {
    color: '#E21B2D',
    fontSize: 17,
    fontWeight: '800',
  },

  infoContent: {
    flex: 1,
    marginLeft: 11,
  },

  infoTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },

  infoText: {
    color: '#777777',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    color: '#111111',
    fontSize: 19,
    fontWeight: '800',
  },

  count: {
    color: '#999999',
    fontSize: 12,
  },

  roommateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
  },

  roommateInfo: {
    flex: 1,
    marginLeft: 12,
  },

  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  roommateName: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  adminBadge: {
    backgroundColor: '#FCE8EA',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginLeft: 7,
  },

  adminText: {
    color: '#E21B2D',
    fontSize: 8,
    fontWeight: '700',
  },

  email: {
    color: '#888888',
    fontSize: 10,
    marginTop: 3,
  },

  moreButton: {
    padding: 8,
  },

  moreText: {
    color: '#888888',
    fontSize: 13,
  },

  inviteButton: {
    height: 52,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: '#E21B2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },

  inviteButtonText: {
    color: '#E21B2D',
    fontSize: 14,
    fontWeight: '700',
  },

  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },

  navIcon: {
    color: '#999999',
    fontSize: 19,
  },

  navIconActive: {
    color: '#E21B2D',
    fontSize: 19,
  },

  navText: {
    color: '#999999',
    fontSize: 11,
    marginTop: 4,
  },

  navTextActive: {
    color: '#E21B2D',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    paddingBottom: 35,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },

  modalTitle: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '800',
  },

  closeButton: {
    color: '#777777',
    fontSize: 30,
  },

  modalDescription: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 22,
  },

  label: {
    color: '#222222',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111111',
    backgroundColor: '#FAFAFA',
    marginBottom: 18,
  },

  saveButton: {
    height: 52,
    borderRadius: 12,
    backgroundColor: '#E21B2D',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});