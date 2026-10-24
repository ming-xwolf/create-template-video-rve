import { config as loadEnv } from "dotenv";
import { join } from "node:path";
import { SKILL_ROOT } from "./paths.js";

// 从技能目录加载 `.env`：从别的 CWD 启动时也能读到配置。
loadEnv({ path: join(SKILL_ROOT, ".env") });

export type TtsProvider = "omnivoice";

export interface Config {
    ttsProvider: TtsProvider;

    // OmniVoice (local TTS server)
    omnivoiceEndpoint: string;

    ttsConcurrency: number;
}

function intDefault(name: string, def: number): number {
    const v = process.env[name];
    if (!v) return def;
    const n = parseInt(v, 10);
    if (isNaN(n))
        throw new Error(`Env var ${name} must be integer, got "${v}"`);
    return n;
}

export function loadConfig(): Config {
    const provider = (process.env.TTS_PROVIDER ?? "omnivoice") as TtsProvider;
    if (provider !== "omnivoice") {
        throw new Error(
            `TTS_PROVIDER must be "omnivoice", got "${provider}"`,
        );
    }

    return {
        ttsProvider: provider,
        omnivoiceEndpoint:
            process.env.OMNIVOICE_ENDPOINT ?? "http://127.0.0.1:8124",
        ttsConcurrency: intDefault("TTS_CONCURRENCY", 1),
    };
}
