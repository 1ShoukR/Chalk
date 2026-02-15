import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { getMyWorkout } from '@/src/api/workouts';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function WorkoutDeepLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { session, setActiveMode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const workoutId = Number(rawId);
  const isValidWorkoutId = Number.isFinite(workoutId) && workoutId > 0;

  useEffect(() => {
    let isActive = true;

    const resolve = async () => {
      if (!session || !isValidWorkoutId) {
        return;
      }

      if (session.capabilities.client.setupStatus !== 'complete') {
        return;
      }

      setError(null);
      setIsResolving(true);

      try {
        if (session.activeMode !== 'client') {
          await setActiveMode('client');
        }

        const workout = await getMyWorkout(workoutId);
        if (isActive) {
          setWorkoutName(workout.name ?? `Workout #${workoutId}`);
        }
      } catch (nextError) {
        if (isActive) {
          setWorkoutName(null);
          setError(getApiErrorMessage(nextError, 'Unable to open workout.'));
        }
      } finally {
        if (isActive) {
          setIsResolving(false);
        }
      }
    };

    void resolve();

    return () => {
      isActive = false;
    };
  }, [isValidWorkoutId, session, setActiveMode, workoutId]);

  if (!isValidWorkoutId) {
    return (
      <Screen title="Workout Link" description="This workout link is invalid.">
        <Button label="Go Home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!session) {
    const returnTo = encodeURIComponent(`/workout/${workoutId}`);

    return (
      <Screen title="Workout Link" description="Sign in to view this workout.">
        <Button label="Sign In" onPress={() => router.push(`/(auth)/sign-in?returnTo=${returnTo}`)} />
        <Button label="Create Account" onPress={() => router.push(`/(auth)/sign-up?returnTo=${returnTo}`)} variant="secondary" />
      </Screen>
    );
  }

  if (session.capabilities.client.setupStatus !== 'complete') {
    return (
      <Screen title="Workout Link" description="Client setup is required before opening workouts.">
        <Button label="Set Up Client Mode" onPress={() => router.push('/(onboarding)/client/step-1')} />
      </Screen>
    );
  }

  return (
    <Screen title="Workout Link" description="Workout deep link resolved.">
      <Text>Workout ID: {workoutId}</Text>
      {isResolving ? <Text>Loading workout...</Text> : null}
      {workoutName ? <Text>Name: {workoutName}</Text> : null}
      {error ? <Text>{error}</Text> : null}
      <Button label="Open Workout Tab" onPress={() => router.replace('/(client)')} />
    </Screen>
  );
}
