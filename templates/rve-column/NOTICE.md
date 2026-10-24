# Attribution — rve-column

Derived from a block of [reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)
(MIT License, Copyright (c) 2026 React Video Editor).

重写内容：
- 原 block 的 SVG 动效为 **SMIL**（`<animate>`），在 HyperFrames 逐帧渲染下冻结
  （实测帧差 0.22）。这里改为 CSS `stroke-dashoffset` / `height` / `opacity` 动画。
- 数据槽位化，由 `script.json` 传入；色板对齐 `templates/tokens.json`；补 9:16 竖版。

MIT 全文见 `templates/LICENSE-rve-mit.txt`。
