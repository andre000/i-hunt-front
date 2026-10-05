import { useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { removeNpc } from '../../campaign/draft'
import { itemUpdated, npcRemoved } from '../../store/editor'
import { AvatarField } from './fields'

function DeleteNpc({ draft, index, onCancel, onRemoved }) {
  const dispatch = useDispatch()
  const npc = draft.npcs[index]
  const result = removeNpc(draft, index)

  if (!result.ok) {
    return (
      <section className="editor__delete" role="alert">
        <p>
          {npc.name} tem {result.messages === 1 ? '1 mensagem' : `${result.messages} mensagens`}.
          Apague as mensagens ou troque o NPC delas antes de apagá-lo.
        </p>
        <div className="editor__actions">
          <button type="button" className="button secondary" onClick={onCancel}>Entendi</button>
        </div>
      </section>
    )
  }

  const remove = () => {
    onRemoved()
    dispatch(npcRemoved(index))
  }

  return (
    <section className="editor__delete" role="alertdialog" aria-label={`Apagar ${npc.name}?`}>
      <h2>Apagar {npc.name}?</h2>
      <div className="editor__actions">
        <button type="button" className="button danger" onClick={remove}>Apagar</button>
        <button type="button" className="button secondary" onClick={onCancel}>Cancelar</button>
      </div>
    </section>
  )
}

DeleteNpc.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRemoved: PropTypes.func.isRequired,
}

export function NpcForm({ draft, index, onRemoved }) {
  const dispatch = useDispatch()
  const [deleting, setDeleting] = useState(false)
  const npc = draft.npcs[index]
  const update = (changes) => dispatch(itemUpdated({ section: 'npcs', index, changes }))

  return (
    <form className="editor__form" onSubmit={e => e.preventDefault()}>
      <h1>{npc.name || '(sem nome)'}</h1>
      <code className="editor__id">{npc.id}</code>
      <label>
        <span>Nome</span>
        <input value={npc.name ?? ''} onChange={e => update({ name: e.target.value })} />
      </label>
      <AvatarField person={npc} onChange={avatar => update({ avatar })} />
      {deleting
        ? <DeleteNpc draft={draft} index={index} onCancel={() => setDeleting(false)} onRemoved={onRemoved} />
        : (
          <div className="editor__actions">
            <button type="button" className="button secondary" onClick={() => setDeleting(true)}>Apagar NPC</button>
          </div>
        )}
    </form>
  )
}

NpcForm.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemoved: PropTypes.func.isRequired,
}
