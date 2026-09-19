#!/usr/bin/env python3
"""Local preview server with a temporary same-Wi-Fi image relay."""

from __future__ import annotations

import argparse
import atexit
import json
import mimetypes
import secrets
import shutil
import socket
import tempfile
import time
from email.parser import BytesParser
from email.policy import default
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, quote, urlparse


ROOT = Path(__file__).resolve().parent
UPLOAD_DIR = Path(tempfile.mkdtemp(prefix="chris-career-upload-"))
TOKEN = secrets.token_urlsafe(18)
LATEST: dict[str, str] = {}
MAX_UPLOAD = 15 * 1024 * 1024
atexit.register(lambda: shutil.rmtree(UPLOAD_DIR, ignore_errors=True))


def local_ip() -> str:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]
    except OSError:
        try:
            return socket.gethostbyname(socket.gethostname())
        except OSError:
            return "127.0.0.1"
    finally:
        sock.close()


def upload_page(action: str) -> bytes:
    return f"""<!doctype html>
<html lang=\"zh-CN\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>上传 JD 截图</title>
<style>:root{{color-scheme:dark}}*{{box-sizing:border-box}}body{{margin:0;min-height:100dvh;background:#080a0f;color:#f8fafc;font:16px/1.6 system-ui,-apple-system,sans-serif;display:grid;place-items:center;padding:24px}}main{{width:min(100%,460px);background:#111721;border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:24px}}h1{{font-size:28px;margin:0 0 8px}}p{{color:#a8b4c7}}label{{display:block;border:1px dashed #64748b;border-radius:16px;padding:28px 18px;text-align:center;margin:22px 0}}input{{width:100%;margin-top:14px}}button{{width:100%;min-height:50px;border:0;border-radius:12px;background:#d4af37;color:#111827;font:inherit;font-weight:700}}small{{display:block;margin-top:15px;color:#8391a7}}</style></head>
<body><main><h1>上传 JD 截图</h1><p>选择一张清晰截图。图片只会临时传到同一 Wi-Fi 下的这台电脑，预览关闭后即失效。</p><form method=\"post\" action=\"{action}\" enctype=\"multipart/form-data\"><label>选择截图<input name=\"image\" type=\"file\" accept=\"image/*\" required></label><button>发送到电脑</button></form><small>请保持电脑上的扫码窗口开启。</small></main></body></html>""".encode("utf-8")


class Handler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def send_bytes(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, payload: dict, status: int = 200) -> None:
        self.send_bytes(status, json.dumps(payload, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def token_ok(self, query: str) -> bool:
        return parse_qs(query).get("token", [""])[0] == TOKEN

    def local_browser(self) -> bool:
        return self.client_address[0] in {"127.0.0.1", "::1"}

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/pair-info":
            if not self.local_browser():
                self.send_error(403)
                return
            host = local_ip()
            upload_url = f"http://{host}:{self.server.server_port}/phone-upload?token={quote(TOKEN)}"
            self.send_json({"upload_url": upload_url, "latest_id": LATEST.get("id", "")})
            return
        if parsed.path == "/api/latest-upload":
            if not self.local_browser():
                self.send_error(403)
                return
            self.send_json(LATEST)
            return
        if parsed.path == "/phone-upload":
            if not self.token_ok(parsed.query):
                self.send_bytes(403, "链接已失效。".encode("utf-8"), "text/plain; charset=utf-8")
                return
            action = f"/api/upload?token={quote(TOKEN)}"
            self.send_bytes(200, upload_page(action), "text/html; charset=utf-8")
            return
        if parsed.path.startswith("/uploads/"):
            if not self.local_browser():
                self.send_error(403)
                return
            file_id = Path(parsed.path).name
            target = UPLOAD_DIR / file_id
            if not target.is_file():
                self.send_error(404)
                return
            self.send_bytes(200, target.read_bytes(), mimetypes.guess_type(target.name)[0] or "application/octet-stream")
            return
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/upload" or not self.token_ok(parsed.query):
            self.send_error(403)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        content_type = self.headers.get("Content-Type", "")
        if not 0 < length <= MAX_UPLOAD or "multipart/form-data" not in content_type:
            self.send_bytes(400, "请选择 15MB 以内的图片。".encode("utf-8"), "text/plain; charset=utf-8")
            return
        raw = self.rfile.read(length)
        message = BytesParser(policy=default).parsebytes((f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n").encode() + raw)
        part = next((item for item in message.iter_parts() if item.get_param("name", header="content-disposition") == "image"), None)
        payload = part.get_payload(decode=True) if part else b""
        mime = part.get_content_type() if part else ""
        if not payload or not mime.startswith("image/"):
            self.send_bytes(400, "无法识别这张图片。".encode("utf-8"), "text/plain; charset=utf-8")
            return
        extension = mimetypes.guess_extension(mime) or ".jpg"
        upload_id = f"{int(time.time() * 1000)}-{secrets.token_hex(4)}{extension}"
        (UPLOAD_DIR / upload_id).write_bytes(payload)
        LATEST.clear()
        LATEST.update({"id": upload_id, "name": part.get_filename() or upload_id, "file_url": f"/uploads/{upload_id}"})
        body = """<!doctype html><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><style>:root{color-scheme:dark}body{margin:0;min-height:100dvh;background:#080a0f;color:#f8fafc;font:18px/1.6 system-ui;display:grid;place-items:center;text-align:center;padding:24px}b{font-size:30px;color:#34d399}</style><div><b>上传成功</b><p>电脑正在识别图片，可以关闭此页面。</p></div>""".encode("utf-8")
        self.send_bytes(200, body, "text/html; charset=utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, required=True)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("0.0.0.0", args.port), Handler)
    print(f"Preview: http://127.0.0.1:{args.port}/dashboard.html", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
