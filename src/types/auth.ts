import type { components } from '@/openapi/generated';

type AuthResult = components['schemas']['AuthResult'];
type UserSummary = components['schemas']['UserSummary'];

type UserRole = 'coach' | 'client';

type Session = {
  accessToken: AuthResult['access_token'];
  expiresAt: AuthResult['expires_at'];
  onboardingComplete: boolean;
  refreshToken: AuthResult['refresh_token'];
  role: UserRole | null;
  tokenType: AuthResult['token_type'];
  user: UserSummary;
};

export type { Session, UserRole };
