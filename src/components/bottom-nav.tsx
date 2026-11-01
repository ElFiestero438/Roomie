/// Barra de navegación inferior de Roomie, igual en todas las pantallas.

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Tab = 'home' | 'expenses' | 'tasks' | 'profile';

const ACTIVE = '#E21B2D';
const INACTIVE = '#999999';

// Ícono de persona (cabeza + cuerpo) dibujado con Views.
export function ProfileIcon({ color = INACTIVE }: { color?: string }) {
  return (
    <View style={styles.profileIcon}>
      <View style={[styles.profileHead, { backgroundColor: color }]} />
      <View style={[styles.profileBody, { backgroundColor: color }]} />
    </View>
  );
}

export function BottomNav({ active }: { active: Tab }) {
  const go = (tab: Tab, path: '/home' | '/expenses' | '/tasks' | '/profile') => {
    if (tab !== active) router.push(path);
  };

  const label = (tab: Tab, text: string) => (
    <Text style={active === tab ? styles.textActive : styles.text}>{text}</Text>
  );

  const glyph = (tab: Tab, symbol: string) => (
    <Text style={active === tab ? styles.iconActive : styles.icon}>{symbol}</Text>
  );

  return (
    <View style={styles.bar}>
      <Pressable style={styles.item} onPress={() => go('home', '/home')}>
        {glyph('home', '⌂')}
        {label('home', 'Inicio')}
      </Pressable>

      <Pressable style={styles.item} onPress={() => go('expenses', '/expenses')}>
        {glyph('expenses', '$')}
        {label('expenses', 'Gastos')}
      </Pressable>

      <Pressable style={styles.item} onPress={() => go('tasks', '/tasks')}>
        {glyph('tasks', '✓')}
        {label('tasks', 'Tareas')}
      </Pressable>

      <Pressable style={styles.item} onPress={() => go('profile', '/profile')}>
        <ProfileIcon color={active === 'profile' ? ACTIVE : INACTIVE} />
        {label('profile', 'Perfil')}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
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

  item: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },

  icon: {
    color: INACTIVE,
    fontSize: 19,
    height: 24,
  },

  iconActive: {
    color: ACTIVE,
    fontSize: 19,
    height: 24,
  },

  text: {
    color: INACTIVE,
    fontSize: 11,
    marginTop: 4,
  },

  textActive: {
    color: ACTIVE,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },

  profileIcon: {
    height: 24,
    width: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  profileHead: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginBottom: 2,
  },

  profileBody: {
    width: 17,
    height: 8,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    marginBottom: 2,
  },
});