import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { log } from "../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Repo-root/templates — where vendored HyperFrames templates live. */
const TEMPLATES_DIR = join(__dirname, "..", "..", "templates");

export type Aspect = "16:9" | "9:16" | "1:1";

/**
 * Each aspect renders a dedicated composition file authored at that native
 * canvas (these templates use absolute-px layouts, so we re-lay-out per aspect
 * rather than scale a single composition). Missing file → fall back to index.html.
 */
const ASPECT_ENTRY: Record<Aspect, string> = {
    "16:9": "index.html",
    "9:16": "compositions/portrait.html",
    "1:1": "compositions/square.html",
};

/** Pinned renderer version — same as every other template skill in this family. */
const HF_VERSION = "0.6.94";

/**
 * Locate an already-installed hyperframes CLI of the pinned version.
 *
 * Why: `npx -y hyperframes@0.6.94` writes logs/index to `~/.npm`, which a file
 * sandbox may deny (`npm error Log files were not written ... sudo chown`), and
 * it re-resolves over the network on every scene. A cached copy renders offline
 * and deterministically.
 */
function findInstalledCli(): string | undefined {
    const npxRoot = join(homedir(), ".npm", "_npx");
    if (!existsSync(npxRoot)) return undefined;
    for (const entry of readdirSync(npxRoot)) {
        const pkg = join(npxRoot, entry, "node_modules", "hyperframes", "package.json");
        if (!existsSync(pkg)) continue;
        try {
            const { version } = JSON.parse(readFileSync(pkg, "utf8")) as { version?: string };
            if (version !== HF_VERSION) continue;
            const bin = join(npxRoot, entry, "node_modules", ".bin", "hyperframes");
            if (existsSync(bin)) return bin;
        } catch {
            // Corrupt cache entry — keep looking.
        }
    }
    return undefined;
}

/** Prefer HYPERFRAMES_BIN → cached 0.6.94 → npx (needs network + writable ~/.npm). */
function resolveHyperframes(): { cmd: string; args: string[] } {
    const override = process.env.HYPERFRAMES_BIN;
    if (override && existsSync(override)) return { cmd: override, args: [] };
    const cached = findInstalledCli();
    if (cached) return { cmd: cached, args: [] };
    return { cmd: "npx", args: ["-y", `hyperframes@${HF_VERSION}`] };
}

export interface ComposeArgs {
    /** Folder name under templates/, e.g. "frame-bold-poster". */
    templateId: string;
    /** Content slots, matching the template's data-composition-variables schema. */
    inputs: Record<string, unknown>;
    /** Absolute or repo-relative output .mp4 path. */
    outputPath: string;
    /** Force an output aspect. Omit to render the template's native canvas. */
    aspect?: Aspect;
    fps?: number;
    quality?: "draft" | "standard" | "high";
    /**
     * Container/codec. `webm` / `mov` keep the alpha channel, which is what
     * overlay templates need; `mp4` is opaque.
     */
    format?: "mp4" | "webm" | "mov" | "png-sequence";
}

/**
 * Render one vendored HyperFrames template into an MP4, injecting `inputs`
 * as composition variables. This is the deterministic "fill the slots" step:
 * the agent only supplies text, the template owns all the visual design.
 */
export async function composeTemplate(args: ComposeArgs): Promise<string> {
    const { templateId, inputs, fps = 30, quality = "standard", aspect, format } = args;
    const templateDir = join(TEMPLATES_DIR, templateId);
    if (!existsSync(join(templateDir, "index.html"))) {
        throw new Error(`Template not found: ${templateDir}/index.html`);
    }

    // Pick the composition file for the requested aspect (fall back to index.html).
    const entry = aspect ? ASPECT_ENTRY[aspect] : "index.html";
    const entryFile = existsSync(join(templateDir, entry))
        ? entry
        : "index.html";
    // index.html is the 16:9 cut; falling back to it for 9:16/1:1 silently
    // produces the wrong framing, so say so instead of guessing.
    if (aspect && entryFile !== entry) {
        log.warn(
            `${templateId} 没有 ${entry}，回退到 index.html（16:9 版式），` +
                `本次 ${aspect} 输出的画面比例可能不符`,
        );
    }

    const outputPath = isAbsolute(args.outputPath)
        ? args.outputPath
        : resolve(process.cwd(), args.outputPath);

    // Pass variables via a temp file, NOT --variables: a JSON arg through
    // npx + shell:true on Windows mangles quotes/Unicode (em-dash, Vietnamese)
    // and the render silently no-ops. A file is shell-safe and UTF-8 clean.
    const varsFile = join(
        mkdtempSync(join(tmpdir(), "hf-vars-")),
        "variables.json",
    );
    writeFileSync(varsFile, JSON.stringify(inputs), "utf8");

    const { cmd, args: cliArgs } = resolveHyperframes();
    const spawnArgs = [
        ...cliArgs,
        "render",
        templateDir,
        "--composition",
        entryFile,
        "--output",
        outputPath,
        "--fps",
        String(fps),
        "--quality",
        quality,
        "--variables-file",
        varsFile,
        ...(format && format !== "mp4" ? ["--format", format] : []),
    ];

    log.info(`Compose ${templateId} (${entryFile}) → ${outputPath}`);

    await new Promise<void>((resolve, reject) => {
        const proc = spawn(cmd, spawnArgs, {
            stdio: ["ignore", "inherit", "inherit"],
            shell: cmd === "npx",
        });
        proc.on("close", (code) =>
            code === 0
                ? resolve()
                : reject(new Error(`hyperframes render failed (exit ${code})`)),
        );
        proc.on("error", reject);
    });

    log.info(`Rendered: ${outputPath}`);
    return outputPath;
}

/** POC entry: `tsx src/render/template-composer.ts` renders sample clips. */
// pathToFileURL handles Windows backslash paths (a raw `file://${argv[1]}`
// never matches import.meta.url on win32, silently skipping this block).
if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const inputs = {
        kicker: "AI Coding",
        date: "12 · 06 · 2026",
        figure: "5.5",
        headline: ["GPT 5.5", "正式发布。", "目前最强。"],
        standfirst:
            "OpenAI 发布了他们迄今最强的模型 —— 更快、更便宜，也更懂中文。",
        footer_left: "AI Coding",
        footer_right: "https://aicodingvn.vercel.app/",
    };
    (async () => {
        await composeTemplate({
            templateId: "frame-bold-poster",
            inputs,
            aspect: "16:9",
            outputPath: "output/poc-bold-poster-16x9.mp4",
        });
        await composeTemplate({
            templateId: "frame-bold-poster",
            inputs,
            aspect: "9:16",
            outputPath: "output/poc-bold-poster-9x16.mp4",
        });
    })().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
