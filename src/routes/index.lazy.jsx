/** @jsxImportSource @emotion/react */
import { useState } from 'react'
import { createLazyFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { Footer } from '../components/Footer'
import { CampaignClock } from '../components/CampaignClock'
import { DeadlineRing } from '../components/DeadlineRing'
import { MissionMap } from '../components/MissionMap'
import { RiskChip, StatusLabel } from '../components/MissionTags'
import { homeView } from '../campaign/missions'
import { hunterProfile } from '../campaign/hunters'
import { formatBRL } from '../utils/format'

export const Route = createLazyFileRoute('/')({
  component: Index,
})

function SelectedMission({ mission, hunterId, campaignDate }) {
  return (
    <div css={selectedStyle}>
      <div className="selected__row">
        <DeadlineRing mission={mission} campaignDate={campaignDate} />
        <div className="selected__text">
          <h2>{mission.name}</h2>
          <span className="selected__meta">
            {mission.location}{mission.nearHunters.includes(hunterId) && ' · perto de você'}
          </span>
          {mission.status !== 'available' && <StatusLabel status={mission.status} />}
        </div>
        <div className="selected__price">
          <b className="num">{formatBRL(mission.value)}</b>
          <RiskChip risk={mission.risk} />
        </div>
      </div>
      <Link className="button primary selected__cta" to="/mission/$missionId" params={{ missionId: mission.id }}>
        Ver caça <ArrowRightIcon aria-hidden="true" />
      </Link>
    </div>
  )
}

SelectedMission.propTypes = {
  mission: PropTypes.object.isRequired,
  hunterId: PropTypes.string.isRequired,
  campaignDate: PropTypes.string.isRequired,
}

const NO_FRESH = []

function Index() {
  const navigate = useNavigate()
  const { data, hunterId } = useSelector(state => state.campaign)
  const freshIds = useSelector(state => state.campaign.demo?.changes?.newMissionIds) ?? NO_FRESH
  const { open } = homeView(data, hunterId)
  const { earnings } = hunterProfile(data, hunterId)
  const [selectedId, setSelectedId] = useState(null)

  const selected = open.find(mission => mission.id === selectedId) ?? open[0] ?? null
  const others = open.filter(mission => mission !== selected)
  const onMap = open.filter(mission => mission.position)

  return (
    <main className="app-main" css={home}>
      <div className="home__stage">
        {onMap.length > 0 && (
          <MissionMap
            className="home__map"
            missions={onMap}
            selectedId={selected?.id}
            onSelect={setSelectedId}
            freshIds={freshIds}
          />
        )}
        <div className="home__top">
          <CampaignClock />
          <span className="home__earnings">
            <small>Seus ganhos</small>
            <b className="num">{formatBRL(earnings)}</b>
          </span>
        </div>
      </div>

      <section className="home__sheet" aria-label="Caças abertas">
        <span className="home__grip" aria-hidden="true" />
        {selected ? (
          <SelectedMission mission={selected} hunterId={hunterId} campaignDate={data.campaign.date} />
        ) : (
          <p className="home__empty">Nenhuma caça aberta agora. Quando o GM publicar uma, ela aparece aqui.</p>
        )}

        {others.length > 0 && (
          <ul className="home__list">
            {others.map(mission => (
              <li key={mission.id}>
                <button
                  type="button"
                  onClick={() => mission.position
                    ? setSelectedId(mission.id)
                    : navigate({ to: '/mission/$missionId', params: { missionId: mission.id } })}
                >
                  <span className="list__name">{mission.name}</span>
                  <StatusLabel status={mission.status} />
                  <b className="list__value num">{formatBRL(mission.value)}</b>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link className="home__all" to="/search">Ver todas as caças</Link>
      </section>
      <Footer active="home" />
    </main>
  )
}

const home = css`
  position: relative;

  .home__stage {
    flex: 1;
    min-height: 180px;
    position: relative;
    background:
      radial-gradient(circle at 70% 40%, rgb(255 107 26 / 8%), transparent 45%),
      #111419;
  }

  .home__map {
    position: absolute;
    inset: 0 0 -24px;
    z-index: 0;

    .leaflet-bottom {
      bottom: 32px;
    }
  }

  .home__top {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
    padding: calc(12px + env(safe-area-inset-top, 0px)) 14px 0;
    pointer-events: none;

    > * {
      pointer-events: auto;
      box-shadow: 0 8px 20px -8px rgb(0 0 0 / 60%);
    }
  }

  .home__earnings {
    display: flex;
    flex-direction: column;
    padding: 6px 12px;
    border-radius: 16px;
    background-color: rgb(21 24 29 / 92%);
    border: 1px solid var(--linha);

    small {
      font-size: 11px;
      color: var(--apagado);
      font-weight: 500;
    }

    b {
      font-size: 15px;
      white-space: nowrap;
    }
  }

  .home__sheet {
    position: relative;
    z-index: 3;
    max-height: 62%;
    overflow-y: auto;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 10px 18px 16px;
    background-color: var(--painel);
    border-top: 1px solid var(--linha);
    border-radius: 24px 24px 0 0;
    box-shadow: 0 -20px 40px -10px rgb(0 0 0 / 70%);
    animation: sheet-up 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes sheet-up {
    from { transform: translateY(40px); opacity: 0.4; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .home__sheet { animation: none; }
  }

  .home__grip {
    width: 36px;
    height: 4px;
    border-radius: 4px;
    background-color: var(--linha);
    align-self: center;
  }

  .home__empty {
    font-size: 14px;
    color: var(--apagado);
    padding: 8px 0;
  }

  .home__list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 1px solid var(--linha);

    li + li {
      border-top: 1px solid var(--linha);
    }

    button {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-radius: 0;
      background: none;
      color: var(--texto);
      font-size: 14px;
      font-weight: 500;
      text-align: left;
    }

    .list__name {
      flex: 1;
      min-width: 0;
    }

    .list__value {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      min-width: 92px;
      text-align: right;
    }

    button:hover .list__name {
      color: var(--laranja);
    }
  }

  .home__all {
    align-self: center;
    font-size: 13px;
    font-weight: 600;
    color: var(--apagado);
    text-underline-offset: 3px;
  }

  .home__all:hover {
    color: var(--texto);
  }
`

const selectedStyle = css`
  display: flex;
  flex-direction: column;
  gap: 14px;

  .selected__row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .selected__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  h2 {
    font-size: 18px;
    line-height: 1.15;
  }

  .selected__meta {
    font-size: 13px;
    color: var(--apagado);
  }

  .selected__price {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;

    b {
      font-size: 16px;
      white-space: nowrap;
    }
  }

  .selected__cta {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    height: 52px;
    font-size: 16px;
    font-weight: 700;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`
