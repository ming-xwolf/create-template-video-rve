# Attribution — rve-gauge

Derived from a block of [reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)
(MIT License, Copyright (c) 2026 React Video Editor).

重写内容：
- 原 block 的动画是 **SMIL / requestAnimationFrame**，在 HyperFrames 逐帧渲染下会冻结
  （实测：SMIL 帧差 0.22，rAF 帧差 0.92，等同于静止）。这里全部改为 **CSS keyframes**：
  路径描边走 `stroke-dashoffset`，环形仪表走 `stroke-dashoffset`，条形走 `width`，
  数字走 `@property` 注册的 CSS 计数器。
- 数据改为输入：`series` / `value` / `items` 由 `script.json` 提供，不再写死在 HTML 里。
- 色板对齐 `templates/tokens.json`；补 9:16 竖版。

MIT 全文见 `templates/LICENSE-rve-mit.txt`。
