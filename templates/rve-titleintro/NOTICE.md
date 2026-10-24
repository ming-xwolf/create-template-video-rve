# Attribution — rve-titleintro

Adapted for the **RVE visual pack** from the `CinematicTitleIntro` Remotion
component published by reactvideoeditor.com (free template, MIT — see
`templates/LICENSE-rve-mit.txt`).

## What changed

| Upstream | Here |
| --- | --- |
| `spring(50→0, 40f)` + `spring(0→1, 30f)` | two parallel CSS animations: `titleRise 1.33s` (with a −6 px overshoot at 60 %) and `titleFade 1s` |
| `interpolate(width, [20,50] → [0,100] %)` | `ruleGrow` on the underline's `width`, 0 → 320 px, delay 0.67 s |
| `interpolate(opacity, [40,60] → [0,1])` | `subIn` 0.67 s, delay 1.33 s |
| `#111827 → #1a1a2e` flat gradient | RVE base `#04060f` + one cyan bloom + vignette + grain |
| `#4361ee → #7209b7` underline | `#38bdf8 → #9d7bff` (tokens), plus a soft indigo glow |
| Hard-coded copy | Slots `title` / `subtitle` / `note` (`note` hides when empty) |
| Single 16:9 canvas | `index.html` (1920×1080) + `compositions/portrait.html` (1080×1920, underline 264 px) |

Kept from upstream: the three-phase cadence (title rises → rule sweeps → subtitle
fades) and its timing. Not kept: nothing else — the composition is the same
minimal centre column.

## Why it is not `rve-hook`

`rve-hook` is a news opener: kicker + headline + subheadline + CTA + brand badge,
left-heavy, with light blobs and a grid. This template carries only a title, one
gradient rule and a subtitle, centred with a large amount of empty space — the
"cinematic" register rather than the "bulletin" one.

## Upstream lineage

Vendored and adapted from reactvideoeditor.com's free Remotion/HyperFrames
templates. Font: Noto Sans SC subset (SIL OFL 1.1).
