# Attribution — rve-liquid

Derived from a block of [reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)
(MIT License, Copyright (c) 2026 React Video Editor).

重写内容：原 block 的动画依赖 `requestAnimationFrame` / SMIL，在 HyperFrames 逐帧截图下冻结；
这里全部改为 CSS `@keyframes`（数字用 `@property --n` + `counter-reset`），并做槽位化、对齐 tokens、补 9:16。

MIT 全文见 `templates/LICENSE-rve-mit.txt`。
