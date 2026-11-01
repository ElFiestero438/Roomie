/// Calcula el balance de gastos (total, te deben y debes) con las mismas
/// reglas de la pestaña Gastos, para que Inicio muestre los mismos valores.

import type { Gasto, Roomie } from '../firebase/firestore';

type ExpenseData = Gasto & {
  saldado?: boolean;
  participantes?: string[];
  partes?: Record<string, number>;
  pagos?: Record<string, boolean>;
};

export type Balance = {
  total: number; // suma de todos los gastos
  pending: number; // lo que falta por pagar en la casa
  theyOweMe: number; // lo que te deben
  iOwe: number; // lo que debes
};

export function calculateBalance(
  gastos: Gasto[],
  roomies: Roomie[],
  uid: string
): Balance {
  const expenses = gastos as ExpenseData[];
  const memberIds = roomies.length > 0 ? roomies.map((r) => r.id) : [uid];

  const payerOf = (e: ExpenseData) => e.responsableId || uid;

  const participantsOf = (e: ExpenseData) =>
    e.participantes && e.participantes.length > 0 ? e.participantes : memberIds;

  const hasPaid = (e: ExpenseData, personId: string) => {
    if (personId === payerOf(e)) return true;
    if (e.pagos) return !!e.pagos[personId];
    return !!e.saldado;
  };

  // owed[a][b] = cuánto le debe a a b
  const owed: Record<string, Record<string, number>> = {};
  let pending = 0;

  expenses.forEach((e) => {
    const payer = payerOf(e);
    const people = participantsOf(e);
    const equalShare = Number(e.monto || 0) / Math.max(people.length, 1);

    people.forEach((personId) => {
      if (personId === payer || hasPaid(e, personId)) return;

      // Si el gasto tiene partes personalizadas se usa la de cada persona.
      const share =
        e.partes && e.partes[personId] !== undefined
          ? Number(e.partes[personId]) || 0
          : equalShare;
      if (share <= 0) return;

      pending += share;
      owed[personId] = owed[personId] ?? {};
      owed[personId][payer] = (owed[personId][payer] ?? 0) + share;
    });
  });

  // Igual que en Gastos: las deudas cruzadas se compensan por pareja.
  let theyOweMe = 0;
  let iOwe = 0;

  const others = new Set([
    ...Object.keys(owed),
    ...Object.values(owed).flatMap((item) => Object.keys(item)),
  ]);
  others.delete(uid);

  others.forEach((other) => {
    const diff = (owed[other]?.[uid] ?? 0) - (owed[uid]?.[other] ?? 0);

    if (diff > 0.5) theyOweMe += diff;
    if (diff < -0.5) iOwe += -diff;
  });

  const total = expenses.reduce((sum, e) => sum + Number(e.monto || 0), 0);

  return { total, pending, theyOweMe, iOwe };
}