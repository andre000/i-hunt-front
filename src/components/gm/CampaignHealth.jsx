/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from '@tanstack/react-router'
import { ArrowPathIcon } from '@heroicons/react/16/solid'
import { refreshCampaign } from '../../store/campaign'

const readTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

function syncState({ refreshing, offline, updateError, errors, checkedAt }) {
  if (refreshing) return ['wait', 'Lendo o arquivo…']
  if (offline) return ['warn', 'Sem conexão · mostrando a última leitura']
  if (updateError) return ['warn', `Não deu para atualizar (${updateError}) · mostrando a última leitura`]
  if (errors.length > 0) return ['bad', 'JSON com erros · mostrando a última versão válida']
  return ['ok', checkedAt ? `Válido · lido às ${readTime.format(checkedAt)}` : 'Publicado e válido']
}

function RefreshButton() {
  const dispatch = useDispatch()
  const refreshing = useSelector(state => state.campaign.refreshing)

  return (
    <button type="button" className="button secondary health__refresh" disabled={refreshing} onClick={() => dispatch(refreshCampaign())}>
      <ArrowPathIcon aria-hidden="true" />
      Recarregar
    </button>
  )
}

export function SyncStatus() {
  const campaign = useSelector(state => state.campaign)
  const [tone, text] = syncState(campaign)

  return (
    <div css={health} className="health__sync">
      <p className={`health__state health__state--${tone}`} role="status">{text}</p>
      <RefreshButton />
    </div>
  )
}

function readableFailure(error) {
  if (/^HTTP 404/.test(error)) return 'O link respondeu HTTP 404: não há arquivo nesse endereço. Confira se o link está certo.'
  if (/^HTTP/.test(error)) return `O link respondeu ${error}. Confira se o arquivo está publicado.`
  return 'Não deu para baixar o arquivo. Confira a conexão, o link e se o servidor libera o acesso para outros sites (CORS).'
}

function readableError({ path, message }) {
  if (message.startsWith('JSON inválido')) return ['Arquivo', 'o link não devolveu um JSON. Confira se ele aponta para o arquivo da campanha.']
  return [path || 'Arquivo', message]
}

export function CampaignProblems({ editable }) {
  const { status, data, errors, error } = useSelector(state => state.campaign)
  const unreadable = status === 'error'
  if (!unreadable && errors.length === 0) return null

  return (
    <section css={health} className="health__problems" role="alert">
      <h2>{unreadable ? 'Não foi possível ler o JSON' : 'O JSON publicado tem erros'}</h2>
      <p>
        {unreadable && readableFailure(error)}
        {!unreadable && (data
          ? 'Os jogadores continuam vendo a última versão válida.'
          : 'Os jogadores não conseguem abrir a campanha até o JSON ser corrigido.')}
      </p>
      {!unreadable && (
        <ul>
          {errors.map((item, index) => {
            const [where, message] = readableError(item)
            return <li key={`${item.path}-${index}`}><code>{where}</code> {message}</li>
          })}
        </ul>
      )}
      <div className="health__actions">
        <RefreshButton />
        {editable && <Link className="button secondary" to="/gm/editor">Abrir no Editor</Link>}
      </div>
    </section>
  )
}

CampaignProblems.propTypes = {
  editable: PropTypes.bool.isRequired,
}

const health = css`
  &.health__sync {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .health__state {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--apagado);

    &::before {
      content: '';
      flex-shrink: 0;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: currentColor;
      transform: translateY(-1px);
    }
  }

  .health__state--ok::before { background-color: var(--ok); }
  .health__state--warn::before { background-color: var(--aviso); }
  .health__state--bad::before { background-color: var(--perigo); }

  .health__refresh {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    font-size: 12px;

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .health__refresh:disabled svg {
    animation: health-spin 0.9s linear infinite;
  }

  @keyframes health-spin {
    to { transform: rotate(360deg); }
  }

  &.health__problems {
    border: 1px solid rgb(255 107 107 / 40%);
    background-color: var(--perigo-fundo);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    h2 {
      color: var(--perigo);
      font-size: 15px;
    }

    p {
      font-size: 14px;
      line-height: 1.45;
    }

    ul {
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    code {
      font-family: var(--mono);
      color: var(--apagado);
    }
  }

  .health__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .button {
      min-height: 40px;
      font-size: 13px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .health__refresh:disabled svg {
      animation: none;
    }
  }
`
