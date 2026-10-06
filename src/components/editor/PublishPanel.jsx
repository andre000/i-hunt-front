import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { publishCancelled, publishDraft } from '../../store/editor'

function PasswordForm() {
  const dispatch = useDispatch()
  const [password, setPassword] = useState('')

  return (
    <form
      className="editor__confirm"
      aria-label="Senha de publicação"
      onSubmit={e => {
        e.preventDefault()
        dispatch(publishDraft(password))
      }}
    >
      <label className="editor__password">
        <span>Senha de publicação</span>
        <input type="password" required autoFocus value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      <button type="submit" className="button primary">Publicar com esta senha</button>
      <button type="button" className="button secondary" onClick={() => dispatch(publishCancelled())}>Cancelar</button>
    </form>
  )
}

export function PublishPanel() {
  const publishing = useSelector(state => state.editor.publishing)

  if (publishing === 'password') return <PasswordForm />
  if (publishing === 'done') return <p className="editor__published" role="status">Publicado.</p>
  if (publishing === 'failed') {
    return <p className="editor__publish-error" role="alert">Não deu para publicar. O rascunho continua salvo.</p>
  }
  return null
}
