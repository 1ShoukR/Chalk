import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  return (
    <Screen title="Settings" description="Shared settings shell for both coach and client roles.">
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
