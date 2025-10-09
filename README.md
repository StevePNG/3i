# 3i Route Planning App

A monorepo for a React Native route planning experience built with Expo, Tamagui, and a shared UI kit.

## Project Structure
- `apps/mobile`: Expo-powered React Native application shell.
- `packages/ui-kit`: Tamagui-based component library, themes, and providers shared across clients.
- `docs`: Planning artefacts covering roadmap, Tamagui setup, and multi-agent collaboration.

## Getting Started
1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Launch the Expo app (choose the platform you need):
   ```bash
   pnpm start
   pnpm android
   pnpm ios
   pnpm web
   ```
3. Type-check the shared UI kit:
   ```bash
   pnpm --filter @3i/ui-kit lint
   ```

## Tamagui Integration Highlights
- Centralised tokens, themes, and media queries live in `packages/ui-kit`.
- `AppThemeProvider` handles Tamagui configuration and system dark-mode sync.
- An example Tamagui-driven home screen is implemented in `apps/mobile/App.tsx`.

## Testing
- Type checking and Detox workflows are documented in `docs/testing.md`.
- Run the iOS Detox suite after building the Expo dev client:
  ```bash
  pnpm --filter mobile detox:build:ios
  pnpm --filter mobile detox:test:ios
  ```

## Next Steps
- Extend the UI kit with map overlays, list items, and form controls tailored for route planning.
- Wire analytics and feature flags into the provider layer.
- Broaden automated coverage (additional Detox specs, unit tests for routing logic).
