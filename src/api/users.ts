import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type UpdateMeInput = components['schemas']['UpdateMeInput'];
type User = components['schemas']['User'];

async function updateMe(input: UpdateMeInput): Promise<User> {
  const { data } = await api.patch<User>('/api/v1/users/me', input);
  return data;
}

export { updateMe };
