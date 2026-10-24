# Attribution — rve-rings

Derived from the **activity-rings** block of
[reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)
(MIT License, Copyright (c) 2026 React Video Editor).

改动：原 block 用 `requestAnimationFrame` 逐帧算 `stroke-dashoffset` 和百分比文本，
在 HyperFrames 逐帧截图下冻结。这里改为 CSS：
- 弧线 `stroke-dashoffset` 由 `@keyframes draw` 推到 `var(--off)`（数值由数据算出）
- 百分比用 `@property --n` + `counter-reset` + `counter()` 计数
- 去掉循环 drain 阶段（成片里不需要循环）

同时槽位化（items[{label,value}]）、色板对齐 tokens、补 9:16 版。

MIT 全文见 `templates/LICENSE-rve-mit.txt`。
