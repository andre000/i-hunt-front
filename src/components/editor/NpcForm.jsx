import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import { removeNpc } from '../../campaign/draft'
import { itemUpdated, npcRemoved } from '../../store/editor'
import { AvatarField } from './fields'
import { DeleteButton, DeleteItem } from './DeleteItem'

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

  return <DeleteItem name={npc.name} onConfirm={remove} onCancel={onCancel} />
}

DeleteNpc.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onCancel: PropTypes.func.isRequired,
  onRemoved: PropTypes.func.isRequired,
}

export function NpcForm({ draft, index, onRemoved }) {
  const dispatch = useDispatch()
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
      <DeleteButton label="Apagar NPC">
        {close => <DeleteNpc draft={draft} index={index} onCancel={close} onRemoved={onRemoved} />}
      </DeleteButton>
    </form>
  )
}

NpcForm.propTypes = {
  draft: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  onRemoved: PropTypes.func.isRequired,
}
