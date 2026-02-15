import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type Conversation = components['schemas']['Conversation'];
type ConversationsResponse = components['schemas']['ConversationsResponse'];

async function listConversations(): Promise<Conversation[]> {
  const { data } = await api.get<ConversationsResponse>('/api/v1/messages/conversations');
  return data.data ?? [];
}

export { listConversations };
export type { Conversation };
