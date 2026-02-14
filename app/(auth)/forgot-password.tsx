import { useRouter } from 'expo-router';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  return (
    <Screen
      title="Forgot Password"
      description="Reset flow placeholder. API integration comes in the auth implementation pass.">
      <Button label="Back to Sign In" onPress={() => router.replace('/(auth)/sign-in')} />
    </Screen>
  );
}
