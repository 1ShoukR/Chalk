import { Link } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function WelcomeScreen() {
  return (
    <Screen
      title="Welcome to Chalk"
      description="Coach-client training in one place. Start by creating an account or signing in.">
      <Link asChild href="/(auth)/sign-up">
        <Button label="Create Account" />
      </Link>
      <Link asChild href="/(auth)/sign-in">
        <Button label="Sign In" variant="secondary" />
      </Link>
    </Screen>
  );
}
