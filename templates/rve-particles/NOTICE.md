# Attribution — rve-particles

Derived from the **particle-wordmark** block of
[reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)
(MIT License, Copyright (c) 2026 React Video Editor).

## 与原版的差异（重要）

原版用 canvas 逐帧模拟粒子，并**采样字形像素**作为粒子终点——粒子最终精确拼成文字轮廓。
这需要每帧 JS 计算，在 HyperFrames 的逐帧截图下会完全冻结，纯 CSS 无法复刻。

这里做的是**近似实现**：
- 54 个散点按黄金角散布在画面外围，用 CSS 动画向中心汇聚并淡出（不落在字形上）
- 文字本身逐字「模糊 → 聚焦」，形成"从粒子中显影"的错觉
- 最后一道扫光强化"成型"的瞬间

观感接近，但不具备原版"粒子精确拼字"的精度。如果需要真正的粒子拼字，
应当用 WebGL/canvas 在支持逐帧求值的渲染器里做，而不是 HyperFrames。

MIT 全文见 `templates/LICENSE-rve-mit.txt`。
