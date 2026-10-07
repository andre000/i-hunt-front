import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { publishCancelled, publishDraft } from '../../store/editor'

const FAILURES = {
  401: 'Senha errada.',
  400: 'Nome ou arquivo inválido.',
  413: 'Arquivo grande demais para publicar.',
}

const failureMessage = (status) => FAILURES[status] ?? 'Não deu para publicar. O rascunho continua salvo.'

function PasswordForm() {
  const dispatch = useDispatch()
  const failure = useSelector(state => state.editor.publishFailure)
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
      {failure && <p className="editor__publish-error" role="alert">{failureMessage(failure)}</p>}
      <button type="submit" className="button primary">Publicar com esta senha</button>
      <button type="button" className="button secondary" onClick={() => dispatch(publishCancelled())}>Cancelar</button>
    </form>
  )
}

export function PublishPanel() {
  const { publishing, publishFailure } = useSelector(state => state.editor)

  if (publishing === 'password') return <PasswordForm />
  if (publishing === 'done') return <p className="editor__published" role="status">Publicado.</p>
  if (publishing === 'failed') {
    return <p className="editor__publish-error" role="alert">{failureMessage(publishFailure)}</p>
  }
  return null
}
