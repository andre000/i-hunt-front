import PropTypes from 'prop-types'
import { Avatar } from '../Avatar'

const optional = (value) => (value.trim() === '' ? undefined : value)

export function AvatarField({ person, onChange }) {
  return (
    <div className="editor__avatar">
      <span role="img" aria-label="Prévia do avatar">
        <Avatar person={{ name: person.name || '?', avatar: person.avatar }} size={56} />
      </span>
      <label>
        <span>Avatar (endereço da imagem)</span>
        <input type="url" value={person.avatar ?? ''} onChange={e => onChange(optional(e.target.value))} />
      </label>
    </div>
  )
}

AvatarField.propTypes = {
  person: PropTypes.shape({ name: PropTypes.string, avatar: PropTypes.string }).isRequired,
  onChange: PropTypes.func.isRequired,
}

export function HunterPicker({ legend, hunters, selected, onChange }) {
  const picked = Array.isArray(selected) ? selected : []
  const toggle = (id) => onChange(picked.includes(id) ? picked.filter(item => item !== id) : [...picked, id])

  return (
    <fieldset className="editor__picker">
      <legend>{legend}</legend>
      {hunters.length === 0 && <p>Nenhum hunter na campanha.</p>}
      {hunters.map(hunter => (
        <label key={hunter.id}>
          <input type="checkbox" checked={picked.includes(hunter.id)} onChange={() => toggle(hunter.id)} />
          <span>{hunter.name || hunter.id}</span>
        </label>
      ))}
    </fieldset>
  )
}

HunterPicker.propTypes = {
  legend: PropTypes.string.isRequired,
  hunters: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
}
