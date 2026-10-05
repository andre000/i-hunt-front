import PropTypes from 'prop-types'

export function DeleteItem({ name, onConfirm, onCancel }) {
  return (
    <section className="editor__delete" role="alertdialog" aria-label={`Apagar ${name}?`}>
      <h2>Apagar {name}?</h2>
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
}
