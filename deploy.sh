#!/usr/bin/env bash
# AGI Engine — 一键部署到 GitHub
# 用法： ./deploy.sh <你的GitHub用户名> <新仓库名>
# 例如： ./deploy.sh Fnhiq23 agi-engine-v3
#
# 前提：本机已登录 GitHub（gh auth login 或配置 git 凭据）。
# 本脚本不会触碰你的 PayPal 账户，也不会代替你发布营销内容。

set -e

USER="${1:-}"
REPO="${2:-agi-engine-v3}"

if [ -z "$USER" ]; then
  echo "用法: ./deploy.sh <GitHub用户名> [仓库名]"
  exit 1
fi

echo "==> 1/4 检查 GitHub 认证"
if ! gh auth status >/dev/null 2>&1; then
  echo "未登录 GitHub。请先运行: gh auth login"
  echo "（或手动配置 git HTTPS 凭据后再运行本脚本）"
  exit 1
fi
echo "    已登录。"

echo "==> 2/4 在 GitHub 创建公开仓库: $USER/$REPO"
gh repo create "$USER/$REPO" --public --source=. --remote=origin --push 2>/dev/null || {
  echo "仓库可能已存在，尝试直接推送..."
  git remote remove origin 2>/dev/null || true
  git remote add origin "https://github.com/$USER/$REPO.git"
  git branch -M main
  git push -u origin main
}

echo "==> 3/4 开启 GitHub Pages（托管前端 demo）"
gh api "repos/$USER/$REPO/pages" -f source='{"branch":"main","path":"/"}' 2>/dev/null && echo "    Pages 已开启" || echo "    请到仓库 Settings > Pages 手动开启（选 main 分支 / root）"

echo "==> 4/4 完成"
echo ""
echo "仓库地址: https://github.com/$USER/$REPO"
echo "Demo 地址: https://$USER.github.io/$REPO/"
echo ""
echo "下一步（需你本人操作）:"
echo "  1. 在 PayPal Developer Dashboard 创建 App，获取 client_id/secret/webhook_id"
echo "  2. 填写 server/.env（参考 .env.example），在服务器上运行: node server/server.js"
echo "  3. 把 Demo 链接填进 launch/ 文案，用你的账号发布到 Show HN / Product Hunt"
