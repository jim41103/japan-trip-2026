#!/bin/bash
cd "$(dirname "$0")"

echo "======================================"
echo "  推送地點資料更新到 Vercel"
echo "======================================"
echo ""
echo "📁 目錄：$(pwd)"
echo ""

# 移除鎖定檔（如果存在）
if [ -f .git/index.lock ]; then
  echo "🔓 移除 git index.lock..."
  rm -f .git/index.lock
fi

# 顯示要提交的變更
echo "📋 變更內容："
git diff --stat places.json 2>/dev/null
git status --short data/ 2>/dev/null
echo ""

# 只 commit places 相關檔案
git add places.json data/
git commit -m "v37: 更新地點資料 218 筆（含 googleMapsUrl + S2 解碼座標）"

echo ""
echo "🚀 推送到 GitHub..."
git push

echo ""
echo "======================================"
echo "  完成！Vercel 將在 1 分鐘內重新部署"
echo "======================================"
read -n 1 -p "按任意鍵關閉..."
