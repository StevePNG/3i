# Testing Guide

## Type Checking
- `pnpm --filter @3i/ui-kit lint`: validates Tamagui components and tokens with TypeScript.
- `pnpm --filter mobile exec tsc --noEmit`: ensures the Expo app compiles.

## iOS E2E with Detox

### Prerequisites
- Xcode + iOS simulators (Xcode 16+ recommended).
- Expo Dev Client already installed in the app (`expo-dev-client` dependency).
- Homebrew with the Wix tap for Detox helpers:
  ```bash
  brew tap wix/brew
  brew install applesimutils
  ```
- Detox framework cache (build once per Xcode upgrade):
  ```bash
  pnpm --filter mobile exec detox clean-framework-cache
  pnpm --filter mobile exec detox build-framework-cache
  ```

### Initial Setup
1. Prebuild native iOS assets (generates `ios/` and installs pods):
   ```bash
   pnpm --filter mobile prebuild:ios
   ```
   Re-run after modifying `app.json` plugins or Native module dependencies.
2. Build the debug dev client used by Detox:
   ```bash
   pnpm --filter mobile detox:build:ios
   ```
3. Start Metro in dev-client mode (must remain running in a separate terminal). By default Metro uses port 8081:
   ```bash
   pnpm start -- --dev-client
   ```
   - If port 8081 is occupied, start Metro with `--port <port>` and export matching `EXPO_DEV_SERVER_PORT` and `EXPO_METRO_PORT` values before launching the app.
4. Trigger the Expo development build to load the bundle once (required for Detox to find the React Native UI):
   ```bash
   npx uri-scheme open "exp+mobile://expo-development-client/?url=exp%3A%2F%2F127.0.0.1%3A8081" --ios
   ```
   Replace the encoded URL with your Metro host/port if different (e.g. `127.0.0.1:8082`).

### Running Tests
- Execute the suite:
  ```bash
  pnpm --filter mobile detox:test:ios
  ```
- Tests live in `apps/mobile/e2e/`. Example spec `firstTest.test.js` asserts the Tamagui planning card renders.
- To re-run on a clean simulator, append `--cleanup` to the Detox command.

### Troubleshooting
- `Detox.framework could not be found`: run the framework cache commands above.
- `applesimutils: command not found`: install via Homebrew tap.
- Expo packager connection failures: ensure `pnpm start -- --dev-client` stays running and no other app occupies port `8081`.


