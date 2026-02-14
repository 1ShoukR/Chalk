import { type ReactNode, createContext, useContext } from 'react';

type ThemeMode = 'light';

type ThemeContextValue = {
  mode: ThemeMode;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

type Props = {
  children: ReactNode;
};

export function ThemeProvider({ children }: Props) {
  return <ThemeContext.Provider value={{ mode: 'light' }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return value;
}
