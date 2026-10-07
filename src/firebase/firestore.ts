/// Funciones de datos: saveTarea, getTareas, deleteTarea,
///  y lo mismo para roomies, gastos, deudas, compras y vivienda.

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from './config';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  provider: 'email' | 'google';
  createdAt?: any;
  updatedAt?: any;
}

export interface Vivienda {
  id: string;
  nombre: string;
  direccion?: string;
  descripcion?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Roomie {
  id: string;
  nombre: string;
  email?: string;
  telefono?: string;
  photoURL?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion?: string;
  responsableId?: string;
  responsableNombre?: string;
  prioridad?: string;
  fecha?: string;
  completada: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Gasto {
  id: string;
  titulo: string;
  descripcion?: string;
  monto: number;
  responsableId?: string;
  responsableNombre?: string;
  fecha?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Deuda {
  id: string;
  titulo: string;
  monto: number;
  deudorId?: string;
  deudorNombre?: string;
  acreedorId?: string;
  acreedorNombre?: string;
  pagada: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Compra {
  id: string;
  nombre: string;
  cantidad?: number;
  completada: boolean;
  createdAt?: any;
  updatedAt?: any;
}

/* =========================
   PERFIL DEL USUARIO
========================= */

export async function createUserProfile(
  uid: string,
  name: string,
  email: string,
  photoURL: string | null = null,
  provider: 'email' | 'google' = 'email'
): Promise<void> {
  const userRef = doc(db, 'users', uid);

  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    return;
  }

  await setDoc(userRef, {
    uid,
    name,
    email,
    photoURL,
    provider,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);

  const userSnapshot = await getDoc(userRef);

  if (!userSnapshot.exists()) {
    return null;
  }

  return userSnapshot.data() as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<
    Pick<UserProfile, 'name' | 'email' | 'photoURL'>
  >
): Promise<void> {
  const userRef = doc(db, 'users', uid);

  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function userProfileExists(
  uid: string
): Promise<boolean> {
  const userRef = doc(db, 'users', uid);

  const userSnapshot = await getDoc(userRef);

  return userSnapshot.exists();
}

/* =========================
   VIVIENDA
========================= */

export async function saveVivienda(
  uid: string,
  vivienda: Vivienda
): Promise<void> {
  const viviendaRef = doc(
    db,
    'users',
    uid,
    'vivienda',
    vivienda.id
  );

  await setDoc(viviendaRef, {
    ...vivienda,
    updatedAt: serverTimestamp(),
  });
}

export async function getViviendas(
  uid: string
): Promise<Vivienda[]> {
  const viviendaRef = collection(
    db,
    'users',
    uid,
    'vivienda'
  );

  const snapshot = await getDocs(viviendaRef);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Vivienda[];
}

export async function deleteVivienda(
  uid: string,
  viviendaId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', uid, 'vivienda', viviendaId)
  );
}

/* =========================
   ROOMIES
========================= */

export async function saveRoomie(
  uid: string,
  roomie: Roomie
): Promise<void> {
  const roomieRef = doc(
    db,
    'users',
    uid,
    'roommates',
    roomie.id
  );

  await setDoc(roomieRef, {
    ...roomie,
    updatedAt: serverTimestamp(),
  });
}

export async function getRoomies(
  uid: string
): Promise<Roomie[]> {
  const roomieRef = collection(
    db,
    'users',
    uid,
    'roommates'
  );

  const snapshot = await getDocs(roomieRef);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Roomie[];
}

export async function deleteRoomie(
  uid: string,
  roomieId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', uid, 'roommates', roomieId)
  );
}

/* =========================
   TAREAS
========================= */

export async function saveTarea(
  uid: string,
  tarea: Tarea
): Promise<void> {
  const tareaRef = doc(
    db,
    'users',
    uid,
    'tasks',
    tarea.id
  );

  await setDoc(tareaRef, {
    ...tarea,
    updatedAt: serverTimestamp(),
  });
}

export async function getTareas(
  uid: string
): Promise<Tarea[]> {
  const tareaRef = collection(
    db,
    'users',
    uid,
    'tasks'
  );

  const snapshot = await getDocs(tareaRef);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Tarea[];
}

export async function deleteTarea(
  uid: string,
  tareaId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', uid, 'tasks', tareaId)
  );
}

/* =========================
   GASTOS
========================= */

export async function saveGasto(
  uid: string,
  gasto: Gasto
): Promise<void> {
  const gastoRef = doc(
    db,
    'users',
    uid,
    'expenses',
    gasto.id
  );

  await setDoc(gastoRef, {
    ...gasto,
    updatedAt: serverTimestamp(),
  });
}

export async function getGastos(
  uid: string
): Promise<Gasto[]> {
  const gastoRef = collection(
    db,
    'users',
    uid,
    'expenses'
  );

  const snapshot = await getDocs(gastoRef);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Gasto[];
}

export async function deleteGasto(
  uid: string,
  gastoId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', uid, 'expenses', gastoId)
  );
}

/* =========================
   DEUDAS
========================= */

export async function saveDeuda(
  uid: string,
  deuda: Deuda
): Promise<void> {
  const deudaRef = doc(
    db,
    'users',
    uid,
    'debts',
    deuda.id
  );

  await setDoc(deudaRef, {
    ...deuda,
    updatedAt: serverTimestamp(),
  });
}

export async function getDeudas(
  uid: string
): Promise<Deuda[]> {
  const deudaRef = collection(
    db,
    'users',
    uid,
    'debts'
  );

  const snapshot = await getDocs(deudaRef);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Deuda[];
}

export async function deleteDeuda(
  uid: string,
  deudaId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', uid, 'debts', deudaId)
  );
}

/* =========================
   LISTA DE COMPRAS
========================= */

export async function saveCompra(
  uid: string,
  compra: Compra
): Promise<void> {
  const compraRef = doc(
    db,
    'users',
    uid,
    'shopping',
    compra.id
  );

  await setDoc(compraRef, {
    ...compra,
    updatedAt: serverTimestamp(),
  });
}

export async function getCompras(
  uid: string
): Promise<Compra[]> {
  const compraRef = collection(
    db,
    'users',
    uid,
    'shopping'
  );

  const snapshot = await getDocs(compraRef);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  })) as Compra[];
}

export async function deleteCompra(
  uid: string,
  compraId: string
): Promise<void> {
  await deleteDoc(
    doc(db, 'users', uid, 'shopping', compraId)
  );
}