// Sets up the SQLite database and has functions to save and read data.
import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';

// The database is one file next to this one: server/cse_tracker.db
// (DB_FILE lets our check script use a temporary database instead)
const defaultFile = fileURLToPath(new URL('./cse_tracker.db', import.meta.url));
const db = new Database(process.env.DB_FILE || defaultFile);

// Create the tables the first time. After that, this changes nothing.
// CHECK = a rule every row must follow. STRICT = only accept the right data types.
db.exec(`
  CREATE TABLE IF NOT EXISTS holdings (
    id        INTEGER PRIMARY KEY,
    symbol    TEXT    NOT NULL CHECK (symbol <> ''),
    quantity  INTEGER NOT NULL CHECK (quantity > 0),
    buy_price REAL    NOT NULL CHECK (buy_price >= 0),
    buy_date  TEXT    NOT NULL CHECK (buy_date IS date(buy_date)) -- YYYY-MM-DD
  ) STRICT;

  CREATE TABLE IF NOT EXISTS prices (
    id         INTEGER PRIMARY KEY,
    symbol     TEXT NOT NULL CHECK (symbol <> ''),
    price      REAL NOT NULL CHECK (price > 0),
    fetched_at TEXT NOT NULL -- date and time in UTC
  ) STRICT;

  CREATE TABLE IF NOT EXISTS alerts (
    id           INTEGER PRIMARY KEY,
    symbol       TEXT    NOT NULL CHECK (symbol <> ''),
    target_price REAL    NOT NULL CHECK (target_price > 0),
    direction    TEXT    NOT NULL CHECK (direction IN ('above', 'below')),
    triggered    INTEGER NOT NULL DEFAULT 0 CHECK (triggered IN (0, 1)) -- 0 = no, 1 = yes
  ) STRICT;
`);

// Makes " jkh.n0000 " and "JKH.N0000" count as the same symbol
function cleanSymbol(symbol) {
  return symbol.trim().toUpperCase();
}

// The "?" marks below are filled in safely with the values given to .run() or .all().
// Each save function returns the id of the new row.

// --- Holdings: the shares you own ---

export function saveHolding(symbol, quantity, buyPrice, buyDate) {
  const result = db
    .prepare('INSERT INTO holdings (symbol, quantity, buy_price, buy_date) VALUES (?, ?, ?, ?)')
    .run(cleanSymbol(symbol), quantity, buyPrice, buyDate);
  return result.lastInsertRowid;
}

export function getHoldings() {
  return db.prepare('SELECT * FROM holdings ORDER BY id').all();
}

// One holding, or undefined if there is none with this id
export function getHolding(id) {
  return db.prepare('SELECT * FROM holdings WHERE id = ?').get(id);
}

// Returns true if the holding existed and was changed
export function updateHolding(id, symbol, quantity, buyPrice, buyDate) {
  const result = db
    .prepare('UPDATE holdings SET symbol = ?, quantity = ?, buy_price = ?, buy_date = ? WHERE id = ?')
    .run(cleanSymbol(symbol), quantity, buyPrice, buyDate, id);
  return result.changes > 0;
}

// Returns true if the holding existed and was deleted
export function deleteHolding(id) {
  const result = db.prepare('DELETE FROM holdings WHERE id = ?').run(id);
  return result.changes > 0;
}

// The symbols that need prices: shares you own, plus shares with a waiting alert.
// UNION joins the two lists and removes repeats.
export function getSymbolsToFetch() {
  const rows = db
    .prepare(
      `SELECT symbol FROM holdings
       UNION
       SELECT symbol FROM alerts WHERE triggered = 0
       ORDER BY symbol`
    )
    .all();
  return rows.map((row) => row.symbol);
}

// --- Prices: the price history of each share ---

// The time is added automatically
export function savePrice(symbol, price) {
  const fetchedAt = new Date().toISOString(); // e.g. 2026-11-24T12:30:00.000Z
  const result = db
    .prepare('INSERT INTO prices (symbol, price, fetched_at) VALUES (?, ?, ?)')
    .run(cleanSymbol(symbol), price, fetchedAt);
  return result.lastInsertRowid;
}

// All saved prices for one symbol, oldest first
export function getPrices(symbol) {
  return db
    .prepare('SELECT * FROM prices WHERE symbol = ? ORDER BY fetched_at, id')
    .all(cleanSymbol(symbol));
}

// The newest saved price for one symbol, or undefined if there is none
export function getLatestPrice(symbol) {
  return db
    .prepare('SELECT * FROM prices WHERE symbol = ? ORDER BY fetched_at DESC, id DESC LIMIT 1')
    .get(cleanSymbol(symbol));
}

// --- Alerts: your price targets ---

// direction must be 'above' or 'below'. New alerts start as not triggered.
export function saveAlert(symbol, targetPrice, direction) {
  const result = db
    .prepare('INSERT INTO alerts (symbol, target_price, direction) VALUES (?, ?, ?)')
    .run(cleanSymbol(symbol), targetPrice, direction);
  return result.lastInsertRowid;
}

// One alert, or undefined if there is none with this id
export function getAlert(id) {
  return getAlerts().find((alert) => alert.id === id);
}

// Remember that an alert has fired, so it never fires again
export function markAlertTriggered(id) {
  db.prepare('UPDATE alerts SET triggered = 1 WHERE id = ?').run(id);
}

export function getAlerts() {
  const rows = db.prepare('SELECT * FROM alerts ORDER BY id').all();
  // SQLite has no true/false type, so turn 0 or 1 into false or true
  return rows.map((row) => ({ ...row, triggered: row.triggered === 1 }));
}
