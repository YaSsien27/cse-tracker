// The API: web addresses the frontend will use to read and change data.
// Every address here starts with /api (that part is added in index.js).
import express from 'express';
import {
  saveHolding,
  getHoldings,
  getHolding,
  updateHolding,
  deleteHolding,
  getLatestPrice,
  getPrices,
  saveAlert,
  getAlert,
  getAlerts,
} from './db.js';
import { calculateHolding, calculateTotal } from './portfolio.js';

const router = express.Router();

// Lets us read JSON sent by the browser, as req.body
router.use(express.json());

// Checks for a real date written as YYYY-MM-DD
function isRealDate(text) {
  if (typeof text !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  // An impossible date like 2026-02-30 is invalid, or moves to another day
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text);
}

// Checks that a symbol looks right, such as JKH.N0000
function isValidSymbol(symbol) {
  return typeof symbol === 'string' && /^[A-Z0-9]+\.[A-Z][0-9]{4}$/i.test(symbol.trim());
}

// Returns a message saying what is wrong, or null if everything is fine
function findProblem(body) {
  const { symbol, quantity, buy_price, buy_date } = body ?? {};

  if (!isValidSymbol(symbol)) {
    return 'symbol must look like JKH.N0000';
  }
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    return 'quantity must be a whole number above 0';
  }
  if (!Number.isFinite(buy_price) || buy_price < 0) {
    return 'buy_price must be a number, 0 or more';
  }
  if (!isRealDate(buy_date)) {
    return 'buy_date must be a real date written as YYYY-MM-DD';
  }
  return null;
}

// --- Holdings ---

// List all holdings
router.get('/holdings', (req, res) => {
  res.json(getHoldings());
});

// Add a holding. Status 201 means "created".
router.post('/holdings', (req, res) => {
  const problem = findProblem(req.body);
  if (problem) return res.status(400).json({ error: problem }); // 400 = bad request

  const { symbol, quantity, buy_price, buy_date } = req.body;
  const id = saveHolding(symbol, quantity, buy_price, buy_date);
  res.status(201).json(getHolding(id));
});

// Edit a holding (send all four fields)
router.put('/holdings/:id', (req, res) => {
  const problem = findProblem(req.body);
  if (problem) return res.status(400).json({ error: problem });

  const { symbol, quantity, buy_price, buy_date } = req.body;
  const wasFound = updateHolding(req.params.id, symbol, quantity, buy_price, buy_date);
  if (!wasFound) return res.status(404).json({ error: 'Holding not found' });

  res.json(getHolding(req.params.id));
});

// Delete a holding. Status 204 means "done, nothing to send back".
router.delete('/holdings/:id', (req, res) => {
  const wasFound = deleteHolding(req.params.id);
  if (!wasFound) return res.status(404).json({ error: 'Holding not found' });

  res.status(204).end();
});

// --- Portfolio ---

// Every holding with its profit/loss, plus the total
router.get('/portfolio', (req, res) => {
  const holdings = getHoldings().map((holding) => {
    const latest = getLatestPrice(holding.symbol); // undefined if no price is saved yet
    const currentPrice = latest ? latest.price : null;

    return {
      ...holding,
      current_price: currentPrice,
      price_fetched_at: latest ? latest.fetched_at : null,
      ...calculateHolding(holding.quantity, holding.buy_price, currentPrice),
    };
  });

  res.json({ holdings, total: calculateTotal(holdings) });
});

// --- Prices ---

// The saved price history of one symbol, oldest first
router.get('/prices/:symbol', (req, res) => {
  res.json(getPrices(req.params.symbol));
});

// --- Alerts ---

// List all alerts
router.get('/alerts', (req, res) => {
  res.json(getAlerts());
});

// Create an alert
router.post('/alerts', (req, res) => {
  const { symbol, target_price, direction } = req.body ?? {};

  if (!isValidSymbol(symbol)) {
    return res.status(400).json({ error: 'symbol must look like JKH.N0000' });
  }
  if (!Number.isFinite(target_price) || target_price <= 0) {
    return res.status(400).json({ error: 'target_price must be a number above 0' });
  }
  if (direction !== 'above' && direction !== 'below') {
    return res.status(400).json({ error: "direction must be 'above' or 'below'" });
  }

  const id = saveAlert(symbol, target_price, direction);
  res.status(201).json(getAlert(id));
});

// --- Problems ---

// No address above matched
router.use((req, res) => {
  res.status(404).json({ error: 'API address not found' });
});

// Something went wrong above. Express knows this handles errors because it has 4 inputs.
router.use((error, req, res, next) => {
  // Mistakes in the request, such as broken JSON
  if (error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: 'The request could not be read. Is the JSON valid?' });
  }
  // Our own fault: log the details, but don't show them to the user
  console.error('[api]', error);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

export default router;
