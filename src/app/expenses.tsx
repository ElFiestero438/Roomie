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

type Expense = {
  id: number;
  title: string;
  category: string;
  paidBy: string;
  amount: number;
  date: string;
};

export default function ExpensesScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida');

  const [expenses, setExpenses] = useState<Expense[]>([
    {
      id: 1,
      title: 'Compra del supermercado',
      category: 'Comida',
      paidBy: 'Sebastián',
      amount: 120000,
      date: 'Hoy',
    },
    {
      id: 2,
      title: 'Servicio de internet',
      category: 'Servicios',
      paidBy: 'Carlos',
      amount: 80000,
      date: 'Ayer',
    },
    {
      id: 3,
      title: 'Productos de limpieza',
      category: 'Hogar',
      paidBy: 'Laura',
      amount: 45000,
      date: '5 Sep',
    },
  ]);

  const totalExpenses = expenses.reduce(
    (total, expense) => total + expense.amount,
    0
  );

  const addExpense = () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa el nombre y el valor del gasto.'
      );
      return;
    }

    const numericAmount = Number(amount.replace(/[^0-9]/g, ''));

    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Valor inválido', 'Ingresa un valor válido.');
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      title: title.trim(),
      category,
      paidBy: 'Sebastián',
      amount: numericAmount,
      date: 'Ahora',
    };

    setExpenses((current) => [newExpense, ...current]);

    setTitle('');
    setAmount('');
    setCategory('Comida');
    setModalVisible(false);

    Alert.alert('Gasto agregado', 'El gasto se agregó correctamente.');
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('es-CO')}`;
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

          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Gastos</Text>
            <Text style={styles.subtitle}>
              Controla los gastos de tu vivienda
            </Text>
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>TOTAL DE GASTOS</Text>

          <Text style={styles.total}>
            {formatCurrency(totalExpenses)}
          </Text>

          <View style={styles.balanceInfo}>
            <View>
              <Text style={styles.smallLabel}>Te deben</Text>
              <Text style={styles.receive}>+$85.000</Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>Debes</Text>
              <Text style={styles.owe}>-$25.000</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          <Pressable style={styles.activeFilter}>
            <Text style={styles.activeFilterText}>Todos</Text>
          </Pressable>

          <Pressable style={styles.filter}>
            <Text style={styles.filterText}>Pendientes</Text>
          </Pressable>

          <Pressable style={styles.filter}>
            <Text style={styles.filterText}>Pagados</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos recientes</Text>

          <Text style={styles.expenseCount}>
            {expenses.length} gastos
          </Text>
        </View>

        {expenses.map((expense) => (
          <Pressable
            key={expense.id}
            style={styles.expenseCard}
            onPress={() =>
              Alert.alert(
                expense.title,
                `Categoría: ${expense.category}\nPagado por: ${expense.paidBy}\nValor: ${formatCurrency(
                  expense.amount
                )}\nFecha: ${expense.date}`
              )
            }
          >
            <View style={styles.expenseIcon}>
              <Text style={styles.expenseIconText}>
                {expense.category === 'Comida'
                  ? '●'
                  : expense.category === 'Servicios'
                  ? '⚡'
                  : '⌂'}
              </Text>
            </View>

            <View style={styles.expenseInfo}>
              <Text style={styles.expenseTitle}>
                {expense.title}
              </Text>

              <Text style={styles.expenseDetails}>
                {expense.category} · Pagó {expense.paidBy}
              </Text>

              <Text style={styles.expenseDate}>{expense.date}</Text>
            </View>

            <View style={styles.expenseAmountContainer}>
              <Text style={styles.expenseAmount}>
                {formatCurrency(expense.amount)}
              </Text>

              <Text style={styles.sharedText}>Compartido</Text>
            </View>
          </Pressable>
        ))}

        <Pressable
          style={styles.debtsButton}
          onPress={() =>
            Alert.alert(
              'Deudas',
              'Aquí veremos cuánto debe pagar cada integrante.'
            )
          }
        >
          <View>
            <Text style={styles.debtsTitle}>
              Ver deudas y saldos
            </Text>

            <Text style={styles.debtsDescription}>
              Consulta quién debe dinero y a quién
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
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

        <Pressable style={styles.navItem}>
          <Text style={styles.navIconActive}>$</Text>
          <Text style={styles.navTextActive}>Gastos</Text>
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
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo gasto</Text>

              <Pressable
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.label}>Nombre del gasto</Text>

            <TextInput
              style={styles.input}
              placeholder="Ej. Compra del mercado"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Valor</Text>

            <TextInput
              style={styles.input}
              placeholder="$ 0"
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Categoría</Text>

            <View style={styles.categories}>
              {['Comida', 'Servicios', 'Hogar', 'Otros'].map(
                (item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.categoryButton,
                      category === item &&
                        styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(item)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === item &&
                          styles.categoryTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )
              )}
            </View>

            <Pressable
              style={styles.saveButton}
              onPress={addExpense}
            >
              <Text style={styles.saveButtonText}>
                Guardar gasto
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

  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111111',
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
    fontWeight: '500',
    lineHeight: 28,
  },

  balanceCard: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
  },

  balanceLabel: {
    color: '#AAAAAA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  total: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 7,
  },

  balanceInfo: {
    flexDirection: 'row',
    gap: 45,
    marginTop: 18,
  },

  smallLabel: {
    color: '#AAAAAA',
    fontSize: 11,
  },

  receive: {
    color: '#5FCF82',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },

  owe: {
    color: '#FF6B6B',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 3,
  },

  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 25,
  },

  activeFilter: {
    backgroundColor: '#E21B2D',
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 20,
  },

  activeFilterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  filter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 17,
    paddingVertical: 9,
    borderRadius: 20,
  },

  filterText: {
    color: '#777777',
    fontSize: 12,
    fontWeight: '600',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111111',
  },

  expenseCount: {
    color: '#999999',
    fontSize: 12,
  },

  expenseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },

  expenseIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#FCE8EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  expenseIconText: {
    color: '#E21B2D',
    fontSize: 17,
    fontWeight: '800',
  },

  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },

  expenseTitle: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '700',
  },

  expenseDetails: {
    color: '#777777',
    fontSize: 11,
    marginTop: 4,
  },

  expenseDate: {
    color: '#AAAAAA',
    fontSize: 10,
    marginTop: 2,
  },

  expenseAmountContainer: {
    alignItems: 'flex-end',
  },

  expenseAmount: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '800',
  },

  sharedText: {
    color: '#E21B2D',
    fontSize: 9,
    marginTop: 4,
    fontWeight: '600',
  },

  debtsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 18,
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  debtsTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  debtsDescription: {
    color: '#888888',
    fontSize: 11,
    marginTop: 4,
  },

  arrow: {
    color: '#E21B2D',
    fontSize: 30,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },

  closeButton: {
    fontSize: 30,
    color: '#777777',
  },

  label: {
    fontSize: 13,
    color: '#222222',
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

  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 22,
  },

  categoryButton: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },

  categoryButtonActive: {
    backgroundColor: '#E21B2D',
    borderColor: '#E21B2D',
  },

  categoryText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
  },

  categoryTextActive: {
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