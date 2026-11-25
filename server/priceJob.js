// Fetches share prices on a schedule, when the server starts, and when you add a
// share. Saves them and checks your alerts.
import cron from 'node-cron';
import { fetchPrice } from './cseApi.js';
import { checkAlerts } from './alerts.js';
import { getLatestPrice, getSymbolsToFetch, savePrice } from './db.js';

// CSE trades 9:30 to 14:30, Monday to Friday.
// Read each line as: minutes, hours, any day of month, any month, Monday-Friday (1-5)
const SCHEDULES = [
  '30-55/5 9 * * 1-5', // every 5 minutes from 9:30 to 9:55
  '*/5 10-13 * * 1-5', // every 5 minutes from 10:00 to 13:55
  '0-30/5 14 * * 1-5', // every 5 minutes from 14:00 to 14:30
];

const PAUSE_MS = 1000; // wait 1 second between symbols, to be polite to the website

// Don't fetch a symbol again until this many minutes have passed
const MIN_GAP = 5;
// The schedule gets 30 seconds of slack, because each round takes a slightly
// different time. Without it, every second scheduled fetch could be skipped.
const SCHEDULED_MIN_GAP = 4.5;

// After the computer wakes from sleep, wait 15 seconds for the Wi-Fi to reconnect
const WAKE_DELAY_MS = 15000;

// When we last asked CSE about each symbol, even if it failed (symbol -> time)
const lastTried = new Map();

let isRunning = false; // true while a round of fetching is in progress
let isCatchingUp = false; // true while catching up on a missed round

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// True if this symbol was saved or tried within the last minGap minutes
function isRecent(symbol, minGap) {
  const latest = getLatestPrice(symbol); // undefined if no price is saved yet
  const savedAt = latest ? Date.parse(latest.fetched_at) : 0;
  const lastTime = Math.max(savedAt, lastTried.get(symbol) ?? 0);
  return Date.now() - lastTime < minGap * 60 * 1000;
}

// Fetches and saves every symbol once, skipping those fetched within minGap minutes
// (0 = skip none). Never throws, so it can't crash the server.
export async function fetchAllPrices(minGap = 0) {
  // If the last round is still going, skip this one
  if (isRunning) {
    console.log('[prices] The previous round is still running, skipping this one.');
    return;
  }
  isRunning = true;

  try {
    const symbols = getSymbolsToFetch().filter((symbol) => !isRecent(symbol, minGap));
    console.log(`[prices] ${new Date().toISOString()} Fetching ${symbols.length} symbol(s)`);

    for (const symbol of symbols) {
      // This inner try/catch means one bad symbol doesn't stop the others
      try {
        lastTried.set(symbol, Date.now());
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

// Fetches only the symbols that are due. If a round is in progress, waits for it
// first, so a share added in the middle of a round isn't missed.
export async function fetchDuePrices(minGap = MIN_GAP) {
  while (isRunning) {
    await wait(PAUSE_MS);
  }
  await fetchAllPrices(minGap);
}

// Runs when a scheduled round was missed, usually because the computer was asleep.
// A long sleep can miss many rounds, but we only need to catch up once.
export async function catchUp(delayMs = WAKE_DELAY_MS) {
  if (isCatchingUp) return;
  isCatchingUp = true;
  console.log('[prices] Missed a scheduled round. Catching up shortly.');
  await wait(delayMs);
  await fetchDuePrices(SCHEDULED_MIN_GAP);
  isCatchingUp = false;
}

// Fetches once, then turns the schedule on. Called once, when the server starts.
export function startPriceJob() {
  for (const schedule of SCHEDULES) {
    // The timezone makes this work wherever the computer is
    const task = cron.schedule(schedule, () => fetchDuePrices(SCHEDULED_MIN_GAP), { timezone: 'Asia/Colombo' });
    task.on('execution:missed', () => catchUp());
  }
  console.log('[prices] Job started: every 5 minutes, 9:30-14:30 Colombo time, Monday-Friday');

  fetchDuePrices();
}
