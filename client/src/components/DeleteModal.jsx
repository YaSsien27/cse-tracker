import { useState } from 'react'
import { showToast } from '../toast.js'
import Modal from './Modal.jsx'

// Asks "are you sure?" before deleting.
// onDelete does the deleting. onDeleted is called after it worked.
function DeleteModal({ title, message, onDelete, onDeleted, onClose }) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    setIsDeleting(true)
    try {
      await onDelete()
      onDeleted()
    } catch (error) {
      showToast('error', error.message)
      setIsDeleting(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <p className="modal-message">{message}</p>
        <div className="form-buttons">
          <button type="button" className="quiet" onClick={onClose}>Cancel</button>
          <button className="danger" disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default DeleteModal
