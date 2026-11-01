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

import { Alert } from '../components/app-alert';
import { BottomNav } from '../components/bottom-nav';
import type { Gasto, Roomie } from '../firebase/firestore';
import {
  deleteGasto,
  getGastos,
  getRoomies,
  saveGasto,
} from '../firebase/firestore';
import { useAuthUser } from '../hooks/useAuthUser';

// Un gasto de la app: lo que guarda Firestore + datos para dividirlo.
type Expense = Gasto & {
  categoria?: string;
  saldado?: boolean;
  participantes?: string[]; // ids de los roomies que comparten el gasto
  participantesNombres?: Record<string, string>; // nombre de cada participante
  partes?: Record<string, number>; // cuánto paga cada uno (si no son iguales)
  pagos?: Record<string, boolean>; // true = ya pagó su parte
};

type Filter = 'Todos' | 'Pendientes' | 'Pagados';
type SplitMode = 'iguales' | 'personalizado';

type Debt = {
  from: string; // quien debe
  to: string; // a quien le debe
  amount: number;
};

const CATEGORIES = ['Comida', 'Servicios', 'Hogar', 'Otros'];
const FILTERS: Filter[] = ['Todos', 'Pendientes', 'Pagados'];

const toNumber = (value: string) => Number(value.replace(/[^0-9]/g, '')) || 0;

const formatCurrency = (value: number) =>
  `$${Math.round(value).toLocaleString('es-CO')}`;

const formatDate = (iso?: string) => {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

const categoryIcon = (category?: string) => {
  if (category === 'Comida') return '●';
  if (category === 'Servicios') return '⚡';
  if (category === 'Hogar') return '⌂';
  return '•';
};

// Reparte un valor en partes iguales (en pesos enteros, sin perder pesos).
const equalSplit = (total: number, ids: string[]) => {
  const result: Record<string, string> = {};
  if (ids.length === 0) return result;

  const base = Math.floor(total / ids.length);
  let rest = total - base * ids.length;

  ids.forEach((id) => {
    const extra = rest > 0 ? 1 : 0;
    rest -= extra;
    result[id] = String(base + extra);
  });

  return result;
};

export default function ExpensesScreen() {
  const { user, loading: authLoading } = useAuthUser();
  const uid = user?.uid ?? '';
  const myName = user?.displayName || user?.email || 'Yo';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>('Todos');

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [roommates, setRoommates] = useState<Roomie[]>([]);

  // Formulario (crear o editar)
  const [formVisible, setFormVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Comida');
  const [paidById, setPaidById] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('iguales');
  const [shares, setShares] = useState<Record<string, string>>({});

  // Detalle de un gasto y vista de deudas
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [debtsVisible, setDebtsVisible] = useState(false);
  const [settlingKey, setSettlingKey] = useState<string | null>(null);
  const [settleMessage, setSettleMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

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

      Promise.all([getGastos(uid), getRoomies(uid)])
        .then(([loadedExpenses, loadedRoomies]) => {
          if (!active) return;

          setExpenses(
            [...(loadedExpenses as Expense[])].sort(
              (a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)
            )
          );
          setRoommates(loadedRoomies);
        })
        .catch((error: any) => {
          if (!active) return;
          Alert.alert(
            'No se pudieron cargar los gastos',
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

  /* =========================
     AYUDANTES
  ========================= */

  const memberIds = roommates.length > 0 ? roommates.map((r) => r.id) : [uid];

  const payerOf = (expense: Expense) => expense.responsableId || uid;

  // Los gastos antiguos no tienen participantes: se dividen entre todos.
  const participantsOf = (expense: Expense) =>
    expense.participantes && expense.participantes.length > 0
      ? expense.participantes
      : memberIds;

  // Cuánto le toca pagar a una persona en un gasto.
  const shareOf = (expense: Expense, personId: string) => {
    if (expense.partes && expense.partes[personId] !== undefined) {
      return Number(expense.partes[personId]) || 0;
    }

    return (
      Number(expense.monto || 0) / Math.max(participantsOf(expense).length, 1)
    );
  };

  const hasPaid = (expense: Expense, personId: string) => {
    if (personId === payerOf(expense)) return true;
    if (expense.pagos) return !!expense.pagos[personId];
    return !!expense.saldado;
  };

  const isSettled = (expense: Expense) =>
    participantsOf(expense).every((id) => hasPaid(expense, id));

  const nameOf = (personId: string, expense?: Expense) => {
    if (personId === uid) return 'Tú';
    const roomie = roommates.find((r) => r.id === personId);
    if (roomie) return roomie.nombre;
    return expense?.participantesNombres?.[personId] ?? 'Ex roomie';
  };

  const shortNameOf = (personId: string) =>
    personId === uid
      ? 'Yo'
      : roommates.find((r) => r.id === personId)?.nombre ?? 'Roomie';

  /* =========================
     DEUDAS
  ========================= */

  // owed[a][b] = cuánto le debe a a b
  const debts: Debt[] = useMemo(() => {
    const owed: Record<string, Record<string, number>> = {};

    expenses.forEach((expense) => {
      const payer = payerOf(expense);

      participantsOf(expense).forEach((personId) => {
        if (personId === payer || hasPaid(expense, personId)) return;

        const share = shareOf(expense, personId);
        if (share <= 0) return;

        owed[personId] = owed[personId] ?? {};
        owed[personId][payer] = (owed[personId][payer] ?? 0) + share;
      });
    });

    // Compensamos las deudas cruzadas entre cada par de personas.
    const people = Array.from(
      new Set([
        ...Object.keys(owed),
        ...Object.values(owed).flatMap((item) => Object.keys(item)),
      ])
    );

    const result: Debt[] = [];

    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const a = people[i];
        const b = people[j];
        const diff = (owed[a]?.[b] ?? 0) - (owed[b]?.[a] ?? 0);

        if (diff > 0.5) result.push({ from: a, to: b, amount: diff });
        if (diff < -0.5) result.push({ from: b, to: a, amount: -diff });
      }
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenses, roommates, uid]);

  const theyOweMe = debts
    .filter((debt) => debt.to === uid)
    .reduce((total, debt) => total + debt.amount, 0);

  const iOwe = debts
    .filter((debt) => debt.from === uid)
    .reduce((total, debt) => total + debt.amount, 0);

  const myDebts = debts.filter((debt) => debt.from === uid || debt.to === uid);
  const otherDebts = debts.filter(
    (debt) => debt.from !== uid && debt.to !== uid
  );

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.monto || 0),
    0
  );

  // Lo que falta por pagar en la casa: partes de cada gasto aún sin pagar.
  const pendingTotal = expenses.reduce(
    (total, expense) =>
      total +
      participantsOf(expense)
        .filter((id) => !hasPaid(expense, id))
        .reduce((sum, id) => sum + shareOf(expense, id), 0),
    0
  );

  const filteredExpenses = expenses.filter((expense) => {
    if (filter === 'Pendientes') return !isSettled(expense);
    if (filter === 'Pagados') return isSettled(expense);
    return true;
  });

  const selectedExpense = expenses.find((item) => item.id === selectedId) ?? null;

  /* =========================
     GUARDAR EN FIREBASE
  ========================= */

  // Guarda un gasto y actualiza la lista al instante; si falla, la devuelve.
  const persist = async (updated: Expense) => {
    const previous = expenses;
    const withState: Expense = { ...updated, saldado: isSettled(updated) };

    setExpenses((current) =>
      current.map((item) => (item.id === withState.id ? withState : item))
    );

    try {
      await saveGasto(uid, withState);
      return true;
    } catch (error: any) {
      setExpenses(previous);
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Intenta de nuevo.'
      );
      return false;
    }
  };

  /* =========================
     FORMULARIO
  ========================= */

  const formTotal = toNumber(amount);

  const sharesSum = participants.reduce(
    (sum, id) => sum + toNumber(shares[id] ?? ''),
    0
  );

  const openNewExpense = () => {
    setEditingId(null);
    setTitle('');
    setAmount('');
    setCategory('Comida');
    setPaidById(uid);
    setParticipants(memberIds);
    setSplitMode('iguales');
    setShares({});
    setFormVisible(true);
  };

  const openEditExpense = (expense: Expense) => {
    const people = participantsOf(expense);
    const custom: Record<string, string> = {};

    people.forEach((id) => {
      custom[id] = String(Math.round(shareOf(expense, id)));
    });

    setSelectedId(null);
    setEditingId(expense.id);
    setTitle(expense.titulo);
    setAmount(String(expense.monto ?? ''));
    setCategory(expense.categoria ?? 'Otros');
    setPaidById(payerOf(expense));
    setParticipants(people);
    setSplitMode(expense.partes ? 'personalizado' : 'iguales');
    setShares(custom);
    setFormVisible(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormVisible(false);
  };

  const toggleParticipant = (personId: string) => {
    setParticipants((current) => {
      if (current.includes(personId)) {
        // Siempre debe quedar al menos una persona.
        return current.length === 1
          ? current
          : current.filter((id) => id !== personId);
      }
      return [...current, personId];
    });

    setShares((current) => {
      const next = { ...current };
      if (personId in next) delete next[personId];
      else next[personId] = '';
      return next;
    });
  };

  const changeSplitMode = (mode: SplitMode) => {
    setSplitMode(mode);

    // Al pasar a personalizado se arranca con partes iguales para editar.
    if (mode === 'personalizado') {
      setShares(equalSplit(formTotal, participants));
    }
  };

  const changeShare = (personId: string, value: string) => {
    setShares((current) => ({
      ...current,
      [personId]: value.replace(/[^0-9]/g, ''),
    }));
  };

  const saveExpense = async () => {
    if (!uid) return;

    if (!title.trim() || !amount.trim()) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa el nombre y el valor del gasto.'
      );
      return;
    }

    const numericAmount = toNumber(amount);

    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Valor inválido', 'Ingresa un valor válido.');
      return;
    }

    const payerId = paidById || uid;
    const payerName =
      payerId === uid
        ? myName
        : roommates.find((r) => r.id === payerId)?.nombre ?? 'Roomie';

    const previous = editingId
      ? expenses.find((item) => item.id === editingId)
      : undefined;

    let finalParticipants = [...participants];
    let partes: Record<string, number> | undefined;

    if (splitMode === 'personalizado' && roommates.length > 1) {
      partes = {};
      let sum = 0;

      participants.forEach((id) => {
        const value = toNumber(shares[id] ?? '');
        partes![id] = value;
        sum += value;
      });

      if (sum > numericAmount) {
        Alert.alert(
          'Las partes superan el total',
          `Las partes suman ${formatCurrency(sum)} y el gasto es de ${formatCurrency(
            numericAmount
          )}. Ajusta los valores para que no pasen del total.`
        );
        return;
      }

      // Lo que nadie asumió lo asume quien pagó.
      const rest = numericAmount - sum;

      if (rest > 0) {
        partes[payerId] = (partes[payerId] ?? 0) + rest;

        if (!finalParticipants.includes(payerId)) {
          finalParticipants = [...finalParticipants, payerId];
        }
      }
    }

    // Se conservan los pagos ya marcados de quienes siguen en el gasto.
    const pagos: Record<string, boolean> = {};
    const names: Record<string, string> = {};

    finalParticipants.forEach((personId) => {
      pagos[personId] =
        personId === payerId ||
        (previous ? !!previous.pagos?.[personId] : false);
      names[personId] =
        personId === uid
          ? myName
          : roommates.find((r) => r.id === personId)?.nombre ?? 'Roomie';
    });

    const expense: Expense = {
      id: previous?.id ?? Date.now().toString(),
      titulo: title.trim(),
      monto: numericAmount,
      categoria: category,
      responsableId: payerId,
      responsableNombre: payerName,
      participantes: finalParticipants,
      participantesNombres: names,
      pagos,
      fecha: previous?.fecha ?? new Date().toISOString(),
      createdAt: previous?.createdAt ?? Date.now(),
    };

    // Firebase no acepta campos vacíos: "partes" solo se guarda si se usa.
    if (partes) expense.partes = partes;

    expense.saldado = isSettled(expense);

    try {
      setSaving(true);
      await saveGasto(uid, expense);

      setExpenses((current) =>
        previous
          ? current.map((item) => (item.id === expense.id ? expense : item))
          : [expense, ...current]
      );

      setSaving(false);
      setFormVisible(false);

      Alert.alert(
        previous ? 'Gasto actualizado' : 'Gasto agregado',
        previous
          ? 'Los cambios se guardaron correctamente.'
          : 'El gasto se agregó correctamente.'
      );
    } catch (error: any) {
      setSaving(false);
      Alert.alert(
        'No se pudo guardar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  /* =========================
     ACCIONES DEL DETALLE
  ========================= */

  const togglePayment = (expense: Expense, personId: string) => {
    if (personId === payerOf(expense)) return;

    const pagos: Record<string, boolean> = {};
    participantsOf(expense).forEach((id) => {
      pagos[id] = hasPaid(expense, id);
    });
    pagos[personId] = !pagos[personId];

    persist({ ...expense, pagos });
  };

  // Elimina el gasto: desaparece de la lista al instante y luego de Firebase.
  const deleteExpenseNow = async (expense: Expense) => {
    const previous = expenses;

    setExpenses((current) => current.filter((item) => item.id !== expense.id));

    try {
      await deleteGasto(uid, expense.id);
    } catch (error: any) {
      setExpenses(previous);
      Alert.alert(
        'No se pudo eliminar',
        error?.message ?? 'Intenta de nuevo.'
      );
    }
  };

  const removeExpense = (expense: Expense) => {
    setSelectedId(null);

    Alert.alert(
      'Eliminar gasto',
      `¿Quieres eliminar "${expense.titulo}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => deleteExpenseNow(expense),
        },
      ]
    );
  };

  const debtText = (debt: Debt) => {
    if (debt.from === uid) return `Le debes a ${nameOf(debt.to)}`;
    if (debt.to === uid) return `${nameOf(debt.from)} te debe`;
    return `${nameOf(debt.from)} le debe a ${nameOf(debt.to)}`;
  };

  const debtKey = (debt: Debt) => `${debt.from}-${debt.to}`;

  const openDebts = () => {
    setSettleMessage(null);
    setDebtsVisible(true);
  };

  // Marca como pagadas todas las deudas pendientes entre dos personas.
  // Se hace dentro de la ventana de deudas y las tarjetas cambian al instante.
  const settleDebt = async (debt: Debt) => {
    if (settlingKey) return;

    const previous = expenses;

    const changed = expenses
      .filter((expense) => {
        const payer = payerOf(expense);
        const people = participantsOf(expense);
        return (
          (payer === debt.to &&
            people.includes(debt.from) &&
            !hasPaid(expense, debt.from)) ||
          (payer === debt.from &&
            people.includes(debt.to) &&
            !hasPaid(expense, debt.to))
        );
      })
      .map((expense) => {
        const pagos: Record<string, boolean> = {};
        participantsOf(expense).forEach((id) => {
          pagos[id] = hasPaid(expense, id);
        });
        if (payerOf(expense) === debt.to) pagos[debt.from] = true;
        if (payerOf(expense) === debt.from) pagos[debt.to] = true;

        const updated: Expense = { ...expense, pagos };
        updated.saldado = isSettled(updated);
        return updated;
      });

    if (changed.length === 0) {
      setSettleMessage({ type: 'error', text: 'Esta deuda ya estaba saldada.' });
      return;
    }

    const label = debtText(debt);

    // 1. Las tarjetas y la lista se actualizan al instante.
    setExpenses((current) =>
      current.map((item) => changed.find((c) => c.id === item.id) ?? item)
    );
    setSettlingKey(debtKey(debt));
    setSettleMessage(null);

    // 2. Se guarda en Firebase; si falla, se deshace el cambio.
    try {
      await Promise.all(changed.map((item) => saveGasto(uid, item)));

      setSettleMessage({
        type: 'success',
        text: `✓ Saldado: ${label} ${formatCurrency(
          debt.amount
        )}. Tu balance se actualizó.`,
      });
    } catch (error: any) {
      setExpenses(previous);
      setSettleMessage({
        type: 'error',
        text: `No se pudo guardar: ${error?.message ?? 'intenta de nuevo.'}`,
      });
    } finally {
      setSettlingKey(null);
    }
  };

  /* =========================
     PANTALLA
  ========================= */

  if (authLoading || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E21B2D" />
        <Text style={styles.loadingText}>Cargando tus gastos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>Gastos</Text>
            <Text style={styles.subtitle}>
              Controla los gastos de tu vivienda
            </Text>
          </View>

          <Pressable style={styles.addButton} onPress={openNewExpense}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>PENDIENTE POR SALDAR</Text>

          <Text style={styles.total}>{formatCurrency(pendingTotal)}</Text>

          <Text style={styles.totalSpent}>
            Total gastado: {formatCurrency(totalExpenses)}
          </Text>

          <View style={styles.balanceInfo}>
            <View>
              <Text style={styles.smallLabel}>Te deben</Text>
              <Text style={styles.receive}>+{formatCurrency(theyOweMe)}</Text>
            </View>

            <View>
              <Text style={styles.smallLabel}>Debes</Text>
              <Text style={styles.owe}>-{formatCurrency(iOwe)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.filterRow}>
          {FILTERS.map((item) => (
            <Pressable
              key={item}
              style={filter === item ? styles.activeFilter : styles.filter}
              onPress={() => setFilter(item)}
            >
              <Text
                style={
                  filter === item ? styles.activeFilterText : styles.filterText
                }
              >
                {item}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Gastos recientes</Text>

          <Text style={styles.expenseCount}>
            {filteredExpenses.length}{' '}
            {filteredExpenses.length === 1 ? 'gasto' : 'gastos'}
          </Text>
        </View>

        {filteredExpenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {expenses.length === 0
                ? 'Todavía no tienes gastos'
                : 'No hay gastos en este filtro'}
            </Text>
            <Text style={styles.emptyText}>
              {expenses.length === 0
                ? 'Toca el botón + para registrar el primer gasto de tu vivienda.'
                : 'Prueba con otro filtro para ver tus gastos.'}
            </Text>
          </View>
        ) : (
          filteredExpenses.map((expense) => {
            const settled = isSettled(expense);
            const people = participantsOf(expense);
            const paidCount = people.filter((id) => hasPaid(expense, id)).length;

            return (
              <Pressable
                key={expense.id}
                style={[styles.expenseCard, settled && styles.expenseCardSettled]}
                onPress={() => setSelectedId(expense.id)}
              >
                <View style={styles.expenseIcon}>
                  <Text style={styles.expenseIconText}>
                    {categoryIcon(expense.categoria)}
                  </Text>
                </View>

                <View style={styles.expenseInfo}>
                  <Text style={styles.expenseTitle}>{expense.titulo}</Text>

                  <Text style={styles.expenseDetails}>
                    {expense.categoria ?? 'Otros'} · Pagó{' '}
                    {payerOf(expense) === uid
                      ? 'tú'
                      : nameOf(payerOf(expense), expense)}
                  </Text>

                  <Text style={styles.expenseDate}>
                    {formatDate(expense.fecha)}
                    {people.length > 1
                      ? ` · ${paidCount}/${people.length} pagaron`
                      : ''}
                  </Text>
                </View>

                <View style={styles.expenseAmountContainer}>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(Number(expense.monto || 0))}
                  </Text>

                  <Text style={settled ? styles.paidText : styles.sharedText}>
                    {settled
                      ? 'Pagado'
                      : people.length > 1
                        ? `Compartido (${people.length})`
                        : 'Personal'}
                  </Text>
                </View>
              </Pressable>
            );
          })
        )}

        <Pressable style={styles.debtsButton} onPress={openDebts}>
          <View style={styles.flex}>
            <Text style={styles.debtsTitle}>Ver deudas y saldos</Text>

            <Text style={styles.debtsDescription}>
              {debts.length === 0
                ? 'Todos están a paz y salvo'
                : `${debts.length} ${
                    debts.length === 1 ? 'deuda pendiente' : 'deudas pendientes'
                  } en la casa`}
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </Pressable>
      </ScrollView>

      <BottomNav active="expenses" />

      {/* ========== FORMULARIO: NUEVO / EDITAR GASTO ========== */}
      <Modal
        animationType="slide"
        transparent
        visible={formVisible}
        onRequestClose={closeForm}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Editar gasto' : 'Nuevo gasto'}
              </Text>

              <Pressable onPress={closeForm}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
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
                {CATEGORIES.map((item) => (
                  <Pressable
                    key={item}
                    style={[
                      styles.categoryButton,
                      category === item && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(item)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === item && styles.categoryTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {roommates.length > 1 ? (
                <>
                  <Text style={styles.label}>¿Quién pagó?</Text>

                  <View style={styles.categories}>
                    {roommates.map((roomie) => (
                      <Pressable
                        key={roomie.id}
                        style={[
                          styles.categoryButton,
                          paidById === roomie.id && styles.categoryButtonActive,
                        ]}
                        onPress={() => setPaidById(roomie.id)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            paidById === roomie.id && styles.categoryTextActive,
                          ]}
                        >
                          {roomie.id === uid ? 'Yo' : roomie.nombre}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.label}>¿Entre quiénes se divide?</Text>

                  <View style={styles.categories}>
                    {roommates.map((roomie) => {
                      const active = participants.includes(roomie.id);

                      return (
                        <Pressable
                          key={roomie.id}
                          style={[
                            styles.categoryButton,
                            active && styles.categoryButtonActive,
                          ]}
                          onPress={() => toggleParticipant(roomie.id)}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              active && styles.categoryTextActive,
                            ]}
                          >
                            {active ? '✓ ' : ''}
                            {roomie.id === uid ? 'Yo' : roomie.nombre}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={styles.label}>¿Cuánto paga cada uno?</Text>

                  <View style={styles.categories}>
                    {(['iguales', 'personalizado'] as SplitMode[]).map((mode) => (
                      <Pressable
                        key={mode}
                        style={[
                          styles.categoryButton,
                          splitMode === mode && styles.categoryButtonActive,
                        ]}
                        onPress={() => changeSplitMode(mode)}
                      >
                        <Text
                          style={[
                            styles.categoryText,
                            splitMode === mode && styles.categoryTextActive,
                          ]}
                        >
                          {mode === 'iguales'
                            ? 'Partes iguales'
                            : 'Cada uno decide'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {splitMode === 'iguales' ? (
                    formTotal > 0 ? (
                      <Text style={styles.splitHint}>
                        A cada uno le toca{' '}
                        {formatCurrency(
                          formTotal / Math.max(participants.length, 1)
                        )}
                      </Text>
                    ) : null
                  ) : (
                    <View style={styles.sharesBox}>
                      {participants.map((personId) => (
                        <View key={personId} style={styles.shareRow}>
                          <Text style={styles.shareName}>
                            {shortNameOf(personId)}
                          </Text>

                          <TextInput
                            style={styles.shareInput}
                            placeholder="$ 0"
                            placeholderTextColor="#999"
                            value={shares[personId] ?? ''}
                            onChangeText={(value) =>
                              changeShare(personId, value)
                            }
                            keyboardType="numeric"
                          />
                        </View>
                      ))}

                      <Text
                        style={
                          sharesSum > formTotal
                            ? styles.shareError
                            : styles.shareSummary
                        }
                      >
                        {sharesSum > formTotal
                          ? `Las partes suman ${formatCurrency(
                              sharesSum
                            )} y pasan del total (${formatCurrency(formTotal)}).`
                          : sharesSum < formTotal
                            ? `Asignado ${formatCurrency(sharesSum)} de ${formatCurrency(
                                formTotal
                              )}. Los ${formatCurrency(
                                formTotal - sharesSum
                              )} restantes los asume quien pagó.`
                            : `✓ Asignado ${formatCurrency(sharesSum)} de ${formatCurrency(
                                formTotal
                              )}.`}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <Text style={styles.splitHint}>
                  Agrega roomies a tu vivienda para dividir los gastos.
                </Text>
              )}

              <Pressable
                style={[styles.saveButton, saving && styles.disabled]}
                onPress={saveExpense}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {editingId ? 'Guardar cambios' : 'Guardar gasto'}
                  </Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========== DETALLE DE UN GASTO ========== */}
      <Modal
        animationType="slide"
        transparent
        visible={selectedExpense !== null}
        onRequestClose={() => setSelectedId(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedExpense ? (
            <View style={styles.modal}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, styles.flex]} numberOfLines={2}>
                  {selectedExpense.titulo}
                </Text>

                <Pressable onPress={() => setSelectedId(null)}>
                  <Text style={styles.closeButton}>×</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailAmount}>
                    {formatCurrency(Number(selectedExpense.monto || 0))}
                  </Text>
                  <Text style={styles.detailMeta}>
                    {selectedExpense.categoria ?? 'Otros'} ·{' '}
                    {formatDate(selectedExpense.fecha)}
                  </Text>
                  <Text style={styles.detailMeta}>
                    Pagó{' '}
                    {payerOf(selectedExpense) === uid
                      ? 'tú'
                      : nameOf(payerOf(selectedExpense), selectedExpense)}{' '}
                    · Dividido entre {participantsOf(selectedExpense).length}
                    {selectedExpense.partes ? ' · Partes personalizadas' : ''}
                  </Text>
                </View>

                <Text style={styles.label}>¿Quién ya pagó su parte?</Text>

                {participantsOf(selectedExpense).map((personId) => {
                  const isPayer = personId === payerOf(selectedExpense);
                  const paid = hasPaid(selectedExpense, personId);
                  const share = shareOf(selectedExpense, personId);

                  return (
                    <View key={personId} style={styles.personRow}>
                      <View style={styles.flex}>
                        <Text style={styles.personName}>
                          {nameOf(personId, selectedExpense)}
                        </Text>
                        <Text style={styles.personShare}>
                          {isPayer
                            ? `Pagó el total · Su parte: ${formatCurrency(share)}`
                            : `Su parte: ${formatCurrency(share)}`}
                        </Text>
                      </View>

                      {isPayer ? (
                        <View style={[styles.statusChip, styles.statusPaid]}>
                          <Text style={styles.statusPaidText}>✓ Pagó</Text>
                        </View>
                      ) : (
                        <Pressable
                          style={[
                            styles.statusChip,
                            paid ? styles.statusPaid : styles.statusPending,
                          ]}
                          onPress={() => togglePayment(selectedExpense, personId)}
                        >
                          <Text
                            style={
                              paid
                                ? styles.statusPaidText
                                : styles.statusPendingText
                            }
                          >
                            {paid ? '✓ Pagado' : 'Marcar pagado'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  );
                })}

                <View style={styles.detailActions}>
                  <Pressable
                    style={[styles.outlineButton, styles.flex]}
                    onPress={() => openEditExpense(selectedExpense)}
                  >
                    <Text style={styles.outlineButtonText}>Editar</Text>
                  </Pressable>

                  <Pressable
                    style={[styles.dangerButton, styles.flex]}
                    onPress={() => removeExpense(selectedExpense)}
                  >
                    <Text style={styles.dangerButtonText}>Eliminar</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>
      </Modal>

      {/* ========== DEUDAS Y SALDOS ========== */}
      <Modal
        animationType="slide"
        transparent
        visible={debtsVisible}
        onRequestClose={() => setDebtsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Deudas y saldos</Text>

              <Pressable onPress={() => setDebtsVisible(false)}>
                <Text style={styles.closeButton}>×</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.debtSummary}>
                <View style={styles.flex}>
                  <Text style={styles.smallLabel}>Te deben</Text>
                  <Text style={styles.receive}>+{formatCurrency(theyOweMe)}</Text>
                </View>

                <View style={styles.flex}>
                  <Text style={styles.smallLabel}>Debes</Text>
                  <Text style={styles.owe}>-{formatCurrency(iOwe)}</Text>
                </View>
              </View>

              {settleMessage ? (
                <View
                  style={[
                    styles.messageBox,
                    settleMessage.type === 'success'
                      ? styles.messageSuccess
                      : styles.messageError,
                  ]}
                >
                  <Text
                    style={
                      settleMessage.type === 'success'
                        ? styles.messageSuccessText
                        : styles.messageErrorText
                    }
                  >
                    {settleMessage.text}
                  </Text>
                </View>
              ) : null}

              {roommates.filter((r) => r.id !== uid).length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Aún no tienes roomies</Text>
                  <Text style={styles.emptyText}>
                    Agrega roomies a tu vivienda para dividir los gastos y ver
                    quién le debe a quién.
                  </Text>
                </View>
              ) : debts.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Todos a paz y salvo 🎉</Text>
                  <Text style={styles.emptyText}>
                    No hay deudas pendientes en la casa.
                  </Text>
                </View>
              ) : (
                <>
                  {myDebts.length > 0 ? (
                    <Text style={styles.label}>Tus saldos</Text>
                  ) : null}

                  {myDebts.map((debt) => (
                    <View key={debtKey(debt)} style={styles.debtRow}>
                      <View>
                        <Text style={styles.personName}>{debtText(debt)}</Text>
                        <Text
                          style={debt.to === uid ? styles.receiveDark : styles.oweDark}
                        >
                          {formatCurrency(debt.amount)}
                        </Text>
                      </View>

                      <Pressable
                        style={[
                          styles.settleButton,
                          settlingKey !== null && styles.disabled,
                        ]}
                        onPress={() => settleDebt(debt)}
                        disabled={settlingKey !== null}
                      >
                        {settlingKey === debtKey(debt) ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.settleButtonText}>
                            Marcar como saldado
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  ))}

                  {otherDebts.length > 0 ? (
                    <Text style={styles.label}>Entre los demás</Text>
                  ) : null}

                  {otherDebts.map((debt) => (
                    <View key={debtKey(debt)} style={styles.debtRow}>
                      <View>
                        <Text style={styles.personName}>{debtText(debt)}</Text>
                        <Text style={styles.neutralAmount}>
                          {formatCurrency(debt.amount)}
                        </Text>
                      </View>

                      <Pressable
                        style={[
                          styles.settleButton,
                          settlingKey !== null && styles.disabled,
                        ]}
                        onPress={() => settleDebt(debt)}
                        disabled={settlingKey !== null}
                      >
                        {settlingKey === debtKey(debt) ? (
                          <ActivityIndicator color="#FFFFFF" />
                        ) : (
                          <Text style={styles.settleButtonText}>
                            Marcar como saldado
                          </Text>
                        )}
                      </Pressable>
                    </View>
                  ))}

                  <Text style={styles.splitHint}>
                    Las deudas cruzadas se compensan: si tú le debes a alguien y
                    esa persona te debe a ti, solo se muestra la diferencia.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
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

  flex: {
    flex: 1,
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 20,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },

  emptyTitle: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  emptyText: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 4,
  },

  expenseCardSettled: {
    opacity: 0.6,
  },

  disabled: {
    opacity: 0.7,
  },

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

  totalSpent: {
    color: '#AAAAAA',
    fontSize: 12,
    marginTop: 4,
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

  receiveDark: {
    color: '#16803C',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },

  oweDark: {
    color: '#E21B2D',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 3,
  },

  neutralAmount: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '800',
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

  paidText: {
    color: '#16803C',
    fontSize: 9,
    marginTop: 4,
    fontWeight: '700',
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
    maxHeight: '88%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111111',
  },

  closeButton: {
    fontSize: 30,
    color: '#777777',
    marginLeft: 12,
  },

  label: {
    fontSize: 13,
    color: '#222222',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 4,
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
    marginBottom: 18,
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

  splitHint: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 18,
    marginTop: -6,
  },

  sharesBox: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },

  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  shareName: {
    flex: 1,
    color: '#222222',
    fontSize: 14,
    fontWeight: '600',
  },

  shareInput: {
    width: 130,
    height: 44,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111111',
    backgroundColor: '#FFFFFF',
    textAlign: 'right',
  },

  shareSummary: {
    color: '#555555',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },

  shareError: {
    color: '#C62828',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    fontWeight: '700',
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

  detailCard: {
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  detailAmount: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },

  detailMeta: {
    color: '#BBBBBB',
    fontSize: 12,
    marginTop: 5,
  },

  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  personName: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '700',
  },

  personShare: {
    color: '#888888',
    fontSize: 12,
    marginTop: 2,
  },

  statusChip: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginLeft: 10,
  },

  statusPaid: {
    backgroundColor: '#E7F5EC',
  },

  statusPending: {
    backgroundColor: '#FCE8EA',
  },

  statusPaidText: {
    color: '#16803C',
    fontSize: 12,
    fontWeight: '700',
  },

  statusPendingText: {
    color: '#E21B2D',
    fontSize: 12,
    fontWeight: '700',
  },

  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },

  outlineButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E21B2D',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  outlineButtonText: {
    color: '#E21B2D',
    fontSize: 15,
    fontWeight: '700',
  },

  dangerButton: {
    height: 48,
    backgroundColor: '#B3121F',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  debtSummary: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  messageBox: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },

  messageSuccess: {
    backgroundColor: '#E7F5EC',
  },

  messageError: {
    backgroundColor: '#FCE8EA',
  },

  messageSuccessText: {
    color: '#16803C',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  messageErrorText: {
    color: '#C62828',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },

  debtRow: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },

  settleButton: {
    backgroundColor: '#E21B2D',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    alignItems: 'center',
  },

  settleButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});