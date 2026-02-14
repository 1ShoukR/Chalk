import { useRouter } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function CoachOnboardingStep2() {
  const router = useRouter();

  return (
    <Screen title="Coach Setup - Step 2" description="Business details screen placeholder.">
      <Button label="Next" onPress={() => router.push('/(onboarding)/coach/step-3')} />
    </Screen>
  );
}
