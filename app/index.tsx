import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/src/contexts/AuthContext';

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

  if (!session.onboardingComplete || !session.role) {
    return <Redirect href="/(onboarding)/role-select" />;
  }

  if (session.role === 'coach') {
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
