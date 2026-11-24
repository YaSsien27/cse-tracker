// Checks the alert logic using pretend messages, so Telegram and CSE are never contacted.
// How to run:  npm run check-alerts

// Use a temporary database in memory (must be set before db.js is loaded)
process.env.DB_FILE = ':memory:';

const db = await import('./db.js');
const { isAlertCrossed, checkAlerts } = await import('./alerts.js');

function check(description, passed) {
  console.log(`${passed ? 'OK' : 'PROBLEM'}: ${description}`);
  if (!passed) process.exitCode = 1;
}

// --- Is the target crossed? ---
const above = { direction: 'above', target_price: 20 };
const below = { direction: 'below', target_price: 20 };
check('above: 19.90 does not fire', !isAlertCrossed(above, 19.9));
check('above: exactly 20 fires', isAlertCrossed(above, 20));
check('above: 20.10 fires', isAlertCrossed(above, 20.1));
check('below: 20.10 does not fire', !isAlertCrossed(below, 20.1));
check('below: exactly 20 fires', isAlertCrossed(below, 20));
check('below: 19.90 fires', isAlertCrossed(below, 19.9));

// --- Sending ---
let messages = [];
async function pretendSend(text) {
  messages.push(text);
}
async function pretendFailure() {
  throw new Error('pretend Telegram failure');
}

db.saveAlert('JKH.N0000', 20, 'above');
db.saveAlert('COMB.N0000', 20, 'above');

await checkAlerts('JKH.N0000', 19, pretendSend);
check('nothing is sent before the target', messages.length === 0);

await checkAlerts('JKH.N0000', 21, pretendFailure);
check('a failed message leaves the alert waiting', db.getAlerts()[0].triggered === false);

await checkAlerts('JKH.N0000', 21, pretendSend);
check('it is sent on the next try', messages.length === 1);
check('it is now marked as triggered', db.getAlerts()[0].triggered === true);

await checkAlerts('JKH.N0000', 22, pretendSend);
check('it only fires once', messages.length === 1);
check('alerts for other symbols are untouched', db.getAlerts()[1].triggered === false);

// --- Editing and deleting ---
db.updateAlert(1, 'JKH.N0000', 30, 'above');
check('an edited alert goes back to waiting', db.getAlerts()[0].triggered === false);
await checkAlerts('JKH.N0000', 31, pretendSend);
check('an edited alert can fire again', messages.length === 2);

// Pretend the alert is edited while its message is being sent
const changingId = db.saveAlert('DIAL.N0000', 10, 'above');
await checkAlerts('DIAL.N0000', 11, async () => db.updateAlert(changingId, 'DIAL.N0000', 50, 'above'));
check('an alert edited during sending stays waiting', db.getAlert(changingId).triggered === false);
check('an alert can be deleted', db.deleteAlert(changingId) && db.getAlert(changingId) === undefined);

// --- The scheduled job ---
// Replace the real fetch: the CSE price is 25, and Telegram says the message arrived
let telegramCalls = 0;
globalThis.fetch = async (url) => {
  if (String(url).includes('telegram')) {
    telegramCalls++;
    return Response.json({ ok: true, result: {} });
  }
  return Response.json({ reqSymbolInfo: { symbol: 'X', name: 'Test', lastTradedPrice: 25 } });
};
process.env.TELEGRAM_BOT_TOKEN = 'pretend';
process.env.TELEGRAM_CHAT_ID = 'pretend';

const { fetchAllPrices } = await import('./priceJob.js');
await fetchAllPrices();
await fetchAllPrices();
check('the job checks alerts, and each fires only once', telegramCalls === 1);
check('a stock you do not own is fetched only while its alert waits', db.getPrices('COMB.N0000').length === 1);
