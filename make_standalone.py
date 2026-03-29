"""
BharatAlpha AI - Standalone HTML Builder
Creates a single self-contained HTML file with all JS and CSS inlined.
The resulting file works by just double-clicking — no server needed.

Run: python make_standalone.py
Output: bharatalpha_standalone.html (on your Desktop)
"""

import os
import re

BASE = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(BASE, "frontend", "dist")
HTML_IN = os.path.join(DIST, "index.html")
OUT = os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop", "bharatalpha_standalone.html")

def read(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def main():
    print("\n=== BharatAlpha Standalone Builder ===\n")

    if not os.path.exists(HTML_IN):
        print(f"ERROR: dist/index.html not found at {DIST}")
        print("Please run 'npm run build' in the frontend folder first.")
        input("Press Enter...")
        return

    html = read(HTML_IN)

    # Find and inline CSS
    css_matches = re.findall(r'<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\']([^"\']+)["\'][^>]*/?>', html)
    for href in css_matches:
        if href.startswith("http"):
            continue  # keep CDN links
        css_path = os.path.join(DIST, href.lstrip("./"))
        if os.path.exists(css_path):
            css = read(css_path)
            tag = re.search(r'<link[^>]+' + re.escape(href) + r'[^>]*/?>', html).group(0)
            html = html.replace(tag, f"<style>{css}</style>")
            print(f"  ✅ Inlined CSS: {os.path.basename(css_path)} ({len(css)//1024}KB)")

    # Find and inline JS
    js_matches = re.findall(r'<script[^>]+src=["\']([^"\']+)["\'][^>]*>', html)
    for src in js_matches:
        if src.startswith("http"):
            continue  # keep CDN links
        js_path = os.path.join(DIST, src.lstrip("./"))
        if os.path.exists(js_path):
            js = read(js_path)
            # Remove crossorigin and type=module for file:// compatibility
            tag = re.search(r'<script[^>]+' + re.escape(src) + r'[^>]*></script>', html)
            if not tag:
                tag = re.search(r'<script[^>]+' + re.escape(src) + r'[^>]*>', html)
            if tag:
                html = html.replace(tag.group(0), f"<script>{js}</script>")
            print(f"  ✅ Inlined JS: {os.path.basename(js_path)} ({len(js)//1024}KB)")

    # Write output
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(html)

    size_kb = os.path.getsize(OUT) // 1024
    print(f"\n✅ Done! Created: {OUT}")
    print(f"   Size: {size_kb} KB")
    print(f"\n👉 Double-click 'bharatalpha_standalone.html' on your Desktop to open!")
    print(f"   Note: API data needs backend running (python backend/main.py)")
    print(f"         UI will fully load even without backend.\n")

if __name__ == "__main__":
    main()
    input("Press Enter to close...")
