import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function HomeScreen() {
  const goTo = (screen: string) => {
    router.push(screen as any);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, Sebastián</Text>
            <Text style={styles.subtitle}>
              Así va tu vivienda hoy
            </Text>
          </View>

          <Pressable
            style={styles.notificationButton}
            onPress={() => goTo('/notifications')}
          >
            <Text style={styles.notificationIcon}>●</Text>
          </Pressable>
        </View>

        <View style={styles.homeCard}>
          <View>
            <Text style={styles.homeLabel}>MI VIVIENDA</Text>
            <Text style={styles.homeName}>Casa Roomie</Text>
            <Text style={styles.homeMembers}>
              4 integrantes
            </Text>
          </View>

          <View style={styles.homeIcon}>
            <Text style={styles.houseIcon}>⌂</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Resumen</Text>

        <View style={styles.balanceCard}>
          <Text style={styles.cardLabel}>Balance total</Text>
          <Text style={styles.balance}>$85.000</Text>
          <Text style={styles.balanceDescription}>
            Lo que debes recibir
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>$</Text>
            <Text style={styles.summaryNumber}>3</Text>
            <Text style={styles.summaryLabel}>
              Gastos pendientes
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryIcon}>✓</Text>
            <Text style={styles.summaryNumber}>5</Text>
            <Text style={styles.summaryLabel}>
              Tareas pendientes
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Acciones rápidas</Text>

        <View style={styles.actionsGrid}>
          <Pressable
            style={styles.actionCard}
            onPress={() => goTo('/expenses')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>$</Text>
            </View>

            <Text style={styles.actionTitle}>
              Registrar gasto
            </Text>

            <Text style={styles.actionDescription}>
              Agrega un gasto compartido
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => goTo('/tasks')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>✓</Text>
            </View>

            <Text style={styles.actionTitle}>
              Nueva tarea
            </Text>

            <Text style={styles.actionDescription}>
              Organiza las tareas de la casa
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => goTo('/shopping')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>+</Text>
            </View>

            <Text style={styles.actionTitle}>
              Lista de compras
            </Text>

            <Text style={styles.actionDescription}>
              Agrega productos a la lista
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionCard}
            onPress={() => goTo('/roommates')}
          >
            <View style={styles.actionIcon}>
              <Text style={styles.actionIconText}>•••</Text>
            </View>

            <Text style={styles.actionTitle}>
              Roomies
            </Text>

            <Text style={styles.actionDescription}>
              Administra los integrantes
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>
          Actividad reciente
        </Text>

        <View style={styles.activityCard}>
          <View style={styles.activityIcon}>
            <Text style={styles.activityIconText}>$</Text>
          </View>

          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>
              Compra del supermercado
            </Text>

            <Text style={styles.activityDescription}>
              Registrado por Sebastián
            </Text>
          </View>

          <Text style={styles.activityAmount}>
            $120.000
          </Text>
        </View>

        <View style={styles.activityCard}>
          <View style={styles.activityIcon}>
            <Text style={styles.activityIconText}>✓</Text>
          </View>

          <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>
              Limpieza de la cocina
            </Text>

            <Text style={styles.activityDescription}>
              Tarea completada
            </Text>
          </View>

          <Text style={styles.activityDate}>Hoy</Text>
        </View>
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <Pressable style={styles.navItem}>
          <Text style={styles.navIconActive}>⌂</Text>
          <Text style={styles.navTextActive}>Inicio</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => goTo('/expenses')}
        >
          <Text style={styles.navIcon}>$</Text>
          <Text style={styles.navText}>Gastos</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => goTo('/tasks')}
        >
          <Text style={styles.navIcon}>✓</Text>
          <Text style={styles.navText}>Tareas</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => goTo('/profile')}
        >
          <Text style={styles.navIcon}>●</Text>
          <Text style={styles.navText}>Perfil</Text>
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

  content: {
    paddingHorizontal: 20,
    paddingTop: 55,
    paddingBottom: 100,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  greeting: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111111',
  },

  subtitle: {
    fontSize: 14,
    color: '#777777',
    marginTop: 4,
  },

  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  notificationIcon: {
    fontSize: 16,
    color: '#E21B2D',
  },

  homeCard: {
    backgroundColor: '#E21B2D',
    borderRadius: 20,
    padding: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },

  homeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  homeName: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 5,
  },

  homeMembers: {
    color: '#FFFFFF',
    opacity: 0.85,
    fontSize: 13,
    marginTop: 3,
  },

  homeIcon: {
    width: 55,
    height: 55,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  houseIcon: {
    color: '#E21B2D',
    fontSize: 30,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
    marginBottom: 12,
  },

  balanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 12,
  },

  cardLabel: {
    color: '#777777',
    fontSize: 13,
  },

  balance: {
    color: '#111111',
    fontSize: 30,
    fontWeight: '800',
    marginTop: 5,
  },

  balanceDescription: {
    color: '#E21B2D',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },

  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
  },

  summaryIcon: {
    fontSize: 19,
    color: '#E21B2D',
    fontWeight: '800',
  },

  summaryNumber: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111111',
    marginTop: 8,
  },

  summaryLabel: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 25,
  },

  actionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
  },

  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FCE8EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  actionIconText: {
    color: '#E21B2D',
    fontSize: 18,
    fontWeight: '800',
  },

  actionTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  actionDescription: {
    color: '#888888',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },

  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  activityIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FCE8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activityIconText: {
    color: '#E21B2D',
    fontSize: 17,
    fontWeight: '800',
  },

  activityInfo: {
    flex: 1,
    marginLeft: 12,
  },

  activityTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },

  activityDescription: {
    color: '#888888',
    fontSize: 11,
    marginTop: 3,
  },

  activityAmount: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },

  activityDate: {
    color: '#888888',
    fontSize: 11,
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
});