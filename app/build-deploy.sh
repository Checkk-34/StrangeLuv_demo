#!/bin/bash
set -e

REPO_NAME="StrangeLuv_demo"
BASE_PATH="/${REPO_NAME}/app"

echo "🔨 Building React SPA with base: ${BASE_PATH}..."
VITE_BASE_PATH=${BASE_PATH} npm run build

echo "📁 Restructuring output for GitHub Pages..."
mkdir -p dist/app
mv dist/index.html dist/app/
mv dist/assets dist/app/

echo "🌐 Copying landing page as index.html..."
cp ../landing.html dist/index.html

echo "📄 Creating 404.html for SPA fallback..."
cp dist/app/index.html dist/404.html

echo "✅ Done! Output in dist/"
ls -la dist/
