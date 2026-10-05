import { useState } from 'react'
import PropTypes from 'prop-types'

export function NewItemForm({ title, onAdd }) {
  const [name, setName] = useState('')

  return (
    <form
      className="editor__form"
      onSubmit={e => {
        e.preventDefault()
        onAdd({ name: name.trim() })
      }}
    >
      <h1>{title}</h1>
      <label>
        <span>Nome</span>
        <input required autoFocus value={name} onChange={e => setName(e.target.value)} />
      </label>
      <div className="editor__actions">
        <button type="submit" className="button primary">Adicionar</button>
      </div>
    </form>
  )
}

NewItemForm.propTypes = {
  title: PropTypes.string.isRequired,
  onAdd: PropTypes.func.isRequired,
}
