import { router, useFocusEffect } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Alert } from '../components/app-alert';
import { ProfileIcon } from '../components/bottom-nav';
import { db } from '../firebase/config';
import type { Compra, Gasto, Roomie, Tarea } from '../firebase/firestore';
import {
  getCompras,
  getGastos,
  getRoomies,
  getTareas,
  getViviendas,
} from '../firebase/firestore';
import { useAuthUser } from '../hooks/useAuthUser';

type NotificationType = 'expense' | 'task' | 'shopping' | 'home';

type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  type: NotificationType;
  read: boolean;
};

type ExpenseData = Gasto & {
  participantes?: string[];
  partes?: Record<string, number>;
  pagos?: Record<string, boolean>;
  saldado?: boolean;
};

const formatCurrency = (value: number) =>
  `$${Math.round(value).toLocaleString('es-CO')}`;

// Convierte createdAt / updatedAt / fecha a milisegundos.
const toMillis = (value: any, fallback?: string) => {
  if (typeof value === 'number') return value;
  if (value && typeof value.toMillis === 'function') return value.toMillis();

  if (fallback) {
    const parsed = Date.parse(fallback);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
};

const timeAgo = (ms: number) => {
  if (!ms) return '';

  const minutes = Math.floor((Date.now() - ms) / 60000);

  if (minutes < 1) return 'Hace un momento';
  if (minutes < 60) return `Hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  if (hours < 48) return 'Ayer';

  return new Date(ms).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
  });
};

// Crea los avisos a partir de los datos reales de la cuenta.
function buildNotifications(
  uid: string,
  homeName: string,
  gastos: ExpenseData[],
  tareas: Tarea[],
  compras: Compra[],
  roomies: Roomie[]
): Omit<Notification, 'read'>[] {
  const list: Omit<Notification, 'read'>[] = [];
  const memberIds = roomies.length > 0 ? roomies.map((r) => r.id) : [uid];

  const nameOf = (id?: string, fallback?: string) => {
    if (!id || id === uid) return 'Tú';
    return roomies.find((r) => r.id === id)?.nombre ?? fallback ?? 'Un roomie';
  };

  gastos.forEach((gasto) => {
    const time = toMillis(gasto.createdAt, gasto.fecha);
    const payerId = gasto.responsableId || uid;
    const payerName = nameOf(payerId, gasto.responsableNombre);
    const people =
      gasto.participantes && gasto.participantes.length > 0
        ? gasto.participantes
        : memberIds;
    const share =
      gasto.partes && gasto.partes[uid] !== undefined
        ? Number(gasto.partes[uid]) || 0
        : Number(gasto.monto || 0) / Math.max(people.length, 1);

    list.push({
      id: `gasto-${gasto.id}`,
      title: 'Nuevo gasto registrado',
      message:
        payerName === 'Tú'
          ? `Pagaste "${gasto.titulo}" por ${formatCurrency(Number(gasto.monto || 0))}.`
          : `${payerName} pagó "${gasto.titulo}" por ${formatCurrency(
              Number(gasto.monto || 0)
            )}.`,
      timestamp: time,
      type: 'expense',
    });

    const iPaid = gasto.pagos ? !!gasto.pagos[uid] : !!gasto.saldado;

    if (payerId !== uid && people.includes(uid) && !iPaid && share > 0) {
      list.push({
        id: `deuda-${gasto.id}`,
        title: 'Tienes un pago pendiente',
        message: `Le debes ${formatCurrency(share)} a ${payerName} por "${gasto.titulo}".`,
        timestamp: time + 1,
        type: 'expense',
      });
    }
  });

  tareas
    .filter((tarea) => !tarea.completada)
    .forEach((tarea) => {
      const details = [
        tarea.responsableNombre ? `Asignada a ${tarea.responsableNombre}` : '',
        tarea.fecha && tarea.fecha !== 'Sin fecha' ? `Para: ${tarea.fecha}` : '',
      ]
        .filter(Boolean)
        .join(' · ');

      list.push({
        id: `tarea-${tarea.id}`,
        title: 'Tarea pendiente',
        message: `Tienes pendiente la tarea "${tarea.titulo}".${
          details ? ` ${details}.` : ''
        }`,
        timestamp: toMillis(tarea.createdAt),
        type: 'task',
      });
    });

  compras
    .filter((compra) => !compra.completada)
    .forEach((compra) => {
      list.push({
        id: `compra-${compra.id}`,
        title: 'Producto por comprar',
        message: `Falta comprar ${compra.cantidad ?? 1} × ${compra.nombre}.`,
        timestamp: toMillis(compra.createdAt),
        type: 'shopping',
      });
    });

  roomies
    .filter((roomie) => roomie.id !== uid)
    .forEach((roomie) => {
      list.push({
        id: `roomie-${roomie.id}`,
        title: 'Nuevo integrante',
        message: `${roomie.nombre} se unió a ${homeName}.`,
        timestamp: toMillis(roomie.createdAt),
        type: 'home',
      });
    });

  return list.sort((a, b) => b.timestamp - a.timestamp);
}

export default function NotificationsScreen() {
  const { user, loading: authLoading } = useAuthUser();
  const uid = user?.uid;

  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(true);

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

      Promise.all([
        getDoc(doc(db, 'users', uid)),
        getViviendas(uid),
        getGastos(uid),
        getTareas(uid),
        getCompras(uid),
        getRoomies(uid),
      ])
        .then(([profileSnap, viviendas, gastos, tareas, compras, roomies]) => {
          if (!active) return;

          const profile = profileSnap.data() ?? {};
          const read: string[] = profile.notificacionesLeidas ?? [];
          const hidden: string[] = profile.notificacionesOcultas ?? [];

          setReadIds(read);
          setHiddenIds(hidden);
          setEnabled(profile.notificationsEnabled ?? true);

          const built = buildNotifications(
            uid,
            viviendas[0]?.nombre ?? 'tu vivienda',
            gastos as ExpenseData[],
            tareas,
            compras,
            roomies
          );

          setNotifications(
            built
              .filter((item) => !hidden.includes(item.id))
              .map((item) => ({ ...item, read: read.includes(item.id) }))
          );
        })
        .catch((error: any) => {
          if (!active) return;
          Alert.alert(
            'No se pudieron cargar las notificaciones',
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

  // Guarda en tu cuenta qué avisos leíste u ocultaste.
  const saveState = async (read: string[], hidden: string[]) => {
    if (!uid) return;

    try {
      await setDoc(
        doc(db, 'users', uid),
        { notificacionesLeidas: read, notificacionesOcultas: hidden },
        { merge: true }
      );
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  const unreadCount = notifications.filter(
    notification => !notification.read
  ).length;

  const markAsRead = (id: string) => {
    if (readIds.includes(id)) return;

    const read = [...readIds, id];
    setReadIds(read);
    setNotifications(current =>
      current.map(notification =>
        notification.id === id
          ? { ...notification, read: true }
          : notification
      )
    );
    saveState(read, hiddenIds);
  };

  const markAllAsRead = () => {
    if (unreadCount === 0) {
      Alert.alert(
        'Todo al día',
        'No tienes notificaciones pendientes.'
      );
      return;
    }

    const read = Array.from(
      new Set([...readIds, ...notifications.map(item => item.id)])
    );
    setReadIds(read);
    setNotifications(current =>
      current.map(notification => ({
        ...notification,
        read: true,
      }))
    );
    saveState(read, hiddenIds);
  };

  const deleteNotification = (id: string) => {
    const hidden = [...hiddenIds, id];
    setHiddenIds(hidden);
    setNotifications(current =>
      current.filter(notification => notification.id !== id)
    );
    saveState(readIds, hidden);
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

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E21B2D" />
        <Text style={styles.loadingText}>Cargando notificaciones...</Text>
      </View>
    );
  }

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
        {!enabled && (
          <Pressable
            style={styles.disabledBanner}
            onPress={() => router.push('/profile')}
          >
            <Text style={styles.disabledText}>
              Tienes las notificaciones desactivadas. Puedes activarlas en
              Perfil.
            </Text>
          </Pressable>
        )}

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
                    {timeAgo(notification.timestamp)}
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
            Aquí ves los gastos, pagos pendientes, tareas, compras e
            integrantes de tu casa. Mantén presionado un aviso para
            eliminarlo.
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
          <ProfileIcon />
          <Text style={styles.navText}>Perfil</Text>
        </Pressable>
      </View>
    </SafeAreaView>
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

  disabledBanner: {
    backgroundColor: '#FCE8EA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },

  disabledText: {
    color: '#C62828',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },

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