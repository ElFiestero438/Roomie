/// Conecta la app con tu proyecto de Firebase y crea auth y db. Guarda la sesión en el teléfono
//  para que no tengas que iniciar sesión cada vez.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
// @ts-ignore
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJLjvgfBIQWqdwYzwtNN_SBm2gH25bgck",
  authDomain: "proyecto-movil-1-f2bdf.firebaseapp.com",
  projectId: "proyecto-movil-1-f2bdf",
  storageBucket: "proyecto-movil-1-f2bdf.firebasestorage.app",
  messagingSenderId: "764026406947",
  appId: "1:764026406947:web:3d63cbe5d8e46e33624996",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// La persistencia mantiene la sesión al cerrar la app.
// El try/catch evita el error al recargar la app en desarrollo.
let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);