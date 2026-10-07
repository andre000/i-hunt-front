import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { choosePublishName, publishCancelled, publishDraft } from '../../store/editor'
import { isCampaignName } from '../../campaign/publisher'
import { InviteBox } from '../gm/InviteBox'

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

function NameForm() {
  const dispatch = useDispatch()
  const suggested = useSelector(state => state.editor.publishName ?? state.editor.fileName)
  const live = useSelector(state => state.editor.publishLive)
  const [name, setName] = useState(suggested)
  const valid = isCampaignName(name)
  const replacing = valid && name === live

  return (
    <form
      className="editor__confirm"
      aria-label="Nome do arquivo publicado"
      onSubmit={e => {
        e.preventDefault()
        if (valid) dispatch(choosePublishName(name))
      }}
    >
      <label className="editor__password">
        <span>Nome do arquivo no bucket</span>
        <input required autoFocus value={name} onChange={e => setName(e.target.value)} />
      </label>
      {!valid && <p className="editor__publish-error">Use só letras minúsculas, números e -, terminando em .json.</p>}
      {replacing && <p className="editor__publish-error">Esse é o arquivo que os jogadores leem. Publicar vai substituir a campanha deles.</p>}
      <button type="submit" className="button primary" disabled={!valid}>{replacing ? 'Substituir' : 'Continuar'}</button>
      <button type="button" className="button secondary" onClick={() => dispatch(publishCancelled())}>Cancelar</button>
    </form>
  )
}

export function PublishPanel() {
  const { publishing, publishFailure, publishedUrl } = useSelector(state => state.editor)

  if (publishing === 'name') return <NameForm />
  if (publishing === 'password') return <PasswordForm />
  if (publishing === 'done') {
    return (
      <div className="editor__done">
        <p className="editor__published" role="status">Publicado.</p>
        {publishedUrl && <InviteBox campaignUrl={publishedUrl} playable />}
      </div>
    )
  }
  if (publishing === 'failed') {
    return <p className="editor__publish-error" role="alert">{failureMessage(publishFailure)}</p>
  }
  return null
}
