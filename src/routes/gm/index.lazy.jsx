/** @jsxImportSource @emotion/react */
import { useEffect, useRef, useState } from 'react'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { CampaignClock } from '../../components/CampaignClock'
import { useDesktopWidth } from '../../components/useDesktopWidth'
import { Timeline } from '../../components/gm/Timeline'
import { HunterFilter, NpcList } from '../../components/gm/Roster'
import { InviteBox } from '../../components/gm/InviteBox'
import { CampaignProblems, SyncStatus } from '../../components/gm/CampaignHealth'
import { MapPanel } from '../../components/gm/MapPanel'
import { OpenCampaign } from '../../components/gm/OpenCampaign'
import { gmView } from '../../campaign/gm'

export const Route = createLazyFileRoute('/gm/')({
  component: GmPage,
})

function usePreviousDate(date) {
  const last = useRef(date)
  const [previous, setPrevious] = useState(null)

  useEffect(() => {
    if (date && last.current && last.current !== date) setPrevious(last.current)
    last.current = date
  }, [date])

  return previous
}

function prefersCalm() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true
}

function mapMissions(timeline) {
  return [...timeline.origin, ...timeline.past, ...timeline.upcoming]
    .filter(item => item.kind === 'mission' && item.mission.position)
    .map(({ mission, scheduled }) => (scheduled ? { ...mission, status: 'scheduled' } : mission))
}

function CampaignView({ data, desktop }) {
  const [hunterId, setHunterId] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [showEarlier, setShowEarlier] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [scrollTarget, setScrollTarget] = useState(null)
  const campaignUrl = useSelector(state => state.campaign.campaignUrl)
  const view = gmView(data, { hunterId })
  const freshSince = usePreviousDate(view.date)
  const hunterName = view.hunters.find(({ hunter }) => hunter.id === hunterId)?.hunter.name ?? null

  useEffect(() => {
    if (!scrollTarget) return
    document.getElementById(`gm-${scrollTarget}`)?.scrollIntoView({ block: 'center', behavior: prefersCalm() ? 'auto' : 'smooth' })
    setScrollTarget(null)
  }, [scrollTarget])

  const toggle = item => setOpenId(current => (current === item.id ? null : item.id))
  const selectPin = missionId => {
    setShowEarlier(true)
    setOpenId(`mission:${missionId}`)
    setScrollTarget(`mission:${missionId}`)
  }
  const selectedMission = openId?.startsWith('mission:') ? openId.slice('mission:'.length) : null
  const map = <MapPanel missions={mapMissions(view.timeline)} selectedId={selectedMission} onSelect={selectPin} />

  return (
    <div className="gm__layout">
      <aside className="gm__side">
        <div className="gm__head">
          <h1>{data.campaign.name}</h1>
          <SyncStatus />
          <HunterFilter hunters={view.hunters} selectedId={hunterId} onSelect={setHunterId} />
        </div>
        <div className="gm__extra">
          <NpcList npcs={view.npcs} />
          {campaignUrl && <InviteBox campaignUrl={campaignUrl} playable />}
          {!desktop && <p className="gm__note">Para editar a campanha, abra o Editor no computador.</p>}
        </div>
      </aside>

      {desktop
        ? <div className="gm__map">{map}</div>
        : (
          <div className="gm__map">
            <button type="button" className="button secondary gm__map-toggle" aria-expanded={showMap} onClick={() => setShowMap(shown => !shown)}>
              {showMap ? 'Esconder mapa' : 'Ver mapa'}
            </button>
            {showMap && map}
          </div>
        )}

      <div className="gm__feed">
        <CampaignProblems editable={desktop} />
        <div className="gm__feed-head">
          <h2>{hunterName ? `O que chega para ${hunterName}` : 'Linha do tempo'}</h2>
          {hunterName && <button type="button" className="gm__clear" onClick={() => setHunterId(null)}>Ver todos</button>}
        </div>
        <Timeline
          timeline={view.timeline}
          date={view.date}
          hunterName={hunterName}
          openId={openId}
          freshSince={freshSince}
          showEarlier={showEarlier}
          onShowEarlier={() => setShowEarlier(true)}
          onToggle={toggle}
        />
      </div>
    </div>
  )
}

CampaignView.propTypes = {
  data: PropTypes.shape({
    campaign: PropTypes.shape({ name: PropTypes.string.isRequired }).isRequired,
  }).isRequired,
  desktop: PropTypes.bool.isRequired,
}

function GmPage() {
  const { status, data, campaignUrl } = useSelector(state => state.campaign)
  const desktop = useDesktopWidth()

  return (
    <main className="gm-view" css={gmPage}>
      <div className="gm__top">
        <span className="gm__brand"><span>i</span>Hunt <b>GM</b></span>
        <span className="gm__actions">
          {data && <CampaignClock />}
          {desktop && <Link className="button secondary gm__edit" to="/gm/editor">Editar</Link>}
        </span>
      </div>

      {data && <CampaignView data={data} desktop={desktop} />}
      {!data && (
        <div className="gm__alone">
          {status !== 'no-campaign' && <h1>Visão do GM</h1>}
          <CampaignProblems editable={desktop} />
          {status === 'no-campaign' && <OpenCampaign editable={desktop} />}
          {status !== 'no-campaign' && campaignUrl && <InviteBox campaignUrl={campaignUrl} playable={false} />}
        </div>
      )}
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

  .gm__actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .gm__edit {
    padding: 7px 14px;
    font-size: 13px;
  }

  .gm__brand {
    font-size: 24px;
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

  .gm__alone {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 20px 16px 40px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .gm__layout {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 20px 16px 48px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .gm__side {
    display: contents;
  }

  .gm__head,
  .gm__extra {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .gm__head { order: 1; }
  .gm__map { order: 2; }
  .gm__feed { order: 3; }
  .gm__extra { order: 4; }

  h1 {
    font-size: 24px;
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  .gm__head h1 {
    margin-bottom: -10px;
  }

  .gm__note {
    font-size: 12px;
    color: var(--apagado);
  }

  .gm__map {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  .gm__map-toggle {
    align-self: flex-start;
    min-height: 40px;
    font-size: 13px;
  }

  .gm__map .map__map {
    flex: none;
    height: 260px;
  }

  .gm__feed {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .gm__feed-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12px;

    h2 {
      font-size: 18px;
      line-height: 1.15;
      letter-spacing: -0.02em;
    }
  }

  .gm__clear {
    padding: 4px 0;
    background: none;
    color: var(--laranja);
    font-size: 13px;
  }

  @media (min-width: 960px) {
    overflow: hidden;

    .gm__layout {
      flex: 1;
      min-height: 0;
      max-width: none;
      padding: 0;
      display: grid;
      grid-template-columns: 340px minmax(0, 1fr);
      grid-template-rows: 280px minmax(0, 1fr);
      grid-template-areas: 'side map' 'side feed';
      gap: 0;
    }

    .gm__side {
      grid-area: side;
      display: flex;
      flex-direction: column;
      gap: 28px;
      min-height: 0;
      overflow-y: auto;
      padding: 24px 20px 32px;
      border-right: 1px solid var(--linha);
    }

    .gm__map {
      grid-area: map;
      padding: 16px 24px 0;
    }

    .gm__map .map__map {
      flex: 1;
      height: auto;
      min-height: 0;
    }

    .gm__feed {
      grid-area: feed;
      overflow-y: auto;
      padding: 24px 24px 64px;
    }

    .gm__feed > * {
      width: 100%;
      max-width: 720px;
    }
  }

  @media (min-width: 1240px) {
    .gm__layout {
      grid-template-columns: 340px minmax(0, 1fr) minmax(360px, 32vw);
      grid-template-rows: minmax(0, 1fr);
      grid-template-areas: 'side feed map';
    }

    .gm__map {
      padding: 20px;
      border-left: 1px solid var(--linha);
    }

    .gm__feed {
      padding: 24px 32px 64px;
    }
  }
`
