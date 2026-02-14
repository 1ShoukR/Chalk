import { useRouter } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function SubscriptionScreen() {
  const router = useRouter();

  return (
    <Screen title="Subscription" description="Coach billing and plan management shell.">
      <Button label="View Paywall" onPress={() => router.push('/(shared)/paywall')} />
    </Screen>
  );
}
