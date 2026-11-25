// Checks the price job using pretend replies, so CSE is never contacted.
// How to run:  npm run check-job

// Use a temporary database in memory (must be set before db.js is loaded)
process.env.DB_FILE = ':memory:';

// Replace the real fetch: BAD fails, every other symbol costs 18.40
let requestCount = 0;
globalThis.fetch = async (url, options) => {
  requestCount++;
  const symbol = options.body.get('symbol');
  if (symbol === 'BAD.N0000') {
    throw new Error('pretend network failure');
  }
  return Response.json({ reqSymbolInfo: { symbol, name: 'Test', lastTradedPrice: 18.4 } });
};

const db = await import('./db.js');
const { fetchAllPrices, fetchDuePrices, catchUp } = await import('./priceJob.js');

function check(description, passed) {
  console.log(`${passed ? 'OK' : 'PROBLEM'}: ${description}`);
  if (!passed) process.exitCode = 1;
}

// BAD comes before JKH, so this proves the job continues after a failure.
// JKH is bought twice, so this proves it is only fetched once.
db.saveHolding('BAD.N0000', 10, 5, '2026-11-20');
db.saveHolding('JKH.N0000', 10, 18, '2026-11-20');
db.saveHolding('JKH.N0000', 20, 19, '2026-11-23');

// Start two rounds at once: the second should be skipped
await Promise.all([fetchAllPrices(), fetchAllPrices()]);

check('the failed symbol saved no price', db.getPrices('BAD.N0000').length === 0);
check('the job continued and saved JKH', db.getPrices('JKH.N0000').length === 1);
check('each symbol was fetched once and the second round was skipped', requestCount === 2);

// The job must be able to run again afterwards
await fetchAllPrices();
check('the next round runs normally', db.getPrices('JKH.N0000').length === 2);

// Everything was just tried, so nothing is due (not even BAD, which failed)
requestCount = 0;
await fetchDuePrices();
check('symbols tried in the last 5 minutes are skipped', requestCount === 0);

// A share added in the middle of a round is fetched when that round ends
const round = fetchAllPrices();
db.saveHolding('NEW.N0000', 10, 5, '2026-11-25');
await Promise.all([round, fetchDuePrices()]);
check('a share added during a round gets a price', db.getPrices('NEW.N0000').length === 1);

// Waking from a long sleep reports many missed rounds at once: fetch only once
db.saveHolding('WAKE.N0000', 10, 5, '2026-11-25');
requestCount = 0;
await Promise.all([catchUp(0), catchUp(0), catchUp(0)]);
check('missed rounds are caught up with one fetch', requestCount === 1);

// It must be able to catch up again after the next sleep
db.saveHolding('AGAIN.N0000', 10, 5, '2026-11-25');
await catchUp(0);
check('it can catch up again later', db.getPrices('AGAIN.N0000').length === 1);
