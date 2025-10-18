# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A monorepo for a React Native route planning application built with Expo, Tamagui, and a shared UI component library. The app allows users to plan routes, add/remove stops, optimize stop order, and share route plans.

## Workspace Structure

- **`apps/mobile`**: Expo-powered React Native application shell with navigation, screens, and utilities
- **`packages/ui-kit`**: Tamagui-based component library with shared themes, tokens, and providers
- **Root `package.json`**: Workspace root with convenience scripts

## Common Development Commands

### Installation and Starting
```bash
pnpm install                    # Install all dependencies
pnpm start                      # Launch Expo dev server (default: iOS)
pnpm android                    # Run on Android
pnpm ios                        # Run on iOS
pnpm web                        # Run web preview
```

### Type Checking and Linting
```bash
pnpm lint                       # Type-check the ui-kit package
pnpm --filter @3i/ui-kit lint  # Explicitly lint ui-kit
```

### Building and Testing
```bash
pnpm --filter mobile prebuild:ios          # Prebuild iOS native code
pnpm --filter mobile detox:build:ios       # Build Detox test suite for iOS
pnpm --filter mobile detox:test:ios        # Run Detox e2e tests on iOS simulator
pnpm --filter mobile test:e2e:ios          # Alias for Detox tests
```

### Running Single Tests
```bash
detox test /path/to/test --configuration ios.sim.debug
```

## Architecture Overview

### Theme and Styling System

Tamagui configuration is centralized in `packages/ui-kit` with a well-organized separation of concerns:

- **`tamagui.config.ts`**: Main Tamagui configuration that composes fonts, tokens, themes, and media queries
- **`theme/tokens.ts`**: Design tokens split into:
  - `color`: Color palette (backgrounds, surfaces, borders, semantic colors)
  - `space`: Spacing scale (padding/margin)
  - `size`: Box sizing scale (width/height)
  - `fontSize`: Font size scale (numeric and named: xs, sm, md, lg, xl)
  - `radius`: Border radius presets
  - `zIndex`: Z-index layers
- **`theme/fonts.ts`**: Font scale definitions (separate constants for font sizes, line heights, weights, letter spacing) used across body, heading, and mono fonts to ensure consistency
- **`theme/themes.ts`**: Light and dark theme definitions with color tokens
- **`theme/media.ts`**: Responsive breakpoints for different screen sizes
- **`providers/AppThemeProvider.tsx`**: React context provider that wraps the app with `TamaguiProvider` and syncs with system color scheme preference

**Key Detail**: The `AppThemeProvider` in `apps/mobile/App.tsx` is the entry point—it provides Tamagui context to all screens and applies theme/tokens globally. Font tokens are properly separated from sizing tokens to avoid Tamagui warnings.

### Component Library

Components in `packages/ui-kit/src/components` are built with Tamagui primitives:

- **`Button.tsx`**: Variants include primary, secondary, ghost, and outlined
- **`Card.tsx`**: Elevated card containers with optional interactive states
- **`Typography.tsx`**: `Title` and `Body` components with tone variants (default, muted)

These components use design tokens from the shared theme and are re-exported from `packages/ui-kit/src/index.ts`.

### Navigation

React Navigation (`@react-navigation/native-stack`) manages screen stacks:

- **`AppNavigator.tsx`**: Defines `AppStackParamList` with routes (Home, Planning, RouteB8) and configures stack options
- Initial route is Home; animation uses `fade_from_bottom`
- Provides `AppNavigationProp` typed hook for type-safe navigation

### Screens

#### HomeScreen
- Entry point showing hero cards
- Two CTAs: "Start planning" (→ Planning) and "View live ETAs" (→ RouteB8)
- Uses ui-kit components: Card, Button, Title, Body

#### PlanningScreen
- Core feature: route planning with stop management
- **State**: stops array (with id, label, coordinates, notes, status), new stop input
- **Key Features**:
  - Add/remove stops with location matching against `SUGGESTED_LOCATIONS`
  - Toggle stop completion status
  - Optimize stop order via nearest-neighbor algorithm
  - Displays route metrics: total distance, ETA, completion counts
  - Preview and share route plan
- **Computed Metrics** (memoized): total distance, ETA, and per-leg data via `calculateRouteMetrics()`
- **Helper Functions** (in utils):
  - `haversineDistanceKm()`: Calculate distance between coordinates
  - `averageEtaMinutes()`: Estimate time per km (simplified: 1 km ≈ 1.5 min)
  - `formatDistance()`, `formatEta()`: Display utilities

#### RouteB8Screen
- Placeholder screen for viewing Citybus B8 line arrivals

### Data Layer

- **`apps/mobile/src/data/locations.ts`**: Suggested stops with predefined coordinates and notes; `findSuggestion()` for matching user input to known locations
- **`apps/mobile/src/utils/geo.ts`**: Geospatial calculations (Haversine formula, formatting)

## Key Decisions

1. **Workspace Setup**: pnpm with hoisted node_modules for faster installs and cleaner dependency resolution
2. **Tamagui**: Chosen for cross-platform (web, iOS, Android) unified component system and theming
3. **React Navigation**: Stack-based navigation with typed param lists for compile-time safety
4. **Stop Optimization**: Greedy nearest-neighbor algorithm (quick approximation, not optimal TSP)
5. **Location Matching**: Fuzzy-like matching against known locations; unknown locations generate pseudo-coordinates

## Testing

- **E2E Tests**: Detox on iOS (see `docs/testing.md` for full setup)
- **Type Safety**: All screens and components are TypeScript with strict mode enabled
- **Detox Configuration**: Defined in `app.json` via `@config-plugins/detox`

## Path Aliases

TypeScript paths are configured in `tsconfig.base.json`:

```json
{
  "@3i/ui-kit": "packages/ui-kit/src",
  "@3i/ui-kit/*": "packages/ui-kit/src/*"
}
```

## Git Considerations

Current tracked files (as of latest commit):

- UI kit and component updates
- Theme and token refinements
- Mobile app screens and navigation
- Package configuration and lock file

Build artifacts (`.tamagui/`, `artifacts/`, `node_modules/`, `.DS_Store`, `.env*`) are gitignored.

## Theme and Token Organization Strategy

The UI configuration has been optimized for maintainability:

### Token Structure
- **Separate Concerns**:
  - `fontSize`: Font size tokens (numeric and named: xs, sm, md, lg, xl) for use in font definitions
  - `size`: Box sizing tokens, also includes named sizes (xs, sm, md, lg, xl) for `SizableText` sizing prop
- **Single Source of Truth**: Font scales (size, line height, weight, letter spacing) are defined once in `theme/fonts.ts` and reused across all font presets (body, heading, mono)
- **DRY Principle**: Common scales like `fontSizeScale` and `bodyLineHeightScale` are imported into `tamagui.config.ts` to avoid duplication

### File Organization
```
packages/ui-kit/src/theme/
├── fonts.ts           # Font scale definitions (sizes, line heights, weights, spacing)
├── tokens.ts          # Design tokens (colors, space, size, fontSize, radius, zIndex)
├── themes.ts          # Light/dark theme color variants
├── media.ts           # Responsive breakpoints
└── tamagui.config.ts  # Main Tamagui configuration
```

### Tamagui Warning Notes
When using `SizableText` with named sizes (e.g., `size="$sm"`), you may see Tamagui warnings like:
```
WARN No font size found sm {"font": "$body"} in size tokens [...]
```

These warnings are informational and **do not affect functionality**. They occur because:
1. `SizableText.size` prop references the `size` tokens group
2. Tamagui validates that the font can support the requested size
3. The validation warns when there's ambiguity between sizing and typography

**Best Practice**: Use the provided typography components (`Title`, `Body`, `Caption`) from ui-kit instead of raw `SizableText` when possible, as they properly handle size and font consistency.

This structure makes it easy to:
- Update font scales without touching component code
- Maintain consistency across font presets
- Debug Tamagui token issues systematically
- Scale the design system as it grows

## Next Steps for Future Development

- Extend ui-kit with map overlays, form controls, and list items
- Integrate real geolocation and routing APIs (Google Maps, Mapbox)
- Add state management (Zustand, Redux) for complex cross-screen state
- Wire in analytics and feature flags via provider layer
- Expand Detox test coverage and add unit tests for geo calculations
