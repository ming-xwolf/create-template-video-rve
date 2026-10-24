---
name: create-template-video-rve
description: 用 HyperFrames 专业模板（RVE 风格：深海军蓝底 + 蓝青发光 + 紫色情绪点 + 胶片颗粒）把**中文**新闻/口播内容做成竖屏（9:16）或横屏（16:9）短视频——输入一篇新闻 URL 或 .txt 文本，先写 script.json（1 个 hook + 6–10 个 body + 1 个 outro，只填模板的文字槽位），再跑内置流水线完成中文 TTS、配音对齐、渲染与合成。输出 video.mp4 + voice.mp3 + script.txt（给剪映/CapCut）。触发词：RVE 风格短视频、深蓝新闻短视频、rve 模板视频、中文模板视频、竖屏新闻视频、short news RVE、/create-template-video-rve。
whenToUse: 用户提供中文新闻/文章/口播稿（URL 或文本）要做成竖屏/横屏短视频，且明确想要 RVE 视觉语言（深海军蓝 + 蓝青发光 + 紫色情绪点）或点名 rve 模板时使用。需要真人出镜、剪辑既有素材 → 不适用。
---

# Create Template Video · RVE（中文版）

把一条中文内容做成竖屏（9:16）或横屏（16:9）短视频，视觉语言固定为 **RVE**：
深海军蓝底 + 蓝青发光 + 紫色情绪点 + 本地 Noto Sans SC 子集 + 胶片颗粒。
设计/动效全部由 `templates/` 里的模板负责，**你只负责写文字槽位和 `script.json`**。

> 安装、目录结构、模板一览、排错表见 [README.md](README.md)（给人看的入口）。
> 本文件是执行手册：工作流、选型规则、文案与 TTS 约束。

## 本机安装信息（DSH 环境，务必先读）

- **PROJECT_DIR** = `/Users/ming/.agents/skills/create-template-video-rve`
  （skill 本体 + 流水线 + 模板 + 依赖，**完全自包含**：`node_modules` 是本目录内的实体，
  不链接、不依赖任何其他技能）
- 目录结构：`SKILL.md`、`templates/`（23 个模板 + `CATALOG.md` + `tokens.json` + `LICENSE-rve-mit.txt`）、
  `src/`（CLI/流水线）、`package.json`、`.env`（中文 TTS 端点）。
- 工具映射：`WebFetch` → `web_fetch`，`Read` → `read`，`Write` → `write`，`Bash` → `bash`。
- 环境依赖：`ffmpeg`/`ffprobe` ✓、Chrome ✓、Node ✓。
- **中文 TTS**：OmniVoice 服务跑在 **8124** 端口（模型/音色在技能之外的
  `~/Documents/dsh_workspace/omnivoice`，启动脚本随本技能提供）：

  ```bash
  bash "$HOME/.agents/skills/create-template-video-rve/scripts/start-tts-zh.sh"
  curl -s -X POST http://127.0.0.1:8124/tts -H 'Content-Type: application/json' \
    -d '{"text":"大家好，这是中文配音测试。"}' -o /tmp/zh-probe.mp3 && ls -l /tmp/zh-probe.mp3
  ```

  `000`/连不上 = 没启动；起不来就停下告诉用户，**不要伪造音频**。
- 渲染用 `hyperframes@0.6.94`：`src/render/template-composer.ts` 会**优先用本机已缓存的
  二进制**（`~/.npm/_npx/*`），找不到才回退 `npx`。想指定别的二进制：
  `HYPERFRAMES_BIN=/path/to/hyperframes npm run pipeline -- ...`。
  每个 scene 约 6–10s；8–12 个 scene 合计 90–120s。
- 语言：**全片中文**。屏幕文案可中英混排（`AI`、`GPT`、`Apple` 保留原文），
  但 `voiceText` 必须是中文，数字按下面的规则写成汉字。

## Input

1 个参数：新闻 URL（`http://`/`https://`）或 `.txt` 文件路径。

## Workflow（严格按顺序）

### Step 1–3：取内容 + 建输出目录

- **URL** → `web_fetch` 抓正文，抽出 `title`、`content`（正文 800–2000 字）、
  `ogImage`（og:image 或 null）、`domain`。失败（付费墙/纯 JS/4xx）→ 让用户存 `.txt` 再跑。
- **`.txt`** → `read` 读取；`title` = 第一行（≤40 字），`content` = 余下正文，
  `ogImage` = `null`，`domain` = `"local"`。
- `slug`：英文或拼音关键词（≤40 字符，`[a-z0-9-]`），如 `xiaomi-17-price`；实在没有就用
  `rve-video`（代码里也有同名回退）。`timestamp` = `YYYYMMDD-HHmm`。
  **`outputDir` = `<当前工作区>/videos/<slug>-<timestamp>/`**，`mkdir -p`。
  音效库在技能自身 `assets/sfx`（`.env` 的 `SFX_DIR`，相对路径按技能根解析），**当前为空**，该层自动跳过；
  需要时跑 `npm run sfx:download` 补齐。

### Step 4：读模板目录

读 `PROJECT_DIR/templates/CATALOG.md`，确认槽位。**只能使用 CATALOG 里的 `templateId`。**
现有 23 个，按用途分六组，**选型先看组、再看 CATALOG 里的槽位表**：

| 组 | 模板 | 什么时候用 |
| --- | --- | --- |
| **① 开场与叙事**（5） | `rve-hook` `rve-aurora` `rve-particles` `rve-chapter` `rve-statement` | 定调、抛结论、章节切分 |
| **② 图文与清单**（2） | `rve-media` `rve-list` | 有图配图，有多项配清单 |
| **③ 数据可视**（10） | `rve-stat` `rve-counter` `rve-metrics` `rve-gauge` `rve-liquid` `rve-rings` `rve-line` `rve-bars` `rve-column` `rve-dual` | 一个数 / 多个数 / 趋势 / 对比 |
| **④ 观点与消息**（2） | `rve-quote` `rve-notify` | 引用他人的话；多条消息并置 |
| **⑤ 叠加层**（3） | `rve-lower-third` `rve-follow` `rve-prism` | 叠在别的镜头上（`overlays`），不单独成镜 |
| **⑥ 收尾**（1） | `rve-outro` | 片尾 |

**按内容性质挑具体模板**（"一个数"还是"两条曲线"）看 CATALOG 开头的
「速查：按内容性质选模板」表；同组内的细微差别写在各节的"和谁像"一行里——
**选之前读那一段，别只看名字**。

三个必须先知道的边界：

- `rve-particles` 是**近似实现**：粒子不落在笔画上。要"粒子精确拼字"请换渲染器。
- `rve-media` 需要真实图片；无图会回退成纯色页，且它是全片最亮的一镜，靠归一化压。
- ⑤ 的三条只能进 `overlays`，塞进 `templateId` 会被 preflight 直接报错拦下。

### 渲染约定（写 script.json 之前必须知道）

以下两条由流水线**自动执行**，你不需要写任何字段；但它们会改变"哪一镜该亮、文案该多长"的判断，
所以放在选完模板、开始写稿之前。

#### 亮度归一化（流水线自动执行）

配图镜头和图表镜头天生比纯文字镜头亮。实测同一条片子里，`rve-media` 的亮像素占比
21%，而 `rve-chapter` 只有 0.86%——直接相接就是"忽明忽暗"。

流水线在拼接前会：测每镜平均亮度（`ffmpeg signalstats` 的 YAVG）→ 取全片中位数
→ 对偏离的镜头套 `eq=gamma`（不是 `brightness`，gamma 能保住黑场不发灰）。
gamma 夹在 `0.45–1.40`，修正量小于 4% 就不动。

日志形如：

```
亮度归一化：目标 0.124（全片中位数）
s6: 亮度 0.389 → gamma 0.45
```

要关掉：script.json 根节点写 `"postprocess": { "normalizeBrightness": false }`。

**注意**：gamma 是整镜作用，会把刻意压暗的场景也一起提亮。如果某一镜的亮度是有意设计
（比如刻意的黑场过渡），宁可关掉全局归一化，也不要让它被"校正"回来。

#### 字体：本地子集，零网络依赖

HyperFrames 默认会在每次渲染时去 Google Fonts 拉 CSS，再按 unicode-range 拉 woff2。
这有两个问题：慢（fonts ready 3.6s），且**网络抖一次就会让那一镜退回系统字体**——
中文会静默换成苹方/思源黑，别人一看就知道不对。

所以模板自带字体文件：

```
templates/fonts/NotoSansSC-subset.woff2          ← 唯一实体（1.8MB）
templates/<id>/assets/fonts/NotoSansSC-subset.woff2   ← 硬链接，不重复占空间
```

字重 100–900（可变字体），覆盖 **GB2312 全字符集（6763 汉字）+ 常用标点 + 拉丁**，
共 7888 字符。每个 HTML 顶部声明：

```css
@font-face{font-family:'Noto Sans SC';src:url('assets/fonts/NotoSansSC-subset.woff2')
  format('woff2');font-weight:100 900;font-style:normal;font-display:block;}
```

字体栈只留一个家族：

```css
font-family: 'Noto Sans SC', sans-serif;
```

**不要再加 Google Fonts `<link>`，也不要写 `Inter` / `PingFang SC`。** 三个家族并存时，
HyperFrames 只会注入它抓得到的那一个，剩下的静默走系统字体，问题反而更隐蔽。

判据：渲染日志里**不应出现** `Fetched N font face(s)`；应看到
`[initSession:screenshot] fonts ready (200ms)` 这种量级。

需要更多字（生僻字、日文假名）就重新子集化：

```bash
pyftsubset NotoSansSC[wght].ttf --text-file=chars.txt --flavor=woff2 \
  --layout-features='kern,liga,locl,ccmp,mark,mkmk' --no-hinting --desubroutinize \
  --output-file=NotoSansSC-subset.woff2
```

### 画幅：9:16 与 16:9 都有原生版式

每个模板都有两份**独立排版**的 composition，不是把竖版缩放：

| 画幅 | 文件 | 画布 |
| --- | --- | --- |
| 9:16（默认） | `compositions/portrait.html` | 1080×1920 |
| 16:9 | `index.html` | 1920×1080 |

在 `script.json` 顶层写 `"aspect": "16:9"` 即可，流水线会挑对应文件渲染。
**不要**写成 `"1:1"`——没有方形版式，会静默回退到 16:9 版并给出警告。

横版不是竖版的等比放大，几个模板是**分栏**布局：

- `rve-gauge` / `rve-liquid`：竖版是居中堆叠，横版是**左文案 + 右图形**
- `rve-chapter` / `rve-particles`：字号按画布宽度重算（横版约为竖版的 1.4–1.6 倍）
- 叠加层（`lower-third` / `follow` / `prism`）：横版贴左右安全区，位置与竖版不同

选画幅只看发布渠道：抖音/视频号 → 9:16；B 站/YouTube/公众号 → 16:9。
**同一部片子不要混用**，模板的留白比例不同，混起来会显得上下不接。

### Step 5：生成 script.json

```json
{
    "version": "1.0",
    "renderer": "hyperframes",
    "aspect": "9:16",
    "metadata": {
        "title": "...",
        "source": { "url": "...", "domain": "...", "image": null },
        "channel": "中文频道名"
    },
    "voice": { "provider": "omnivoice", "speed": 1.0 },
    "scenes": [
        /* 8–12 个：1 hook + 6–10 body + 1 outro */
    ]
}
```

- 每个 scene：`{ id, type, voiceText, templateId, inputs }`；`inputs` 覆盖 CATALOG 必填槽位。
- `scenes[0].type = "hook"`（默认 `rve-hook`；想要站点风极光开场可换 `rve-aurora`）；
  `scenes[-1].type = "outro"`（用 `rve-outro`）。
- **8–12 个 scene**；`voiceText` 合计 **350–450 字**（≈90–120s，中文约 4.5 字/秒）。
  每个 body scene **30–45 字**、只讲一个点，目标每景 6–10s。

**内容 → 模板映射（这是本 pack 的核心规则）：**

| 这一段在讲什么 | 用谁 |
|---|---|
| 开场、定调 | `rve-hook`（默认）/ `rve-aurora`（站点风） |
| 一个判断 / 一个转折 / 一句必须记住的话 | `rve-statement` |
| 一个数说了算（跑分、份额、金额） | `rve-stat` |
| 罗列：三个变化、两类风险 | `rve-list` |
| 有 `ogImage`、有现场感（人物/地点/产品图） | `rve-media` |
| 收尾 CTA | `rve-outro` |

**节奏硬规则**（流水线的 `preflightStyle` 会检查，违反直接报错）：

1. 相邻两个 scene **不能**用同一个模板；
2. 同一个 body 模板全片**最多 3 次**（超了会 WARN，画面开始重复）；
3. 每 3–4 个 scene 安排一个视觉高点（`rve-stat`），不要连着三个文字页。

典型 10 scene 结构：

```
hook → media → statement → stat → statement → list → stat → media → statement → outro
```

**配图怎么填**：`rve-media` 的 `inputs.image` 直接写 http(s) URL 或本机绝对路径，
流水线会自动 vendor（HyperFrames 用 `http://localhost` 提供页面，`file://` 会被拦），
下载失败自动回退纯色排版，不会出空镜。没有 `ogImage` 的稿子就多用 `rve-stat` / `rve-statement`。

**转场**：`script.json` 顶层加 `"transition": { "type": "fade", "durationSec": 0.4 }`
（默认就是这个）。想要硬切写 `"durationSec": 0`；可用 `dissolve` / `wipeleft` /
`slideleft` / `circleopen` / `pixelize`。视觉会为转场自动补时长，配音不会错位。

**配色规则**（不改模板，只体现在文案里）：

- 数字/图表段落用默认强调色（青）。
- 情绪/观点段落用 `rve-statement`，第 2 行自动是强调色。
- `rve-list` 的 `level` 是**语义色**（danger 红 / warn 黄 / good 绿 / info 青），
  按真实含义填，不要为了好看乱选。

#### 中文排版规则（屏幕文案 `inputs`）

- 一行 **10–14 个汉字**（16:9 可放宽到 20–24 字）；`headline` 最多 3 行。
  宁可少两个字，不要挤成两行半。
- 模板字体是 `'Noto Sans SC', sans-serif`，字体文件在 `templates/fonts/`（本地 woff2，零网络）。
  若渲染出方块，说明碰到子集外的字（GB2312 之外的生僻字），需重新子集化。
- 中文不需要词间空格；不要手动加负 `letter-spacing`（标题发挤就在该类覆盖 `-1px`）。
- emoji 只出现在 `inputs`，每个字段 0–1 个；`rve-list` 的 `icon` 必填 1 个。
- 数字在屏幕上保留好看格式（`4499 元`、`82.7%`），**只有 `voiceText` 里才转汉字**。

#### 中文 TTS 规则（`voiceText` 强制遵守）

OmniVoice 逐字朗读，**阿拉伯数字、小数点、货币符号经常读错或读成英文**。

| 形式 | 错误示范 | 正确写法 |
| --- | --- | --- |
| 小数 | `82.7%` | `百分之八十二点七` |
| 版本号 | `iOS 18.2` | `iOS 十八点二` |
| 产品型号 | `小米 17` | `小米十七` |
| 像素 | `200MP` | `两百万像素` |
| 电量 | `5000mAh` | `五千毫安时` |
| 数量级 | `1M tokens` | `一百万 token` |
| 人民币 | `¥4499` | `四千四百九十九元` |
| 美元 | `$5` | `五美元` |
| 倍数 | `2x` | `两倍` |
| 百分比 | `30%` | `百分之三十` |
| 时长 | `60s` | `六十秒` |
| 比率 | `3:1` | `三比一` |
| 年份 | `2026 年` | `二零二六年` |
| 万亿 | `21 万亿` | `二十一万亿` |
| 排名 | `Top 3` | `前三名` |

- 英文缩写先探针：`AI 很强大` vs `人工智能很强大`，选听感自然的写法，全篇统一。
- 品牌名保留原文（`Apple`、`OpenAI`、`小米`）。
- **`voiceText` 禁止**：emoji、URL、`& % $ # + = /` 等符号。句末用 `。`/`？`，逗号用 `，`。
- 口语量词用"两"（两千、两倍），序数/年份用"二"（二零二六年、第二季度）。

### Step 6：自检

- `scenes[0]` 是 hook、最后一个是 outro；`templateId` 都在 CATALOG 内；
- 相邻 scene 模板不重复；body 模板出现 ≤3 次；
- 每个 `inputs` 覆盖必填槽位；中文行宽 ≤14 字；`voiceText` 无阿拉伯数字/符号/emoji；
- `voiceText` 合计 350–450 字。静默修正最多 2 轮。

### Step 7：写 script.json

用 `write` 写到 `<outputDir>/script.json`（先 `mkdir -p` 输出目录）。

### Step 8：跑流水线

先确认 TTS 探针有音频，然后前台执行：

```bash
cd "$HOME/.agents/skills/create-template-video-rve" && npm run pipeline -- "<outputDir>/script.json"
```

CLI 走：preflight（模板存在性/节奏）→ TTS → 逐模板渲染 → 按配音时长对齐 → 拼接 + 混音。
失败要明确报错并给出 outputDir（已渲染的 `voice/scene-*.mp3`、`clips/scene-*.mp4` 会被复用，
删掉即可重渲染）。改文案后重跑，**先删对应的 `voice/scene-*.mp3`**（`.wav` 是派生缓存，会自动重建）。

### Step 9：交付

```bash
mkdir -p "<cwd>/videos/<slug>" && cp "<outputDir>"/{video.mp4,voice.mp3,script.txt} "<cwd>/videos/<slug>/"
```

报告（用可点击链接）：

```markdown
✓ Video: videos/<slug>/video.mp4
✓ Audio: videos/<slug>/voice.mp3 — 给剪映（自动字幕/对口型）
✓ Script: videos/<slug>/script.txt — 分镜文本
总时长: XX.Xs
```

## 备注

- **这套模板是哪来的**：5 个 `rve-*`（hook/statement/stat/list/outro）源自同一套中文 pack 的模板
  复制而来，调色板重映射到 `templates/tokens.json`（取自
  reactvideoeditor.com 的 HyperFrames blocks），字体统一为本地 Noto Sans SC 子集，
  并注入了共享的极光底衬与胶片颗粒；`rve-media` 是本 pack 原创（配图页）。
  每个目录的 `NOTICE.md` 有出处。
- **为什么风格统一**：不是靠"从同一个站来"，而是靠三件事叠起来——
  同一套 token、同一层底衬/颗粒、以及 preflight 强制轮换模板。
  新增模板时**只从 tokens.json 取色**，否则统一性会立刻被破坏。
- 与 `-zh` 版的差异：模板集换成 RVE 5 件套、强调色收敛到青/紫、增加 preflight 节奏约束。
  本 skill 已**完全独立**：自带模板、自带依赖、自带 TTS 启动脚本、自带音效目录，
  不再依赖 `create-template-video` / `create-template-video-zh`（两者已从本机移除，
  其模板出处只保留在各模板的 `NOTICE.md` 与 `LICENSE-rve-mit.txt` 里）。
- **block 导入已完成**：reactvideoeditor.com 的 19 个原始 HyperFrames block 里，
  17 个已改写成可逐帧模板（见 CATALOG 附录「从 RVE block 改编的模板」）。
  `particle-wordmark` 因必须逐帧采样字形像素，只做了**近似实现**（`rve-particles`）。
  两个转场 block（`light-leak-wipe` / `fade-through-white`）未导入——转场由流水线的
  `xfade` 覆盖，再叠一层会打架。
  导入时的三条硬规则：文案必须槽位化、动画必须是 CSS keyframes（rAF/SMIL 会冻结）、
  色板只能从 `tokens.json` 取。
