export type BusProgressState = {
  progress: number;
  nextStopSeq: number;
  nextStopId: string;
  prevStopSeq: number | null;
  prevStopId: string | null;
  timestamp: number;
};

export type SmoothBusProgressParams = {
  rawProgress: number;
  nextStopSeq: number;
  nextStopId: string;
  prevStopSeq: number | null;
  prevStopId: string | null;
  previousState?: BusProgressState;
  now: number;
};

export type SmoothBusProgressResult = {
  progress: number;
  nextStopSeq: number;
  nextStopId: string;
  prevStopSeq: number | null;
  prevStopId: string | null;
  state: BusProgressState;
};

const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Applies smoothing to bus progress updates so markers animate forward steadily without regressing.
 * - If a bus stays on the same next stop, progress eases toward the latest reading.
 * - If the latest reading regresses, the previous position is kept to avoid backwards jumps.
 * - When a bus advances to a later stop, the fresh reading is accepted.
 */
export const smoothBusProgress = ({
  rawProgress,
  nextStopSeq,
  nextStopId,
  prevStopSeq,
  prevStopId,
  previousState,
  now
}: SmoothBusProgressParams): SmoothBusProgressResult => {
  const clampedProgress = clampProgress(rawProgress);

  if (!previousState) {
    const nextState: BusProgressState = {
      progress: clampedProgress,
      nextStopSeq,
      nextStopId,
      prevStopSeq,
      prevStopId,
      timestamp: now
    };
    return {
      progress: clampedProgress,
      nextStopSeq,
      nextStopId,
      prevStopSeq,
      prevStopId,
      state: nextState
    };
  }

  if (nextStopSeq < previousState.nextStopSeq) {
    const nextState: BusProgressState = {
      ...previousState,
      timestamp: now
    };
    return {
      progress: previousState.progress,
      nextStopSeq: previousState.nextStopSeq,
      nextStopId: previousState.nextStopId,
      prevStopSeq: previousState.prevStopSeq,
      prevStopId: previousState.prevStopId,
      state: nextState
    };
  }

  // If the route data indicates a new segment (bus advanced or reset), trust the API.
  if (nextStopSeq !== previousState.nextStopSeq) {
    const nextState: BusProgressState = {
      progress: clampedProgress,
      nextStopSeq,
      prevStopSeq,
      nextStopId,
      prevStopId,
      timestamp: now
    };
    return {
      progress: clampedProgress,
      nextStopSeq,
      nextStopId,
      prevStopSeq,
      prevStopId,
      state: nextState
    };
  }

  // Same stop as before — ease toward the new reading.
  const delta = clampedProgress - previousState.progress;

  if (delta <= 0) {
    // Prevent regressions: keep the previous progress.
    const nextState: BusProgressState = {
      progress: previousState.progress,
      nextStopSeq: previousState.nextStopSeq,
      nextStopId: previousState.nextStopId,
      prevStopSeq: prevStopSeq ?? previousState.prevStopSeq,
      prevStopId: prevStopId ?? previousState.prevStopId,
      timestamp: now
    };
    return {
      progress: previousState.progress,
      nextStopSeq: previousState.nextStopSeq,
      prevStopSeq: nextState.prevStopSeq,
      nextStopId: previousState.nextStopId,
      prevStopId: nextState.prevStopId,
      state: nextState
    };
  }

  const timeDelta = Math.max(0, now - previousState.timestamp);
  const SMOOTH_WINDOW_MS = 15_000; // Allow full convergence after ~15 seconds of updates.
  const alpha = Math.min(1, timeDelta / SMOOTH_WINDOW_MS);
  const easedProgress = clampProgress(
    previousState.progress + delta * alpha
  );

  const nextState: BusProgressState = {
    progress: easedProgress,
    nextStopSeq,
    nextStopId,
    prevStopSeq: prevStopSeq ?? previousState.prevStopSeq,
    prevStopId: prevStopId ?? previousState.prevStopId,
    timestamp: now
  };

  return {
    progress: easedProgress,
    nextStopSeq,
    nextStopId,
    prevStopSeq: nextState.prevStopSeq,
    prevStopId: nextState.prevStopId,
    state: nextState
  };
};
