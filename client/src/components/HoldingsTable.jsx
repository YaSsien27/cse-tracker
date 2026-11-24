import { useState } from 'react'
import { deleteHolding } from '../api.js'
import { formatMoney, formatPercent, formatProfit, profitClass } from '../format.js'
import { showToast } from '../toast.js'
import DeleteModal from './DeleteModal.jsx'
import HoldingForm from './HoldingForm.jsx'
import Modal from './Modal.jsx'

// The table of holdings. Clicking a symbol shows its chart.
// Calls onChanged() after a holding is edited or deleted.
function HoldingsTable({ holdings, selectedSymbol, onSelect, onChanged }) {
  const [editing, setEditing] = useState(null) // the holding in the edit pop-up
  const [deleting, setDeleting] = useState(null) // the holding in the delete pop-up

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
                <th className="number">Actions</th>
              </tr>
            </thead>
            <tbody>
              {holdings.map((holding) => (
                <tr key={holding.id} className={holding.symbol === selectedSymbol ? 'selected' : ''}>
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
                  <td className="number">
                    <span className={`pill ${profitClass(holding.profit_loss)}`}>{formatPercent(holding.profit_loss_percent)}</span>
                  </td>
                  <td className="actions">
                    <button type="button" aria-label={`Edit ${holding.symbol}`} onClick={() => setEditing(holding)}>Edit</button>
                    <button type="button" className="delete" aria-label={`Delete ${holding.symbol}`} onClick={() => setDeleting(holding)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title="Edit holding" onClose={() => setEditing(null)}>
          <HoldingForm
            holding={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              onChanged()
            }}
          />
        </Modal>
      )}

      {deleting && (
        <DeleteModal
          title="Delete holding?"
          message={`${deleting.quantity.toLocaleString('en-US')} × ${deleting.symbol}, bought ${deleting.buy_date}`}
          onDelete={() => deleteHolding(deleting.id)}
          onDeleted={() => {
            showToast('success', `${deleting.symbol} deleted from your holdings.`)
            setDeleting(null)
            onChanged()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

export default HoldingsTable
