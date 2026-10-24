# Attribution — rve-notify

Derived from the **notification-stack** block of
[reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)
(MIT License, Copyright (c) 2026 React Video Editor).

改动：原 block 用 `requestAnimationFrame` + 弹簧积分（STIFF/DAMP）逐帧模拟卡片落位与堆叠，
在 HyperFrames 逐帧截图下完全冻结。这里改为**按槽位变量化的 CSS keyframes**
（`--slot` 决定 translateY，单一 `enter`/`leave` 动画适配任意张数），保留"逐条落位 → 整体退场"
的节奏，但不再有弹簧的过冲感。

同时做了槽位化（icon/title/time/body/tone）、色板对齐 tokens、补 9:16 版。

MIT 全文见 `templates/LICENSE-rve-mit.txt`。
