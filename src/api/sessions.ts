import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type Session = components['schemas']['Session'];
type SessionsResponse = components['schemas']['SessionsResponse'];

async function listMySessions(): Promise<Session[]> {
  const { data } = await api.get<SessionsResponse>('/api/v1/sessions/me');
  return data.data ?? [];
}

export { listMySessions };
export type { Session };
