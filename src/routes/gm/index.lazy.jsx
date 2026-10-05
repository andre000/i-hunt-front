/** @jsxImportSource @emotion/react */
import { useRef, useState } from 'react'
import { createLazyFileRoute } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { StarIcon } from '@heroicons/react/24/solid'
import { Avatar } from '../../components/Avatar'
import { CampaignClock } from '../../components/CampaignClock'
import { MissionMap } from '../../components/MissionMap'
import { StatusLabel } from '../../components/MissionTags'
import { gmView } from '../../campaign/gm'
import { relativeToCampaign } from '../../campaign/time'
import { inviteLink } from '../../campaign/invite'
import { formatBRL } from '../../utils/format'

export const Route = createLazyFileRoute('/gm/')({
  component: GmPage,
})

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

function JsonErrors({ errors, hasValidVersion }) {
  return (
    <section className="gm__errors" role="alert">
      <h2>O JSON publicado tem erros</h2>
      <p>
        {hasValidVersion
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
  )
}

JsonErrors.propTypes = {
  errors: PropTypes.arrayOf(PropTypes.shape({
    path: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
  })).isRequired,
  hasValidVersion: PropTypes.bool.isRequired,
}

function HunterList({ hunters }) {
  return (
    <section className="gm__section">
      <h2>Hunters <span className="num">{hunters.length}</span></h2>
      <ul className="gm__list">
        {hunters.map(({ hunter, earnings }) => (
          <li key={hunter.id}>
            <Avatar person={hunter} size={36} />
            <span className="gm__name">{hunter.name}</span>
            {hunter.rating !== undefined && (
              <span className="gm__rating num">
                <StarIcon aria-hidden="true" />
                {hunter.rating.toFixed(1)}
              </span>
            )}
            <span className="gm__value num">{formatBRL(earnings)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

HunterList.propTypes = {
  hunters: PropTypes.arrayOf(PropTypes.shape({
    hunter: PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      rating: PropTypes.number,
    }).isRequired,
    earnings: PropTypes.number.isRequired,
  })).isRequired,
}

function MissionRow({ mission, date }) {
  return (
    <li>
      <span className="gm__mission">
        <span className="gm__name">{mission.name}</span>
        <span className="gm__meta">
          {mission.scheduled
            ? <span className="gm__scheduled">Agendada · {relativeToCampaign(mission.postedAt, date)}</span>
            : <StatusLabel status={mission.status} />}
          {mission.hunterNames.length > 0 && <span>{mission.hunterNames.join(', ')}</span>}
          {!mission.position && <span>Sem posição no mapa</span>}
        </span>
      </span>
      <span className="gm__value num">{formatBRL(mission.value)}</span>
    </li>
  )
}

MissionRow.propTypes = {
  mission: PropTypes.shape({
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    scheduled: PropTypes.bool.isRequired,
    postedAt: PropTypes.string,
    value: PropTypes.number.isRequired,
    position: PropTypes.object,
    hunterNames: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
  date: PropTypes.string.isRequired,
}

function MissionList({ missions, date }) {
  const onMap = missions
    .filter(mission => mission.position)
    .map(mission => (mission.scheduled ? { ...mission, status: 'scheduled' } : mission))

  return (
    <section className="gm__section">
      <h2>Missões <span className="num">{missions.length}</span></h2>
      {onMap.length > 0 && <MissionMap className="gm__map" missions={onMap} />}
      <ul className="gm__list">
        {missions.map(mission => <MissionRow key={mission.id} mission={mission} date={date} />)}
      </ul>
    </section>
  )
}

MissionList.propTypes = {
  missions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired })).isRequired,
  date: PropTypes.string.isRequired,
}

function GmPage() {
  const { status, data, errors, error, campaignUrl } = useSelector(state => state.campaign)
  const view = data ? gmView(data) : null

  return (
    <main css={gmPage}>
      <div className="gm__top">
        <span className="gm__brand"><span>i</span>Hunt <b>GM</b></span>
        {view && <CampaignClock />}
      </div>

      <div className="gm__body">
        <h1>{data?.campaign.name ?? 'Visão do GM'}</h1>

        {errors.length > 0 && <JsonErrors errors={errors} hasValidVersion={Boolean(data)} />}

        {status === 'error' && (
          <section className="gm__errors" role="alert">
            <h2>Não foi possível ler o JSON</h2>
            <p>{error}. Confira a URL e a política de CORS do bucket.</p>
          </section>
        )}

        {campaignUrl && (
          <section className="gm__section">
            <h2>Convite</h2>
            <InviteBox campaignUrl={campaignUrl} />
          </section>
        )}

        {view && <HunterList hunters={view.hunters} />}
        {view && <MissionList missions={view.missions} date={view.date} />}
      </div>
    </main>
  )
}

const gmPage = css`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  .gm__top {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
    background-color: rgb(12 14 17 / 92%);
    border-bottom: 1px solid var(--linha);
    backdrop-filter: blur(8px);
  }

  .gm__brand {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.04em;
    display: flex;
    align-items: center;
    gap: 2px;

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

  .gm__body {
    padding: 20px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  h1 {
    font-size: 30px;
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .gm__section {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  h2 {
    font-size: 13px;
    font-weight: 600;
    color: var(--apagado);
    letter-spacing: 0;
    display: flex;
    gap: 6px;
  }

  .gm__errors {
    border: 1px solid rgb(255 107 107 / 40%);
    background-color: var(--perigo-fundo);
    border-radius: 16px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    h2 {
      color: var(--perigo);
      font-size: 15px;
    }

    p {
      font-size: 14px;
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
      font-family: var(--mono);
      color: var(--perigo);
    }
  }

  .invite {
    display: flex;
    gap: 8px;

    input {
      flex: 1;
      min-width: 0;
      padding: 10px 12px;
      border: 1px solid var(--linha);
      border-radius: 14px;
      background-color: var(--painel);
      color: var(--apagado);
      font-family: var(--mono);
      font-size: 12px;
    }
  }

  .gm__map {
    height: 220px;
    border-radius: 16px;
    border: 1px solid var(--linha);
    overflow: hidden;
  }

  .gm__list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--linha);

    li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid var(--linha);
    }
  }

  .gm__mission {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .gm__name {
    flex: 1;
    min-width: 0;
    font-size: 15px;
    font-weight: 600;
  }

  .gm__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 12px;
    color: var(--apagado);
  }

  .gm__scheduled {
    color: var(--aviso);
    font-weight: 600;
  }

  .gm__rating {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--apagado);

    svg {
      width: 13px;
      height: 13px;
      color: var(--aviso);
    }
  }

  .gm__value {
    font-size: 14px;
    white-space: nowrap;
  }
`
