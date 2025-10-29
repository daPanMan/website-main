#!/bin/bash
/mnt/c/Program\ Files\ \(x86\)/Microsoft/Edge/Application/msedge.exe http://localhost:8000
python -m http.server 8000
