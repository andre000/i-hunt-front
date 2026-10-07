/** @jsxImportSource @emotion/react */
import { useEffect, useMemo, useState } from 'react'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { CampaignStatus } from '../../components/CampaignStatus'
import { HunterForm } from '../../components/editor/HunterForm'
import { NewItemForm } from '../../components/editor/NewItemForm'
import { NpcForm } from '../../components/editor/NpcForm'
import { MissionBadge, MissionForm, NewMissionForm } from '../../components/editor/MissionForm'
import { MessageBadge, MessageForm, NewMessageForm } from '../../components/editor/MessageForm'
import { PublishPanel } from '../../components/editor/PublishPanel'
import { useDesktopWidth } from '../../components/useDesktopWidth'
import { campaignDateAdvanced, campaignEdited, carriedDateApplied, carriedDateDropped, itemAdded, itemMoved, messageAdded, downloadDraft, draftDiscarded, draftOpened, openDraftFile, openPublishedDraft, startPublishing } from '../../store/editor'
import { blankDraft, messageOrder, nextScheduled } from '../../campaign/draft'
import { dateFromInput, dateToInput } from '../../campaign/draftDates'
import { explainErrors } from '../../campaign/explainErrors'

export const Route = createLazyFileRoute('/gm/editor')({
  component: EditorPage,
})

const SECTIONS = [
  { key: 'hunters', title: 'Hunters', label: item => item.name, add: 'Adicionar hunter', newTitle: 'Novo hunter', Form: HunterForm },
  {
    key: 'missions',
    title: 'Missões',
    label: item => item.name,
    add: 'Adicionar missão',
    reorder: true,
    NewForm: NewMissionForm,
    Form: MissionForm,
    Badge: MissionBadge,
  },
  { key: 'npcs', title: 'NPCs', label: item => item.name, add: 'Adicionar NPC', newTitle: 'Novo NPC', Form: NpcForm },
  {
    key: 'messages',
    title: 'Mensagens',
    label: item => item.text,
    add: 'Adicionar mensagem',
    added: fields => messageAdded(fields),
    NewForm: NewMessageForm,
    Form: MessageForm,
    Badge: MessageBadge,
    order: messageOrder,
  },
]

const itemLabel = (section, item) => (typeof section.label(item) === 'string' && section.label(item)) || '(sem nome)'

function followMove(selected, section, from, to) {
  if (selected.section !== section || selected.index === undefined) return selected
  const { index } = selected
  if (index === from) return { ...selected, index: to }
  if (from < index && index <= to) return { ...selected, index: index - 1 }
  if (to <= index && index < from) return { ...selected, index: index + 1 }
  return selected
}

function dragClass(drag, index) {
  const over = drag?.over === index
  return [
    'editor__draggable',
    drag?.from === index && 'editor__draggable--dragging',
    over && drag.from > index && 'editor__draggable--above',
    over && drag.from < index && 'editor__draggable--below',
  ].filter(Boolean).join(' ')
}

function SectionList({ draft, selected, onSelect }) {
  const dispatch = useDispatch()
  const [drag, setDrag] = useState(null)
  const isSelected = (key, index) => selected.section === key && selected.index === index

  const dragProps = (section, index) => {
    if (!section.reorder) return {}
    return {
      draggable: true,
      className: dragClass(drag, index),
      onDragStart: (e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(index))
        setDrag({ from: index, over: index })
      },
      onDragOver: (e) => {
        if (!drag) return
        e.preventDefault()
        if (drag.over !== index) setDrag({ ...drag, over: index })
      },
      onDrop: (e) => {
        e.preventDefault()
        if (!drag) return
        dispatch(itemMoved({ section: section.key, from: drag.from, to: index }))
        onSelect(followMove(selected, section.key, drag.from, index))
        setDrag(null)
      },
      onDragEnd: () => setDrag(null),
    }
  }

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
          <ul aria-label={section.title}>
            {(section.order ? section.order(draft) : draft[section.key].map((_, index) => index)).map(index => (
              <li key={index} {...dragProps(section, index)}>
                <button
                  type="button"
                  className="editor__item"
                  aria-current={isSelected(section.key, index)}
                  onClick={() => onSelect({ section: section.key, index })}
                >
                  {itemLabel(section, draft[section.key][index])}
                </button>
                {section.Badge && <section.Badge draft={draft} index={index} />}
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
    const add = (fields) => {
      dispatch(section.added ? section.added(fields) : itemAdded({ section: section.key, fields }))
      onSelect({ section: section.key, index: draft[section.key].length })
    }
    if (section.NewForm) return <section.NewForm key={section.key} npcs={draft.npcs} onAdd={add} />
    return <NewItemForm key={section.key} title={section.newTitle} onAdd={add} />
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

function DraftErrors({ errors, onSelect }) {
  if (errors.length === 0) return null
  return (
    <section className="editor__errors" aria-label="Erros do rascunho">
      <ul>
        {errors.map(({ path, where, message, target }, index) => (
          <li key={`${path}-${index}`}>
            <button type="button" onClick={() => onSelect(target)}>
              <strong>{where}</strong> {message}
            </button>
            <code>{path || '(arquivo)'}</code>
          </li>
        ))}
      </ul>
    </section>
  )
}

DraftErrors.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    where: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    target: PropTypes.object.isRequired,
  })).isRequired,
  onSelect: PropTypes.func.isRequired,
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

function carryStep({ carriedDate, carriedReady, started, loading, draft, unsaved }) {
  if (!carriedDate || !started || loading) return null
  if (carriedReady) return 'apply'
  return draft && unsaved ? 'ask' : 'open'
}

function useCarriedDate(ask, waiting) {
  const dispatch = useDispatch()
  const editor = useSelector(state => state.editor)
  const step = waiting ? null : carryStep(editor)

  useEffect(() => {
    if (step === 'apply') dispatch(carriedDateApplied())
    if (step === 'open') dispatch(openPublishedDraft())
    if (step === 'ask') {
      ask(
        'Abrir a campanha publicada para levar a data? O rascunho atual tem mudanças não publicadas e será substituído.',
        'Abrir a publicada',
        () => dispatch(openPublishedDraft()),
        () => dispatch(carriedDateDropped()),
      )
    }
  })
}

function DraftBar({ draft, errors, unsaved, onChoose, onDiscard }) {
  const dispatch = useDispatch()
  const { target, publishing } = useSelector(state => state.editor)
  const bad = errors.length > 0

  return (
    <>
      <button type="button" className="editor__link" onClick={onChoose}>Trocar rascunho</button>
      <button type="button" className="editor__link" onClick={onDiscard}>Descartar</button>
      <span className="editor__spacer" />
      <CampaignDate draft={draft} />
      {unsaved && <span className="editor__unsaved">Mudanças não publicadas</span>}
      <span className={bad ? 'editor__count editor__count--bad' : 'editor__count'}>{errorCount(errors.length)}</span>
      <button type="button" className="button secondary editor__action" disabled={bad} onClick={() => dispatch(downloadDraft())}>
        Baixar
      </button>
      <button
        type="button"
        className="button primary editor__action"
        disabled={bad || !target || publishing === 'sending'}
        onClick={() => dispatch(startPublishing())}
      >
        {publishing === 'sending' ? 'Publicando…' : 'Publicar'}
      </button>
    </>
  )
}

DraftBar.propTypes = {
  draft: PropTypes.object.isRequired,
  errors: PropTypes.array.isRequired,
  unsaved: PropTypes.bool.isRequired,
  onChoose: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
}

function OpenError({ error }) {
  if (!error) return null
  return (
    <section className="editor__errors" role="alert">
      <h2>Não foi possível abrir a campanha</h2>
      <p>{error}</p>
    </section>
  )
}

OpenError.propTypes = {
  error: PropTypes.string,
}

function PendingConfirm({ confirm, onClose }) {
  if (!confirm) return null
  return (
    <Confirm
      question={confirm.question}
      confirmLabel={confirm.confirmLabel}
      onConfirm={confirm.run}
      onCancel={() => {
        confirm.cancel?.()
        onClose()
      }}
    />
  )
}

PendingConfirm.propTypes = {
  confirm: PropTypes.shape({
    question: PropTypes.string.isRequired,
    confirmLabel: PropTypes.string.isRequired,
    run: PropTypes.func.isRequired,
    cancel: PropTypes.func,
  }),
  onClose: PropTypes.func.isRequired,
}

function Editor() {
  const dispatch = useDispatch()
  const { started, draft, error, loading, unsaved } = useSelector(state => state.editor)
  const campaignUrl = useSelector(state => state.campaign.campaignUrl)
  const [selected, setSelected] = useState({ section: 'campaign' })
  const [choosing, setChoosing] = useState(false)
  const [confirm, setConfirm] = useState(null)
  const errors = useMemo(() => (draft ? explainErrors(draft) : []), [draft])

  useEffect(() => {
    if (!started && campaignUrl) dispatch(openPublishedDraft())
  }, [started, campaignUrl, dispatch])

  const ask = (question, confirmLabel, action, cancel) => setConfirm({
    question,
    confirmLabel,
    cancel,
    run: () => {
      setConfirm(null)
      setChoosing(false)
      setSelected({ section: 'campaign' })
      action()
    },
  })

  useCarriedDate(ask, Boolean(confirm))

  const replaceDraft = (action) => {
    if (draft) ask('Substituir o rascunho atual?', 'Substituir', action)
    else action()
  }
  const editing = !loading && draft && !choosing

  return (
    <main className="gm-editor" css={editorPage}>
      <div className="editor__top">
        <span className="editor__brand"><span>i</span>Hunt <b>Editor</b></span>
        <Link className="editor__link" to="/gm">Visão do GM</Link>
        {draft && (
          <DraftBar
            draft={draft}
            errors={errors}
            unsaved={unsaved}
            onChoose={() => setChoosing(true)}
            onDiscard={() => ask('Descartar o rascunho atual?', 'Descartar', () => dispatch(draftDiscarded()))}
          />
        )}
      </div>
      <PendingConfirm confirm={confirm} onClose={() => setConfirm(null)} />
      {draft && <PublishPanel />}
      <OpenError error={error} />
      {loading && <p className="editor__loading">Carregando campanha…</p>}
      {editing && (
        <>
          <DraftErrors errors={errors} onSelect={setSelected} />
          <div className="editor__body">
            <SectionList draft={draft} selected={selected} onSelect={setSelected} />
            <ItemPanel draft={draft} selected={selected} onSelect={setSelected} />
          </div>
        </>
      )}
      {!loading && !editing && (
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
  if (!useDesktopWidth()) {
    return (
      <CampaignStatus title="Abra no computador para editar">
        <Link className="button secondary" to="/gm">Voltar para a Visão do GM</Link>
      </CampaignStatus>
    )
  }
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
    gap: 10px 12px;
    padding: 12px 16px;
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

  .editor__sections li {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .editor__draggable {
    border-radius: 8px;
    cursor: grab;
  }

  .editor__draggable--dragging {
    opacity: 0.4;
  }

  .editor__draggable--above {
    box-shadow: inset 0 2px 0 var(--laranja);
  }

  .editor__draggable--below {
    box-shadow: inset 0 -2px 0 var(--laranja);
  }

  .editor__sections .editor__badge {
    flex-shrink: 0;
  }

  .editor__badge {
    padding: 2px 8px;
    border-radius: 999px;
    background-color: var(--painel-2);
    color: var(--apagado);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }

  .editor__badge--scheduled {
    background-color: var(--aviso-fundo);
    color: var(--aviso);
  }

  .editor__meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .editor__row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }

  .editor__form select,
  .editor__form textarea {
    padding: 10px 12px;
    border: 1px solid var(--linha);
    border-radius: 10px;
    background-color: var(--painel);
    color: var(--texto);
    font: inherit;
    font-size: 15px;
  }

  .editor__form textarea {
    resize: vertical;
  }

  .editor__form .editor__check,
  .editor__picker label {
    flex-direction: row;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--texto);
  }

  .editor__position {
    margin: 0;
    padding: 12px 14px 14px;
    border: 1px solid var(--linha);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    legend {
      padding: 0 6px;
      font-size: 13px;
      color: var(--apagado);
    }

    p {
      font-size: 12px;
      color: var(--apagado);
    }
  }

  .editor__coordinates {
    display: flex;
    align-items: flex-end;
    gap: 10px;

    label {
      flex: 1;
    }

    .button {
      padding: 10px 14px;
      font-size: 14px;

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }
  }

  .editor__picker {
    margin: 0;
    padding: 12px 14px;
    border: 1px solid var(--linha);
    border-radius: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px 18px;

    legend {
      padding: 0 6px;
      font-size: 13px;
      color: var(--apagado);
    }

    p {
      font-size: 13px;
      color: var(--apagado);
    }
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
    text-decoration: none;
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

  .editor__password {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--apagado);

    input {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--linha);
      border-radius: 10px;
      background-color: var(--asfalto);
      color: var(--texto);
      font: inherit;
      font-size: 14px;
    }
  }

  .editor__published,
  .editor__publish-error {
    margin: 12px 20px 0;
    font-size: 14px;
    font-weight: 600;
  }

  .editor__published {
    color: var(--ok);
  }

  .editor__publish-error {
    color: var(--perigo);
  }

  .editor__confirm .editor__publish-error {
    margin: 0;
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

  .editor__action {
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

  .editor__errors li {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }

  .editor__errors li button {
    padding: 0;
    border: 0;
    background: none;
    color: var(--texto);
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }

    strong {
      color: var(--perigo);
    }
  }

  .editor__errors code {
    font-family: var(--mono);
    font-size: 11px;
    color: var(--apagado);
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
