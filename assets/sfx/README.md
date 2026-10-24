# 音效库（可选）

这里放 `category/name.mp3` 形式的音效。**目录为空时流水线自动跳过音效层，不影响主流程。**

补齐音效（需联网）：

```bash
npm run sfx:download          # 下到本目录
ls assets/sfx
```

流水线读取顺序：`.env` 的 `SFX_DIR` → 缺省指向本目录。
