/** @jsxImportSource @emotion/react */
import { useEffect, useRef, useState } from 'react'
import { createLazyFileRoute, Link } from '@tanstack/react-router'
import { useSelector } from 'react-redux'
import { css } from '@emotion/react'
import PropTypes from 'prop-types'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/16/solid'
import { CampaignClock } from '../../components/CampaignClock'
import { useDesktopWidth } from '../../components/useDesktopWidth'
import { Timeline } from '../../components/gm/Timeline'
import { HunterFilter, NpcList } from '../../components/gm/Roster'
import { InviteBox } from '../../components/gm/InviteBox'
import { CampaignProblems, SyncStatus } from '../../components/gm/CampaignHealth'
import { MapPanel } from '../../components/gm/MapPanel'
import { OpenCampaign } from '../../components/gm/OpenCampaign'
import { gmView } from '../../campaign/gm'
import { attempt, safeStorage } from '../../campaign/storage'

export const Route = createLazyFileRoute('/gm/')({
  component: GmPage,
})

const SEEN_DATE_KEY = 'ihunt.gm.seenDate'

function seenDates() {
  return safeStorage(attempt(() => window.localStorage))
}

function useLastSeenDate(date, campaignUrl) {
  const key = `${SEEN_DATE_KEY}:${campaignUrl ?? 'demo'}`
  const last = useRef(null)
  const [previous, setPrevious] = useState(() => {
    const seen = seenDates().get(key)
    return seen && seen !== date ? seen : null
  })

  useEffect(() => {
    if (last.current && last.current !== date) setPrevious(last.current)
    last.current = date
    seenDates().set(key, date)
  }, [date, key])

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

function useWideScreen() {
  const query = '(min-width: 1240px)'
  const [wide, setWide] = useState(() => window.matchMedia?.(query).matches ?? false)

  useEffect(() => {
    const list = window.matchMedia?.(query)
    if (!list) return undefined
    const onChange = () => setWide(list.matches)
    list.addEventListener('change', onChange)
    return () => list.removeEventListener('change', onChange)
  }, [])

  return wide
}

function nowPlacement() {
  const now = document.getElementById('gm-agora')?.getBoundingClientRect()
  if (!now) return 'visible'
  const top = document.querySelector('.gm__top')?.getBoundingClientRect().bottom ?? 0
  if (now.bottom < top) return 'above'
  if (now.top > window.innerHeight) return 'below'
  return 'visible'
}

function useNowPlacement(date) {
  const [placement, setPlacement] = useState('visible')

  useEffect(() => {
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => setPlacement(nowPlacement()))
    }
    measure()
    document.addEventListener('scroll', measure, { capture: true, passive: true })
    window.addEventListener('resize', measure)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', measure, { capture: true })
      window.removeEventListener('resize', measure)
    }
  }, [date])

  return placement
}

function goToNow(behavior) {
  document.getElementById('gm-agora')?.scrollIntoView?.({ block: 'center', behavior })
}

function JumpToNow({ date }) {
  const placement = useNowPlacement(date)
  if (placement === 'visible') return null

  const Arrow = placement === 'above' ? ArrowUpIcon : ArrowDownIcon
  return (
    <button type="button" className="gm__jump" onClick={() => goToNow(prefersCalm() ? 'auto' : 'smooth')}>
      <Arrow aria-hidden="true" />
      Ir para agora
    </button>
  )
}

JumpToNow.propTypes = {
  date: PropTypes.string.isRequired,
}

function CampaignView({ data, desktop }) {
  const [hunterId, setHunterId] = useState(null)
  const [openId, setOpenId] = useState(null)
  const [showEarlier, setShowEarlier] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [scrollTarget, setScrollTarget] = useState(null)
  const campaignUrl = useSelector(state => state.campaign.campaignUrl)
  const wide = useWideScreen()
  const view = gmView(data, { hunterId })
  const freshSince = useLastSeenDate(view.date, campaignUrl)
  const hunterName = view.hunters.find(({ hunter }) => hunter.id === hunterId)?.hunter.name ?? null

  useEffect(() => {
    if (desktop) goToNow('auto')
  }, [desktop, view.date])

  useEffect(() => {
    if (!scrollTarget) return
    document.getElementById(`gm-${scrollTarget}`)?.scrollIntoView?.({ block: 'center', behavior: prefersCalm() ? 'auto' : 'smooth' })
    setScrollTarget(null)
  }, [scrollTarget])

  const toggle = item => setOpenId(current => (current === item.id ? null : item.id))
  const selectPin = missionId => {
    setShowEarlier(true)
    setOpenId(`mission:${missionId}`)
    setScrollTarget(`mission:${missionId}`)
  }
  const selectedMission = openId?.startsWith('mission:') ? openId.slice('mission:'.length) : null
  const map = <MapPanel missions={mapMissions(view.timeline)} selectedId={selectedMission} onSelect={selectPin} editable={desktop} />
  const extra = (
    <>
      <NpcList npcs={view.npcs} />
      {campaignUrl && <InviteBox campaignUrl={campaignUrl} playable />}
    </>
  )

  return (
    <div className="gm__layout">
      <aside className="gm__side">
        <div className="gm__title">
          <h1>{data.campaign.name}</h1>
          <SyncStatus />
        </div>
        <HunterFilter hunters={view.hunters} selectedId={hunterId} onSelect={setHunterId} compact={!desktop} />
        {desktop && extra}
      </aside>

      <div className="gm__feed">
        <CampaignProblems editable={desktop} />
        <div className="gm__feed-head">
          <h2>{hunterName ? `O que chega para ${hunterName}` : 'Linha do tempo'}</h2>
          {hunterName && <button type="button" className="gm__clear" onClick={() => setHunterId(null)}>Ver todos</button>}
        </div>
        {!wide && (
          <div className="gm__map gm__map--inline">
            <button type="button" className="button secondary gm__map-toggle" aria-expanded={showMap} onClick={() => setShowMap(shown => !shown)}>
              {showMap ? 'Esconder mapa' : 'Ver mapa'}
            </button>
            {showMap && map}
          </div>
        )}
        <Timeline
          timeline={view.timeline}
          date={view.date}
          hunterName={hunterName}
          openId={openId}
          freshSince={freshSince}
          showEarlier={showEarlier}
          onShowEarlier={() => setShowEarlier(true)}
          onToggle={toggle}
          editable={desktop}
        />
        <JumpToNow date={view.date} />
      </div>

      {wide && <div className="gm__map">{map}</div>}

      {!desktop && (
        <div className="gm__extra">
          {extra}
          <p className="gm__note">Para editar a campanha, abra o Editor no computador.</p>
        </div>
      )}
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
    gap: 32px;
  }

  .gm__side,
  .gm__extra {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .gm__title {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  h1 {
    font-size: 24px;
    line-height: 1.1;
    letter-spacing: -0.03em;
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

  .gm__map--inline .map__map {
    flex: none;
    height: clamp(220px, 34vh, 320px);
  }

  .gm__feed {
    position: relative;
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

  .gm__jump {
    position: sticky;
    bottom: 16px;
    z-index: 2;
    align-self: center;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 999px;
    background-color: var(--laranja);
    color: #120700;
    font-size: 13px;
    box-shadow: 0 0 0 4px var(--asfalto);

    svg {
      width: 14px;
      height: 14px;
    }
  }

  .gm__jump:hover {
    background-color: var(--laranja-forte);
  }

  @media (pointer: coarse) {
    .gm__clear,
    .gm__map-toggle,
    .gm__jump,
    .health__refresh,
    .timeline__earlier {
      min-height: 44px;
    }
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
      grid-template-rows: minmax(0, 1fr);
      gap: 0;
    }

    .gm__side {
      min-height: 0;
      overflow-y: auto;
      padding: 24px 20px 32px;
      border-right: 1px solid var(--linha);
    }

    .gm__feed {
      overflow-y: auto;
      padding: 24px 32px 24px;
    }

    .gm__feed > * {
      flex-shrink: 0;
      width: 100%;
      max-width: 720px;
    }

    .gm__feed > .gm__jump {
      width: auto;
    }

    .gm__feed > section:last-of-type {
      padding-bottom: 40vh;
    }
  }

  @media (min-width: 1240px) {
    .gm__layout {
      grid-template-columns: 340px minmax(0, 1fr) minmax(360px, 32vw);
    }

    .gm__map {
      padding: 20px;
      border-left: 1px solid var(--linha);
    }
  }
`
