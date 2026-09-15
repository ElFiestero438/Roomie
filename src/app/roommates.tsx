import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type Roommate = {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: number;
};

export default function RoommatesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [roommates, setRoommates] = useState<Roommate[]>([
    {
      id: 1,
      name: 'Sebastián',
      email: 'sebastian@correo.com',
      role: 'Administrador',
      balance: 85000,
    },
    {
      id: 2,
      name: 'Carlos',
      email: 'carlos@correo.com',
      role: 'Roomie',
      balance: -25000,
    },
    {
      id: 3,
      name: 'Laura',
      email: 'laura@correo.com',
      role: 'Roomie',
      balance: 40000,
    },
    {
      id: 4,
      name: 'Andrés',
      email: 'andres@correo.com',
      role: 'Roomie',
      balance: -10000,
    },
  ]);

  const addRoommate = () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa el nombre y correo del nuevo roomie.'
      );
      return;
    }

    if (!email.includes('@')) {
      Alert.alert(
        'Correo inválido',
        'Ingresa un correo electrónico válido.'
      );
      return;
    }

    const newRoommate: Roommate = {
      id: Date.now(),
      name: name.trim(),
      email: email.trim(),
      role: 'Roomie',
      balance: 0,
    };

    setRoommates((current) => [...current, newRoommate]);

    setName('');
    setEmail('');
    setModalVisible(false);

    Alert.alert(
      'Roomie agregado',
      `${newRoommate.name} fue agregado a la vivienda.`
    );
  };

  const removeRoommate = (roommate: Roommate) => {
    if (roommate.role === 'Administrador') {
      Alert.alert(
        'Acción no disponible',
        'El administrador no puede ser eliminado de la vivienda.'
      );
      return;
    }

    Alert.alert(
      'Eliminar roomie',
      `¿Quieres eliminar a ${roommate.name} de la vivienda?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setRoommates((current) =>
              current.filter((item) => item.id !== roommate.id)
            );
          },
        },
      ]
    );
  };

  const inviteRoommate = () => {
    setModalVisible(true);
  };

  const formatCurrency = (value: number) => {
    const absoluteValue = Math.abs(value).toLocaleString('es-CO');

    if (value > 0) return `+$${absoluteValue}`;
    if (value < 0) return `-$${absoluteValue}`;

    return '$0';
  };

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
              Personas de Casa Roomie
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={inviteRoommate}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.homeCard}>
          <View>
            <Text style={styles.homeLabel}>VIVIENDA</Text>
            <Text style={styles.homeName}>Casa Roomie</Text>
            <Text style={styles.homeMembers}>
              {roommates.length} integrantes
            </Text>
          </View>

          <View style={styles.homeIcon}>
            <Text style={styles.houseIcon}>⌂</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>i</Text>
          </View>

          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>
              Invita a tus roomies
            </Text>

            <Text style={styles.infoText}>
              Agrega a las personas con las que compartes
              vivienda para organizar gastos y tareas.
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Integrantes
          </Text>

          <Text style={styles.count}>
            {roommates.length}
          </Text>
        </View>

        {roommates.map((roommate) => (
          <View key={roommate.id} style={styles.roommateCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {roommate.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.roommateInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.roommateName}>
                  {roommate.name}
                </Text>

                {roommate.role === 'Administrador' && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminText}>
                      Admin
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.email}>
                {roommate.email}
              </Text>

              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>
                  Balance:
                </Text>

                <Text
                  style={[
                    styles.balance,
                    roommate.balance > 0
                      ? styles.positive
                      : roommate.balance < 0
                      ? styles.negative
                      : styles.neutral,
                  ]}
                >
                  {formatCurrency(roommate.balance)}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.moreButton}
              onPress={() => {
                if (roommate.role === 'Administrador') {
                  Alert.alert(
                    roommate.name,
                    'Administrador de la vivienda'
                  );
                } else {
                  Alert.alert(
                    roommate.name,
                    '¿Qué deseas hacer?',
                    [
                      {
                        text: 'Cancelar',
                        style: 'cancel',
                      },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () =>
                          removeRoommate(roommate),
                      },
                    ]
                  );
                }
              }}
            >
              <Text style={styles.moreText}>•••</Text>
            </Pressable>
          </View>
        ))}

        <Pressable
          style={styles.inviteButton}
          onPress={inviteRoommate}
        >
          <Text style={styles.inviteButtonText}>
            + Invitar roomie
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
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Invitar roomie
              </Text>

              <Pressable
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.modalDescription}>
              Ingresa los datos de la persona que quieres
              agregar a tu vivienda.
            </Text>

            <Text style={styles.label}>
              Nombre
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del roomie"
              placeholderTextColor="#999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            <Text style={styles.label}>
              Correo electrónico
            </Text>

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
              style={styles.saveButton}
              onPress={addRoommate}
            >
              <Text style={styles.saveButtonText}>
                Agregar roomie
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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

  balanceRow: {
    flexDirection: 'row',
    marginTop: 5,
  },

  balanceLabel: {
    color: '#999999',
    fontSize: 10,
  },

  balance: {
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },

  positive: {
    color: '#38A169',
  },

  negative: {
    color: '#E21B2D',
  },

  neutral: {
    color: '#777777',
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