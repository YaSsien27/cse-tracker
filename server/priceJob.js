// Fetches share prices on a schedule, saves them, and checks your alerts.
import cron from 'node-cron';
import { fetchPrice } from './cseApi.js';
import { checkAlerts } from './alerts.js';
import { getSymbolsToFetch, savePrice } from './db.js';

// CSE trades 9:30 to 14:30, Monday to Friday.
// Read each line as: minutes, hours, any day of month, any month, Monday-Friday (1-5)
const SCHEDULES = [
  '30,45 9 * * 1-5', // 9:30 and 9:45
  '*/15 10-13 * * 1-5', // every 15 minutes from 10:00 to 13:45
  '0,15,30 14 * * 1-5', // 14:00, 14:15 and 14:30
];

const PAUSE_MS = 1000; // wait 1 second between symbols, to be polite to the website

let isRunning = false; // true while a round of fetching is in progress

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Fetches and saves every symbol once. Never throws, so it can't crash the server.
export async function fetchAllPrices() {
  // If the last round is still going, skip this one
  if (isRunning) {
    console.log('[prices] The previous round is still running, skipping this one.');
    return;
  }
  isRunning = true;

  try {
    const symbols = getSymbolsToFetch();
    console.log(`[prices] ${new Date().toISOString()} Fetching ${symbols.length} symbol(s)`);

    for (const symbol of symbols) {
      // This inner try/catch means one bad symbol doesn't stop the others
      try {
        const share = await fetchPrice(symbol);
        // Save under our own symbol, so it always matches the holding
        savePrice(symbol, share.price);
        console.log(`[prices] Saved ${symbol}: Rs. ${share.price.toFixed(2)}`);
        await checkAlerts(symbol, share.price);
      } catch (error) {
        console.error(`[prices] ${symbol} failed: ${error.message}`);
      }
      await wait(PAUSE_MS);
    }
  } catch (error) {
    // For example, the database could not be read
    console.error(`[prices] Could not fetch prices: ${error.message}`);
  } finally {
    isRunning = false; // runs whether it worked or not
  }
}

// Turns the schedule on. Called once, when the server starts.
export function startPriceJob() {
  for (const schedule of SCHEDULES) {
    // The timezone makes this work wherever the computer is
    cron.schedule(schedule, fetchAllPrices, { timezone: 'Asia/Colombo' });
  }
  console.log('[prices] Job started: every 15 minutes, 9:30-14:30 Colombo time, Monday-Friday');
}
