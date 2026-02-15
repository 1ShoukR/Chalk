import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { upsertMyCoachProfile } from '@/src/api/coaches';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

export default function CoachOnboardingStep2() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [specialtiesCsv, setSpecialtiesCsv] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onNext = async () => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    const specialties = specialtiesCsv
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    try {
      await upsertMyCoachProfile({
        ...(businessName.trim() ? { business_name: businessName.trim() } : {}),
        ...(bio.trim() ? { bio: bio.trim() } : {}),
        ...(specialties.length > 0 ? { specialties } : {}),
        onboarding_completed: false,
      });
      router.push('/(onboarding)/coach/step-3');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Unable to save business details.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Coach Setup - Step 2" description="Business details">
      <Text>Business Name</Text>
      <TextInput value={businessName} onChangeText={setBusinessName} placeholder="Business name" />
      <Text>Bio</Text>
      <TextInput value={bio} onChangeText={setBio} placeholder="Bio (optional)" multiline />
      <Text>Specialties</Text>
      <TextInput
        value={specialtiesCsv}
        onChangeText={setSpecialtiesCsv}
        placeholder="Comma separated (e.g. Strength, Weight Loss)"
      />
      {error ? <Text>{error}</Text> : null}
      <Button label={isSubmitting ? 'Saving...' : 'Save and Continue'} onPress={onNext} disabled={isSubmitting} />
    </Screen>
  );
}
