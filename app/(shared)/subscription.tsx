import { useRouter } from 'expo-router';
import { Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { getApiErrorMessage, getMyCoachProfile, isNotFoundError } from '@/src/api/auth';
import { checkFeatureAccess, getMySubscription } from '@/src/api/subscriptions';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';
import { useAuth } from '@/src/contexts/AuthContext';

const FEATURE_INVITE_CLIENTS = 'invite_clients';
const FREE_TIER_CLIENT_LIMIT = 3;

function formatFeatureReason(reason: string | undefined): string {
  switch (reason) {
    case 'free_feature':
      return 'Free feature';
    case 'free_tier_available':
      return 'Free tier available';
    case 'free_tier_limit_reached':
      return 'Free tier client limit reached';
    case 'subscription_active':
      return 'Subscription active';
    case 'coach_profile_required':
      return 'Coach profile required';
    case 'subscription_required':
      return 'Subscription required';
    default:
      return reason ?? 'unknown';
  }
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const hasCoachCapability = session?.capabilities.coach.available === true;
  const subscriptionQuery = useQuery({
    queryFn: getMySubscription,
    queryKey: ['subscription', 'me'],
  });
  const inviteAccessQuery = useQuery({
    enabled: hasCoachCapability,
    queryFn: () => checkFeatureAccess(FEATURE_INVITE_CLIENTS),
    queryKey: ['subscription', 'feature-access', FEATURE_INVITE_CLIENTS],
  });
  const coachProfileQuery = useQuery({
    enabled: hasCoachCapability,
    queryFn: getMyCoachProfile,
    queryKey: ['coach', 'profile', 'me'],
  });
  const activeClients = coachProfileQuery.data?.stats?.active_clients ?? 0;
  const freeTierRemaining = Math.max(0, FREE_TIER_CLIENT_LIMIT - activeClients);

  return (
    <Screen title="Subscription" description="Coach billing and plan management shell.">
      {subscriptionQuery.isLoading ? <Text>Loading subscription...</Text> : null}
      {subscriptionQuery.error ? (
        <Text>{getApiErrorMessage(subscriptionQuery.error, 'Unable to load subscription.')}</Text>
      ) : null}
      {subscriptionQuery.data ? (
        <>
          <Text>Status: {subscriptionQuery.data.status ?? 'inactive'}</Text>
          <Text>Product: {subscriptionQuery.data.product_id ?? 'free'}</Text>
          <Text>Expires: {subscriptionQuery.data.expires_at ?? 'N/A'}</Text>
          <Text>Will Renew: {subscriptionQuery.data.will_renew ? 'Yes' : 'No'}</Text>
        </>
      ) : null}
      {hasCoachCapability && inviteAccessQuery.data ? (
        <Text>
          Invite Access: {inviteAccessQuery.data.allowed ? 'Allowed' : 'Blocked'} (
          {formatFeatureReason(inviteAccessQuery.data.reason)})
        </Text>
      ) : null}
      {!hasCoachCapability ? <Text>Switch to Coach mode to view invite feature usage.</Text> : null}
      {hasCoachCapability && coachProfileQuery.data ? (
        <>
          <Text>
            Free Tier Usage: {activeClients}/{FREE_TIER_CLIENT_LIMIT} clients
          </Text>
          <Text>Remaining Free Tier Slots: {freeTierRemaining}</Text>
        </>
      ) : null}
      {hasCoachCapability && coachProfileQuery.error && !isNotFoundError(coachProfileQuery.error) ? (
        <Text>{getApiErrorMessage(coachProfileQuery.error, 'Unable to load coach usage.')}</Text>
      ) : null}
      <Button
        label="View Paywall"
        onPress={() =>
          router.push(
            `/(shared)/paywall?feature=${encodeURIComponent(FEATURE_INVITE_CLIENTS)}&reason=${encodeURIComponent(
              inviteAccessQuery.data?.reason ?? 'subscription_required',
            )}`,
          )
        }
      />
    </Screen>
  );
}
