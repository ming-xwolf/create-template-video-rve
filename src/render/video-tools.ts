import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { getDurationSec } from "../assets/audio-tools.js";

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let out = "", err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) =>
      code === 0 ? resolve(out) : reject(new Error(`${cmd} failed (exit ${code}): ${err.slice(-800)}`)),
    );
    proc.on("error", reject);
  });
}

/** Common encode flags so every fitted clip is concat-compatible (same codec). */
const ENCODE = (fps: number) => [
  "-an",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
];

/**
 * Re-encode `inPath` to exactly `targetSec` seconds (video only):
 * - longer target → freeze the last frame (tpad clone) to fill the remainder,
 *   so a 5s poster animation holds while the scene's narration continues;
 * - shorter target → trim. Output is normalized for concat.
 */
export async function fitClipToDuration(
  inPath: string,
  targetSec: number,
  outPath: string,
  fps = 30,
): Promise<void> {
  const inDur = await getDurationSec(inPath);
  const target = Math.max(0.1, targetSec);
  const args = ["-y", "-i", inPath];
  if (target > inDur + 0.02) {
    const ext = target - inDur;
    args.push("-vf", `tpad=stop_mode=clone:stop_duration=${ext.toFixed(3)}`);
  }
  // 按帧数裁，而不是按秒裁：`-t` 遇到帧边界会差一帧，音频时间轴就会跟着偏 33ms。
  const frames = Math.max(1, Math.round(target * fps));
  args.push("-frames:v", String(frames), ...ENCODE(fps), outPath);
  await run("ffmpeg", args);
}

/** Concatenate uniformly-encoded clips into one silent video (stream copy). */
export async function concatVideos(clipPaths: string[], outPath: string): Promise<void> {
  if (clipPaths.length === 0) throw new Error("concatVideos: empty clipPaths");
  const tmp = await mkdtemp(join(tmpdir(), "vconcat-"));
  try {
    const listFile = join(tmp, "list.txt");
    // Absolute paths: the concat demuxer resolves `file '...'` relative to the
    // list file's directory (the temp dir), not the process cwd.
    const body = clipPaths
      .map((p) => `file '${resolve(p).replace(/'/g, "'\\''")}'`)
      .join("\n");
    await writeFile(listFile, body, "utf8");
    await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

/**
 * Concatenate clips with an `xfade` transition at every boundary.
 *
 * The caller pads each clip by `overlapSec` (except the last), so the overlap
 * consumed here exactly cancels the padding and the total length matches the
 * narration timeline. `baseDurs` are the *unpadded* durations — the offsets are
 * their running sum.
 */
export async function concatVideosWithTransition(
  clipPaths: string[],
  outPath: string,
  type: string,
  overlapSec: number,
  baseDurs: number[],
  fps = 30,
): Promise<void> {
  if (clipPaths.length === 0) throw new Error("concatVideosWithTransition: empty clipPaths");
  if (clipPaths.length === 1) {
    await run("ffmpeg", ["-y", "-i", clipPaths[0], "-c", "copy", outPath]);
    return;
  }
  if (baseDurs.length !== clipPaths.length) {
    throw new Error(
      `concatVideosWithTransition: ${clipPaths.length} clips but ${baseDurs.length} durations`,
    );
  }

  const inputs = clipPaths.flatMap((p) => ["-i", p]);
  const parts: string[] = [];
  let offset = baseDurs[0];
  let last = "[0:v]";
  for (let i = 1; i < clipPaths.length; i++) {
    const label = `[v${i}]`;
    parts.push(
      `${last}[${i}:v]xfade=transition=${type}:duration=${overlapSec.toFixed(3)}:offset=${offset.toFixed(3)}${label}`,
    );
    last = label;
    offset += baseDurs[i];
  }

  await run("ffmpeg", [
    "-y",
    ...inputs,
    "-filter_complex", parts.join(";"),
    "-map", last,
    "-an",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-r", String(fps),
    outPath,
  ]);
}

/** Mux an audio track onto a silent video. The video length wins (no -shortest),
 * so an outro visual hold past the end of narration is preserved as silent tail.
 */
export async function muxAudioOntoVideo(
  videoPath: string,
  audioPath: string,
  outPath: string,
): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-i", videoPath,
    "-i", audioPath,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    outPath,
  ]);
}

export interface OverlayInput {
  path: string;
  startSec: number;
  durationSec: number;
  fadeSec: number;
}

/**
 * Composite one or more transparent overlays (ProRes 4444 / VP9-alpha) onto a
 * clip, each with its own in/out timing and alpha fade. Base length always wins.
 */
export async function compositeOverlays(
  basePath: string,
  overlays: OverlayInput[],
  outPath: string,
  fps = 30,
): Promise<void> {
  if (overlays.length === 0) {
    throw new Error("compositeOverlays: no overlays");
  }
  const inputs = [basePath, ...overlays.map((o) => o.path)].flatMap((p) => ["-i", p]);
  const parts: string[] = [];
  let last = "[0:v]";
  overlays.forEach((o, i) => {
    const label = `[ov${i}]`;
    const dur = Math.max(0.2, o.durationSec);
    const fade = Math.min(o.fadeSec, dur / 2);
    const chain = [
      `format=yuva444p`,
      `trim=start=0:end=${dur.toFixed(3)}`,
      `setpts=PTS-STARTPTS`,
    ];
    if (fade > 0) {
      chain.push(`fade=t=in:st=0:d=${fade.toFixed(3)}:alpha=1`);
      chain.push(`fade=t=out:st=${(dur - fade).toFixed(3)}:d=${fade.toFixed(3)}:alpha=1`);
    }
    chain.push(`setpts=PTS+${o.startSec.toFixed(3)}/TB`);
    parts.push(`[${i + 1}:v]${chain.join(",")}${label}`);
  });
  const outLabel = overlays.length === 1 ? "[vout]" : `[vout]`;
  overlays.forEach((o, i) => {
    const src = i === 0 ? last : last;
    const dst = i === overlays.length - 1 ? outLabel : `[b${i}]`;
    parts.push(`${src}[ov${i}]overlay=0:0:eof_action=pass:format=auto${dst}`);
    last = dst;
  });
  await run("ffmpeg", [
    "-y",
    ...inputs,
    "-filter_complex", parts.join(";"),
    "-map", outLabel,
    "-an",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-r", String(fps),
    outPath,
  ]);
}

/**
 * Average luma (0-1) of a clip, sampled by signalstats over every frame.
 * Used by the brightness normalizer to keep scenes from jumping between
 * "almost black" and "full of photo".
 */
export async function measureLuma(clipPath: string): Promise<number> {
  const stdout = await run("ffprobe", [
    "-v", "error",
    "-f", "lavfi",
    "-i", `movie=${clipPath.replace(/([:,\\])/g, "\\$1")},signalstats`,
    "-show_entries", "frame_tags=lavfi.signalstats.YAVG",
    "-of", "csv=p=0",
  ]);
  const vals = stdout
    .split("\n")
    .map((l) => Number.parseFloat(l.trim()))
    .filter((n) => Number.isFinite(n));
  if (vals.length === 0) return 0.12;
  return vals.reduce((a, b) => a + b, 0) / vals.length / 255;
}

/**
 * Gamma-correct a clip toward a target mean luma. Gamma (not brightness) keeps
 * black at black and white at white — a brightness offset would gray out the
 * backdrop, which is the whole reason these slides look consistent.
 */
export async function normalizeLuma(
  clipPath: string,
  fromLuma: number,
  targetLuma: number,
  outPath: string,
  fps = 30,
): Promise<{ gamma: number; applied: boolean }> {
  if (fromLuma <= 0.001 || targetLuma <= 0.001) return { gamma: 1, applied: false };
  // ffmpeg `eq=gamma` >1 brightens (inverse of the usual power law), so invert:
  // gamma = ln(from) / ln(target).
  const raw = Math.log(fromLuma) / Math.log(targetLuma);
  const gamma = Math.min(1.40, Math.max(0.45, raw));
  if (Math.abs(gamma - 1) < 0.04) return { gamma: 1, applied: false };
  await run("ffmpeg", [
    "-y",
    "-i", clipPath,
    "-vf", `eq=gamma=${gamma.toFixed(3)}`,
    "-an",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "18",
    "-pix_fmt", "yuv420p",
    "-r", String(fps),
    outPath,
  ]);
  return { gamma, applied: true };
}
