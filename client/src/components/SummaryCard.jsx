import { formatMoney, formatPercent, formatProfit, profitClass } from '../format.js'

// The card showing total value and total profit/loss
function SummaryCard({ total, holdingCount }) {
  // If no holding has a price yet, show dashes instead of a misleading 0
  const nothingPriced = holdingCount > 0 && total.holdings_without_price === holdingCount
  const value = nothingPriced ? null : total.current_value
  const profitLoss = nothingPriced ? null : total.profit_loss

  return (
    <section className="card summary">
      <div>
        <h2>Total value</h2>
        <p className="big-number">{formatMoney(value)}</p>
      </div>
      <div>
        <h2>Total profit/loss</h2>
        <p className={`big-number ${profitClass(profitLoss)}`}>
          {formatProfit(profitLoss)}
          {total.profit_loss_percent !== null && <small> ({formatPercent(total.profit_loss_percent)})</small>}
        </p>
      </div>
      {total.holdings_without_price > 0 && (
        <p className="note">
          Holdings with no saved price yet, not counted here: {total.holdings_without_price}
        </p>
      )}
    </section>
  )
}

export default SummaryCard
