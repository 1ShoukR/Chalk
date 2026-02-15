import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type AcceptInviteInput = components['schemas']['AcceptInviteInput'];
type AcceptInviteResult = components['schemas']['AcceptInviteResult'];
type InvitePreview = components['schemas']['InvitePreview'];

async function getInvitePreview(code: string): Promise<InvitePreview> {
  const { data } = await api.get<InvitePreview>(`/api/v1/invites/${encodeURIComponent(code)}`);
  return data;
}

async function acceptInvite(input: AcceptInviteInput): Promise<AcceptInviteResult> {
  const { data } = await api.post<AcceptInviteResult>('/api/v1/invites/accept', input);
  return data;
}

export { acceptInvite, getInvitePreview };
