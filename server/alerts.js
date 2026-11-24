// Decides when a price alert should fire, and sends it.
import { getAlerts, markAlertTriggered } from './db.js';
import { sendTelegramMessage } from './telegram.js';

// Has the price reached or passed the target? Returns true or false.
// It uses no database or internet, so it is easy to test.
export function isAlertCrossed(alert, price) {
  if (alert.direction === 'above') return price >= alert.target_price;
  if (alert.direction === 'below') return price <= alert.target_price;
  return false;
}

// Checks every waiting alert for one symbol against its new price.
// sendMessage can be swapped for a pretend one in tests.
export async function checkAlerts(symbol, price, sendMessage = sendTelegramMessage) {
  for (const alert of getAlerts()) {
    if (alert.symbol !== symbol || alert.triggered) continue; // not for us, or already fired
    if (!isAlertCrossed(alert, price)) continue;

    const text =
      `CSE alert: ${symbol} is now Rs. ${price.toFixed(2)}\n` +
      `Your target: ${alert.direction} Rs. ${alert.target_price.toFixed(2)}`;

    try {
      await sendMessage(text);
      // Only mark it after the message was sent. If sending failed, we try again next time.
      markAlertTriggered(alert.id);
      console.log(`[alerts] Sent: ${symbol} ${alert.direction} ${alert.target_price}`);
    } catch (error) {
      console.error(`[alerts] Alert for ${symbol} failed: ${error.message}`);
    }
  }
}
