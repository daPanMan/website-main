#!/bin/bash

# Dynamic localrun: server stays running, press m/d to switch browser mode, q to quit

PORT=8000
EDGE_PATH="/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
MOBILE_UA="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
SERVER_PID=""

function start_server() {
    # Kill existing server if running
    if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
        return  # already running
    fi
    python3 -c "
import http.server
# Use ThreadingHTTPServer when available so large asset downloads (e.g. Unity)
# don't block other requests. The simple one-threaded HTTPServer will serve
# one request at a time, which can make the server appear unresponsive if a
# huge file is being transferred.
ServerClass = getattr(http.server, 'ThreadingHTTPServer', http.server.HTTPServer)

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

ServerClass(('', $PORT), NoCacheHandler).serve_forever()
" 2>/dev/null &
    SERVER_PID=$!
    sleep 1
    echo "  Server running at http://localhost:$PORT (PID $SERVER_PID)"
}

function open_desktop() {
    echo "  Opening desktop browser..."
    cmd.exe /c start "http://localhost:$PORT" 2>/dev/null &
}

function open_mobile() {
    echo "  Opening Edge in mobile emulation (iPhone 14 Pro — 393×852)..."
    "$EDGE_PATH" \
        --new-window \
        --window-size=393,852 \
        --user-agent="$MOBILE_UA" \
        --auto-open-devtools-for-tabs \
        --user-data-dir="C:\\Temp\\edge-mobile-profile" \
        "http://localhost:$PORT" 2>/dev/null &
}

function cleanup() {
    echo ""
    echo "  Shutting down server..."
    [[ -n "$SERVER_PID" ]] && kill "$SERVER_PID" 2>/dev/null
    exit 0
}

trap cleanup EXIT INT TERM

# Clean cache
rm -rf .cache dist build

clear
start_server

while true; do
    echo ""
    echo "============================================"
    echo "  Localrun — http://localhost:$PORT"
    echo "============================================"
    echo "  m  — Mobile mode (Edge iPhone emulation)"
    echo "  d  — Desktop mode (default browser)"
    echo "  q  — Quit"
    echo "============================================"

    read -n 1 -s -p "  > " mode
    echo ""

    case "$mode" in
        m) open_mobile ;;
        d) open_desktop ;;
        q) exit 0 ;;
        *) echo "  Invalid key. Press m, d, or q." ;;
    esac
done
