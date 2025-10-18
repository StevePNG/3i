import { createFont, createShorthands, createTamagui } from 'tamagui';
import { media } from './theme/media';
import { tokens } from './theme/tokens';
import { themes } from './theme/themes';
import {
  fontSizeScale,
  bodyLineHeightScale,
  headingFontSizeScale,
  headingLineHeightScale,
  fontWeightScale,
  letterSpacingScale,
  headingLetterSpacingScale
} from './theme/fonts';

const bodyFont = createFont({
  family: 'Inter, "Helvetica Neue", Arial, sans-serif',
  size: fontSizeScale,
  lineHeight: bodyLineHeightScale,
  weight: fontWeightScale,
  letterSpacing: letterSpacingScale
});

const headingFont = createFont({
  family: 'Sora, "Inter", "Helvetica Neue", Arial, sans-serif',
  size: headingFontSizeScale,
  lineHeight: headingLineHeightScale,
  weight: fontWeightScale,
  letterSpacing: headingLetterSpacingScale
});

const monoFont = createFont({
  family: '"JetBrains Mono", "Fira Code", monospace',
  size: fontSizeScale,
  lineHeight: bodyLineHeightScale,
  weight: fontWeightScale,
  letterSpacing: letterSpacingScale
});

export const config = createTamagui({
  themes,
  tokens,
  fonts: {
    body: bodyFont,
    heading: headingFont,
    mono: monoFont
  },
  defaultFont: 'body',
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
