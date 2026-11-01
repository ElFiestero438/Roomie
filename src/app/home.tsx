import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  getCurrentUser,
  logoutUser,
  subscribeToAuthChanges,
} from '../firebase/auth';

import {
  Compra,
  Gasto,
  getCompras,
  getGastos,
  getRoomies,
  getTareas,
  getUserProfile,
  getViviendas,
  Roomie,
  Tarea,
  Vivienda,
} from '../firebase/firestore';

import { BottomNav } from '../components/bottom-nav';
import { calculateBalance } from '../utils/balance';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const [viviendas, setViviendas] = useState<Vivienda[]>([]);
  const [roomies, setRoomies] = useState<Roomie[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [compras, setCompras] = useState<Compra[]>([]);

  // Detecta quién tiene la sesión abierta.
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((user) => {
      if (!user) {
        router.replace('/');
        return;
      }

      setUid(user.uid);
    });

    return unsubscribe;
  }, []);

  // Recarga los datos cada vez que vuelves a Inicio (por ejemplo, desde Gastos),
  // para que el balance siempre coincida con la pestaña Gastos.
  useFocusEffect(
    useCallback(() => {
      if (uid) {
        loadUserData(uid);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uid])
  );

  const loadUserData = async (uid: string) => {
    try {
      const user = getCurrentUser();

      if (!user) {
        router.replace('/');
        return;
      }

      setUserEmail(user.email ?? '');

      const profile = await getUserProfile(uid);

      if (profile) {
        setUserName(profile.name);
      } else {
        setUserName(user.displayName ?? '');
      }

      const [
        viviendasData,
        roomiesData,
        tareasData,
        gastosData,
        comprasData,
      ] = await Promise.all([
        getViviendas(uid),
        getRoomies(uid),
        getTareas(uid),
        getGastos(uid),
        getCompras(uid),
      ]);

      setViviendas(viviendasData);
      setRoomies(roomiesData);
      setTareas(tareasData);
      setGastos(gastosData);
      setCompras(comprasData);
    } catch (error) {
      console.log(
        'Error al cargar los datos de Roomie:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      router.replace('/');
    } catch (error) {
      console.log('Error al cerrar sesión:', error);
    }
  };

  const tareasPendientes = tareas.filter(
    (tarea) => !tarea.completada
  );

  const comprasPendientes = compras.filter(
    (compra) => !compra.completada
  );

  // Mismo cálculo que la pestaña Gastos.
  const balance = calculateBalance(gastos, roomies, uid ?? '');

  const viviendaPrincipal = viviendas[0];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#E21B2D"
        />

        <Text style={styles.loadingText}>
          Cargando tu información...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>
              ¡Hola{userName ? `, ${userName}` : ''}!
            </Text>

            <Text
              style={styles.email}
              numberOfLines={1}
            >
              {userEmail}
            </Text>

            <Text style={styles.subtitle}>
              Así va tu vivienda hoy
            </Text>
          </View>

          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              Salir
            </Text>
          </Pressable>
        </View>

        <View style={styles.homeCard}>
          <Text style={styles.homeLabel}>
            MI VIVIENDA
          </Text>

          <Text style={styles.homeTitle}>
            {viviendaPrincipal?.nombre ||
              'Mi vivienda'}
          </Text>

          {viviendaPrincipal ? (
            <>
              <Text style={styles.homeDescription}>
                {viviendaPrincipal.descripcion ||
                  viviendaPrincipal.direccion ||
                  'Tu vivienda está configurada.'}
              </Text>

              <Text style={styles.membersText}>
                {roomies.length}{' '}
                {roomies.length === 1
                  ? 'integrante'
                  : 'integrantes'}
              </Text>
            </>
          ) : (
            <Text style={styles.homeDescription}>
              Todavía no tienes una vivienda configurada.
            </Text>
          )}

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push('/roommates')
            }
          >
            <Text style={styles.primaryButtonText}>
              {viviendaPrincipal
                ? 'Administrar vivienda'
                : 'Configurar vivienda'}
            </Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.balanceCard}
          onPress={() => router.push('/expenses')}
        >
          <Text style={styles.sectionTitle}>
            Tu balance
          </Text>

          <Text style={styles.balanceTotal}>
            Pendiente por saldar: ${Math.round(balance.pending).toLocaleString('es-CO')}
            {' · '}Total gastado: ${Math.round(balance.total).toLocaleString('es-CO')}
          </Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>
                Debes
              </Text>

              <Text style={styles.debtAmount}>
                -${Math.round(balance.iOwe).toLocaleString('es-CO')}
              </Text>
            </View>

            <View style={styles.rightBalance}>
              <Text style={styles.balanceLabel}>
                Te deben
              </Text>

              <Text style={styles.receivableAmount}>
                +${Math.round(balance.theyOweMe).toLocaleString('es-CO')}
              </Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Tareas pendientes
          </Text>

          {tareasPendientes.length > 0 ? (
            <Text style={styles.dataText}>
              Tienes {tareasPendientes.length}{' '}
              {tareasPendientes.length === 1
                ? 'tarea pendiente'
                : 'tareas pendientes'}.
            </Text>
          ) : (
            <Text style={styles.emptyText}>
              Todavía no tienes tareas pendientes.
            </Text>
          )}

          <Pressable
            style={styles.outlineButton}
            onPress={() => router.push('/tasks')}
          >
            <Text style={styles.outlineButtonText}>
              Ir a tareas
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Gastos
          </Text>

          {gastos.length > 0 ? (
            <Text style={styles.dataText}>
              Tienes {gastos.length}{' '}
              {gastos.length === 1
                ? 'gasto registrado'
                : 'gastos registrados'}.
            </Text>
          ) : (
            <Text style={styles.emptyText}>
              Todavía no tienes gastos registrados.
            </Text>
          )}

          <Pressable
            style={styles.outlineButton}
            onPress={() => router.push('/expenses')}
          >
            <Text style={styles.outlineButtonText}>
              Ir a gastos
            </Text>
          </Pressable>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Actividad reciente
          </Text>

          {comprasPendientes.length > 0 ? (
            <Text style={styles.dataText}>
              Tienes {comprasPendientes.length}{' '}
              {comprasPendientes.length === 1
                ? 'compra pendiente'
                : 'compras pendientes'}.
            </Text>
          ) : (
            <Text style={styles.emptyText}>
              Todavía no hay actividad registrada.
            </Text>
          )}
        </View>

        <View style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>
            Acciones rápidas
          </Text>

          <View style={styles.quickActionsRow}>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/tasks')}
            >
              <Text style={styles.quickActionText}>
                Tareas
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/expenses')}
            >
              <Text style={styles.quickActionText}>
                Gastos
              </Text>
            </Pressable>
          </View>

          <View style={styles.quickActionsRow}>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push('/shopping')}
            >
              <Text style={styles.quickActionText}>
                Compras
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickAction}
              onPress={() =>
                router.push('/roommates')
              }
            >
              <Text style={styles.quickActionText}>
                Integrantes
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <BottomNav active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

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

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  greeting: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E1E1E',
  },

  email: {
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#777777',
    marginTop: 6,
  },

  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FCE8EA',
  },

  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E21B2D',
  },

  homeCard: {
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },

  homeLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E21B2D',
    letterSpacing: 1,
  },

  homeTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
  },

  homeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#D0D0D0',
    marginTop: 12,
  },

  membersText: {
    fontSize: 13,
    color: '#BDBDBD',
    marginTop: 8,
  },

  primaryButton: {
    backgroundColor: '#E21B2D',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
  },

  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E1E1E',
  },

  balanceTotal: {
    fontSize: 13,
    color: '#777777',
    marginTop: 6,
  },

  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
  },

  balanceLabel: {
    fontSize: 13,
    color: '#777777',
    marginBottom: 5,
  },

  debtAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#E21B2D',
  },

  receivableAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2E7D32',
  },

  rightBalance: {
    alignItems: 'flex-end',
  },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#777777',
    marginTop: 12,
  },

  dataText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333333',
    marginTop: 12,
  },

  outlineButton: {
    borderWidth: 1,
    borderColor: '#E21B2D',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 16,
  },

  outlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E21B2D',
  },

  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },

  quickAction: {
    flex: 1,
    backgroundColor: '#FCE8EA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },

  quickActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E21B2D',
  },
});