import { smoothBusProgress, type BusProgressState } from '../busProgress';

const createState = (overrides: Partial<BusProgressState> = {}): BusProgressState => ({
  progress: 0,
  nextStopSeq: 1,
  nextStopId: 'stop-1',
  prevStopSeq: null,
  prevStopId: null,
  timestamp: 0,
  ...overrides
});

(() => {
  const now = Date.now();

  const assertEqual = (actual: unknown, expected: unknown, message: string) => {
    if (actual !== expected) {
      throw new Error(`${message} (expected ${expected}, received ${actual})`);
    }
  };

  const assertNear = (actual: number, expected: number, epsilon: number, message: string) => {
    if (Math.abs(actual - expected) > epsilon) {
      throw new Error(`${message} (expected ~${expected}, received ${actual})`);
    }
  };

  const assertTrue = (value: boolean, message: string) => {
    if (!value) {
      throw new Error(message);
    }
  };

  {
    const result = smoothBusProgress({
      rawProgress: 0.6,
      nextStopSeq: 3,
      nextStopId: 'stop-3',
      prevStopSeq: 2,
      prevStopId: 'stop-2',
      previousState: undefined,
      now
    });
    assertNear(result.progress, 0.6, 1e-6, 'initial progress should accept raw reading');
    assertEqual(result.nextStopSeq, 3, 'initial next stop should be preserved');
    assertEqual(result.nextStopId, 'stop-3', 'initial next stop id should be preserved');
  }

  {
    const previous = createState({
      progress: 0.25,
      nextStopSeq: 4,
      nextStopId: 'stop-4',
      prevStopSeq: 3,
      prevStopId: 'stop-3',
      timestamp: now - 5000
    });
    const result = smoothBusProgress({
      rawProgress: 0.85,
      nextStopSeq: 4,
      nextStopId: 'stop-4',
      prevStopSeq: 3,
      prevStopId: 'stop-3',
      previousState: previous,
      now
    });
    assertTrue(result.progress > previous.progress, 'progress should advance forward');
    assertTrue(result.progress < 0.85, 'progress easing should avoid instant jumps');
  }

  {
    const previous = createState({
      progress: 0.4,
      nextStopSeq: 5,
      nextStopId: 'stop-5',
      prevStopSeq: 4,
      prevStopId: 'stop-4',
      timestamp: now - 5000
    });
    const result = smoothBusProgress({
      rawProgress: 0.1,
      nextStopSeq: 5,
      nextStopId: 'stop-5',
      prevStopSeq: 4,
      prevStopId: 'stop-4',
      previousState: previous,
      now
    });
    assertNear(result.progress, previous.progress, 1e-6, 'progress should not regress on same stop');
  }

  {
    const previous = createState({
      progress: 0.7,
      nextStopSeq: 6,
      nextStopId: 'stop-6',
      prevStopSeq: 5,
      prevStopId: 'stop-5',
      timestamp: now - 5000
    });
    const result = smoothBusProgress({
      rawProgress: 0.05,
      nextStopSeq: 7,
      nextStopId: 'stop-7',
      prevStopSeq: 6,
      prevStopId: 'stop-6',
      previousState: previous,
      now
    });
    assertNear(result.progress, 0.05, 1e-6, 'progress should reset when bus advances to next stop');
    assertEqual(result.nextStopSeq, 7, 'next stop should update when advancing');
    assertEqual(result.nextStopId, 'stop-7', 'next stop id should update when advancing');
  }

  {
    const previous = createState({
      progress: 0.3,
      nextStopSeq: 4,
      nextStopId: 'stop-4',
      prevStopSeq: 3,
      prevStopId: 'stop-3',
      timestamp: now - 60000
    });
    const result = smoothBusProgress({
      rawProgress: 0.9,
      nextStopSeq: 4,
      nextStopId: 'stop-4',
      prevStopSeq: 3,
      prevStopId: 'stop-3',
      previousState: previous,
      now
    });
    assertNear(result.progress, 0.9, 1e-6, 'long gaps should allow full convergence to raw');
  }

  {
    const previous = createState({
      progress: 0.6,
      nextStopSeq: 5,
      nextStopId: 'stop-5',
      prevStopSeq: 4,
      prevStopId: 'stop-4',
      timestamp: now - 5000
    });
    const result = smoothBusProgress({
      rawProgress: 0.2,
      nextStopSeq: 6,
      nextStopId: 'stop-6',
      prevStopSeq: 5,
      prevStopId: 'stop-5',
      previousState: previous,
      now
    });
    assertNear(result.progress, 0.2, 1e-6, 'forward jump should allow easing toward next stop');
    assertEqual(result.nextStopSeq, 6, 'next stop seq should advance with new data');
  }

  {
    const previous = createState({
      progress: 0.55,
      nextStopSeq: 6,
      nextStopId: 'stop-6',
      prevStopSeq: 5,
      prevStopId: 'stop-5',
      timestamp: now - 3000
    });
    const result = smoothBusProgress({
      rawProgress: 0.25,
      nextStopSeq: 4,
      nextStopId: 'stop-4',
      prevStopSeq: 3,
      prevStopId: 'stop-3',
      previousState: previous,
      now
    });
    assertNear(result.progress, previous.progress, 1e-6, 'regression on stop seq should be ignored');
    assertEqual(result.nextStopSeq, previous.nextStopSeq, 'next stop seq should remain monotonic');
    assertEqual(result.nextStopId, previous.nextStopId, 'next stop id should remain monotonic');
  }

  console.log('All bus progress smoothing tests passed.');
})();
