import { describe, expect, it } from "vitest";
import { isAbsolute } from "node:path";
import { resolveFromSkillRoot, SKILL_ROOT } from "./paths.js";

describe("resolveFromSkillRoot", () => {
  it("相对路径按技能根目录解析（不受 CWD 影响）", () => {
    expect(resolveFromSkillRoot("./assets/sfx")).toBe(`${SKILL_ROOT}/assets/sfx`);
    expect(resolveFromSkillRoot("assets/sfx")).toBe(`${SKILL_ROOT}/assets/sfx`);
  });

  it("绝对路径原样保留", () => {
    expect(resolveFromSkillRoot("/tmp/sfx")).toBe("/tmp/sfx");
  });

  it("容忍前后空格与自定义根（便于测试）", () => {
    expect(resolveFromSkillRoot("  ./a  ", "/root")).toBe("/root/a");
    expect(isAbsolute(resolveFromSkillRoot("x", "/root"))).toBe(true);
  });

  it("SKILL_ROOT 指向技能目录本身", () => {
    expect(SKILL_ROOT.endsWith("create-template-video-rve")).toBe(true);
  });
});
