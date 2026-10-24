import { describe, it, expect } from "vitest";
import { toSlug } from "./slug.js";

describe("toSlug", () => {
  it("converts Vietnamese diacritics to ASCII", () => {
    expect(toSlug("iPhone 17 ra mắt với camera 200MP"))
      .toBe("iphone-17-ra-mat-voi-camera-200mp");
  });

  it("collapses whitespace and special chars to single dash", () => {
    expect(toSlug("Hello   --   World!!!")).toBe("hello-world");
  });

  it("strips leading/trailing dashes", () => {
    expect(toSlug("---abc---")).toBe("abc");
  });

  it("truncates to 40 chars without breaking words", () => {
    const long = "this is a very long title that should be truncated nicely";
    const s = toSlug(long);
    expect(s.length).toBeLessThanOrEqual(40);
    expect(s).not.toMatch(/-$/);
  });

  it("handles empty/whitespace input", () => {
    expect(toSlug("")).toBe("rve-video");
    expect(toSlug("   ")).toBe("rve-video");
  });

  it("falls back to rve-video for pure-Chinese titles", () => {
    // 纯中文经 [a-z0-9] 过滤后只剩数字或空，不能产出 "-" 开头或空 slug
    expect(toSlug("国产大模型降价")).toBe("rve-video");
    expect(toSlug("小米17发布")).toBe("17");
  });
});
