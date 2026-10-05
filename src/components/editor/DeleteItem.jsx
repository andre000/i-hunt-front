import { useState } from 'react'
import PropTypes from 'prop-types'

export function DeleteItem({ name, onConfirm, onCancel, children }) {
  return (
    <section className="editor__delete" role="alertdialog" aria-label={`Apagar ${name}?`}>
      <h2>Apagar {name}?</h2>
      {children}
      <div className="editor__actions">
        <button type="button" className="button danger" onClick={onConfirm}>Apagar</button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </section>
  )
}

DeleteItem.propTypes = {
  name: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  children: PropTypes.node,
}

export function DeleteButton({ label, children }) {
  const [deleting, setDeleting] = useState(false)
  if (deleting) return children(() => setDeleting(false))
  return (
    <div className="editor__actions">
      <button type="button" className="button secondary" onClick={() => setDeleting(true)}>{label}</button>
    </div>
  )
}

DeleteButton.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
}
