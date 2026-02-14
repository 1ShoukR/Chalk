import { Link } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function ClientWorkoutScreen() {
  return (
    <Screen title="Today's Workout" description="Client workout execution shell for MVP.">
      <Button label="Start Workout (Coming Next)" variant="secondary" />
      <Link asChild href="/(shared)/settings">
        <Button label="Open Settings" />
      </Link>
    </Screen>
  );
}
