import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/src/types/auth';

const SESSION_KEY = 'chalk.session.v1';

async function getStoredSession(): Promise<unknown | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

async function setStoredSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

async function clearStoredSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export { clearStoredSession, getStoredSession, setStoredSession };
