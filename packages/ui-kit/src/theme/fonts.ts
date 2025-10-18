/**
 * Font scale definitions for consistent typography across the app.
 *
 * Includes:
 * - Font sizes (numeric and named scales)
 * - Line heights (body and heading variants)
 * - Font weights
 * - Letter spacing
 *
 * These are used in tamagui.config.ts to create font presets.
 */

export const fontSizeScale = {
  1: 12,
  2: 14,
  3: 16,
  4: 18,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 48,
  xs: 12,
  sm: 14,
  md: 16,
  lg: 24,
  xl: 32
} as const;

export const bodyLineHeightScale = {
  1: 16,
  2: 20,
  3: 22,
  4: 24,
  5: 28,
  6: 32,
  7: 36,
  8: 40,
  9: 44,
  10: 60,
  sm: 20,
  md: 22,
  lg: 32,
  xl: 40
} as const;

export const headingFontSizeScale = {
  1: 18,
  2: 20,
  3: 24,
  4: 28,
  5: 32,
  6: 36,
  7: 40,
  8: 48,
  9: 56,
  10: 64,
  sm: 20,
  md: 24,
  lg: 36,
  xl: 48
} as const;

export const headingLineHeightScale = {
  1: 24,
  2: 26,
  3: 30,
  4: 34,
  5: 38,
  6: 42,
  7: 46,
  8: 54,
  9: 60,
  10: 72,
  sm: 26,
  md: 30,
  lg: 38,
  xl: 46
} as const;

export const fontWeightScale = {
  1: '300',
  2: '400',
  3: '500',
  4: '600',
  5: '700'
} as const;

export const letterSpacingScale = {
  1: 0,
  2: 0.2,
  3: 0.4,
  4: 0.4,
  5: 0.6
} as const;

export const headingLetterSpacingScale = {
  1: -0.2,
  2: -0.25,
  3: -0.3,
  4: -0.35,
  5: -0.4
} as const;
