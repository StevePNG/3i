const { device, element, by, waitFor, expect } = require('detox');
const { launchExpoApp, dismissDevLauncherIfPresent, sleep } = require('./utils/launchExpoApp');

describe('Quick Actions Demo', () => {
  beforeAll(async () => {
    await launchExpoApp();
    await dismissDevLauncherIfPresent();
    await sleep(4000);
  });

  it('expands radial menu and handles selection', async () => {
    await waitFor(element(by.text('Plan your next run')))
      .toBeVisible()
      .withTimeout(20000);
    const scrollView = element(by.id('home-scroll'));
    const quickActionsButton = element(by.id('quick-actions-cta'));
    let visible = false;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await waitFor(quickActionsButton).toBeVisible().withTimeout(2000);
        visible = true;
        break;
      } catch (error) {
        // eslint-disable-next-line no-await-in-loop
        await scrollView.swipe('up', 'slow');
      }
    }

    if (!visible) {
      throw new Error('Unable to locate Quick Actions CTA on the home screen');
    }

    await quickActionsButton.tap();

    await waitFor(element(by.text('One-hand quick actions')))
      .toBeVisible()
      .withTimeout(10000);

    const fab = element(by.id('quick-actions-fab'));
    await waitFor(fab).toBeVisible().withTimeout(5000);
    await fab.tap();

    const alertsAction = element(by.id('quick-action-alerts'));
    await waitFor(alertsAction).toBeVisible().withTimeout(5000);
    await alertsAction.tap();

    await waitFor(element(by.text('You tapped Alerts.')))
      .toBeVisible()
      .withTimeout(5000);

    await expect(element(by.id('quick-actions-fab'))).toBeVisible();
  });
});
