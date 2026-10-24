import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { log } from "../utils/logger.js";
import type { TemplateScript } from "./template-script-schema.js";

const TEMPLATES_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "templates",
);

/** How many times one body template may appear before the video starts to repeat itself. */
const MAX_BODY_REUSE = 3;

/**
 * Overlay templates are transparent full-bleed cards (alpha `#root`) — they only
 * make sense stacked on another scene via the `overlays` field. Used as a scene
 * templateId they pass the existence check but render a nearly invisible clip.
 */
const OVERLAY_ONLY = new Set(["rve-lower-third", "rve-follow", "rve-prism"]);

/**
 * Style guardrail for the RVE pack.
 *
 * Consistency in this pack is structural, not a matter of taste: every template
 * shares one token set, so the things that actually break the look are
 * (a) a templateId that does not exist, (b) the same card shown twice in a
 * row, and (c) an overlay template used as a full scene. All are cheap to
 * catch here, before any TTS or render work is spent.
 */
const SLOT_CACHE = new Map<string, Set<string>>();

/** Every `v.<key>` a template actually reads (its 16:9 composition is the source of truth). */
function templateSlots(templateId: string): Set<string> {
  const cached = SLOT_CACHE.get(templateId);
  if (cached) return cached;
  const keys = new Set<string>();
  try {
    const html = readFileSync(join(TEMPLATES_DIR, templateId, "index.html"), "utf8");
    for (const m of html.matchAll(/\bv\.([A-Za-z_][A-Za-z0-9_]*)/g)) keys.add(m[1]!);
  } catch {
    // 读不到就跳过这项检查，交给渲染阶段去暴露问题。
  }
  SLOT_CACHE.set(templateId, keys);
  return keys;
}

/**
 * Slots the script passes that the template never reads.
 *
 * A misspelled slot is silent damage: the template falls back to its built-in
 * default text, so the render looks fine and the words are simply wrong. Cheap
 * to catch here.
 */
export function findUnknownSlots(
  templateId: string,
  inputs: Record<string, unknown>,
): string[] {
  const known = templateSlots(templateId);
  if (known.size === 0) return [];
  return Object.keys(inputs).filter((k) => !known.has(k));
}

export function preflightStyle(script: TemplateScript): void {
  const scenes = script.scenes;

  for (const scene of scenes) {
    if (OVERLAY_ONLY.has(scene.templateId)) {
      throw new Error(
        `[style] scene ${scene.id}: "${scene.templateId}" 是叠加层模板（#root 透明），` +
          `只能通过 overlays 字段叠加，不能单独成镜`,
      );
    }
    const dir = join(TEMPLATES_DIR, scene.templateId);
    if (!existsSync(join(dir, "index.html"))) {
      throw new Error(
        `[style] scene ${scene.id}: 未知模板 "${scene.templateId}" —— 只能使用 templates/CATALOG.md 里的模板`,
      );
    }
    if (!existsSync(join(dir, "compositions", "portrait.html"))) {
      log.warn(
        `[style] ${scene.templateId} 缺 compositions/portrait.html，9:16 会回退到 16:9`,
      );
    }

    const unknown = findUnknownSlots(scene.templateId, scene.inputs);
    if (unknown.length > 0) {
      log.warn(
        `[style] scene ${scene.id}: ${scene.templateId} 不认识槽位 ${unknown
          .map((k) => `"${k}"`)
          .join("、")} —— 写错不会报错，模板会静默用默认文案（以 CATALOG.md 为准）`,
      );
    }
  }

  for (let i = 1; i < scenes.length; i++) {
    if (scenes[i].templateId === scenes[i - 1].templateId) {
      throw new Error(
        `[style] scene ${scenes[i - 1].id} 与 ${scenes[i].id} 都用了 ${scenes[i].templateId} —— ` +
          `相邻两镜必须换模板（rve-statement / rve-list / rve-stat 交替）`,
      );
    }
  }

  const bodyUse = new Map<string, number>();
  for (const scene of scenes) {
    if (scene.type !== "body") continue;
    bodyUse.set(scene.templateId, (bodyUse.get(scene.templateId) ?? 0) + 1);
  }
  for (const [templateId, count] of bodyUse) {
    if (count > MAX_BODY_REUSE) {
      log.warn(
        `[style] ${templateId} 在 body 里出现 ${count} 次（建议 ≤ ${MAX_BODY_REUSE}）—— 画面会开始重复`,
      );
    }
  }

  log.info(`  style preflight OK (${scenes.length} scenes, ${bodyUse.size} body templates)`);
}
