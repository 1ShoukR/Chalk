import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text } from 'react-native';

import { getApiErrorMessage } from '@/src/api/auth';
import { listConversations } from '@/src/api/messages';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ChatDeepLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ coachId?: string | string[] }>();
  const { session, setActiveMode } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  const rawCoachId = Array.isArray(params.coachId) ? params.coachId[0] : params.coachId;
  const coachId = Number(rawCoachId);
  const isValidCoachId = Number.isFinite(coachId) && coachId > 0;

  useEffect(() => {
    let isActive = true;

    const resolve = async () => {
      if (!session || !isValidCoachId) {
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

        const conversations = await listConversations();
        const conversation = conversations.find((item) => item.coach_id === coachId);

        if (isActive) {
          setConversationId(conversation?.id ?? null);
        }
      } catch (nextError) {
        if (isActive) {
          setConversationId(null);
          setError(getApiErrorMessage(nextError, 'Unable to open chat.'));
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
  }, [coachId, isValidCoachId, session, setActiveMode]);

  if (!isValidCoachId) {
    return (
      <Screen title="Chat Link" description="This chat link is invalid.">
        <Button label="Go Home" onPress={() => router.replace('/')} />
      </Screen>
    );
  }

  if (!session) {
    const returnTo = encodeURIComponent(`/chat/${coachId}`);

    return (
      <Screen title="Chat Link" description="Sign in to open this chat.">
        <Button label="Sign In" onPress={() => router.push(`/(auth)/sign-in?returnTo=${returnTo}`)} />
        <Button label="Create Account" onPress={() => router.push(`/(auth)/sign-up?returnTo=${returnTo}`)} variant="secondary" />
      </Screen>
    );
  }

  if (session.capabilities.client.setupStatus !== 'complete') {
    return (
      <Screen title="Chat Link" description="Client setup is required before opening coach chat.">
        <Button label="Set Up Client Mode" onPress={() => router.push('/(onboarding)/client/step-1')} />
      </Screen>
    );
  }

  return (
    <Screen title="Chat Link" description="Chat deep link resolved.">
      <Text>Coach ID: {coachId}</Text>
      {isResolving ? <Text>Loading chat...</Text> : null}
      {conversationId ? <Text>Conversation ID: {conversationId}</Text> : <Text>No existing conversation found yet.</Text>}
      {error ? <Text>{error}</Text> : null}
      <Button
        label="Open Chat Tab"
        onPress={() =>
          router.replace(
            conversationId
              ? `/(client)/messages?coachId=${coachId}&conversationId=${conversationId}`
              : `/(client)/messages?coachId=${coachId}`,
          )
        }
      />
    </Screen>
  );
}
