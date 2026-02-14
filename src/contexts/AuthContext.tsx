import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { components } from '@/openapi/generated';
import { getMe, getMyCoachProfile, isNotFoundError, login, logout, refresh, register } from '@/src/api/auth';
import { clearAuthHandlers, setAccessToken, setAuthHandlers } from '@/src/lib/api';
import { clearStoredSession, getStoredSession, setStoredSession } from '@/src/lib/storage';
import type { Session, UserRole } from '@/src/types/auth';

type AuthResult = components['schemas']['AuthResult'];

type AuthContextValue = {
  completeOnboarding: (role: UserRole) => Promise<void>;
  isAuthenticated: boolean;
  isHydrating: boolean;
  session: Session | null;
  signIn: (input: components['schemas']['LoginInput']) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: components['schemas']['RegisterInput']) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

function buildSession(authResult: AuthResult, role: UserRole | null, onboardingComplete: boolean): Session {
  return {
    accessToken: authResult.access_token,
    expiresAt: authResult.expires_at,
    onboardingComplete,
    refreshToken: authResult.refresh_token,
    role,
    tokenType: authResult.token_type,
    user: authResult.user,
  };
}

export function AuthProvider({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const sessionRef = useRef<Session | null>(null);

  const applySession = useCallback(async (nextSession: Session | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
    setAccessToken(nextSession?.accessToken ?? null);

    if (nextSession) {
      await setStoredSession(nextSession);
      return;
    }

    await clearStoredSession();
  }, []);

  const clearSession = useCallback(
    async (notifyBackend: boolean) => {
      const current = sessionRef.current;

      if (notifyBackend && current?.refreshToken) {
        try {
          await logout({ refresh_token: current.refreshToken });
        } catch {
          // Keep logout resilient even when the backend session is already invalid.
        }
      }

      await applySession(null);
    },
    [applySession],
  );

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;

    if (!current?.refreshToken) {
      return null;
    }

    try {
      const authResult = await refresh({ refresh_token: current.refreshToken });
      const nextSession = buildSession(authResult, current.role, current.onboardingComplete);
      await applySession(nextSession);
      return nextSession.accessToken;
    } catch {
      await clearSession(false);
      return null;
    }
  }, [applySession, clearSession]);

  const resolveRole = useCallback(async (): Promise<{ onboardingComplete: boolean; role: UserRole | null }> => {
    try {
      const coachProfile = await getMyCoachProfile();
      return {
        onboardingComplete: Boolean(coachProfile.onboarding_completed),
        role: 'coach',
      };
    } catch (error) {
      if (isNotFoundError(error)) {
        return { onboardingComplete: false, role: null };
      }

      return { onboardingComplete: false, role: null };
    }
  }, []);

  const signIn = useCallback(
    async (input: components['schemas']['LoginInput']) => {
      const authResult = await login(input);
      setAccessToken(authResult.access_token);

      try {
        // Keep user profile fresh right after login to validate token access.
        await getMe();
      } catch {
        // Continue with session bootstrap even if profile fetch has transient issues.
      }

      const roleState = await resolveRole();
      const nextSession = buildSession(authResult, roleState.role, roleState.onboardingComplete);
      await applySession(nextSession);
    },
    [applySession, resolveRole],
  );

  const signUp = useCallback(
    async (input: components['schemas']['RegisterInput']) => {
      const authResult = await register(input);
      const nextSession = buildSession(authResult, null, false);
      await applySession(nextSession);
    },
    [applySession],
  );

  const signOut = useCallback(async () => {
    await clearSession(true);
  }, [clearSession]);

  const completeOnboarding = useCallback(
    async (role: UserRole) => {
      const current = sessionRef.current;

      if (!current) {
        return;
      }

      const nextSession: Session = {
        ...current,
        onboardingComplete: true,
        role,
      };
      await applySession(nextSession);
    },
    [applySession],
  );

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      try {
        const storedSession = await getStoredSession();

        if (!storedSession) {
          return;
        }

        if (!isActive) {
          return;
        }

        sessionRef.current = storedSession;
        setSession(storedSession);
        setAccessToken(storedSession.accessToken);

        const expiresAtMs = Date.parse(storedSession.expiresAt);
        const isExpired = Number.isFinite(expiresAtMs) && expiresAtMs <= Date.now();

        if (isExpired) {
          await refreshSession();
        }
      } finally {
        if (isActive) {
          setIsHydrating(false);
        }
      }
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    setAuthHandlers({
      onAuthFailure: async () => {
        await clearSession(false);
      },
      onRefreshToken: refreshSession,
    });

    return () => {
      clearAuthHandlers();
    };
  }, [clearSession, refreshSession]);

  const value = useMemo(
    () => ({
      completeOnboarding,
      isAuthenticated: session !== null,
      isHydrating,
      session,
      signIn,
      signOut,
      signUp,
    }),
    [completeOnboarding, isHydrating, session, signIn, signOut, signUp],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return value;
}

export type { Session, UserRole };
