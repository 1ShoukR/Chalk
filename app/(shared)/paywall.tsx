import { useLocalSearchParams, useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage } from '@/src/api/auth';
import { checkFeatureAccess, getMySubscription } from '@/src/api/subscriptions';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

function formatFeatureReason(reason: string): string {
  switch (reason) {
    case 'free_tier_limit_reached':
      return 'Free tier client limit reached';
    case 'coach_profile_required':
      return 'Coach profile required before using this feature';
    case 'subscription_required':
      return 'Subscription required';
    case 'subscription_active':
      return 'Subscription active';
    case 'free_tier_available':
      return 'Free tier still available';
    case 'free_feature':
      return 'Free feature';
    default:
      return reason;
  }
}

export default function PaywallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ feature?: string | string[]; reason?: string | string[] }>();
  const rawFeature = Array.isArray(params.feature) ? params.feature[0] : params.feature;
  const rawReason = Array.isArray(params.reason) ? params.reason[0] : params.reason;
  const feature = typeof rawFeature === 'string' ? rawFeature.trim().toLowerCase() : '';
  const reason = typeof rawReason === 'string' ? rawReason.trim() : '';

  const subscriptionQuery = useQuery({
    queryFn: getMySubscription,
    queryKey: ['subscription', 'me'],
  });
  const featureAccessQuery = useQuery({
    enabled: feature.length > 0,
    queryFn: () => checkFeatureAccess(feature),
    queryKey: ['subscription', 'feature-access', feature],
  });

  const isAllowed = featureAccessQuery.data?.allowed === true;
  const displayReason = featureAccessQuery.data?.reason ?? (reason || 'subscription_required');

  return (
    <Screen
      title="Paywall"
      description="Subscription required for this feature. Upgrade flow wiring is the next integration step.">
      <Text>Feature: {feature || 'N/A'}</Text>
      <Text>Reason: {formatFeatureReason(displayReason)}</Text>
      {subscriptionQuery.data ? <Text>Current Status: {subscriptionQuery.data.status ?? 'inactive'}</Text> : null}
      {subscriptionQuery.error ? (
        <Text>{getApiErrorMessage(subscriptionQuery.error, 'Unable to load subscription status.')}</Text>
      ) : null}
      {featureAccessQuery.error ? (
        <Text>{getApiErrorMessage(featureAccessQuery.error, 'Unable to verify feature access.')}</Text>
      ) : null}
      <Button label="Open Subscription Screen" onPress={() => router.push('/(shared)/subscription')} />
      <Button label="Back" onPress={() => router.back()} variant="secondary" />
      {isAllowed ? <Button label="Continue" onPress={() => router.replace('/')} variant="secondary" /> : null}
    </Screen>
  );
}
