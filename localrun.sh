#!/bin/bash

# Generic cache cleanup
echo "Cleaning up cache..."
rm -rf .cache dist build
echo "Cache cleaned."

# Open default browser after a short delay to let the server start
(sleep 2 && cmd.exe /c start http://localhost:8000 2>/dev/null) &

# Start Python HTTP server with caching disabled
python3 -c "
import http.server, functools

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

http.server.HTTPServer(('', 8000), NoCacheHandler).serve_forever()
" 2>/dev/null || python -c "
import http.server

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

http.server.HTTPServer(('', 8000), NoCacheHandler).serve_forever()
"
