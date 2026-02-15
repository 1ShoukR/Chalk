import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { upsertMyCoachProfile } from '@/src/api/coaches';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function CoachOnboardingStep3() {
  const router = useRouter();
  const { completeOnboarding, refreshCapabilities } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await upsertMyCoachProfile({
        is_accepting_clients: true,
        onboarding_completed: true,
      });
      await completeOnboarding('coach');
      await refreshCapabilities();
      router.replace('/');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Unable to finish coach setup.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Coach Setup - Step 3" description="Finalize coach setup">
      <Text>Finish setup to activate coach mode and unlock client management.</Text>
      {error ? <Text>{error}</Text> : null}
      <Button label={isSubmitting ? 'Finishing...' : 'Finish Setup'} onPress={onFinish} disabled={isSubmitting} />
    </Screen>
  );
}
