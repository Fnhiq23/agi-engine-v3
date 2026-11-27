#!/usr/bin/env python3
"""
PayPal 生产凭据一键修复工具。

用法：
    python3 server/fix_paypal.py

流程：
  1. 安全提示输入新的 Secret（不回显、不写入历史）
  2. 用新 Secret 向 PayPal live 请求 token 验证真伪
  3. 验证通过 → 写回 server/.env 的 PAYPAL_SECRET（脱敏写入）
  4. 再次自检 token，输出「可以重新发布」的提示

注意：Client ID 通常不变；如果 PayPal 同时轮换了两项，用环境变量覆盖：
    PAYPAL_CLIENT_ID=新ID python3 server/fix_paypal.py
"""
import base64
import getpass
import json
import os
import sys
import urllib.error
import urllib.request

ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
HOST = "api-m.paypal.com"


def read_env():
    env = {}
    with open(ENV_PATH, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.split("=", 1)
                env[k] = v.strip().strip('"').strip("'")
    return env


def write_env(env):
    tmp = ENV_PATH + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        for k, v in env.items():
            fh.write(f"{k}={v}\n")
    os.replace(tmp, ENV_PATH)


def test_token(client_id, secret):
    data = b"grant_type=client_credentials"
    req = urllib.request.Request(f"https://{HOST}/v1/oauth2/token", data=data, method="POST")
    req.add_header("Authorization", "Basic " + base64.b64encode(f"{client_id}:{secret}".encode()).decode())
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    try:
        resp = urllib.request.urlopen(req, timeout=25)
        payload = json.loads(resp.read())
        return bool(payload.get("access_token")), ""
    except urllib.error.HTTPError as exc:
        return False, f"HTTP {exc.code}: {exc.read()[:200].decode(errors='replace')}"
    except Exception as exc:
        return False, f"{type(exc).__name__}: {exc}"


def main():
    env = read_env()
    client_id = os.environ.get("PAYPAL_CLIENT_ID") or env.get("PAYPAL_CLIENT_ID", "")
    if not client_id:
        print("错误：.env 中没有 PAYPAL_CLIENT_ID，请先填入。")
        sys.exit(1)

    print("当前 Client ID:", client_id[:8] + "..." + client_id[-6:])
    print("如果 PayPal 同时轮换过 Client ID，请先运行：")
    print("  PAYPAL_CLIENT_ID=新ID python3 server/fix_paypal.py\n")

    new_secret = getpass.getpass("请输入新的 PayPal LIVE Secret（输入时不显示）: ").strip()
    if not new_secret:
        print("错误：Secret 不能为空。")
        sys.exit(1)
    if any(c.isspace() for c in new_secret):
        print("错误：Secret 中含有空白字符，请检查是否复制完整。")
        sys.exit(1)

    print("\n[1/3] 正在向 PayPal live 验证新 Secret ...")
    ok, detail = test_token(client_id, new_secret)
    if not ok:
        print(f"验证失败：{detail}")
        print("没有写入 .env。请确认这是与上面 Client ID 配套的 LIVE Secret。")
        sys.exit(1)
    print("验证通过：成功拿到 access token。")

    print("[2/3] 写回 server/.env ...")
    env["PAYPAL_MODE"] = "live"
    env["PAYPAL_CLIENT_ID"] = client_id
    env["PAYPAL_SECRET"] = new_secret
    write_env(env)
    print("已写入（Secret 仅在本地 .env，不入库）。")

    print("[3/3] 用写回后的配置再次自检 ...")
    ok, detail = test_token(env["PAYPAL_CLIENT_ID"], env["PAYPAL_SECRET"])
    if not ok:
        print(f"复核失败：{detail}")
        sys.exit(1)
    print("复核通过。\n")

    print("=" * 56)
    print("本地凭据已恢复。下一步：让 AI 重新发布后端，使线上生效。")
    print("重新发布后，自动续费订阅链路即恢复。")
    print("=" * 56)


if __name__ == "__main__":
    main()
