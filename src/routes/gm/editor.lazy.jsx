/** @jsxImportSource @emotion/react */
import { useEffect, useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { CampaignStatus } from '../../components/CampaignStatus'
import { HunterForm } from '../../components/editor/HunterForm'
import { NewItemForm } from '../../components/editor/NewItemForm'
import { useDesktopWidth } from '../../components/useDesktopWidth'
import { campaignDateAdvanced, campaignEdited, itemAdded, downloadDraft, draftDiscarded, draftOpened, openDraftFile, openPublishedDraft } from '../../store/editor'
import { blankDraft, dateFromInput, dateToInput, draftErrors, nextScheduled } from '../../campaign/draft'

export const Route = createLazyFileRoute('/gm/editor')({
  component: EditorPage,
})

const SECTIONS = [
  { key: 'hunters', title: 'Hunters', label: item => item.name, add: 'Adicionar hunter', newTitle: 'Novo hunter', Form: HunterForm },
  { key: 'missions', title: 'Missões', label: item => item.name },
  { key: 'npcs', title: 'NPCs', label: item => item.name },
  { key: 'messages', title: 'Mensagens', label: item => item.text },
]

const itemLabel = (section, item) => (typeof section.label(item) === 'string' && section.label(item)) || '(sem nome)'

function SectionList({ draft, selected, onSelect }) {
  const isSelected = (key, index) => selected.section === key && selected.index === index

  return (
    <nav className="editor__sections" aria-label="Seções do rascunho">
      <button
        type="button"
        className="editor__item editor__item--campaign"
        aria-current={selected.section === 'campaign'}
        onClick={() => onSelect({ section: 'campaign' })}
      >
        Campanha
      </button>
      {SECTIONS.map(section => (
        <section key={section.key}>
          <h2>
            {section.title} <span className="num">{draft[section.key].length}</span>
            {section.add && (
              <button
                type="button"
                className="editor__add"
                aria-label={section.add}
                title={section.add}
                onClick={() => onSelect({ section: section.key, adding: true })}
              >
                +
              </button>
            )}
          </h2>
          <ul>
            {draft[section.key].map((item, index) => (
              <li key={index}>
                <button
                  type="button"
                  className="editor__item"
                  aria-current={isSelected(section.key, index)}
                  onClick={() => onSelect({ section: section.key, index })}
                >
                  {itemLabel(section, item)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  )
}

SectionList.propTypes = {
  draft: PropTypes.object.isRequired,
  selected: PropTypes.shape({ section: PropTypes.string.isRequired, index: PropTypes.number, adding: PropTypes.bool }).isRequired,
  onSelect: PropTypes.func.isRequired,
}

function CampaignForm({ campaign }) {
  const dispatch = useDispatch()

  return (
    <form className="editor__form" onSubmit={e => e.preventDefault()}>
      <h1>Campanha</h1>
      <label>
        <span>Nome da campanha</span>
        <input
          value={campaign.name ?? ''}
          onChange={e => dispatch(campaignEdited({ name: e.target.value }))}
        />
      </label>
    </form>
  )
}

CampaignForm.propTypes = {
  campaign: PropTypes.shape({ name: PropTypes.string }).isRequired,
}

function ItemPanel({ draft, selected, onSelect }) {
  const dispatch = useDispatch()
  if (selected.section === 'campaign') return <CampaignForm campaign={draft.campaign} />
  const section = SECTIONS.find(({ key }) => key === selected.section)
  if (selected.adding) {
    return (
      <NewItemForm
        key={section.key}
        title={section.newTitle}
        onAdd={fields => {
          dispatch(itemAdded({ section: section.key, fields }))
          onSelect({ section: section.key, index: draft[section.key].length })
        }}
      />
    )
  }
  const item = draft[section.key][selected.index]
  if (!item) return <CampaignForm campaign={draft.campaign} />
  if (section.Form) return <section.Form key={`${section.key}-${selected.index}`} draft={draft} index={selected.index} onRemoved={() => onSelect({ section: 'campaign' })} />
  return (
    <div className="editor__form">
      <h1>{itemLabel(section, item)}</h1>
      {item.id && <code className="editor__id">{item.id}</code>}
    </div>
  )
}

ItemPanel.propTypes = {
  onSelect: PropTypes.func.isRequired,
  draft: PropTypes.object.isRequired,
  selected: PropTypes.shape({ section: PropTypes.string.isRequired, index: PropTypes.number, adding: PropTypes.bool }).isRequired,
}

const errorCount = (count) => {
  if (count === 0) return 'Sem erros'
  return count === 1 ? '1 erro' : `${count} erros`
}

function DraftErrors({ errors }) {
  if (errors.length === 0) return null
  return (
    <section className="editor__errors" aria-label="Erros do rascunho">
      <ul>
        {errors.map(({ path, message }, index) => (
          <li key={`${path}-${index}`}>
            <code>{path || '(arquivo)'}</code> {message}
          </li>
        ))}
      </ul>
    </section>
  )
}

DraftErrors.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
  })).isRequired,
}

function CampaignDate({ draft }) {
  const dispatch = useDispatch()
  const { date } = draft.campaign

  return (
    <div className="editor__date">
      <label>
        <span>Data da campanha</span>
        <input
          type="datetime-local"
          value={dateToInput(date, date)}
          onChange={e => dispatch(campaignEdited({ date: dateFromInput(e.target.value, date) }))}
        />
      </label>
      <button
        type="button"
        className="button secondary"
        disabled={!nextScheduled(draft)}
        onClick={() => dispatch(campaignDateAdvanced())}
      >
        Avançar até o próximo agendado
      </button>
    </div>
  )
}

CampaignDate.propTypes = {
  draft: PropTypes.shape({ campaign: PropTypes.shape({ date: PropTypes.string }).isRequired }).isRequired,
}

function DraftSources({ campaignUrl, onPick, onCancel }) {
  const dispatch = useDispatch()
  const [url, setUrl] = useState('')

  const openFile = (e) => {
    const [file] = e.target.files
    e.target.value = ''
    if (file) onPick(() => dispatch(openDraftFile(file)))
  }

  return (
    <section className="editor__sources" aria-label="Abrir um rascunho">
      <h1>Abrir um rascunho</h1>
      {campaignUrl && (
        <button type="button" className="button primary" onClick={() => onPick(() => dispatch(openPublishedDraft()))}>
          Carregar a campanha publicada
        </button>
      )}
      <form
        className="editor__url"
        onSubmit={e => {
          e.preventDefault()
          onPick(() => dispatch(openPublishedDraft(url.trim())))
        }}
      >
        <label>
          <span>Endereço do arquivo no R2</span>
          <input type="url" required placeholder="https://pub-….r2.dev/campanha.json" value={url} onChange={e => setUrl(e.target.value)} />
        </label>
        <button type="submit" className="button secondary">Carregar</button>
      </form>
      <div className="editor__choices">
        <label className="button secondary editor__file">
          Abrir arquivo do computador
          <input type="file" accept=".json,application/json" onChange={openFile} />
        </label>
        <button type="button" className="button secondary" onClick={() => onPick(() => dispatch(draftOpened({ draft: blankDraft() })))}>
          Começar em branco
        </button>
      </div>
      {onCancel && (
        <button type="button" className="editor__link" onClick={onCancel}>Voltar ao rascunho</button>
      )}
    </section>
  )
}

DraftSources.propTypes = {
  campaignUrl: PropTypes.string,
  onPick: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
}

function Confirm({ question, confirmLabel, onConfirm, onCancel }) {
  return (
    <section className="editor__confirm" role="alertdialog" aria-label={question}>
      <p>{question}</p>
      <button type="button" className="button primary" onClick={onConfirm}>{confirmLabel}</button>
      <button type="button" className="button secondary" onClick={onCancel}>Cancelar</button>
    </section>
  )
}

Confirm.propTypes = {
  question: PropTypes.string.isRequired,
  confirmLabel: PropTypes.string.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
}

function Editor() {
  const dispatch = useDispatch()
  const { started, draft, error, loading, unsaved } = useSelector(state => state.editor)
  const campaignUrl = useSelector(state => state.campaign.campaignUrl)
  const [selected, setSelected] = useState({ section: 'campaign' })
  const [choosing, setChoosing] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const errors = useMemo(() => (draft ? draftErrors(draft) : []), [draft])

  useEffect(() => {
    if (!started && campaignUrl) dispatch(openPublishedDraft())
  }, [started, campaignUrl, dispatch])

  const ask = (question, confirmLabel, action) => setConfirm({
    question,
    confirmLabel,
    run: () => {
      setConfirm(null)
      setChoosing(false)
      setSelected({ section: 'campaign' })
      action()
    },
  })

  const replaceDraft = (action) => {
    if (draft) ask('Substituir o rascunho atual?', 'Substituir', action)
    else action()
  }

  return (
    <main className="gm-editor" css={editorPage}>
      <div className="editor__top">
        <span className="editor__brand"><span>i</span>Hunt <b>Editor</b></span>
        {draft && (
          <>
            <button type="button" className="editor__link" onClick={() => setChoosing(true)}>Trocar rascunho</button>
            <button
              type="button"
              className="editor__link"
              onClick={() => ask('Descartar o rascunho atual?', 'Descartar', () => dispatch(draftDiscarded()))}
            >
              Descartar
            </button>
            <span className="editor__spacer" />
            <CampaignDate draft={draft} />
            {unsaved && <span className="editor__unsaved">Mudanças não baixadas</span>}
            <span className={errors.length > 0 ? 'editor__count editor__count--bad' : 'editor__count'}>
              {errorCount(errors.length)}
            </span>
            <button
              type="button"
              className="button primary editor__download"
              disabled={errors.length > 0}
              onClick={() => dispatch(downloadDraft())}
            >
              Baixar
            </button>
          </>
        )}
      </div>
      {confirm && (
        <Confirm
          question={confirm.question}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.run}
          onCancel={() => setConfirm(null)}
        />
      )}
      {error && (
        <section className="editor__errors" role="alert">
          <h2>Não foi possível abrir a campanha</h2>
          <p>{error}</p>
        </section>
      )}
      {loading && <p className="editor__loading">Carregando campanha…</p>}
      {!loading && draft && !choosing && (
        <>
          <DraftErrors errors={errors} />
          <div className="editor__body">
            <SectionList draft={draft} selected={selected} onSelect={setSelected} />
            <ItemPanel draft={draft} selected={selected} onSelect={setSelected} />
          </div>
        </>
      )}
      {!loading && (!draft || choosing) && (
        <DraftSources
          campaignUrl={campaignUrl}
          onPick={replaceDraft}
          onCancel={draft ? () => setChoosing(false) : null}
        />
      )}
    </main>
  )
}

function EditorPage() {
  if (!useDesktopWidth()) return <CampaignStatus title="Abra no computador para editar" />
  return <Editor />
}

const editorPage = css`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  .editor__top {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 16px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--linha);
    white-space: nowrap;
  }

  .editor__brand {
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.04em;

    > span {
      color: var(--laranja);
    }

    b {
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      background-color: var(--laranja-fundo);
      color: var(--laranja);
      font-size: 12px;
      letter-spacing: 0;
    }
  }

  .editor__body {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 300px 1fr;
  }

  .editor__sections {
    overflow-y: auto;
    padding: 16px 12px 40px;
    border-right: 1px solid var(--linha);
    display: flex;
    flex-direction: column;
    gap: 18px;

    h2 {
      padding: 0 8px 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--apagado);
      letter-spacing: 0;
      display: flex;
      gap: 6px;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
  }

  .editor__item {
    width: 100%;
    padding: 7px 8px;
    border: 0;
    border-radius: 8px;
    background: none;
    color: var(--texto);
    font: inherit;
    font-size: 14px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;

    &:hover {
      background-color: var(--painel);
    }

    &[aria-current='true'] {
      background-color: var(--laranja-fundo);
      color: var(--laranja);
    }
  }

  .editor__item--campaign {
    flex-shrink: 0;
    font-weight: 600;
  }

  .editor__form {
    overflow-y: auto;
    padding: 24px 32px 40px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 720px;

    h1 {
      font-size: 26px;
      letter-spacing: -0.03em;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
      color: var(--apagado);
    }

    input {
      padding: 10px 12px;
      border: 1px solid var(--linha);
      border-radius: 10px;
      background-color: var(--painel);
      color: var(--texto);
      font: inherit;
      font-size: 15px;
    }
  }

  .editor__add {
    margin-left: auto;
    width: 22px;
    height: 22px;
    padding: 0;
    border: 1px solid var(--linha);
    border-radius: 6px;
    background: none;
    color: var(--apagado);
    font: inherit;
    font-size: 15px;
    line-height: 1;
    cursor: pointer;

    &:hover {
      color: var(--laranja);
      border-color: var(--laranja);
    }
  }

  .editor__actions {
    display: flex;
    gap: 8px;

    .button {
      padding: 8px 16px;
      font-size: 14px;
    }
  }

  .button.danger {
    background-color: var(--perigo);
    color: #1a0505;
  }

  .editor__avatar {
    display: flex;
    align-items: flex-end;
    gap: 14px;

    label {
      flex: 1;
    }
  }

  .editor__short input {
    max-width: 140px;
  }

  .editor__delete {
    padding: 16px;
    border: 1px solid rgb(255 107 107 / 40%);
    border-radius: 12px;
    background-color: var(--perigo-fundo);
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 14px;

    h2 {
      font-size: 16px;
    }

    h3 {
      font-size: 12px;
      font-weight: 600;
      color: var(--apagado);
      letter-spacing: 0;
    }

    ul {
      margin: 0;
      padding-left: 18px;
    }
  }

  .editor__warning {
    color: var(--aviso);
    font-weight: 600;
  }

  .editor__id {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--apagado);
  }

  .editor__date {
    display: flex;
    align-items: center;
    gap: 8px;

    label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--apagado);
    }

    input {
      padding: 6px 10px;
      border: 1px solid var(--linha);
      border-radius: 10px;
      background-color: var(--painel);
      color: var(--texto);
      font-family: var(--mono);
      font-size: 13px;
    }

    .button {
      padding: 6px 12px;
      font-size: 13px;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  .editor__spacer {
    flex: 1;
  }

  .editor__link {
    padding: 4px 6px;
    border: 0;
    background: none;
    color: var(--apagado);
    font: inherit;
    font-size: 13px;
    cursor: pointer;

    &:hover {
      color: var(--texto);
    }
  }

  .editor__unsaved {
    font-size: 13px;
    font-weight: 600;
    color: var(--aviso);
  }

  .editor__loading {
    padding: 24px 32px;
    color: var(--apagado);
  }

  .editor__confirm {
    margin: 12px 20px 0;
    padding: 12px 16px;
    border: 1px solid var(--linha);
    border-radius: 12px;
    background-color: var(--painel);
    display: flex;
    align-items: center;
    gap: 10px;

    p {
      flex: 1;
      font-weight: 600;
    }

    .button {
      padding: 6px 14px;
      font-size: 14px;
    }
  }

  .editor__sources {
    padding: 32px;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;

    h1 {
      font-size: 26px;
      letter-spacing: -0.03em;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 13px;
      color: var(--apagado);
    }

    input[type='url'] {
      padding: 10px 12px;
      border: 1px solid var(--linha);
      border-radius: 10px;
      background-color: var(--painel);
      color: var(--texto);
      font: inherit;
      font-size: 14px;
    }
  }

  .editor__url {
    align-self: stretch;
    display: flex;
    align-items: flex-end;
    gap: 8px;

    label {
      flex: 1;
    }
  }

  .editor__choices {
    display: flex;
    gap: 8px;
  }

  .editor__sources .editor__file {
    flex-direction: row;
    color: var(--texto);
    font-size: inherit;
    cursor: pointer;

    &:focus-within {
      outline: 2px solid var(--laranja);
      outline-offset: 2px;
    }

    input {
      position: absolute;
      width: 1px;
      height: 1px;
      opacity: 0;
    }
  }

  .editor__count {
    padding: 4px 10px;
    border-radius: 999px;
    background-color: var(--ok-fundo);
    color: var(--ok);
    font-size: 13px;
    font-weight: 600;
  }

  .editor__download {
    padding: 6px 14px;
    font-size: 14px;

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  .editor__count--bad {
    background-color: var(--perigo-fundo);
    color: var(--perigo);
  }

  .editor__errors ul {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 120px;
    overflow-y: auto;
  }

  .editor__errors code {
    font-family: var(--mono);
    color: var(--perigo);
  }

  .editor__errors {
    margin: 12px 20px;
    border: 1px solid rgb(255 107 107 / 40%);
    background-color: var(--perigo-fundo);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;

    h2 {
      color: var(--perigo);
      font-size: 14px;
    }
  }
`
