// Keeps the list of toasts (small pop-up messages).
// Any file can call showToast(). Toaster.jsx draws them on the screen.

const LEAVE_MS = 250 // time for the closing animation (same as in index.css)
const MAX_TOASTS = 4

let toasts = []
let nextId = 1
const listeners = new Set() // functions to call when the list changes

function setToasts(newToasts) {
  toasts = newToasts
  listeners.forEach((listener) => listener())
}

// type is 'success', 'error' or 'info'.
// A sticky toast stays until it is closed, instead of disappearing by itself.
export function showToast(type, message, sticky = false) {
  // If the same message is already showing, replace it instead of stacking copies
  const same = toasts.find((toast) => toast.message === message)
  const isSticky = sticky || Boolean(same?.sticky)
  const toast = { id: nextId++, type, message, sticky: isSticky, leaving: false }

  let list = [...toasts.filter((item) => item !== same), toast]
  // Too many? Drop the oldest one that isn't sticky
  if (list.length > MAX_TOASTS) {
    const oldest = list.find((item) => !item.sticky)
    list = list.filter((item) => item !== oldest)
  }
  setToasts(list)

  if (!isSticky) {
    // Errors stay longer, so there is time to read them
    setTimeout(() => dismissToast(toast.id), type === 'error' ? 8000 : 4000)
  }
}

// Plays the closing animation, then removes the toast
export function dismissToast(id) {
  setToasts(toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)))
  setTimeout(() => setToasts(toasts.filter((toast) => toast.id !== id)), LEAVE_MS)
}

export function dismissSticky() {
  toasts.filter((toast) => toast.sticky).forEach((toast) => dismissToast(toast.id))
}

// These two let React follow the list (see Toaster.jsx)
export function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getToasts() {
  return toasts
}
