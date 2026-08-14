#!/bin/bash
# Render build script with output capture
set -e

echo "=== Node.js version ==="
node --version

echo "=== npm version ==="
npm --version

echo "=== Installing dependencies ==="
npm install

echo "=== Running prisma generate ==="
npx prisma generate

echo "=== Running next build ==="
npx next build

echo "=== Build complete ==="
