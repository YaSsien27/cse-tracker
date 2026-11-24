// Works out profit and loss. These functions only do maths: they don't use the
// database or the internet, which makes them easy to test.

// Rounds money and percentages to 2 decimal places
function round(number) {
  return Math.round(number * 100) / 100;
}

// Profit/loss as a percentage of what was paid.
// If the cost is 0 (free shares), a percentage makes no sense, so use null.
function percentOf(profitLoss, cost) {
  return cost === 0 ? null : round((profitLoss / cost) * 100);
}

// Profit/loss for one holding.
// currentPrice is null when we have not saved a price for the share yet.
export function calculateHolding(quantity, buyPrice, currentPrice) {
  const cost = quantity * buyPrice;

  if (currentPrice === null) {
    return { cost: round(cost), current_value: null, profit_loss: null, profit_loss_percent: null };
  }

  const currentValue = quantity * currentPrice;
  const profitLoss = currentValue - cost;

  return {
    cost: round(cost),
    current_value: round(currentValue),
    profit_loss: round(profitLoss),
    profit_loss_percent: percentOf(profitLoss, cost),
  };
}

// Adds up a list of holdings. Each one needs quantity, buy_price and current_price.
// Holdings without a price are left out, otherwise they would look like a total loss.
export function calculateTotal(holdings) {
  const priced = holdings.filter((holding) => holding.current_price !== null);

  let cost = 0;
  let currentValue = 0;
  for (const holding of priced) {
    cost += holding.quantity * holding.buy_price;
    currentValue += holding.quantity * holding.current_price;
  }
  const profitLoss = currentValue - cost;

  return {
    cost: round(cost),
    current_value: round(currentValue),
    profit_loss: round(profitLoss),
    profit_loss_percent: percentOf(profitLoss, cost),
    holdings_without_price: holdings.length - priced.length,
  };
}
