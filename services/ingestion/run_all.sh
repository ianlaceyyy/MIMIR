#!/usr/bin/env bash
# Detached pipeline finisher: wait for the FEC bulk to finish, then run Census
# (district demographics) and Congress (sponsored bills) across all districts.
# Idempotent; safe to re-run. Logs to run_all.log.
set -u
cd "$(dirname "$0")"
LOG="run_all.log"
PY=".venv/bin/python"

echo "=== finisher started $(date) ===" >> "$LOG"

# 1) Wait for any in-flight FEC bulk to complete.
while pgrep -f "pipelines.run --source fec" >/dev/null; do sleep 15; done
echo "FEC done, starting Census $(date)" >> "$LOG"

# 2) Census demographics for every district that now exists.
$PY -u -m mimir_ingest.pipelines.run --source census --cycle 2026 >> "$LOG" 2>&1
echo "Census exit=$? $(date)" >> "$LOG"

# 3) Congress sponsored bills for incumbents.
$PY -u -m mimir_ingest.pipelines.run --source congress --cycle 2026 >> "$LOG" 2>&1
echo "Congress exit=$? $(date)" >> "$LOG"

echo "=== finisher done $(date) ===" >> "$LOG"
