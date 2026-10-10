/// Funciones de cuenta: registerUser, loginUser, loginWithGoogle, resetPassword, logoutUser.

import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';

import { auth } from './config';

// Google Sign-In es un módulo nativo: no existe en Expo Go.
// Se carga solo cuando se usa, para que la app no se rompa al arrancar.
function getGoogleSignin() {
  try {
    return require('@react-native-google-signin/google-signin').GoogleSignin;
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

  if (!cleanEmail) {
    throw new Error('Debes ingresar tu correo.');
  }

  if (!password) {
    throw new Error('Debes ingresar una contraseña.');
  }

  if (password.length < 6) {
    throw new Error('La contraseña debe tener al menos 6 caracteres.');
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password
  );

  await updateProfile(credential.user, {
    displayName: cleanName,
  });

  return credential.user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error('Debes ingresar tu correo.');
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
      'El inicio de sesión con Google no está disponible en Expo Go. Usa tu correo y contraseña.'
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

  if (!cleanEmail) {
    throw new Error('Debes ingresar tu correo.');
  }

  await sendPasswordResetEmail(auth, cleanEmail);
}

export async function logoutUser(): Promise<void> {
  try {
    const GoogleSignin = getGoogleSignin();
    await GoogleSignin?.signOut();
  } catch {
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
  error: any
): string {
  switch (error?.code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';

    case 'auth/user-not-found':
      return 'No existe una cuenta con este correo.';

    case 'auth/wrong-password':
      return 'La contraseña es incorrecta.';

    case 'auth/invalid-credential':
      return 'El correo o la contraseña son incorrectos.';

    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con este correo.';

    case 'auth/weak-password':
      return 'La contraseña es demasiado débil.';

    case 'auth/network-request-failed':
      return 'No hay conexión con Firebase. Revisa tu conexión a Internet.';

    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta nuevamente más tarde.';

    case 'auth/popup-closed-by-user':
      return 'El inicio de sesión con Google fue cancelado.';

    case 'auth/account-exists-with-different-credential':
      return 'Ya existe una cuenta con este correo usando otro método de inicio de sesión.';

    default:
      return error?.message || 'Ocurrió un error al autenticarte.';
  }
}