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
