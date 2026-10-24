import axios, { AxiosError } from "axios";
import { writeFile } from "node:fs/promises";
import type { TtsClient } from "./tts-client.js";

export interface OmniVoiceOpts {
  endpoint: string; // e.g. "http://127.0.0.1:8123"
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// OmniVoice local TTS: POST { text, language? } → audio/mpeg bytes.
// No API key or voice ID — configured server-side (port 8124 = 中文音色).
// srtOutPath is ignored (no subtitle support).
export class OmniVoiceClient implements TtsClient {
  constructor(private cfg: OmniVoiceOpts) {}

  async generate(text: string, audioOutPath: string, _srtOutPath?: string): Promise<void> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;
    // 显式带上语言：服务端 OMNIVOICE_LANG 没设成 zh 时，也不会用越南语音素读中文。
    const language = process.env.TTS_LANGUAGE?.trim() || undefined;
    const body = language ? { text, language } : { text };

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const resp = await axios.post<ArrayBuffer>(
          `${this.cfg.endpoint}/tts`,
          body,
          { headers: { "Content-Type": "application/json", Accept: "audio/mpeg" }, responseType: "arraybuffer", timeout: 60000 },
        );
        await writeFile(audioOutPath, Buffer.from(resp.data));
        return;
      } catch (e) {
        lastErr = e;
        const status = (e as AxiosError).response?.status;
        if (status !== undefined && status < 500 && status !== 429) {
          throw new Error(`OmniVoice TTS failed (status ${status})`);
        }
        if (attempt < delays.length) await sleep(delays[attempt]);
      }
    }
    throw lastErr;
  }
}
