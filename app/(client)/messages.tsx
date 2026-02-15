import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import { Screen } from '@/src/components/mvp/Screen';

export default function ClientMessagesScreen() {
  const params = useLocalSearchParams<{ coachId?: string | string[]; conversationId?: string | string[] }>();
  const coachId = Array.isArray(params.coachId) ? params.coachId[0] : params.coachId;
  const conversationId = Array.isArray(params.conversationId) ? params.conversationId[0] : params.conversationId;

  return (
    <Screen title="Client Chat" description="Client-coach chat shell. Full message threading will be added in Phase 2.">
      {coachId ? <Text>Coach ID: {coachId}</Text> : null}
      {conversationId ? <Text>Conversation ID: {conversationId}</Text> : null}
    </Screen>
  );
}
