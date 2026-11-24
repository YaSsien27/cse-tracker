import { useState } from 'react'
import { addHolding, updateHolding } from '../api.js'
import { todayInColombo } from '../format.js'
import { showToast } from '../toast.js'

const emptyForm = { symbol: '', quantity: '', buy_price: '', buy_date: '' }

// The form for adding a holding, or for editing one if "holding" is given.
// Calls onSaved() after it is saved. onCancel adds a Cancel button.
function HoldingForm({ holding, onSaved, onCancel }) {
  const [form, setForm] = useState(holding ?? emptyForm)
  const [isSaving, setIsSaving] = useState(false)

  // Update one field, keeping the others the same
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setIsSaving(true)
    try {
      // Form fields are always text, so turn the numbers into real numbers
      const data = {
        symbol: form.symbol,
        quantity: Number(form.quantity),
        buy_price: Number(form.buy_price),
        buy_date: form.buy_date,
      }
      if (holding) {
        const saved = await updateHolding(holding.id, data)
        showToast('success', `${saved.symbol} updated.`)
      } else {
        const saved = await addHolding(data)
        showToast('success', `${saved.symbol} added to your holdings.`)
        setForm(emptyForm)
      }
      onSaved()
    } catch (error) {
      showToast('error', error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Symbol
        <input name="symbol" placeholder="JKH.N0000" value={form.symbol} onChange={handleChange} required />
      </label>
      <label>
        Quantity
        <input name="quantity" type="number" min="1" step="1" value={form.quantity} onChange={handleChange} required />
      </label>
      <label>
        Buy price (Rs.)
        <input name="buy_price" type="number" min="0" step="any" value={form.buy_price} onChange={handleChange} required />
      </label>
      <label>
        Buy date
        <input name="buy_date" type="date" max={todayInColombo()} value={form.buy_date} onChange={handleChange} required />
      </label>
      <div className="form-buttons">
        {onCancel && <button type="button" className="quiet" onClick={onCancel}>Cancel</button>}
        <button disabled={isSaving}>{isSaving ? 'Saving...' : holding ? 'Save' : 'Add'}</button>
      </div>
    </form>
  )
}

export default HoldingForm
