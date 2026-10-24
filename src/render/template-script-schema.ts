import { z } from "zod";

/**
 * Script schema for the HyperFrames template pipeline. Each scene names a
 * vendored template under templates/<templateId>/ and supplies `inputs` matching that template's
 * data-composition-variables. The agent only fills text — the template owns the
 * visual design. inputs are kept loose here; each template validates its own.
 */

const SfxSpec = z.object({
  name: z.string().min(1),
  volume: z.number().min(0).max(1).default(0.4),
  startOffsetSec: z.number().default(0),
});
export type TplSfxSpecType = z.infer<typeof SfxSpec>;

const OverlaySpec = z.object({
  templateId: z.string().min(1),
  inputs: z.record(z.string(), z.unknown()).default({}),
  /** When the overlay appears (seconds from scene start). */
  startSec: z.number().min(0).default(0.4),
  /** How long it stays. Omit to run to the end of the scene. */
  durationSec: z.number().min(0.2).optional(),
  /** Alpha fade in/out; 0 disables the fades. */
  fadeSec: z.number().min(0).max(1.5).default(0.3),
});
export type OverlaySpecType = z.infer<typeof OverlaySpec>;

const PostProcess = z.object({
  /** Gamma-normalize each scene toward the film's median luma. Default on. */
  normalizeBrightness: z.boolean().default(true),
});
export type PostProcessType = z.infer<typeof PostProcess>;

const TemplateScene = z.object({
  id: z.string().min(1),
  type: z.enum(["hook", "body", "outro"]),
  /** Spoken narration (Vietnamese, spelled-out numbers — see skill rules). */
  voiceText: z.string().min(1),
  /** Folder name under templates/, e.g. "frame-bold-poster". */
  templateId: z.string().min(1),
  /** Text slots for the template's data-composition-variables. */
  inputs: z.record(z.string(), z.unknown()).default({}),
  /** Optional SFX override (else picked per scene.type + voiceText keywords). */
  sfx: SfxSpec.optional(),
  /**
   * Optional transparent overlay composited on top of this scene's clip.
   * The overlay template must render with alpha (transparent #root).
   */
  overlay: OverlaySpec.optional(),
  /** Same as `overlay`, but stacked: later entries composite on top. */
  overlays: z.array(OverlaySpec).default([]),
});
export type TemplateSceneType = z.infer<typeof TemplateScene>;

export const TemplateScriptSchema = z.object({
  version: z.literal("1.0"),
  /** Discriminator: marks this as a HyperFrames-template script. */
  renderer: z.literal("hyperframes"),
  /** Optional post-processing switches. */
  postprocess: PostProcess.default({ normalizeBrightness: true }),
  metadata: z.object({
    title: z.string().min(1),
    source: z.object({
      url: z.string(),
      domain: z.string(),
      image: z.string().url().nullable(),
    }),
    channel: z.string().min(1),
  }),
  voice: z.object({
    provider: z.literal("omnivoice").default("omnivoice"),
    speed: z.number().min(0.5).max(2.0),
  }),
  /** Output aspect for every scene (templates render a matching composition). */
  aspect: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
  /**
   * Scene-to-scene transition. Default is a short crossfade; set durationSec to 0
   * for hard cuts. Visual lengths are padded by durationSec so narration stays in sync.
   */
  transition: z
    .object({
      type: z.string().default("fade"),
      durationSec: z.number().min(0).max(1.5).default(0.4),
    })
    .default({ type: "fade", durationSec: 0.4 }),
  scenes: z
    .array(TemplateScene)
    .min(3)
    .max(12)
    .refine((s) => s[0]?.type === "hook", { message: "scenes[0] must be type=hook" })
    .refine((s) => s[s.length - 1]?.type === "outro", { message: "last scene must be type=outro" }),
});

export type TemplateScript = z.infer<typeof TemplateScriptSchema>;
