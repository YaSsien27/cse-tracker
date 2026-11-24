import { useState } from 'react'
import { addHolding } from '../api.js'
import { todayInColombo } from '../format.js'

const emptyForm = { symbol: '', quantity: '', buy_price: '', buy_date: '' }

// The form for adding a holding. Calls onAdded() after it is saved.
function HoldingForm({ onAdded }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Update one field, keeping the others the same
  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setError('')
    setIsSaving(true)
    try {
      // Form fields are always text, so turn the numbers into real numbers
      await addHolding({
        ...form,
        quantity: Number(form.quantity),
        buy_price: Number(form.buy_price),
      })
      setForm(emptyForm)
      onAdded()
    } catch (error) {
      setError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="card">
      <h2>Add a holding</h2>
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
        <button disabled={isSaving}>{isSaving ? 'Saving...' : 'Add'}</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  )
}

export default HoldingForm
