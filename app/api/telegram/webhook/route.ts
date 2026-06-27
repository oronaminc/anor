import { NextResponse } from "next/server";

import { getSql } from "@/lib/db";
import { hasDb } from "@/lib/env";
import { sendTelegramMessage } from "@/lib/telegram";
import { applyBoost, type BoostKind } from "@/lib/boost";
import { clampSpeed } from "@/lib/growth";

export const dynamic = "force-dynamic";

/**
 * Telegram bot webhook — lets the admin drive the site from chat with slash
 * commands. Secured by Telegram's secret-token header (set with setWebhook)
 * AND by checking the sender is the configured admin chat.
 *
 *   /list                       list shops
 *   /boost <가게> like|view [n]   +n (default 1000) likes/views
 *   /trend <가게> on|off          toggle trending
 *   /speed <0-5>                 set organic-growth speed
 *
 * Set up once (after TELEGRAM_WEBHOOK_SECRET is in the environment):
 *   curl "https://api.telegram.org/bot<TOKEN>/setWebhook" \
 *     -d url="https://<your-domain>/api/telegram/webhook" \
 *     -d secret_token="<TELEGRAM_WEBHOOK_SECRET>"
 */
const HELP = [
  "🍢 anor 봇 명령어",
  "/list — 가게 목록",
  "/boost <가게> like|view [개수] — 좋아요/조회 +개수(기본 1000)",
  "/trend <가게> on|off — 트렌딩 토글",
  "/speed <0-5> — 자동 성장 속도",
].join("\n");

function ok() {
  // Always 200 so Telegram doesn't retry.
  return NextResponse.json({ ok: true });
}

async function findShop(
  q: string,
): Promise<{ id: string; name_ko: string; multiple: boolean } | null> {
  const like = `%${q}%`;
  const rows = (await getSql()`
    SELECT id, name_ko FROM shops
    WHERE name_ko ILIKE ${like} OR name_en ILIKE ${like}
    ORDER BY weekly_view_count DESC
    LIMIT 3
  `) as Array<{ id: string; name_ko: string }>;
  if (rows.length === 0) return null;
  return { ...rows[0], multiple: rows.length > 1 };
}

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const adminChat = process.env.TELEGRAM_ADMIN_CHAT_ID;
  // Feature off unless a secret is configured and the header matches.
  if (
    !secret ||
    request.headers.get("x-telegram-bot-api-secret-token") !== secret
  ) {
    return ok();
  }

  let update: {
    message?: { text?: string; chat?: { id?: number } };
  };
  try {
    update = await request.json();
  } catch {
    return ok();
  }

  const text = update.message?.text?.trim();
  const chatId = update.message?.chat?.id;
  // Only the configured admin chat may issue commands.
  if (!text || !adminChat || String(chatId) !== String(adminChat)) return ok();

  const parts = text.split(/\s+/);
  const cmd = parts[0].replace(/@.*$/, "").toLowerCase(); // strip @botname
  const args = parts.slice(1);

  try {
    if (cmd === "/help" || cmd === "/start") {
      await sendTelegramMessage(HELP);
      return ok();
    }

    if (!hasDb()) {
      await sendTelegramMessage("⚠️ DB가 연결돼 있지 않습니다.");
      return ok();
    }
    const sql = getSql();

    if (cmd === "/list") {
      const rows = (await sql`
        SELECT name_ko, is_trending, weekly_view_count, weekly_like_count
        FROM shops ORDER BY weekly_view_count DESC LIMIT 30
      `) as Array<{
        name_ko: string;
        is_trending: boolean;
        weekly_view_count: number;
        weekly_like_count: number;
      }>;
      const body = rows.length
        ? rows
            .map(
              (r) =>
                `${r.is_trending ? "🔥" : "•"} ${r.name_ko} — 👁${r.weekly_view_count} ❤️${r.weekly_like_count}`,
            )
            .join("\n")
        : "등록된 가게가 없습니다.";
      await sendTelegramMessage(`📋 가게 목록 (이번 주)\n${body}`);
      return ok();
    }

    if (cmd === "/speed") {
      const n = clampSpeed(parseInt(args[0] ?? "", 10));
      await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES ('growth_speed', ${String(n)}, now())
        ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = now()
      `;
      await sendTelegramMessage(`⚙️ 자동 성장 속도 → ${n}`);
      return ok();
    }

    if (cmd === "/boost") {
      const kind = args.find((a) => a === "like" || a === "view") as
        | BoostKind
        | undefined;
      const amountTok = args.find((a) => /^\d+$/.test(a));
      const query = args
        .filter((a) => a !== kind && a !== amountTok)
        .join(" ")
        .trim();
      if (!kind || !query) {
        await sendTelegramMessage("사용법: /boost <가게> like|view [개수]");
        return ok();
      }
      const shop = await findShop(query);
      if (!shop) {
        await sendTelegramMessage(`❌ '${query}' 가게를 못 찾았어요.`);
        return ok();
      }
      const amount = amountTok ? parseInt(amountTok, 10) : 1000;
      await applyBoost(sql, shop.id, kind, amount);
      await sendTelegramMessage(
        `✅ ${shop.name_ko} ${kind === "like" ? "❤️" : "👁"} +${amount}` +
          (shop.multiple ? "\n(여러 곳이 검색돼 첫 번째에 적용)" : ""),
      );
      return ok();
    }

    if (cmd === "/trend") {
      const onoff = args.find((a) => a === "on" || a === "off");
      const query = args.filter((a) => a !== onoff).join(" ").trim();
      if (!onoff || !query) {
        await sendTelegramMessage("사용법: /trend <가게> on|off");
        return ok();
      }
      const shop = await findShop(query);
      if (!shop) {
        await sendTelegramMessage(`❌ '${query}' 가게를 못 찾았어요.`);
        return ok();
      }
      await sql`UPDATE shops SET is_trending = ${onoff === "on"} WHERE id = ${shop.id}`;
      await sendTelegramMessage(
        `✅ ${shop.name_ko} 트렌딩 ${onoff === "on" ? "ON 🔥" : "OFF"}`,
      );
      return ok();
    }

    await sendTelegramMessage(`알 수 없는 명령: ${cmd}\n\n${HELP}`);
    return ok();
  } catch (err) {
    console.error("telegram webhook error:", (err as Error).message);
    try {
      await sendTelegramMessage("⚠️ 처리 중 오류가 발생했습니다.");
    } catch {
      /* ignore */
    }
    return ok();
  }
}
