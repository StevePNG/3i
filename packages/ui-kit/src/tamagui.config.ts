import { createFont, createShorthands, createTamagui } from 'tamagui';
import { media } from './theme/media';
import { tokens } from './theme/tokens';
import { themes } from './theme/themes';

const bodyFont = createFont({
  family: 'Inter, "Helvetica Neue", Arial, sans-serif',
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 48
  },
  lineHeight: {
    1: 16,
    2: 20,
    3: 22,
    4: 24,
    5: 28,
    6: 32,
    7: 36,
    8: 40,
    9: 44,
    10: 60
  },
  weight: {
    1: '300',
    2: '400',
    3: '500',
    4: '600',
    5: '700'
  },
  letterSpacing: {
    1: 0,
    2: 0.2,
    3: 0.4,
    4: 0.4,
    5: 0.6
  }
});

const headingFont = createFont({
  family: 'Sora, "Inter", "Helvetica Neue", Arial, sans-serif',
  size: {
    1: 18,
    2: 20,
    3: 24,
    4: 28,
    5: 32,
    6: 36,
    7: 40,
    8: 48,
    9: 56,
    10: 64
  },
  lineHeight: {
    1: 24,
    2: 26,
    3: 30,
    4: 34,
    5: 38,
    6: 42,
    7: 46,
    8: 54,
    9: 60,
    10: 72
  },
  weight: {
    1: '400',
    2: '500',
    3: '600',
    4: '700'
  },
  letterSpacing: {
    1: -0.2,
    2: -0.25,
    3: -0.3,
    4: -0.35,
    5: -0.4
  }
});

const monoFont = createFont({
  family: '"JetBrains Mono", "Fira Code", monospace',
  size: bodyFont.size,
  lineHeight: bodyFont.lineHeight,
  weight: {
    1: '300',
    2: '400',
    3: '500',
    4: '600',
    5: '700'
  },
  letterSpacing: bodyFont.letterSpacing
});

export const config = createTamagui({
  themes,
  tokens,
  fonts: {
    body: bodyFont,
    heading: headingFont,
    mono: monoFont
  },
  media,
  shorthands: createShorthands({
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    mx: 'marginHorizontal',
    my: 'marginVertical'
  })
});

export type AppConfig = typeof config;

export default config;
