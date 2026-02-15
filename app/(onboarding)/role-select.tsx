import { useRouter } from 'expo-router';
import { useState } from 'react';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function RoleSelectScreen() {
  const router = useRouter();
  const { session, setActiveMode } = useAuth();
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);

  const onChooseCoach = async () => {
    if (!session || isSwitchingMode) {
      return;
    }

    if (session.capabilities.coach.setupStatus === 'complete') {
      setIsSwitchingMode(true);

      try {
        await setActiveMode('coach');
        router.replace('/');
      } finally {
        setIsSwitchingMode(false);
      }

      return;
    }

    router.push('/(onboarding)/coach/step-1');
  };

  const onChooseClient = async () => {
    if (!session || isSwitchingMode) {
      return;
    }

    if (session.capabilities.client.setupStatus === 'complete') {
      setIsSwitchingMode(true);

      try {
        await setActiveMode('client');
        router.replace('/');
      } finally {
        setIsSwitchingMode(false);
      }

      return;
    }

    router.push('/(onboarding)/client/step-1');
  };

  const coachLabel =
    session?.capabilities.coach.setupStatus === 'complete' ? 'Continue as Coach' : "I'm a Coach";
  const clientLabel =
    session?.capabilities.client.setupStatus === 'complete' ? 'Continue as Client' : "I'm a Client";

  return (
    <Screen title="Choose Your Role" description="Set up one or both roles. You can switch modes later in Settings.">
      <Button label={coachLabel} onPress={() => void onChooseCoach()} disabled={isSwitchingMode} />
      <Button label={clientLabel} onPress={() => void onChooseClient()} variant="secondary" disabled={isSwitchingMode} />
    </Screen>
  );
}
