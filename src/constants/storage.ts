
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@roomie_session';

export interface RoomieSession {
  email: string;
  isLoggedIn: boolean;
}

export async function saveSession(email: string): Promise<void> {
  const session: RoomieSession = {
    email,
    isLoggedIn: true,
  };

  await AsyncStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );
}

export async function getSession(): Promise<RoomieSession | null> {
  const session = await AsyncStorage.getItem(SESSION_KEY);

  if (!session) {
    return null;
  }

  return JSON.parse(session) as RoomieSession;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_KEY);
}