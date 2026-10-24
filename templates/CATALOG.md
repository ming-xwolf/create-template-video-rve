# Template Catalog — RVE pack (`renderer: "hyperframes"`)

每个 scene 在 `script.json` 里写一个 `templateId`，再把 `inputs` 按下面的槽位填满。
模板拥有全部视觉设计，**你只写文字**。风格统一由 `tokens.json` + 共享底衬保证：
不要在一份稿子里换 pack，也不要手改模板里的颜色。

设计语言（详见 `tokens.json`）：深海军蓝 `#04060f` 底 + 蓝青发光 `#38bdf8` +
紫色情绪点 `#9d7bff` + 本地 Noto Sans SC 子集（零网络依赖）+ 胶片颗粒。

> 全部 28 个模板的样例值可直接预览，也可照抄进
> `script.json` 改。**渲染时务必显式传 `inputs`**：不传参时文字会是空的。
> 每个模板都有 9:16（`compositions/portrait.html`）与 16:9（`index.html`）两版。

---

## 目录

**① 开场与叙事（6）**  `rve-hook` · `rve-titleintro` · `rve-aurora` · `rve-particles` · `rve-chapter` · `rve-statement`
**② 图文与清单（4）**  `rve-media` · `rve-zoompulse` · `rve-steps` · `rve-list`
**③ 数据可视（10）**  `rve-stat` · `rve-counter` · `rve-metrics` · `rve-gauge` · `rve-liquid` · `rve-rings` · `rve-line` · `rve-bars` · `rve-column` · `rve-dual`
**④ 观点与消息（3）**  `rve-quote` · `rve-quotecard` · `rve-notify`
**⑤ 叠加层（3）**  `rve-lower-third` · `rve-follow` · `rve-prism`
**⑥ 收尾（2）**  `rve-outro` · `rve-endcard`
**画幅**  [9:16 与 16:9](#两种画幅)

**速查**  [按内容性质选模板](#速查按内容性质选模板)

**⑦ 附录**  `场景转场` · `字体约定` · `block 改编说明` · `选模板的节奏` · `新增模板`


---

## 两种画幅

每个模板目录下两份独立排版，**不是缩放关系**：

| 画幅 | 文件 | 画布 | 布局差异 |
| --- | --- | --- | --- |
| 9:16 | `compositions/portrait.html` | 1080×1920 | 竖向堆叠 |
| 16:9 | `index.html` | 1920×1080 | 多数为横向铺开；`gauge` / `liquid` 是左文右图 |

`script.json` 顶层 `"aspect"` 决定用哪份。`"1:1"` 没有专门版式，会回退 16:9 并报警告。

横版下这几条的实际排布：

| 模板 | 16:9 布局 |
| --- | --- |
| `rve-gauge` | 左侧 kicker + 大号 label，右侧 640px 环 |
| `rve-liquid` | 左侧标题/说明，右侧 440×500 液柱 |
| `rve-chapter` | 标题 176px 居中，上下细线 |
| `rve-particles` | 两行 232px 大字居中 + 散点汇聚 |
| `rve-lower-third` / `rve-prism` | 左下角，距底约 90–110px |
| `rve-follow` | 右上角 |
| 其余 | 横向铺满（左右 110–170px 安全边距） |

---

## 速查：按内容性质选模板

| 段落性质 | 用谁 |
|---|---|
| 开场、定调 | `rve-hook`（默认，稳重）/ `rve-aurora`（极光，更接近站点原版） |
| 开场（纯标题、电影感） | `rve-titleintro` |
| 核心判断、转折 | `rve-statement` |
| 一个数/一个基准 | `rve-counter`（滚动计数）/ `rve-stat`（编辑体） |
| 趋势、增长曲线 | `rve-line` |
| A/B 对比、排行 | `rve-bars` |
| 完成度、占比 | `rve-gauge` |
| 两条曲线对比 | `rve-dual` |
| 多期变化 | `rve-column` |
| 专家观点、用户评价 | `rve-quote` |
| 单独一句话、名言（极简排版） | `rve-quotecard` |
| 分段、章节 | `rve-chapter` |
| 人物条（叠加在配图上） | `rve-lower-third`（overlay） |
| 关注引导（叠加） | `rve-follow`（overlay） |
| 开场大字（有粒子感） | `rve-particles`（近似） |
| 三个占比同屏 | `rve-rings` |
| 多条消息/多个声音 | `rve-notify` |
| 多个 KPI 同屏 | `rve-metrics` |
| 单一完成度（有仪式感） | `rve-liquid` |
| 正式访谈署名（叠加） | `rve-prism`（overlay） |
| 罗列、分类（并列） | `rve-list` |
| 流程、阶段、先后顺序 | `rve-steps` |
| 有图、有现场（要字幕） | `rve-media` |
| 氛围图、长镜头呼吸 | `rve-zoompulse` |
| 收尾（讲品牌） | `rve-outro` |
| 收尾（要订阅/关注 CTA） | `rve-endcard` |

硬规则（`src/render/template-pipeline.ts` 里的 preflight 会检查）：

1. 只能用在 CATALOG 里的 `templateId`；
2. **相邻两个 scene 不能用同一个模板**；
3. 同一个 body 模板全片最多出现 3 次——超了就换 `rve-statement` / `rve-list` 交替。

---

# ① 开场与叙事（6）
## rve-titleintro — 电影感标题序

**Role:** hook。标题上浮 → 渐变色条左→右生长 → 副标题延迟淡入，三段节奏。
**Best for:** 片子/系列的开场、需要"安静但有质感"的第一屏；也适合片中章节大标题。
**和谁像:** `rve-hook` 是新闻开场（标签 + 标题 + 副标题 + 按钮 + 品牌角标，信息多）；
`rve-titleintro` 只有标题 + 一条渐变线 + 副标题，居中、留白极大。

| slot       | type   | limit   | notes                                   |
| ---------- | ------ | ------- | --------------------------------------- |
| `title`    | string | ≤ 16 字 | 主标题（单行最佳，过长会自动换行）        |
| `subtitle` | string | ≤ 24 字 | 副标题，字距拉开                         |
| `note`     | string | ≤ 16 字 | 底部角标（期号/日期），留空则隐藏         |

**动效**（CSS keyframes，seek-safe）：标题 0–1.33s 上浮 50px（带 −6px 回弹）、同段淡入；
渐变线 0.67–1.67s 宽度 0→320px（竖屏 264px）；副标题 1.33–2s 淡入；角标 2s 后浮起。

**注意**：标题带 `letter-spacing`，中文长标题换行后第二行同样居中；超过 16 字建议改用
`rve-statement`。

---

## rve-hook — 开场

**Role:** hook。极光光斑 + 渐变大标题 + CTA，全片第一个镜头。
**Best for:** 开场定调；也适合片尾前的"回扣"。

| slot          | type   | limit      | notes                                   |
| ------------- | ------ | ---------- | --------------------------------------- |
| `kicker`      | string | ≤ 16 字    | 左上小标签（"AI 快讯"）                  |
| `headline`    | string | ≤ 12 字    | 主标题，渐变字；一行，不加句号           |
| `subheadline` | string | ≤ 40 字    | 一句补充                                 |
| `cta`         | string | ≤ 8 字     | 按钮文案（"继续看"）                     |
| `brand`       | string | ≤ 16 字    | 频道名                                   |
| `badge`       | string | ≤ 8 字     | 角标（"每日更新"），可留空               |
| `role`        | string | ≤ 12 字    | 右侧竖排小字（"资深工程师"），可留空      |

---
## rve-aurora — 极光标题页

改编自 `aurora-headline`（MIT）。两团极光低频漂移，文字逐字上浮。

| slot     | type   | limit        | notes                          |
| -------- | ------ | ------------ | ------------------------------ |
| `kicker` | string | ≤ 14 字      | 顶部小标签                     |
| `line1`  | string | ≤ 10 字      | 第一行（白）                   |
| `line2`  | string | ≤ 10 字      | 第二行（青紫渐变）             |

> 中文按**单字**拆分上浮，英文按空格拆词。开场用它可以替代 `rve-hook`，观感更接近站点原版。

---
## rve-particles — 粒子汇聚标题（近似实现）

改编自 `particle-wordmark`（MIT）。**这是全库唯一一个"效果有损"的模板**，先读清楚再用。

原版用 canvas 逐帧模拟粒子并**采样字形像素**作为终点，粒子精确拼成文字。这需要每帧 JS，
在 HyperFrames 的逐帧截图下冻结，纯 CSS 无法复刻。

本模板的做法：54 个散点按黄金角从外围飞向中心并淡出 + 文字逐字「模糊 → 聚焦」+ 成型闪光。
观感接近，但粒子并不落在笔画上。

| slot     | type   | limit   | notes              |
| -------- | ------ | ------- | ------------------ |
| `kicker` | string | ≤ 12 字 | 顶部标签            |
| `line1`  | string | ≤ 6 字  | 第一行              |
| `line2`  | string | ≤ 6 字  | 第二行              |

**什么时候别用**：需要"粒子精确拼出 logo/单词"的场合。那时应该用 WebGL/canvas 渲染器，
而不是这套模板。

---
## rve-chapter — 章节卡

改编自 `kinetic-title`（MIT）。大标题扫光 + 上下细线，用于分段。

| slot     | type   | limit    | notes          |
| -------- | ------ | -------- | -------------- |
| `kicker` | string | ≤ 10 字  | 小标签（"第二章"） |
| `title`  | string | ≤ 8 字   | 章节标题        |

---
## rve-statement — 强陈述 / 正文主页面

**Role:** body。多行强声明 + 一个超大数字，body 的主力页面。
**Best for:** 一个核心判断、一个转折、一条必须被记住的结论。

| slot           | type     | limit                     | notes                                  |
| -------------- | -------- | ------------------------- | -------------------------------------- |
| `kicker`       | string   | ≤ 14 字                   | 顶部小标签                              |
| `date`         | string   | ≤ 14 字                   | 右上元信息（"第 04 期"）                |
| `figure`       | string   | ≤ 4 字符                  | 巨大数字/符号（"82%"、"3/4"）           |
| `headline`     | string[] | 3 行，每行 ≤ 12 字        | 第 2 行自动用强调色                     |
| `standfirst`   | string   | ≤ 60 字                   | 斜体补充句                              |
| `footer_left`  | string   | ≤ 16 字                   | 频道名                                  |
| `footer_right` | string   | ≤ 16 字                   | 来源（域名）                            |

---

---

# ② 图文与清单（4）
## rve-media — 配图页

**Role:** body。缓慢推近的 Ken Burns + 下三分之一文案。
**Best for:** 新闻里有 `ogImage`、或段落本身有"现场感"（人物、地点、产品图）。

| slot           | type     | limit      | notes                                                        |
| -------------- | -------- | ---------- | ------------------------------------------------------------ |
| `image`        | string   | —          | 图片 URL 或**相对模板目录**的路径；留空则走纯色排版回退         |
| `kicker`       | string   | ≤ 14 字    | 顶部小标签（"现场 · 资料图"）                                  |
| `title`        | string[] | 2 行，每行 ≤ 10 字 | 第 2 行自动用强调色                                     |
| `caption`      | string   | ≤ 45 字    | 图注                                                          |
| `focus`        | string   | —          | `0%` / `50%` / `100%`，控制推近的焦点；留空用默认               |
| `footer_left`  | string   | ≤ 16 字    | 频道名                                                        |
| `footer_right` | string   | ≤ 16 字    | 来源                                                          |

> 写 `script.json` 时 `image` 直接填 http(s) URL 或本机绝对路径即可：
> 流水线会把它 vendor 进模板的 `assets/` 再以相对路径传入（HyperFrames 用
> `http://localhost:<port>` 提供页面，`file://` 图片会被跨协议拦掉），渲染完自动清理。
> 下载/读取失败会**自动回退纯色排版**，不会出空镜。

---
## rve-steps — 进度步骤（横向）

**Role:** body。横向步骤条：圆点依次点亮、连线按序生长、激活步弹一下。
**Best for:** 流程讲解、路线图、上线阶段、教程步骤（3–5 步最佳）。
**和谁像:** `rve-list` 是并列清单（无先后）；`rve-steps` 强调**先后顺序**和"走到哪一步了"。

| slot    | type     | limit   | notes                                  |
| ------- | -------- | ------- | -------------------------------------- |
| `title` | string   | ≤ 14 字 | 标题；留空则不占位                      |
| `steps` | string[] | 2–5 项  | 步骤标签，每项 ≤ 6 字                   |

**节奏**：每步 0.8s，步内先亮圆点（0–0.48s）再拉线（0.4–0.8s）；四步共 3.2s 走完。
圆点激活时 scale 0.9 → 1.13 → 落定 1.1（对应参考里的 spring 回弹）。

**注意**：步骤标签超过 6 字会换行、把整条基线压高；超过 5 步建议改用 `rve-list` 或拆成两镜。
场景时长建议 ≥ 步骤数 × 0.8s + 0.5s。

---

## rve-list — 清单

**Role:** body。2–5 条，每条 icon + 等级标签。
**Best for:** 要点罗列、"三个变化"、"两类风险"。

| slot          | type     | limit      | notes                                          |
| ------------- | -------- | ---------- | ---------------------------------------------- |
| `title`       | string   | ≤ 14 字    | 清单标题                                        |
| `subtitle`    | string   | ≤ 40 字    | 一句导语                                        |
| `accent`      | string   | 1 个词     | 标题里高亮的词（可选）                          |
| `items`       | object[] | 2–5 条     | 每条 `{icon, title, desc, tag, level}`          |

`items[]` 细则：

- `icon`：emoji，1 个（📉 ⚠️ ✅ 🔒 🚀 💡）
- `title`：≤ 10 字
- `desc`：≤ 20 字
- `tag`：≤ 4 字（"高危" / "注意" / "利好" / "稳健"）
- `level`：`danger` | `warn` | `good` | `info` → 决定 chip 颜色（语义色，别乱用）

---

---

# ③ 数据可视（10）
## rve-stat — 单点数据

**Role:** body。一个发光的大数字 + 柱状图余韵。
**Best for:** 跑分、份额、增长率、金额——任何"一个数说了算"的段落。

| slot           | type   | limit    | notes                            |
| -------------- | ------ | -------- | -------------------------------- |
| `label`        | string | ≤ 14 字  | 顶部青色眉标（"性能 · 编程"）     |
| `headline`     | string | ≤ 8 字符 | 巨大的数字（"82%"、"1M"）        |
| `subtitle`     | string | ≤ 45 字  | 数字下面的一句话解释             |
| `anchor`       | string | ≤ 4 字符 | 背后隐约的大数字，通常=数字本体   |
| `footer_left`  | string | ≤ 16 字  | 频道名                           |
| `footer_right` | string | ≤ 16 字  | 来源                             |

---
## rve-counter — 计数页

改编自 `stat-counter`（MIT）。`0 → value` 的滚动计数，1.8s 缓出后停住。

| slot     | type   | limit   | notes                                   |
| -------- | ------ | ------- | --------------------------------------- |
| `value`  | string | ≤ 7 位  | 只取数字，`12480` / `32` / `75`          |
| `suffix` | string | ≤ 3 字  | 小字号后缀，如 `%` / `万`                |
| `kicker` | string | ≤ 14 字 | 顶部小标签                               |
| `label`  | string | ≤ 30 字 | 下方说明                                 |

> 原 block 用 `requestAnimationFrame`，逐帧渲染会**完全静止**。这里改写成
> `@property --n` + CSS `@keyframes` 驱动 `counter-reset`，动画走 CSS 时间轴，
> 可被 seek。这是把 RVE block 接进确定性渲染链路的**通用做法**。

---
## rve-metrics — 指标墙

改编自 `metric-grid`（MIT）。原版数字用 `requestAnimationFrame` 逐帧写 DOM，渲染会冻结；
这里改成 `@property --n` + `counter-reset`，由 CSS 动画推进，可逐帧截取。

| slot     | type   | limit  | notes                                      |
| -------- | ------ | ------ | ------------------------------------------ |
| `items`  | array  | 2–6 条 | `{ label, value, suffix?, delta? }`         |
| `kicker` | string | ≤ 14 字 | 顶部标签                                  |
| `title`  | string | ≤ 18 字 | 标题                                      |

`delta` 以 `-` 开头时 chip 变红（下跌）。每块磁贴自带一条 sparkline，逐个延迟绘制。

---
## rve-gauge — 环形仪表

改编自 `radial-gauge`（MIT）。圆环按百分比填充，中心数字同步计数。

| slot     | type   | limit   | notes                    |
| -------- | ------ | ------- | ------------------------ |
| `value`  | string | 0–100   | 百分比                   |
| `suffix` | string | ≤ 3 字  | 默认 `%`                 |
| `kicker` | string | ≤ 14 字 | 顶部小标签               |
| `label`  | string | ≤ 26 字 | 圆环下方说明             |

---
## rve-liquid — 液位计数器

改编自 `liquid-counter`（MIT）。大号百分比 + 液面上升 + 波浪。

| slot      | type   | limit   | notes                |
| --------- | ------ | ------- | -------------------- |
| `value`   | number | 0–100   | 液位百分比            |
| `suffix`  | string | ≤ 3 字  | 默认 `%`             |
| `kicker`  | string | ≤ 14 字 | 顶部标签              |
| `title`   | string | ≤ 18 字 | 标题                 |
| `caption` | string | ≤ 30 字 | 底部说明              |

---
## rve-rings — 同心环

改编自 `activity-rings`（MIT）。三层同心环同时推进，右侧（竖版下方）配图例。

| slot     | type   | limit  | notes                        |
| -------- | ------ | ------ | ---------------------------- |
| `items`  | array  | 2–3 条 | `{ label, value }`（value 0–100） |
| `kicker` | string | ≤ 14 字 | 顶部标签                     |
| `title`  | string | ≤ 18 字 | 标题                         |

三条弧线的半径固定（92 / 70 / 48），颜色固定（青 / 紫 / 绿），按 `0.3 + 0.28i` 秒依次启动。
和 `rve-gauge` 的区别：gauge 是**一个**指标的仪式感；rings 是**三个**指标的横向比较。

---
## rve-line — 折线图

改编自 `signal-line`（MIT）。数据由 `series` 生成 SVG 路径，描边动画可用 CSS 逐帧渲染。

| slot     | type     | limit   | notes                              |
| -------- | -------- | ------- | ---------------------------------- |
| `series` | number[] | 2–12 项 | 数值数组，自动归一化                |
| `kicker` | string   | ≤ 14 字 | 顶部小标签                          |
| `title`  | string   | ≤ 18 字 | 图标题                              |
| `kpi`    | string   | ≤ 8 字  | 右侧大数字（如 `+218%`）            |

---
## rve-bars — 横向排行榜

改编自 `ranked-bars`（MIT）。条形宽度按 CSS 动画增长，数值直接显示。

| slot     | type   | limit | notes                                     |
| -------- | ------ | ----- | ----------------------------------------- |
| `items`  | array  | 2–5 条 | `{ name, value }`，按 value 自动定比例     |
| `kicker` | string | ≤ 14 字 | 顶部小标签                               |
| `title`  | string | ≤ 18 字 | 标题                                     |

> 2 条时就是最直接的 A/B 对比；**对比类内容终于有专属模板了**。

---
## rve-column — 柱状图

改编自 `bar-chart`（MIT）。柱高按最大值归一化，最高柱占画布 58%。

| slot     | type   | limit  | notes                    |
| -------- | ------ | ------ | ------------------------ |
| `items`  | array  | 2–6 条 | `{ label, value }`       |
| `kicker` | string | ≤ 14 字 | 顶部标签                |
| `title`  | string | ≤ 18 字 | 标题                    |

---
## rve-dual — 双序列面积图

改编自 `dual-area`（MIT）。两条曲线 + 半透明面积，用于"走势相反 / 两年对比"。

| slot      | type     | limit   | notes          |
| --------- | -------- | ------- | -------------- |
| `seriesA` | number[] | 2–12 项 | 主序列（青）    |
| `seriesB` | number[] | 2–12 项 | 对照序列（紫）  |
| `labelA`  | string   | ≤ 8 字  | 图例 A          |
| `labelB`  | string   | ≤ 8 字  | 图例 B          |
| `kicker`  | string   | ≤ 14 字 | 顶部标签        |
| `title`   | string   | ≤ 18 字 | 标题            |

> 面积图有个天然问题：**高的那条会盖住低的那条**（都填到基线）。所以这里把 A 画在底层、
> B 用 `mix-blend-mode: screen` 叠在上层，两条都能看见。自己改模板时别把顺序调回去。

---

---

# ④ 观点与消息（3）
## rve-quotecard — 引文卡（编辑部式）

**Role:** body。巨大引号 + 衬线引文 + 滑入署名，极简、无卡片框。
**Best for:** 一句值得单独停留的话（名人名言、用户原话、自己的一句判断）。
**和谁像:** `rve-quote` 是玻璃卡 + 聚光灯 + 星级（testimonial 味）；`rve-quotecard` 是纯排版，
没有卡片、没有头像、没有星级——适合"这句话本身就够"的场合。

| slot     | type   | limit    | notes                                  |
| -------- | ------ | -------- | -------------------------------------- |
| `quote`  | string | ≤ 42 字  | 引文正文（自动带巨大开引号）            |
| `author` | string | ≤ 12 字  | 署名                                   |
| `role`   | string | ≤ 16 字  | 身份；留空则连同分隔点一起隐藏          |
| `source` | string | ≤ 20 字  | 出处（如书名/年份）；留空则不显示        |

**动效**（CSS keyframes，seek-safe）：引号 0–0.5s 淡入 → 引文 0.33–1s 淡入 → 署名 1–1.5s
淡入并从右侧滑入 40px。6 秒内时间轴走完，之后静止（适合做长停留）。

**字体**：引文与引号用衬线（`Georgia → Songti SC → Noto Serif SC → serif`），中文衬线走系统字体，
**未内嵌**（Apple 的 Songti 不可再分发）。英文/数字由 Georgia 承担。

---

## rve-quote — 评论卡


改编自 `spotlight-testimonial`（MIT）。玻璃卡片 + 聚光灯 + 星级。

| slot     | type   | limit   | notes                    |
| -------- | ------ | ------- | ------------------------ |
| `quote`  | string | ≤ 40 字 | 引文（自动带引号装饰）    |
| `author` | string | ≤ 10 字 | 姓名（头像取首字）        |
| `role`   | string | ≤ 14 字 | 身份                     |
| `stars`  | string | 0–5     | 星级数量                 |

---
## rve-notify — 消息堆叠

改编自 `notification-stack`（MIT）。原版用 rAF + 弹簧积分（`STIFF`/`DAMP`）逐帧模拟卡片落位，
渲染会冻结；这里改成**槽位变量化的 CSS 动画**：`--slot` 决定 `translateY`，单一
`enter` / `leave` 关键帧适配任意张数，保留"逐条落位 → 整体退场"的节奏，但去掉弹簧过冲。

| slot     | type   | limit  | notes                                             |
| -------- | ------ | ------ | ------------------------------------------------- |
| `items`  | array  | 2–5 条 | `{ icon, title, time, body, tone }`                |
| `kicker` | string | ≤ 14 字 | 顶部标签                                          |
| `title`  | string | ≤ 18 字 | 标题                                              |

`tone` 取 `info` / `good` / `warn` / `bad`，决定图标底色。最新的一条在最上面（`--slot` 倒序）。

节奏：第 i 条在 `0.35 + 0.95i` 秒落位，`5.55s` 起逐条退场。8 秒一个完整循环。

---

---

# ⑤ 叠加层（3）
## 叠加层（overlay / overlays）

任意 body 镜头都可以叠一到多个透明层：

```json
"overlays": [
  { "templateId": "rve-lower-third", "inputs": { "name": "林研究员", "role": "斯克里普斯" },
    "startSec": 0.3, "durationSec": 2.6, "fadeSec": 0.3 },
  { "templateId": "rve-follow", "inputs": { "handle": "@中文科技观察" },
    "startSec": 3.2, "durationSec": 2.4, "fadeSec": 0.35 }
]
```

| field         | default | 说明                       |
| ------------- | ------- | -------------------------- |
| `startSec`    | 0.4     | 出现时间（相对本镜开头）    |
| `durationSec` | 到本镜结束 | 停留时长                |
| `fadeSec`     | 0.3     | 淡入淡出，0 = 硬切          |

数组顺序即叠放顺序（后面的盖在前面之上）。旧写法 `"overlay": {...}` 仍然可用，等价于只有一层。

流水线会：用 `--format mov` 渲染每个 overlay（ProRes 4444，保留 alpha）→ 各自按
`trim + setpts + alpha fade` 摆到时间轴上 → 依次 `overlay` 合成 → 再参与转场拼接。

**写 overlay 模板的硬性要求**：`html` / `body` / `#root` 的 background 必须是 `transparent`，
否则 alpha 不生效，叠上去会变成一块黑底。

---
## rve-lower-third — 下三分之一（叠加层）

改编自 `lower-third`（MIT）。**透明背景**，不能单独成镜，必须用 `overlay` 叠在其他镜头上。

| slot   | type   | limit   | notes                    |
| ------ | ------ | ------- | ------------------------ |
| `name` | string | ≤ 8 字  | 人名                     |
| `role` | string | ≤ 18 字 | 身份 / 机构               |

---
## rve-follow — 关注按钮（叠加层）

改编自 `follow-pill`（MIT）。透明背景，右上角胶囊。

| slot     | type   | limit   | notes              |
| -------- | ------ | ------- | ------------------ |
| `handle` | string | ≤ 14 字 | 账号（头像取首字）  |
| `note`   | string | ≤ 8 字  | 副标题             |
| `label`  | string | ≤ 4 字  | 按钮文案，默认"关注" |

---
## rve-prism — 棱镜署名条（叠加层）

改编自 `prism-lower-third`（MIT）。透明背景，玻璃面板 + 棱镜竖条 + 名字从遮罩里推出。

| slot   | type   | limit   | notes      |
| ------ | ------ | ------- | ---------- |
| `name` | string | ≤ 10 字 | 姓名        |
| `role` | string | ≤ 20 字 | 身份 / 机构 |

和 `rve-lower-third` 的区别：那个是**胶囊**、靠左贴边；这个是大块**面板**、带遮罩揭示动画，
适合正式访谈画面。二选一，不要同片混用。

---

---

# ⑥ 收尾（2）
## rve-endcard — End Card（订阅卡）

**Role:** outro。感谢观看 + 订阅按钮 + 社交圆点 + 工作室署名，弹性入场 + 边框呼吸光。
**Best for:** 片尾要明确"下一步动作"（订阅/关注/去哪找我们）；比 `rve-outro` 更行动导向。
**和谁像:** `rve-outro` 只讲品牌（lockup + tagline + URL）；`rve-endcard` 多了 CTA 按钮和 4 个社交圆点，
适合平台投放或系列片（每期同一张卡）。

| slot          | type     | limit    | notes                                       |
| ------------- | -------- | -------- | ------------------------------------------- |
| `headline`    | string   | ≤ 10 字  | 主标题（默认"感谢观看"）                     |
| `cta`         | string   | ≤ 12 字  | 按钮文案（默认"订阅 · 不迷路"），渐变底       |
| `socials`     | string[] | 0–4 项   | 社交标签，圆点里显示**首字**（"官网"/"B站"）  |
| `studio`      | string   | ≤ 20 字  | 底部署名（字距拉开，默认频道名）              |
| `corner_left` | string   | ≤ 8 字   | 左下角小字，可留空                           |
| `corner_right`| string   | ≤ 8 字   | 右下角小字，可留空                           |

**动效**（全部 CSS keyframes，seek-safe）：卡片 0.8→1 过冲弹性入场、边框与光晕 1.3s 呼吸、
按钮 0.67s 后浮起、社交圆点 1s 后浮起、署名 1.25s 后浮起。动作在 2 秒内全部完成，之后只剩呼吸光。

**注意**：和所有 scene 一样需要一行 `voiceText`（流水线按配音长度定时长）。想要"纯静置结尾"，
把 `voiceText` 写成一句短收尾即可（如"感谢观看，下期见。"）。

---

## rve-outro — 收尾

**Role:** outro。品牌 lockup + tagline + URL，全片最后一镜。

| slot          | type   | limit   | notes                              |
| ------------- | ------ | ------- | ---------------------------------- |
| `brand_name`  | string | ≤ 16 字 | 频道/品牌名（大、带流光）           |
| `tagline`     | string | ≤ 40 字 | 一句话主张                          |
| `primary_url` | string | ≤ 40 字符 | 页脚 URL 或来源                   |
| `follow`      | string | ≤ 8 字  | "关注我们"，可留空                  |
| `end`         | string | ≤ 8 字  | 结束语（"下期见"），可留空          |
| `role`        | string | ≤ 12 字 | 竖排小字，可留空                    |

---

---

# ⑦ 附录

## 场景转场（全局，不是模板）

`script.json` 顶层：

```json
{ "transition": { "type": "fade", "durationSec": 0.4 } }
```

- `type`：ffmpeg `xfade` 的转场名，常用 `fade` / `dissolve` / `wipeleft` /
  `slideleft` / `circleopen` / `pixelize`。
- `durationSec`：0–1.5；设 `0` 就是硬切。
- 视觉长度会自动补足这段时间，**配音与画面不会错位**；若超过最短场景的一半会
  自动收紧并打 WARN。

---
## 字体约定

模板自带 `assets/fonts/NotoSansSC-subset.woff2`（GB2312 全集，1.8MB，字重 100–900），
HTML 顶部 `@font-face` 本地引用，**不连 Google Fonts**。

```css
font-family: 'Noto Sans SC', sans-serif;
```

不要写 `Inter`、`PingFang SC`，也不要加 `<link href="fonts.googleapis.com">`——
多家族混排时 HyperFrames 只会注入抓得到的那个，其余静默用系统字体。
## 从 RVE block 改编的模板

本 pack 里 **22 个模板**改编自
[reactvideoeditor/hyperframes-templates](https://github.com/reactvideoeditor/hyperframes-templates)（MIT）：
`rve-aurora` `rve-counter` `rve-line` `rve-gauge` `rve-bars` `rve-dual` `rve-column` `rve-quote`
`rve-chapter` `rve-lower-third` `rve-follow` `rve-metrics` `rve-liquid` `rve-prism` `rve-notify`
`rve-rings` `rve-particles` `rve-endcard` `rve-quotecard` `rve-titleintro` `rve-zoompulse` `rve-steps`。

改动只有三类：**槽位化**、**色板对齐 tokens**、**动画改写成可逐帧**（CSS keyframes /
`@property` 计数器）。每个目录的 `NOTICE.md` 记录个别差异；`rve-particles` 是唯一的近似实现。
授权原文见 `LICENSE-rve-mit.txt`。

接新 block 前必须确认动画驱动方式：

| 驱动 | 能否逐帧 | 处理 |
|---|---|---|
| CSS `@keyframes` | ✅ | 直接包 `#root` 即可 |
| `requestAnimationFrame` / `performance.now()` | ❌ 会冻结 | 必须改写成 CSS 动画或计数器 |
| 数字滚动（rAF 写 `textContent`） | ❌ 会冻结 | 用 `@property --n` + `counter-reset` + `counter()`（见 `rve-metrics`） |
| SVG SMIL（`<animate>` / `animateMotion`） | ❌ 会冻结 | 改用 CSS `stroke-dashoffset` / `offset-path` |

19 个 block 里 **8 个是 rAF**（stat-counter、liquid-counter、radial-gauge、ranked-bars、
activity-rings、metric-grid、notification-stack、particle-wordmark），恰好也是最吸引人的几个。

---
## 新增模板

1. 复制一个现有 `rve-*` 目录改名；
2. 保留 `#root` 上的 `data-composition-*` 属性与 `data-composition-variables`；
3. 颜色只从 `tokens.json` 的 palette / semantic 里取，**不要引入新色相**；
4. 动画用 CSS `@keyframes`（不要 `requestAnimationFrame`，逐帧渲染会漂）；
5. 同时提供 `index.html`（16:9）与 `compositions/portrait.html`（9:16）；
6. 写 `NOTICE.md`，然后在本文件补一节。
