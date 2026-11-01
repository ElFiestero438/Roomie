import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';

import Constants, { ExecutionEnvironment } from 'expo-constants';

import { auth } from './config';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getGoogleSignin() {
  // En Expo Go no existe el módulo nativo de Google.
  // Si se intenta cargar, la app muestra la pantalla roja de error.
  if (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  ) {
    return null;
  }

  try {
    return require('@react-native-google-signin/google-signin')
      .GoogleSignin;
  } catch {
    return null;
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<User> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error('Debes ingresar tu nombre.');
  }

  if (!isValidEmail(cleanEmail)) {
    throw new Error('El correo electrónico no es válido.');
  }

  if (!password) {
    throw new Error('Debes ingresar una contraseña.');
  }

  if (password.length < 6) {
    throw new Error(
      'La contraseña debe tener al menos 6 caracteres.'
    );
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  try {
    await updateProfile(credential.user, {
      displayName: cleanName,
    });
  } catch (error) {
    await credential.user.delete().catch(() => undefined);
    throw error;
  }

  return credential.user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    throw new Error('El correo electrónico no es válido.');
  }

  if (!password) {
    throw new Error('Debes ingresar tu contraseña.');
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const GoogleSignin = getGoogleSignin();

  if (!GoogleSignin) {
    throw new Error(
      'El inicio de sesión con Google no está disponible en Expo Go. Usa correo y contraseña o una versión de desarrollo compatible.'
    );
  }

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();
  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error(
      'No se pudo obtener el token de Google. Verifica la configuración de Google Sign-In.'
    );
  }

  const credential = GoogleAuthProvider.credential(idToken);

  const userCredential = await signInWithCredential(
    auth,
    credential
  );

  return userCredential.user;
}

export async function resetPassword(
  email: string
): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidEmail(cleanEmail)) {
    throw new Error('Ingresa un correo electrónico válido.');
  }

  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function logoutUser(): Promise<void> {
  try {
    const GoogleSignin = getGoogleSignin();
    await GoogleSignin?.signOut();
  } catch {
    // Firebase cerrará la sesión aunque falle el cierre de Google.
  }

  await signOut(auth);
}

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export function subscribeToAuthChanges(
  callback: (user: User | null) => void
) {
  return onAuthStateChanged(auth, callback);
}

export function getFirebaseErrorMessage(
  error: unknown
): string {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error
      ? String(error.code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';

    case 'auth/user-not-found':
      return 'No se encontró una cuenta con esos datos.';

    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'El correo o la contraseña son incorrectos.';

    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo.';

    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';

    case 'auth/network-request-failed':
      return 'No se pudo conectar con Firebase. Revisa tu conexión a Internet.';

    case 'auth/too-many-requests':
      return 'Demasiados intentos. Inténtalo nuevamente más tarde.';

    case 'auth/popup-closed-by-user':
      return 'El inicio de sesión con Google fue cancelado.';

    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo usando otro método de inicio de sesión.';

    case 'auth/operation-not-allowed':
      return 'Este método de inicio de sesión no está habilitado en Firebase.';

    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';

    default:
      if (error instanceof Error && error.message) {
        return error.message;
      }

      return 'Ocurrió un error al autenticarte. Inténtalo nuevamente.';
  }
}