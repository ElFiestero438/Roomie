/// Le dice a cualquier pantalla quién tiene la sesión abierta.

import type { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { subscribeToAuthChanges } from '../firebase/auth';

export function useAuthUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { user, loading };
}