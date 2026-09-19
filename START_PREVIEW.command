#!/bin/zsh
set -u

SCRIPT_DIR="${0:A:h}"
cd "$SCRIPT_DIR" || exit 1

PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')
URL="http://127.0.0.1:${PORT}/dashboard.html"

echo "正在启动求职buddy测试版…"
echo "测试数据与 Chrome 已安装扩展相互独立。"
echo "关闭此窗口即可停止测试版。"

python3 preview_server.py --port "$PORT" >/tmp/chris-interview-preview.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT INT TERM

sleep 1
open "$URL"

echo ""
echo "测试版已打开：$URL"
echo "测试完成后按回车关闭。"
read -r
