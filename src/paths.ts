import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

/** 技能根目录（本文件在 `src/` 下）。 */
export const SKILL_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * 解析配置里的路径。
 *
 * 相对路径按**技能根目录**算，而不是按进程 CWD——`.env` 里写
 * `SFX_DIR=./assets/sfx` 时，无论从哪个目录启动流水线，都指向技能自己的音效库。
 */
export function resolveFromSkillRoot(
  pathValue: string,
  root: string = SKILL_ROOT,
): string {
  const trimmed = pathValue.trim();
  return isAbsolute(trimmed) ? trimmed : join(root, trimmed);
}
