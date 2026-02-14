import { useRouter } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function RoleSelectScreen() {
  const router = useRouter();

  return (
    <Screen title="Choose Your Role" description="This determines your primary app experience.">
      <Button label="I am a Coach" onPress={() => router.push('/(onboarding)/coach/step-1')} />
      <Button
        label="I am a Client"
        onPress={() => router.push('/(onboarding)/client/step-1')}
        variant="secondary"
      />
    </Screen>
  );
}
