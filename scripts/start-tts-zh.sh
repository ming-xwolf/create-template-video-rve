#!/usr/bin/env bash
# 启动中文音色的 OmniVoice TTS（端口 8124），与越南语版（8123）并存。
# 用法：bash scripts/start-tts-zh.sh
set -euo pipefail

OV="/Users/ming/Documents/dsh_workspace/omnivoice"
PORT="${OMNIVOICE_PORT:-8124}"
LOG="${TMPDIR:-/tmp}/omnivoice-zh.log"
HEALTH="http://127.0.0.1:$PORT/health"

if ! [ -x "$OV/.venv/bin/python" ]; then
  echo "找不到 $OV/.venv/bin/python —— 中文 TTS 环境没装好，先看 $OV/SETUP.md" >&2
  exit 1
fi
if ! [ -f "$OV/voice-zh.pt" ]; then
  echo "找不到中文音色 $OV/voice-zh.pt（先跑 build_voice_zh.py）" >&2
  exit 1
fi

if curl -sf -m 2 "$HEALTH" >/dev/null 2>&1; then
  echo "TTS 已在 $HEALTH 运行（复用现有进程）"
  exit 0
fi

cd "$OV"
export OMNIVOICE_MODEL="${OMNIVOICE_MODEL:-$OV/model}"
export OMNIVOICE_PORT="$PORT"
export OMNIVOICE_LANG=zh
export OMNIVOICE_PROMPT="$OV/voice-zh.pt"
export OMNIVOICE_DEVICE="${OMNIVOICE_DEVICE:-mps}"
export OMNIVOICE_DTYPE="${OMNIVOICE_DTYPE:-float16}"
export OMNIVOICE_STEPS="${OMNIVOICE_STEPS:-32}"
export no_proxy="localhost,127.0.0.1,::1"
export NO_PROXY="localhost,127.0.0.1,::1"

nohup .venv/bin/python serve_tts.py >"$LOG" 2>&1 &
PID=$!
echo "启动中（pid ${PID}，端口 ${PORT}，日志 ${LOG}）..."

for _ in $(seq 1 60); do
  if curl -sf -m 1 "$HEALTH" >/dev/null 2>&1; then
    echo "就绪：${HEALTH}（language=zh, prompt=voice-zh.pt）"
    exit 0
  fi
  sleep 0.5
done

echo "启动超时，最近日志：" >&2
tail -n 20 "$LOG" >&2
exit 1
