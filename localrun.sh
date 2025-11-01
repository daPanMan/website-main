#!/bin/bash

# Generic cache cleanup
echo "Cleaning up cache..."
rm -rf .cache dist build
echo "Cache cleaned."

# Start Edge browser with local URL
start microsoft-edge:http://localhost:8000 &

# Start Python HTTP server
python -m http.server 8000
