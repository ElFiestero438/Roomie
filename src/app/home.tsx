
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  clearSession,
  getSession,
} from '../constants/storage';

export default function HomeScreen() {
  const [userEmail, setUserEmail] = useState('');

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const session = await getSession();

      if (!session?.isLoggedIn) {
        router.replace('/');
        return;
      }

      setUserEmail(session.email);
    } catch (error) {
      console.log('Error al cargar usuario:', error);
    }
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.greeting}>¡Hola!</Text>

            <Text style={styles.email} numberOfLines={1}>
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
            <Text style={styles.logoutText}>Salir</Text>
          </Pressable>
        </View>

        <View style={styles.homeCard}>
          <Text style={styles.homeLabel}>MI VIVIENDA</Text>

          <Text style={styles.homeTitle}>Mi vivienda</Text>

          <Text style={styles.homeDescription}>
            Todavía no tienes una vivienda configurada.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/roommates')}
          >
            <Text style={styles.primaryButtonText}>
              Configurar vivienda
            </Text>
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.sectionTitle}>Tu balance</Text>

          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.balanceLabel}>Debes</Text>

              <Text style={styles.debtAmount}>$0</Text>
            </View>

            <View style={styles.rightBalance}>
              <Text style={styles.balanceLabel}>Te deben</Text>

              <Text style={styles.receivableAmount}>$0</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>
            Tareas pendientes
          </Text>

          <Text style={styles.emptyText}>
            Todavía no tienes tareas registradas.
          </Text>

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

          <Text style={styles.emptyText}>
            Todavía no tienes gastos registrados.
          </Text>

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

          <Text style={styles.emptyText}>
            Todavía no hay actividad registrada.
          </Text>
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
              onPress={() => router.push('/roommates')}
            >
              <Text style={styles.quickActionText}>
                Integrantes
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <Pressable
          style={styles.navItem}
          onPress={() => router.replace('/home')}
        >
          <Text style={styles.navItemActive}>Inicio</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/expenses')}
        >
          <Text style={styles.navItemText}>Gastos</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/tasks')}
        >
          <Text style={styles.navItemText}>Tareas</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.navItemText}>Perfil</Text>
        </Pressable>
      </View>
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
    paddingBottom: 30,
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

  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
    color: '#E21B2D',
  },

  navItemText: {
    fontSize: 13,
    color: '#777777',
  },
});