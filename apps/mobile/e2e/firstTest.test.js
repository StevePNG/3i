import { device, element, by, waitFor } from 'detox';

describe('Planning Home Screen', () => {
  beforeAll(async () => {
    const devServerURL = 'exp://127.0.0.1:8081';
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
    await new Promise((resolve) => setTimeout(resolve, 3000));
  });

  it('shows primary planning card and reacts to CTA tap', async () => {
    try {
      await waitFor(element(by.text('Continue')))
        .toBeVisible()
        .withTimeout(10000);
      const continueButton = element(by.text('Continue'));
      await continueButton.tap();
      await waitFor(continueButton).not.toBeVisible().withTimeout(5000);
    } catch (error) {
      // Developer menu not shown; continue.
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));

    await waitFor(element(by.text('Plan your next run')))
      .toBeVisible()
      .withTimeout(20000);
    const cta = element(by.text('Start planning'));
    await waitFor(cta).toBeVisible().withTimeout(20000);
    await cta.tap();

    await waitFor(element(by.text('Route planning')))
      .toBeVisible()
      .withTimeout(10000);

    const newStopInput = element(by.id('new-stop-input'));
    await newStopInput.tap();
    await newStopInput.replaceText('Test Drop-off');
    await element(by.id('add-stop-button')).tap();

    await waitFor(element(by.text('Test Drop-off')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
