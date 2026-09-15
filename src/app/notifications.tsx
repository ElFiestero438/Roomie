import { router } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';

type Notification = {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'expense' | 'task' | 'shopping' | 'home';
  read: boolean;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      title: 'Nuevo gasto registrado',
      message: 'Carlos registró un gasto de $80.000 por internet.',
      time: 'Hace 10 minutos',
      type: 'expense',
      read: false,
    },
    {
      id: 2,
      title: 'Tarea pendiente',
      message: 'Tienes pendiente la tarea "Limpiar la cocina".',
      time: 'Hace 1 hora',
      type: 'task',
      read: false,
    },
    {
      id: 3,
      title: 'Lista de compras actualizada',
      message: 'Laura agregó "Papel higiénico" a la lista.',
      time: 'Hace 2 horas',
      type: 'shopping',
      read: true,
    },
    {
      id: 4,
      title: 'Nuevo integrante',
      message: 'Andrés se unió a Casa Roomie.',
      time: 'Ayer',
      type: 'home',
      read: true,
    },
  ]);

  const unreadCount = notifications.filter(
    notification => !notification.read
  ).length;

  const markAsRead = (id: number) => {
    setNotifications(current =>
      current.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    if (unreadCount === 0) {
      Alert.alert(
        'Todo al día',
        'No tienes notificaciones pendientes.'
      );
      return;
    }

    setNotifications(current =>
      current.map(notification => ({
        ...notification,
        read: true,
      }))
    );
  };

  const deleteNotification = (id: number) => {
    setNotifications(current =>
      current.filter(notification => notification.id !== id)
    );
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'expense':
        return '$';
      case 'task':
        return '✓';
      case 'shopping':
        return '🛒';
      case 'home':
        return '⌂';
      default:
        return '!';
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.type === 'expense') {
      router.push('/expenses');
    } else if (notification.type === 'task') {
      router.push('/tasks');
    } else if (notification.type === 'shopping') {
      router.push('/shopping');
    } else {
      router.push('/roommates');
    }
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

        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notificaciones</Text>

          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerSpace} />
      </View>

      <View style={styles.actions}>
        <Text style={styles.sectionTitle}>
          Actividad reciente
        </Text>

        <Pressable onPress={markAllAsRead}>
          <Text style={styles.readAllText}>
            Marcar todo leído
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>

            <Text style={styles.emptyTitle}>
              No tienes notificaciones
            </Text>

            <Text style={styles.emptyText}>
              Aquí aparecerán los avisos importantes de tu casa.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {notifications.map(notification => (
              <Pressable
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard,
                ]}
                onPress={() =>
                  handleNotificationPress(notification)
                }
                onLongPress={() =>
                  Alert.alert(
                    'Eliminar notificación',
                    '¿Quieres eliminar esta notificación?',
                    [
                      {
                        text: 'Cancelar',
                        style: 'cancel',
                      },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () =>
                          deleteNotification(notification.id),
                      },
                    ]
                  )
                }
              >
                <View
                  style={[
                    styles.iconContainer,
                    !notification.read &&
                      styles.unreadIconContainer,
                  ]}
                >
                  <Text style={styles.iconText}>
                    {getIcon(notification.type)}
                  </Text>
                </View>

                <View style={styles.notificationInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>

                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  <Text style={styles.message}>
                    {notification.message}
                  </Text>

                  <Text style={styles.time}>
                    {notification.time}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            Sobre las notificaciones
          </Text>

          <Text style={styles.infoText}>
            Roomie te avisará cuando haya cambios importantes en
            los gastos, tareas, compras o integrantes de tu casa.
          </Text>
        </View>
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
          <Text style={styles.navIcon}>●</Text>
          <Text style={styles.navText}>Perfil</Text>
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
    height: 75,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
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

  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111111',
  },

  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 6,
  },

  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  headerSpace: {
    width: 42,
  },

  actions: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#555555',
  },

  readAllText: {
    color: '#E21B2D',
    fontSize: 12,
    fontWeight: '700',
  },

  content: {
    padding: 18,
    paddingBottom: 100,
  },

  list: {
    gap: 10,
  },

  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  unreadCard: {
    borderColor: '#F3C7CB',
    backgroundColor: '#FFF8F8',
  },

  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEEEEE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  unreadIconContainer: {
    backgroundColor: '#FFE1E4',
  },

  iconText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E21B2D',
  },

  notificationInfo: {
    flex: 1,
    marginLeft: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  notificationTitle: {
    flex: 1,
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E21B2D',
    marginLeft: 8,
  },

  message: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },

  time: {
    color: '#999999',
    fontSize: 11,
    marginTop: 7,
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 35,
    alignItems: 'center',
    marginTop: 10,
  },

  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: '#E21B2D',
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 55,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111111',
  },

  emptyText: {
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 7,
  },

  infoCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 15,
    padding: 16,
    marginTop: 20,
  },

  infoTitle: {
    color: '#111111',
    fontSize: 15,
    fontWeight: '700',
  },

  infoText: {
    color: '#666666',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
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
});