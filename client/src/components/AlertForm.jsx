import { useId, useState } from 'react'
import { addAlert, updateAlert } from '../api.js'
import { formatMoney } from '../format.js'
import { showToast } from '../toast.js'

const emptyForm = { symbol: '', direction: 'above', target_price: '' }

// The form for adding a price alert, or for editing one if "alert" is given.
// Calls onSaved() after it is saved. onCancel adds a Cancel button.
function AlertForm({ alert, symbols, onSaved, onCancel }) {
  const [form, setForm] = useState(alert ?? emptyForm)
  const [isSaving, setIsSaving] = useState(false)
  const listId = useId() // a unique id, as this form can be on the page twice

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setIsSaving(true)
    try {
      const data = {
        symbol: form.symbol,
        direction: form.direction,
        target_price: Number(form.target_price),
      }
      const saved = alert ? await updateAlert(alert.id, data) : await addAlert(data)
      const action = alert ? 'Alert updated' : 'Alert added'
      showToast('success', `${action}: ${saved.symbol} at or ${saved.direction} ${formatMoney(saved.target_price)}`)
      if (!alert) setForm(emptyForm)
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
        {/* The datalist suggests shares you own, but you can type any symbol */}
        <input name="symbol" list={listId} placeholder="JKH.N0000" value={form.symbol} onChange={handleChange} required />
        <datalist id={listId}>
          {symbols.map((symbol) => <option key={symbol} value={symbol} />)}
        </datalist>
      </label>
      <label>
        Tell me when the price is
        <select name="direction" value={form.direction} onChange={handleChange}>
          <option value="above">at or above</option>
          <option value="below">at or below</option>
        </select>
      </label>
      <label>
        Target price (Rs.)
        <input name="target_price" type="number" min="0.01" step="any" value={form.target_price} onChange={handleChange} required />
      </label>
      {alert?.triggered && <p className="note">Saving sets this alert back to Waiting, so it can fire again.</p>}
      <div className="form-buttons">
        {onCancel && <button type="button" className="quiet" onClick={onCancel}>Cancel</button>}
        <button disabled={isSaving}>{isSaving ? 'Saving...' : alert ? 'Save' : 'Add alert'}</button>
      </div>
    </form>
  )
}

export default AlertForm
