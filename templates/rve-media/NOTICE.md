# Attribution — rve-media

**Original template** authored for the RVE pack. Not vendored.

## Design

- 视觉语言取自 `templates/tokens.json`（深海军蓝 `#04060f`、青 `#38bdf8`、
  紫 `#9d7bff`、Inter + 苹方、胶片颗粒），与 pack 内其他模板共享同一套底色。
- 动效：`@keyframes kb` 做 Ken Burns（scale 1.04 → 1.15，`transform-origin` 由
  `focus` 槽位控制）；护栏文字用三层 scrim 保证可读性。
- 两版：`compositions/portrait.html`（1080×1920）与 `index.html`（1920×1080）。
- 无图回退：`inputs.image` 为空时加 `.no-image`，切到纯渐变 + 排版页，不留空镜。
