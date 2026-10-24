# Attribution — rve-zoompulse

Adapted for the **RVE visual pack** from the `ZoomPulse` Remotion/HyperFrames
component published by reactvideoeditor.com (free template, MIT — see
`templates/LICENSE-rve-mit.txt`).

## What changed

| Upstream | Here |
| --- | --- |
| `animation: zoomPulse 4s ease-in-out infinite` on a Next.js `<Image>` | Same CSS animation on a plain `<img>`, same `ease-in-out` sine shape |
| Hard-coded `duration / minScale / maxScale` props | Slots `pulse_seconds` / `zoom` (percent above 1.0), clamped to sane ranges |
| Fixed 800×450 box on black | Full-bleed `object-fit: cover` with a `focus` slot for `object-position` |
| No text layer | Optional `kicker` + `caption` (both hidden when empty → pure ambient shot) |
| Image required | Falls back to a breathing gradient when no image is available, so a failed download still renders |
| Single canvas | `index.html` (1920×1080) + `compositions/portrait.html` (1080×1920) |

Kept from upstream: the pulse itself — scale 1.0 → `1 + zoom/100` → 1.0 on a
sine-like `ease-in-out`, looping forever. Because it never rests, a long hold
keeps moving without any camera move.

## Why it is not `rve-media`

`rve-media` pushes once and stops (`kb`: scale 1.04 → 1.14 over 6 s, `forwards`) —
a Ken Burns move for a photo that carries a caption. This template *oscillates*
(1.0 ↔ 1.1 every 4 s), so it reads as ambient rhythm rather than a slow reveal.

## Pipeline note

Image vendoring in `src/render/template-pipeline.ts` used to be hard-coded to
`rve-media`; it now goes through `IMAGE_TEMPLATES`, which includes this template,
so `image` gets copied into `assets/` and rewritten to a relative path the same
way.

## Upstream lineage

Vendored and adapted from reactvideoeditor.com's free Remotion/HyperFrames
templates. Font: Noto Sans SC subset (SIL OFL 1.1).
