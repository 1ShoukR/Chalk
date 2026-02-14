import { Link } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function CoachDashboardScreen() {
  return (
    <Screen title="Coach Dashboard" description="Phase 1 shell for coach home experience.">
      <Link asChild href="/(coach)/clients">
        <Button label="Go to Clients" />
      </Link>
      <Link asChild href="/(shared)/settings">
        <Button label="Open Settings" variant="secondary" />
      </Link>
    </Screen>
  );
}
