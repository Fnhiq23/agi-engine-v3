#!/usr/bin/env python3
"""
AGI Engine 每日战报邮件

从线上后端拉取真实战报数据，格式化成中文战报，通过 QQ 邮箱 SMTP 发送。

配置：server/.mail.env（已被 gitignore，不会入库）
    MAIL_FROM=80306495@qq.com
    MAIL_TO=80306495@qq.com
    MAIL_PASSWORD=QQ邮箱SMTP授权码   # 不是登录密码，见下方获取方法
    SMTP_HOST=smtp.qq.com
    SMTP_PORT=465

获取 QQ 邮箱授权码：
    登录 QQ 邮箱网页版 → 设置 → 账户 → POP3/IMAP/SMTP 服务 → 开启
    → 生成授权码（16 位）→ 填入 MAIL_PASSWORD

用法：
    python3 server/daily_report_email.py            # 拉取并发送
    python3 server/daily_report_email.py --dry-run  # 只生成不发送（验证用）
"""
import argparse
import json
import os
import smtplib
import ssl
import sys
import urllib.request
from datetime import datetime, timedelta, timezone
from email.header import Header
from email.mime.text import MIMEText

BASE = os.path.dirname(os.path.abspath(__file__))
MAIL_ENV = os.path.join(BASE, ".mail.env")
REPORT_URL = os.environ.get(
    "AGI_REPORT_URL",
    "https://acb7adbd80f066c9d.app.workbuddy.host/api/report?sharecode=S4XAXZRX4F",
)
DASHBOARD = "https://acb7adbd80f066c9d.app.workbuddy.host/dashboard?sharecode=S4XAXZRX4F"
CST = timezone(timedelta(hours=8))


def load_config():
    cfg = {}
    if os.path.exists(MAIL_ENV):
        for line in open(MAIL_ENV, encoding="utf-8"):
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                k, v = line.split("=", 1)
                cfg[k.strip()] = v.strip().strip('"').strip("'")
    cfg.setdefault("MAIL_FROM", "80306495@qq.com")
    cfg.setdefault("MAIL_TO", "80306495@qq.com")
    cfg.setdefault("SMTP_HOST", "smtp.qq.com")
    cfg.setdefault("SMTP_PORT", "465")
    return cfg


def fetch_report():
    req = urllib.request.Request(REPORT_URL, headers={"User-Agent": "agi-daily-report/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def esc(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_html(d):
    today = d.get("today", {})
    rev = d.get("revenue", {})
    subs = d.get("subscriptions", {})
    claims = d.get("claims", {})
    conv = d.get("conversion", {})
    channels = d.get("channels", {})
    weekly = d.get("weekly", [])
    integ = d.get("dataIntegrity", {})
    now = datetime.now(CST).strftime("%Y-%m-%d %H:%M")

    ch = " · ".join(f"{esc(k)} {v}" for k, v in channels.items()) or "无"

    rows = ""
    for w in weekly[-7:]:
        rows += (
            f"<tr><td style='padding:6px 10px;border-bottom:1px solid #eee'>{esc(w.get('date',''))}</td>"
            f"<td style='padding:6px 10px;border-bottom:1px solid #eee;text-align:center'>{w.get('proClicks',0)}</td>"
            f"<td style='padding:6px 10px;border-bottom:1px solid #eee;text-align:center'>{w.get('signups',0)}</td>"
            f"<td style='padding:6px 10px;border-bottom:1px solid #eee;text-align:center'>{w.get('activations',0)}</td>"
            f"<td style='padding:6px 10px;border-bottom:1px solid #eee;text-align:center'>¥{w.get('revenue',0)}</td></tr>"
        )

    return f"""<div style="font-family:-apple-system,Segoe UI,Microsoft YaHei,sans-serif;max-width:640px;margin:auto;color:#222">
<div style="background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:22px 24px;border-radius:10px 10px 0 0">
  <div style="font-size:20px;font-weight:700">AGI Engine · 每日战报</div>
  <div style="font-size:12px;opacity:.75;margin-top:6px">{now} · 数据源：服务端真实记录</div>
</div>
<div style="border:1px solid #e8e8e8;border-top:none;padding:22px 24px;border-radius:0 0 10px 10px">
  <div style="font-size:13px;color:#888;margin-bottom:14px">今日 {esc(today.get('date',''))} · 以下数字均来自服务端验证，非浏览器本地伪造</div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr>
      <td style="width:25%;background:#fafafa;padding:14px 8px;text-align:center;border-radius:8px">
        <div style="font-size:22px;font-weight:700;color:#c0392b">¥{rev.get('today',0)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">今日收入</div></td>
      <td style="width:25%;background:#fafafa;padding:14px 8px;text-align:center;border-radius:8px">
        <div style="font-size:22px;font-weight:700">¥{rev.get('total',0)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">累计收入</div></td>
      <td style="width:25%;background:#fafafa;padding:14px 8px;text-align:center;border-radius:8px">
        <div style="font-size:22px;font-weight:700">{subs.get('active',0)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">活跃订阅</div></td>
      <td style="width:25%;background:#fafafa;padding:14px 8px;text-align:center;border-radius:8px">
        <div style="font-size:22px;font-weight:700">{today.get('payments',0)}</div>
        <div style="font-size:11px;color:#888;margin-top:4px">今日付款</div></td>
    </tr>
  </table>

  <div style="font-size:14px;font-weight:700;margin:18px 0 8px">转化漏斗</div>
  <div style="font-size:13px;line-height:1.9;color:#555">
    · 落地页→注册：{esc(conv.get('landingToSignup','0%'))}<br>
    · 注册→激活：{esc(conv.get('signupToActivation','0%'))}<br>
    · 付费墙浏览→付款：{esc(conv.get('proViewToPayment','0%'))}
  </div>

  <div style="font-size:14px;font-weight:700;margin:18px 0 8px">获客渠道</div>
  <div style="font-size:13px;color:#555">{ch}</div>

  <div style="font-size:14px;font-weight:700;margin:18px 0 8px">近 7 日趋势</div>
  <table style="width:100%;border-collapse:collapse;font-size:12px">
    <tr style="background:#f5f5f5;color:#666">
      <th style="padding:6px 10px;text-align:left">日期</th><th style="padding:6px">付费点击</th>
      <th style="padding:6px">注册</th><th style="padding:6px">激活</th><th style="padding:6px">收入</th></tr>
    {rows or "<tr><td colspan='5' style='padding:10px;color:#999'>暂无数据</td></tr>"}
  </table>

  <div style="font-size:14px;font-weight:700;margin:18px 0 8px">客户认领</div>
  <div style="font-size:13px;color:#555">待核销 {claims.get('pending',0)} · 已通过 {claims.get('approved',0)} · 已拒绝 {claims.get('rejected',0)}</div>

  <div style="margin-top:22px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;line-height:1.7">
    数据完整性：事件 {integ.get('events',0)} · 已验证支付 {integ.get('verifiedPayments',0)} · Webhook 调用 {integ.get('webhookCalls',0)}<br>
    收款入口：年付 $100 / 月付 $15 / paypal.me/fnhiq23<br>
    <a href="{DASHBOARD}" style="color:#555">查看实时数据看板 →</a>
  </div>
</div></div>"""


def build_subject(d):
    rev = d.get("revenue", {})
    subs = d.get("subscriptions", {})
    day = d.get("today", {}).get("date", datetime.now(CST).strftime("%Y-%m-%d"))
    return f"AGI Engine 战报 · {day} · 收入 ¥{rev.get('today',0)} / 活跃订阅 {subs.get('active',0)}"


def send_mail(cfg, subject, html):
    msg = MIMEText(html, "html", "utf-8")
    msg["Subject"] = Header(subject, "utf-8")
    msg["From"] = cfg["MAIL_FROM"]
    msg["To"] = cfg["MAIL_TO"]
    port = int(cfg.get("SMTP_PORT", 465))
    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(cfg["SMTP_HOST"], port, context=context, timeout=30) as srv:
        srv.login(cfg["MAIL_FROM"], cfg["MAIL_PASSWORD"])
        srv.sendmail(cfg["MAIL_FROM"], [cfg["MAIL_TO"]], msg.as_string())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="只生成不发送")
    args = ap.parse_args()

    try:
        data = fetch_report()
    except Exception as exc:
        print(f"拉取战报失败：{type(exc).__name__}: {exc}")
        sys.exit(1)

    subject = build_subject(data)
    html = build_html(data)

    if args.dry_run:
        print("=== DRY RUN：仅预览，不发送 ===")
        print("主题：", subject)
        print("正文 HTML 长度：", len(html), "字符")
        print("收入：", data.get("revenue"))
        print("订阅：", data.get("subscriptions"))
        return

    cfg = load_config()
    if not cfg.get("MAIL_PASSWORD"):
        print("错误：server/.mail.env 缺少 MAIL_PASSWORD（QQ 邮箱 SMTP 授权码）。")
        sys.exit(2)
    try:
        send_mail(cfg, subject, html)
        print(f"战报邮件已发送：{cfg['MAIL_TO']} | 主题：{subject}")
    except Exception as exc:
        print(f"发送失败：{type(exc).__name__}: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
