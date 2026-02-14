import { Link } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function CoachClientsScreen() {
  return (
    <Screen title="Clients" description="Client list and invite flow shell.">
      <Button label="Invite Client (Coming Next)" variant="secondary" />
      <Link asChild href="/(shared)/subscription">
        <Button label="Open Subscription / Paywall" />
      </Link>
    </Screen>
  );
}
