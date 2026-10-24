# Attribution — rve-endcard

Adapted for the **RVE visual pack** from the `EndCard` Remotion component
published by reactvideoeditor.com (free template, MIT — see
`templates/LICENSE-rve-mit.txt`), released through their HyperFrames templates
repository.

## What changed

| Upstream | Here |
| --- | --- |
| Remotion `spring()` / `interpolate()` driven by `useCurrentFrame` | CSS `@keyframes` with equivalent easings — frame-sampled rendering freezes rAF and spring |
| Palette `#111827 / #4361ee / #7209b7` | RVE tokens only: `#04060f` base, `#38bdf8` cyan, `#9d7bff` violet |
| Hard-coded English copy | Slots (`headline` / `cta` / `socials[]` / `studio`) filled from `data-composition-variables` |
| Bare colored circles | Circles show the first character of each social label, so a Chinese pack stays readable |
| Single 16:9 canvas | Two independent layouts: `index.html` (1920×1080) and `compositions/portrait.html` (1080×1920) |
| `Inter` webfont | Local `Noto Sans SC` subset, zero network |

Kept from upstream: the overall composition (centered card, pulsing glow border,
delayed subscribe button, four social dots, studio line) and the timing rhythm
(scale-in → button at ~0.67 s → icons at ~1 s).

## Upstream lineage

Vendored and adapted from reactvideoeditor.com's free Remotion/HyperFrames
templates. Font: Noto Sans SC subset (SIL OFL 1.1).
