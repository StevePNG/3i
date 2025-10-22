const { device, element, by, waitFor } = require('detox');

const DEFAULT_DEV_SERVER_URL = 'exp://127.0.0.1:8081';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getDevServerUrl = () =>
  process.env.DETOX_DEV_SERVER_URL ? process.env.DETOX_DEV_SERVER_URL : DEFAULT_DEV_SERVER_URL;

async function launchExpoApp() {
  const devServerURL = getDevServerUrl();
  await device.launchApp({
    newInstance: true,
    launchArgs: {
      RCT_METRO_PORT: '8081',
      EXPO_DEV_SERVER_PORT: '8081',
      EXPO_METRO_PORT: '8081'
    },
    env: {
      RCT_METRO_PORT: '8081',
      EXPO_DEV_SERVER_PORT: '8081',
      EXPO_METRO_PORT: '8081'
    }
  });
  await device.openURL({
    url: `exp+mobile://expo-development-client/?url=${encodeURIComponent(devServerURL)}`
  });
  await sleep(2000);
}

async function dismissDevLauncherIfPresent() {
  try {
    await waitFor(element(by.text('Continue'))).toBeVisible().withTimeout(10000);
    const continueButton = element(by.text('Continue'));
    await continueButton.tap();
    await waitFor(continueButton).not.toBeVisible().withTimeout(5000);
  } catch (err) {
    // No launcher visible, ignore.
  }
}

module.exports = {
  launchExpoApp,
  dismissDevLauncherIfPresent,
  sleep
};
