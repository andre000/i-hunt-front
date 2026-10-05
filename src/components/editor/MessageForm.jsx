import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { dateFromInput, dateToInput, messageScheduled } from '../../campaign/draft'
import { itemRemoved, itemUpdated } from '../../store/editor'
import { DeleteButton, DeleteItem } from './DeleteItem'
import { HunterPicker } from './fields'

export function MessageBadge({ draft, index }) {
  if (!messageScheduled(draft, index)) return null
  return <span className="editor__badge editor__badge--scheduled">Agendado</span>
}

MessageBadge.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
}

function NpcSelect({ npcs, value, onChange }) {
  const known = npcs.some(npc => npc.id === value)
  return (
    <label>
      <span>NPC</span>
      <select value={known ? value : ''} onChange={e => onChange(e.target.value)}>
        {!known && <option value="">Escolha</option>}
        {npcs.map(npc => <option key={npc.id} value={npc.id}>{npc.name || npc.id}</option>)}
      </select>
    </label>
  )
}

NpcSelect.propTypes = {
  npcs: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, name: PropTypes.string })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
}

export function MessageForm({ draft, index, onRemoved }) {
  const dispatch = useDispatch()
  const message = draft.messages[index]
  const campaignDate = draft.campaign.date
  const toAll = message.to === 'all'
  const update = (changes) => dispatch(itemUpdated({ section: 'messages', index, changes }))
  const remove = () => {
    onRemoved()
    dispatch(itemRemoved({ section: 'messages', index }))
  }

  return (
    <form className="editor__form" onSubmit={e => e.preventDefault()}>
      <h1>Mensagem</h1>
      <div className="editor__meta">
        <code className="editor__id">{message.id}</code>
        {messageScheduled(draft, index) && <span className="editor__badge editor__badge--scheduled">Agendado</span>}
      </div>
      <div className="editor__row">
        <NpcSelect npcs={draft.npcs} value={message.npc} onChange={npc => update({ npc })} />
        <label>
          <span>Hora</span>
          <input
            type="datetime-local"
            value={dateToInput(message.sentAt, campaignDate)}
            onChange={e => update({ sentAt: dateFromInput(e.target.value, campaignDate) })}
          />
        </label>
      </div>
      <fieldset className="editor__picker" role="radiogroup" aria-label="Destinatários">
        <legend>Destinatários</legend>
        <label>
          <input type="radio" name="to" checked={toAll} onChange={() => update({ to: 'all' })} />
          <span>Todos os hunters</span>
        </label>
        <label>
          <input type="radio" name="to" checked={!toAll} onChange={() => update({ to: [] })} />
          <span>Hunters específicos</span>
        </label>
      </fieldset>
      {!toAll && (
        <HunterPicker legend="Para" hunters={draft.hunters} selected={message.to} onChange={to => update({ to })} />
      )}
      <label>
        <span>Texto</span>
        <textarea rows={5} value={message.text ?? ''} onChange={e => update({ text: e.target.value })} />
      </label>
      <DeleteButton label="Apagar mensagem">
        {close => <DeleteItem name="esta mensagem" onConfirm={remove} onCancel={close} />}
      </DeleteButton>
    </form>
  )
}

MessageForm.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemoved: PropTypes.func.isRequired,
}

export function NewMessageForm({ npcs, onAdd }) {
  const [npc, setNpc] = useState(npcs[0]?.id ?? '')

  if (npcs.length === 0) {
    return (
      <div className="editor__form">
        <h1>Nova mensagem</h1>
        <p>Crie um NPC antes: toda mensagem sai de um NPC.</p>
      </div>
    )
  }

  return (
    <form
      className="editor__form"
      onSubmit={e => {
        e.preventDefault()
        onAdd({ npc })
      }}
    >
      <h1>Nova mensagem</h1>
      <NpcSelect npcs={npcs} value={npc} onChange={setNpc} />
      <div className="editor__actions">
        <button type="submit" className="button primary" disabled={!npc}>Adicionar</button>
      </div>
    </form>
  )
}

NewMessageForm.propTypes = {
  npcs: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string })).isRequired,
  onAdd: PropTypes.func.isRequired,
}
