import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Share, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getApiErrorMessage } from '@/src/api/auth';
import { createInviteCode, deactivateInviteCode, listInviteCodes } from '@/src/api/coaches';
import { checkFeatureAccess } from '@/src/api/subscriptions';
import { Button } from '@/src/components/mvp/Button';
import { Screen } from '@/src/components/mvp/Screen';

const FEATURE_INVITE_CLIENTS = 'invite_clients';

export default function CoachClientsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState<number | null>(null);
  const inviteCodesQuery = useQuery({
    queryFn: listInviteCodes,
    queryKey: ['coach', 'invite-codes'],
  });
  const inviteAccessQuery = useQuery({
    queryFn: () => checkFeatureAccess(FEATURE_INVITE_CLIENTS),
    queryKey: ['coach', 'feature-access', FEATURE_INVITE_CLIENTS],
  });

  const createInviteCodeMutation = useMutation({
    mutationFn: () => createInviteCode({ expires_in_days: 7 }),
    onError: (nextError) => {
      setError(getApiErrorMessage(nextError, 'Unable to create invite code.'));
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['coach', 'invite-codes'] });
    },
  });

  const deactivateInviteCodeMutation = useMutation({
    mutationFn: (id: number) => deactivateInviteCode(id),
    onError: (nextError) => {
      setError(getApiErrorMessage(nextError, 'Unable to deactivate invite code.'));
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['coach', 'invite-codes'] });
    },
  });

  const onShare = async (code: string | undefined, inviteId: number | undefined) => {
    if (!code || !inviteId) {
      return;
    }

    setIsSharing(inviteId);
    setError(null);

    try {
      const inviteLink = `chalk://invite/${code}`;
      await Share.share({
        message: `Join me on Chalk using invite code ${code}. Open this link: ${inviteLink}`,
      });
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, 'Unable to open share sheet.'));
    } finally {
      setIsSharing(null);
    }
  };

  const inviteCodes = inviteCodesQuery.data ?? [];
  const canCreateInvite = inviteAccessQuery.data?.allowed === true;

  const onCreateInvite = () => {
    if (createInviteCodeMutation.isPending || inviteAccessQuery.isLoading) {
      return;
    }

    if (!canCreateInvite) {
      const reason = inviteAccessQuery.data?.reason ?? 'subscription_required';
      router.push(
        `/(shared)/paywall?feature=${encodeURIComponent(FEATURE_INVITE_CLIENTS)}&reason=${encodeURIComponent(reason)}`,
      );
      return;
    }

    createInviteCodeMutation.mutate();
  };

  return (
    <Screen title="Clients" description="Invite code lifecycle and client management entry point.">
      <Button
        label={
          inviteAccessQuery.isLoading
            ? 'Checking Access...'
            : createInviteCodeMutation.isPending
              ? 'Creating Invite...'
              : canCreateInvite
                ? 'Create Invite Code'
                : 'Upgrade to Create Invite'
        }
        onPress={onCreateInvite}
        disabled={createInviteCodeMutation.isPending || inviteAccessQuery.isLoading}
      />
      {inviteCodesQuery.isLoading ? <Text>Loading invite codes...</Text> : null}
      {inviteCodesQuery.error ? <Text>{getApiErrorMessage(inviteCodesQuery.error, 'Unable to load invite codes.')}</Text> : null}
      {inviteAccessQuery.error ? <Text>{getApiErrorMessage(inviteAccessQuery.error, 'Unable to check invite access.')}</Text> : null}
      {error ? <Text>{error}</Text> : null}
      {inviteCodesQuery.data && inviteCodes.length === 0 ? <Text>No invite codes yet.</Text> : null}
      {inviteCodes.map((invite, index) => (
        <View key={invite.id ? `invite-${invite.id}` : invite.code ? `invite-${invite.code}` : `invite-${index}`}>
          <Text>
          Code: {invite.code ?? 'N/A'} | Active: {invite.is_active ? 'Yes' : 'No'} | Expires:{' '}
          {invite.expires_at ?? 'N/A'}
          </Text>
          <Button
            label={isSharing === invite.id ? 'Sharing...' : 'Share Invite'}
            onPress={() => void onShare(invite.code, invite.id)}
            variant="secondary"
            disabled={isSharing === invite.id}
          />
          <Button
            label={deactivateInviteCodeMutation.isPending ? 'Updating...' : 'Deactivate'}
            onPress={() => (invite.id ? deactivateInviteCodeMutation.mutate(invite.id) : undefined)}
            variant="secondary"
            disabled={!invite.id || !invite.is_active || deactivateInviteCodeMutation.isPending}
          />
        </View>
      ))}
      <Link asChild href="/(shared)/subscription">
        <Button label="Open Subscription / Paywall" />
      </Link>
    </Screen>
  );
}
