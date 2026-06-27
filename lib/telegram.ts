import "server-only";

/**
 * Minimal Telegram Bot API client used for the admin login one-time code.
 *
 * Configured via two env vars (reuse an existing bot or create a fresh one):
 *   * TELEGRAM_BOT_TOKEN     — the bot token from @BotFather
 *   * TELEGRAM_ADMIN_CHAT_ID — the chat id that should receive login codes
 *
 * When either is missing, telegramConfigured() is false and the login flow
 * falls back to password-only (see app/(admin)/admin/actions.ts).
 */
export function telegramConfigured(): boolean {
  return !!(
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID
  );
}

/**
 * Send a plain-text message to the configured admin chat. Throws on a missing
 * config or a non-2xx response so callers can refuse to grant access when the
 * code could not be delivered.
 */
export async function sendTelegramMessage(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram is not configured");

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Telegram sendMessage failed: HTTP ${res.status}`);
  }
}
