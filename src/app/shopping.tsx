import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    Alert,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

type ShoppingItem = {
  id: number;
  name: string;
  quantity: string;
  category: string;
  purchased: boolean;
};

const categories = ['Todos', 'Comida', 'Limpieza', 'Hogar', 'Otros'];

export default function ShoppingScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([
    {
      id: 1,
      name: 'Leche',
      quantity: '2',
      category: 'Comida',
      purchased: false,
    },
    {
      id: 2,
      name: 'Arroz',
      quantity: '1',
      category: 'Comida',
      purchased: false,
    },
    {
      id: 3,
      name: 'Jabón para platos',
      quantity: '2',
      category: 'Limpieza',
      purchased: true,
    },
    {
      id: 4,
      name: 'Papel higiénico',
      quantity: '1',
      category: 'Hogar',
      purchased: false,
    },
  ]);

  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [category, setCategory] = useState('Comida');

  const pending = items.filter(item => !item.purchased).length;
  const purchased = items.filter(item => item.purchased).length;

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'Todos') {
      return items;
    }

    return items.filter(item => item.category === selectedCategory);
  }, [items, selectedCategory]);

  const togglePurchased = (id: number) => {
    setItems(current =>
      current.map(item =>
        item.id === id
          ? { ...item, purchased: !item.purchased }
          : item
      )
    );
  };

  const deleteItem = (id: number) => {
    Alert.alert(
      'Eliminar producto',
      '¿Quieres eliminar este producto de la lista?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setItems(current => current.filter(item => item.id !== id));
          },
        },
      ]
    );
  };

  const addItem = () => {
    if (!itemName.trim()) {
      Alert.alert('Falta información', 'Escribe el nombre del producto.');
      return;
    }

    if (!quantity.trim()) {
      Alert.alert('Falta información', 'Escribe la cantidad.');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now(),
      name: itemName.trim(),
      quantity: quantity.trim(),
      category,
      purchased: false,
    };

    setItems(current => [newItem, ...current]);

    setItemName('');
    setQuantity('');
    setCategory('Comida');
    setModalVisible(false);
  };

  const clearPurchased = () => {
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
          onPress: () => {
            setItems(current => current.filter(item => !item.purchased));
          },
        },
      ]
    );
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

        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Lista de compras</Text>
          <Text style={styles.subtitle}>
            Compras compartidas de la casa
          </Text>
        </View>

        <Pressable
          style={styles.headerAddButton}
          onPress={() => setModalVisible(true)}
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
              onPress={() => setModalVisible(true)}
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
                  item.purchased && styles.itemPurchased,
                ]}
              >
                <Pressable
                  style={[
                    styles.checkbox,
                    item.purchased && styles.checkboxActive,
                  ]}
                  onPress={() => togglePurchased(item.id)}
                >
                  {item.purchased && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </Pressable>

                <Pressable
                  style={styles.itemInfo}
                  onPress={() => togglePurchased(item.id)}
                >
                  <Text
                    style={[
                      styles.itemName,
                      item.purchased && styles.itemNamePurchased,
                    ]}
                  >
                    {item.name}
                  </Text>

                  <Text style={styles.itemDetails}>
                    Cantidad: {item.quantity} · {item.category}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Text style={styles.deleteText}>×</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Lista compartida</Text>
          <Text style={styles.infoText}>
            Los productos agregados podrán ser consultados por todos
            los integrantes de la casa.
          </Text>
        </View>
      </ScrollView>

      <Pressable
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
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
          <Text style={styles.navIcon}>●</Text>
          <Text style={styles.navText}>Perfil</Text>
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Agregar producto
              </Text>

              <Pressable onPress={() => setModalVisible(false)}>
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
              style={styles.addButton}
              onPress={addItem}
            >
              <Text style={styles.addButtonText}>
                Agregar a la lista
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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