#!/bin/bash

# Integrated localrun: press 'm' for mobile mode, 'd' for desktop mode

PORT=8000
EDGE_PATH="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
MOBILE_UA="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"

function start_server() {
    python3 -c "
import http.server, functools
class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
http.server.HTTPServer(('', $PORT), NoCacheHandler).serve_forever()
" 2>/dev/null || python -c "
import http.server
class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
http.server.HTTPServer(('', $PORT), NoCacheHandler).serve_forever()
"
}

clear
cat <<EOF
============================================
 Localrun
============================================
Press:
  m  — Mobile mode (Edge iPhone emulation)
  d  — Desktop mode (default browser)
============================================
EOF

read -n 1 -p "Select mode [m/d]: " mode

# Clean cache
rm -rf .cache dist build

echo ""
echo "Server running at: http://localhost:$PORT"
echo ""

if [[ "$mode" == "m" ]]; then
    echo "Launching Edge in mobile emulation mode..."
    (sleep 2 && "$EDGE_PATH" \
        --new-window \
        --window-size=393,852 \
        --user-agent="$MOBILE_UA" \
        --auto-open-devtools-for-tabs \
        --user-data-dir="C:\\Temp\\edge-mobile-profile" \
        "http://localhost:$PORT" 2>/dev/null) &
    start_server
elif [[ "$mode" == "d" ]]; then
    (sleep 2 && cmd.exe /c start http://localhost:$PORT 2>/dev/null) &
    start_server
else
    echo "Aborted."
    exit 1
fi
