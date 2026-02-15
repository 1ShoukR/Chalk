import type { components } from '@/openapi/generated';

type AuthResult = components['schemas']['AuthResult'];
type UserSummary = components['schemas']['UserSummary'];

type AppMode = 'coach' | 'client';
type UserRole = AppMode;
type SetupStatus = 'not_started' | 'in_progress' | 'complete';

type ModeCapability = {
  available: boolean;
  setupStatus: SetupStatus;
};

type AccountCapabilities = {
  coach: ModeCapability;
  client: ModeCapability;
};

type Session = {
  accessToken: AuthResult['access_token'];
  activeMode: AppMode | null;
  capabilities: AccountCapabilities;
  expiresAt: AuthResult['expires_at'];
  refreshToken: AuthResult['refresh_token'];
  tokenType: AuthResult['token_type'];
  user: UserSummary;
};

export type { AccountCapabilities, AppMode, ModeCapability, Session, SetupStatus, UserRole };
