#!/bin/bash

set -euo pipefail

PROJECT_DIR="${PROJECT_DIR:-/home/z/my-project}"
BUILD_DIR="${BUILD_DIR:?BUILD_DIR is required}"
DATABASE_URL="${DATABASE_URL:?DATABASE_URL is required for PostgreSQL schema synchronization}"

echo "🗄️  同步 PostgreSQL 数据库结构..."
(
    cd "$PROJECT_DIR"
    DATABASE_URL="$DATABASE_URL" bun run db:deploy
)

echo "✅ PostgreSQL 数据库结构已同步"
