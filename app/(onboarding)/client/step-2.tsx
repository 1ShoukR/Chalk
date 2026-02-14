import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ClientOnboardingStep2() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await completeOnboarding('client');
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Client Setup - Step 2" description="Connect-to-coach flow placeholder.">
      <Button label={isSubmitting ? 'Finishing...' : 'Finish Setup'} onPress={onFinish} disabled={isSubmitting} />
    </Screen>
  );
}
