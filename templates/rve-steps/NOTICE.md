# Attribution — rve-steps

Adapted for the **RVE visual pack** from the `ProgressSteps` Remotion component
published by reactvideoeditor.com (free template, MIT — see
`templates/LICENSE-rve-mit.txt`).

## What changed

| Upstream | Here |
| --- | --- |
| `interpolate()` per step driven by `useCurrentFrame()` | per-element `animation-delay`, so the whole sequence lives in CSS and survives frame-by-frame seeking |
| `isActive` / `isComplete` compared against `frame` at render time | fill / label colour flip at the step's own delay via a 0.01 s animation with `forwards` (no JS timers — `setTimeout` is not seek-safe) |
| `spring(damping 8, stiffness 150, mass 0.4)` → `0.9 + pulse*0.2` | `pop` keyframes: scale .9 → 1.13 → 1.1; base state 1.0, so *pending* dots stay at their normal size |
| `#3b82f6` / `#7209b7` / `#a855f7` | RVE `#38bdf8` → `#9d7bff` (tokens) |
| `#111827 → #1f2937` page gradient | RVE base + cyan bloom + grain |
| Hard-coded `steps` array | Slot `steps` (2–5 labels), `title` slot (hides when empty) |
| Single canvas | `index.html` (1920×1080) + `compositions/portrait.html` (1080×1920, wider cells, smaller dots) |

Kept from upstream: per-step cadence (0.8 s apart), fill first then connector
(0.4 → 0.8 s inside each step), and the completed dots resting slightly enlarged.

## Verified timings (rendered, measured)

| event | design | measured |
| --- | --- | --- |
| dot 1–4 fill | 0.0 / 0.8 / 1.6 / 2.4 s | same (frame-sampled) |
| connector 1–3 grow | 0.4 / 1.2 / 2.0 s → full 112 px by +0.4 s | 0 px at 0.3 s → 112 px at 0.9 s, etc. |
| active dot pulse | .9 → 1.13 → 1.1 | 32 px → 54 px → 50 px (Ø 58 base) |

## Upstream lineage

Vendored and adapted from reactvideoeditor.com's free Remotion/HyperFrames
templates. Font: Noto Sans SC subset (SIL OFL 1.1).
