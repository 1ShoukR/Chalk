import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { acceptInvite, getInvitePreview } from '@/src/api/invites';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';
import type { components } from '@/openapi/generated';

type InvitePreview = components['schemas']['InvitePreview'];

export default function InviteDeepLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const { completeOnboarding, refreshCapabilities, session, setActiveMode } = useAuth();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const rawCode = Array.isArray(params.code) ? params.code[0] : params.code;
  const inviteCode = typeof rawCode === 'string' ? rawCode.trim() : '';

  useEffect(() => {
    let isActive = true;

    const loadPreview = async () => {
      if (!inviteCode) {
        setError('Invite code is missing.');
        setPreview(null);
        return;
      }

      setError(null);
      setIsLoadingPreview(true);

      try {
        const response = await getInvitePreview(inviteCode);
        if (isActive) {
          setPreview(response);
        }
      } catch (nextError) {
        if (isActive) {
          setPreview(null);
          setError(getApiErrorMessage(nextError, 'Unable to load invite preview.'));
        }
      } finally {
        if (isActive) {
          setIsLoadingPreview(false);
        }
      }
    };

    void loadPreview();

    return () => {
      isActive = false;
    };
  }, [inviteCode]);

  const toAuth = (target: 'sign-in' | 'sign-up') => {
    if (!inviteCode) {
      router.push('/(auth)/welcome');
      return;
    }

    router.push(`/(auth)/${target}?inviteCode=${encodeURIComponent(inviteCode)}`);
  };

  const onAcceptInvite = async () => {
    if (isAccepting) {
      return;
    }

    if (!inviteCode) {
      setError('Invite code is missing.');
      return;
    }

    if (!session) {
      toAuth('sign-in');
      return;
    }

    setError(null);
    setIsAccepting(true);

    try {
      await acceptInvite({ code: inviteCode });
      await completeOnboarding('client');
      await refreshCapabilities();
      await setActiveMode('client');
      router.replace('/');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Unable to accept invite.'));
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <Screen title="Coach Invite" description="Review this invite and continue to connect with your coach.">
      <Text>Invite Code: {inviteCode || 'N/A'}</Text>
      {isLoadingPreview ? <Text>Loading invite preview...</Text> : null}
      {preview ? <Text>Coach: {preview.business_name || 'Coach'}</Text> : null}
      {preview?.expires_at ? <Text>Expires At: {preview.expires_at}</Text> : null}
      {error ? <Text>{error}</Text> : null}

      {session ? (
        <Button
          label={isAccepting ? 'Connecting...' : 'Accept Invite'}
          onPress={onAcceptInvite}
          disabled={isAccepting || isLoadingPreview}
        />
      ) : (
        <>
          <Button label="Sign In to Accept" onPress={() => toAuth('sign-in')} />
          <Button label="Create Account to Accept" onPress={() => toAuth('sign-up')} variant="secondary" />
        </>
      )}
    </Screen>
  );
}
