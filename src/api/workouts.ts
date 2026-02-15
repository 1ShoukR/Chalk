import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type Workout = components['schemas']['Workout'];

async function getMyWorkout(id: number): Promise<Workout> {
  const { data } = await api.get<Workout>(`/api/v1/workouts/me/${id}`);
  return data;
}

export { getMyWorkout };
export type { Workout };
