import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';
import { sanitizeReturnTo } from '@/src/lib/navigation';

export default function SignInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ inviteCode?: string | string[]; returnTo?: string | string[] }>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('coach@chalk.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rawInviteCode = Array.isArray(params.inviteCode) ? params.inviteCode[0] : params.inviteCode;
  const inviteCode = typeof rawInviteCode === 'string' ? rawInviteCode.trim() : '';
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const returnTo = sanitizeReturnTo(typeof rawReturnTo === 'string' ? rawReturnTo : null);

  const onContinue = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn({ email, password });
      if (inviteCode) {
        router.replace(`/(onboarding)/client/step-2?inviteCode=${encodeURIComponent(inviteCode)}`);
        return;
      }

      if (returnTo) {
        router.replace(returnTo);
        return;
      }

      router.replace('/');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Unable to sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Sign In" description="Use your Chalk account to continue.">
      <View style={styles.field}>
        <Text style={styles.label}>Email</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="you@example.com"
          style={styles.input}
          value={email}
        />
      </View>
      <View style={styles.field}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setPassword}
          placeholder="Enter password"
          secureTextEntry
          style={styles.input}
          value={password}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button label={isSubmitting ? 'Signing In...' : 'Sign In'} onPress={onContinue} disabled={isSubmitting} />
      <Button label="Forgot Password" onPress={() => router.push('/(auth)/forgot-password')} variant="secondary" />
      <Button
        label="Create Account"
        onPress={() => {
          if (inviteCode) {
            router.push(`/(auth)/sign-up?inviteCode=${encodeURIComponent(inviteCode)}`);
            return;
          }

          if (returnTo) {
            router.push(`/(auth)/sign-up?returnTo=${encodeURIComponent(returnTo)}`);
            return;
          }

          router.push('/(auth)/sign-up');
        }}
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 8,
  },
  error: {
    color: '#b91c1c',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#d4d4d8',
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  label: {
    color: '#27272a',
    fontSize: 14,
    fontWeight: '600',
  },
});
