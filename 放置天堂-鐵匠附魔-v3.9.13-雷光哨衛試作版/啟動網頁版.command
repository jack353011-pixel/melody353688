#!/bin/zsh
cd -- "$(dirname "$0")"
python3 -m http.server 4173 --bind 127.0.0.1 &
server_pid=$!
sleep 1
open "http://127.0.0.1:4173/"
wait "$server_pid"
