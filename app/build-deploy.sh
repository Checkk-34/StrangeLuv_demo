#!/bin/bash
set -e

REPO_NAME="StrangeLuv_demo"
BASE_PATH="/${REPO_NAME}/app"
OUTPUT="../docs"

echo "🔨 Building React SPA with base: ${BASE_PATH}..."
VITE_BASE_PATH=${BASE_PATH} npm run build

echo "📁 Restructuring for GitHub Pages..."
rm -rf ${OUTPUT}/app
mkdir -p ${OUTPUT}/app
mv dist/index.html ${OUTPUT}/app/
mv dist/assets ${OUTPUT}/app/

echo "🌐 Copying landing page as index.html..."
cp landing.html ${OUTPUT}/index.html

echo "📄 Creating 404.html for SPA fallback..."
cp ${OUTPUT}/app/index.html ${OUTPUT}/404.html

echo "✅ Done! Output in ${OUTPUT}/"
ls -la ${OUTPUT}/
