"""
BharatAlpha AI - Python Server (No npm needed)
Serves frontend on http://localhost:3000
Proxies /api/* calls to backend on http://localhost:8000
Run: python serve_frontend.py
"""
import http.server
import socketserver
import os
import webbrowser
import threading
import urllib.request
import urllib.error

PORT = 3000
BACKEND = "http://localhost:8000"
DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIST_DIR, **kwargs)

    def do_GET(self):
        if self.path.startswith("/api"):
            self._proxy()
        else:
            path = self.path.split("?")[0]
            full = os.path.join(DIST_DIR, path.lstrip("/"))
            if not os.path.exists(full) or os.path.isdir(full):
                self.path = "/index.html"
            super().do_GET()

    def do_POST(self):
        if self.path.startswith("/api"):
            self._proxy()
        else:
            self.send_error(404)

    def _proxy(self):
        url = BACKEND + self.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else None
        try:
            req = urllib.request.Request(url, data=body, method=self.command)
            for h in ["Content-Type", "Authorization"]:
                if self.headers.get(h):
                    req.add_header(h, self.headers[h])
            with urllib.request.urlopen(req, timeout=30) as resp:
                self.send_response(resp.status)
                for k, v in resp.headers.items():
                    if k.lower() not in ("transfer-encoding", "connection"):
                        self.send_header(k, v)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(resp.read())
        except urllib.error.URLError:
            self.send_response(503)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"error":"Backend not running. Start backend with: cd backend && python main.py"}')

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "/api" in (args[0] if args else ""):
            print(f"  API: {args[0][:60]}")

def open_browser():
    import time
    time.sleep(1.2)
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    if not os.path.isdir(DIST_DIR):
        print(f"ERROR: dist folder not found at {DIST_DIR}")
        print("Run 'npm run build' in the frontend folder first.")
        input("Press Enter to exit...")
        exit(1)

    print(f"\n{'='*52}")
    print(f"  BharatAlpha AI - Frontend Server")
    print(f"{'='*52}")
    print(f"  Frontend : http://localhost:{PORT}")
    print(f"  Backend  : {BACKEND}  (start separately)")
    print(f"  API Proxy: /api/* → {BACKEND}/api/*")
    print(f"\n  Opening browser automatically...")
    print(f"  Press Ctrl+C to stop")
    print(f"{'='*52}\n")

    threading.Thread(target=open_browser, daemon=True).start()
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
