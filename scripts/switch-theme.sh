#!/usr/bin/env sh
set -eu

case "${1:-}" in
  local|l)
    spec='file:../starlight-theme-terminal/packages/starlight-theme-terminal'
    ;;
  npm|n)
    spec='1.3.0'
    ;;
  *)
    printf 'Usage: %s {local|l|npm|n}\n' "$0" >&2
    exit 2
    ;;
esac

pnpm pkg set "dependencies['starlight-theme-terminal']=$spec"
pnpm install
printf 'Using starlight-theme-terminal: %s\n' "$spec"
