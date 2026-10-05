/** @jsxImportSource @emotion/react */
import { useEffect, useMemo, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useDispatch, useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { CampaignStatus } from '../../components/CampaignStatus'
import { useDesktopWidth } from '../../components/useDesktopWidth'
import { campaignEdited, downloadDraft, openPublishedDraft } from '../../store/editor'
import { draftErrors } from '../../campaign/draft'

export const Route = createLazyFileRoute('/gm/editor')({
  component: EditorPage,
})

const SECTIONS = [
  { key: 'hunters', title: 'Hunters', label: item => item.name },
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
          <h2>{section.title} <span className="num">{draft[section.key].length}</span></h2>
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
  selected: PropTypes.shape({ section: PropTypes.string.isRequired, index: PropTypes.number }).isRequired,
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

function ItemPanel({ draft, selected }) {
  if (selected.section === 'campaign') return <CampaignForm campaign={draft.campaign} />
  const section = SECTIONS.find(({ key }) => key === selected.section)
  const item = draft[section.key][selected.index]
  return (
    <div className="editor__form">
      <h1>{itemLabel(section, item)}</h1>
      {item.id && <code className="editor__id">{item.id}</code>}
    </div>
  )
}

ItemPanel.propTypes = {
  draft: PropTypes.object.isRequired,
  selected: PropTypes.shape({ section: PropTypes.string.isRequired, index: PropTypes.number }).isRequired,
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

function Editor() {
  const dispatch = useDispatch()
  const { status, draft, error } = useSelector(state => state.editor)
  const [selected, setSelected] = useState({ section: 'campaign' })
  const errors = useMemo(() => (draft ? draftErrors(draft) : []), [draft])

  useEffect(() => {
    if (status === 'empty') dispatch(openPublishedDraft())
  }, [status, dispatch])

  return (
    <main className="gm-editor" css={editorPage}>
      <div className="editor__top">
        <span className="editor__brand"><span>i</span>Hunt <b>Editor</b></span>
        {draft && (
          <span className={errors.length > 0 ? 'editor__count editor__count--bad' : 'editor__count'}>
            {errorCount(errors.length)}
          </span>
        )}
        {draft && (
          <button
            type="button"
            className="button primary editor__download"
            disabled={errors.length > 0}
            onClick={() => dispatch(downloadDraft())}
          >
            Baixar
          </button>
        )}
      </div>
      <DraftErrors errors={errors} />
      {status === 'error' && (
        <section className="editor__errors" role="alert">
          <h2>Não foi possível abrir a campanha publicada</h2>
          <p>{error}</p>
        </section>
      )}
      {draft && (
        <div className="editor__body">
          <SectionList draft={draft} selected={selected} onSelect={setSelected} />
          <ItemPanel draft={draft} selected={selected} />
        </div>
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
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    border-bottom: 1px solid var(--linha);
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

  .editor__id {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--apagado);
  }

  .editor__count {
    margin-left: auto;
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
