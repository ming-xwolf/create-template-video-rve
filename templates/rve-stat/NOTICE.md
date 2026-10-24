# Attribution — rve-stat

Adapted for the **RVE visual pack** from `frame-pentagram-stat` in
`create-template-video-zh/templates/` (a separate Chinese pack that is no longer installed here; this copy is the only one).

## Upstream lineage

Vendored and adapted from:

- **Source:** [nexu-io/html-video](https://github.com/nexu-io/html-video) — `templates/frame-pentagram-stat`
- **License:** Apache-2.0 (attribution required, commercial use allowed)
- **Design lineage (upstream):** huashu-design "Pentagram" philosophy, MIT © alchaincyf — Swiss-grid data anchor.


## What changed for the RVE pack

- Palette remapped onto the RVE token set (see `templates/tokens.json`), which
  was extracted from the HyperFrames blocks at
  https://www.reactvideoeditor.com/hyperframes-templates (dark navy `#04060f`,
  cyan `#38bdf8`, violet `#9d7bff`, Inter + PingFang SC).
- Typography unified on Inter + PingFang SC (the source used per-template
  display faces, which made scenes read as different brands).
- Injected a shared house layer (`#root::before` ambient blooms,
  `#root::after` film grain) so every scene in this pack shares a backdrop.
- 16:9 (`index.html`) and 9:16 (`compositions/portrait.html`) both kept.

Do not redistribute outside this machine without re-checking the upstream
licence.
