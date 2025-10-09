# Tamagui Integration Plan

## Implementation Snapshot
- Expo mobile shell consumes `@3i/ui-kit` via workspace dependency.
- Babel and Metro are configured with Tamagui plugins and shared config.
- Base components (`Button`, `Card`, `Title`, `Body`, `Caption`) and `AppThemeProvider` established with theme tokens.
- Type-checking script (`pnpm --filter @3i/ui-kit lint`) validates the UI kit.

## Goals
- Provide a cross-platform design system with shared tokens for mobile and potential web clients.
- Maintain a lightweight component layer that can wrap third-party primitives (Mapbox, list views) without rework.
- Ensure theming, dark mode, and accessibility support align with roadmap milestones.

## Dependencies
- React Native 0.73+ (new architecture ready) or Expo SDK 50+.
- Tamagui 1.90+ with `@tamagui/config`, `@tamagui/lucide-icons`, and `react-native-reanimated` 3.
- Babel plugin `babel-plugin-transform-inline-environment-variables` (required by Tamagui compiler).

## Setup Steps
1. Install packages:
   ```bash
   pnpm add tamagui @tamagui/config @tamagui/babel-plugin @tamagui/lucide-icons react-native-reanimated react-native-safe-area-context react-native-svg
   ```
   Configure `pnpm-workspace.yaml` so `packages/ui-kit` depends on these libraries while `apps/mobile` consumes the built components.
2. Configure Tamagui:
   - Create `tamagui.config.ts` in `packages/ui-kit` defining tokens (colors, spacing, radii) informed by the brand system.
   - Add fonts via `createFont` with platform-specific fallbacks.
   - Export theme variants (`light`, `dark`, `danger`, `success`) for use in feature modules.
3. Update Babel and Metro:
   - Add `plugins: ["@tamagui/babel-plugin"]` to `babel.config.js` with `config: "./packages/ui-kit/tamagui.config.ts"`.
   - Amend `metro.config.js` with `resolver.disableHierarchicalLookup = true` and include Tamagui's `withTamagui`.
4. Wrap app:
   ```tsx
   import { TamaguiProvider } from 'tamagui';
   import { config } from '@3i/ui-kit/tamagui.config';

   export const App = () => (
     <TamaguiProvider config={config} defaultTheme="light">
       <ThemeWatcher />
     </TamaguiProvider>
   );
   ```
   Implement `ThemeWatcher` to sync OS dark mode and propagate to analytics.

## Component Strategy
- Build base primitives (`Button`, `Card`, `ListItem`, `TextField`) within `packages/ui-kit/src/components`.
- Expose hooks (`useThemeTokens`, `useResponsiveValue`) for feature teams.
- Compose navigation/header components that integrate with React Navigation while keeping Tamagui layout primitives (Stack, YStack) central.

## Theming & Tokens
- Tokens follow 8pt spacing, dynamic typography scale, and accessible contrast.
- Use `linearGradient` tokens to brand map overlays; export `mapOverlayThemes` consumed by routing features.
- Provide `size` tokens for map control buttons to support tablet scaling.

## Testing
- Unit test tokens/components with Jest + `@testing-library/react-native`.
- Snapshot Tamagui components using Tamagui's `createTests` helper to catch regression in styles.
- Validate runtime with Detox scenarios focusing on theming toggles, modal interactions, and gesture-heavy views.

## Rollout Checklist
- [ ] Create ADR selecting Tamagui, documenting trade-offs versus NativeBase.
- [ ] Scaffold `packages/ui-kit` with config, tokens, and primitive components.
- [ ] Integrate Tamagui provider in `apps/mobile`.
- [ ] Replace placeholder screens with Tamagui-based layouts.
- [ ] Ensure tree-shakeability and bundle size dashboards track Tamagui output.
- [ ] Provide documentation for designers (token naming, example screens).

## Future Enhancements
- Introduce design token sync via Figma plugin to eliminate manual updates.
- Share Tamagui config with web admin portal to unify experiences.
- Develop animated components leveraging Reanimated 3 + Tamagui's animation props for interactive stop management flows.
