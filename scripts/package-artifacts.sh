#!/usr/bin/env sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ARTIFACT_DIR="$ROOT_DIR/artifacts"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$ARTIFACT_DIR"
rm -rf "$ARTIFACT_DIR/backend" "$ARTIFACT_DIR/frontend-dist"
mkdir -p "$ARTIFACT_DIR/backend" "$ARTIFACT_DIR/frontend-dist"

cp "$ROOT_DIR/backend/package.json" "$ARTIFACT_DIR/backend/"
cp "$ROOT_DIR/backend/package-lock.json" "$ARTIFACT_DIR/backend/"
cp "$ROOT_DIR/backend/server.js" "$ARTIFACT_DIR/backend/"
cp -R "$ROOT_DIR/backend/src" "$ARTIFACT_DIR/backend/src"
[ -d "$ROOT_DIR/backend/uploads" ] && cp -R "$ROOT_DIR/backend/uploads" "$ARTIFACT_DIR/backend/uploads"
[ -f "$ROOT_DIR/backend/.env.example" ] && cp "$ROOT_DIR/backend/.env.example" "$ARTIFACT_DIR/backend/.env.example"
[ -f "$ROOT_DIR/backend/Dockerfile" ] && cp "$ROOT_DIR/backend/Dockerfile" "$ARTIFACT_DIR/backend/"

cp -R "$ROOT_DIR/frontend/dist/." "$ARTIFACT_DIR/frontend-dist/"
[ -f "$ROOT_DIR/frontend/Dockerfile" ] && cp "$ROOT_DIR/frontend/Dockerfile" "$ARTIFACT_DIR/frontend-dist/Dockerfile"

( cd "$ARTIFACT_DIR" && tar -czf "backend-artifact-$TIMESTAMP.tar.gz" backend )
( cd "$ARTIFACT_DIR" && tar -czf "frontend-artifact-$TIMESTAMP.tar.gz" frontend-dist )

echo "Artifacts generated in $ARTIFACT_DIR"
