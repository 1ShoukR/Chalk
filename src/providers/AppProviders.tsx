import { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';

import { AppConfigProvider } from '@/src/contexts/AppConfigContext';
import { AuthProvider } from '@/src/contexts/AuthContext';
import { ThemeProvider } from '@/src/contexts/ThemeContext';
import { queryClient } from '@/src/lib/queryClient';

type Props = {
  children: ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <AppConfigProvider>{children}</AppConfigProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
