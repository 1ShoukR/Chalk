import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type CoachProfile = components['schemas']['CoachProfile'];
type CreateInviteCodeInput = components['schemas']['CreateInviteCodeInput'];
type InviteCode = components['schemas']['InviteCode'];
type MessageResponse = components['schemas']['MessageResponse'];
type UpsertCoachProfileInput = components['schemas']['UpsertCoachProfileInput'];

async function upsertMyCoachProfile(input: UpsertCoachProfileInput): Promise<CoachProfile> {
  const { data } = await api.put<CoachProfile>('/api/v1/coaches/me', input);
  return data;
}

async function listInviteCodes(): Promise<InviteCode[]> {
  const { data } = await api.get<InviteCode[]>('/api/v1/coaches/invite-codes');
  return data;
}

async function createInviteCode(input?: CreateInviteCodeInput): Promise<InviteCode> {
  const { data } = await api.post<InviteCode>('/api/v1/coaches/invite-codes', input ?? {});
  return data;
}

async function deactivateInviteCode(id: number): Promise<MessageResponse> {
  const { data } = await api.patch<MessageResponse>(`/api/v1/coaches/invite-codes/${id}/deactivate`);
  return data;
}

export { createInviteCode, deactivateInviteCode, listInviteCodes, upsertMyCoachProfile };
export type { InviteCode };
