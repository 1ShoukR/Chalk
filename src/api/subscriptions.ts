import type { components } from '@/openapi/generated';
import { api } from '@/src/lib/api';

type FeatureAccessResult = components['schemas']['FeatureAccessResult'];
type Subscription = components['schemas']['Subscription'];

async function getMySubscription(): Promise<Subscription> {
  const { data } = await api.get<Subscription>('/api/v1/subscriptions/me');
  return data;
}

async function checkFeatureAccess(feature: string): Promise<FeatureAccessResult> {
  const normalizedFeature = feature.trim().toLowerCase();
  const { data } = await api.get<FeatureAccessResult>(
    `/api/v1/features/${encodeURIComponent(normalizedFeature)}/access`,
  );
  return data;
}

export { checkFeatureAccess, getMySubscription };
export type { FeatureAccessResult, Subscription };
