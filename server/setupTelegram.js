// Helps you set up Telegram.
// Without a chat ID in .env, it finds yours. With one, it sends a test message.
// How to run:  npm run setup-telegram
import './env.js';
import { getRecentChats, sendTelegramMessage } from './telegram.js';

try {
  if (process.env.TELEGRAM_CHAT_ID?.trim()) {
    await sendTelegramMessage('CSE Tracker test: your alerts will arrive here.');
    console.log('Test message sent. Check Telegram!');
  } else {
    const chats = await getRecentChats();
    if (chats.length === 0) {
      console.log('No messages found. Send your bot any message in Telegram, then run this again.');
    }
    for (const chat of chats) {
      console.log(`Chat ID: ${chat.id}  (${chat.first_name || chat.title || 'no name'})`);
    }
    if (chats.length > 0) {
      console.log('Put your own chat ID in .env as TELEGRAM_CHAT_ID, then run this again.');
    }
  }
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
