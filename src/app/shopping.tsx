import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Alert } from '../components/app-alert';
import { ProfileIcon } from '../components/bottom-nav';
import type { Compra } from '../firebase/firestore';
import { deleteCompra, getCompras, saveCompra } from '../firebase/firestore';
import { useAuthUser } from '../hooks/useAuthUser';

// Un producto de la lista: lo que guarda Firestore + su categoría.
type ShoppingItem = Compra & {
  categoria?: string;
};

const categories = ['Todos', 'Comida', 'Limpieza', 'Hogar', 'Otros'];

export default function ShoppingScreen() {
  const { user, loading: authLoading } = useAuthUser();
  const uid = user?.uid;

  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Comida');

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

      getCompras(uid)
        .then((loaded) => {
          if (!active) return;

          setItems(
            [...(loaded as ShoppingItem[])].sort(
              (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)
            )
          );
        })
        .catch((error: any) => {
          if (!active) return;
          Alert.alert(
            'No se pudo cargar la lista',
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

  const pending = items.filter(item => !item.completada).length;
  const purchased = items.filter(item => item.completada).length;

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return items;
    }

    return items.filter(item => (item.categoria ?? 'Otros') === selectedCategory);
  }, [items, selectedCategory]);

  const openModal = () => {
    setItemName('');
    setQuantity('');
    setCategory('Comida');
    setModalVisible(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalVisible(false);
  };

  const togglePurchased = async (item: ShoppingItem) => {
    if (!uid) return;

    const updated: ShoppingItem = { ...item, completada: !item.completada };

    setItems(current =>
      current.map(entry => (entry.id === item.id ? updated : entry))
    );

    try {
      await saveCompra(uid, updated);
    } catch (error: any) {
      setItems(current =>
        current.map(entry => (entry.id === item.id ? item : entry))
      );
      Alert.alert(
        'No se pudo actualizar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  const deleteItem = (item: ShoppingItem) => {
    if (!uid) return;

    Alert.alert(
      'Eliminar producto',
      `¿Quieres eliminar "${item.nombre}" de la lista?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const previous = items;

            // Desaparece de la lista al instante y luego se borra de Firebase.
            setItems(current => current.filter(entry => entry.id !== item.id));

            try {
              await deleteCompra(uid, item.id);
            } catch (error: any) {
              setItems(previous);
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

  const addItem = async () => {
    if (!uid) return;

    if (!itemName.trim()) {
      Alert.alert('Falta información', 'Escribe el nombre del producto.');
      return;
    }

    const numericQuantity = Number(quantity.replace(/[^0-9]/g, ''));

    if (!numericQuantity || numericQuantity <= 0) {
      Alert.alert('Falta información', 'Escribe una cantidad válida.');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      nombre: itemName.trim(),
      cantidad: numericQuantity,
      categoria: category,
      completada: false,
      createdAt: Date.now(),
    };

    try {
      setSaving(true);
      await saveCompra(uid, newItem);

      setItems(current => [newItem, ...current]);
      setSaving(false);
      setModalVisible(false);
    } catch (error: any) {
      setSaving(false);
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  const clearPurchased = () => {
    if (!uid) return;

    if (purchased === 0) {
      Alert.alert('Lista limpia', 'No tienes productos comprados.');
      return;
    }

    Alert.alert(
      'Limpiar productos',
      '¿Quieres eliminar todos los productos marcados como comprados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const previous = items;
            const toDelete = items.filter(item => item.completada);

            // Desaparecen de la lista al instante y luego se borran de Firebase.
            setItems(current => current.filter(item => !item.completada));

            try {
              await Promise.all(toDelete.map(item => deleteCompra(uid, item.id)));
            } catch (error: any) {
              setItems(previous);
              Alert.alert(
                'No se pudieron eliminar',
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
        <Text style={styles.loadingText}>Cargando tu lista...</Text>
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

        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Lista de compras</Text>
          <Text style={styles.subtitle}>
            Compras compartidas de la casa
          </Text>
        </View>

        <Pressable
          style={styles.headerAddButton}
          onPress={openModal}
        >
          <Text style={styles.headerAddText}>+</Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.summaryCard}>
          <View style={styles.summaryMain}>
            <Text style={styles.summaryNumber}>{pending}</Text>
            <Text style={styles.summaryLabel}>Pendientes</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryMain}>
            <Text style={styles.summaryNumber}>{purchased}</Text>
            <Text style={styles.summaryLabel}>Comprados</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Productos</Text>

          <Pressable onPress={clearPurchased}>
            <Text style={styles.clearText}>Limpiar comprados</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {categories.map(option => (
            <Pressable
              key={option}
              style={[
                styles.filter,
                selectedCategory === option && styles.filterActive,
              ]}
              onPress={() => setSelectedCategory(option)}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === option && styles.filterTextActive,
                ]}
              >
                {option}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>
              No hay productos
            </Text>
            <Text style={styles.emptyText}>
              Agrega productos para comenzar tu lista de compras.
            </Text>

            <Pressable
              style={styles.emptyButton}
              onPress={openModal}
            >
              <Text style={styles.emptyButtonText}>
                Agregar producto
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredItems.map(item => (
              <View
                key={item.id}
                style={[
                  styles.itemCard,
                  item.completada && styles.itemPurchased,
                ]}
              >
                <Pressable
                  style={[
                    styles.checkbox,
                    item.completada && styles.checkboxActive,
                  ]}
                  onPress={() => togglePurchased(item)}
                >
                  {item.completada && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.itemInfo}
                  onPress={() => togglePurchased(item)}
                >
                  <Text
                    style={[
                      styles.itemName,
                      item.completada && styles.itemNamePurchased,
                    ]}
                  >
                    {item.nombre}
                  </Text>

                  <Text style={styles.itemDetails}>
                    Cantidad: {item.cantidad ?? 1} · {item.categoria ?? 'Otros'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item)}
                >
                  <Text style={styles.deleteText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Lista guardada</Text>
          <Text style={styles.infoText}>
            Los productos se guardan en tu cuenta y siguen ahí aunque
            cierres sesión.
          </Text>
        </View>
      </ScrollView>

      <Pressable
        style={styles.floatingButton}
        onPress={openModal}
      >
        <Text style={styles.floatingText}>+</Text>
      </Pressable>

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

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Agregar producto
              </Text>

              <Pressable onPress={closeModal}>
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.inputLabel}>Producto</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Huevos"
              placeholderTextColor="#999"
              value={itemName}
              onChangeText={setItemName}
            />

            <Text style={styles.inputLabel}>Cantidad</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. 2"
              placeholderTextColor="#999"
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Categoría</Text>

            <View style={styles.categoryContainer}>
              {categories.slice(1).map(option => (
                <Pressable
                  key={option}
                  style={[
                    styles.categoryButton,
                    category === option && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(option)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      category === option &&
                        styles.categoryTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[styles.addButton, saving && styles.disabled]}
              onPress={addItem}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.addButtonText}>
                  Agregar a la lista
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
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

  disabled: {
    opacity: 0.7,
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 16,
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

  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 21,
    fontWeight: '700',
    color: '#111111',
  },

  subtitle: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },

  headerAddButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerAddText: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 30,
  },

  content: {
    padding: 18,
    paddingBottom: 110,
  },

  summaryCard: {
    backgroundColor: '#111111',
    borderRadius: 18,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  summaryMain: {
    flex: 1,
    alignItems: 'center',
  },

  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },

  summaryLabel: {
    color: '#BBBBBB',
    fontSize: 13,
    marginTop: 3,
  },

  summaryDivider: {
    width: 1,
    height: 42,
    backgroundColor: '#444444',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#111111',
  },

  clearText: {
    color: '#E21B2D',
    fontSize: 12,
    fontWeight: '600',
  },

  filters: {
    gap: 8,
    paddingBottom: 18,
  },

  filter: {
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },

  filterActive: {
    backgroundColor: '#E21B2D',
    borderColor: '#E21B2D',
  },

  filterText: {
    color: '#555555',
    fontSize: 13,
    fontWeight: '600',
  },

  filterTextActive: {
    color: '#FFFFFF',
  },

  list: {
    gap: 10,
  },

  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },

  itemPurchased: {
    opacity: 0.65,
  },

  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkboxActive: {
    backgroundColor: '#E21B2D',
    borderColor: '#E21B2D',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },

  itemName: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '700',
  },

  itemNamePurchased: {
    textDecorationLine: 'line-through',
    color: '#777777',
  },

  itemDetails: {
    color: '#888888',
    fontSize: 12,
    marginTop: 4,
  },

  deleteButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteText: {
    fontSize: 25,
    color: '#999999',
  },

  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 30,
    alignItems: 'center',
    marginTop: 5,
  },

  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },

  emptyText: {
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 6,
  },

  emptyButton: {
    backgroundColor: '#E21B2D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 18,
  },

  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  infoCard: {
    backgroundColor: '#FFF1F2',
    borderRadius: 15,
    padding: 16,
    marginTop: 22,
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

  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 78,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  floatingText: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 38,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    paddingBottom: 35,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#111111',
  },

  closeText: {
    fontSize: 30,
    color: '#777777',
  },

  inputLabel: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 5,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#111111',
    backgroundColor: '#FAFAFA',
    marginBottom: 10,
  },

  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },

  categoryButton: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: '#F2F2F2',
  },

  categoryButtonActive: {
    backgroundColor: '#E21B2D',
  },

  categoryText: {
    color: '#555555',
    fontSize: 12,
    fontWeight: '600',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  addButton: {
    height: 50,
    borderRadius: 11,
    backgroundColor: '#E21B2D',
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});