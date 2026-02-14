import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function CoachOnboardingStep3() {
  const router = useRouter();
  const { completeOnboarding } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await completeOnboarding('coach');
      router.replace('/');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Coach Setup - Step 3" description="Availability and setup preferences placeholder.">
      <Button label={isSubmitting ? 'Finishing...' : 'Finish Setup'} onPress={onFinish} disabled={isSubmitting} />
    </Screen>
  );
}
