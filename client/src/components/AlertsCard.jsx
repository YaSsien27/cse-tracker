import { useEffect, useState } from 'react'
import { addAlert, getAlerts } from '../api.js'
import { formatMoney } from '../format.js'

const REFRESH_MS = 60 * 1000 // reload from our own server every minute
const emptyForm = { symbol: '', direction: 'above', target_price: '' }

// The form for creating price alerts, and the list of alerts
function AlertsCard({ symbols }) {
  const [alerts, setAlerts] = useState(null) // null means "not loaded yet"
  const [form, setForm] = useState(emptyForm)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [addCount, setAddCount] = useState(0) // goes up when an alert is added

  // Load at the start, when an alert is added, and every minute
  useEffect(() => {
    let ignore = false // becomes true if a newer load has replaced this one

    async function load() {
      try {
        const data = await getAlerts()
        if (ignore) return
        setAlerts(data)
        setLoadError('')
      } catch (error) {
        if (!ignore) setLoadError(error.message)
      }
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [addCount])

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value })
  }

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setSaveError('')
    setIsSaving(true)
    try {
      await addAlert({ ...form, target_price: Number(form.target_price) })
      setForm(emptyForm)
      setAddCount(addCount + 1)
    } catch (error) {
      setSaveError(error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="card">
      <h2>Price alerts</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Symbol
          {/* The datalist suggests shares you own, but you can type any symbol */}
          <input name="symbol" list="alert-symbols" placeholder="JKH.N0000" value={form.symbol} onChange={handleChange} required />
          <datalist id="alert-symbols">
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
        <button disabled={isSaving}>{isSaving ? 'Saving...' : 'Add alert'}</button>
      </form>
      {saveError && <p className="error" role="alert">{saveError}</p>}
      {loadError && <p className="error" role="alert">{loadError}</p>}

      {alerts?.length === 0 && <p className="note alert-list">No alerts yet.</p>}
      {alerts?.length > 0 && (
        <div className="table-scroll alert-list">
          <table>
            <thead>
              <tr>
                <th>Symbol</th>
                <th>When price is</th>
                <th className="number">Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.symbol}</td>
                  <td>at or {alert.direction}</td>
                  <td className="number">{formatMoney(alert.target_price)}</td>
                  <td>{alert.triggered ? 'Triggered' : 'Waiting'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default AlertsCard
