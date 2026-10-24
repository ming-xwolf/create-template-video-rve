import { describe, expect, it } from "vitest";
import { computeSceneTiming, quantizeToFrame } from "./timing.js";

const BASE = { fps: 30, sceneGapSec: 0.3, outroHoldSec: 3, transitionSec: 0.4 };

describe("quantizeToFrame", () => {
  it("向上取整到帧边界", () => {
    expect(quantizeToFrame(3.268, 30)).toBeCloseTo(3.3, 6);
    expect(quantizeToFrame(5.067, 30)).toBeCloseTo(5.1, 6); // 152.01 帧 → 153
  });

  it("已经是帧边界时不跳帧（浮点噪声不算）", () => {
    expect(quantizeToFrame(3.3, 30)).toBeCloseTo(3.3, 6);
  });
});

describe("computeSceneTiming", () => {
  const voiceDurs = [4.368, 2.856, 3.696, 3.048, 3.288];

  it("视频起点与音频起点逐镜对齐", () => {
    const t = computeSceneTiming({ ...BASE, voiceDurs });
    // 视频起点：sum(visual - transition)
    let videoCursor = 0;
    t.visualDurs.forEach((v, i) => {
      expect(t.starts[i]!).toBeCloseTo(videoCursor, 3);
      videoCursor += v - (i < t.visualDurs.length - 1 ? BASE.transitionSec : 0);
    });
  });

  it("间隔不会小于基础间隔（帧取整只会变长）", () => {
    const t = computeSceneTiming({ ...BASE, voiceDurs });
    for (const g of t.gaps) expect(g).toBeGreaterThanOrEqual(BASE.sceneGapSec - 1e-9);
  });

  it("每个视觉时长都是整数帧", () => {
    const t = computeSceneTiming({ ...BASE, voiceDurs });
    for (const v of t.visualDurs) {
      expect(Math.abs(v * BASE.fps - Math.round(v * BASE.fps))).toBeLessThan(1e-6);
    }
  });

  it("硬切（transition 0）时不留重叠", () => {
    const t = computeSceneTiming({ ...BASE, transitionSec: 0, voiceDurs });
    expect(t.starts[1]).toBeCloseTo(t.visualDurs[0]!, 3);
    // 没有转场重叠时，间隔 = 基础间隔 + 该镜的取整余量（最多一帧）
    for (const g of t.gaps) {
      expect(g).toBeGreaterThanOrEqual(BASE.sceneGapSec - 1e-9);
      expect(g).toBeLessThanOrEqual(BASE.sceneGapSec + 1 / 30 + 1e-6);
    }
  });

  it("单镜也能算（gaps 为空）", () => {
    const t = computeSceneTiming({ ...BASE, voiceDurs: [2.0] });
    expect(t.gaps).toEqual([]);
    expect(t.starts).toEqual([0]);
    expect(t.visualDurs[0]).toBeCloseTo(quantizeToFrame(5.0, 30), 6);
  });
});
