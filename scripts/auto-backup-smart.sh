#!/usr/bin/env bash
# Smart backup (Level 2): debounce — chỉ commit sau khi không còn lần gọi script nào trong IDLE_SEC giây.
#
# Cách dùng:
#   - Gắn vào watcher “on save” (VS Code / Cursor extension, entr, fswatch, …) và gọi mỗi lần lưu file.
#   - Hoặc chạy tay: ./scripts/auto-backup-smart.sh
#
# Biến môi trường:
#   GIT_SMART_BACKUP_IDLE  — số giây chờ im (mặc định 5)
#   GIT_SMART_BACKUP_PUSH — lệnh push (mặc định: git push)
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

IDLE_SEC="${GIT_SMART_BACKUP_IDLE:-5}"
PUSH_CMD="${GIT_SMART_BACKUP_PUSH:-git push}"
DEBOUNCE_FILE="${TMPDIR:-/tmp}/git-autobackup-smart.debounce"

mtime() {
  if stat -c %Y "$1" 2>/dev/null; then return 0; fi
  stat -f %m "$1" 2>/dev/null
}

touch "$DEBOUNCE_FILE"
T0="$(mtime "$DEBOUNCE_FILE")"
sleep "$IDLE_SEC"
T1="$(mtime "$DEBOUNCE_FILE")"

# Có lần gọi khác đã touch file trong lúc sleep → bạn vẫn đang sửa, bỏ qua.
if [ "$T0" != "$T1" ]; then
  exit 0
fi

if [[ -z $(git status --porcelain) ]]; then
  exit 0
fi

echo "🔄 Smart backup..."
git add -A
if git diff --cached --quiet; then
  exit 0
fi

git commit -m "smart backup $(date '+%H:%M:%S')"
eval "$PUSH_CMD"
