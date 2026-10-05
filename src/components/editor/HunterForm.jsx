import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { Avatar } from '../Avatar'
import { hunterImpact } from '../../campaign/draft'
import { hunterRemoved, itemUpdated } from '../../store/editor'

const optional = (value) => (value.trim() === '' ? undefined : value)
const optionalNumber = (value) => (value === '' ? undefined : Number(value))

function DeleteHunter({ draft, index, onCancel, onRemoved }) {
  const dispatch = useDispatch()
  const hunter = draft.hunters[index]
  const impact = hunterImpact(draft, index)
  const remove = () => {
    onRemoved()
    dispatch(hunterRemoved(index))
  }

  return (
    <section className="editor__delete" role="alertdialog" aria-label={`Apagar ${hunter.name}?`}>
      <h2>Apagar {hunter.name}?</h2>
      {impact.missions.length + impact.messages.length === 0
        ? <p>Este hunter não aparece em nenhuma missão ou mensagem.</p>
        : <p>O hunter vai sair destas missões e mensagens:</p>}
      {impact.missions.length > 0 && (
        <>
          <h3>Missões</h3>
          <ul aria-label="Missões">
            {impact.missions.map((name, at) => <li key={at}>{name}</li>)}
          </ul>
        </>
      )}
      {impact.messages.length > 0 && (
        <>
          <h3>Mensagens</h3>
          <ul aria-label="Mensagens">
            {impact.messages.map((text, at) => <li key={at}>{text}</li>)}
          </ul>
        </>
      )}
      {impact.withoutRecipient.length > 0 && (
        <p className="editor__warning">
          {impact.withoutRecipient.length === 1
            ? '1 mensagem ficaria sem destinatário. Ela vai aparecer nos erros para você decidir o que fazer.'
            : `${impact.withoutRecipient.length} mensagens ficariam sem destinatário. Elas vão aparecer nos erros para você decidir o que fazer.`}
        </p>
      )}
      <div className="editor__actions">
        <button type="button" className="button danger" onClick={remove}>Apagar</button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </section>
  )
}

DeleteHunter.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRemoved: PropTypes.func.isRequired,
}

export function HunterForm({ draft, index, onRemoved }) {
  const dispatch = useDispatch()
  const [deleting, setDeleting] = useState(false)
  const hunter = draft.hunters[index]
  const update = (changes) => dispatch(itemUpdated({ section: 'hunters', index, changes }))

  return (
    <form className="editor__form" onSubmit={e => e.preventDefault()}>
      <h1>{hunter.name || '(sem nome)'}</h1>
      <code className="editor__id">{hunter.id}</code>
      <label>
        <span>Nome</span>
        <input value={hunter.name ?? ''} onChange={e => update({ name: e.target.value })} />
      </label>
      <div className="editor__avatar">
        <span role="img" aria-label="Prévia do avatar">
          <Avatar person={{ name: hunter.name || '?', avatar: hunter.avatar }} size={56} />
        </span>
        <label>
          <span>Avatar (endereço da imagem)</span>
          <input type="url" value={hunter.avatar ?? ''} onChange={e => update({ avatar: optional(e.target.value) })} />
        </label>
      </div>
      <label className="editor__short">
        <span>Avaliação (0 a 5)</span>
        <input
          type="number"
          min="0"
          max="5"
          step="0.1"
          value={hunter.rating ?? ''}
          onChange={e => update({ rating: optionalNumber(e.target.value) })}
        />
      </label>
      {deleting
        ? <DeleteHunter draft={draft} index={index} onCancel={() => setDeleting(false)} onRemoved={onRemoved} />
        : (
          <div className="editor__actions">
            <button type="button" className="button secondary" onClick={() => setDeleting(true)}>Apagar hunter</button>
          </div>
        )}
    </form>
  )
}

HunterForm.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemoved: PropTypes.func.isRequired,
}
