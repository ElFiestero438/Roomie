import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
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

import type { Roomie, Tarea } from '../firebase/firestore';
import { getRoomies, getTareas, saveTarea } from '../firebase/firestore';
import { useAuthUser } from '../hooks/useAuthUser';

export default function TasksScreen() {
  const { user, loading: authLoading } = useAuthUser();
  const uid = user?.uid;

  const [modalVisible, setModalVisible] = useState(false);
  const [filter, setFilter] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [assignedId, setAssignedId] = useState('');
  const [priority, setPriority] = useState('Media');
  const [date, setDate] = useState('');

  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [roommates, setRoommates] = useState<Roomie[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!uid) {
        setTasks([]);
        setRoommates([]);
        setLoading(false);
        return;
      }

      let active = true;
      setLoading(true);

      Promise.all([getTareas(uid), getRoomies(uid)])
        .then(([loadedTasks, loadedRoomies]) => {
          if (!active) return;

          setTasks(
            [...loadedTasks].sort(
              (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)
            )
          );
          setRoommates(loadedRoomies);
        })
        .catch((error: any) => {
          Alert.alert(
            'No se pudieron cargar las tareas',
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

  const isLoading = authLoading || loading;

  const pendingTasks = tasks.filter((task) => !task.completada).length;
  const completedTasks = tasks.filter((task) => task.completada).length;

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'Pendientes') return !task.completada;
    if (filter === 'Completadas') return task.completada;
    return true;
  });

  const toggleTask = async (task: Tarea) => {
    const updated: Tarea = { ...task, completada: !task.completada };

    setTasks((current) =>
      current.map((item) => (item.id === task.id ? updated : item))
    );

    if (!uid) return;

    try {
      await saveTarea(uid, updated);
    } catch (error: any) {
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? task : item))
      );
      Alert.alert(
        'No se pudo actualizar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  const addTask = async () => {
    if (!uid) {
      Alert.alert('Sesión requerida', 'Inicia sesión para crear tareas.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Campo incompleto', 'Escribe el nombre de la tarea.');
      return;
    }

    const roommate = roommates.find((item) => item.id === assignedId);

    const newTask: Tarea = {
      id: Date.now().toString(),
      titulo: title.trim(),
      responsableId: roommate?.id ?? '',
      responsableNombre: roommate?.nombre ?? '',
      prioridad: priority,
      fecha: date.trim() || 'Sin fecha',
      completada: false,
      createdAt: Date.now(),
    };

    try {
      setSaving(true);
      await saveTarea(uid, newTask);

      setTasks((current) => [newTask, ...current]);

      setTitle('');
      setAssignedId('');
      setPriority('Media');
      setDate('');
      setModalVisible(false);

      Alert.alert('Tarea creada', 'La tarea se agregó correctamente.');
    } catch (error: any) {
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Intenta de nuevo.'
      );
    } finally {
      setSaving(false);
    }
  };

  const priorityStyle = (value?: string) => {
    if (value === 'Alta') return styles.highPriority;
    if (value === 'Media') return styles.mediumPriority;
    return styles.lowPriority;
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
            <Text style={styles.title}>Tareas</Text>
            <Text style={styles.subtitle}>
              Organiza las tareas de la vivienda
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingTasks}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedTasks}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          {['Todas', 'Pendientes', 'Completadas'].map((item) => (
            <Pressable
              key={item}
              style={[
                styles.filterButton,
                filter === item && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(item)}
            >
              <Text
                style={[
                  styles.filterText,
                  filter === item && styles.filterTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lista de tareas</Text>
          <Text style={styles.taskCount}>{filteredTasks.length}</Text>
        </View>

        {filteredTasks.map((task) => (
          <Pressable
            key={task.id}
            style={[
              styles.taskCard,
              task.completada && styles.completedCard,
            ]}
            onPress={() => toggleTask(task)}
          >
            <View
              style={[
                styles.checkbox,
                task.completada && styles.checkboxCompleted,
              ]}
            >
              {task.completada && <Text style={styles.check}>✓</Text>}
            </View>

            <View style={styles.taskInfo}>
              <Text
                style={[
                  styles.taskTitle,
                  task.completada && styles.completedText,
                ]}
              >
                {task.titulo}
              </Text>

              <Text style={styles.assignedText}>
                {task.responsableNombre
                  ? `Asignada a ${task.responsableNombre}`
                  : 'Sin asignar'}
              </Text>

              <View style={styles.taskBottom}>
                <View style={priorityStyle(task.prioridad)}>
                  <Text style={styles.priorityText}>
                    {task.prioridad ?? 'Media'}
                  </Text>
                </View>

                <Text style={styles.dateText}>{task.fecha}</Text>
              </View>
            </View>
          </Pressable>
        ))}

        {filteredTasks.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>✓</Text>
            <Text style={styles.emptyTitle}>
              {isLoading ? 'Cargando...' : 'No hay tareas'}
            </Text>
            {!isLoading && (
              <Text style={styles.emptyText}>
                {tasks.length === 0
                  ? 'Aún no has creado tareas. Toca + para agregar la primera.'
                  : 'No existen tareas en esta categoría.'}
              </Text>
            )}
          </View>
        )}
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

        <Pressable style={styles.navItem}>
          <Text style={styles.navIconActive}>✓</Text>
          <Text style={styles.navTextActive}>Tareas</Text>
        </Pressable>

        <Pressable
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.navIcon}>●</Text>
          <Text style={styles.navText}>Perfil</Text>
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
              <Text style={styles.modalTitle}>Nueva tarea</Text>

              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Nombre de la tarea</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Limpiar la cocina"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Asignar a</Text>

            <View style={styles.optionsContainer}>
              {roommates.length === 0 ? (
                <Text style={styles.assignedText}>
                  Aún no tienes roomies. Agrégalos en la sección Roomies.
                </Text>
              ) : (
                roommates.map((roommate) => (
                  <Pressable
                    key={roommate.id}
                    style={[
                      styles.optionButton,
                      assignedId === roommate.id &&
                        styles.optionButtonActive,
                    ]}
                    onPress={() =>
                      setAssignedId(
                        assignedId === roommate.id ? '' : roommate.id
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.optionText,
                        assignedId === roommate.id &&
                          styles.optionTextActive,
                      ]}
                    >
                      {roommate.nombre}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            <Text style={styles.label}>Prioridad</Text>

            <View style={styles.optionsContainer}>
              {['Alta', 'Media', 'Baja'].map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.optionButton,
                    priority === item && styles.optionButtonActive,
                  ]}
                  onPress={() => setPriority(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      priority === item && styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Fecha</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Mañana o 15 Sep"
              placeholderTextColor="#999"
              value={date}
              onChangeText={setDate}
            />

            <Pressable
              style={styles.saveButton}
              onPress={addTask}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Guardando...' : 'Crear tarea'}
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
    lineHeight: 28,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
  },

  statNumber: {
    color: '#111111',
    fontSize: 27,
    fontWeight: '800',
  },

  statLabel: {
    color: '#777777',
    fontSize: 12,
    marginTop: 3,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 25,
  },

  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },

  filterButtonActive: {
    backgroundColor: '#E21B2D',
  },

  filterText: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#FFFFFF',
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

  taskCount: {
    color: '#999999',
    fontSize: 12,
  },

  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
  },

  completedCard: {
    opacity: 0.65,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },

  checkboxCompleted: {
    backgroundColor: '#E21B2D',
    borderColor: '#E21B2D',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },

  taskTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  completedText: {
    textDecorationLine: 'line-through',
    color: '#888888',
  },

  assignedText: {
    color: '#777777',
    fontSize: 11,
    marginTop: 4,
  },

  taskBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },

  highPriority: {
    backgroundColor: '#FCE1E4',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  mediumPriority: {
    backgroundColor: '#FFF0D6',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  lowPriority: {
    backgroundColor: '#E4F5E9',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },

  priorityText: {
    color: '#555555',
    fontSize: 9,
    fontWeight: '700',
  },

  dateText: {
    color: '#999999',
    fontSize: 10,
    marginLeft: 10,
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 35,
    alignItems: 'center',
  },

  emptyIcon: {
    color: '#E21B2D',
    fontSize: 30,
    fontWeight: '800',
  },

  emptyTitle: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
  },

  emptyText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 5,
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
    marginBottom: 22,
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
    marginBottom: 17,
  },

  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },

  optionButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  optionButtonActive: {
    backgroundColor: '#E21B2D',
    borderColor: '#E21B2D',
  },

  optionText: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '600',
  },

  optionTextActive: {
    color: '#FFFFFF',
  },

  saveButton: {
    height: 52,
    backgroundColor: '#E21B2D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});