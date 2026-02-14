import { useRouter } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function ClientOnboardingStep1() {
  const router = useRouter();

  return (
    <Screen title="Client Setup - Step 1" description="Profile details screen placeholder.">
      <Button label="Next" onPress={() => router.push('/(onboarding)/client/step-2')} />
    </Screen>
  );
}
