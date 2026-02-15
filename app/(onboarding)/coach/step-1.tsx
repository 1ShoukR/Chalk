import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { updateMe } from '@/src/api/users';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function CoachOnboardingStep1() {
  const router = useRouter();
  const { session } = useAuth();
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [firstName, setFirstName] = useState(session?.user.profile?.first_name ?? '');
  const [lastName, setLastName] = useState(session?.user.profile?.last_name ?? '');
  const [phone, setPhone] = useState(session?.user.profile?.phone ?? '');
  const [timezone, setTimezone] = useState(session?.user.profile?.timezone ?? defaultTimezone);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onNext = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await updateMe({
        ...(firstName.trim() ? { first_name: firstName.trim() } : {}),
        ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(timezone.trim() ? { timezone: timezone.trim() } : {}),
      });
      router.push('/(onboarding)/coach/step-2');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Unable to save profile details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Coach Setup - Step 1" description="Profile details">
      <Text>First Name</Text>
      <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" />
      <Text>Last Name</Text>
      <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" />
      <Text>Phone</Text>
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" keyboardType="phone-pad" />
      <Text>Timezone</Text>
      <TextInput value={timezone} onChangeText={setTimezone} placeholder="Timezone" autoCapitalize="none" />
      {error ? <Text>{error}</Text> : null}
      <Button label={isSubmitting ? 'Saving...' : 'Save and Continue'} onPress={onNext} disabled={isSubmitting} />
    </Screen>
  );
}
