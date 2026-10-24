import { copyFile, readFile, unlink, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import pLimit from "p-limit";
import { TemplateScriptSchema, type TemplateScript } from "./template-script-schema.js";
import { loadConfig } from "../config.js";
import { createTtsClient } from "../tts/tts-client.js";
import {
  getDurationSec,
  concatWithSilence,
  decodeToWav,
  mixSfxOntoVoice,
  type SfxMixSpec,
} from "../assets/audio-tools.js";
import { indexSfxLibrary, pickSfxForScene, defaultPlayback } from "../assets/sfx-selector.js";
import { composeTemplate } from "./template-composer.js";
import { preflightStyle } from "./style-preflight.js";
import { computeSceneTiming } from "./timing.js";
import {
  compositeOverlays,
  measureLuma,
  normalizeLuma,
  type OverlayInput,
  fitClipToDuration,
  concatVideos,
  concatVideosWithTransition,
  muxAudioOntoVideo,
} from "./video-tools.js";
import { fetchImage } from "../assets/image-fetcher.js";
import { log } from "../utils/logger.js";

import { SKILL_ROOT, resolveFromSkillRoot } from "../paths.js";

const TEMPLATES_DIR = join(SKILL_ROOT, "templates");
/** 接受 `image` 槽位、需要把图片 vendor 进 assets/ 的模板。 */
const IMAGE_TEMPLATES = new Set(["rve-media", "rve-zoompulse"]);

const TOTAL_STEPS = 8;
const SCENE_GAP_SEC = 0.3;
const OUTRO_HOLD_SEC = 3;
const RENDER_FPS = 30;

/** Maps a scene role to a key the SFX selector understands (tier-3 defaults). */
const TYPE_TO_SFX: Record<string, string> = {
  hook: "hook",
  body: "callout",
  outro: "outro",
};

export async function runTemplatePipeline(scriptPath: string): Promise<void> {
  const cfg = loadConfig();
  const outputDir = dirname(scriptPath);
  log.info(`Output directory: ${outputDir}`);

  // STEP 1 — load + validate
  log.step(1, TOTAL_STEPS, `Load + validate template script (TTS: ${cfg.ttsProvider})`);
  const raw = JSON.parse(await readFile(scriptPath, "utf8"));
  const script: TemplateScript = TemplateScriptSchema.parse(raw);

  // STEP 1b — style guardrail: every template exists, no card shown twice in a row.
  // 中文字体缓存：HyperFrames 首次渲染会从 Google Fonts 抓取 Noto Sans SC
  // （约 40MB 字体子集），之后走 ~/.cache/hyperframes/fonts。没有缓存又没网时，
  // 中文会静默退化成系统字体，所以先提示一句。
  if (!existsSync(join(homedir(), ".cache", "hyperframes", "fonts", "noto-sans-sc"))) {
    log.warn(
      "未检测到中文字体缓存：首次渲染需联网抓取 Noto Sans SC（约 40MB），" +
        "离线环境下中文会退化成系统字体",
    );
  }

  preflightStyle(script);

  // STEP 2 — script.txt for CapCut
  log.step(2, TOTAL_STEPS, "Write script.txt");
  await writeFile(join(outputDir, "script.txt"), script.scenes.map((s) => s.voiceText).join("\n\n"));

  // STEP 3 — TTS per scene (idempotent)
  log.step(3, TOTAL_STEPS, "TTS each scene");
  const ttsClient = createTtsClient(cfg);
  const limit = pLimit(cfg.ttsConcurrency);
  const voiceDir = join(outputDir, "voice");
  await mkdir(voiceDir, { recursive: true });
  const sceneAudio = await Promise.all(
    script.scenes.map((scene) =>
      limit(async () => {
        const out = join(voiceDir, `scene-${scene.id}.mp3`);
        const wavOut = join(voiceDir, `scene-${scene.id}.wav`);
        const srtOut = join(voiceDir, `scene-${scene.id}.srt`);
        // 时间轴必须建在解码后的样本长度上：mp3 容器标称长度比实际样本长约 60ms，
        // 按容器时长排会让每镜的配音提前，10 镜能偏出半秒以上。
        const ensureWav = async () => {
          if (!existsSync(wavOut)) await decodeToWav(out, wavOut);
          return wavOut;
        };
        if (existsSync(out)) {
          const dur = await getDurationSec(await ensureWav());
          log.info(`  scene ${scene.id}: REUSE mp3（${dur.toFixed(2)}s）`);
          return { id: scene.id, path: wavOut, durationSec: dur };
        }
        log.info(`  TTS scene ${scene.id} (${scene.voiceText.length} chars)...`);
        await ttsClient.generate(scene.voiceText, out, srtOut);

        // 新配音一定要重新解码：只删 mp3 重跑时，旧 wav 会让新文案被静默忽略。
        await decodeToWav(out, wavOut);
        const dur = await getDurationSec(wavOut);
        log.info(`  scene ${scene.id}: ${dur.toFixed(2)}s`);
        return { id: scene.id, path: wavOut, durationSec: dur };
      }),
    ),
  );

  // STEP 4 — concat voice + compute scene timings
  log.step(4, TOTAL_STEPS, "Concat voice + compute timings");
  const voiceRawMp3 = join(outputDir, "voice-raw.mp3");
  const voiceMp3 = join(outputDir, "voice.mp3");

  // 转场时长先定：它决定每镜视觉补多长，进而决定音频间隔要补多少。
  let tDur = script.transition.durationSec;
  if (tDur > 0) {
    const shortest = Math.min(...sceneAudio.map((a) => a.durationSec + SCENE_GAP_SEC));
    if (tDur > shortest * 0.5) {
      log.warn(`  transition ${tDur}s 超出最短场景的一半，收到 ${(shortest * 0.5).toFixed(2)}s`);
      tDur = Number((shortest * 0.5).toFixed(2));
    }
  }

  // 一条时间轴同时给音频和画面：先把视觉时长对齐到帧，再把取整余量变成音频间隔。
  // 否则每镜多出的不足一帧会累积 —— 10 镜能漂到 100ms 以上。
  const timing = computeSceneTiming({
    voiceDurs: sceneAudio.map((a) => a.durationSec),
    fps: RENDER_FPS,
    sceneGapSec: SCENE_GAP_SEC,
    outroHoldSec: OUTRO_HOLD_SEC,
    transitionSec: tDur,
  });
  await concatWithSilence(sceneAudio.map((a) => a.path), timing.gaps, voiceRawMp3);

  const sceneStarts: Record<string, number> = {};
  sceneAudio.forEach((a, i) => {
    sceneStarts[a.id] = timing.starts[i]!;
  });

  // STEP 5 — SFX selection + mix
  log.step(5, TOTAL_STEPS, "Pick + mix SFX");
  // 音效库固定在技能自身目录下（输出目录在工作区，不能再按相对位置推）。
  // 相对路径按技能根目录解析（`SFX_DIR=./assets/sfx` 在任何 CWD 下都成立）。
  const SFX_DIR = resolveFromSkillRoot(process.env.SFX_DIR?.trim() || "./assets/sfx");
  const sfxIndex = existsSync(SFX_DIR) ? indexSfxLibrary(SFX_DIR) : {};
  const sfxCount = Object.keys(sfxIndex).length;
  log.info(`  音效库: ${SFX_DIR}（${sfxCount} 组${sfxCount === 0 ? "，空目录自动跳过" : ""}）`);
  const sfxList: SfxMixSpec[] = [];
  for (const scene of script.scenes) {
    const startSec = sceneStarts[scene.id];
    if (scene.sfx) {
      if (scene.sfx.name === "none") continue;
      const p = join(SFX_DIR, `${scene.sfx.name}.mp3`);
      if (existsSync(p)) sfxList.push({ path: p, startSec: startSec + scene.sfx.startOffsetSec, volume: scene.sfx.volume });
      continue;
    }
    if (Object.keys(sfxIndex).length === 0) continue;
    const picked = pickSfxForScene({
      voiceText: scene.voiceText,
      templateName: TYPE_TO_SFX[scene.type] ?? "callout",
      sceneId: scene.id,
      index: sfxIndex,
    });
    if (!picked) continue;
    const pb = defaultPlayback(picked);
    sfxList.push({ path: join(SFX_DIR, picked.relPath), startSec: startSec + pb.offsetSec, volume: pb.volume });
  }
  await mixSfxOntoVoice(voiceRawMp3, sfxList, voiceMp3);
  const totalAudioSec = await getDurationSec(voiceMp3);
  log.info(`  voice.mp3: ${totalAudioSec.toFixed(2)}s, ${sfxList.length} SFX`);

  // STEP 6 — render each scene's template clip, fit to its narration length
  log.step(6, TOTAL_STEPS, "Render template clips + fit to narration");
  const clipsDir = join(outputDir, "clips");
  await mkdir(clipsDir, { recursive: true });
  const lastIdx = script.scenes.length - 1;
  const fittedClips: string[] = [];
  /** Photo files copied into a template dir; removed once rendering is done. */
  const vendoredAssets: string[] = [];

  for (let i = 0; i < script.scenes.length; i++) {
    const scene = script.scenes[i];
    const visualDur = timing.visualDurs[i]!;

    const inputs: Record<string, unknown> = { ...scene.inputs };
    // HyperFrames serves each composition over http://localhost:<port>/, so an
    // absolute file:// image is blocked cross-origin. Vendor the photo into the
    // template's own assets/ dir and pass a path relative to the composition.
    if (IMAGE_TEMPLATES.has(scene.templateId) && typeof inputs.image === "string" && inputs.image.trim()) {
      const assetsDir = join(TEMPLATES_DIR, scene.templateId, "assets");
      const fileName = `scene-${scene.id}.jpg`;
      const dest = join(assetsDir, fileName);
      await mkdir(assetsDir, { recursive: true });
      const src = String(inputs.image);
      if (/^https?:\/\//i.test(src)) {
        const res = await fetchImage(src, dest);
        if (res.success) {
          inputs.image = `assets/${fileName}`;
          vendoredAssets.push(dest);
          log.info(`  scene ${scene.id}: 配图已下载 → assets/${fileName}`);
        } else {
          log.warn(`  scene ${scene.id}: 配图下载失败（${res.reason}），回退纯色排版`);
          delete inputs.image;
        }
      } else {
        try {
          await copyFile(src, dest);
          inputs.image = `assets/${fileName}`;
          vendoredAssets.push(dest);
          log.info(`  scene ${scene.id}: 配图已复制 → assets/${fileName}`);
        } catch (e) {
          log.warn(`  scene ${scene.id}: 读不到本地配图 ${src}（${String(e)}），回退纯色排版`);
          delete inputs.image;
        }
      }
    }

    const rawClip = join(clipsDir, `scene-${scene.id}.mp4`);
    const fitClip = join(clipsDir, `scene-${scene.id}-fit.mp4`);
    // IDEMPOTENT: reuse an already-rendered clip. Delete it to force a
    // re-render after editing the scene's inputs or template.
    if (existsSync(rawClip)) {
      log.info(`  scene ${scene.id}: REUSE clip — delete to force re-render`);
    } else {
      await composeTemplate({
        templateId: scene.templateId,
        inputs,
        aspect: script.aspect,
        outputPath: rawClip,
        fps: RENDER_FPS,
      });
    }
    await fitClipToDuration(rawClip, visualDur, fitClip, RENDER_FPS);

    // Optional transparent overlays (lower third, follow pill, …), stacked.
    const specList = [...(scene.overlay ? [scene.overlay] : []), ...(scene.overlays ?? [])];
    let sceneClip = fitClip;
    if (specList.length > 0) {
      const inputsForOverlays: OverlayInput[] = [];
      for (let k = 0; k < specList.length; k++) {
        const spec = specList[k];
        const ovMov = join(clipsDir, `scene-${scene.id}-ov${k}.mov`);
        if (!existsSync(ovMov)) {
          await composeTemplate({
            templateId: spec.templateId,
            inputs: spec.inputs ?? {},
            aspect: script.aspect,
            outputPath: ovMov,
            fps: RENDER_FPS,
            format: "mov",
          });
        }
        const startSec = spec.startSec ?? 0.4;
        const remaining = Math.max(0.3, visualDur - startSec);
        inputsForOverlays.push({
          path: ovMov,
          startSec,
          durationSec: spec.durationSec ?? remaining,
          fadeSec: spec.fadeSec ?? 0.3,
        });
      }
      const composited = join(clipsDir, `scene-${scene.id}-comp.mp4`);
      await compositeOverlays(fitClip, inputsForOverlays, composited, RENDER_FPS);
      sceneClip = composited;
      log.info(
        `  scene ${scene.id}: ${specList.length} 个叠加层合成完成（${specList.map((x) => x.templateId).join(" + ")}）`,
      );
    }

    log.info(`  scene ${scene.id}: ${scene.templateId} → ${visualDur.toFixed(2)}s`);
    fittedClips.push(sceneClip);
  }

  // STEP 6b — brightness normalization
  // 配图/柱状图镜头比纯文字镜头亮 3 倍以上，直接相接会"忽明忽暗"。把每镜用
  // gamma 拉向全片中位数（gamma 保留黑白点，不像 brightness 那样发灰）。
  let finalClips = fittedClips;
  if (script.postprocess?.normalizeBrightness !== false && fittedClips.length > 2) {
    const lumas: number[] = [];
    for (const c of fittedClips) lumas.push(await measureLuma(c));
    const sortedL = [...lumas].sort((a, b) => a - b);
    const mid = Math.floor(sortedL.length / 2);
    const target =
      sortedL.length % 2 ? sortedL[mid] : (sortedL[mid - 1] + sortedL[mid]) / 2;
    log.info(`  亮度归一化：目标 ${target.toFixed(3)}（全片中位数）`);
    finalClips = [];
    for (let i = 0; i < fittedClips.length; i++) {
      const dst = join(clipsDir, `scene-${script.scenes[i].id}-norm.mp4`);
      const r = await normalizeLuma(fittedClips[i], lumas[i], target, dst, RENDER_FPS);
      if (r.applied) {
        log.info(`  ${script.scenes[i].id}: 亮度 ${lumas[i].toFixed(3)} → gamma ${r.gamma.toFixed(2)}`);
        finalClips.push(dst);
      } else {
        finalClips.push(fittedClips[i]);
      }
    }
  }

  // STEP 7 — concat clips + mux voice
  log.step(7, TOTAL_STEPS, "Concat clips + mux audio");
  const silentVideo = join(outputDir, "video-silent.mp4");
  const videoPath = join(outputDir, "video.mp4");
  if (tDur > 0) {
    log.info(`  transition: ${script.transition.type} ${tDur}s × ${fittedClips.length - 1}`);
    await concatVideosWithTransition(
      finalClips,
      silentVideo,
      script.transition.type,
      tDur,
      timing.baseDurs,
      RENDER_FPS,
    );
  } else {
    await concatVideos(finalClips, silentVideo);
  }
  await muxAudioOntoVideo(silentVideo, voiceMp3, videoPath);

  // Photos were copied into template dirs only for this run.
  await Promise.all(vendoredAssets.map((p) => unlink(p).catch(() => {})));

  // STEP 8 — done
  log.step(8, TOTAL_STEPS, "Done");
  console.log("\n=== Result ===");
  console.log(`Video:  ${videoPath}`);
  console.log(`Audio:  ${voiceMp3}  （给剪映/CapCut）`);
  console.log(`Script: ${join(outputDir, "script.txt")}  （给剪映/CapCut 自动字幕）`);
  // 成片比配音长 OUTRO_HOLD_SEC（结尾停留），只报配音长度会让人以为成片出了问题。
  const filmSec = await getDurationSec(videoPath).catch(() => Number.NaN);
  console.log(
    `总时长: ${Number.isFinite(filmSec) ? `${filmSec.toFixed(2)}s（成片，含结尾 ${OUTRO_HOLD_SEC}s 停留）` : "读取失败"}`,
  );
  console.log(`配音时长: ${totalAudioSec.toFixed(2)}s`);
}
