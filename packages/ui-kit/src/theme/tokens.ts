import { createTokens } from 'tamagui';

export const tokens = createTokens({
  color: {
    backgroundLight: '#f8fafc',
    backgroundDark: '#0f172a',
    surfaceLight: '#ffffff',
    surfaceStrongLight: '#e2e8f0',
    surfaceDark: '#111827',
    surfaceStrongDark: '#1f2937',
    borderLight: '#cbd5f5',
    borderDark: '#1e293b',
    overlay: 'rgba(15, 23, 42, 0.6)',
    primary: '#2563eb',
    primaryActive: '#1d4ed8',
    accent: '#22d3ee',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#38bdf8',
    textPrimary: '#0f172a',
    textInverse: '#f9fafb',
    textMuted: '#64748b'
  },
  space: {
    true: 16,
    '0': 0,
    '1': 4,
    '2': 8,
    '3': 12,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 32,
    '8': 40,
    '9': 48,
    '10': 64
  },
  size: {
    true: 16,
    '0': 0,
    '1': 4,
    '2': 8,
    '3': 12,
    '4': 16,
    '5': 20,
    '6': 24,
    '7': 32,
    '8': 40,
    '9': 48,
    '10': 64,
    '11': 80,
    '12': 96
  },
  radius: {
    true: 12,
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 28,
    full: 999
  },
  zIndex: {
    true: 0,
    '0': 0,
    '1': 10,
    '2': 50,
    '3': 100,
    '4': 200,
    '5': 999
  }
});
