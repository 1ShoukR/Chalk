import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import type { AppMode } from '@/src/types/auth';

type Props = {
  currentMode: AppMode;
};

export function ModeSwitchAction({ currentMode }: Props) {
  const router = useRouter();
  const { session, setActiveMode } = useAuth();
  const [isBusy, setIsBusy] = useState(false);

  if (!session) {
    return null;
  }

  const targetMode: AppMode = currentMode === 'coach' ? 'client' : 'coach';
  const targetCapability = session.capabilities[targetMode];
  const isTargetReady = targetCapability.setupStatus === 'complete';
  const label = isTargetReady
    ? `Switch: ${targetMode === 'coach' ? 'Coach' : 'Client'}`
    : `Set Up ${targetMode === 'coach' ? 'Coach' : 'Client'}`;

  const onPress = async () => {
    if (isBusy) {
      return;
    }

    if (!isTargetReady) {
      const setupRoute = targetMode === 'coach' ? '/(onboarding)/coach/step-1' : '/(onboarding)/client/step-1';
      router.push(setupRoute);
      return;
    }

    setIsBusy(true);

    try {
      await setActiveMode(targetMode);
      router.replace('/');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Pressable style={[styles.button, isBusy && styles.disabled]} onPress={() => void onPress()} disabled={isBusy}>
      <Text style={styles.label}>{isBusy ? 'Switching...' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f4f4f5',
    borderColor: '#d4d4d8',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  disabled: {
    opacity: 0.55,
  },
  label: {
    color: '#18181b',
    fontSize: 12,
    fontWeight: '600',
  },
});
