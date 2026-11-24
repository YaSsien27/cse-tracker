import { formatMoney, formatPercent, formatProfit, profitClass } from '../format.js'

// The table of holdings. Clicking a symbol shows its chart.
function HoldingsTable({ holdings, selectedSymbol, onSelect }) {
  return (
    <section className="card">
      <h2>Holdings</h2>
      {holdings.length === 0 ? (
        <p className="note">No holdings yet. Add your first one using the form.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Buy date</th>
                <th className="number">Quantity</th>
                <th className="number">Buy price</th>
                <th className="number">Price now</th>
                <th className="number">Value</th>
                <th className="number">Profit/loss</th>
                <th className="number">%</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.id}>
                  <td>
                    <button
                      className="link"
                      aria-pressed={holding.symbol === selectedSymbol}
                      onClick={() => onSelect(holding.symbol)}
                    >
                      {holding.symbol}
                    </button>
                  </td>
                  <td>{holding.buy_date}</td>
                  <td className="number">{holding.quantity.toLocaleString('en-US')}</td>
                  <td className="number">{formatMoney(holding.buy_price)}</td>
                  <td className="number">{formatMoney(holding.current_price)}</td>
                  <td className="number">{formatMoney(holding.current_value)}</td>
                  <td className={`number ${profitClass(holding.profit_loss)}`}>{formatProfit(holding.profit_loss)}</td>
                  <td className={`number ${profitClass(holding.profit_loss)}`}>{formatPercent(holding.profit_loss_percent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default HoldingsTable
