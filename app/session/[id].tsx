import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { listMySessions } from '@/src/api/sessions';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';
import type { AppMode } from '@/src/types/auth';

function chooseSessionMode(session: ReturnType<typeof useAuth>['session']): AppMode | null {
  if (!session) {
    return null;
  }

  if (session.activeMode && session.capabilities[session.activeMode].setupStatus === 'complete') {
    return session.activeMode;
  }

  if (session.capabilities.coach.setupStatus === 'complete') {
    return 'coach';
  }

  if (session.capabilities.client.setupStatus === 'complete') {
    return 'client';
  }

  return null;
}

export default function SessionDeepLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { session, setActiveMode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [resolvedMode, setResolvedMode] = useState<AppMode | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const sessionId = Number(rawId);
  const isValidSessionId = Number.isFinite(sessionId) && sessionId > 0;

  useEffect(() => {
    let isActive = true;

    const resolve = async () => {
      if (!session || !isValidSessionId) {
        return;
      }

      const targetMode = chooseSessionMode(session);
      if (!targetMode) {
        return;
      }

      setError(null);
      setIsResolving(true);

      try {
        if (session.activeMode !== targetMode) {
          await setActiveMode(targetMode);
        }

        const allSessions = await listMySessions();
        const targetSession = allSessions.find((item) => item.id === sessionId);

        if (!targetSession) {
          throw new Error('Session not found in your account.');
        }

        if (isActive) {
          setResolvedMode(targetMode);
          setSessionStatus(targetSession.status ?? 'unknown');
        }
      } catch (nextError) {
        if (isActive) {
          setResolvedMode(null);
          setSessionStatus(null);
          setError(getApiErrorMessage(nextError, 'Unable to open session.'));
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
  }, [isValidSessionId, session, sessionId, setActiveMode]);

  if (!isValidSessionId) {
    return (
      <Screen title="Session Link" description="This session link is invalid.">
        <Button label="Go Home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!session) {
    const returnTo = encodeURIComponent(`/session/${sessionId}`);

    return (
      <Screen title="Session Link" description="Sign in to view this session.">
        <Button label="Sign In" onPress={() => router.push(`/(auth)/sign-in?returnTo=${returnTo}`)} />
        <Button label="Create Account" onPress={() => router.push(`/(auth)/sign-up?returnTo=${returnTo}`)} variant="secondary" />
      </Screen>
    );
  }

  if (!chooseSessionMode(session)) {
    return (
      <Screen title="Session Link" description="Complete coach or client setup to open sessions.">
        <Button label="Set Up Coach Mode" onPress={() => router.push('/(onboarding)/coach/step-1')} />
        <Button label="Set Up Client Mode" onPress={() => router.push('/(onboarding)/client/step-1')} variant="secondary" />
      </Screen>
    );
  }

  return (
    <Screen title="Session Link" description="Session deep link resolved.">
      <Text>Session ID: {sessionId}</Text>
      {isResolving ? <Text>Loading session...</Text> : null}
      {resolvedMode ? <Text>Mode: {resolvedMode}</Text> : null}
      {sessionStatus ? <Text>Status: {sessionStatus}</Text> : null}
      {error ? <Text>{error}</Text> : null}
      <Button
        label="Open Schedule"
        onPress={() => router.replace(resolvedMode === 'coach' ? '/(coach)/schedule' : '/(client)/schedule')}
        disabled={!resolvedMode}
      />
    </Screen>
  );
}
