import { useEffect, useState } from 'react'
import { deleteAlert, getAlerts } from '../api.js'
import { formatMoney } from '../format.js'
import { showToast } from '../toast.js'
import AlertForm from './AlertForm.jsx'
import DeleteModal from './DeleteModal.jsx'
import Modal from './Modal.jsx'

const REFRESH_MS = 60 * 1000 // reload from our own server every minute

// The form for creating price alerts, and the list of alerts
function AlertsCard({ symbols }) {
  const [alerts, setAlerts] = useState(null) // null means "not loaded yet"
  const [editing, setEditing] = useState(null) // the alert in the edit pop-up
  const [deleting, setDeleting] = useState(null) // the alert in the delete pop-up
  const [changeCount, setChangeCount] = useState(0) // goes up when an alert changes

  // Load at the start, when an alert changes, and every minute
  useEffect(() => {
    let ignore = false // becomes true if a newer load has replaced this one
    let hasFailed = false // so a failure is shown once, not every minute

    async function load() {
      try {
        const data = await getAlerts()
        if (ignore) return
        setAlerts(data)
        hasFailed = false
      } catch (error) {
        if (ignore || hasFailed) return
        hasFailed = true
        showToast('error', error.message)
      }
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [changeCount])

  function reload() {
    setChangeCount((count) => count + 1)
  }

  return (
    <section className="card">
      <h2>Price alerts</h2>
      <AlertForm symbols={symbols} onSaved={reload} />

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
                <th className="number">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.symbol}</td>
                  <td>at or {alert.direction}</td>
                  <td className="number">{formatMoney(alert.target_price)}</td>
                  <td>
                    <span className={`pill ${alert.triggered ? 'profit' : 'waiting'}`}>{alert.triggered ? 'Triggered' : 'Waiting'}</span>
                  </td>
                  <td className="actions">
                    <button type="button" aria-label={`Edit alert for ${alert.symbol}`} onClick={() => setEditing(alert)}>Edit</button>
                    <button type="button" className="delete" aria-label={`Delete alert for ${alert.symbol}`} onClick={() => setDeleting(alert)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal title="Edit price alert" onClose={() => setEditing(null)}>
          <AlertForm
            alert={editing}
            symbols={symbols}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              reload()
            }}
          />
        </Modal>
      )}

      {deleting && (
        <DeleteModal
          title="Delete price alert?"
          message={`${deleting.symbol} at or ${deleting.direction} ${formatMoney(deleting.target_price)}`}
          onDelete={() => deleteAlert(deleting.id)}
          onDeleted={() => {
            showToast('success', `Alert for ${deleting.symbol} deleted.`)
            setDeleting(null)
            reload()
          }}
          onClose={() => setDeleting(null)}
        />
      )}
    </section>
  )
}

export default AlertsCard
