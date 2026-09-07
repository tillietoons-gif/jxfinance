#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/../.zscripts" && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

FAKE_BIN="$TEST_ROOT/bin"
mkdir -p "$FAKE_BIN"
cat >"$FAKE_BIN/bun" <<'EOF'
#!/bin/bash
set -euo pipefail

if [ "$#" -ne 2 ] || [ "$1" != "run" ] || [ "$2" != "db:deploy" ]; then
    echo "unexpected bun invocation: $*" >&2
    exit 1
fi

printf '%s\n' "$DATABASE_URL" >>"${DB_PUSH_CALLS:?}"
EOF
chmod +x "$FAKE_BIN/bun"

export PATH="$FAKE_BIN:$PATH"
export DB_PUSH_CALLS="$TEST_ROOT/db-push-calls"

mkdir -p "$TEST_ROOT/project"
PROJECT_DIR="$TEST_ROOT/project" BUILD_DIR="$TEST_ROOT/build" \
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jxfinance?schema=public" \
    bash "$SCRIPT_DIR/database-runtime-build.sh"

grep -Fx "postgresql://postgres:postgres@localhost:5432/jxfinance?schema=public" "$DB_PUSH_CALLS"
test ! -e "$TEST_ROOT/build/db/custom.db"

echo "database runtime build tests passed"
