// Checks that the database functions work.
// How to run:  npm run check-db

// Use a temporary database in memory, so your real data is never touched.
// This must be set before db.js is loaded, so we use "await import" below.
process.env.DB_FILE = ':memory:';
const db = await import('./db.js');

// Save one or two rows in each table, then read them back
db.saveHolding('jkh.n0000', 100, 18.5, '2026-11-20');
console.log('Holdings:');
console.table(db.getHoldings());

db.savePrice('JKH.N0000', 18.4);
db.savePrice('JKH.N0000', 18.7);
console.log('Prices:');
console.table(db.getPrices('JKH.N0000'));

db.saveAlert('JKH.N0000', 20, 'above');
console.log('Alerts:');
console.table(db.getAlerts());

// Try to save bad data. Each of these should be rejected.
function expectRejected(description, action) {
  try {
    action();
  } catch {
    console.log(`OK: rejected ${description}`);
    return;
  }
  console.error(`PROBLEM: accepted ${description}`);
  process.exitCode = 1;
}

expectRejected('a negative quantity', () => db.saveHolding('JKH.N0000', -5, 18, '2026-11-20'));
expectRejected('text as a quantity', () => db.saveHolding('JKH.N0000', 'abc', 18, '2026-11-20'));
expectRejected('an impossible date', () => db.saveHolding('JKH.N0000', 5, 18, '2026-02-30'));
expectRejected('an empty symbol', () => db.savePrice('  ', 18));
expectRejected('a price of zero', () => db.savePrice('JKH.N0000', 0));
expectRejected('a wrong alert direction', () => db.saveAlert('JKH.N0000', 20, 'sideways'));
