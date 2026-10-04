/** @jsxImportSource @emotion/react */
import { useRef, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { Avatar } from '../../components/Avatar'
import { MISSION_STATUS_LABEL, gmView, relativeToCampaign } from '../../campaign/campaign'
import { inviteLink } from '../../campaign/sync'
import { formatBRL } from '../../utils/format'

export const Route = createLazyFileRoute('/gm/')({
  component: GmPage,
})

const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeStyle: 'short' })

function InviteBox({ campaignUrl }) {
  const inputRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const link = inviteLink(window.location.origin, campaignUrl)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
    } catch {
      inputRef.current.select()
    }
  }

  return (
    <div className="invite">
      <input ref={inputRef} readOnly value={link} aria-label="Convite da campanha" onFocus={e => e.target.select()} />
      <button type="button" className="button primary" onClick={copy}>
        {copied ? 'Copiado!' : 'Copiar'}
      </button>
    </div>
  )
}

InviteBox.propTypes = {
  campaignUrl: PropTypes.string.isRequired,
}

function GmPage() {
  const { status, data, errors, error, campaignUrl } = useSelector(state => state.campaign)
  const view = data ? gmView(data) : null

  return (
    <main css={gmPage}>
      <header>
        <p className="gm__eyebrow">Visão do GM</p>
        <h1>{data?.campaign.name ?? 'Campanha'}</h1>
        {view && <p className="gm__date">Data da campanha: {dateFormat.format(new Date(view.date))}</p>}
      </header>

      {errors.length > 0 && (
        <section className="gm__errors" role="alert">
          <h2>O JSON publicado tem erros</h2>
          <p>
            {data
              ? 'Os jogadores continuam vendo a última versão válida.'
              : 'Os jogadores não conseguem abrir a campanha até o JSON ser corrigido.'}
          </p>
          <ul>
            {errors.map(({ path, message }, index) => (
              <li key={`${path}-${index}`}>
                <code>{path || '(arquivo)'}</code> {message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {status === 'error' && (
        <section className="gm__errors" role="alert">
          <h2>Não foi possível ler o JSON</h2>
          <p>{error}. Confira a URL e a política de CORS do bucket.</p>
        </section>
      )}

      {campaignUrl && (
        <section>
          <h2>Convite</h2>
          <InviteBox campaignUrl={campaignUrl} />
        </section>
      )}

      {view && (
        <>
          <section>
            <h2>Hunters ({view.hunters.length})</h2>
            <ul className="gm__list">
              {view.hunters.map(({ hunter, earnings }) => (
                <li key={hunter.id}>
                  <Avatar person={hunter} size={36} />
                  <span className="gm__name">{hunter.name}</span>
                  <span className="gm__meta">
                    {hunter.rating !== undefined ? `${hunter.rating.toFixed(1)} ★ · ` : ''}
                    {formatBRL(earnings)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Missões ({view.missions.length})</h2>
            <ul className="gm__list">
              {view.missions.map(mission => (
                <li key={mission.id}>
                  <span className="gm__name">
                    {mission.name}
                    {mission.scheduled && (
                      <span className="gm__scheduled">
                        Agendada · {relativeToCampaign(mission.postedAt, view.date)}
                      </span>
                    )}
                  </span>
                  <span className="gm__meta">
                    {MISSION_STATUS_LABEL[mission.status]}
                    {mission.hunterNames.length > 0 && ` · ${mission.hunterNames.join(', ')}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  )
}

const gmPage = css`
  min-height: 100vh;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  color: #333;
  background-color: #fff;

  .gm__eyebrow {
    font-size: 12px;
    font-weight: 700;
    color: #f60;
    text-transform: uppercase;
  }

  h1 {
    font-size: 24px;
  }

  .gm__date {
    font-size: 13px;
    color: #777;
  }

  h2 {
    font-size: 15px;
    margin-bottom: 8px;
  }

  .gm__errors {
    border: 1px solid #fca5a5;
    background-color: #fef2f2;
    border-radius: 12px;
    padding: 16px;

    p {
      font-size: 13px;
      margin-bottom: 8px;
    }

    ul {
      margin: 0;
      padding-left: 18px;
      font-size: 13px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    code {
      font-weight: 700;
    }
  }

  .invite {
    display: flex;
    gap: 8px;

    input {
      flex: 1;
      min-width: 0;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 12px;
      font-size: 12px;
      color: #555;
    }
  }

  .gm__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;

    li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .gm__name {
    flex: 1;
    font-weight: 600;
    display: flex;
    flex-direction: column;
  }

  .gm__scheduled {
    font-size: 11px;
    font-weight: 700;
    color: #8b5cf6;
  }

  .gm__meta {
    font-size: 12px;
    color: #777;
    text-align: right;
  }
`
