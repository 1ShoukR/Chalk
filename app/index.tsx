import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';
import type { ModeCapability } from '@/src/types/auth';

function isModeReady(capability: ModeCapability): boolean {
  return capability.available && capability.setupStatus === 'complete';
}

export default function EntryRedirect() {
  const { isHydrating, session } = useAuth();

  if (isHydrating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const coachReady = isModeReady(session.capabilities.coach);
  const clientReady = isModeReady(session.capabilities.client);

  if (!coachReady && !clientReady) {
    if (session.capabilities.coach.setupStatus === 'in_progress') {
      return <Redirect href="/(onboarding)/coach/step-1" />;
    }

    if (session.capabilities.client.setupStatus === 'in_progress') {
      return <Redirect href="/(onboarding)/client/step-1" />;
    }

    return <Redirect href="/(onboarding)/role-select" />;
  }

  if (session.activeMode === 'coach' && coachReady) {
    return <Redirect href="/(coach)" />;
  }

  if (session.activeMode === 'client' && clientReady) {
    return <Redirect href="/(client)" />;
  }

  if (coachReady) {
    return <Redirect href="/(coach)" />;
  }

  return <Redirect href="/(client)" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
