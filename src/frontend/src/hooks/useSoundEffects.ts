/**
 * useSoundEffects — Web Audio API sound effects for RideGo
 *
 * All sounds are synthesized via OscillatorNode + GainNode.
 * AudioContext is created lazily on first call to satisfy browser
 * user-gesture requirements. All errors are caught silently so
 * sound never breaks the UI.
 */

import { useCallback, useRef } from "react";

type FreqDuration = [frequency: number, duration: number];

function useAudioContext() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getContext = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current || ctxRef.current.state === "closed") {
        ctxRef.current = new AudioContext();
      }
      // Resume if suspended (e.g. autoplay policy)
      if (ctxRef.current.state === "suspended") {
        ctxRef.current.resume().catch(() => {});
      }
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  return getContext;
}

/** Play a sequence of notes. Each note fades in/out to avoid clicks. */
function playSequence(
  ctx: AudioContext,
  notes: FreqDuration[],
  type: OscillatorType = "sine",
  peakGain = 0.18,
) {
  let startTime = ctx.currentTime;

  for (const [freq, dur] of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    const durSec = dur / 1000;
    const ramp = Math.min(0.015, durSec * 0.1);

    // Smooth ramp up then down — no click artifacts
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(peakGain, startTime + ramp);
    gain.gain.setValueAtTime(peakGain, startTime + durSec - ramp);
    gain.gain.linearRampToValueAtTime(0, startTime + durSec);

    osc.start(startTime);
    osc.stop(startTime + durSec);

    startTime += durSec;
  }
}

export function useSoundEffects() {
  const getContext = useAudioContext();

  /** Ascending 3-tone chime: C5 → E5 → G5 (~150 ms each) */
  const playNewRideRequest = useCallback(() => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      playSequence(
        ctx,
        [
          [523.25, 150], // C5
          [659.25, 150], // E5
          [783.99, 150], // G5
        ],
        "sine",
        0.22,
      );
    } catch {}
  }, [getContext]);

  /** Positive double-beep: G5 → B5 (~100 ms each) */
  const playRideAccepted = useCallback(() => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      playSequence(
        ctx,
        [
          [783.99, 100], // G5
          [987.77, 100], // B5
        ],
        "sine",
        0.2,
      );
    } catch {}
  }, [getContext]);

  /** Single mid-tone beep: A4 (~200 ms) */
  const playRideStarted = useCallback(() => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      playSequence(
        ctx,
        [
          [440, 200], // A4
        ],
        "triangle",
        0.18,
      );
    } catch {}
  }, [getContext]);

  /** Upbeat 3-note jingle: C5 → E5 → C6 (~120 ms each) */
  const playRideCompleted = useCallback(() => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      playSequence(
        ctx,
        [
          [523.25, 120], // C5
          [659.25, 120], // E5
          [1046.5, 200], // C6 — longer finish
        ],
        "sine",
        0.22,
      );
    } catch {}
  }, [getContext]);

  /** Descending 2-tone: G4 → D4 (~150 ms each) */
  const playRideCancelled = useCallback(() => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      playSequence(
        ctx,
        [
          [392.0, 150], // G4
          [293.66, 200], // D4 — slightly longer for finality
        ],
        "sine",
        0.16,
      );
    } catch {}
  }, [getContext]);

  return {
    playNewRideRequest,
    playRideAccepted,
    playRideStarted,
    playRideCompleted,
    playRideCancelled,
  };
}
