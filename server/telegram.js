// Talks to Telegram using your bot.

const TIMEOUT_MS = 15000; // give up after 15 seconds

// Calls one Telegram method, such as sendMessage.
// The web address contains the secret token, so we never print it in an error.
async function callTelegram(method, data = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is missing from server/.env');
  }

  let reply;
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    reply = await response.json();
  } catch (error) {
    throw new Error(`Could not reach Telegram (${error.cause?.code || error.name})`);
  }

  // Telegram says ok: false when something is wrong, with a short description
  if (!reply?.ok) {
    throw new Error(`Telegram refused: ${reply?.description || 'unknown reason'}`);
  }
  return reply.result;
}

// Sends you a message. Throws an Error if it could not be sent.
export async function sendTelegramMessage(text) {
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!chatId) {
    throw new Error('TELEGRAM_CHAT_ID is missing from server/.env');
  }
  await callTelegram('sendMessage', { chat_id: chatId, text });
}

// Lists the chats that recently messaged the bot (used to find your chat ID)
export async function getRecentChats() {
  const updates = await callTelegram('getUpdates');
  const chats = new Map(); // a Map keeps each chat ID only once
  for (const update of updates) {
    const chat = update.message?.chat;
    if (chat) chats.set(chat.id, chat);
  }
  return [...chats.values()];
}
