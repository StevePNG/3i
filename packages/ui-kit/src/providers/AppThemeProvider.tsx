import type { PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { TamaguiProvider, Theme } from 'tamagui';
import { config } from '../tamagui.config';

export const AppThemeProvider = ({ children }: PropsWithChildren) => {
  const scheme = useColorScheme();
  const themeName = scheme === 'dark' ? 'dark' : 'light';

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Theme name={themeName}>{children}</Theme>
    </TamaguiProvider>
  );
};

