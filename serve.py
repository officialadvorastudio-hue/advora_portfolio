#!/usr/bin/env python3
"""
ADVORA — Local development server
Serves the /public directory on http://localhost:8080
Handles MIME types for video, images, and fonts correctly.
"""
import http.server
import os
import socketserver
import sys

PORT = 8080
SERVE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public')

class AdvoraHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SERVE_DIR, **kwargs)

    def end_headers(self):
        # Allow large video files and fonts
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Cleaner log output
        print(f"  {self.address_string()} → {format % args}")

    extensions_map = {
        '': 'application/octet-stream',
        '.html': 'text/html; charset=utf-8',
        '.css':  'text/css',
        '.js':   'application/javascript',
        '.json': 'application/json',
        '.mp4':  'video/mp4',
        '.webm': 'video/webm',
        '.png':  'image/png',
        '.jpg':  'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.svg':  'image/svg+xml',
        '.gif':  'image/gif',
        '.ico':  'image/x-icon',
        '.woff': 'font/woff',
        '.woff2':'font/woff2',
        '.ttf':  'font/ttf',
    }

if __name__ == '__main__':
    os.chdir(SERVE_DIR)
    with socketserver.TCPServer(('', PORT), AdvoraHandler) as httpd:
        httpd.allow_reuse_address = True
        print(f'\n  ╔══════════════════════════════════════════╗')
        print(f'  ║   ADVORA Development Server              ║')
        print(f'  ║   http://localhost:{PORT}                 ║')
        print(f'  ║   Serving: {SERVE_DIR[:35]}... ║')
        print(f'  ╚══════════════════════════════════════════╝\n')
        print(f'  Press Ctrl+C to stop.\n')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\n  Server stopped.')
            sys.exit(0)
