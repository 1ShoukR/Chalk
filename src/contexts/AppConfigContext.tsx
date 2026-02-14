import { type ReactNode, createContext, useContext, useMemo } from 'react';

type FeatureFlagKey =
  | 'dark_mode'
  | 'nutrition_tracking'
  | 'oauth_login'
  | 'photo_messages'
  | 'progress_photos';

type FeatureFlags = Record<FeatureFlagKey, boolean>;

type AppConfigContextValue = {
  features: FeatureFlags;
  hasFeature: (key: FeatureFlagKey) => boolean;
};

const defaultFeatures: FeatureFlags = {
  dark_mode: false,
  nutrition_tracking: false,
  oauth_login: false,
  photo_messages: false,
  progress_photos: false,
};

const AppConfigContext = createContext<AppConfigContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function AppConfigProvider({ children }: Props) {
  const value = useMemo<AppConfigContextValue>(
    () => ({
      features: defaultFeatures,
      hasFeature: (key: FeatureFlagKey) => defaultFeatures[key],
    }),
    [],
  );

  return <AppConfigContext.Provider value={value}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const value = useContext(AppConfigContext);

  if (!value) {
    throw new Error('useAppConfig must be used within AppConfigProvider');
  }

  return value;
}

export type { FeatureFlagKey };
