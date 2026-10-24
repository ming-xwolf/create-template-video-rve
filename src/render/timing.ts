/**
 * Scene timing: one timeline for both the audio and the visuals.
 *
 * Why this exists: a clip can only be an integer number of frames long, so
 * `fitClipToDuration` rounds every scene up to the next 1/fps boundary. The
 * narration is cut on exact mp3 lengths + a fixed gap, so the two timelines
 * drift apart a little per scene (≈10–30 ms each, over 100 ms by scene 10).
 *
 * Fix: quantize the visual length first, then give the audio the leftover
 * difference as that scene's gap. Both timelines are then derived from the same
 * numbers and cannot drift.
 */

export interface SceneTimingInput {
  /** Narration length per scene, in seconds (mp3 durations). */
  voiceDurs: number[];
  fps: number;
  /** Silence between narration segments. */
  sceneGapSec: number;
  /** Extra hold after the last scene's narration. */
  outroHoldSec: number;
  /** Cross-fade overlap; 0 for hard cuts. */
  transitionSec: number;
}

export interface SceneTiming {
  /** Unpadded scene length: narration + its gap (or the outro hold). */
  baseDurs: number[];
  /** Frame-aligned clip length passed to the renderer. */
  visualDurs: number[];
  /** Audio silence after scene i (length `n - 1`). */
  gaps: number[];
  /** Narration start time per scene — equals the visual start time. */
  starts: number[];
}

/** Round up to the next frame boundary, ignoring float noise. */
export function quantizeToFrame(sec: number, fps: number): number {
  return Math.ceil(sec * fps - 1e-6) / fps;
}

export function computeSceneTiming(input: SceneTimingInput): SceneTiming {
  const { voiceDurs, fps, sceneGapSec, outroHoldSec, transitionSec } = input;
  const last = voiceDurs.length - 1;

  const baseDurs = voiceDurs.map(
    (d, i) => d + (i < last ? sceneGapSec : outroHoldSec),
  );
  // Padding the visual by the overlap keeps xfade from shortening the film.
  const visualDurs = baseDurs.map((b, i) =>
    quantizeToFrame(b + (i < last ? transitionSec : 0), fps),
  );

  // Audio gap absorbs whatever the frame rounding added, so audio and video
  // scene starts line up exactly.
  const gaps = voiceDurs
    .slice(0, -1)
    .map((v, i) => Number((visualDurs[i]! - transitionSec - v).toFixed(4)));

  const starts: number[] = [];
  let cursor = 0;
  voiceDurs.forEach((v, i) => {
    starts.push(Number(cursor.toFixed(4)));
    cursor += v + (gaps[i] ?? 0);
  });

  return { baseDurs, visualDurs, gaps, starts };
}
