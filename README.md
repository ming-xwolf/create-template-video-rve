# create-template-video-rve

用 **RVE 视觉语言**把一条中文内容做成短视频：深海军蓝底（`#04060f`）+ 蓝青发光（`#38bdf8`）+ 紫色情绪点（`#9d7bff`）+ 本地 Noto Sans SC 子集 + 胶片颗粒。

你只写文字和 `script.json`，设计、动效、配音、对齐、拼接都由流水线负责。

- **输出**：`video.mp4`（成片）+ `voice.mp3`（给剪映自动字幕）+ `script.txt`（分镜文本）
- **画幅**：9:16（默认）× 16:9，每个模板两份独立排版
- **模板**：23 个，统一 token，风格由结构性约束保证（见下方「三道闸」）
- **依赖**：完全自包含——模板、依赖、TTS 启动脚本、音效目录都在本目录内

---

## 快速开始

### 1. 启动中文 TTS

```bash
bash scripts/start-tts-zh.sh          # 检查 /health，未就绪就后台拉起（约 4s）
curl -s -X POST http://127.0.0.1:8124/tts -H 'Content-Type: application/json' \
  -d '{"text":"大家好，这是中文配音测试。"}' -o /tmp/zh-probe.mp3 && ls -l /tmp/zh-probe.mp3
```

返回 `000` / 连不上就说明没起来：**停下来排查，不要伪造音频**。服务本体在
`~/Documents/dsh_workspace/omnivoice`（模型 + 音色 `voice-zh.pt`），不在本技能内。

### 2. 写 script.json

```json
{
  "version": "1.0",
  "renderer": "hyperframes",
  "aspect": "16:9",
  "metadata": {
    "title": "示例",
    "source": { "url": "local", "domain": "local", "image": null },
    "channel": "中文科技观察"
  },
  "voice": { "provider": "omnivoice", "speed": 1.0 },
  "scenes": [
    { "id": "s1", "type": "hook", "templateId": "rve-hook", "voiceText": "这是开场第一句。",
      "inputs": { "kicker": "AI 快讯", "headline": "新模型发布",
                  "subheadline": "号称史上最强。", "cta": "继续看", "brand": "中文科技观察" } },
    { "id": "s2", "type": "body", "templateId": "rve-stat", "voiceText": "第二句讲一个数。",
      "inputs": { "label": "性能 · 编程", "headline": "82%", "subtitle": "开源模型里的最高分。" } },
    { "id": "s3", "type": "outro", "templateId": "rve-outro", "voiceText": "最后一句收尾。",
      "inputs": { "brand_name": "中文科技观察", "tagline": "每天一条", "primary_url": "ithome.com" } }
  ]
}
```

### 3. 跑流水线

```bash
npm run pipeline -- <outputDir>/script.json
```

八步：校验 → preflight → TTS → 音效 → 逐模板渲染 → 按配音对齐 → 拼接+归一化 → 出片。

**幂等**：`voice/scene-*.mp3` 和 `clips/scene-*.mp4` 会复用。改文案后要重跑，**先删对应的 `voice/scene-*.mp3`**（`.wav` 是它解码出来的派生文件，重新生成配音时会自动重建，不用手动删）；改了模板或参数，删 `clips/scene-*.mp4`。

---

## 音画为什么不会漂

两件容易踩的事，都已经在流水线里处理：

1. **mp3 的标称时长 ≠ 解码时长。** LAME 会给每段音频加约 56–68ms 的编码填充，若拿容器时长排时间轴、却按解码样本拼接，每镜配音就会提前一点，十镜累积可达 0.6s。所以配音一律先解码成 WAV（`voice/scene-*.wav`），时间轴建在样本长度上。
2. **画面只能是整数帧。** 每镜视觉时长先向上取整到帧边界，取整多出来的余量变成该镜的音频间隔，音频和画面因此共用同一条时间轴（`src/render/timing.ts`）；裁片也按帧数而不是秒数。

实测十镜竖屏片，配音起点与画面切点的最大偏差 **0.7ms**。

---

## 目录结构

```
create-template-video-rve/
├── SKILL.md              # 给 AI 的操作手册（工作流、选型规则、TTS 数字读法）
├── README.md             # 本文件：给人看的入口
├── templates/
│   ├── CATALOG.md        # 23 个模板的槽位表 + 选型速查（写文案前必读）
│   ├── tokens.json       # 唯一色板来源；新模板只能从这里取色
│   ├── fonts/            # Noto Sans SC 子集（1.8MB，GB2312 全字符集）
│   └── rve-*/            # index.html（16:9）+ compositions/portrait.html（9:16）
├── src/
│   ├── cli.ts
│   ├── render/           # 流水线、composer、preflight、script schema
│   ├── tts/              # OmniVoice 客户端
│   ├── assets/           # 音效索引、图片抓取、音频工具
│   └── utils/
├── scripts/
│   ├── start-tts-zh.sh   # 中文 TTS 启停
│   ├── download-sfx.ts   # 补音效（需联网）
│   └── filter-sfx.ts
├── assets/sfx/           # 音效库（当前为空 → 自动跳过该层；.env 里写相对路径即可）
└── node_modules/         # 本地实体安装（非软链）
```

---

## 23 个模板

| 组 | 模板 | 什么时候用 |
| --- | --- | --- |
| **① 开场与叙事** | `rve-hook` `rve-aurora` `rve-particles` `rve-chapter` `rve-statement` | 定调、抛结论、章节切分 |
| **② 图文与清单** | `rve-media` `rve-list` | 有图配图，有多项配清单 |
| **③ 数据可视** | `rve-stat` `rve-counter` `rve-metrics` `rve-gauge` `rve-liquid` `rve-rings` `rve-line` `rve-bars` `rve-column` `rve-dual` | 一个数 / 多个数 / 趋势 / 对比 |
| **④ 观点与消息** | `rve-quote` `rve-notify` | 引用他人的话；多条消息并置 |
| **⑤ 叠加层** | `rve-lower-third` `rve-follow` `rve-prism` | 叠在别的镜头上（`overlays`），不单独成镜 |
| **⑥ 收尾** | `rve-outro` | 片尾 |

**槽位名以 [templates/CATALOG.md](templates/CATALOG.md) 为准。** 每个模板的 `data-composition-variables` 就是一份可直接照抄的示例值。

**三道闸**（`src/render/style-preflight.ts`，跑在渲染之前）：

1. 相邻两镜**不能**用同一个模板 → 直接报错
2. 同一个 body 模板全片**最多 3 次** → 超了警告
3. 叠加层模板塞进 `templateId` → 直接报错（它会渲染出几乎透明的画面）
4. 槽位名写错（如给 `rve-hook` 传 `line1`）→ 警告。**不写这一条会静默失败**：模板回落到默认文案，画面看着正常，字是错的

---

## 两种画幅

| 画幅 | 文件 | 画布 |
| --- | --- | --- |
| 9:16（默认） | `compositions/portrait.html` | 1080×1920 |
| 16:9 | `index.html` | 1920×1080 |

顶层写 `"aspect": "16:9"` 即可。**横版不是缩放**：`rve-gauge` / `rve-liquid` 是左文案 + 右图形，`rve-chapter` / `rve-particles` 字号按画布宽度重算，叠加层贴边位置也不同。

`"1:1"` 没有方形版式，会回退 16:9 并警告。

---

## 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 渲染出方块 / 豆腐块 | 用了 GB2312 外的生僻字 | 重新子集化字体，或在文案里换字 |
| 某镜文字是默认值 | 槽位名拼错（判断见上面的第 4 道闸） | 对照 CATALOG 改键名 |
| 画面忽明忽暗 | 各镜原生亮度差大 | 流水线自动做 gamma 归一化；要关掉写 `"postprocess": { "normalizeBrightness": false }` |
| `ECONNREFUSED 127.0.0.1:8124` | TTS 没起 | `bash scripts/start-tts-zh.sh` |
| 改了文案但配音没变 | 复用了旧 mp3 | 删 `voice/scene-*.mp3`（同目录的 `.wav` 是派生缓存，会自动重建） |
| 改了模板但画面没变 | 复用了旧 mp4 | 删 `clips/scene-*.mp4` |
| 叠加层导出是黑的 | 叠加层是透明背景 | 必须经 `overlays` 合成，不能单独成片 |
| 换了目录跑就找不到音效/配置 | `.env` 与相对路径都锚定技能根目录 | 已处理：`SFX_DIR=./assets/sfx` 从任何 CWD 启动都指向技能自身；`.env` 也按技能根加载 |
| 字体/网络相关的怪问题 | 不该有网络依赖 | 日志里**不应**出现 `Fetched N font face(s)`；出现说明有模板退回了 Google Fonts |

---

## 开发

```bash
npm run typecheck     # tsc --noEmit
npm test              # vitest（27 项）
npm run pipeline -- <script.json>
npm run sfx:download  # 补音效到 assets/sfx（需联网）
```

渲染用 `hyperframes@0.6.94`，优先用 `~/.npm/_npx` 里已缓存的二进制，找不到才 `npx` 下载。指定别的二进制：`HYPERFRAMES_BIN=/path/to/hyperframes`。

**新增模板的三条硬规则**：文案必须槽位化、动画必须是 CSS keyframes（rAF / SMIL 在逐帧渲染下会冻结）、色板只能从 `tokens.json` 取。加完在 `CATALOG.md` 补一节。

---

## 出处与许可

- 17 个模板改编自 reactvideoeditor.com 的 HyperFrames blocks（MIT），各目录 `NOTICE.md` 有出处；汇总见 `templates/LICENSE-rve-mit.txt`。
- 5 个模板（hook / statement / stat / list / outro）源自同一套中文 pack 的模板，已按 RVE token 重制。
- `rve-media` 与其余为本包原创。
- 字体为 Noto Sans SC 子集（SIL OFL）。

---

## 现状

本技能已完全独立：自带模板、自带依赖、自带 TTS 启动脚本、自带音效目录，不再依赖任何其他技能。曾与之并列的 `create-template-video`（越南语）与 `create-template-video-zh`（中文 poster 风格）已从本机移除，它们的模板只留在这两个包的历史备份里。
