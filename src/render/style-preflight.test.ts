import { describe, expect, it } from "vitest";
import { findUnknownSlots } from "./style-preflight.js";

describe("findUnknownSlots", () => {
  it("认识 rve-hook 的槽位", () => {
    expect(
      findUnknownSlots("rve-hook", {
        kicker: "AI 快讯",
        headline: "新模型发布",
        subheadline: "号称史上最强。",
        cta: "继续看",
        brand: "中文科技观察",
      }),
    ).toEqual([]);
  });

  it("抓出写错的槽位（rve-aurora 用 line1，rve-hook 用 headline）", () => {
    expect(findUnknownSlots("rve-hook", { headline: "标题", line1: "错位" })).toEqual([
      "line1",
    ]);
    expect(findUnknownSlots("rve-aurora", { line1: "对" })).toEqual([]);
  });

  it("未知模板直接跳过（由存在性检查负责报错）", () => {
    expect(findUnknownSlots("rve-does-not-exist", { anything: 1 })).toEqual([]);
  });
});
