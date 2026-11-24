import { useEffect, useId, useRef } from 'react'
import Toaster from './Toaster.jsx'

// A pop-up window. It uses the browser's own <dialog>, which keeps the keyboard
// inside the pop-up and closes it when Esc is pressed.
function Modal({ title, onClose, children }) {
  const dialogRef = useRef(null)
  const openerRef = useRef(null) // the button that opened the pop-up
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog.open) {
      openerRef.current = document.activeElement
      dialog.showModal()
    }
    // When the pop-up goes away, put the keyboard back where it was
    return () => {
      if (!dialog.isConnected) openerRef.current?.focus()
    }
  }, [])

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} onClose={onClose}>
      <div className="modal-box">
        <h2 id={titleId}>{title}</h2>
        {children}
      </div>
      {/* A pop-up covers the whole page, so it needs its own copy of the toasts */}
      <Toaster />
    </dialog>
  )
}

export default Modal
