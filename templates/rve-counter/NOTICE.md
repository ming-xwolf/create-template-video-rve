# Attribution — rve-counter

Derived from the **stat-counter** block of
[reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)
(MIT License, Copyright (c) 2026 React Video Editor).

Changes made here:
- **重写动画**：原 block 用 `requestAnimationFrame` + `performance.now()`，在
  HyperFrames 的逐帧截图下完全静止（已实测：不同时刻帧差 0.92，数字不动）。
  改为 `@property --n` 注册整数 + CSS `@keyframes` 驱动 `counter-reset`，
  动画走 CSS 时间轴，可被 seek，逐帧渲染正确。
- 槽位化：`value` / `suffix` / `kicker` / `label`，其余（含逗号分隔）由运行时处理。
- 色板改为 tokens 的青紫渐变；补 9:16 竖版。

MIT 许可证全文见 `LICENSE-rve-mit.txt`（随 pack 分发）。
