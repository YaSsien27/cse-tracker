import { useSyncExternalStore } from 'react'
import { dismissToast, getToasts, subscribe } from '../toast.js'

const icons = { success: '✓', error: '!', info: 'i' }

// Draws the toasts in the corner of the screen
function Toaster() {
  // Redraws this component whenever the list in toast.js changes
  const toasts = useSyncExternalStore(subscribe, getToasts)

  return (
    // aria-live makes screen readers read new toasts aloud
    <div className="toaster" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type} ${toast.leaving ? 'leaving' : ''}`}>
          <span className="toast-icon" aria-hidden="true">{icons[toast.type]}</span>
          <p>{toast.message}</p>
          <button type="button" aria-label="Close message" onClick={() => dismissToast(toast.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

export default Toaster
