import { useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getApiErrorMessage, getMe, getMyCoachProfile } from '@/src/api/auth';
import { upsertMyCoachProfile } from '@/src/api/coaches';
import { updateMe } from '@/src/api/users';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ProfileScreen() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [timezone, setTimezone] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);

  const meQuery = useQuery({
    queryFn: getMe,
    queryKey: ['user', 'me'],
  });
  const coachProfileQuery = useQuery({
    enabled: session?.capabilities.coach.available === true,
    queryFn: getMyCoachProfile,
    queryKey: ['coach', 'profile', 'me'],
  });

  useEffect(() => {
    const profile = meQuery.data?.profile;
    if (!profile) {
      return;
    }

    setFirstName(profile.first_name ?? '');
    setLastName(profile.last_name ?? '');
    setPhone(profile.phone ?? '');
    setTimezone(profile.timezone ?? '');
  }, [meQuery.data]);

  useEffect(() => {
    if (!coachProfileQuery.data) {
      return;
    }

    setBusinessName(coachProfileQuery.data.business_name ?? '');
    setBio(coachProfileQuery.data.bio ?? '');
  }, [coachProfileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nextFirstName = firstName.trim();
      const nextLastName = lastName.trim();
      const nextPhone = phone.trim();
      const nextTimezone = timezone.trim();

      await updateMe({
        ...(nextFirstName ? { first_name: nextFirstName } : {}),
        ...(nextLastName ? { last_name: nextLastName } : {}),
        ...(nextPhone ? { phone: nextPhone } : {}),
        ...(nextTimezone ? { timezone: nextTimezone } : {}),
      });

      if (session?.capabilities.coach.available) {
        const nextBusinessName = businessName.trim();
        const nextBio = bio.trim();
        await upsertMyCoachProfile({
          ...(nextBusinessName ? { business_name: nextBusinessName } : {}),
          ...(nextBio ? { bio: nextBio } : {}),
        });
      }
    },
    onError: (nextError) => {
      setError(getApiErrorMessage(nextError, 'Unable to update profile.'));
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['coach', 'profile', 'me'] });
    },
  });

  return (
    <Screen title="Profile" description="Edit profile details for your account.">
      {meQuery.isLoading ? <Text>Loading profile...</Text> : null}
      {meQuery.error ? <Text>{getApiErrorMessage(meQuery.error, 'Unable to load profile.')}</Text> : null}

      <Text>First Name</Text>
      <TextInput value={firstName} onChangeText={setFirstName} placeholder="First name" />
      <Text>Last Name</Text>
      <TextInput value={lastName} onChangeText={setLastName} placeholder="Last name" />
      <Text>Phone</Text>
      <TextInput value={phone} onChangeText={setPhone} placeholder="Phone (optional)" keyboardType="phone-pad" />
      <Text>Timezone</Text>
      <TextInput value={timezone} onChangeText={setTimezone} placeholder="Timezone" autoCapitalize="none" />

      {session?.capabilities.coach.available ? (
        <>
          <Text>Business Name</Text>
          <TextInput value={businessName} onChangeText={setBusinessName} placeholder="Business name" />
          <Text>Bio</Text>
          <TextInput value={bio} onChangeText={setBio} placeholder="Bio" multiline />
        </>
      ) : null}

      {coachProfileQuery.error ? (
        <Text>{getApiErrorMessage(coachProfileQuery.error, 'Unable to load coach profile details.')}</Text>
      ) : null}
      {error ? <Text>{error}</Text> : null}
      <Button
        label={saveMutation.isPending ? 'Saving...' : 'Save Profile'}
        onPress={() => saveMutation.mutate()}
        disabled={saveMutation.isPending || meQuery.isLoading}
      />
    </Screen>
  );
}
