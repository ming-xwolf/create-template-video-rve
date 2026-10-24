# Attribution — rve-quotecard

Adapted for the **RVE visual pack** from the `QuoteCard` Remotion component
published by reactvideoeditor.com (free template, MIT — see
`templates/LICENSE-rve-mit.txt`).

## What changed

| Upstream | Here |
| --- | --- |
| Three `interpolate()` calls on `useCurrentFrame` | CSS `@keyframes` with matching 0/0.33/1 s delays (frame 0/10/30 @ 30 fps) |
| `#111827` flat background, `#3b82f6` accent | RVE base `#04060f` + cyan `#38bdf8` + faint blooms + film grain |
| Hard-coded English quote and attribution | Slots `quote` / `author` / `role` / `source` |
| `translateX(40px → 0)` on attribution | Same 40 px slide, same 0.5 s window |
| Single 16:9 canvas | `index.html` (1920×1080) + `compositions/portrait.html` (1080×1920) |
| Serif italic (`Georgia, serif`) | `Georgia → Songti SC → Noto Serif SC → serif`; **italic dropped for CJK** (synthetic oblique looks broken on Chinese glyphs) |

## Typography caveat

The Chinese serif is a **system** font — no serif subset is shipped, because the
available macOS CJK serif (Songti) is Apple-licensed and not redistributable.
Rendered on this machine it resolves to a serif (verified: ink density 1.79 % vs
2.26 % for the same text in Noto Sans SC, 2.0 % of pixels differ in glyph shape),
but the exact face follows whatever serif the host has. If a machine has no CJK
serif at all, the text falls back to sans — layout still holds.

Inside the pack, `rve-quote` remains the card-with-avatar testimonial; this
template deliberately has no card, no portrait, no stars.

## Upstream lineage

Vendored and adapted from reactvideoeditor.com's free Remotion/HyperFrames
templates. Font: Noto Sans SC subset (SIL OFL 1.1) for UI text.
