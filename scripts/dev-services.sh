#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$ROOT_DIR/.runtime"
LOG_DIR="$RUNTIME_DIR/logs"

SERVICES=("server" "frontend" "collector")

mkdir -p "$LOG_DIR"
touch "$LOG_DIR/server.log" "$LOG_DIR/frontend.log" "$LOG_DIR/collector.log"

service_dir() {
  case "$1" in
    server) echo "$ROOT_DIR/server" ;;
    frontend) echo "$ROOT_DIR/frontend" ;;
    collector) echo "$ROOT_DIR/collector" ;;
    *)
      echo "Unknown service: $1" >&2
      exit 1
      ;;
  esac
}

pid_file() {
  echo "$RUNTIME_DIR/$1.pid"
}

log_file() {
  echo "$LOG_DIR/$1.log"
}

is_running() {
  local service="$1"
  local pid_path
  pid_path="$(pid_file "$service")"

  if [[ ! -f "$pid_path" ]]; then
    return 1
  fi

  local pid
  pid="$(cat "$pid_path")"
  if [[ -z "$pid" ]]; then
    return 1
  fi

  kill -0 "$pid" >/dev/null 2>&1
}

start_service() {
  local service="$1"
  local dir
  dir="$(service_dir "$service")"
  local pid_path
  pid_path="$(pid_file "$service")"
  local log_path
  log_path="$(log_file "$service")"

  if is_running "$service"; then
    echo "$service is already running (pid $(cat "$pid_path"))."
    return 0
  fi

  rm -f "$pid_path"

  (
    cd "$dir"
    nohup yarn dev >"$log_path" 2>&1 &
    echo $! >"$pid_path"
  )

  sleep 1

  if is_running "$service"; then
    echo "started $service (pid $(cat "$pid_path"))"
  else
    echo "failed to start $service. check $(log_file "$service")" >&2
    exit 1
  fi
}

stop_service() {
  local service="$1"
  local pid_path
  pid_path="$(pid_file "$service")"

  if ! is_running "$service"; then
    rm -f "$pid_path"
    echo "$service is not running."
    return 0
  fi

  local pid
  pid="$(cat "$pid_path")"
  kill "$pid" >/dev/null 2>&1 || true

  for _ in {1..10}; do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      break
    fi
    sleep 0.5
  done

  if kill -0 "$pid" >/dev/null 2>&1; then
    kill -9 "$pid" >/dev/null 2>&1 || true
  fi

  rm -f "$pid_path"
  echo "stopped $service"
}

status_services() {
  for service in "${SERVICES[@]}"; do
    if is_running "$service"; then
      echo "$service: running (pid $(cat "$(pid_file "$service")"))"
    else
      echo "$service: stopped"
    fi
  done
}

tail_logs() {
  local target="${1:-all}"

  if [[ "$target" == "all" ]]; then
    tail -n 50 -f \
      "$(log_file server)" \
      "$(log_file frontend)" \
      "$(log_file collector)"
    return 0
  fi

  service_dir "$target" >/dev/null
  tail -n 50 -f "$(log_file "$target")"
}

usage() {
  cat <<EOF
Usage: $(basename "$0") <start|stop|restart|logs|status> [service]

Commands:
  start           Start server, frontend, collector sequentially with 1s delay.
  stop            Stop server, frontend, collector.
  restart         Stop then start all services.
  logs [service]  Tail logs for one service or all services.
  status          Show current service status.

Services:
  server | frontend | collector
EOF
}

main() {
  local command="${1:-}"
  local service="${2:-}"

  case "$command" in
    start)
      for name in "${SERVICES[@]}"; do
        start_service "$name"
      done
      ;;
    stop)
      for (( idx=${#SERVICES[@]}-1 ; idx>=0 ; idx-- )); do
        stop_service "${SERVICES[idx]}"
      done
      ;;
    restart)
      "$0" stop
      "$0" start
      ;;
    logs)
      if [[ -n "$service" ]]; then
        tail_logs "$service"
      else
        tail_logs all
      fi
      ;;
    status)
      status_services
      ;;
    *)
      usage
      exit 1
      ;;
  esac
}

main "$@"
