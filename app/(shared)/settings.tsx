import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';
import type { AppMode, ModeCapability } from '@/src/types/auth';

function getCapabilityLabel(capability: ModeCapability): string {
  if (capability.setupStatus === 'complete') {
    return 'Ready';
  }

  if (capability.setupStatus === 'in_progress') {
    return 'Setup In Progress';
  }

  return 'Not Set Up';
}

function getModeActionLabel(mode: AppMode, capability: ModeCapability, activeMode: AppMode | null): string {
  const modeLabel = mode === 'coach' ? 'Coach' : 'Client';

  if (capability.setupStatus === 'not_started') {
    return `Set Up ${modeLabel} Mode`;
  }

  if (capability.setupStatus === 'in_progress') {
    return `Continue ${modeLabel} Setup`;
  }

  if (activeMode === mode) {
    return `${modeLabel} Mode Active`;
  }

  return `Switch to ${modeLabel} Mode`;
}

export default function SettingsScreen() {
  const router = useRouter();
  const { session, setActiveMode, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  const onSelectMode = async (mode: AppMode) => {
    if (!session || isSwitchingMode) {
      return;
    }

    const capability = session.capabilities[mode];

    if (capability.setupStatus === 'not_started' || capability.setupStatus === 'in_progress') {
      const setupRoute = mode === 'coach' ? '/(onboarding)/coach/step-1' : '/(onboarding)/client/step-1';
      router.push(setupRoute);
      return;
    }

    if (session.activeMode === mode) {
      return;
    }

    setIsSwitchingMode(true);

    try {
      await setActiveMode(mode);
      router.replace('/');
    } finally {
      setIsSwitchingMode(false);
    }
  };

  const onSignOut = async () => {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut();
      router.replace('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  const activeModeLabel =
    session?.activeMode === 'coach' ? 'Coach' : session?.activeMode === 'client' ? 'Client' : 'Not selected';
  const coachCapability = session?.capabilities.coach;
  const clientCapability = session?.capabilities.client;

  return (
    <Screen title="Settings" description="Shared settings shell for both coach and client roles.">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Roles &amp; Mode</Text>
        <Text style={styles.sectionMeta}>Active Mode: {activeModeLabel}</Text>

        {coachCapability ? (
          <Text style={styles.status}>Coach: {getCapabilityLabel(coachCapability)}</Text>
        ) : null}
        <Button
          label={
            coachCapability ? getModeActionLabel('coach', coachCapability, session?.activeMode ?? null) : 'Coach Mode'
          }
          onPress={() => void onSelectMode('coach')}
          variant="secondary"
          disabled={
            isSwitchingMode ||
            !coachCapability ||
            (coachCapability.setupStatus === 'complete' && session?.activeMode === 'coach')
          }
        />

        {clientCapability ? (
          <Text style={styles.status}>Client: {getCapabilityLabel(clientCapability)}</Text>
        ) : null}
        <Button
          label={
            clientCapability
              ? getModeActionLabel('client', clientCapability, session?.activeMode ?? null)
              : 'Client Mode'
          }
          onPress={() => void onSelectMode('client')}
          variant="secondary"
          disabled={
            isSwitchingMode ||
            !clientCapability ||
            (clientCapability.setupStatus === 'complete' && session?.activeMode === 'client')
          }
        />
      </View>

      <Button label="Profile" onPress={() => router.push('/(shared)/profile')} variant="secondary" />
      <Button label="Subscription" onPress={() => router.push('/(shared)/subscription')} variant="secondary" />
      <Button
        label={isSigningOut ? 'Signing Out...' : 'Sign Out'}
        onPress={onSignOut}
        variant="danger"
        disabled={isSigningOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#e4e4e7',
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  sectionMeta: {
    color: '#52525b',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#18181b',
    fontSize: 16,
    fontWeight: '700',
  },
  status: {
    color: '#27272a',
    fontSize: 14,
  },
});
