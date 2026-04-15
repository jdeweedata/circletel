#!/bin/bash
# Claude Code status line — derived from PS1 in /root/.bashrc
# Format: user@host:cwd  [model]  [context%]
input=$(cat)
cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "."')
model=$(echo "$input" | jq -r '.model.display_name // ""')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')

# Build PS1-style prefix: bold green user@host, reset, colon, bold blue cwd, reset
user=$(whoami)
host=$(hostname -s)
# Shorten cwd: replace $HOME with ~
home_dir="$HOME"
short_cwd="${cwd/#$home_dir/~}"

if [ -n "$used" ]; then
  ctx_part=" $(printf '%.0f' "$used")%"
else
  ctx_part=""
fi

printf "\033[01;32m%s@%s\033[00m:\033[01;34m%s\033[00m" "$user" "$host" "$short_cwd"
if [ -n "$model" ]; then
  printf "  \033[00;33m%s\033[00m" "$model"
fi
if [ -n "$ctx_part" ]; then
  printf "  \033[00;36mctx:%s\033[00m" "$ctx_part"
fi
printf "\n"
