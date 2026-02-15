import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Text, TextInput } from 'react-native';

import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';
import { acceptInvite, getInvitePreview } from '@/src/api/invites';
import { getApiErrorMessage } from '@/src/api/auth';
import type { components } from '@/openapi/generated';

type InvitePreview = components['schemas']['InvitePreview'];

export default function ClientOnboardingStep2() {
  const router = useRouter();
  const params = useLocalSearchParams<{ inviteCode?: string | string[] }>();
  const { completeOnboarding, refreshCapabilities, setActiveMode } = useAuth();
  const rawInviteCode = Array.isArray(params.inviteCode) ? params.inviteCode[0] : params.inviteCode;
  const inviteCodeParam = typeof rawInviteCode === 'string' ? rawInviteCode.trim() : '';
  const [inviteCode, setInviteCode] = useState('');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCode = inviteCode.trim();

  const previewCode = useCallback(async (code: string) => {
    const nextCode = code.trim();
    if (!nextCode) {
      setError('Invite code is required.');
      setPreview(null);
      return;
    }

    setError(null);
    setIsPreviewing(true);

    try {
      const invitePreview = await getInvitePreview(nextCode);
      setPreview(invitePreview);
    } catch (nextError) {
      setPreview(null);
      setError(getApiErrorMessage(nextError, 'Unable to preview invite.'));
    } finally {
      setIsPreviewing(false);
    }
  }, []);

  useEffect(() => {
    if (!inviteCodeParam) {
      return;
    }

    setInviteCode(inviteCodeParam);
    void previewCode(inviteCodeParam);
  }, [inviteCodeParam, previewCode]);

  const onPreview = async () => {
    if (isPreviewing || isSubmitting) {
      return;
    }

    await previewCode(normalizedCode);
  };

  const onFinish = async () => {
    if (isSubmitting) {
      return;
    }

    if (!normalizedCode) {
      setError('Invite code is required.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await acceptInvite({ code: normalizedCode });
      await completeOnboarding('client');
      await refreshCapabilities();
      await setActiveMode('client');
      router.replace('/');
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Unable to connect to coach with this invite code.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Screen title="Client Setup - Step 2" description="Connect to your coach">
      <Text>Invite Code</Text>
      <TextInput
        value={inviteCode}
        onChangeText={setInviteCode}
        placeholder="Enter invite code"
        autoCapitalize="characters"
      />
      <Button label={isPreviewing ? 'Checking...' : 'Preview Coach'} onPress={onPreview} disabled={isPreviewing} variant="secondary" />

      {preview ? (
        <>
          <Text>Coach: {preview.business_name || 'Coach'}</Text>
          <Text>Code: {preview.code || normalizedCode}</Text>
        </>
      ) : null}

      {error ? <Text>{error}</Text> : null}
      <Button label={isSubmitting ? 'Connecting...' : 'Connect and Finish'} onPress={onFinish} disabled={isSubmitting} />
    </Screen>
  );
}
