const { device, element, by, waitFor } = require('detox');
const { launchExpoApp, dismissDevLauncherIfPresent, sleep } = require('./utils/launchExpoApp');

describe('Planning Home Screen', () => {
  beforeAll(async () => {
    await launchExpoApp();
    await dismissDevLauncherIfPresent();
    await sleep(4000);
  });

  it('shows primary planning card and reacts to CTA tap', async () => {
    await waitFor(element(by.text('Plan your next run')))
      .toBeVisible()
      .withTimeout(20000);
    const scrollView = element(by.id('home-scroll'));
    const cta = element(by.id('planning-cta'));
    let ctaVisible = false;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await waitFor(cta).toBeVisible().withTimeout(2000);
        ctaVisible = true;
        break;
      } catch (error) {
        // eslint-disable-next-line no-await-in-loop
        await scrollView.swipe('up', 'slow');
      }
    }

    if (!ctaVisible) {
      throw new Error('Unable to find planning CTA on the home screen');
    }

    try {
      await cta.tap();
    } catch (tapError) {
      try {
        await cta.tap({ x: 120, y: 24 });
      } catch (secondError) {
        await cta.longPress(800);
      }
    }

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
