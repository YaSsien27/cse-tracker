import { formatMoney, formatPercent, formatProfit, profitClass } from '../format.js'
import AnimatedNumber from './AnimatedNumber.jsx'

// The cards at the top: total value, total profit/loss and total cost
function SummaryCard({ total, holdingCount }) {
  // If no holding has a price yet, show dashes instead of a misleading 0
  const nothingPriced = holdingCount > 0 && total.holdings_without_price === holdingCount
  const value = nothingPriced ? null : total.current_value
  const profitLoss = nothingPriced ? null : total.profit_loss
  const cost = nothingPriced ? null : total.cost

  return (
    <section className="summary" aria-label="Portfolio summary">
      <div className="card main-total">
        <h2>Total value</h2>
        <p className="big-number"><AnimatedNumber value={value} format={formatMoney} /></p>
      </div>
      <div className="card">
        <h2>Total profit/loss</h2>
        <p className={`big-number ${profitClass(profitLoss)}`}>
          <AnimatedNumber value={profitLoss} format={formatProfit} />
        </p>
        {total.profit_loss_percent !== null && (
          <span className={`pill ${profitClass(profitLoss)}`}>{formatPercent(total.profit_loss_percent)}</span>
        )}
      </div>
      <div className="card">
        <h2>Total cost</h2>
        <p className="big-number"><AnimatedNumber value={cost} format={formatMoney} /></p>
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
