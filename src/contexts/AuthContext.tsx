import { type ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import type { components } from '@/openapi/generated';
import { getMe, getMyCapabilities, login, logout, refresh, register } from '@/src/api/auth';
import { clearAuthHandlers, setAccessToken, setAuthHandlers } from '@/src/lib/api';
import { clearStoredSession, getStoredSession, setStoredSession } from '@/src/lib/storage';
import type { AccountCapabilities, AppMode, ModeCapability, Session, SetupStatus, UserRole } from '@/src/types/auth';

type AuthResult = components['schemas']['AuthResult'];
type ApiModeCapability = components['schemas']['ModeCapability'];
type RawStoredSession = {
  accessToken?: unknown;
  activeMode?: unknown;
  capabilities?: unknown;
  expiresAt?: unknown;
  onboardingComplete?: unknown;
  refreshToken?: unknown;
  role?: unknown;
  tokenType?: unknown;
  user?: unknown;
};

type AuthContextValue = {
  completeOnboarding: (role: UserRole) => Promise<void>;
  isAuthenticated: boolean;
  isHydrating: boolean;
  refreshCapabilities: () => Promise<void>;
  session: Session | null;
  setActiveMode: (mode: AppMode) => Promise<void>;
  signIn: (input: components['schemas']['LoginInput']) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (input: components['schemas']['RegisterInput']) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

function isAppMode(value: unknown): value is AppMode {
  return value === 'coach' || value === 'client';
}

function isSetupStatus(value: unknown): value is SetupStatus {
  return value === 'not_started' || value === 'in_progress' || value === 'complete';
}

function createDefaultCapability(): ModeCapability {
  return {
    available: false,
    setupStatus: 'not_started',
  };
}

function createDefaultCapabilities(): AccountCapabilities {
  return {
    client: createDefaultCapability(),
    coach: createDefaultCapability(),
  };
}

function normalizeCapability(raw: unknown): ModeCapability {
  if (!raw || typeof raw !== 'object') {
    return createDefaultCapability();
  }

  const candidate = raw as { available?: unknown; setupStatus?: unknown };
  const setupStatus = isSetupStatus(candidate.setupStatus) ? candidate.setupStatus : 'not_started';
  const available = candidate.available === true || setupStatus !== 'not_started';

  return {
    available,
    setupStatus,
  };
}

function normalizeApiCapability(raw: ApiModeCapability | undefined): ModeCapability {
  const setupStatus = raw?.setup_status ?? 'not_started';
  const available = raw?.available ?? setupStatus !== 'not_started';

  return {
    available,
    setupStatus,
  };
}

function isModeReady(capability: ModeCapability): boolean {
  return capability.available && capability.setupStatus === 'complete';
}

function chooseActiveMode(preferredMode: AppMode | null, capabilities: AccountCapabilities): AppMode | null {
  if (preferredMode && isModeReady(capabilities[preferredMode])) {
    return preferredMode;
  }

  if (isModeReady(capabilities.coach)) {
    return 'coach';
  }

  if (isModeReady(capabilities.client)) {
    return 'client';
  }

  return null;
}

function buildSession(authResult: AuthResult, capabilities: AccountCapabilities, activeMode: AppMode | null): Session {
  return {
    accessToken: authResult.access_token,
    activeMode,
    capabilities,
    expiresAt: authResult.expires_at,
    refreshToken: authResult.refresh_token,
    tokenType: authResult.token_type,
    user: authResult.user,
  };
}

function normalizeStoredSession(raw: unknown): Session | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const candidate = raw as RawStoredSession;

  if (
    typeof candidate.accessToken !== 'string' ||
    typeof candidate.refreshToken !== 'string' ||
    typeof candidate.tokenType !== 'string' ||
    typeof candidate.expiresAt !== 'string' ||
    !candidate.user ||
    typeof candidate.user !== 'object'
  ) {
    return null;
  }

  const legacyRole = isAppMode(candidate.role) ? candidate.role : null;
  const legacyOnboardingComplete = candidate.onboardingComplete === true;
  const defaultCapabilities = createDefaultCapabilities();

  if (legacyRole) {
    defaultCapabilities[legacyRole] = {
      available: true,
      setupStatus: legacyOnboardingComplete ? 'complete' : 'in_progress',
    };
  }

  const parsedCapabilities =
    candidate.capabilities && typeof candidate.capabilities === 'object'
      ? (() => {
          const value = candidate.capabilities as { coach?: unknown; client?: unknown };
          return {
            client: normalizeCapability(value.client),
            coach: normalizeCapability(value.coach),
          };
        })()
      : defaultCapabilities;

  const preferredMode = isAppMode(candidate.activeMode) ? candidate.activeMode : legacyRole;
  const activeMode = chooseActiveMode(preferredMode, parsedCapabilities);

  return {
    accessToken: candidate.accessToken,
    activeMode,
    capabilities: parsedCapabilities,
    expiresAt: candidate.expiresAt,
    refreshToken: candidate.refreshToken,
    tokenType: candidate.tokenType,
    user: candidate.user as components['schemas']['UserSummary'],
  };
}

function capabilitiesEqual(left: AccountCapabilities, right: AccountCapabilities): boolean {
  return (
    left.coach.available === right.coach.available &&
    left.coach.setupStatus === right.coach.setupStatus &&
    left.client.available === right.client.available &&
    left.client.setupStatus === right.client.setupStatus
  );
}

export function AuthProvider({ children }: Props) {
  const queryClient = useQueryClient();
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

  const resolveCapabilities = useCallback(async (base: AccountCapabilities): Promise<AccountCapabilities> => {
    try {
      const response = await getMyCapabilities();
      const serverCapabilities: AccountCapabilities = {
        client: normalizeApiCapability(response.client),
        coach: normalizeApiCapability(response.coach),
      };

      return {
        client:
          serverCapabilities.client.setupStatus === 'not_started' && base.client.setupStatus === 'in_progress'
            ? base.client
            : serverCapabilities.client,
        coach:
          serverCapabilities.coach.setupStatus === 'not_started' && base.coach.setupStatus === 'in_progress'
            ? base.coach
            : serverCapabilities.coach,
      };
    } catch {
      return {
        client: { ...base.client },
        coach: { ...base.coach },
      };
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;

    if (!current?.refreshToken) {
      return null;
    }

    try {
      const authResult = await refresh({ refresh_token: current.refreshToken });
      const nextSession = buildSession(
        authResult,
        current.capabilities,
        chooseActiveMode(current.activeMode, current.capabilities),
      );
      await applySession(nextSession);
      return nextSession.accessToken;
    } catch {
      await clearSession(false);
      return null;
    }
  }, [applySession, clearSession]);

  const refreshCapabilities = useCallback(async () => {
    const current = sessionRef.current;

    if (!current) {
      return;
    }

    const nextCapabilities = await resolveCapabilities(current.capabilities);
    const nextActiveMode = chooseActiveMode(current.activeMode, nextCapabilities);

    if (capabilitiesEqual(current.capabilities, nextCapabilities) && current.activeMode === nextActiveMode) {
      return;
    }

    const nextSession: Session = {
      ...current,
      activeMode: nextActiveMode,
      capabilities: nextCapabilities,
    };
    await applySession(nextSession);
  }, [applySession, resolveCapabilities]);

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

      const previousSession = sessionRef.current;
      const canReusePreviousCapabilities =
        previousSession?.user.id !== undefined &&
        authResult.user.id !== undefined &&
        previousSession.user.id === authResult.user.id;

      const startingCapabilities = canReusePreviousCapabilities
        ? previousSession.capabilities
        : createDefaultCapabilities();
      const resolvedCapabilities = await resolveCapabilities(startingCapabilities);
      const preferredMode = canReusePreviousCapabilities ? previousSession.activeMode : null;

      const nextSession = buildSession(authResult, resolvedCapabilities, chooseActiveMode(preferredMode, resolvedCapabilities));
      await applySession(nextSession);
    },
    [applySession, resolveCapabilities],
  );

  const signUp = useCallback(
    async (input: components['schemas']['RegisterInput']) => {
      const authResult = await register(input);
      const nextSession = buildSession(authResult, createDefaultCapabilities(), null);
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

      const nextCapabilities: AccountCapabilities = {
        ...current.capabilities,
        [role]: {
          available: true,
          setupStatus: 'complete',
        },
      };
      const nextSession: Session = {
        ...current,
        activeMode: chooseActiveMode(current.activeMode, nextCapabilities) ?? role,
        capabilities: nextCapabilities,
      };
      await applySession(nextSession);
    },
    [applySession],
  );

  const setActiveMode = useCallback(
    async (mode: AppMode) => {
      const current = sessionRef.current;

      if (!current || !isModeReady(current.capabilities[mode]) || current.activeMode === mode) {
        return;
      }

      const nextSession: Session = {
        ...current,
        activeMode: mode,
      };
      await applySession(nextSession);

      const oppositeMode: AppMode = mode === 'coach' ? 'client' : 'coach';
      queryClient.removeQueries({ queryKey: [oppositeMode] });
    },
    [applySession, queryClient],
  );

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      try {
        const rawStoredSession = await getStoredSession();

        if (!rawStoredSession) {
          return;
        }

        const storedSession = normalizeStoredSession(rawStoredSession);

        if (!storedSession) {
          await clearStoredSession();
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
          return;
        }

        await refreshCapabilities();
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
  }, [refreshCapabilities, refreshSession]);

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
      refreshCapabilities,
      session,
      setActiveMode,
      signIn,
      signOut,
      signUp,
    }),
    [completeOnboarding, isHydrating, refreshCapabilities, session, setActiveMode, signIn, signOut, signUp],
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

export type { AppMode, Session, SetupStatus, UserRole };
